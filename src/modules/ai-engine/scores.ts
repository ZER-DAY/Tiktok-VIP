import { getEngagementBenchmark } from "./benchmarks";

export interface SnapshotInput {
  followers: number;
  following: number;
  totalLikes: number;
  videoCount: number;
  avgViews: number | null;
  avgLikes: number | null;
  avgComments: number | null;
  avgShares: number | null;
  isVerified: boolean;
  accountType: string;
  bioLanguageGuess: string | null;
  countryGuess: string | null;
  countryGuessConfidence: number | null;
  rawPayload: Record<string, unknown>;
}

export interface ScoreResult {
  score: number;
  breakdown: Record<string, unknown>;
}

// ─── Engagement Quality Score ─────────────────────────────

export function calculateEngagementQuality(snapshot: SnapshotInput): ScoreResult {
  const { avgViews, avgLikes, avgComments, avgShares, followers } = snapshot;

  if (!avgViews || avgViews === 0) {
    return { score: 0, breakdown: { reason: "No view data available" } };
  }

  const totalEngagement = (avgLikes ?? 0) + (avgComments ?? 0) + (avgShares ?? 0);
  const engagementRate = (totalEngagement / avgViews) * 100;

  const benchmark = getEngagementBenchmark(followers);

  let score: number;
  if (engagementRate >= benchmark.excellent) {
    score = 90 + Math.min(10, ((engagementRate - benchmark.excellent) / benchmark.excellent) * 10);
  } else if (engagementRate >= benchmark.good) {
    score = 70 + ((engagementRate - benchmark.good) / (benchmark.excellent - benchmark.good)) * 20;
  } else if (engagementRate >= benchmark.average) {
    score = 50 + ((engagementRate - benchmark.average) / (benchmark.good - benchmark.average)) * 20;
  } else if (engagementRate >= benchmark.poor) {
    score = 30 + ((engagementRate - benchmark.poor) / (benchmark.average - benchmark.poor)) * 20;
  } else {
    score = Math.max(10, (engagementRate / benchmark.poor) * 30);
  }

  score = Math.round(Math.min(100, Math.max(0, score)));

  return {
    score,
    breakdown: {
      engagementRate: engagementRate.toFixed(2) + "%",
      totalEngagement,
      avgViews,
      avgLikes: avgLikes ?? 0,
      avgComments: avgComments ?? 0,
      avgShares: avgShares ?? 0,
      benchmark: {
        tier: benchmark.tier,
        excellent: benchmark.excellent + "%",
        good: benchmark.good + "%",
        average: benchmark.average + "%",
        poor: benchmark.poor + "%",
      },
      formula: "(avgLikes + avgComments + avgShares) / avgViews * 100",
    },
  };
}

// ─── Content Quality Score ────────────────────────────────

export function calculateContentQuality(
  snapshot: SnapshotInput,
  videos: { views: number; likes: number; description: string; hashtags: string[] }[]
): ScoreResult {
  if (videos.length === 0) {
    return { score: 50, breakdown: { reason: "No video data, using neutral score" } };
  }

  const avgViews = snapshot.avgViews ?? 0;
  const aboveAverageRatio = videos.filter((v) => v.views > avgViews).length / videos.length;
  const hasHashtags = videos.filter((v) => v.hashtags.length > 0).length / videos.length;
  const hasCaptions = videos.filter((v) => v.description.length > 10).length / videos.length;

  const viewScore = aboveAverageRatio * 40;
  const hashtagScore = hasHashtags * 30;
  const captionScore = hasCaptions * 30;

  const score = Math.round(Math.min(100, viewScore + hashtagScore + captionScore));

  return {
    score,
    breakdown: {
      aboveAverageVideos: `${(aboveAverageRatio * 100).toFixed(1)}%`,
      videosWithHashtags: `${(hasHashtags * 100).toFixed(1)}%`,
      videosWithCaptions: `${(hasCaptions * 100).toFixed(1)}%`,
      totalVideos: videos.length,
      formula: "40% above-avg videos + 30% hashtags + 30% captions",
    },
  };
}

// ─── Posting Consistency Score ────────────────────────────

