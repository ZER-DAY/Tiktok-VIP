export const TIKTOK_LIVE_CREATOR_LEAGUES = [
  "D5",
  "D4",
  "D3",
  "D2",
  "D1",
  "C5",
  "C4",
  "C3",
  "C2",
  "C1",
  "B5",
  "B4",
  "B3",
  "B2",
  "B1",
  "A5",
  "A4",
  "A3",
  "A2",
  "A1",
  "S",
] as const;

export type TikTokLiveCreatorLeague = (typeof TIKTOK_LIVE_CREATOR_LEAGUES)[number];

export type TikTokLiveCreatorLeagueSource = "tiktok_live_payload" | "tiktool_gift_gallery";

export interface TikTokLiveCreatorLeagueInfo {
  league: TikTokLiveCreatorLeague;
  classType: number;
  source: TikTokLiveCreatorLeagueSource;
}

const CLASS_TYPE_TO_LEAGUE = new Map<number, TikTokLiveCreatorLeague>(
  TIKTOK_LIVE_CREATOR_LEAGUES.map((league, index) => [(index + 1) * 100, league])
);

const LEAGUE_TO_CLASS_TYPE = new Map<TikTokLiveCreatorLeague, number>(
  [...CLASS_TYPE_TO_LEAGUE].map(([classType, league]) => [league, classType])
);

const CREATOR_LEAGUE_SET = new Set<string>(TIKTOK_LIVE_CREATOR_LEAGUES);

export function creatorLeagueFromClassType(value: unknown): TikTokLiveCreatorLeague | null {
  const parsed = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  return typeof parsed === "number" ? (CLASS_TYPE_TO_LEAGUE.get(parsed) ?? null) : null;
}

export function creatorLeagueToClassType(value: unknown): number | null {
  const league = normalizeCreatorLeague(value);
  return league ? (LEAGUE_TO_CLASS_TYPE.get(league) ?? null) : null;
}

function normalizeCreatorLeague(value: unknown): TikTokLiveCreatorLeague | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase().replace(/_/g, "");
  return CREATOR_LEAGUE_SET.has(normalized) ? (normalized as TikTokLiveCreatorLeague) : null;
}

function classInfoFromObject(
  value: Record<string, unknown>,
  source: TikTokLiveCreatorLeagueSource
): TikTokLiveCreatorLeagueInfo | null {
  const classType = value.classType ?? value.class_type;
  const league = creatorLeagueFromClassType(classType);
  if (league) {
    return { league, classType: creatorLeagueToClassType(league)!, source };
  }

  const label =
    normalizeCreatorLeague(value.league) ??
    normalizeCreatorLeague(value.className) ??
    normalizeCreatorLeague(value.class_name);
  if (!label) return null;

  return { league: label, classType: creatorLeagueToClassType(label)!, source };
}

/**
 * Extracts Creator League only from LIVE-specific structures. This deliberately
 * ignores payGrade and webcastAnchorLevel because those are different TikTok
 * LIVE concepts (gifter consumption level and anchor experience level).
 */
export function extractCreatorLeagueFromTikTokPayload(
  payload: unknown
): TikTokLiveCreatorLeagueInfo | null {
  const seen = new WeakSet<object>();

  function visit(value: unknown, parentKey = "", depth = 0): TikTokLiveCreatorLeagueInfo | null {
    if (!value || typeof value !== "object" || depth > 40) return null;
    if (seen.has(value)) return null;
    seen.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = visit(item, parentKey, depth + 1);
        if (result) return result;
      }
      return null;
    }

    const record = value as Record<string, unknown>;
    const normalizedParentKey = parentKey.replace(/[_-]/g, "").toLowerCase();

    // Protobuf RankUpdate and battle payloads wrap the exact class in ClassInfo.
    if (
      normalizedParentKey === "classinfo" ||
      normalizedParentKey === "anchorclassinfo" ||
      normalizedParentKey === "ownerclassinfo"
    ) {
      const info = classInfoFromObject(record, "tiktok_live_payload");
      if (info) return info;
    }

    // Gift Gallery contains the creator's exact class_type alongside gallery fields.
    const looksLikeGiftGallery =
      "anchor_ranking_league" in record ||
      "anchorRankingLeague" in record ||
      "normal_gifts" in record ||
      "normalGifts" in record ||
      "current_period_starts_at" in record;
    if (looksLikeGiftGallery) {
      const info = classInfoFromObject(record, "tiktok_live_payload");
      if (info) return info;

      const label =
        normalizeCreatorLeague(record.anchor_ranking_league) ??
        normalizeCreatorLeague(record.anchorRankingLeague) ??
        normalizeCreatorLeague(record.anchor_league);
      if (label) {
        return {
          league: label,
          classType: creatorLeagueToClassType(label)!,
          source: "tiktok_live_payload",
        };
      }
    }

    for (const [key, child] of Object.entries(record)) {
      const result = visit(child, key, depth + 1);
      if (result) return result;
    }
    return null;
  }

  return visit(payload);
}

export function parseTikToolGiftGallery(payload: unknown): TikTokLiveCreatorLeagueInfo | null {
  if (!payload || typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;

  // Sandbox and lower plans return a static demo response. Never present it as
  // the analyzed creator's real league.
  if (root.is_sample === true || root.source === "sample") return null;

  const response =
    root.response && typeof root.response === "object"
      ? (root.response as Record<string, unknown>)
      : root;
  const data =
    response.data && typeof response.data === "object"
      ? (response.data as Record<string, unknown>)
      : response;
  const league = creatorLeagueFromClassType(data.class_type ?? data.classType);
  if (league) {
    return {
      league,
      classType: creatorLeagueToClassType(league)!,
      source: "tiktool_gift_gallery",
    };
  }

  const label =
    normalizeCreatorLeague(data.anchor_league) ??
    normalizeCreatorLeague(data.anchor_ranking_league);
  return label
    ? {
        league: label,
        classType: creatorLeagueToClassType(label)!,
        source: "tiktool_gift_gallery",
      }
    : null;
}

export async function fetchCreatorLeagueFromTikTool(
  username: string
): Promise<TikTokLiveCreatorLeagueInfo | null> {
  const apiKey = process.env.TIKTOOL_API_KEY?.trim();
  if (!apiKey) return null;

  const clean = username.replace(/^@/, "").trim();
  const url = new URL("https://api.tik.tools/webcast/gift_gallery");
  url.searchParams.set("unique_id", clean);
  // TikTool's public SDK sends all three because endpoints historically used
  // different creator-identifier spellings.
  url.searchParams.set("username", clean);
  url.searchParams.set("uniqueId", clean);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(url, {
      headers: { "x-api-key": apiKey, Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return parseTikToolGiftGallery(await response.json());
  } catch (error) {
    console.warn(
      "TikTok LIVE Creator League enrichment failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export function getStoredCreatorLeague(rawPayload: unknown): TikTokLiveCreatorLeagueInfo | null {
  if (!rawPayload || typeof rawPayload !== "object") return null;
  const liveStatus = (rawPayload as Record<string, unknown>).liveStatus;
  if (!liveStatus || typeof liveStatus !== "object") return null;

  const value = liveStatus as Record<string, unknown>;
  const league = normalizeCreatorLeague(value.creatorLeague);
  if (!league) return null;

  const expectedClassType = creatorLeagueToClassType(league);
  const classType = Number(value.creatorLeagueClassType);
  const source = value.creatorLeagueSource;
  if (
    !expectedClassType ||
    classType !== expectedClassType ||
    (source !== "tiktok_live_payload" && source !== "tiktool_gift_gallery")
  ) {
    return null;
  }

  return { league, classType, source };
}
