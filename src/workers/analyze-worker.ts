import { Worker, Job } from "bullmq";
import { getRedis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { TikTokProvider } from "@/modules/providers";
import { getAnalysisQueue } from "./analysis-queue";
import type { AnalyzeJobData } from "./queue";
import { ANALYSIS_DATA_VERSION, isAnalysisDataCurrent } from "./analysis-data";
import { isLiveAccountLevelProviderConfigured } from "@/modules/providers/tiktok/live-account-level";

const provider = new TikTokProvider();

const CACHE_DURATION_HOURS = 6;

function calculateAverages(
  videos: { views: number; likes: number; comments: number; shares: number }[]
) {
  if (videos.length === 0) {
    return { avgViews: null, avgLikes: null, avgComments: null, avgShares: null };
  }

  const sum = videos.reduce(
    (acc, v) => ({
      views: acc.views + v.views,
      likes: acc.likes + v.likes,
      comments: acc.comments + v.comments,
      shares: acc.shares + v.shares,
    }),
    { views: 0, likes: 0, comments: 0, shares: 0 }
  );

  return {
    avgViews: Math.round(sum.views / videos.length),
    avgLikes: Math.round(sum.likes / videos.length),
    avgComments: Math.round(sum.comments / videos.length),
    avgShares: Math.round(sum.shares / videos.length),
  };
}

function detectLanguage(text: string): string {
  const arabicRegex = /[\u0600-\u06FF]/;
  const arabicCount = (text.match(arabicRegex) || []).length;
  return arabicCount > text.length * 0.1 ? "ar" : "en";
}

async function processAnalyzeJob(job: Job<AnalyzeJobData>) {
  const { username, provider: providerKey, userId } = job.data;

  await job.updateProgress(10);

  // Find or create provider
  const dbProvider = await prisma.provider.findUnique({
    where: { key: providerKey },
  });

  if (!dbProvider) {
    throw new Error(`Provider ${providerKey} not found`);
  }

  // Check cache
  const existingAccount = await prisma.analyzedAccount.findUnique({
    where: {
      providerId_externalUsername: {
        providerId: dbProvider.id,
        externalUsername: username,
      },
    },
    include: {
      snapshots: {
        orderBy: { capturedAt: "desc" },
        take: 1,
      },
    },
  });

  if (existingAccount && existingAccount.snapshots.length > 0) {
    const lastSnapshot = existingAccount.snapshots[0];
    const hoursSinceLastCapture =
      (Date.now() - lastSnapshot.capturedAt.getTime()) / (1000 * 60 * 60);

    if (
      hoursSinceLastCapture < CACHE_DURATION_HOURS &&
      isAnalysisDataCurrent(lastSnapshot.rawPayload)
    ) {
      await job.updateProgress(100);
      return { accountId: existingAccount.id, snapshotId: lastSnapshot.id, fromCache: true };
    }
  }

  await job.updateProgress(20);

  // Fetch profile
  const profile = await provider.fetchProfile(username);
  await job.updateProgress(40);

  // Fetch recent content
  const content = await provider.fetchRecentContent(username, 20);
  await job.updateProgress(60);

  // Fetch live status
  let liveStatus = null;
  if (provider.fetchLiveStatus) {
    liveStatus = await provider.fetchLiveStatus(username, profile);
  }
  await job.updateProgress(70);

  // Calculate averages
  const averages = calculateAverages(content);

  // Detect language from bio and content
  const allText = [profile.bio, ...content.map((c) => c.description)].join(" ");
  const languageGuess = detectLanguage(allText);

  // Atomically create or update the account. Multiple jobs for the same
  // username can pass the cache check concurrently, so a separate
  // find-then-create would race on the compound unique constraint.
  const account = await prisma.analyzedAccount.upsert({
    where: {
      providerId_externalUsername: {
        providerId: dbProvider.id,
        externalUsername: username,
      },
    },
    create: {
      providerId: dbProvider.id,
      externalUsername: username,
      externalId: null,
      ownerId: userId ?? null,
      trackedByUserId: userId ?? null,
    },
    update: {
      lastAnalyzedAt: new Date(),
    },
    select: { id: true },
  });
  const accountId = account.id;

  await job.updateProgress(80);

  // Create AccountSnapshot
  const snapshot = await prisma.accountSnapshot.create({
    data: {
      accountId,
      followers: profile.followers,
      following: profile.following,
      totalLikes: BigInt(profile.totalLikes),
      videoCount: profile.videoCount,
      avgViews: averages.avgViews,
      avgLikes: averages.avgLikes,
      avgComments: averages.avgComments,
      avgShares: averages.avgShares,
      isVerified: profile.isVerified,
      accountType: profile.accountType,
      bioLanguageGuess: languageGuess,
      countryGuess: null,
      countryGuessConfidence: null,
      accountCreatedAtGuess: profile.accountCreatedAt ? new Date(profile.accountCreatedAt) : null,
      rawPayload: JSON.parse(
        JSON.stringify({
          pipelineVersion: ANALYSIS_DATA_VERSION,
          liveAccountLevelEnrichmentConfigured: isLiveAccountLevelProviderConfigured(),
          profile,
          content: content.slice(0, 20),
          liveStatus,
        })
      ),
    },
  });

  await job.updateProgress(100);

  // Trigger analysis report generation
  await getAnalysisQueue().add("analyze", { snapshotId: snapshot.id });

  return { accountId, snapshotId: snapshot.id, fromCache: false };
}

export const analyzeWorker = new Worker<AnalyzeJobData>(
  "analyze",
  async (job) => {
    return processAnalyzeJob(job);
  },
  {
    connection: getRedis(),
    concurrency: 5,
  }
);

analyzeWorker.on("failed", (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);
});

analyzeWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed for @${job.data.username}`);
});