export function calculatePostingConsistency(videos: { createdAt: string }[]): ScoreResult {
  if (videos.length < 2) {
    return { score: 30, breakdown: { reason: "Insufficient posting data" } };
  }

  const timestamps = videos.map((v) => new Date(v.createdAt).getTime()).sort((a, b) => b - a);

  const gaps: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    gaps.push((timestamps[i - 1] - timestamps[i]) / (1000 * 60 * 60 * 24));
  }

  const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance = gaps.reduce((sum, g) => sum + Math.pow(g - avgGap, 2), 0) / gaps.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = avgGap > 0 ? stdDev / avgGap : 1;

  let score: number;
  if (coefficientOfVariation < 0.3) {
    score = 90;
  } else if (coefficientOfVariation < 0.5) {
    score = 75;
  } else if (coefficientOfVariation < 0.8) {
    score = 60;
  } else if (coefficientOfVariation < 1.2) {
    score = 45;
  } else {
    score = Math.max(20, 40 - (coefficientOfVariation - 1.2) * 20);
  }

  score = Math.round(Math.min(100, Math.max(0, score)));

  return {
    score,
    breakdown: {
      averageGapDays: avgGap.toFixed(1),
      standardDeviation: stdDev.toFixed(1),
      coefficientOfVariation: coefficientOfVariation.toFixed(2),
      totalPosts: videos.length,
      formula: "Lower CV = more consistent posting",
    },
  };
}

// ─── Explore / For You Potential (%) ──────────────────────

export function calculateExplorePotential(
  snapshot: SnapshotInput,
  videos: { views: number; likes: number; comments: number; shares: number; duration: number }[]
): ScoreResult {
  const { followers, avgViews, avgLikes, avgComments, avgShares } = snapshot;

  if (!followers || followers === 0 || !avgViews) {
    return { score: 20, breakdown: { reason: "Insufficient data for Explore calculation" } };
  }

  const viewsToFollowers = (avgViews / followers) * 100;

  const totalEngagement = (avgLikes ?? 0) + (avgComments ?? 0) + (avgShares ?? 0);
  const engagementRate = (totalEngagement / avgViews) * 100;
  const benchmark = getEngagementBenchmark(followers);
  const engagementScore = Math.min(100, (engagementRate / benchmark.excellent) * 100);

  const avgDuration =
    videos.length > 0 ? videos.reduce((a, v) => a + v.duration, 0) / videos.length : 15;
  const retentionProxy = Math.min(100, (avgDuration / 60) * 100);

  const viewsScore = Math.min(100, viewsToFollowers * 20);

  const rawPercent = viewsScore * 0.4 + engagementScore * 0.35 + retentionProxy * 0.25;
  const score = Math.round(Math.min(100, Math.max(0, rawPercent)));

  return {
    score,
    breakdown: {
      viewsToFollowersRatio: viewsToFollowers.toFixed(1) + "%",
      engagementScore: engagementScore.toFixed(1),
      retentionProxy: retentionProxy.toFixed(1),
      viewsScore: viewsScore.toFixed(1),
      formula: "40% views/followers + 35% engagement vs benchmark + 25% retention proxy",
      disclaimer: "مؤشر تقديري لاحتمالية الوصول لصفحة For You، وليس بيانات رسمية من TikTok",
    },
  };
}

// ─── Live Potential Score ─────────────────────────────────

export function calculateLivePotential(snapshot: SnapshotInput): ScoreResult {
  const { followers, avgViews, avgLikes, avgComments } = snapshot;

  const hasLiveHistory = (snapshot.rawPayload as Record<string, unknown>)?.liveStatus !== null;

  let followerScore = 0;
  if (followers >= 1000000) followerScore = 40;
  else if (followers >= 100000) followerScore = 30;
  else if (followers >= 10000) followerScore = 20;
  else if (followers >= 1000) followerScore = 10;
  else followerScore = 5;

  const totalEngagement = (avgLikes ?? 0) + (avgComments ?? 0);
  const engagementScore =
    avgViews && avgViews > 0 ? Math.min(40, (totalEngagement / avgViews) * 100 * 8) : 10;

  const historyScore = hasLiveHistory ? 20 : 10;

  const score = Math.round(Math.min(100, followerScore + engagementScore + historyScore));

  return {
    score,
    breakdown: {
      followers,
      followerScore,
      engagementScore: engagementScore.toFixed(1),
      hasLiveHistory,
      historyScore,
      formula: "40% follower tier + 40% engagement + 20% live history",
    },
  };
}

