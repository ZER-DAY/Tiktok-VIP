import { describe, expect, it } from "vitest";
import {
  creatorLeagueFromClassType,
  extractCreatorLeagueFromTikTokPayload,
  getStoredCreatorLeague,
  parseTikToolGiftGallery,
} from "./live-league";

describe("TikTok LIVE Creator League", () => {
  it("maps TikTok protobuf class types to the exact Creator League", () => {
    expect(creatorLeagueFromClassType(100)).toBe("D5");
    expect(creatorLeagueFromClassType(500)).toBe("D1");
    expect(creatorLeagueFromClassType(600)).toBe("C5");
    expect(creatorLeagueFromClassType(1000)).toBe("C1");
    expect(creatorLeagueFromClassType(1600)).toBe("A5");
    expect(creatorLeagueFromClassType(2000)).toBe("A1");
    expect(creatorLeagueFromClassType(2100)).toBe("S");
    expect(creatorLeagueFromClassType(0)).toBeNull();
    expect(creatorLeagueFromClassType(42)).toBeNull();
  });

  it("extracts ClassInfo from a TikTok RankUpdate payload", () => {
    const info = extractCreatorLeagueFromTikTokPayload({
      rankUpdate: {
        updatesList: [{ ownerRank: 4, classInfo: { classType: 1000, starCount: "3" } }],
      },
    });

    expect(info).toEqual({
      league: "C1",
      classType: 1000,
      source: "tiktok_live_payload",
    });
  });

  it("extracts the class_type from a TikTok Gift Gallery payload", () => {
    const info = extractCreatorLeagueFromTikTokPayload({
      data: {
        normal_gifts: [],
        current_period_starts_at: 1,
        class_type: 1900,
      },
    });

    expect(info?.league).toBe("A2");
  });

  it("does not confuse gifter payGrade or anchor experience with Creator League", () => {
    expect(
      extractCreatorLeagueFromTikTokPayload({
        user: { payGrade: { level: 37 }, webcastAnchorLevel: { level: 21 } },
      })
    ).toBeNull();
  });

  it("parses a real TikTool Gift Gallery response", () => {
    expect(parseTikToolGiftGallery({ status_code: 0, data: { class_type: 1300 } })).toEqual({
      league: "B3",
      classType: 1300,
      source: "tiktool_gift_gallery",
    });
  });

  it("rejects TikTool static sample data", () => {
    expect(
      parseTikToolGiftGallery({
        status_code: 0,
        is_sample: true,
        source: "sample",
        data: { class_type: 600 },
      })
    ).toBeNull();
  });

  it("validates a persisted Creator League result", () => {
    expect(
      getStoredCreatorLeague({
        liveStatus: {
          creatorLeague: "C1",
          creatorLeagueClassType: 1000,
          creatorLeagueSource: "tiktool_gift_gallery",
        },
      })
    ).toEqual({
      league: "C1",
      classType: 1000,
      source: "tiktool_gift_gallery",
    });

    expect(
      getStoredCreatorLeague({
        liveStatus: {
          creatorLeague: "C1",
          creatorLeagueClassType: 600,
          creatorLeagueSource: "tiktool_gift_gallery",
        },
      })
    ).toBeNull();
  });
});
