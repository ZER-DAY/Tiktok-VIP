export function getStoredProfileDisplayName(rawPayload: unknown): string | null {
  if (!rawPayload || typeof rawPayload !== "object") return null;

  const profile = (rawPayload as Record<string, unknown>).profile;
  if (!profile || typeof profile !== "object") return null;

  const displayName = (profile as Record<string, unknown>).displayName;
  if (typeof displayName !== "string") return null;

  const normalized = displayName.trim();
  return normalized.length > 0 ? normalized : null;
}
