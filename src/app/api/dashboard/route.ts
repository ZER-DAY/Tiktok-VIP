import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    // Get user's accounts with latest snapshot
    const accounts = await prisma.analyzedAccount.findMany({
      where: {
        OR: [{ ownerId: user.id }, { trackedByUserId: user.id }],
      },
      include: {
        snapshots: {
          include: {
            analysisReport: true,
          },
          orderBy: { capturedAt: "desc" },
          take: 2,
        },
      },
      orderBy: { lastAnalyzedAt: "desc" },
      take: 10,
    });

    const formattedAccounts = accounts.map((account) => {
      const latestSnapshot = account.snapshots[0];
      const previousSnapshot = account.snapshots[1];
      const latestReport = latestSnapshot?.analysisReport;
      const previousReport = previousSnapshot?.analysisReport;

      let trend: "up" | "down" | "stable" = "stable";
      if (latestReport && previousReport) {
        if (latestReport.accountStrengthScore > previousReport.accountStrengthScore) {
          trend = "up";
        } else if (latestReport.accountStrengthScore < previousReport.accountStrengthScore) {
          trend = "down";
        }
      }

      return {
        id: account.id,
        username: account.externalUsername,
        lastScore: latestReport?.accountStrengthScore || 0,
        lastAnalysisDate: account.lastAnalyzedAt.toISOString(),
        trend,
      };
    });

    // Get recent insights
    const recentReports = await prisma.analysisReport.findMany({
      where: {
        snapshot: {
          account: {
            OR: [{ ownerId: user.id }, { trackedByUserId: user.id }],
          },
        },
      },
      include: {
        insights: {
          where: { type: "recommendation" },
          take: 3,
        },
      },
      orderBy: { generatedAt: "desc" },
      take: 5,
    });

    const recentInsights = recentReports
      .flatMap((report) => report.insights)
      .slice(0, 3)
      .map((insight) => ({
        id: insight.id,
        title: insight.title,
        description: insight.description,
        type: insight.type,
      }));

    // Get subscription info
    const subscription = await prisma.subscription.findFirst({
      where: { userId: user.id, status: "active" },
      include: { plan: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        accounts: formattedAccounts,
        recentInsights,
        subscription: subscription
          ? {
              planName: subscription.plan.name,
              reportsUsed: 0,
              reportsLimit: subscription.plan.reportsPerDay || 0,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("[DASHBOARD]", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch dashboard" } },
      { status: 500 }
    );
  }
}
