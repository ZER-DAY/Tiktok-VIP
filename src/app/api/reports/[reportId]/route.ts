import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStoredCreatorLeague } from "@/modules/providers/tiktok/live-league";
import { getStoredLiveAccountLevel } from "@/modules/providers/tiktok/live-account-level";
import { getStoredProfileDisplayName } from "@/modules/providers/stored-profile";

function getSafeAvatarUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const isTikTokCdn =
      /(^|\.)tiktokcdn(?:-[a-z0-9]+)?\.com$/.test(hostname) ||
      /(^|\.)(?:ibytedtos|byteoversea)\.com$/.test(hostname);
    return url.protocol === "https:" && isTikTokCdn ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params;

    const report = await prisma.analysisReport.findUnique({
      where: { id: reportId },
      include: {
        snapshot: {
          include: {
            account: {
              include: {
                provider: true,
              },
            },
          },
        },
        insights: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Report not found",
          },
        },
        { status: 404 }
      );
    }

    const snapshot = report.snapshot;
    const account = snapshot.account;
    const rawPayload = snapshot.rawPayload as Record<string, unknown>;
    const rawProfile =
      rawPayload.profile && typeof rawPayload.profile === "object"
        ? (rawPayload.profile as Record<string, unknown>)
        : null;
    const avatarUrl = getSafeAvatarUrl(rawProfile?.avatarUrl);
    const accountCreatedAtSource = rawProfile?.accountCreatedAtSource;
    const creatorLeague = getStoredCreatorLeague(rawPayload);
    const liveAccountLevel = getStoredLiveAccountLevel(rawPayload);
    const displayName = getStoredProfileDisplayName(rawPayload);

    return NextResponse.json({
      success: true,
      data: {
        reportId: report.id,
        account: {
          username: account.externalUsername,
          displayName,
          avatarUrl,
          provider: account.provider.key,
          isVerified: snapshot.isVerified,
          accountType: snapshot.accountType,
          countryGuess: snapshot.countryGuess,
          countryGuessConfidence: snapshot.countryGuessConfidence,
          countryRegionCode: snapshot.countryRegionCode,
          countryGuessSource: snapshot.countryGuessSource,
          bioLanguageGuess: snapshot.bioLanguageGuess,
          accountCreatedAtGuess: snapshot.accountCreatedAtGuess,
          liveCreatorLeague: creatorLeague?.league ?? null,
          liveCreatorLeagueClassType: creatorLeague?.classType ?? null,
          liveCreatorLeagueSource: creatorLeague?.source ?? null,
          liveAccountLevel: liveAccountLevel?.level ?? null,
          liveAccountLevelSource: liveAccountLevel?.source ?? null,
          isEstimated: {
            country:
              snapshot.countryGuess !== null &&
              snapshot.countryGuessSource !== "region_code" &&
              snapshot.countryGuessSource !== "location_created",
            createdAt:
              snapshot.accountCreatedAtGuess !== null &&
              accountCreatedAtSource !== "profile_create_time",
          },
        },
        statistics: {
          followers: snapshot.followers,
          following: snapshot.following,
          totalLikes: Number(snapshot.totalLikes),
          videoCount: snapshot.videoCount,
          avgViews: snapshot.avgViews,
          avgLikes: snapshot.avgLikes,
          avgComments: snapshot.avgComments,
          avgShares: snapshot.avgShares,
        },
        scores: {
          accountStrength: report.accountStrengthScore,
          contentQuality: report.contentQualityScore,
          engagementQuality: report.engagementQualityScore,
          postingConsistency: report.postingConsistencyScore,
          explorePotential: report.explorePotentialPercent,
          livePotential: report.livePotentialScore,
          professionalism: report.professionalismScore,
          growthRate: report.growthRatePercent,
          breakdown: report.scoreBreakdown,
        },
        insights: report.insights.map((insight) => ({
          type: insight.type,
          title: insight.title,
          description: insight.description,
          evidenceRef: insight.evidenceRef,
        })),
        generatedAt: report.generatedAt.toISOString(),
        capturedAt: snapshot.capturedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Report fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch report",
        },
      },
      { status: 500 }
    );
  }
}
