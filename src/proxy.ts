import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { AUTH_SESSION_COOKIE, buildLoginUrl, getPathLocale } from "@/lib/auth-utils";

const intlMiddleware = createMiddleware(routing);

const PROTECTED_PREFIXES = ["/dashboard", "/agency", "/admin"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const locale = getPathLocale(pathname) ?? "ar";

  // A session cookie existing here only means a session might exist; the
  // server-side route handlers still verify that it is valid. When no cookie
  // is present at all, send guests to the correct-locale login page with a
  // safe callbackUrl instead of rendering a protected shell.
  const hasSessionCookie = Boolean(request.cookies.get(AUTH_SESSION_COOKIE)?.value);
  const isProtected = PROTECTED_PREFIXES.some((prefix) => {
    return pathname === `/${locale}${prefix}` || pathname.startsWith(`/${locale}${prefix}/`);
  });

  if (isProtected && !hasSessionCookie) {
    const loginUrl = buildLoginUrl(locale, `${pathname}${search}`);
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(ar|en)/:path*"],
};
