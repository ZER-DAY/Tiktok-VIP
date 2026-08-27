import { describe, it, expect } from "vitest";
import { analyzeAudience } from "./audience";
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
    countryGuess: null,
    countryGuessConfidence: 0,
    rawPayload: { profile: { avatarUrl: "url", displayName: "Test", bio: "Test bio" } },
    ...overrides,
  };
}

describe("analyzeAudience", () => {
  it("detects Arabic language from Arabic content", () => {
    const snapshot = makeSnapshot();
    const videos = [
      {
        description: "فيديو جديد عن الرياض",
        hashtags: ["الرياض"],
        createdAt: "2024-01-01T12:00:00Z",
      },
    ];
    const result = analyzeAudience(snapshot, videos);
    expect(result.languageGuess).toBe("ar");
  });

  it("detects English language from English content", () => {
    const snapshot = makeSnapshot();
    const videos = [
      {
        description: "New video about technology",
        hashtags: ["tech"],
        createdAt: "2024-01-01T12:00:00Z",
      },
    ];
    const result = analyzeAudience(snapshot, videos);
    expect(result.languageGuess).toBe("en");
  });

  it("detects Saudi Arabia from hashtags", () => {
    const snapshot = makeSnapshot();
    const videos = [
      {
        description: "رحلة إلى الرياض",
        hashtags: ["الرياض", "saudi", "riyadh"],
        createdAt: "2024-01-01T12:00:00Z",
      },
    ];
    const result = analyzeAudience(snapshot, videos);
    expect(result.countryGuess).toBe("Saudi Arabia");
    expect(result.countryConfidence).toBeGreaterThanOrEqual(0.4);
  });

  it("detects Egypt from hashtags", () => {
    const snapshot = makeSnapshot();
    const videos = [
      {
        description: "من القاهرة",
        hashtags: ["مصر", "egypt", "cairo"],
        createdAt: "2024-01-01T12:00:00Z",
      },
    ];
    const result = analyzeAudience(snapshot, videos);
    expect(result.countryGuess).toBe("Egypt");
  });

  it("raises confidence when the same country appears across multiple videos", () => {
    const snapshot = makeSnapshot();
    const result = analyzeAudience(snapshot, [
      {
        description: "يوم جميل في الرياض",
        hashtags: ["السعودية"],
        createdAt: "2024-01-01T12:00:00Z",
      },
      {
        description: "فعاليات موسم الرياض",
        hashtags: ["riyadh"],
        createdAt: "2024-01-02T12:00:00Z",
      },
      { description: "من قلب جدة", hashtags: ["jeddah"], createdAt: "2024-01-03T12:00:00Z" },
    ]);

    expect(result.countryGuess).toBe("Saudi Arabia");
    expect(result.countryConfidence).toBeGreaterThanOrEqual(0.8);
    expect(result.countryEvidenceCount).toBeGreaterThanOrEqual(3);
    expect(result.analyzedVideos).toBe(3);
  });

  it("returns null country when confidence is low", () => {
    const snapshot = makeSnapshot();
    const videos = [
      { description: "Hello world", hashtags: ["hello"], createdAt: "2024-01-01T12:00:00Z" },
    ];
    const result = analyzeAudience(snapshot, videos);
    expect(result.countryGuess).toBeNull();
    expect(result.countrySource).toBeNull();
  });

  it("prioritizes official TikTok region_code over text inference", () => {
    const snapshot = makeSnapshot();
    const result = analyzeAudience(snapshot, [
      {
        description: "رحلة إلى القاهرة #مصر",
        hashtags: ["مصر", "القاهرة"],
        createdAt: "2024-01-01T12:00:00Z",
        regionCode: "SA",
      },
    ]);

    expect(result.countryGuess).toBe("Saudi Arabia");
    expect(result.countryRegionCode).toBe("SA");
    expect(result.countrySource).toBe("region_code");
    expect(result.countryConfidence).toBe(1);
  });

  it("uses the majority locationCreated as the account registration country", () => {
    const snapshot = makeSnapshot();
    const videos = ["AE", "AE", "AE", "AE", "AE", "SA"].map((locationCreated, index) => ({
      description: "",
      hashtags: [],
      createdAt: `2024-01-0${index + 1}T12:00:00Z`,
      locationCreated,
    }));

    const result = analyzeAudience(snapshot, videos);

    expect(result.countryGuess).toBe("UAE");
    expect(result.countryRegionCode).toBe("AE");
    expect(result.countrySource).toBe("location_created");
    expect(result.countryEvidenceCount).toBe(5);
    expect(result.countryConfidence).toBeCloseTo(5 / 6);
  });

  it("calculates best posting times", () => {
    const snapshot = makeSnapshot();
    const videos = [
      { description: "Morning post", hashtags: [], createdAt: "2024-01-01T08:00:00Z" },
      { description: "Morning post 2", hashtags: [], createdAt: "2024-01-02T08:00:00Z" },
      { description: "Evening post", hashtags: [], createdAt: "2024-01-01T18:00:00Z" },
    ];
    const result = analyzeAudience(snapshot, videos);
    expect(result.bestPostingTimes.length).toBeGreaterThan(0);
    expect(result.bestPostingTimes[0].score).toBeGreaterThan(0);
  });

  it("always has valid confidence ranges", () => {
    const snapshot = makeSnapshot();
    const videos = [{ description: "Test", hashtags: ["test"], createdAt: "2024-01-01T12:00:00Z" }];
    const result = analyzeAudience(snapshot, videos);
    expect(result.countryConfidence).toBeGreaterThanOrEqual(0);
    expect(result.countryConfidence).toBeLessThanOrEqual(1);
    expect(result.languageConfidence).toBeGreaterThanOrEqual(0);
    expect(result.languageConfidence).toBeLessThanOrEqual(1);
  });
});
