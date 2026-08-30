"use client";

import { motion } from "framer-motion";
import { AtSign, CheckCircle2, TrendingUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { DashboardPreview } from "./dashboard-preview";

export function HeroSection() {
  const t = useTranslations("hero");
  const locale = useLocale();
  const router = useRouter();
  const [username, setUsername] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const cleanUsername = username.replace(/^@/, "").trim();
    if (cleanUsername) router.push(`/analyze/${cleanUsername}`);
  };

  return (
    <section
      id="home"
      data-testid="landing-hero"
      className="relative isolate scroll-mt-24 overflow-hidden px-4 pb-0 pt-[110px] sm:px-6"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_81%_17%,rgba(255,91,97,.065),transparent_26%),radial-gradient(circle_at_16%_40%,rgba(109,93,251,.035),transparent_28%)]" />
      <div className="mx-auto grid w-full max-w-[1275px] items-center gap-10 lg:grid-cols-[minmax(0,.78fr)_minmax(0,1.12fr)] lg:gap-[clamp(42px,3.65vw,56px)] xl:w-[83.0078125vw] xl:-translate-x-[4.5px]">
        <motion.div
          data-testid="hero-copy"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto w-full max-w-[510px] text-center lg:mx-0 lg:translate-y-2.5 lg:text-start xl:-translate-x-[1.5px]"
        >
          <p className="relative inline-flex items-center gap-2 text-[15px] font-extrabold leading-6 text-[#ff5351] sm:text-base xl:-left-[22px] xl:-top-[3px] xl:origin-right xl:scale-x-[1.033] xl:text-[18px]">
            <TrendingUp className="size-5 xl:size-6" strokeWidth={2.5} />
            {t("eyebrow")}
          </p>
          <h1 className="mt-[22px] text-balance text-[44px] font-black leading-[1.28] tracking-[-0.055em] text-[#101625] sm:text-[54px] lg:text-[56px] xl:text-[72px] xl:leading-[1.17]">
            <span className="block origin-right xl:scale-x-[0.916]">{t("titleLine1")}</span>
            <span className="block origin-right xl:scale-x-[0.849]">{t("titleLine2")}</span>
          </h1>
          <p className="mx-auto mt-0 max-w-[500px] origin-right text-pretty text-[14px] leading-7 text-[#6f7480] sm:text-[15px] lg:mx-0 xl:scale-x-[0.892]">
            {t("subtitleShort")}
          </p>

          <form
            onSubmit={handleSubmit}
            dir="ltr"
            className="mx-auto mt-[29px] grid max-w-[500px] gap-2 sm:grid-cols-[minmax(0,1fr)_170px] lg:mx-0"
          >
            <label className="relative block min-w-0">
              <span className="sr-only">{t("inputPlaceholder")}</span>
              <AtSign className="absolute left-4 top-1/2 size-[19px] -translate-y-1/2 text-[#6c727e]" />
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={t("inputPlaceholder")}
                dir={locale === "ar" ? "rtl" : "ltr"}
                className="h-[58px] w-full rounded-[12px] border border-black/[0.09] bg-white pe-4 ps-11 text-sm text-[#151a26] outline-none shadow-[0_8px_22px_rgba(20,28,45,.035)] transition placeholder:text-[#9ba0a9] focus:border-brand/40 focus:ring-4 focus:ring-brand/[0.07]"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </label>
            <button
              type="submit"
              dir={locale === "ar" ? "rtl" : "ltr"}
              className="inline-flex h-[58px] items-center justify-center rounded-[12px] bg-[#fe5351] px-5 text-[15px] font-extrabold text-white shadow-[0_13px_28px_-13px_rgba(255,77,103,.75)] transition hover:-translate-y-0.5 hover:bg-[#f64b4d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
            >
              {t("cta")}
            </button>
          </form>

          <p className="mt-4 flex items-center justify-center gap-2 text-[12px] text-[#7c818a] lg:justify-start">
            <CheckCircle2 className="size-4 fill-[#24b777] text-white" strokeWidth={3} />
            {t("secureHint")}
          </p>
        </motion.div>

        <motion.div
          data-testid="dashboard-preview"
          initial={{ opacity: 0, x: locale === "ar" ? -18 : 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mx-auto w-full max-w-[716px] xl:-translate-x-[1.75px]"
        >
          <DashboardPreview />
        </motion.div>
      </div>
    </section>
  );
}
