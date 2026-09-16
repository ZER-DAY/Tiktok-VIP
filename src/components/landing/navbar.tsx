"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Globe2, LayoutDashboard, Loader2, LogOut, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-mark";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { authClient, useSession } from "@/lib/auth-client";

const navigationItems = [
  { key: "home", href: "#home" },
  { key: "features", href: "#features" },
  { key: "howItWorks", href: "#how-it-works" },
  { key: "pricing", href: "#pricing" },
] as const;

export function Navbar() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  const isRtl = locale === "ar";
  const isAuthenticated = Boolean(session?.user);

  const switchLanguage = () => {
    router.replace(pathname, { locale: isRtl ? "en" : "ar" });
  };

  const handleLogout = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setLogoutError(false);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setLogoutError(true);
        return;
      }
      setMobileOpen(false);
      router.refresh();
      router.push("/");
    } catch {
      // A thrown network error must never leave the user stuck; surface a
      // localized retry message instead of navigating.
      setLogoutError(true);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-[17px] sm:px-6">
      <nav
        data-testid="landing-navbar"
        dir="ltr"
        className="mx-auto w-full max-w-[1100px] rounded-[17px] border border-white/[0.09] bg-[#0b0b0d]/95 px-3 shadow-[0_12px_34px_rgba(0,0,0,0.30)] backdrop-blur-xl sm:px-4 xl:w-[71.615vw]"
      >
        <div className="grid min-h-[62px] grid-cols-[1fr_auto] items-center gap-2 sm:gap-4 md:grid-cols-[1fr_1.35fr_1fr]">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 sm:gap-3"
            aria-label={t("siteName")}
          >
            {/* The lockup carries the name, so nothing here can truncate the
                way the old text wordmark did on a narrow phone. */}
            <BrandLogo className="h-9 w-auto sm:h-10" />
          </Link>

          <div
            className="hidden h-full items-center justify-center gap-[53px] md:flex xl:-translate-x-[33px]"
            dir={isRtl ? "rtl" : "ltr"}
          >
            {navigationItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className={`relative flex h-[62px] items-center text-[14px] font-medium transition-colors ${
                  item.key === "home"
                    ? "text-brand after:absolute after:inset-x-0 after:bottom-[8px] after:h-px after:bg-brand"
                    : "text-white/70 hover:text-brand"
                }`}
              >
                {t(item.key)}
              </a>
            ))}
          </div>

          <div
            className="hidden items-center justify-end gap-2 md:flex xl:translate-x-1"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <button
              type="button"
              onClick={switchLanguage}
              className="inline-flex h-10 min-w-[105px] items-center justify-center gap-2 rounded-[10px] border border-white/[0.14] bg-white/[0.06] px-3 text-xs font-medium text-white/80 transition hover:border-brand/40 hover:text-brand"
              aria-label={tCommon("switchLanguage")}
            >
              <Globe2 className="size-4" />
              <span>{isRtl ? "العربية" : "English"}</span>
              <ChevronDown className="size-3.5 text-white/50" />
            </button>

            {isPending ? (
              <AuthActionsSkeleton />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="flex min-w-0 max-w-[180px] flex-col items-end" role="status">
                  <Link
                    href="/dashboard"
                    className="flex min-w-0 items-center gap-1.5 rounded-[10px] border border-white/[0.14] bg-white/[0.06] py-1.5 pl-3 pr-3 text-xs font-black text-white/85 transition hover:border-brand/40 hover:text-brand"
                    aria-label={t("dashboard")}
                  >
                    <LayoutDashboard className="size-3.5 shrink-0" />
                    <span className="max-w-[90px] truncate">
                      {session?.user?.name || session?.user?.email}
                    </span>
                  </Link>
                  <span className="mt-1 hidden max-w-[180px] truncate text-[10px] text-white/45 xl:block">
                    {session?.user?.email}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={signingOut}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-white/[0.14] bg-white/[0.06] px-4 text-xs font-bold text-white/80 transition hover:border-destructive/50 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={t("logout")}
                >
                  {signingOut ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LogOut className="size-4" />
                  )}
                  {t("logout")}
                </button>
                {logoutError && (
                  <p
                    role="alert"
                    className="mt-1 flex items-center gap-1 text-[11px] font-medium text-destructive"
                  >
                    {tCommon("logoutFailed")}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex h-10 min-w-[90px] items-center justify-center rounded-[10px] border border-white/[0.18] bg-white/[0.06] px-5 text-sm font-bold text-white/85 transition hover:border-brand/45 hover:text-brand"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-10 min-w-[92px] items-center justify-center rounded-[10px] bg-brand px-5 text-sm font-bold text-white shadow-[0_9px_20px_-10px_rgba(255,77,103,.85)] transition hover:-translate-y-0.5 hover:bg-[#f33f5b]"
                >
                  {t("register")}
                </Link>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-0.5 md:hidden">
            {isAuthenticated && !isPending && (
              <>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={signingOut}
                  className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-white/[0.14] bg-white/[0.06] px-2.5 text-[12px] font-bold text-[#ff8f9f] transition hover:bg-white/[0.12] disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={t("logout")}
                >
                  {signingOut ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <LogOut className="size-4" />
                  )}
                  <span className="whitespace-nowrap">{t("logoutShort")}</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={switchLanguage}
              className="grid size-10 place-items-center rounded-xl text-white/65 transition hover:bg-white/[0.10]"
              aria-label={tCommon("switchLanguage")}
            >
              <Globe2 className="size-5" />
            </button>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-xl text-white/65 transition hover:bg-white/[0.10]"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? tCommon("closeMenu") : tCommon("openMenu")}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* On a phone the logout control is icon-only, so its failure message
            gets its own row - inside the icon cluster it widened the bar and
            pushed the brand name out. */}
        {logoutError && (
          <p
            role="alert"
            className="pb-2 text-center text-[11px] font-medium text-destructive md:hidden"
          >
            {tCommon("logoutFailed")}
          </p>
        )}

        <AnimatePresence initial={false}>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-white/[0.08] md:hidden"
              dir={isRtl ? "rtl" : "ltr"}
            >
              <div className="grid gap-1 py-3">
                {navigationItems.map((item) => (
                  <a
                    key={item.key}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                      item.key === "home"
                        ? "bg-brand/[0.07] text-brand"
                        : "text-white/70 hover:bg-white/[0.08]"
                    }`}
                  >
                    {t(item.key)}
                  </a>
                ))}

                <div className="mt-1 grid gap-2">
                  {isPending ? (
                    <AuthActionsSkeleton mobile />
                  ) : isAuthenticated ? (
                    <>
                      <Link
                        href="/dashboard"
                        onClick={() => setMobileOpen(false)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.14] bg-white/[0.06] px-4 py-3 text-sm font-bold text-white/85"
                      >
                        <LayoutDashboard className="size-4" />
                        {session?.user?.name || session?.user?.email}
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={signingOut}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.14] bg-white/[0.06] px-4 text-sm font-bold text-[#ff8f9f] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {signingOut ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <LogOut className="size-4" />
                        )}
                        {t("logout")}
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setMobileOpen(false)}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-white/[0.18] bg-white/[0.06] px-4 text-sm font-bold text-white/85"
                      >
                        {t("login")}
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileOpen(false)}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-bold text-white"
                      >
                        {t("register")}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

function AuthActionsSkeleton({ mobile = false }: { mobile?: boolean }) {
  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-label="Loading account state"
      data-testid="navbar-auth-skeleton"
    >
      <span
        className={`animate-pulse rounded-[10px] bg-black/[0.06] ${
          mobile ? "h-11 w-full" : "h-10 w-24"
        }`}
      />
      <span
        className={`animate-pulse rounded-[10px] bg-black/[0.06] ${
          mobile ? "h-11 w-full" : "h-10 w-24"
        }`}
      />
    </div>
  );
}
