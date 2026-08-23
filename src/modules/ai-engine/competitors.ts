import { prisma } from "@/lib/prisma";

export interface CompetitorResult {
  username: string;
  followers: number;
  accountStrength: number;
  percentile: number;
}

export async function findCompetitors(
  currentUsername: string,
  currentFollowers: number
): Promise<CompetitorResult[]> {
  const minFollowers = Math.floor(currentFollowers * 0.6);
  const maxFollowers = Math.floor(currentFollowers * 1.4);

  const recentSnapshots = await prisma.accountSnapshot.findMany({
    where: {
      account: {
        externalUsername: { not: currentUsername },
      },
      followers: { gte: minFollowers, lte: maxFollowers },
    },
    include: {
      account: true,
      analysisReport: true,
    },
    orderBy: { capturedAt: "desc" },
    take: 50,
  });

  const seen = new Set<string>();
  const uniqueSnapshots = recentSnapshots.filter((s) => {
    if (seen.has(s.accountId)) return false;
    seen.add(s.accountId);
    return true;
  });

  if (uniqueSnapshots.length === 0) {
    return [];
  }

  const allScores = uniqueSnapshots
    .map((s) => s.analysisReport?.accountStrengthScore ?? 0)
    .filter((s) => s > 0);

  const competitors: CompetitorResult[] = uniqueSnapshots
    .filter((s) => s.analysisReport)
    .map((s) => {
      const score = s.analysisReport!.accountStrengthScore;
      const belowCount = allScores.filter((sc) => sc < score).length;
      const percentile =
        allScores.length > 0 ? Math.round((belowCount / allScores.length) * 100) : 50;

      return {
        username: s.account.externalUsername,
        followers: s.followers,
        accountStrength: score,
        percentile,
      };
    })
    .sort((a, b) => b.accountStrength - a.accountStrength)
    .slice(0, 5);

  return competitors;
}
