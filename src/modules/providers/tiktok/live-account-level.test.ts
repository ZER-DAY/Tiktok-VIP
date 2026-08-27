import { afterEach, describe, expect, it, vi } from "vitest";
import {
  extractLiveAccountLevelFromPayload,
  fetchLiveAccountLevel,
  getStoredLiveAccountLevel,
} from "./live-account-level";

describe("TikTok LIVE account level", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("extracts webcastAnchorLevel.level from a LIVE user", () => {
    expect(
      extractLiveAccountLevelFromPayload({
        data: { user: { webcastAnchorLevel: { level: 23, experience: "1200" } } },
      })
    ).toEqual({ level: 23, source: "tiktok_live_payload" });
  });

  it("supports the mobile API snake_case field", () => {
    expect(
      extractLiveAccountLevelFromPayload(
        { data: { user: { webcast_anchor_level: { level: "23" } } } },
        "tikhub_webcast_user_info"
      )
    ).toEqual({ level: 23, source: "tikhub_webcast_user_info" });
  });

  it("extracts the payGrade level displayed for an account inside LIVE", () => {
    expect(
      extractLiveAccountLevelFromPayload({
        user: { payGrade: { level: 23 }, classInfo: { classType: 1000 } },
      })
    ).toEqual({ level: 23, source: "tiktok_live_payload" });
    expect(
      extractLiveAccountLevelFromPayload(
        { user: { pay_grade: { level: "23" } } },
        "tiktok_room_info"
      )
    ).toEqual({ level: 23, source: "tiktok_room_info" });
  });

  it("does not confuse Creator League with the numeric LIVE account level", () => {
    expect(
      extractLiveAccountLevelFromPayload({
        user: { classInfo: { classType: 1000 }, creatorLeague: "C1" },
      })
    ).toBeNull();
  });

  it("validates a persisted LIVE account level", () => {
    expect(
      getStoredLiveAccountLevel({
        liveStatus: { accountLevel: 23, accountLevelSource: "tiktok_live_payload" },
      })
    ).toEqual({ level: 23, source: "tiktok_live_payload" });
    expect(
      getStoredLiveAccountLevel({
        liveStatus: { accountLevel: 101, accountLevelSource: "tiktok_live_payload" },
      })
    ).toBeNull();
    expect(
      getStoredLiveAccountLevel({
        liveStatus: { accountLevel: 23, accountLevelSource: "tiktok_room_info" },
      })
    ).toEqual({ level: 23, source: "tiktok_room_info" });
  });

  it("reads level 23 from TikTool user_profile when configured", async () => {
    vi.stubEnv("TIKTOOL_API_KEY", "test-tiktool-key");
    vi.stubEnv("TIKHUB_API_KEY", "");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { user: { payGrade: { level: 23 } } } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchLiveAccountLevel("primelive1")).resolves.toEqual({
      level: 23,
      source: "tiktool_user_profile",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/webcast/user_profile" }),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-api-key": "test-tiktool-key" }),
      })
    );
  });

  it("uses TikHub webcast user info with the public profile secUid", async () => {
    vi.stubEnv("TIKTOOL_API_KEY", "");
    vi.stubEnv("TIKHUB_API_KEY", "test-tikhub-key");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ data: { data: { user: { pay_grade: { level: 23 } } } } }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      fetchLiveAccountLevel("primelive1", { secUid: "MS4wLjABAAAA-test" })
    ).resolves.toEqual({ level: 23, source: "tikhub_webcast_user_info" });

    const requestUrl = fetchMock.mock.calls[0][0] as URL;
    expect(requestUrl.pathname).toBe("/api/v1/tiktok/app/v3/fetch_webcast_user_info");
    expect(requestUrl.searchParams.get("sec_user_id")).toBe("MS4wLjABAAAA-test");
    expect(fetchMock.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer test-tikhub-key" }),
      })
    );
  });
});
