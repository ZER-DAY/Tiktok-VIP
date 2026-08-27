import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth";
import { prisma } from "@/lib/prisma";
import { getStoredCreatorLeague } from "@/modules/providers/tiktok/live-league";
import { getStoredLiveAccountLevel } from "@/modules/providers/tiktok/live-account-level";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const { id } = await params;

    const account = await prisma.analyzedAccount.findFirst({
      where: {
        id,
        OR: [{ ownerId: user.id }, { trackedByUserId: user.id }],
      },
      include: {
        provider: true,
        snapshots: {
          include: {
            analysisReport: {
              include: {
                insights: true,
              },
            },
          },
          orderBy: { capturedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!account || !account.snapshots[0]?.analysisReport) {
      return NextResponse.json(
        { success: false, error: { message: "Account not found" } },
        { status: 404 }
      );
    }

    const snapshot = account.snapshots[0];
    const report = snapshot.analysisReport!;
    const rawPayload = snapshot.rawPayload as Record<string, unknown>;
    const rawProfile =
      rawPayload.profile && typeof rawPayload.profile === "object"
        ? (rawPayload.profile as Record<string, unknown>)
        : null;
    const creatorLeague = getStoredCreatorLeague(rawPayload);
    const liveAccountLevel = getStoredLiveAccountLevel(rawPayload);

    return NextResponse.json({
      success: true,
      data: {
        reportId: report.id,
        account: {
          username: account.externalUsername,
          provider: account.provider.displayName,
          isVerified: snapshot.isVerified,
          accountType: snapshot.accountType,
          countryGuess: snapshot.countryGuess,
          countryGuessConfidence: snapshot.countryGuessConfidence,
          countryRegionCode: snapshot.countryRegionCode,
          countryGuessSource: snapshot.countryGuessSource,
          bioLanguageGuess: snapshot.bioLanguageGuess,
          accountCreatedAtGuess: snapshot.accountCreatedAtGuess?.toISOString() || null,
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
              rawProfile?.accountCreatedAtSource !== "profile_create_time",
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
    console.error("[ACCOUNT REPORT]", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch account report" } },
      { status: 500 }
    );
  }
}
