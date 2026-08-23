import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth";
import { prisma } from "@/lib/prisma";

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
          bioLanguageGuess: snapshot.bioLanguageGuess,
          accountCreatedAtGuess: snapshot.accountCreatedAtGuess?.toISOString() || null,
          isEstimated: {
            country:
              snapshot.countryGuessConfidence !== null && snapshot.countryGuessConfidence < 0.8,
            createdAt: snapshot.accountCreatedAtGuess !== null,
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
