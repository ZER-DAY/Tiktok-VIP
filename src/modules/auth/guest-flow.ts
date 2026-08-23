import { prisma } from "@/lib/prisma";

/**
 * Guest Flow: Link a guest report to a user account
 * This allows users to analyze a report as a guest and then link it to their account when they register
 */
export async function linkGuestReportToUser(
  userId: string,
  reportId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Find the report
    const report = await prisma.analysisReport.findUnique({
      where: { id: reportId },
      include: {
        snapshot: {
          include: {
            account: true,
          },
        },
      },
    });

    if (!report) {
      return { success: false, message: "Report not found" };
    }

    const account = report.snapshot.account;

    // Check if the account already has an owner
    if (account.ownerId) {
      // If the owner is the same user, no action needed
      if (account.ownerId === userId) {
        return { success: true, message: "Report already linked to your account" };
      }
      // If owned by someone else, link as tracked account
      await prisma.analyzedAccount.update({
        where: { id: account.id },
        data: { trackedByUserId: userId },
      });
      return { success: true, message: "Account added to your tracked accounts" };
    }

    // Link the account to the user as owner
    await prisma.analyzedAccount.update({
      where: { id: account.id },
      data: { ownerId: userId },
    });

    return { success: true, message: "Report linked to your account successfully" };
  } catch (error) {
    console.error("[LINK GUEST REPORT]", error);
    return { success: false, message: "Failed to link report" };
  }
}

/**
 * Get guest reports from a specific IP or session
 * This is used to show guest reports before login
 */
export async function getGuestReports() {
  try {
    // For now, we'll use a simple approach where guest reports are stored
    // with a special ownerId pattern like "guest:{identifier}"
    // In production, this would use a proper guest session table

    const guestAccounts = await prisma.analyzedAccount.findMany({
      where: {
        ownerId: null,
        trackedByUserId: null,
      },
      include: {
        snapshots: {
          include: {
            analysisReport: true,
          },
          orderBy: { capturedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { lastAnalyzedAt: "desc" },
      take: 10,
    });

    return guestAccounts.filter((account) => {
      const latestSnapshot = account.snapshots[0];
      return latestSnapshot?.analysisReport;
    });
  } catch (error) {
    console.error("[GET GUEST REPORTS]", error);
    return [];
  }
}
