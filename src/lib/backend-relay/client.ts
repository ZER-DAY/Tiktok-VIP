import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { getRelayRedis, relayKeys, relaySecret } from "./redis";
import {
  openRelay,
  sealRelay,
  relayBody,
  relayHeaders,
  relayPath,
  RELAY_TTL_SECONDS,
  RELAY_TIMEOUT_MS,
  type RelayRequest,
  type RelayResponse,
} from "./protocol";

export async function forwardRelayRequest(request: Request, path: string): Promise<Response> {
  const secret = relaySecret();
  const redis = getRelayRedis();
  const keys = relayKeys();
  const heartbeat = await redis.get(keys.heartbeat);
  if (!heartbeat) throw new Error("Backend offline");
  const { at } = openRelay<{ at: number }>(heartbeat, secret, "heartbeat");
  if (Date.now() - at > 15_000 || at > Date.now() + 5000) throw new Error("Backend offline");
  const id = randomUUID();
  const deadline = Date.now() + RELAY_TIMEOUT_MS;
  const payload: RelayRequest = {
    deadline,
    method: request.method,
    path: relayPath(path),
    headers: relayHeaders(request.headers),
    body: (await relayBody(request.body)).toString("base64"),
  };
  const encrypted = sealRelay(payload, secret, `request:${id}`);
  // Atomic bounded enqueue: an offline backend cannot accumulate an unbounded queue.
  const queued = await redis.eval(
    `
    if redis.call('LLEN', KEYS[1]) >= 500 then return 0 end
    redis.call('SET', KEYS[2], ARGV[1], 'EX', ARGV[3])
    redis.call('RPUSH', KEYS[1], ARGV[2])
    redis.call('EXPIRE', KEYS[1], ARGV[3])
    return 1
  `,
    2,
    keys.pending,
    keys.request(id),
    encrypted,
    id,
    RELAY_TTL_SECONDS
  );
  if (!queued) throw new Error("Backend busy");

  try {
    while (Date.now() < deadline && !request.signal.aborted) {
      const value = await redis.getdel(keys.response(id));
      if (value) {
        const reply = openRelay<RelayResponse>(value, secret, `response:${id}`);
        const headers = new Headers();
        for (const [name, value] of reply.headers) headers.append(name, value);
        headers.set("cache-control", "no-store");
        const noBody = request.method === "HEAD" || [204, 205, 304].includes(reply.status);
        return new Response(noBody ? null : new Uint8Array(Buffer.from(reply.body, "base64")), {
          status: reply.status,
          headers,
        });
      }
      // A shared multiplexed connection serves every request; no per-request socket.
      await delay(150);
    }
    throw new Error("Backend timeout");
  } finally {
    await redis
      .multi()
      .del(keys.request(id), keys.response(id))
      .lrem(keys.pending, 1, id)
      .exec()
      .catch(() => {});
  }
}
