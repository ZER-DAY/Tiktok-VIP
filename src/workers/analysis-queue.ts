import { Queue } from "bullmq";
import { getRedis } from "@/lib/redis";

export const analysisQueue = new Queue("analysis", {
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

export interface AnalysisJobData {
  snapshotId: string;
}
