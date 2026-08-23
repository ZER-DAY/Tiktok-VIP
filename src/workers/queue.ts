import { Queue } from "bullmq";
import { getRedis } from "@/lib/redis";

export const analyzeQueue = new Queue("analyze", {
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

export interface AnalyzeJobData {
  username: string;
  provider: string;
  userId?: string;
}
