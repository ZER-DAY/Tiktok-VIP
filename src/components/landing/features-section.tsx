"use client";

import { motion } from "framer-motion";
import { ChartNoAxesCombined, FileText, Target, UsersRound } from "lucide-react";
import { useTranslations } from "next-intl";

const features = [
  {
    key: "reportsShare",
    icon: FileText,
    iconClassName: "bg-[#fff4df] text-[#f5a20b] border-[#f8e7c4]",
  },
  {
    key: "smartCompetitors",
    icon: Target,
    iconClassName: "bg-[#fff0f0] text-brand border-[#ffdede]",
  },
  {
    key: "discoverResults",
    icon: ChartNoAxesCombined,
    iconClassName: "bg-[#f0efff] text-[#7258e8] border-[#e3e0ff]",
  },
  {
    key: "deepAudience",
    icon: UsersRound,
    iconClassName: "bg-[#e9f8f2] text-[#13aa6c] border-[#d9f0e7]",
  },
] as const;

export function FeaturesSection() {
  const t = useTranslations("features");

  return (
    <section id="features" className="scroll-mt-24 px-4 pt-[15px] sm:px-6">
      <h2 className="sr-only">{t("title")}</h2>
      <div
        data-testid="landing-features"
        className="mx-auto grid w-full max-w-[1275px] gap-3 sm:grid-cols-2 xl:w-[83.0078125vw] xl:-translate-x-[4.5px] xl:grid-cols-4"
      >
        {features.map(({ key, icon: Icon, iconClassName }, index) => (
          <motion.article
            key={key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: index * 0.045 }}
            className="flex min-h-[106px] items-center justify-between gap-4 rounded-[14px] border border-black/[0.07] bg-white px-4 py-4 shadow-[0_9px_24px_rgba(20,28,45,.055)] transition hover:-translate-y-0.5 hover:border-brand/20 hover:shadow-[0_13px_28px_rgba(20,28,45,.08)]"
          >
            <div className="min-w-0 text-start">
              <h3 className="text-[14px] font-black text-[#1d2330]">{t(`${key}.title`)}</h3>
              <p className="mt-1.5 text-[11px] leading-[1.75] text-[#707681]">
                {t(`${key}.description`)}
              </p>
            </div>
            <span
              className={`grid size-[58px] shrink-0 place-items-center rounded-full border ${iconClassName}`}
            >
              <Icon className="size-6" strokeWidth={2} />
            </span>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
