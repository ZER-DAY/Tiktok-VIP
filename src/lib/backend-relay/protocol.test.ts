import { describe, expect, it } from "vitest";
import {
  openRelay,
  sealRelay,
  relayPath,
  relayHeaders,
  relayBody,
  RELAY_MAX_BYTES,
} from "./protocol";

const secret = "ab".repeat(32);
describe("encrypted outbound HTTP relay", () => {
  it("encrypts credentials and binds responses to their request and direction", () => {
    const value = { password: "not-visible-in-redis", cookie: "session=private" };
    const payload = sealRelay(value, secret, "request:one");
    expect(payload).not.toContain(value.password);
    expect(Buffer.from(payload, "base64").toString()).not.toContain(value.password);
    expect(openRelay(payload, secret, "request:one")).toEqual(value);
    expect(() => openRelay(payload, secret, "response:one")).toThrow();
    expect(() => openRelay(payload, secret, "request:two")).toThrow();
    expect(() => openRelay(payload, "cd".repeat(32), "request:one")).toThrow();
  });
  it("rejects modified ciphertext", () => {
    const bytes = Buffer.from(sealRelay({ ok: true }, secret, "test"), "base64");
    bytes[bytes.length - 1] ^= 1;
    expect(() => openRelay(bytes.toString("base64"), secret, "test")).toThrow();
  });
  it.each([
    "https://attacker.example/api",
    "//attacker.example/api",
    "/api/../admin",
    "/api/backend-relay",
  ])("rejects paths outside the local API: %s", (path) => expect(() => relayPath(path)).toThrow());
  it("preserves API paths and search", () => {
    expect(relayPath("/api/auth/get-session?fresh=1")).toBe("/api/auth/get-session?fresh=1");
  });
  it("preserves session cookies but removes hop-by-hop and spoofed routing headers", () => {
    const headers = new Headers({
      connection: "x-remove",
      "x-remove": "bad",
      "x-forwarded-host": "evil",
      cookie: "session=one",
    });
    headers.append("set-cookie", "one=first; Secure; HttpOnly");
    headers.append("set-cookie", "two=second; Secure");
    const result = new Headers(relayHeaders(headers));
    expect(result.getSetCookie()).toHaveLength(2);
    expect(result.get("cookie")).toBe("session=one");
    expect(result.has("x-remove")).toBe(false);
    expect(result.has("x-forwarded-host")).toBe(false);
  });
  it("bounds payloads before storing them", async () => {
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(RELAY_MAX_BYTES + 1));
        controller.close();
      },
    });
    await expect(relayBody(body)).rejects.toThrow("too large");
  });
});
