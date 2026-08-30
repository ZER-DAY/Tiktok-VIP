"use client";

import { useTranslations } from "next-intl";
import { ArrowUpLeft, AtSign, Mail } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border px-5 py-14 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 grid gap-10 sm:grid-cols-2 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <BrandMark className="size-9 rounded-xl" iconClassName="size-[18px]" />
              <span className="text-lg font-black tracking-tight text-foreground">
                {t("siteName")}
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-7 text-muted-foreground">{t("madeWith")}</p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href="mailto:hello@tiktok-intelligence.com"
                aria-label={t("contact")}
                className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
              >
                <Mail className="size-4" />
              </a>
              <a
                href="#"
                aria-label={t("socialInstagram")}
                className="grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
              >
                <AtSign className="size-4" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="mb-4 text-sm font-bold text-foreground">{t("product")}</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#features"
                  className="text-sm text-muted-foreground transition-colors hover:text-brand"
                >
                  {t("features")}
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-sm text-muted-foreground transition-colors hover:text-brand"
                >
                  {t("pricing")}
                </a>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-sm text-muted-foreground transition-colors hover:text-brand"
                >
                  {t("analyzer")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="mb-4 text-sm font-bold text-foreground">{t("company")}</h4>
            <ul className="space-y-3">
              <li>
                <span className="text-sm text-muted-foreground">{t("about")}</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">{t("blog")}</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">{t("contact")}</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-4 text-sm font-bold text-foreground">{t("legal")}</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy"
                  className="text-sm text-muted-foreground transition-colors hover:text-brand"
                >
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm text-muted-foreground transition-colors hover:text-brand"
                >
                  {t("terms")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-7 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} TikTok Intelligence Platform. {t("rights")}
          </p>
          <Link href="/" className="inline-flex items-center gap-1 font-semibold text-brand">
            {t("analyzer")}
            <ArrowUpLeft className="size-4 rtl:rotate-0 ltr:rotate-90" />
          </Link>
        </div>
      </div>
    </footer>
  );
}
