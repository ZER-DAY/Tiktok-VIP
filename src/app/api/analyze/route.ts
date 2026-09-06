import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAnalyzeQueue } from "@/workers/queue";
import { isAnalysisDataCurrent } from "@/workers/analysis-data";
import { prisma } from "@/lib/prisma";
import {
  attachGuestAnalysisCookie,
  releaseAnalysisQuota,
  reserveAnalysisQuota,
} from "@/modules/billing/analysis-quota";

const analyzeSchema = z.object({
  provider: z.string().default("tiktok"),
  username: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9._]+$/, "Invalid username format"),
  requestId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = analyzeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input. Please check your username.",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { provider, username } = parsed.data;
    const cleanUsername = username.replace(/^@/, "").trim();
    const requestId = parsed.data.requestId ?? randomUUID();
    const reservation = await reserveAnalysisQuota({
      request,
      requestId,
      provider,
      username: cleanUsername,
    });

    if (!reservation.allowed) {
      const response = NextResponse.json(
        {
          success: false,
          error: {
            code:
              reservation.reason === "REQUEST_ID_CONFLICT"
                ? "REQUEST_ID_CONFLICT"
                : "SUBSCRIPTION_REQUIRED",
            message:
              reservation.reason === "REQUEST_ID_CONFLICT"
                ? "This analysis request is no longer valid. Please try again."
                : "Your analysis allowance has been used. Choose a subscription to continue.",
            details: {
              planName: reservation.planName,
              used: reservation.used,
              limit: reservation.limit,
              remaining: reservation.remaining,
            },
          },
        },
        { status: reservation.reason === "REQUEST_ID_CONFLICT" ? 409 : 402 }
      );
      return attachGuestAnalysisCookie(response, reservation);
    }

    try {
      // Check for existing recent report
      const dbProvider = await prisma.provider.findUnique({
        where: { key: provider },
      });

      if (dbProvider) {
        const existing = await prisma.analyzedAccount.findUnique({
          where: {
            providerId_externalUsername: {
              providerId: dbProvider.id,
              externalUsername: cleanUsername,
            },
          },
          include: {
            snapshots: {
              orderBy: { capturedAt: "desc" },
              take: 1,
              include: { analysisReport: true },
            },
          },
        });

        if (existing && existing.snapshots.length > 0) {
          const snapshot = existing.snapshots[0];
          const hoursSince = (Date.now() - snapshot.capturedAt.getTime()) / (1000 * 60 * 60);

          if (
            hoursSince < 6 &&
            snapshot.analysisReport &&
            isAnalysisDataCurrent(snapshot.rawPayload)
          ) {
            const response = NextResponse.json({
              success: true,
              data: {
                reportId: snapshot.analysisReport.id,
                status: "ready",
                quota: {
                  used: reservation.used,
                  limit: reservation.limit,
                  remaining: reservation.remaining,
                },
              },
            });
            return attachGuestAnalysisCookie(response, reservation);
          }
        }
      }

      // Add job to queue. requestId also makes React development retries idempotent.
      const job = await getAnalyzeQueue().add(
        "analyze",
        {
          username: cleanUsername,
          provider,
          userId: reservation.userId ?? undefined,
        },
        {
          jobId: requestId,
          priority: 1,
        }
      );

      const response = NextResponse.json(
        {
          success: true,
          data: {
            jobId: job.id,
            status: "queued",
            quota: {
              used: reservation.used,
              limit: reservation.limit,
              remaining: reservation.remaining,
            },
          },
        },
        { status: 202 }
      );
      return attachGuestAnalysisCookie(response, reservation);
    } catch (error) {
      if (reservation.isNewReservation) {
        await releaseAnalysisQuota(requestId).catch((releaseError) => {
          console.error("Analyze quota rollback error:", releaseError);
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
