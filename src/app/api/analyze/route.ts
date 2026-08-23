import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { analyzeQueue } from "@/workers/queue";
import { prisma } from "@/lib/prisma";

const analyzeSchema = z.object({
  provider: z.string().default("tiktok"),
  username: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9._]+$/, "Invalid username format"),
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

        if (hoursSince < 6 && snapshot.analysisReport) {
          return NextResponse.json({
            success: true,
            data: {
              reportId: snapshot.analysisReport.id,
              status: "ready",
            },
          });
        }
      }
    }

    // Add job to queue
    const job = await analyzeQueue.add(
      "analyze",
      {
        username: cleanUsername,
        provider,
      },
      {
        priority: 1,
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          jobId: job.id,
          status: "queued",
        },
      },
      { status: 202 }
    );
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
