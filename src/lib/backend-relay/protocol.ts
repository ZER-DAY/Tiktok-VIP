import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export const RELAY_TTL_SECONDS = 45;
export const RELAY_TIMEOUT_MS = 25_000;
export const RELAY_MAX_BYTES = 8 * 1024 * 1024;
export type RelayRequest = {
  deadline: number;
  method: string;
  path: string;
  headers: [string, string][];
  body: string;
};
export type RelayResponse = {
  status: number;
  headers: [string, string][];
  body: string;
};

function key(secret: string) {
  if (!/^[a-f0-9]{64}$/i.test(secret)) throw new Error("Invalid relay key");
  return Buffer.from(secret, "hex");
}

/** Bind ciphertext to the direction and request ID to reject tampering/swaps. */
export function sealRelay(value: unknown, secret: string, context: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), nonce);
  cipher.setAAD(Buffer.from(context));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([nonce, cipher.getAuthTag(), encrypted]).toString("base64");
}

export function openRelay<T>(payload: string, secret: string, context: string): T {
  const bytes = Buffer.from(payload, "base64");
  if (bytes.length < 28 || bytes.length > RELAY_MAX_BYTES * 2)
    throw new Error("Invalid relay payload");
  const decipher = createDecipheriv("aes-256-gcm", key(secret), bytes.subarray(0, 12));
  decipher.setAAD(Buffer.from(context));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString()
  );
}

export function relayPath(path: string): string {
  if (!path.startsWith("/api/")) throw new Error("Invalid relay path");
  const url = new URL(path, "http://local");
  if (!url.pathname.startsWith("/api/") || url.pathname === "/api/backend-relay") {
    throw new Error("Invalid relay path");
  }
  return url.pathname + url.search;
}

const strippedHeaders = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
  "content-encoding",
  "forwarded",
  "x-forwarded-host",
  "x-forwarded-proto",
  "x-forwarded-for",
  "x-backend-relay-path",
]);

export function relayHeaders(headers: Headers): [string, string][] {
  const excluded = new Set([
    ...strippedHeaders,
    ...(headers.get("connection") ?? "").split(",").map((h) => h.trim().toLowerCase()),
  ]);
  const result: [string, string][] = [];
  headers.forEach((value, name) => {
    if (!excluded.has(name) && name !== "set-cookie") result.push([name, value]);
  });
  for (const cookie of headers.getSetCookie()) result.push(["set-cookie", cookie]);
  return result;
}

export async function relayBody(body: ReadableStream<Uint8Array> | null): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > RELAY_MAX_BYTES) {
        await reader.cancel();
        throw new Error("Relay body too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}
