import { Queue } from "bullmq";
import { getRedis } from "@/lib/redis";

const globalForAnalysisQueue = globalThis as unknown as {
  analysisQueue: Queue<AnalysisJobData> | undefined;
};

export function getAnalysisQueue(): Queue<AnalysisJobData> {
  if (!globalForAnalysisQueue.analysisQueue) {
    globalForAnalysisQueue.analysisQueue = new Queue<AnalysisJobData>("analysis", {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: "exponential",
          delay: 3000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }

  return globalForAnalysisQueue.analysisQueue;
}

export interface AnalysisJobData {
  snapshotId: string;
}
