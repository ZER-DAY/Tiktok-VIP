import { describe, it, expect } from "vitest";
import { generateInsights } from "./rules";
import type { SnapshotInput } from "./scores";

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
      profile: { avatarUrl: "url", displayName: "Test", bio: "Test bio" },
      content: [],
    },
    ...overrides,
  };
}

describe("generateInsights", () => {
  it("returns an array of insights", () => {
    const snapshot = makeSnapshot();
    const insights = generateInsights(snapshot, 5, 30);
    expect(Array.isArray(insights)).toBe(true);
    expect(insights.length).toBeGreaterThan(0);
  });

  it("detects high engagement strength", () => {
    const snapshot = makeSnapshot({
      followers: 5000,
      avgViews: 1000,
      avgLikes: 80,
      avgComments: 15,
      avgShares: 10,
    });
    // engagement = (80+15+10)/1000*100 = 10.5%, micro.good = 5% → above good
    const insights = generateInsights(snapshot, 10.5, 100);
    const highEngagement = insights.find((i) => i.title === "معدل تفاعل مرتفع");
    expect(highEngagement).toBeDefined();
  });

  it("detects verified account strength", () => {
    const snapshot = makeSnapshot({ isVerified: true });
    const insights = generateInsights(snapshot, 5, 30);
    const verified = insights.find((i) => i.title === "حساب موثّق");
    expect(verified).toBeDefined();
  });

  it("detects business account strength", () => {
    const snapshot = makeSnapshot({ accountType: "business" });
    const insights = generateInsights(snapshot, 5, 30);
    const business = insights.find((i) => i.title === "حساب أعمال");
    expect(business).toBeDefined();
  });

  it("detects high views ratio strength", () => {
    const snapshot = makeSnapshot();
    const insights = generateInsights(snapshot, 5, 60); // viewsToFollowers > 50
    const highViews = insights.find((i) => i.title === "نسبة مشاهدات مرتفعة");
    expect(highViews).toBeDefined();
  });

  it("detects large audience strength", () => {
    const snapshot = makeSnapshot({ followers: 200000 });
    const insights = generateInsights(snapshot, 5, 30);
    const largeAudience = insights.find((i) => i.title === "جمهور واسع");
    expect(largeAudience).toBeDefined();
  });

  it("detects low engagement weakness", () => {
    const snapshot = makeSnapshot({
      followers: 5000,
      avgViews: 10000,
      avgLikes: 10,
      avgComments: 2,
      avgShares: 1,
    });
    // engagement = (10+2+1)/10000*100 = 0.13%, micro.poor = 1.5% → below poor
    const insights = generateInsights(snapshot, 0.13, 100);
    const lowEngagement = insights.find((i) => i.title === "معدل تفاعل منخفض");
    expect(lowEngagement).toBeDefined();
  });

  it("detects high following ratio weakness", () => {
    const snapshot = makeSnapshot({ followers: 10000, following: 9000 });
    const insights = generateInsights(snapshot, 5, 30);
    const highFollowing = insights.find(
      (i) => i.title === "نسبة المتابعة مرتفعة مقارنة بالمتابعين"
    );
    expect(highFollowing).toBeDefined();
  });

  it("detects start live recommendation for 10k+ followers", () => {
    const snapshot = makeSnapshot({ followers: 15000 });
    const insights = generateInsights(snapshot, 5, 30);
    const startLive = insights.find((i) => i.title === "ابدأ البث المباشر");
    expect(startLive).toBeDefined();
  });

  it("does not recommend live for small accounts", () => {
    const snapshot = makeSnapshot({ followers: 5000 });
    const insights = generateInsights(snapshot, 5, 30);
    const startLive = insights.find((i) => i.title === "ابدأ البث المباشر");
    expect(startLive).toBeUndefined();
  });

  it("each insight has required fields", () => {
    const snapshot = makeSnapshot({ isVerified: true, accountType: "business", followers: 200000 });
    const insights = generateInsights(snapshot, 10, 60);
    for (const insight of insights) {
      expect(insight).toHaveProperty("type");
      expect(insight).toHaveProperty("title");
      expect(insight).toHaveProperty("description");
      expect(insight).toHaveProperty("evidenceRef");
      expect(insight).toHaveProperty("order");
      expect(["strength", "weakness", "recommendation"]).toContain(insight.type);
    }
  });
});
