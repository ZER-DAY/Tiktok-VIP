"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
                <span className="text-brand-foreground font-bold text-sm">TI</span>
              </div>
              <span className="text-foreground font-bold text-lg">TikTok Intelligence</span>
            </div>
            <p className="text-muted-foreground text-sm">{t("madeWith")}</p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-foreground font-semibold mb-4">{t("product")}</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#features"
                  className="text-muted-foreground hover:text-brand text-sm transition-colors"
                >
                  {t("features")}
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-muted-foreground hover:text-brand text-sm transition-colors"
                >
                  {t("pricing")}
                </a>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-brand text-sm transition-colors"
                >
                  {t("analyzer")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-foreground font-semibold mb-4">{t("company")}</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-muted-foreground text-sm">{t("about")}</span>
              </li>
              <li>
                <span className="text-muted-foreground text-sm">{t("blog")}</span>
              </li>
              <li>
                <span className="text-muted-foreground text-sm">{t("contact")}</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-foreground font-semibold mb-4">{t("legal")}</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy"
                  className="text-muted-foreground hover:text-brand text-sm transition-colors"
                >
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-muted-foreground hover:text-brand text-sm transition-colors"
                >
                  {t("terms")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} TikTok Intelligence Platform. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
