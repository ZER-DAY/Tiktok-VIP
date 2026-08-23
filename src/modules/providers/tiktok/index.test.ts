import { describe, expect, it } from "vitest";
import { parseContentFromHTML } from "./index";

describe("TikTokProvider content parser", () => {
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
  });
});
