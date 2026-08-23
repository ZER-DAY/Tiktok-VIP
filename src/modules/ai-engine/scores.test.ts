import { describe, it, expect } from "vitest";
import {
  calculateEngagementQuality,
  calculateContentQuality,
  calculatePostingConsistency,
  calculateExplorePotential,
  calculateLivePotential,
  calculateProfessionalism,
  calculateAccountStrength,
  calculateGrowthRate,
  type SnapshotInput,
} from "./scores";

function makeSnapshot(overrides: Partial<SnapshotInput> = {}): SnapshotInput {
  return {
    followers: 50000,
    following: 500,
    totalLikes: 1000000,
    videoCount: 200,
    avgViews: 10000,
    avgLikes: 500,
    avgComments: 50,
    avgShares: 20,
    isVerified: false,
    accountType: "personal",
    bioLanguageGuess: "ar",
    countryGuess: "Saudi Arabia",
    countryGuessConfidence: 0.7,
    rawPayload: {
      profile: { avatarUrl: "url", displayName: "Test", bio: "A bio longer than 10 chars" },
    },
    ...overrides,
  };
}

describe("calculateEngagementQuality", () => {
  it("returns 0 when no view data", () => {
    const snapshot = makeSnapshot({ avgViews: 0 });
    const result = calculateEngagementQuality(snapshot);
    expect(result.score).toBe(0);
  });

  it("returns 0 when avgViews is null", () => {
    const snapshot = makeSnapshot({ avgViews: null });
    const result = calculateEngagementQuality(snapshot);
    expect(result.score).toBe(0);
  });

  it("calculates high engagement for micro account", () => {
    const snapshot = makeSnapshot({
      followers: 5000,
      avgViews: 1000,
      avgLikes: 80,
      avgComments: 15,
      avgShares: 10,
    });
    const result = calculateEngagementQuality(snapshot);
    // engagement = (80+15+10)/1000*100 = 10.5%, benchmark.micro.excellent = 8% → score >= 90
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  it("calculates low engagement for micro account", () => {
    const snapshot = makeSnapshot({
      followers: 5000,
      avgViews: 10000,
      avgLikes: 10,
      avgComments: 2,
      avgShares: 1,
    });
    const result = calculateEngagementQuality(snapshot);
    // engagement = (10+2+1)/10000*100 = 0.13%, benchmark.micro.poor = 1.5% → low score
    expect(result.score).toBeLessThan(30);
  });

  it("calculates mid-tier engagement correctly", () => {
    const snapshot = makeSnapshot({
      followers: 50000,
      avgViews: 5000,
      avgLikes: 200,
      avgComments: 30,
      avgShares: 10,
    });
    const result = calculateEngagementQuality(snapshot);
    // engagement = (200+30+10)/5000*100 = 5.2%, benchmark.mid.excellent = 5% → high score
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  it("always returns score between 0 and 100", () => {
    const snapshot = makeSnapshot({ avgViews: 1000000, avgLikes: 0, avgComments: 0, avgShares: 0 });
    const result = calculateEngagementQuality(snapshot);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe("calculateContentQuality", () => {
  it("returns 50 for empty video list", () => {
    const snapshot = makeSnapshot();
    const result = calculateContentQuality(snapshot, []);
    expect(result.score).toBe(50);
  });

  it("gives high score for good content", () => {
    const snapshot = makeSnapshot({ avgViews: 100 });
    const videos = Array.from({ length: 10 }, (_, i) => ({
      views: i < 7 ? 200 : 50,
      likes: 100,
      description: "A good description for this video content",
      hashtags: ["tag1", "tag2"],
    }));
    const result = calculateContentQuality(snapshot, videos);
    // 70% above avg, 100% hashtags, 100% captions → 0.7*40 + 1*30 + 1*30 = 88
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("gives low score for poor content", () => {
    const snapshot = makeSnapshot({ avgViews: 1000 });
    const videos = Array.from({ length: 10 }, () => ({
      views: 10,
      likes: 1,
      description: "Hi",
      hashtags: [] as string[],
    }));
    const result = calculateContentQuality(snapshot, videos);
    // 0% above avg, 0% hashtags, 0% captions → score ~0
    expect(result.score).toBeLessThan(20);
  });

  it("always returns score between 0 and 100", () => {
    const snapshot = makeSnapshot();
    const videos = Array.from({ length: 100 }, () => ({
      views: 1000000,
      likes: 10000,
      description: "x",
      hashtags: [] as string[],
    }));
    const result = calculateContentQuality(snapshot, videos);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe("calculatePostingConsistency", () => {
  it("returns 30 for insufficient data", () => {
    const result = calculatePostingConsistency([{ createdAt: "2024-01-01" }]);
    expect(result.score).toBe(30);
  });

  it("returns 30 for empty array", () => {
    const result = calculatePostingConsistency([]);
    expect(result.score).toBe(30);
  });

  it("gives high score for consistent posting", () => {
    const videos = Array.from({ length: 30 }, (_, i) => ({
      createdAt: new Date(2024, 0, 1 + i * 1).toISOString(), // every day
    }));
    const result = calculatePostingConsistency(videos);
    // CV should be ~0 → score 90
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  it("gives low score for inconsistent posting", () => {
    const videos = [
      { createdAt: "2024-01-01" },
      { createdAt: "2024-01-10" },
      { createdAt: "2024-01-15" },
      { createdAt: "2024-06-01" }, // big gap
      { createdAt: "2024-06-02" },
    ];
    const result = calculatePostingConsistency(videos);
    // High variance → lower score
    expect(result.score).toBeLessThan(70);
  });
});

describe("calculateExplorePotential", () => {
  it("returns 20 for zero followers", () => {
    const snapshot = makeSnapshot({ followers: 0 });
    const result = calculateExplorePotential(snapshot, []);
    expect(result.score).toBe(20);
  });

  it("returns 20 for null avgViews", () => {
    const snapshot = makeSnapshot({ avgViews: null });
    const result = calculateExplorePotential(snapshot, []);
    expect(result.score).toBe(20);
  });

  it("gives higher score when views/followers ratio is high", () => {
    const snapshot = makeSnapshot({
      followers: 1000,
      avgViews: 500,
      avgLikes: 50,
      avgComments: 10,
      avgShares: 5,
    });
    const videos = [{ views: 500, likes: 50, comments: 10, shares: 5, duration: 30 }];
    const result = calculateExplorePotential(snapshot, videos);
    expect(result.score).toBeGreaterThan(30);
  });

  it("always returns score between 0 and 100", () => {
    const snapshot = makeSnapshot({ followers: 1000000, avgViews: 100000 });
    const result = calculateExplorePotential(snapshot, []);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe("calculateLivePotential", () => {
  it("gives low score for small accounts", () => {
    const snapshot = makeSnapshot({
      followers: 500,
      avgViews: 100,
      avgLikes: 2,
      avgComments: 0,
      rawPayload: { liveStatus: null },
    });
    const result = calculateLivePotential(snapshot);
    expect(result.score).toBeLessThan(40);
  });

  it("gives high score for large accounts with live history", () => {
    const snapshot = makeSnapshot({
      followers: 2000000,
      avgViews: 100000,
      avgLikes: 5000,
      avgComments: 500,
      rawPayload: { liveStatus: "active" },
    });
    const result = calculateLivePotential(snapshot);
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it("gives moderate score for mid accounts without live", () => {
    const snapshot = makeSnapshot({
      followers: 100000,
      avgViews: 10000,
      avgLikes: 500,
      avgComments: 50,
      rawPayload: { liveStatus: null },
    });
    const result = calculateLivePotential(snapshot);
    expect(result.score).toBeGreaterThanOrEqual(30);
  });
});

describe("calculateProfessionalism", () => {
  it("gives low score for bare personal account", () => {
    const snapshot = makeSnapshot({
      isVerified: false,
      accountType: "personal",
      videoCount: 5,
      followers: 100,
      following: 90,
      rawPayload: {},
    });
    const result = calculateProfessionalism(snapshot);
    expect(result.score).toBeLessThan(40);
  });

  it("gives high score for verified business account with complete profile", () => {
    const snapshot = makeSnapshot({
      isVerified: true,
      accountType: "business",
      videoCount: 200,
      followers: 100000,
      following: 100,
      rawPayload: {
        profile: {
          avatarUrl: "https://example.com/avatar.jpg",
          displayName: "Official Brand",
          bio: "This is a detailed bio for the brand account",
        },
      },
    });
    const result = calculateProfessionalism(snapshot);
    // verified=25, profile=75, business=20, activity=20, ratio=15 → capped at 100
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it("always returns score between 0 and 100", () => {
    const snapshot = makeSnapshot();
    const result = calculateProfessionalism(snapshot);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe("calculateAccountStrength", () => {
  it("computes weighted average with all scores", () => {
    const result = calculateAccountStrength(80, 70, 60, 50, 90);
    // weights: engagement=30, content=20, consistency=20, growth=15, live=15
    // expected: (80*30 + 70*20 + 60*20 + 50*15 + 90*15) / 100
    // = (2400 + 1400 + 1200 + 750 + 1350) / 100 = 7100/100 = 71
    expect(result.score).toBe(71);
  });

  it("redistributes growth weight when growth is null", () => {
    const result = calculateAccountStrength(80, 70, 60, null, 90);
    // weights: engagement=30, content=20, consistency=20, live=15 → total=85
    // expected: (80*30 + 70*20 + 60*20 + 90*15) / 85
    // = (2400 + 1400 + 1200 + 1350) / 85 = 6350/85 ≈ 74.7 → 75
    expect(result.score).toBe(75);
  });

  it("caps score at 100", () => {
    const result = calculateAccountStrength(100, 100, 100, 100, 100);
    expect(result.score).toBe(100);
  });

  it("floors score at 0", () => {
    const result = calculateAccountStrength(0, 0, 0, 0, 0);
    expect(result.score).toBe(0);
  });
});

describe("calculateGrowthRate", () => {
  it("returns 50 for zero previous followers", () => {
    const current = makeSnapshot({ followers: 10000 });
    const previous = makeSnapshot({ followers: 0 });
    const result = calculateGrowthRate(current, previous);
    expect(result.score).toBe(50);
  });

  it("gives high score for 20%+ growth", () => {
    const current = makeSnapshot({ followers: 12000 });
    const previous = makeSnapshot({ followers: 10000 });
    const result = calculateGrowthRate(current, previous);
    expect(result.score).toBe(95);
  });

  it("gives medium score for 5-10% growth", () => {
    const current = makeSnapshot({ followers: 10500 });
    const previous = makeSnapshot({ followers: 10000 });
    const result = calculateGrowthRate(current, previous);
    expect(result.score).toBe(65);
  });

  it("gives low score for negative growth", () => {
    const current = makeSnapshot({ followers: 9000 });
    const previous = makeSnapshot({ followers: 10000 });
    const result = calculateGrowthRate(current, previous);
    expect(result.score).toBe(15);
  });

  it("gives 40 for 0% growth", () => {
    const current = makeSnapshot({ followers: 10000 });
    const previous = makeSnapshot({ followers: 10000 });
    const result = calculateGrowthRate(current, previous);
    expect(result.score).toBe(40);
  });
});
