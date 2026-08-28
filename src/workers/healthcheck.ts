import { prisma } from "@/lib/prisma";
import { connectRedis } from "@/lib/redis";
import { validateWorkerEnvironment } from "./validate-environment";

async function healthcheck() {
  validateWorkerEnvironment();
  const redis = await connectRedis();
  await Promise.all([redis.ping(), prisma.$queryRaw`SELECT 1`]);
  await Promise.allSettled([redis.quit(), prisma.$disconnect()]);
}

healthcheck().catch((error) => {
  console.error("[Workers] healthcheck failed", error instanceof Error ? error.message : error);
  process.exit(1);
});
