import { describe, expect, it } from "vitest";
import { resolveSafeCallbackUrl } from "./callback";

describe("resolveSafeCallbackUrl", () => {
  const fallback = "/ar/dashboard";

  it("keeps a safe internal callback with a plan query", () => {
    expect(resolveSafeCallbackUrl("/ar/dashboard/billing?plan=saver&utm=1", fallback)).toBe(
      "/ar/dashboard/billing?plan=saver&utm=1"
    );
  });

  it("falls back when missing", () => {
    expect(resolveSafeCallbackUrl(null, fallback)).toBe(fallback);
    expect(resolveSafeCallbackUrl("", fallback)).toBe(fallback);
    expect(resolveSafeCallbackUrl("   ", fallback)).toBe(fallback);
  });

  it("blocks absolute URLs (open redirect)", () => {
    expect(resolveSafeCallbackUrl("https://evil.example.com/phish", fallback)).toBe(fallback);
    expect(resolveSafeCallbackUrl("http://localhost:3000/dashboard", fallback)).toBe(fallback);
  });

  it("blocks protocol-relative and backslash URLs", () => {
    expect(resolveSafeCallbackUrl("//evil.example.com/phish", fallback)).toBe(fallback);
    expect(resolveSafeCallbackUrl("/\\evil.example.com", fallback)).toBe(fallback);
    expect(resolveSafeCallbackUrl("javascript:alert(1)", fallback)).toBe(fallback);
  });
});
