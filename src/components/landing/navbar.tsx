"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Globe2, LayoutDashboard, Loader2, LogOut, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-mark";
import { AccountMenu } from "./account-menu";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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

  // The bar condenses once the page moves: it rises toward the edge, loses a
  // little height, and its shadow deepens, so it reads as floating over the
  // content instead of being painted on it. A rAF guard keeps the scroll
  // handler off the critical path, and the reduced-motion block in globals.css
  // collapses the transition for anyone who asks for that.
  const [condensed, setCondensed] = useState(false);
  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      setCondensed(window.scrollY > 24);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

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
    <header
      className={`fixed inset-x-0 top-0 z-50 px-3 transition-[padding] duration-300 ease-out sm:px-6 ${
        condensed ? "pt-1.5" : "pt-[17px]"
      }`}
    >
      <nav
        data-testid="landing-navbar"
        data-condensed={condensed ? "true" : "false"}
        dir="ltr"
        className={`mx-auto w-full max-w-[1100px] border border-white/[0.09] px-3 backdrop-blur-xl transition-all duration-300 ease-out sm:px-4 xl:w-[71.615vw] ${
          condensed
            ? "rounded-[13px] bg-[#0b0b0d]/98 shadow-[0_18px_44px_rgba(0,0,0,0.46)]"
            : "rounded-[17px] bg-[#0b0b0d]/95 shadow-[0_12px_34px_rgba(0,0,0,0.30)]"
        }`}
      >
        <div
          className={`grid grid-cols-[1fr_auto] items-center gap-2 transition-[min-height] duration-300 ease-out sm:gap-4 md:grid-cols-[1fr_1.35fr_1fr] ${
            condensed ? "min-h-[52px]" : "min-h-[62px]"
          }`}
        >
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 sm:gap-3"
            aria-label={t("siteName")}
          >
            {/* The lockup carries the name, so nothing here can truncate the
                way the old text wordmark did on a narrow phone. */}
            <BrandLogo
              className={`w-auto transition-all duration-300 ease-out ${
                condensed ? "h-8 sm:h-8" : "h-9 sm:h-10"
              }`}
            />
          </Link>

          <div
            className="hidden h-full items-center justify-center gap-[53px] md:flex xl:-translate-x-[33px]"
            dir={isRtl ? "rtl" : "ltr"}
          >
            {navigationItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className={`relative flex items-center text-[14px] font-medium transition-all duration-300 ease-out ${
                  condensed ? "h-[52px]" : "h-[62px]"
                } ${
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
            {/* Guests get the language switch inline; signed-in users get it
                inside the account menu, so the bar carries one control of a
                predictable width instead of five that fought for space. */}
            {!isAuthenticated && !isPending && (
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
            )}

            {isPending ? (
              <AuthActionsSkeleton />
            ) : isAuthenticated ? (
              <AccountMenu
                name={session?.user?.name || ""}
                email={session?.user?.email || ""}
                avatarUrl={session?.user?.image}
                dashboardHref="/dashboard"
                dashboardLabel={t("dashboard")}
                languageLabel={isRtl ? tCommon("english") : tCommon("arabic")}
                logoutLabel={t("logout")}
                logoutFailedLabel={tCommon("logoutFailed")}
                menuLabel={t("accountMenu")}
                signingOut={signingOut}
                logoutFailed={logoutError}
                onLogout={handleLogout}
                onSwitchLanguage={switchLanguage}
              />
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
                  className="inline-flex h-10 min-w-[92px] items-center justify-center rounded-[10px] bg-brand px-5 text-sm font-bold text-brand-foreground shadow-[0_9px_20px_-10px_rgba(242,197,73,.85)] transition hover:-translate-y-0.5 hover:bg-[#e2b23c]"
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
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-bold text-brand-foreground"
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
