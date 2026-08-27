import { isLiveAccountLevelProviderConfigured } from "@/modules/providers/tiktok/live-account-level";

// Bumped after adding the direct TikTok api-live room lookup. Existing
// snapshots must be refreshed once so they are not served from the old cache.
export const ANALYSIS_DATA_VERSION = 7;

export function isAnalysisDataCurrent(rawPayload: unknown): boolean {
  if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
    return false;
  }

  const hasCurrentVersion =
    "pipelineVersion" in rawPayload &&
    typeof rawPayload.pipelineVersion === "number" &&
    rawPayload.pipelineVersion >= ANALYSIS_DATA_VERSION;

  if (!hasCurrentVersion) return false;

  // A snapshot captured before a signed LIVE provider was configured must be
  // refreshed once after a key is added. The refreshed snapshot records that
  // the enrichment was attempted even when TikTok legitimately returns no level.
  return (
    !isLiveAccountLevelProviderConfigured() ||
    ("liveAccountLevelEnrichmentConfigured" in rawPayload &&
      rawPayload.liveAccountLevelEnrichmentConfigured === true)
  );
}
