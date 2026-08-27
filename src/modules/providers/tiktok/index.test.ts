import { describe, expect, it } from "vitest";
import {
  extractAccountCreatedAtFromUserId,
  extractVideoIdsFromEmbedHTML,
  parseContentFromHTML,
  parseLivePageInfoFromHTML,
  parseProfileFromHTML,
  parseVideoDetailFromHTML,
} from "./index";

describe("TikTokProvider content parser", () => {
  it("uses the profile createTime as the account creation date when available", () => {
    const payload = {
      __DEFAULT_SCOPE__: {
        "webapp.user-detail": {
          userInfo: {
            user: {
              id: "6900000000000000000",
              uniqueId: "creator",
              createTime: "1609459200",
            },
            stats: {},
          },
        },
      },
    };
    const html = `<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">${JSON.stringify(payload)}</script>`;

    const profile = parseProfileFromHTML(html, "creator");

    expect(profile.accountCreatedAt).toBe("2021-01-01T00:00:00.000Z");
    expect(profile.accountCreatedAtSource).toBe("profile_create_time");
  });

  it("extracts an estimated account creation date from a TikTok user ID", () => {
    const timestampSeconds = BigInt(1_609_459_200);
    const userId = ((timestampSeconds << BigInt(32)) + BigInt(1234)).toString();

    expect(extractAccountCreatedAtFromUserId(userId)).toBe("2021-01-01T00:00:00.000Z");
  });

  it("rejects invalid and future TikTok user ID timestamps", () => {
    const futureTimestamp = BigInt(Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60);

    expect(extractAccountCreatedAtFromUserId("not-a-user-id")).toBeNull();
    expect(
      extractAccountCreatedAtFromUserId((futureTimestamp << BigInt(32)).toString())
    ).toBeNull();
  });

  it("parses the current itemList payload and Arabic hashtags", () => {
    const payload = {
      __DEFAULT_SCOPE__: {
        "webapp.user-detail": {
          userInfo: {
            itemList: [
              {
                id: "video-1",
                desc: "جولة في الرياض #السعودية",
                createTime: "1700000000",
                stats: { playCount: 1000, diggCount: 100, commentCount: 10, shareCount: 5 },
                video: { duration: 20 },
                textExtra: [{ hashtagName: "الرياض" }],
              },
            ],
          },
        },
      },
    };
    const html = `<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">${JSON.stringify(payload)}</script>`;
    const items = parseContentFromHTML(html);

    expect(items).toHaveLength(1);
    expect(items[0].hashtags).toEqual(expect.arrayContaining(["الرياض", "السعودية"]));
    expect(items[0].views).toBe(1000);
    expect(items[0].createdAt).toBe("2023-11-14T22:13:20.000Z");
    expect(items[0].regionCode).toBeNull();
    expect(items[0].locationCreated).toBeNull();
  });

  it("extracts unique video IDs from a profile embed page", () => {
    const html = `
      <a href="/@creator/video/7544762373257645313">one</a>
      <a href="/@creator/video/7542877342381788423">two</a>
      <a href="/@creator/video/7544762373257645313">duplicate</a>
    `;

    expect(extractVideoIdsFromEmbedHTML(html)).toEqual([
      "7544762373257645313",
      "7542877342381788423",
    ]);
  });

  it("parses locationCreated from a public video detail page", () => {
    const payload = {
      __DEFAULT_SCOPE__: {
        "webapp.video-detail": {
          itemInfo: {
            itemStruct: {
              id: "7544762373257645313",
              desc: "من دبي #primelive",
              createTime: "1756651907",
              locationCreated: "ae",
              stats: { playCount: 100, diggCount: 10, commentCount: 2, shareCount: 1 },
              video: { duration: 15 },
              textExtra: [{ hashtagName: "primelive" }],
            },
          },
        },
      },
    };
    const html = `<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">${JSON.stringify(payload)}</script>`;

    const item = parseVideoDetailFromHTML(html);

    expect(item?.id).toBe("7544762373257645313");
    expect(item?.locationCreated).toBe("AE");
    expect(item?.hashtags).toContain("primelive");
  });

  it("extracts the room ID and actual LIVE status from SIGI_STATE", () => {
    const state = {
      LiveRoom: {
        liveRoomUserInfo: {
          user: { roomId: "7676556659598805778", status: 2 },
          liveRoom: { status: 2, liveRoomStats: { userCount: 97 } },
        },
      },
    };
    const html = `<script id="SIGI_STATE" type="application/json">${JSON.stringify(state)}</script>`;

    expect(parseLivePageInfoFromHTML(html)).toMatchObject({
      roomId: "7676556659598805778",
      isLive: true,
      viewerCount: 97,
    });
  });

  it("recognizes status 4 as an ended LIVE room", () => {
    const state = {
      LiveRoom: {
        liveRoomUserInfo: {
          user: { roomId: "7676556659598805778", status: 4 },
          liveRoom: { status: 4 },
        },
      },
    };
    const html = `<script id="SIGI_STATE">${JSON.stringify(state)}</script>`;

    expect(parseLivePageInfoFromHTML(html)).toMatchObject({
      roomId: "7676556659598805778",
      isLive: false,
    });
  });
});
