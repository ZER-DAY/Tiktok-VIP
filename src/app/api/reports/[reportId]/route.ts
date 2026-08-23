import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

    return NextResponse.json({
      success: true,
      data: {
        reportId: report.id,
        account: {
          username: account.externalUsername,
          provider: account.provider.key,
          isVerified: snapshot.isVerified,
          accountType: snapshot.accountType,
          countryGuess: snapshot.countryGuess,
          countryGuessConfidence: snapshot.countryGuessConfidence,
          bioLanguageGuess: snapshot.bioLanguageGuess,
          accountCreatedAtGuess: snapshot.accountCreatedAtGuess,
          isEstimated: {
            country: snapshot.countryGuess !== null,
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
