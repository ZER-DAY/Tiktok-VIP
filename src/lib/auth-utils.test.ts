import { describe, it, expect } from "vitest";
import {
  AUTH_SESSION_COOKIE,
  SECURE_AUTH_SESSION_COOKIE,
  hasAuthSessionCookie,
  shouldRedirectToLogin,
  isProtectedPath,
  isSafeInternalPath,
  getPathLocale,
  normalizeLocalePrefix,
  resolveAuthenticatedDestination,
  buildLoginUrl,
} from "./auth-utils";

describe("auth-utils: isSafeInternalPath", () => {
  it("accepts root-relative internal paths", () => {
    expect(isSafeInternalPath("/dashboard")).toBe(true);
    expect(isSafeInternalPath("/")).toBe(true);
    expect(isSafeInternalPath("/ar/billing")).toBe(true);
  });

  it("rejects external URLs and protocol-relative URLs", () => {
    expect(isSafeInternalPath("https://evil.com")).toBe(false);
    expect(isSafeInternalPath("http://evil.com/phish")).toBe(false);
    expect(isSafeInternalPath("//evil.com")).toBe(false);
    expect(isSafeInternalPath("/\\evil.com")).toBe(false);
  });

  it("rejects empty, relative, and nullish values", () => {
    expect(isSafeInternalPath("")).toBe(false);
    expect(isSafeInternalPath("dashboard")).toBe(false);
    expect(isSafeInternalPath("javascript:alert(1)")).toBe(false);
    expect(isSafeInternalPath(null)).toBe(false);
    expect(isSafeInternalPath(undefined)).toBe(false);
  });
});

describe("auth-utils: getPathLocale", () => {
  it("extracts the locale prefix", () => {
    expect(getPathLocale("/ar/dashboard")).toBe("ar");
    expect(getPathLocale("/en/login")).toBe("en");
    expect(getPathLocale("/ar")).toBe("ar");
  });

  it("returns null when no locale prefix", () => {
    expect(getPathLocale("/dashboard")).toBeNull();
    expect(getPathLocale("/")).toBeNull();
  });
});

describe("auth-utils: normalizeLocalePrefix", () => {
  it("adds the locale prefix when missing", () => {
    expect(normalizeLocalePrefix("/dashboard", "ar")).toBe("/ar/dashboard");
    expect(normalizeLocalePrefix("/dashboard", "en")).toBe("/en/dashboard");
    expect(normalizeLocalePrefix("/", "ar")).toBe("/ar");
  });

  it("keeps a matching locale prefix untouched", () => {
    expect(normalizeLocalePrefix("/ar/dashboard", "ar")).toBe("/ar/dashboard");
    expect(normalizeLocalePrefix("/en/billing", "en")).toBe("/en/billing");
  });

  it("rewrites a mismatched locale prefix", () => {
    expect(normalizeLocalePrefix("/en/dashboard", "ar")).toBe("/ar/dashboard");
    expect(normalizeLocalePrefix("/ar/billing", "en")).toBe("/en/billing");
  });
});

describe("auth-utils: resolveAuthenticatedDestination", () => {
  it("defaults to the locale dashboard when nothing is requested", () => {
    expect(resolveAuthenticatedDestination(null, "ar")).toBe("/ar/dashboard");
    expect(resolveAuthenticatedDestination(undefined, "en")).toBe("/en/dashboard");
  });

  it("keeps a safe internal destination and localizes it", () => {
    expect(resolveAuthenticatedDestination("/dashboard", "ar")).toBe("/ar/dashboard");
    expect(resolveAuthenticatedDestination("/en/dashboard", "ar")).toBe("/ar/dashboard");
    expect(resolveAuthenticatedDestination("/ar/billing", "en")).toBe("/en/billing");
  });

  it("rejects open-redirect attempts and falls back to the dashboard", () => {
    expect(resolveAuthenticatedDestination("https://evil.example", "ar")).toBe("/ar/dashboard");
    expect(resolveAuthenticatedDestination("//evil.example", "en")).toBe("/en/dashboard");
    expect(resolveAuthenticatedDestination("/\\evil.example", "ar")).toBe("/ar/dashboard");
    expect(resolveAuthenticatedDestination("javascript:alert(1)", "en")).toBe("/en/dashboard");
  });
});

