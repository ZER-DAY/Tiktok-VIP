"use client";

import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useState } from "react";
import { Menu, X, Globe } from "lucide-react";

export function Navbar() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const switchLanguage = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href={`/${locale}`} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <span className="text-brand-foreground font-bold text-sm">TI</span>
            </div>
            <span className="text-foreground font-bold text-lg hidden sm:block">
              TikTok Intelligence
            </span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-muted-foreground hover:text-brand text-sm transition-colors"
            >
              {t("features")}
            </a>
            <a
              href="#pricing"
              className="text-muted-foreground hover:text-brand text-sm transition-colors"
            >
              {t("pricing")}
            </a>
            <a
              href={`/${locale}/login`}
              className="text-muted-foreground hover:text-brand text-sm transition-colors"
            >
              {t("login")}
            </a>
            <button
              onClick={switchLanguage}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-brand text-sm transition-colors"
              aria-label={tCommon("switchLanguage")}
            >
              <Globe className="w-4 h-4" />
              {t("switchLang")}
            </button>
            <a
              href={`/${locale}/register`}
              className="px-4 py-2 rounded-full bg-brand text-brand-foreground text-sm font-semibold hover:opacity-90 transition-all"
            >
              {t("startNow")}
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={switchLanguage}
              className="text-muted-foreground hover:text-brand p-2"
              aria-label={tCommon("switchLanguage")}
            >
              <Globe className="w-5 h-5" />
            </button>
            <button
              className="text-muted-foreground hover:text-brand"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? tCommon("closeMenu") : tCommon("openMenu")}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              <a
                href="#features"
                className="text-muted-foreground hover:text-brand text-sm transition-colors"
              >
                {t("features")}
              </a>
              <a
                href="#pricing"
                className="text-muted-foreground hover:text-brand text-sm transition-colors"
              >
                {t("pricing")}
              </a>
              <a
                href={`/${locale}/login`}
                className="text-muted-foreground hover:text-brand text-sm transition-colors"
              >
                {t("login")}
              </a>
              <a
                href={`/${locale}/register`}
                className="px-4 py-2 rounded-full bg-brand text-brand-foreground text-sm font-semibold text-center"
              >
                {t("startNow")}
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
