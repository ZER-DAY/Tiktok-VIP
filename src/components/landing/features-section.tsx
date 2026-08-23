"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, FileText, Target, Users, Video } from "lucide-react";

const features = [
  { key: "accountAnalysis", icon: BarChart3, tone: "bg-brand/10 text-brand" },
  { key: "videoAnalysis", icon: Video, tone: "bg-info/10 text-info" },
  { key: "pdfExport", icon: FileText, tone: "bg-success/10 text-success" },
  { key: "competitorAnalysis", icon: Users, tone: "bg-brand-secondary/10 text-brand-secondary" },
];

export function FeaturesSection() {
  const t = useTranslations("features");
  return (
    <section id="features" className="px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.72fr_1.28fr]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-brand">
            <Target className="size-4" />
            {t("eyebrow")}
          </div>
          <h2 className="text-balance text-4xl font-black leading-tight tracking-tight text-foreground sm:text-5xl">
            {t("titleNew")}
          </h2>
          <p className="mt-5 max-w-md text-base leading-8 text-muted-foreground">{t("subtitle")}</p>
          <a
            href="#how-it-works"
            className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-brand-secondary hover:text-brand"
          >
            {t("explore")}
            <ArrowLeft className="size-4 rtl:rotate-0 ltr:rotate-180" />
          </a>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.key}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.07 }}
                className="group rounded-2xl border border-border bg-card p-6 shadow-[0_16px_45px_-38px_rgba(17,24,39,.4)] transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-lg"
              >
                <div className={`mb-5 grid size-11 place-items-center rounded-xl ${feature.tone}`}>
                  <Icon className="size-5" />
                </div>
                <h3 className="text-lg font-extrabold text-foreground">{t(feature.key)}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {t(`${feature.key}Desc`)}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