describe("auth-utils: buildLoginUrl", () => {
  it("builds a plain login URL without callback", () => {
    expect(buildLoginUrl("ar")).toBe("/ar/login");
    expect(buildLoginUrl("en", null)).toBe("/en/login");
  });

  it("appends a safe callback URL", () => {
    const url = buildLoginUrl("ar", "/dashboard");
    expect(url).toBe("/ar/login?callbackUrl=%2Far%2Fdashboard");
  });

  it("never echoes an unsafe callback URL, falling back to the dashboard instead", () => {
    const url = buildLoginUrl("en", "https://evil.example/phish");
    expect(url).toBe("/en/login?callbackUrl=%2Fen%2Fdashboard");
  });
});

describe("auth-utils: session cookie constant", () => {
  it("matches the Better Auth default cookie name", () => {
    expect(AUTH_SESSION_COOKIE).toBe("better-auth.session_token");
    expect(SECURE_AUTH_SESSION_COOKIE).toBe("__Secure-better-auth.session_token");
  });
});

describe("auth-utils: hasAuthSessionCookie", () => {
  it("rejects empty or malformed session cookies", () => {
    expect(hasAuthSessionCookie("better-auth.session_token=")).toBe(false);
    expect(hasAuthSessionCookie("__Secure-better-auth.session_token= ")).toBe(false);
    expect(hasAuthSessionCookie("better-auth.session_token")).toBe(false);
  });

  it("recognizes the plain session cookie", () => {
    expect(hasAuthSessionCookie("foo=bar; better-auth.session_token=abc; x=1")).toBe(true);
    expect(hasAuthSessionCookie("better-auth.session_token=abc")).toBe(true);
  });

  it("recognizes the secure-prefixed session cookie used in production", () => {
    expect(hasAuthSessionCookie("__Secure-better-auth.session_token=abc")).toBe(true);
    expect(hasAuthSessionCookie("__Secure-foo=1; __Secure-better-auth.session_token=abc")).toBe(
      true
    );
  });

  it("treats a guest (no cookie, empty, or unrelated cookies) as logged out and never logs a value", () => {
    expect(hasAuthSessionCookie(undefined)).toBe(false);
    expect(hasAuthSessionCookie("")).toBe(false);
    expect(hasAuthSessionCookie("foo=bar; session_token=abc")).toBe(false);
    expect(hasAuthSessionCookie("better-auth.session_data=abc")).toBe(false);
    expect(hasAuthSessionCookie("__Secure-other=abc")).toBe(false);
  });
});

describe("auth-utils: shouldRedirectToLogin", () => {
  it("redirects guests away from protected paths", () => {
    expect(shouldRedirectToLogin("/ar/dashboard", undefined)).toBe(true);
    expect(shouldRedirectToLogin("/en/admin", "lang=ar")).toBe(true);
    expect(shouldRedirectToLogin("/ar/agency/reports", "")).toBe(true);
  });

  it("does not redirect authenticated users with either supported cookie name", () => {
    expect(
      shouldRedirectToLogin("/ar/dashboard", "better-auth.session_token=token-value; lang=en")
    ).toBe(false);
    expect(
      shouldRedirectToLogin("/ar/admin", "__Secure-better-auth.session_token=token-value")
    ).toBe(false);
    expect(
      shouldRedirectToLogin("/en/agency/analytics", "x=1; __Secure-better-auth.session_token=tok")
    ).toBe(false);
  });

  it("does not redirect on public paths even for guests", () => {
    expect(shouldRedirectToLogin("/", undefined)).toBe(false);
    expect(shouldRedirectToLogin("/ar", undefined)).toBe(false);
    expect(shouldRedirectToLogin("/ar/pricing", undefined)).toBe(false);
    expect(shouldRedirectToLogin("/ar/login", "foo=bar")).toBe(false);
  });
});

describe("auth-utils: isProtectedPath", () => {
  it("recognizes dashboard, agency, and admin prefixes", () => {
    expect(isProtectedPath("/ar/dashboard")).toBe(true);
    expect(isProtectedPath("/en/agency")).toBe(true);
    expect(isProtectedPath("/ar/admin/payments")).toBe(true);
    expect(isProtectedPath("/ar/dashboard/billing")).toBe(true);
  });

  it("ignores public and other paths", () => {
    expect(isProtectedPath("/ar")).toBe(false);
    expect(isProtectedPath("/about")).toBe(false);
    expect(isProtectedPath("/api/health")).toBe(false);
  });
});
