import { Queue } from "bullmq";
import { getRedis } from "@/lib/redis";
export const BACKSTAGE_QUEUE = "backstage-eligibility";
export const BACKSTAGE_HEARTBEAT = "backstage:worker:heartbeat";
export const cacheKey = (username: string) => `backstage:eligibility:v1:${username.toLowerCase()}`;
export type EligibilityJob = { username: string; userId: string; requestedAt: number };
const globalQueue = globalThis as unknown as { backstageQueue?: Queue<EligibilityJob> };
export function getBackstageQueue() {
  return (globalQueue.backstageQueue ??= new Queue<EligibilityJob>(BACKSTAGE_QUEUE, {
    connection: getRedis(),
    defaultJobOptions: {
      attempts: 1,
      removeOnComplete: { age: 600, count: 100 },
      removeOnFail: { age: 600, count: 100 },
    },
  }));
}
