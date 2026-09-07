export function resolveSafeCallbackUrl(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f]/.test(trimmed)) return fallback;
  try {
    const url = new URL(trimmed, "https://local.invalid");
    if (url.origin !== "https://local.invalid") return fallback;
  } catch {
    return fallback;
  }
  return trimmed;
}

export function buildRegisteredFallback(locale: "ar" | "en") {
  return `/${locale}/dashboard`;
}
