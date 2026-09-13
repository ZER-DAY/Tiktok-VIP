import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const store = new Map<string, string>();

vi.mock("@/modules/admin/settings", () => ({
  getSetting: async (key: string) => store.get(key) ?? null,
  setSetting: async (key: string, value: string) => {
    store.set(key, value);
  },
}));

const ER_API = "https://open.er-api.com/v6/latest/USD";
const CDN_API = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json";

function mockFetch(handler: (url: string) => { ok: boolean; body?: unknown } | "throw") {
  vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
    const result = handler(String(input));
    if (result === "throw") throw new Error("network down");
    return {
      ok: result.ok,
      json: async () => result.body,
    } as Response;
  });
}

async function loadRate() {
  vi.resetModules();
  const mod = await import("@/modules/billing/exchange-rate");
  return mod.getUsdToEgpRate();
}

describe("USD to EGP rate", () => {
  beforeEach(() => {
    store.clear();
    store.set("payment.usdEgp.fallbackRate", "48");
  });
  afterEach(() => vi.unstubAllGlobals());

  it("reads the live rate from the primary source and caches it", async () => {
    mockFetch((url) => (url === ER_API ? { ok: true, body: { rates: { EGP: 47.5 } } } : "throw"));
    expect(await loadRate()).toBe(47.5);
    expect(store.get("payment.usdEgp.rate")).toBe("47.5");
    expect(Number(store.get("payment.usdEgp.fetchedAt"))).toBeGreaterThan(0);
  });

  it("falls through to the second source when the first fails", async () => {
    mockFetch((url) => (url === CDN_API ? { ok: true, body: { usd: { egp: 49.25 } } } : "throw"));
    expect(await loadRate()).toBe(49.25);
  });

  it("serves a fresh cached rate without calling out at all", async () => {
    store.set("payment.usdEgp.rate", "46.1");
    store.set("payment.usdEgp.fetchedAt", String(Date.now()));
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await loadRate()).toBe(46.1);
    expect(spy).not.toHaveBeenCalled();
  });

  it("reuses a stale cached rate when every source is down", async () => {
    store.set("payment.usdEgp.rate", "46.1");
    store.set("payment.usdEgp.fetchedAt", String(Date.now() - 48 * 60 * 60 * 1000));
    mockFetch(() => "throw");
    expect(await loadRate()).toBe(46.1);
  });

  it("uses the configured fallback when there is no cache and no network", async () => {
    mockFetch(() => "throw");
    expect(await loadRate()).toBe(48);
  });

  it("rejects an absurd rate rather than repricing every plan", async () => {
    // A malformed or misread response must not silently become the price.
    mockFetch((url) => (url === ER_API ? { ok: true, body: { rates: { EGP: 0.0004 } } } : "throw"));
    expect(await loadRate()).toBe(48); // falls back instead of accepting it
  });

  it("ignores a non-numeric payload", async () => {
    mockFetch((url) => (url === ER_API ? { ok: true, body: { rates: { EGP: "47.5" } } } : "throw"));
    expect(await loadRate()).toBe(48);
  });
});
