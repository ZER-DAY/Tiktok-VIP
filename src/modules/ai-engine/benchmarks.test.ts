import { describe, it, expect } from "vitest";
import { getEngagementBenchmark, getAccountTier, ENGAGEMENT_BENCHMARKS } from "./benchmarks";

describe("getEngagementBenchmark", () => {
  it("returns micro tier for accounts under 10k followers", () => {
    const result = getEngagementBenchmark(5000);
    expect(result.tier).toBe("micro");
    expect(result.excellent).toBe(8);
    expect(result.good).toBe(5);
  });

  it("returns mid tier for 10k-100k followers", () => {
    const result = getEngagementBenchmark(50000);
    expect(result.tier).toBe("mid");
    expect(result.excellent).toBe(5);
  });

  it("returns macro tier for 100k-1M followers", () => {
    const result = getEngagementBenchmark(500000);
    expect(result.tier).toBe("macro");
    expect(result.excellent).toBe(3.5);
  });

  it("returns mega tier for 1M+ followers", () => {
    const result = getEngagementBenchmark(2000000);
    expect(result.tier).toBe("mega");
    expect(result.excellent).toBe(2.5);
  });

  it("returns micro at exactly 0 followers", () => {
    const result = getEngagementBenchmark(0);
    expect(result.tier).toBe("micro");
  });
});

describe("getAccountTier", () => {
  it("returns correct tier boundaries", () => {
    expect(getAccountTier(9999).tier).toBe("micro");
    expect(getAccountTier(10000).tier).toBe("mid");
    expect(getAccountTier(99999).tier).toBe("mid");
    expect(getAccountTier(100000).tier).toBe("macro");
    expect(getAccountTier(999999).tier).toBe("macro");
    expect(getAccountTier(1000000).tier).toBe("mega");
  });
});

describe("ENGAGEMENT_BENCHMARKS", () => {
  it("has 4 tiers", () => {
    expect(ENGAGEMENT_BENCHMARKS).toHaveLength(4);
  });

  it("tiers are ordered by minFollowers", () => {
    for (let i = 1; i < ENGAGEMENT_BENCHMARKS.length; i++) {
      expect(ENGAGEMENT_BENCHMARKS[i].minFollowers).toBeGreaterThan(
        ENGAGEMENT_BENCHMARKS[i - 1].minFollowers
      );
    }
  });

  it("all tiers have positive thresholds", () => {
    for (const tier of ENGAGEMENT_BENCHMARKS) {
      expect(tier.excellent).toBeGreaterThan(0);
      expect(tier.good).toBeGreaterThan(0);
      expect(tier.average).toBeGreaterThan(0);
      expect(tier.poor).toBeGreaterThan(0);
    }
  });
});
