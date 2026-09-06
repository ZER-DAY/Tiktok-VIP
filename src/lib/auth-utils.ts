export type AppLocale = "ar" | "en";

export const AUTH_SESSION_COOKIE = "better-auth.session_token";

export const LOCALE_REGEX = /^\/(ar|en)(\/|$)/;

export function isSafeInternalPath(value: string | null | undefined): value is string {
  if (!value) return false;
  return value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\");
}

export function getPathLocale(pathname: string): AppLocale | null {
  const match = pathname.match(LOCALE_REGEX);
  return (match?.[1] as AppLocale | undefined) ?? null;
}

export function normalizeLocalePrefix(path: string, locale: AppLocale): string {
  if (!isSafeInternalPath(path)) return `/${locale}/dashboard`;
  const match = path.match(LOCALE_REGEX);
  if (!match) {
    return path === "/" ? `/${locale}` : `/${locale}${path}`;
  }
  if (match[1] === locale) return path;
  const rest = path.slice(match[0].length);
  return `/${locale}${rest.length > 0 && !rest.startsWith("/") ? `/${rest}` : rest}`;
}

export function resolveAuthenticatedDestination(
  requested: string | null | undefined,
  locale: AppLocale
): string {
  const safe = isSafeInternalPath(requested) ? requested : "/dashboard";
  return normalizeLocalePrefix(safe, locale);
}

export function buildLoginUrl(locale: AppLocale, callbackUrl?: string | null): string {
  const safeCallback = callbackUrl ? resolveAuthenticatedDestination(callbackUrl, locale) : null;
  const query = safeCallback ? `?callbackUrl=${encodeURIComponent(safeCallback)}` : "";
  return `/${locale}/login${query}`;
}
