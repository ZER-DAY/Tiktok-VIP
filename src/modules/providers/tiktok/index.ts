import type { DataProvider, RawProfileData, RawContentItem, RawLiveStatus } from "../types";
import { fetchResearchRegionCode, isResearchApiConfigured } from "./research-api";
import {
  extractCreatorLeagueFromTikTokPayload,
  fetchCreatorLeagueFromTikTool,
} from "./live-league";
import type { TikTokLiveCreatorLeagueInfo } from "./live-league";
import { extractLiveAccountLevelFromPayload, fetchLiveAccountLevel } from "./live-account-level";
import type { TikTokLiveAccountLevelInfo } from "./live-account-level";

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
function getSigiState(html: string): Record<string, any> | null {
  const match = html.match(/<script\s+id="SIGI_STATE"[^>]*>([\s\S]*?)<\/script>/);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

export interface TikTokLivePageInfo {
  roomId: string | null;
  isLive: boolean;
  viewerCount: number | null;
  payload: Record<string, unknown> | null;
}

interface TikTokPublicRoomApiInfo {
  roomId: string | null;
  isLive: boolean;
  viewerCount: number | null;
  payload: Record<string, unknown> | null;
}

export function parseLivePageInfoFromHTML(html: string): TikTokLivePageInfo {
  const state = getSigiState(html);
  const info = state?.LiveRoom?.liveRoomUserInfo;
  const user = info?.user ?? {};
  const room = info?.liveRoom ?? {};
  const roomId = [user.roomId, room.roomId, room.id_str, room.id]
    .map((value) => (typeof value === "number" ? String(value) : value))
    .find((value): value is string => typeof value === "string" && /^\d{15,22}$/.test(value));
  const status = Number(room.status ?? user.status);
  const viewerCount = Number(room.liveRoomStats?.userCount);

  return {
    roomId: roomId ?? null,
    // TikTok room status 2 is LIVE; status 4 is an ended/offline room.
    isLive: status === 2,
    viewerCount: Number.isFinite(viewerCount) && viewerCount >= 0 ? viewerCount : null,
    payload: state,
  };
}

/**
 * TikTok's public api-live endpoint still exposes the last room id when the
 * creator is offline. This is useful because the profile HTML often omits
 * LiveRoom/SIGI_STATE entirely in that case. It is a direct TikTok request;
 * it does not use a proxy or a third-party data provider.
 */
async function fetchPublicRoomApiInfo(username: string): Promise<TikTokPublicRoomApiInfo | null> {
  const url = new URL(`${TIKTOK_BASE_URL}/api-live/user/room/`);
  url.searchParams.set("aid", "1988");
  url.searchParams.set("app_name", "tiktok_web");
  url.searchParams.set("device_platform", "web_pc");
  url.searchParams.set("uniqueId", username);
  url.searchParams.set("sourceType", "54");

  try {
    const response = await fetchWithRetry(
      url.toString(),
      { headers: { Referer: `${TIKTOK_BASE_URL}/@${username}/live` } },
      1
    );
    const payload = (await response.json()) as Record<string, unknown>;
    const data = payload.data;
    if (!data || typeof data !== "object") return null;

    const record = data as Record<string, unknown>;
    const user = record.user && typeof record.user === "object" ? record.user : {};
    const liveRoom = record.liveRoom && typeof record.liveRoom === "object" ? record.liveRoom : {};
    const userRecord = user as Record<string, unknown>;
    const roomRecord = liveRoom as Record<string, unknown>;
    const roomId = [userRecord.roomId, roomRecord.roomId, roomRecord.id_str, roomRecord.id]
      .map((value) => (typeof value === "number" ? String(value) : value))
      .find((value): value is string => typeof value === "string" && /^\d{15,22}$/.test(value));
    const status = Number(roomRecord.status ?? userRecord.status);
    const stats = roomRecord.liveRoomStats;
    const viewerCount =
      stats && typeof stats === "object"
        ? Number((stats as Record<string, unknown>).userCount)
        : NaN;

    return {
      roomId: roomId ?? null,
      isLive: status === 2,
      viewerCount: Number.isFinite(viewerCount) && viewerCount >= 0 ? viewerCount : null,
      payload,
    };
  } catch {
    return null;
  }
}

function getRoomOwnerPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  if (!root.data || typeof root.data !== "object") return null;
  const data = root.data as Record<string, unknown>;
  if (data.owner && typeof data.owner === "object") return data.owner;
  if (data.room && typeof data.room === "object") {
    return (data.room as Record<string, unknown>).owner ?? null;
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getUserInfo(data: Record<string, any> | null): Record<string, any> {
  return data?.["__DEFAULT_SCOPE__"]?.["webapp.user-detail"]?.userInfo ?? {};
}

const MIN_ACCOUNT_TIMESTAMP_SECONDS = Date.UTC(2014, 0, 1) / 1000;

function toValidAccountDate(timestampSeconds: number): string | null {
  const nowWithTolerance = Date.now() / 1000 + 24 * 60 * 60;
  if (
    !Number.isFinite(timestampSeconds) ||
    timestampSeconds < MIN_ACCOUNT_TIMESTAMP_SECONDS ||
    timestampSeconds > nowWithTolerance
  ) {
    return null;
  }

  const date = new Date(timestampSeconds * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseProfileCreateTime(value: unknown): string | null {
  if (typeof value !== "number" && typeof value !== "string") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const timestampSeconds = parsed > 10_000_000_000 ? parsed / 1000 : parsed;
  return toValidAccountDate(timestampSeconds);
}

/**
 * TikTok numeric IDs are snowflake-style IDs whose high 32 bits contain a
 * Unix timestamp. For a user ID, that timestamp is a strong estimate of when
 * TikTok issued the account ID.
 */
export function extractAccountCreatedAtFromUserId(userId: unknown): string | null {
  if (typeof userId !== "string" || !/^\d{15,22}$/.test(userId)) return null;

  try {
    const timestampSeconds = Number(BigInt(userId) >> BigInt(32));
    return toValidAccountDate(timestampSeconds);
  } catch {
    return null;
  }
}

export function parseProfileFromHTML(html: string, username: string): RawProfileData {
  const userInfo = getUserInfo(getUniversalData(html));
  const user = userInfo.user ?? {};
  const stats = userInfo.stats ?? {};
  const directCreatedAt = parseProfileCreateTime(user.createTime ?? user.create_time);
  const idCreatedAt = directCreatedAt ? null : extractAccountCreatedAtFromUserId(user.id);

  return {
    username: user.uniqueId ?? username,
    platformUserId: typeof user.id === "string" ? user.id : null,
    platformSecUid: typeof user.secUid === "string" ? user.secUid : null,
    platformRoomId: typeof user.roomId === "string" ? user.roomId : null,
    displayName: user.nickname ?? username,
    avatarUrl: user.avatarThumb ?? null,
    accountCreatedAt: directCreatedAt ?? idCreatedAt,
    accountCreatedAtSource: directCreatedAt
      ? "profile_create_time"
      : idCreatedAt
        ? "user_id_timestamp"
        : null,
    bio: user.signature ?? "",
    isVerified: user.verified ?? false,
    accountType: user.accountType === 1 ? "business" : "personal",
    followers: stats.followerCount ?? 0,
    following: stats.followingCount ?? 0,
    totalLikes: stats.heartCount ?? stats.heart ?? 0,
    videoCount: stats.videoCount ?? 0,
  };
}

function parseHashtags(post: Record<string, unknown>, description: string): string[] {
  const textExtra = Array.isArray(post.textExtra) ? post.textExtra : [];
  const structuredHashtags = textExtra
    .map((item) =>
      item && typeof item === "object" && "hashtagName" in item ? item.hashtagName : undefined
    )
    .filter((tag): tag is string => typeof tag === "string" && tag.length > 0);
  const inlineHashtags =
    description.match(/#[\p{L}\p{N}_]+/gu)?.map((tag: string) => tag.slice(1)) ?? [];

  return [...new Set([...structuredHashtags, ...inlineHashtags])];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parsePost(post: Record<string, any>): RawContentItem {
  const description = typeof post.desc === "string" ? post.desc : "";
  const locationCreated =
    typeof post.locationCreated === "string" && /^[a-z]{2}$/i.test(post.locationCreated.trim())
      ? post.locationCreated.trim().toUpperCase()
      : null;

  return {
    id: post.id ?? "",
    description,
    views: post.stats?.playCount ?? 0,
    likes: post.stats?.diggCount ?? 0,
    comments: post.stats?.commentCount ?? 0,
    shares: post.stats?.shareCount ?? 0,
    createdAt: parseCreateTime(post.createTime),
    duration: post.video?.duration ?? 0,
    hashtags: parseHashtags(post, description),
    regionCode: null,
    locationCreated,
  };
}

export function parseContentFromHTML(html: string): RawContentItem[] {
  const userInfo = getUserInfo(getUniversalData(html));
  const posts = Array.isArray(userInfo.itemList) ? userInfo.itemList : userInfo.itemModule?.posts;
  const items: RawContentItem[] = [];

  if (Array.isArray(posts)) {
    for (const p of posts) {
      items.push(parsePost(p));
    }
  }

  return items.slice(0, 20);
}

export function extractVideoIdsFromEmbedHTML(html: string): string[] {
  return [...new Set([...html.matchAll(/\/video\/(\d{15,22})/g)].map((match) => match[1]))];
}

export function parseVideoDetailFromHTML(html: string): RawContentItem | null {
  const data = getUniversalData(html);
  const post = data?.["__DEFAULT_SCOPE__"]?.["webapp.video-detail"]?.itemInfo?.itemStruct;
  return post && typeof post === "object" ? parsePost(post) : null;
}

async function fetchVideoDetails(username: string, videoIds: string[]): Promise<RawContentItem[]> {
  const results: RawContentItem[] = [];
  const batchSize = 5;

  for (let index = 0; index < videoIds.length; index += batchSize) {
    const batch = videoIds.slice(index, index + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (videoId) => {
        try {
          const response = await fetchWithRetry(
            `${TIKTOK_BASE_URL}/@${username}/video/${videoId}`,
            {},
            1
          );
          return parseVideoDetailFromHTML(await response.text());
        } catch {
          return null;
        }
      })
    );
    results.push(...batchResults.filter((item): item is RawContentItem => item !== null));
  }

  return results;
}

function parseCreateTime(value: unknown): string {
  if (typeof value === "number" || (typeof value === "string" && /^\d+$/.test(value))) {
    const date = new Date(Number(value) * 1000);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }

  return new Date().toISOString();
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

    let items = parseContentFromHTML(html).slice(0, limit);

    // TikTok often returns an empty profile itemList while still exposing the
    // public video links on its profile embed page. Video detail pages contain
    // the locationCreated country code requested by the product.
    if (items.length === 0) {
      try {
        const embedResponse = await fetchWithRetry(`${TIKTOK_BASE_URL}/embed/@${clean}`, {}, 1);
        const videoIds = extractVideoIdsFromEmbedHTML(await embedResponse.text()).slice(0, limit);
        items = await fetchVideoDetails(clean, videoIds);
      } catch (error) {
        console.warn(
          "TikTok embed video fallback failed:",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    } else if (items.some((item) => !item.locationCreated)) {
      const details = await fetchVideoDetails(clean, items.map((item) => item.id).filter(Boolean));
      const detailsById = new Map(details.map((item) => [item.id, item]));
      items = items.map((item) => detailsById.get(item.id) ?? item);
    }

    if (items.length > 0 && isResearchApiConfigured()) {
      try {
        const regionCode = await fetchResearchRegionCode(clean, new Date(items[0].createdAt));
        if (regionCode) {
          return items.map((item) => ({ ...item, regionCode }));
        }
      } catch (error) {
        // Region enrichment is optional and must not make the primary analysis fail.
        console.warn(
          "TikTok Research API region enrichment failed:",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    }

    return items;
  }

  async fetchLiveStatus(username: string, profile?: RawProfileData): Promise<RawLiveStatus | null> {
    const clean = username.replace(/^@/, "").trim();
    let publicRoomId = profile?.platformRoomId ?? null;
    let publicLiveStatus: Omit<
      RawLiveStatus,
      | "creatorLeague"
      | "creatorLeagueClassType"
      | "creatorLeagueSource"
      | "accountLevel"
      | "accountLevelSource"
    > | null = null;
    let publicLeague: TikTokLiveCreatorLeagueInfo | null = null;
    let publicAccountLevel: TikTokLiveAccountLevelInfo | null = null;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(`${TIKTOK_BASE_URL}/@${clean}/live`, {
        redirect: "follow",
        signal: controller.signal,
        headers: HEADERS,
      });
      clearTimeout(timeout);
      const html = await response.text();
      const publicPayload = getUniversalData(html);
      const livePage = parseLivePageInfoFromHTML(html);
      publicRoomId = livePage.roomId ?? publicRoomId;
      publicLeague =
        extractCreatorLeagueFromTikTokPayload(livePage.payload) ??
        extractCreatorLeagueFromTikTokPayload(publicPayload);
      publicAccountLevel =
        extractLiveAccountLevelFromPayload(livePage.payload) ??
        extractLiveAccountLevelFromPayload(publicPayload);
      publicLiveStatus = {
        isLive: livePage.isLive,
        startedAt: null,
        viewerCount: livePage.viewerCount,
      };
    } catch {
      // TikTok's public LIVE page can be blocked independently from the profile
      // page. The configured LIVE provider below can still return the league.
    }

    // The public live page can be rendered without LiveRoom data for offline
    // creators. TikTok's own api-live route provides the last room id and
    // current status, so use it as a direct first-party fallback.
    const publicApiLive = await fetchPublicRoomApiInfo(clean);
    if (publicApiLive) {
      publicRoomId = publicApiLive.roomId ?? publicRoomId;
      publicAccountLevel =
        publicAccountLevel ?? extractLiveAccountLevelFromPayload(publicApiLive.payload);
      if (
        !publicLiveStatus ||
        (!publicLiveStatus.isLive && publicApiLive.isLive) ||
        (publicLiveStatus.viewerCount === null && publicApiLive.viewerCount !== null)
      ) {
        publicLiveStatus = {
          isLive: publicApiLive.isLive,
          startedAt: null,
          viewerCount: publicApiLive.viewerCount,
        };
      }
    }

    if (!publicAccountLevel && /^\d{15,22}$/.test(publicRoomId ?? "")) {
      try {
        const roomInfoUrl = new URL("https://webcast.tiktok.com/webcast/room/info/");
        roomInfoUrl.searchParams.set("aid", "1988");
        roomInfoUrl.searchParams.set("room_id", publicRoomId!);
        const roomResponse = await fetchWithRetry(
          roomInfoUrl.toString(),
          { headers: { Referer: `${TIKTOK_BASE_URL}/@${clean}/live` } },
          1
        );
        const roomPayload = await roomResponse.json();
        publicAccountLevel = extractLiveAccountLevelFromPayload(
          getRoomOwnerPayload(roomPayload),
          "tiktok_room_info"
        );
      } catch {
        // A previous room ID can remain on the profile after a stream ends.
      }
    }

    const creatorLeague = publicLeague ?? (await fetchCreatorLeagueFromTikTool(clean));
    const accountLevel =
      publicAccountLevel ??
      (await fetchLiveAccountLevel(clean, {
        userId: profile?.platformUserId,
        secUid: profile?.platformSecUid,
      }));
    if (!publicLiveStatus && !creatorLeague && !accountLevel) return null;

    return {
      ...(publicLiveStatus ?? { isLive: false, startedAt: null, viewerCount: null }),
      creatorLeague: creatorLeague?.league ?? null,
      creatorLeagueClassType: creatorLeague?.classType ?? null,
      creatorLeagueSource: creatorLeague?.source ?? null,
      accountLevel: accountLevel?.level ?? null,
      accountLevelSource: accountLevel?.source ?? null,
    };
  }
}
