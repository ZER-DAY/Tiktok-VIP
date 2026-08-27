const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const VIDEO_QUERY_URL =
  "https://open.tiktokapis.com/v2/research/video/query/?fields=id,username,region_code,create_time";

const REQUEST_TIMEOUT = 15000;
const TOKEN_EXPIRY_BUFFER_MS = 60_000;

let cachedToken: { value: string; expiresAt: number } | null = null;

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface ResearchVideo {
  region_code?: string;
}

interface VideoQueryResponse {
  data?: { videos?: ResearchVideo[] };
  error?: { code?: string; message?: string };
}

export function isResearchApiConfigured(): boolean {
  return Boolean(
    process.env.TIKTOK_RESEARCH_CLIENT_KEY?.trim() &&
    process.env.TIKTOK_RESEARCH_CLIENT_SECRET?.trim()
  );
}

function formatDate(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("");
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function getClientAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_EXPIRY_BUFFER_MS) {
    return cachedToken.value;
  }

  const clientKey = process.env.TIKTOK_RESEARCH_CLIENT_KEY?.trim();
  const clientSecret = process.env.TIKTOK_RESEARCH_CLIENT_SECRET?.trim();
  if (!clientKey || !clientSecret) {
    throw new Error("TikTok Research API credentials are not configured");
  }

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });
  const response = await fetchWithTimeout(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const payload = (await response.json()) as TokenResponse;

  if (!response.ok || !payload.access_token) {
    throw new Error(
      `TikTok Research API authentication failed: ${payload.error_description ?? payload.error ?? response.status}`
    );
  }

  cachedToken = {
    value: payload.access_token,
    expiresAt: Date.now() + Math.max(0, payload.expires_in ?? 7200) * 1000,
  };
  return cachedToken.value;
}

/**
 * Returns TikTok's official registration region for a creator when the
 * Research API is configured and the query returns at least one video.
 */
export async function fetchResearchRegionCode(
  username: string,
  referenceDate = new Date()
): Promise<string | null> {
  if (!isResearchApiConfigured()) return null;

  const token = await getClientAccessToken();
  const endDate = new Date(referenceDate);
  if (Number.isNaN(endDate.getTime())) {
    endDate.setTime(Date.now());
  }
  const startDate = new Date(endDate);
  startDate.setUTCDate(startDate.getUTCDate() - 29);

  const response = await fetchWithTimeout(VIDEO_QUERY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: {
        and: [
          {
            operation: "EQ",
            field_name: "username",
            field_values: [username],
          },
        ],
      },
      start_date: formatDate(startDate),
      end_date: formatDate(endDate),
      max_count: 20,
      is_random: false,
    }),
  });
  const payload = (await response.json()) as VideoQueryResponse;

  if (!response.ok || (payload.error?.code && payload.error.code !== "ok")) {
    throw new Error(
      `TikTok Research API video query failed: ${payload.error?.message ?? payload.error?.code ?? response.status}`
    );
  }

  const regionCounts = new Map<string, number>();
  for (const video of payload.data?.videos ?? []) {
    const regionCode = video.region_code?.trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(regionCode ?? "")) {
      regionCounts.set(regionCode!, (regionCounts.get(regionCode!) ?? 0) + 1);
    }
  }

  return (
    [...regionCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ??
    null
  );
}

export function clearResearchApiTokenCache(): void {
  cachedToken = null;
}
