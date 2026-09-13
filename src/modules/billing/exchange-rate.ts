import { getSetting, setSetting } from "@/modules/admin/settings";

const RATE_KEY = "payment.usdEgp.rate";
const FETCHED_AT_KEY = "payment.usdEgp.fetchedAt";
const FALLBACK_KEY = "payment.usdEgp.fallbackRate";

// Refetch at most this often. The mid-market USD/EGP rate moves slowly enough
// that a few hours of staleness is fine, and this keeps one upstream call per
// window instead of one per page view.
const TTL_MS = 6 * 60 * 60 * 1000;

// Two independent free sources, no API key. If the first is unreachable the
// second usually still answers; if both fail we fall back to the last value we
// successfully stored, however old, because showing a stale amount is far
// better than telling a paying customer the method is unavailable.
const SOURCES: Array<{ url: string; pick: (body: unknown) => number | null }> = [
  {
    url: "https://open.er-api.com/v6/latest/USD",
    pick: (body) => {
      const rates = (body as { rates?: Record<string, unknown> })?.rates;
      const value = rates?.EGP;
      return typeof value === "number" ? value : null;
    },
  },
  {
    url: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json",
    pick: (body) => {
      const usd = (body as { usd?: Record<string, unknown> })?.usd;
      const value = usd?.egp;
      return typeof value === "number" ? value : null;
    },
  },
];

function isSaneRate(value: number | null): value is number {
  // A guard against a malformed or misread response silently repricing every
  // plan. USD/EGP has stayed well inside this band for years.
  return typeof value === "number" && Number.isFinite(value) && value >= 5 && value <= 500;
}

async function fetchLiveRate(): Promise<number | null> {
  for (const source of SOURCES) {
    try {
      const response = await fetch(source.url, {
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      });
      if (!response.ok) continue;
      const rate = source.pick(await response.json());
      if (isSaneRate(rate)) return rate;
    } catch {
      // Try the next source.
    }
  }
  return null;
}

async function readCached(): Promise<{ rate: number | null; ageMs: number | null }> {
  const [rawRate, rawFetchedAt] = await Promise.all([
    getSetting(RATE_KEY),
    getSetting(FETCHED_AT_KEY),
  ]);
  const rate = rawRate ? Number(rawRate) : null;
  const fetchedAt = rawFetchedAt ? Number(rawFetchedAt) : null;
  return {
    rate: isSaneRate(rate) ? rate : null,
    ageMs: fetchedAt && Number.isFinite(fetchedAt) ? Date.now() - fetchedAt : null,
  };
}

/**
 * Live USD -> EGP rate, cached in SystemSetting.
 *
 * Order of preference: a fresh cached value, then a live fetch, then the last
 * stored value regardless of age, then the configured fallback. The fallback
 * is what guarantees a payment method never goes dark because a currency API
 * happened to be down.
 */
export async function getUsdToEgpRate(): Promise<number | null> {
  try {
    const cached = await readCached();
    if (cached.rate !== null && cached.ageMs !== null && cached.ageMs < TTL_MS) {
      return cached.rate;
    }

    const live = await fetchLiveRate();
    if (live !== null) {
      await setSetting(RATE_KEY, String(live));
      await setSetting(FETCHED_AT_KEY, String(Date.now()));
      return live;
    }

    if (cached.rate !== null) return cached.rate;

    const fallback = Number(await getSetting(FALLBACK_KEY));
    return isSaneRate(fallback) ? fallback : null;
  } catch {
    return null;
  }
}
