import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { buildLoginUrl, getPathLocale, shouldRedirectToLogin } from "@/lib/auth-utils";

const intlMiddleware = createMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const locale = getPathLocale(pathname) ?? "ar";

  // A session cookie existing here only means a session might exist; the
  // server-side route handlers still verify that it is valid. When no cookie
  // is present at all, send guests to the correct-locale login page with a
  // safe callbackUrl instead of rendering a protected shell. The cookie name
  // is either better-auth.session_token or, in production, the __Secure-
  // prefixed variant.
  const needsLogin = shouldRedirectToLogin(pathname, request.headers.get("cookie") ?? undefined);

  if (needsLogin) {
    const loginUrl = buildLoginUrl(locale, `${pathname}${search}`);
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/", "/(ar|en)/:path*"],
};
