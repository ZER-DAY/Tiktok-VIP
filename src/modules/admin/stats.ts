import { prisma } from "@/lib/prisma";

export async function getPlatformStats() {
  const [
    totalUsers,
    newUsersThisMonth,
    totalReports,
    reportsThisMonth,
    totalApplications,
    applicationsByStatus,
    recentReports,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({
      where: {
        deletedAt: null,
        createdAt: { gte: new Date(new Date().setDate(1)) },
      },
    }),
    prisma.analysisReport.count(),
    prisma.analysisReport.count({
      where: {
        generatedAt: { gte: new Date(new Date().setDate(1)) },
      },
    }),
    prisma.agencyApplication.count(),
    prisma.agencyApplication.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.analysisReport.findMany({
      orderBy: { generatedAt: "desc" },
      take: 5,
      include: {
        snapshot: {
          include: {
            account: true,
          },
        },
      },
    }),
  ]);

  const funnel = applicationsByStatus.reduce(
    (acc, item) => {
      acc[item.status] = item._count;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    users: {
      total: totalUsers,
      newThisMonth: newUsersThisMonth,
    },
    reports: {
      total: totalReports,
      thisMonth: reportsThisMonth,
    },
    applications: {
      total: totalApplications,
      funnel: {
        new: funnel["new"] || 0,
        reviewed: funnel["reviewed"] || 0,
        contacted: funnel["contacted"] || 0,
        joined: funnel["joined"] || 0,
        rejected: funnel["rejected"] || 0,
      },
    },
    recentReports: recentReports.map((r) => ({
      id: r.id,
      username: r.snapshot.account.externalUsername,
      score: r.accountStrengthScore,
      generatedAt: r.generatedAt.toISOString(),
    })),
  };
}
