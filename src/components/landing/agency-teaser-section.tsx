"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowUpLeft, DollarSign, Headphones, GraduationCap, Radio } from "lucide-react";
import { Link } from "@/i18n/navigation";

const benefits = [
  { key: "revenue", icon: DollarSign, color: "brand" },
  { key: "support", icon: Headphones, color: "brand-secondary" },
  { key: "training", icon: GraduationCap, color: "success" },
  { key: "management", icon: Radio, color: "warning" },
];

function getIconBgClass(color: string): string {
  switch (color) {
    case "brand":
      return "bg-brand/10";
    case "brand-secondary":
      return "bg-brand-secondary/10";
    case "success":
      return "bg-success/10";
    case "warning":
      return "bg-warning/10";
    default:
      return "bg-brand/10";
  }
}

function getIconColorClass(color: string): string {
  switch (color) {
    case "brand":
      return "text-brand";
    case "brand-secondary":
      return "text-brand-secondary";
    case "success":
      return "text-success";
    case "warning":
      return "text-warning";
    default:
      return "text-brand";
  }
}

export function AgencyTeaserSection() {
  const t = useTranslations("agencyTeaser");

  return (
    <section className="px-5 py-24 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-[1.75rem] border border-brand/20 bg-brand/5 p-7 md:p-12"
        >
          <div className="grid items-center gap-10 md:grid-cols-[.9fr_1.1fr] md:gap-14">
            <div>
              <p className="text-sm font-bold text-brand">{t("eyebrow")}</p>
              <h2 className="mb-4 mt-2 text-3xl font-black text-foreground md:text-4xl">
                {t("title")}
              </h2>
              <p className="mb-8 max-w-xl text-sm leading-8 text-muted-foreground">
                {t("subtitle")}
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-bold text-brand-foreground shadow-[0_12px_24px_-16px_rgba(255,77,103,.9)] transition hover:-translate-y-0.5 hover:bg-brand/90"
              >
                {t("cta")}
                <ArrowUpLeft className="size-4 rtl:rotate-0 ltr:rotate-90" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={benefit.key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-[0_12px_34px_-30px_rgba(17,24,39,.7)] sm:p-5"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getIconBgClass(benefit.color)}`}
                    >
                      <Icon className={`w-5 h-5 ${getIconColorClass(benefit.color)}`} />
                    </div>
                    <span className="text-sm font-semibold leading-6 text-muted-foreground">
                      {t(`benefits.${benefit.key}`)}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
