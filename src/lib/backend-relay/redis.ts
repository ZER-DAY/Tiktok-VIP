import Redis from "ioredis";

const shared = globalThis as typeof globalThis & { backendRelayRedis?: Redis };
export function relaySecret() {
  const secret = process.env.BACKEND_RELAY_SECRET ?? "";
  if (!/^[a-f0-9]{64}$/i.test(secret)) throw new Error("Relay is not configured");
  return secret;
}
export function relayKeys() {
  const prefix = process.env.BACKEND_RELAY_PREFIX ?? "tiktok:http-relay:v1";
  if (!/^[a-z0-9:-]{1,80}$/.test(prefix)) throw new Error("Invalid relay prefix");
  return {
    pending: `${prefix}:pending`,
    heartbeat: `${prefix}:heartbeat`,
    request: (id: string) => `${prefix}:request:${id}`,
    response: (id: string) => `${prefix}:response:${id}`,
    claim: (id: string) => `${prefix}:claim:${id}`,
  };
}
export function createRelayRedis() {
  const url = process.env.BACKEND_RELAY_REDIS_URL ?? "";
  // Prefer TLS. Some existing managed endpoints only support Redis TCP;
  // HTTP payloads are always authenticated/encrypted before reaching either.
  if (!["redis:", "rediss:"].includes(new URL(url).protocol)) {
    throw new Error("Invalid relay Redis endpoint");
  }
  const redis = new Redis(url, {
    connectTimeout: 5000,
    commandTimeout: 8000,
    maxRetriesPerRequest: 1,
    retryStrategy: (attempt) => Math.min(attempt * 200, 2000),
  });
  // Request handlers return a generic service error; never log URLs or payloads.
  redis.on("error", () => {});
  return redis;
}
export function getRelayRedis() {
  return (shared.backendRelayRedis ??= createRelayRedis());
}
