import { Worker } from "bullmq";
import { getRedis, connectRedis } from "@/lib/redis";
import {
  BACKSTAGE_QUEUE,
  BACKSTAGE_HEARTBEAT,
  cacheKey,
  type EligibilityJob,
} from "@/modules/backstage/queue";
import { checkInBrowser } from "@/modules/backstage/browser";
import { resultSchema, unavailable } from "@/modules/backstage/result";

async function main() {
  const redis = await connectRedis();
  const worker = new Worker<EligibilityJob>(
    BACKSTAGE_QUEUE,
    async (job) => {
      if (Date.now() - job.data.requestedAt > 90000) return unavailable();
      const cached = await redis.get(cacheKey(job.data.username));
      if (cached) {
        const parsed = resultSchema.safeParse(JSON.parse(cached));
        if (parsed.success) return parsed.data;
      }
      const result = await checkInBrowser(job.data.username).catch(() => unavailable());
      // Only confirmed checks are cached. Login, verification and infrastructure
      // failures are not converted to a creator eligibility decision.
      if (result.status === "eligible" || result.status === "ineligible") {
        await redis.set(cacheKey(job.data.username), JSON.stringify(result), "EX", 300);
      }
      return result;
    },
    { connection: getRedis(), concurrency: 1, limiter: { max: 1, duration: 5000 } }
  );
  const heartbeat = () => redis.set(BACKSTAGE_HEARTBEAT, "1", "EX", 20).catch(() => undefined);
  await heartbeat();
  const timer = setInterval(heartbeat, 5000);
  worker.on("error", () => console.error("Backstage worker connection unavailable"));
  let stopping = false;
  async function stop() {
    if (stopping) return;
    stopping = true;
    clearInterval(timer);
    await worker.close();
    await redis.del(BACKSTAGE_HEARTBEAT);
    await redis.quit();
  }
  process.once("SIGINT", () => void stop());
  process.once("SIGTERM", () => void stop());
  console.log("Backstage read-only eligibility worker started");
}
main().catch(() => {
  console.error("Backstage worker failed to start");
  process.exitCode = 1;
});
