"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Globe2, Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  const switchLanguage = () => {
    router.replace(pathname, { locale: locale === "ar" ? "en" : "ar" });
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-[17px] sm:px-6">
      <nav
        data-testid="landing-navbar"
        dir="ltr"
        className="mx-auto w-full max-w-[1100px] rounded-[17px] border border-black/[0.07] bg-white/95 px-3 shadow-[0_9px_28px_rgba(19,27,44,0.10)] backdrop-blur-xl sm:px-4 xl:w-[71.615vw]"
      >
        <div className="grid min-h-[62px] grid-cols-[1fr_auto] items-center gap-4 md:grid-cols-[1fr_1.35fr_1fr]">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label={t("siteName")}>
            <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-end gap-[3px] pb-0.5">
              <span className="h-[19px] w-[4px] rounded-full bg-brand" />
              <span className="h-[30px] w-[4px] rounded-full bg-brand" />
              <span className="h-[24px] w-[4px] rounded-full bg-brand" />
              <span className="h-[10px] w-[4px] rounded-full bg-brand" />
            </span>
            <span className="truncate text-[15px] font-black tracking-[-0.025em] text-[#121827] [font-family:var(--font-inter)] sm:text-[17px]">
              TikTok Intelligence
            </span>
          </Link>

          <div
            className="hidden h-full items-center justify-center gap-[53px] md:flex xl:-translate-x-[33px]"
            dir={locale === "ar" ? "rtl" : "ltr"}
          >
            {navigationItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className={`relative flex h-[62px] items-center text-[14px] font-medium transition-colors ${
                  item.key === "home"
                    ? "text-brand after:absolute after:inset-x-0 after:bottom-[8px] after:h-px after:bg-brand"
                    : "text-[#222938] hover:text-brand"
                }`}
              >
                {t(item.key)}
              </a>
            ))}
          </div>

          <div className="hidden items-center justify-end gap-3 md:flex xl:translate-x-1">
            <button
              type="button"
              onClick={switchLanguage}
              dir={locale === "ar" ? "rtl" : "ltr"}
              className="inline-flex h-10 min-w-[105px] items-center justify-center gap-2 rounded-[10px] border border-black/[0.07] bg-white px-3 text-xs font-medium text-[#3d4350] transition hover:border-brand/25 hover:text-brand"
              aria-label={tCommon("switchLanguage")}
            >
              <Globe2 className="size-4" />
              <span>{locale === "ar" ? "العربية" : "English"}</span>
              <ChevronDown className="size-3.5 text-[#7b808b]" />
            </button>
            <Link
              href="/register"
              dir={locale === "ar" ? "rtl" : "ltr"}
              className="inline-flex h-10 min-w-[92px] items-center justify-center rounded-[10px] bg-brand px-5 text-sm font-bold text-white shadow-[0_9px_20px_-10px_rgba(255,77,103,.85)] transition hover:-translate-y-0.5 hover:bg-[#f33f5b]"
            >
              {t("startNow")}
            </Link>
          </div>

          <div className="flex items-center justify-end gap-1 md:hidden">
            <button
              type="button"
              onClick={switchLanguage}
              className="grid size-10 place-items-center rounded-xl text-[#5f6674] transition hover:bg-[#f5f5f4]"
              aria-label={tCommon("switchLanguage")}
            >
              <Globe2 className="size-5" />
            </button>
            <button
              type="button"
              className="grid size-10 place-items-center rounded-xl text-[#5f6674] transition hover:bg-[#f5f5f4]"
              onClick={() => setMobileOpen((open) => !open)}
              aria-label={mobileOpen ? tCommon("closeMenu") : tCommon("openMenu")}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-black/[0.06] md:hidden"
              dir={locale === "ar" ? "rtl" : "ltr"}
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
                        : "text-[#454b57] hover:bg-[#f6f6f4]"
                    }`}
                  >
                    {t(item.key)}
                  </a>
                ))}
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="mt-1 inline-flex h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-bold text-white"
                >
                  {t("startNow")}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}
