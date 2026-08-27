export type TikTokLiveAccountLevelSource =
  "tiktok_live_payload" | "tiktok_room_info" | "tiktool_user_profile" | "tikhub_webcast_user_info";

export interface TikTokLiveAccountLevelInfo {
  level: number;
  source: TikTokLiveAccountLevelSource;
}

export function isLiveAccountLevelProviderConfigured(): boolean {
  return Boolean(process.env.TIKTOOL_API_KEY?.trim() || process.env.TIKHUB_API_KEY?.trim());
}

function normalizeLiveAccountLevel(value: unknown): number | null {
  const parsed =
    typeof value === "string" && /^\d+$/.test(value.trim()) ? Number(value.trim()) : value;
  if (typeof parsed !== "number" || !Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    return null;
  }
  return parsed;
}

/**
 * Reads the numeric account level shown inside TikTok LIVE. TikTok calls the
 * viewer/gifter level payGrade and some user-profile payloads expose creator
 * progression as webcastAnchorLevel. Creator League ClassInfo (for example C1)
 * is intentionally handled by the separate live-league module.
 */
export function extractLiveAccountLevelFromPayload(
  payload: unknown,
  source: TikTokLiveAccountLevelSource = "tiktok_live_payload"
): TikTokLiveAccountLevelInfo | null {
  const seen = new WeakSet<object>();

  function visit(value: unknown, depth = 0): TikTokLiveAccountLevelInfo | null {
    if (!value || typeof value !== "object" || depth > 40 || seen.has(value)) return null;
    seen.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = visit(item, depth + 1);
        if (result) return result;
      }
      return null;
    }

    const record = value as Record<string, unknown>;
    for (const key of [
      "payGrade",
      "pay_grade",
      "webcastAnchorLevel",
      "webcast_anchor_level",
      "anchorLevel",
      "anchor_level",
    ]) {
      const container = record[key];
      if (container && typeof container === "object") {
        const level = normalizeLiveAccountLevel((container as Record<string, unknown>).level);
        if (level) return { level, source };
      }
    }

    for (const child of Object.values(record)) {
      const result = visit(child, depth + 1);
      if (result) return result;
    }
    return null;
  }

  return visit(payload);
}

async function fetchJson(url: URL, headers: Record<string, string>): Promise<unknown | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, { headers, signal: controller.signal });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn(
      "TikTok LIVE account level enrichment failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchLevelFromTikTool(username: string): Promise<TikTokLiveAccountLevelInfo | null> {
  const apiKey = process.env.TIKTOOL_API_KEY?.trim();
  if (!apiKey) return null;

  const url = new URL("https://api.tik.tools/webcast/user_profile");
  url.searchParams.set("unique_id", username);
  url.searchParams.set("username", username);
  url.searchParams.set("uniqueId", username);
  const payload = await fetchJson(url, { "x-api-key": apiKey, Accept: "application/json" });
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  if (root.is_sample === true || root.source === "sample") return null;
  return extractLiveAccountLevelFromPayload(payload, "tiktool_user_profile");
}

async function fetchLevelFromTikHub(identifiers: {
  userId?: string | null;
  secUid?: string | null;
}): Promise<TikTokLiveAccountLevelInfo | null> {
  const apiKey = process.env.TIKHUB_API_KEY?.trim();
  if (!apiKey) return null;

  const secUid = identifiers.secUid?.trim();
  const userId = identifiers.userId?.trim();
  if (!secUid && !userId) return null;

  const url = new URL("https://api.tikhub.io/api/v1/tiktok/app/v3/fetch_webcast_user_info");
  if (secUid) url.searchParams.set("sec_user_id", secUid);
  else if (userId) url.searchParams.set("user_id", userId);

  const payload = await fetchJson(url, {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
  });
  return extractLiveAccountLevelFromPayload(payload, "tikhub_webcast_user_info");
}

export async function fetchLiveAccountLevel(
  username: string,
  identifiers: { userId?: string | null; secUid?: string | null } = {}
): Promise<TikTokLiveAccountLevelInfo | null> {
  const clean = username.replace(/^@/, "").trim();
  return (await fetchLevelFromTikTool(clean)) ?? (await fetchLevelFromTikHub(identifiers));
}

export function getStoredLiveAccountLevel(rawPayload: unknown): TikTokLiveAccountLevelInfo | null {
  if (!rawPayload || typeof rawPayload !== "object") return null;
  const liveStatus = (rawPayload as Record<string, unknown>).liveStatus;
  if (!liveStatus || typeof liveStatus !== "object") return null;

  const value = liveStatus as Record<string, unknown>;
  const level = normalizeLiveAccountLevel(value.accountLevel);
  const source = value.accountLevelSource;
  if (
    !level ||
    (source !== "tiktok_live_payload" &&
      source !== "tiktok_room_info" &&
      source !== "tiktool_user_profile" &&
      source !== "tikhub_webcast_user_info")
  ) {
    return null;
  }
  return { level, source };
}
