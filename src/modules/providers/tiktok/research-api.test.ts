import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearResearchApiTokenCache, fetchResearchRegionCode } from "./research-api";

describe("TikTok Research API region lookup", () => {
  beforeEach(() => {
    process.env.TIKTOK_RESEARCH_CLIENT_KEY = "test-key";
    process.env.TIKTOK_RESEARCH_CLIENT_SECRET = "test-secret";
    clearResearchApiTokenCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TIKTOK_RESEARCH_CLIENT_KEY;
    delete process.env.TIKTOK_RESEARCH_CLIENT_SECRET;
    clearResearchApiTokenCache();
  });

  it("authenticates and returns the most frequent valid region_code", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "token", expires_in: 7200 }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            data: {
              videos: [{ region_code: "sa" }, { region_code: "SA" }, { region_code: "EG" }],
            },
            error: { code: "ok", message: "" },
          }),
          { status: 200 }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchResearchRegionCode("creator", new Date("2026-08-24T00:00:00Z"));

    expect(result).toBe("SA");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const query = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(query.start_date).toBe("20260726");
    expect(query.end_date).toBe("20260824");
    expect(query.query.and[0].field_values).toEqual(["creator"]);
  });

  it("does not call TikTok when credentials are absent", async () => {
    delete process.env.TIKTOK_RESEARCH_CLIENT_KEY;
    delete process.env.TIKTOK_RESEARCH_CLIENT_SECRET;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchResearchRegionCode("creator")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
