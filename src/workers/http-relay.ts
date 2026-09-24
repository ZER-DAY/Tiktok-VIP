import { setTimeout as delay } from "node:timers/promises";
import { createRelayRedis, relayKeys, relaySecret } from "@/lib/backend-relay/redis";
import {
  openRelay,
  sealRelay,
  relayPath,
  relayHeaders,
  relayBody,
  RELAY_TTL_SECONDS,
  type RelayRequest,
  type RelayResponse,
} from "@/lib/backend-relay/protocol";

async function main() {
  const secret = relaySecret();
  const keys = relayKeys();
  const redis = createRelayRedis();
  const blocking = createRelayRedis();
  const upstream = new URL(process.env.BACKEND_RELAY_UPSTREAM ?? "http://127.0.0.1:3000");
  const publicOrigin = new URL(
    process.env.PUBLIC_APP_ORIGIN ?? "https://tiktok-vip-six.vercel.app"
  );
  if (!["http:", "https:"].includes(upstream.protocol) || publicOrigin.protocol !== "https:") {
    throw new Error("Invalid relay origin");
  }
  let stopping = false;
  const active = new Set<Promise<void>>();
  const shutdown = () => {
    stopping = true;
  };
  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);

  async function heartbeat() {
    try {
      const check = await fetch(new URL("/api/health", upstream), {
        signal: AbortSignal.timeout(4000),
      });
      await check.arrayBuffer();
      if (check.ok)
        await redis.set(
          keys.heartbeat,
          sealRelay({ at: Date.now() }, secret, "heartbeat"),
          "EX",
          15
        );
    } catch {
      /* Existing heartbeat expires if this machine or its services fail. */
    }
  }

  async function handle(id: string) {
    if (!/^[a-f0-9-]{36}$/.test(id)) return;
    const message = await redis.getdel(keys.request(id));
    if (!message) return;
    let input: RelayRequest;
    try {
      input = openRelay<RelayRequest>(message, secret, `request:${id}`);
      relayPath(input.path);
      if (input.deadline <= Date.now() || input.deadline > Date.now() + 30_000) return;
    } catch {
      return;
    }
    // At most one execution, even if a queue item is replayed within its deadline.
    if (!(await redis.set(keys.claim(id), "1", "EX", RELAY_TTL_SECONDS, "NX"))) return;
    let output: RelayResponse;
    try {
      const headers = new Headers(input.headers);
      headers.set("x-forwarded-host", publicOrigin.host);
      headers.set("x-forwarded-proto", "https");
      const response = await fetch(new URL(relayPath(input.path), upstream), {
        method: input.method,
        headers,
        body: ["GET", "HEAD"].includes(input.method)
          ? undefined
          : Buffer.from(input.body, "base64"),
        redirect: "manual",
        signal: AbortSignal.timeout(Math.max(1, input.deadline - Date.now())),
      });
      output = {
        status: response.status,
        headers: relayHeaders(response.headers),
        body: (await relayBody(response.body)).toString("base64"),
      };
    } catch {
      output = {
        status: 503,
        headers: [["content-type", "application/json"]],
        body: Buffer.from(
          '{"success":false,"error":{"code":"SERVICE_UNAVAILABLE","message":"Service temporarily unavailable."}}'
        ).toString("base64"),
      };
    }
    await redis.set(
      keys.response(id),
      sealRelay(output, secret, `response:${id}`),
      "EX",
      RELAY_TTL_SECONDS
    );
  }

  await heartbeat();
  let heartbeatBusy = false;
  const timer = setInterval(() => {
    if (heartbeatBusy) return;
    heartbeatBusy = true;
    void heartbeat().finally(() => {
      heartbeatBusy = false;
    });
  }, 5000);
  console.log("[HTTP relay] encrypted outbound bridge ready");
  try {
    while (!stopping) {
      if (active.size >= 8) {
        await Promise.race(active);
        continue;
      }
      try {
        const item = await blocking.blpop(keys.pending, 2);
        if (!item) continue;
        const task = handle(item[1])
          .catch(() => {
            console.error("[HTTP relay] request processing failed");
          })
          .finally(() => active.delete(task));
        active.add(task);
      } catch {
        await delay(1000);
      }
    }
  } finally {
    clearInterval(timer);
    await Promise.allSettled(active);
    redis.disconnect();
    blocking.disconnect();
  }
}
main().catch(() => {
  console.error("[HTTP relay] startup failed");
  process.exit(1);
});
