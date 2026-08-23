import type { DataProvider, RawProfileData, RawContentItem, RawLiveStatus } from "../types";

const TIKTOK_BASE_URL = "https://www.tiktok.com";
const REQUEST_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 2000;

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: { ...HEADERS, ...options.headers },
      });

      clearTimeout(timeout);

      if (response.ok) return response;

      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`HTTP ${response.status}`);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY * Math.pow(2, attempt)));
          continue;
        }
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, RETRY_BASE_DELAY * Math.pow(2, attempt)));
        continue;
      }
    }
  }
  throw lastError ?? new Error("Max retries exceeded");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getUniversalData(html: string): Record<string, any> | null {
  const match = html.match(
    /<script\s+id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getUserInfo(data: Record<string, any> | null): Record<string, any> {
  return data?.["__DEFAULT_SCOPE__"]?.["webapp.user-detail"]?.userInfo ?? {};
}

function parseProfileFromHTML(html: string, username: string): RawProfileData {
  const userInfo = getUserInfo(getUniversalData(html));
  const user = userInfo.user ?? {};
  const stats = userInfo.stats ?? {};

  return {
    username: user.uniqueId ?? username,
    displayName: user.nickname ?? username,
    avatarUrl: user.avatarThumb ?? null,
    bio: user.signature ?? "",
    isVerified: user.verified ?? false,
    accountType: user.accountType === 1 ? "business" : "personal",
    followers: stats.followerCount ?? 0,
    following: stats.followingCount ?? 0,
    totalLikes: stats.heartCount ?? stats.heart ?? 0,
    videoCount: stats.videoCount ?? 0,
  };
}

export function parseContentFromHTML(html: string): RawContentItem[] {
  const userInfo = getUserInfo(getUniversalData(html));
  const posts = Array.isArray(userInfo.itemList) ? userInfo.itemList : userInfo.itemModule?.posts;
  const items: RawContentItem[] = [];

  if (Array.isArray(posts)) {
    for (const p of posts) {
      const desc: string = p.desc ?? "";
      const structuredHashtags = Array.isArray(p.textExtra)
        ? p.textExtra
            .map((item: { hashtagName?: string }) => item.hashtagName)
            .filter((tag: unknown): tag is string => typeof tag === "string" && tag.length > 0)
        : [];
      const inlineHashtags =
        desc.match(/#[\p{L}\p{N}_]+/gu)?.map((tag: string) => tag.slice(1)) ?? [];
      items.push({
        id: p.id ?? "",
        description: desc,
        views: p.stats?.playCount ?? 0,
        likes: p.stats?.diggCount ?? 0,
        comments: p.stats?.commentCount ?? 0,
        shares: p.stats?.shareCount ?? 0,
        createdAt: p.createTime ?? new Date().toISOString(),
        duration: p.video?.duration ?? 0,
        hashtags: [...new Set([...structuredHashtags, ...inlineHashtags])],
      });
    }
  }

  return items.slice(0, 20);
}

export class TikTokProvider implements DataProvider {
  key = "tiktok" as const;

  async fetchProfile(username: string): Promise<RawProfileData> {
    const clean = username.replace(/^@/, "").trim();
    if (!/^[a-zA-Z0-9._]{1,24}$/.test(clean)) {
      throw new Error(`Invalid TikTok username: ${clean}`);
    }

    const response = await fetchWithRetry(`${TIKTOK_BASE_URL}/@${clean}`);
    const html = await response.text();

    if (!html.includes("__UNIVERSAL_DATA_FOR_REHYDRATION__")) {
      throw new Error(
        "TikTok returned an unexpected page (possible anti-bot block). Try again later."
      );
    }

    return parseProfileFromHTML(html, clean);
  }

  async fetchRecentContent(username: string, limit = 20): Promise<RawContentItem[]> {
    const clean = username.replace(/^@/, "").trim();
    if (!/^[a-zA-Z0-9._]{1,24}$/.test(clean)) {
      throw new Error(`Invalid TikTok username: ${clean}`);
    }

    const response = await fetchWithRetry(`${TIKTOK_BASE_URL}/@${clean}`);
    const html = await response.text();

    return parseContentFromHTML(html).slice(0, limit);
  }

  async fetchLiveStatus(username: string): Promise<RawLiveStatus | null> {
    const clean = username.replace(/^@/, "").trim();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${TIKTOK_BASE_URL}/@${clean}/live`, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
        headers: HEADERS,
      });
      clearTimeout(timeout);
      return {
        isLive: !response.url.includes("/live") || response.ok,
        startedAt: null,
        viewerCount: null,
      };
    } catch {
      return null;
    }
  }
}
