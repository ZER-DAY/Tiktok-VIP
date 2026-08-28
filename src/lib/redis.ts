import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
  redisConnectPromise: Promise<void> | undefined;
};

export function getRedis(): Redis {
  if (!globalForRedis.redis) {
    globalForRedis.redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      // BullMQ workers use blocking commands and must be able to resume them
      // after a short managed-Redis reconnect.
      enableOfflineQueue: true,
    });
  }
  return globalForRedis.redis;
}

/** Ensure direct Redis commands do not race the lazy initial connection. */
export async function connectRedis(): Promise<Redis> {
  const redis = getRedis();

  if (redis.status === "ready") return redis;

  if (!globalForRedis.redisConnectPromise) {
    globalForRedis.redisConnectPromise =
      redis.status === "wait"
        ? redis.connect()
        : new Promise<void>((resolve, reject) => {
            const onReady = () => {
              cleanup();
              resolve();
            };
            const onError = (error: Error) => {
              cleanup();
              reject(error);
            };
            const cleanup = () => {
              redis.off("ready", onReady);
              redis.off("error", onError);
            };
            redis.once("ready", onReady);
            redis.once("error", onError);
          });
  }

  try {
    await globalForRedis.redisConnectPromise;
    return redis;
  } finally {
    globalForRedis.redisConnectPromise = undefined;
  }
}
