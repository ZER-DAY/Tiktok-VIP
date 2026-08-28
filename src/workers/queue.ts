import { Queue } from "bullmq";
import { getRedis } from "@/lib/redis";

const globalForAnalyzeQueue = globalThis as unknown as {
  analyzeQueue: Queue<AnalyzeJobData> | undefined;
};

export function getAnalyzeQueue(): Queue<AnalyzeJobData> {
  if (!globalForAnalyzeQueue.analyzeQueue) {
    globalForAnalyzeQueue.analyzeQueue = new Queue<AnalyzeJobData>("analyze", {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });
  }

  return globalForAnalyzeQueue.analyzeQueue;
}

export interface AnalyzeJobData {
  username: string;
  provider: string;
  userId?: string;
}
