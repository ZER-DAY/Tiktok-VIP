export type AppLocale = "ar" | "en";

export const AUTH_SESSION_COOKIE = "better-auth.session_token";
export const SECURE_AUTH_SESSION_COOKIE = "__Secure-better-auth.session_token";

export const AUTH_SESSION_COOKIES = [AUTH_SESSION_COOKIE, SECURE_AUTH_SESSION_COOKIE] as const;

export function getCookieNames(cookie: string | undefined): string[] {
  if (!cookie) return [];
  return cookie.split(";").flatMap((part) => {
    const eq = part.indexOf("=");
    if (eq === -1 || !part.slice(eq + 1).trim()) return [];
    return [part.slice(0, eq).trim()];
  });
}

export function hasAuthSessionCookie(cookieHeader: string | undefined): boolean {
  const names = new Set(getCookieNames(cookieHeader));
  return AUTH_SESSION_COOKIES.some((name) => names.has(name));
}

const PROTECTED_PREFIXES = ["/dashboard", "/agency", "/admin"] as const;

export function isProtectedPath(pathname: string): boolean {
  const locale = getPathLocale(pathname) ?? "ar";
  return PROTECTED_PREFIXES.some((prefix) => {
    return pathname === `/${locale}${prefix}` || pathname.startsWith(`/${locale}${prefix}/`);
  });
}

export function shouldRedirectToLogin(pathname: string, cookieHeader: string | undefined): boolean {
  return isProtectedPath(pathname) && !hasAuthSessionCookie(cookieHeader);
}

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
