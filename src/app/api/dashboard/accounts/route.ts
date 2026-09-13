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

    const accounts = await prisma.analyzedAccount.findMany({
      where: {
        OR: [{ ownerId: user.id }, { trackedByUserId: user.id }],
      },
      include: {
        provider: true,
        snapshots: {
          include: {
            analysisReport: true,
          },
          orderBy: { capturedAt: "desc" },
          take: 2,
        },
      },
      orderBy: { lastAnalyzedAt: "desc" },
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

      // The compare page reads followers/avgViews/engagementRate/
      // postingConsistency off these rows. They come from the snapshot and
      // report that are already loaded above, so returning them costs no
      // extra query — and leaving them out crashed the page on first render.
      return {
        id: account.id,
        username: account.externalUsername,
        lastScore: latestReport?.accountStrengthScore ?? 0,
        lastAnalysisDate: account.lastAnalyzedAt.toISOString(),
        trend,
        provider: account.provider.displayName,
        followers: latestSnapshot?.followers ?? 0,
        avgViews: latestSnapshot?.avgViews ?? null,
        engagementRate: latestReport?.engagementQualityScore ?? null,
        postingConsistency: latestReport?.postingConsistencyScore ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      data: { accounts: formattedAccounts },
    });
  } catch (error) {
    console.error("[ACCOUNTS]", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch accounts" } },
      { status: 500 }
    );
  }
}
