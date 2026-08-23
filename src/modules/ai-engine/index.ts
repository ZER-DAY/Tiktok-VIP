import { prisma } from "@/lib/prisma";
import {
  calculateEngagementQuality,
  calculateContentQuality,
  calculatePostingConsistency,
  calculateExplorePotential,
  calculateLivePotential,
  calculateProfessionalism,
  calculateAccountStrength,
  calculateGrowthRate,
  type SnapshotInput,
} from "./scores";
import { generateInsights } from "./rules";
import { analyzeAudience } from "./audience";
import { findCompetitors } from "./competitors";

export async function generateAnalysisReport(snapshotId: string) {
  const snapshot = await prisma.accountSnapshot.findUnique({
    where: { id: snapshotId },
    include: {
      account: {
        include: {
          snapshots: {
            orderBy: { capturedAt: "desc" },
            take: 2,
          },
        },
      },
    },
  });

  if (!snapshot) throw new Error(`Snapshot ${snapshotId} not found`);

  const snapshotInput: SnapshotInput = {
    followers: snapshot.followers,
    following: snapshot.following,
    totalLikes: Number(snapshot.totalLikes),
    videoCount: snapshot.videoCount,
    avgViews: snapshot.avgViews,
    avgLikes: snapshot.avgLikes,
    avgComments: snapshot.avgComments,
    avgShares: snapshot.avgShares,
    isVerified: snapshot.isVerified,
    accountType: snapshot.accountType,
    bioLanguageGuess: snapshot.bioLanguageGuess,
    countryGuess: snapshot.countryGuess,
    countryGuessConfidence: snapshot.countryGuessConfidence,
    rawPayload: snapshot.rawPayload as Record<string, unknown>,
  };

  const rawPayload = snapshot.rawPayload as Record<string, unknown>;
  const content = (rawPayload.content ?? []) as Array<{
    views: number;
    likes: number;
    comments: number;
    shares: number;
    description: string;
    hashtags: string[];
    createdAt: string;
    duration: number;
  }>;

  const engagementResult = calculateEngagementQuality(snapshotInput);
  const contentResult = calculateContentQuality(snapshotInput, content);
  const consistencyResult = calculatePostingConsistency(content);
  const exploreResult = calculateExplorePotential(snapshotInput, content);
  const liveResult = calculateLivePotential(snapshotInput);
  const professionalismResult = calculateProfessionalism(snapshotInput);

  let growthResult = null;
  const snapshots = snapshot.account.snapshots;
  if (snapshots.length >= 2) {
    const previousSnapshot = snapshots[1];
    const previousInput: SnapshotInput = {
      followers: previousSnapshot.followers,
      following: previousSnapshot.following,
      totalLikes: Number(previousSnapshot.totalLikes),
      videoCount: previousSnapshot.videoCount,
      avgViews: previousSnapshot.avgViews,
      avgLikes: previousSnapshot.avgLikes,
      avgComments: previousSnapshot.avgComments,
      avgShares: previousSnapshot.avgShares,
      isVerified: previousSnapshot.isVerified,
      accountType: previousSnapshot.accountType,
      bioLanguageGuess: previousSnapshot.bioLanguageGuess,
      countryGuess: previousSnapshot.countryGuess,
      countryGuessConfidence: previousSnapshot.countryGuessConfidence,
      rawPayload: previousSnapshot.rawPayload as Record<string, unknown>,
    };
    growthResult = calculateGrowthRate(snapshotInput, previousInput);
  }

  const strengthResult = calculateAccountStrength(
    engagementResult.score,
    contentResult.score,
    consistencyResult.score,
    growthResult?.score ?? null,
    liveResult.score
  );

  const engagementRate =
    snapshot.avgViews && snapshot.avgViews > 0
      ? (((snapshot.avgLikes ?? 0) + (snapshot.avgComments ?? 0) + (snapshot.avgShares ?? 0)) /
          snapshot.avgViews) *
        100
      : 0;

  const viewsToFollowers =
    snapshot.followers > 0 ? ((snapshot.avgViews ?? 0) / snapshot.followers) * 100 : 0;

  const insights = generateInsights(snapshotInput, engagementRate, viewsToFollowers);

  const audience = analyzeAudience(snapshotInput, content);

  const competitors = await findCompetitors(snapshot.account.externalUsername, snapshot.followers);

  const competitorInsights = competitors.map((c, i) => ({
    type: "competitor" as const,
    title: `منافس مقترح: @${c.username}`,
    description: `حساب مشابه بـ ${c.followers.toLocaleString()} متابع ودرجة قوة ${c.accountStrength}/100`,
    evidenceRef: {
      username: c.username,
      followers: c.followers,
      accountStrength: c.accountStrength,
      percentile: c.percentile,
    },
    order: 30 + i,
  }));

  const allInsights = [
    ...insights,
    ...competitorInsights,
    ...(audience.countryConfidence >= 0.4 && audience.countryGuess
      ? [
          {
            type: "audience" as const,
            title: "الدولة المستهدفة",
            description: `يُقدر أن جمهورك الرئيسي من ${audience.countryGuess}`,
            evidenceRef: {
              country: audience.countryGuess,
              confidence: audience.countryConfidence,
              evidenceCount: audience.countryEvidenceCount,
              analyzedVideos: audience.analyzedVideos,
              isEstimated: true,
            },
            order: 25,
          },
        ]
      : []),
  ];

  const existingReport = await prisma.analysisReport.findUnique({
    where: { snapshotId },
  });

  let report;
  if (existingReport) {
    report = await prisma.analysisReport.update({
      where: { snapshotId },
      data: {
        accountStrengthScore: strengthResult.score,
        contentQualityScore: contentResult.score,
        engagementQualityScore: engagementResult.score,
        postingConsistencyScore: consistencyResult.score,
        explorePotentialPercent: exploreResult.score,
        livePotentialScore: liveResult.score,
        professionalismScore: professionalismResult.score,
        growthRatePercent: growthResult?.score
          ? Number((((growthResult.score - 50) / 50) * 100).toFixed(1))
          : null,
        scoreBreakdown: JSON.parse(
          JSON.stringify({
            engagement: engagementResult.breakdown,
            content: contentResult.breakdown,
            consistency: consistencyResult.breakdown,
            explore: exploreResult.breakdown,
            live: liveResult.breakdown,
            professionalism: professionalismResult.breakdown,
            strength: strengthResult.breakdown,
            growth: growthResult?.breakdown ?? null,
          })
        ),
        generatedAt: new Date(),
      },
    });

    await prisma.reportInsight.deleteMany({ where: { reportId: report.id } });
  } else {
    report = await prisma.analysisReport.create({
      data: {
        snapshotId,
        accountStrengthScore: strengthResult.score,
        contentQualityScore: contentResult.score,
        engagementQualityScore: engagementResult.score,
        postingConsistencyScore: consistencyResult.score,
        explorePotentialPercent: exploreResult.score,
        livePotentialScore: liveResult.score,
        professionalismScore: professionalismResult.score,
        growthRatePercent: growthResult?.score
          ? Number((((growthResult.score - 50) / 50) * 100).toFixed(1))
          : null,
        scoreBreakdown: JSON.parse(
          JSON.stringify({
            engagement: engagementResult.breakdown,
            content: contentResult.breakdown,
            consistency: consistencyResult.breakdown,
            explore: exploreResult.breakdown,
            live: liveResult.breakdown,
            professionalism: professionalismResult.breakdown,
            strength: strengthResult.breakdown,
            growth: growthResult?.breakdown ?? null,
          })
        ),
      },
    });
  }

  if (allInsights.length > 0) {
    await prisma.reportInsight.createMany({
      data: allInsights.map((insight) => ({
        reportId: report.id,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        evidenceRef: JSON.parse(JSON.stringify(insight.evidenceRef)),
        order: insight.order,
      })),
    });
  }

  if (audience.countryGuess && audience.countryConfidence >= 0.4) {
    await prisma.accountSnapshot.update({
      where: { id: snapshotId },
      data: {
        countryGuess: audience.countryGuess,
        countryGuessConfidence: audience.countryConfidence,
      },
    });
  }

  return {
    reportId: report.id,
    accountStrength: strengthResult.score,
    insightsCount: allInsights.length,
  };
}