// ─── Professionalism Score ────────────────────────────────

export function calculateProfessionalism(snapshot: SnapshotInput): ScoreResult {
  const { isVerified, accountType, videoCount, followers, following } = snapshot;
  const raw = snapshot.rawPayload as Record<string, unknown>;
  const profile = raw?.profile as Record<string, unknown> | undefined;

  let profileScore = 0;
  if (profile?.avatarUrl) profileScore += 25;
  if (profile?.displayName && String(profile.displayName).length > 2) profileScore += 25;
  if (profile?.bio && String(profile.bio).length > 10) profileScore += 25;

  const verifiedScore = isVerified ? 25 : 0;

  const typeScore = accountType === "business" ? 20 : accountType === "personal" ? 10 : 5;

  let activityScore = 0;
  if (videoCount >= 100) activityScore = 20;
  else if (videoCount >= 50) activityScore = 15;
  else if (videoCount >= 20) activityScore = 10;
  else activityScore = 5;

  const followRatio = followers > 0 ? following / followers : 1;
  const ratioScore = followRatio < 0.5 ? 15 : followRatio < 1 ? 10 : 5;

  const raw_total = profileScore + verifiedScore + typeScore + activityScore + ratioScore;
  const score = Math.round(Math.min(100, raw_total));

  return {
    score,
    breakdown: {
      profileCompleteness: profileScore,
      verified: verifiedScore,
      accountType: typeScore,
      activityLevel: activityScore,
      followRatio: ratioScore,
      formula: "25% profile + 25% verified + 20% type + 20% activity + 15% follow ratio",
    },
  };
}

// ─── Account Strength Score (Weighted Average) ────────────

export function calculateAccountStrength(
  engagementScore: number,
  contentScore: number,
  consistencyScore: number,
  growthScore: number | null,
  liveScore: number
): ScoreResult {
  const weights = {
    engagement: 30,
    content: 20,
    consistency: 20,
    growth: 15,
    live: 15,
  };

  const available: { score: number; weight: number; name: string }[] = [
    { score: engagementScore, weight: weights.engagement, name: "engagement" },
    { score: contentScore, weight: weights.content, name: "content" },
    { score: consistencyScore, weight: weights.consistency, name: "consistency" },
    { score: liveScore, weight: weights.live, name: "live" },
  ];

  if (growthScore !== null) {
    available.push({ score: growthScore, weight: weights.growth, name: "growth" });
  }

  const totalWeight = available.reduce((sum, c) => sum + c.weight, 0);
  const weightedSum = available.reduce((sum, c) => sum + c.score * c.weight, 0);

  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  const breakdown: Record<string, unknown> = {
    formula: "Weighted average with redistribution on missing components",
    components: available.map((c) => ({
      name: c.name,
      score: c.score,
      weight: `${c.weight}%`,
    })),
  };

  if (growthScore === null) {
    breakdown.redistribution = "Growth weight (15%) redistributed to other components";
  }

  return { score: Math.min(100, Math.max(0, score)), breakdown };
}

// ─── Growth Rate ──────────────────────────────────────────

export function calculateGrowthRate(current: SnapshotInput, previous: SnapshotInput): ScoreResult {
  const currentFollowers = current.followers;
  const previousFollowers = previous.followers;

  if (previousFollowers === 0) {
    return { score: 50, breakdown: { reason: "Previous follower count was 0" } };
  }

  const growthPercent = ((currentFollowers - previousFollowers) / previousFollowers) * 100;

  let normalizedScore: number;
  if (growthPercent >= 20) normalizedScore = 95;
  else if (growthPercent >= 10) normalizedScore = 80;
  else if (growthPercent >= 5) normalizedScore = 65;
  else if (growthPercent >= 2) normalizedScore = 50;
  else if (growthPercent >= 0) normalizedScore = 40;
  else if (growthPercent >= -5) normalizedScore = 30;
  else normalizedScore = 15;

  return {
    score: normalizedScore,
    breakdown: {
      growthPercent: growthPercent.toFixed(2) + "%",
      currentFollowers,
      previousFollowers,
      formula: "Growth % normalized to 0-100 scale",
    },
  };
}
