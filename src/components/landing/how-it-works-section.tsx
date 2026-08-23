"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { FileBarChart, ScanSearch, UserRoundPlus } from "lucide-react";

const steps = [
  {
    key: "step1",
    icon: UserRoundPlus,
    tone: "text-brand-secondary border-brand-secondary/25 bg-brand-secondary/5",
  },
  { key: "step2", icon: ScanSearch, tone: "text-brand border-brand/25 bg-brand/5" },
  {
    key: "step3",
    icon: FileBarChart,
    tone: "text-brand-secondary border-brand-secondary/25 bg-brand-secondary/5",
  },
];

export function HowItWorksSection() {
  const t = useTranslations("howItWorks");
  return (
    <section id="how-it-works" className="px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-bold text-muted-foreground">{t("kicker")}</p>
          <h2 className="mt-2 text-4xl font-black tracking-tight text-foreground">{t("title")}</h2>
        </div>
        <div className="relative grid overflow-hidden rounded-[1.75rem] border border-border bg-card md:grid-cols-3">
          <div className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-[58px] hidden border-t border-dashed border-border md:block" />
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.article
                key={step.key}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative px-7 py-9 text-center md:border-e md:border-border md:last:border-e-0"
              >
                <div
                  className={`relative z-10 mx-auto grid size-14 place-items-center rounded-full border bg-card ${step.tone}`}
                >
                  <Icon className="size-6" />
                  <span className="absolute -end-2 -top-2 grid size-7 place-items-center rounded-full border border-current bg-card text-xs font-black">
                    {index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-lg font-extrabold text-foreground">
                  {t(`${step.key}Title`)}
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-7 text-muted-foreground">
                  {t(`${step.key}Desc`)}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
