"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { DollarSign, Headphones, GraduationCap, Radio } from "lucide-react";

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
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-brand/5 border border-border rounded-3xl p-8 md:p-12"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("title")}</h2>
              <p className="text-muted-foreground mb-8">{t("subtitle")}</p>
              <button className="px-6 py-3 rounded-full bg-brand text-brand-foreground font-semibold hover:opacity-90 transition-all hover:scale-105">
                {t("cta")}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={benefit.key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="bg-card border border-border rounded-xl p-4 flex items-center gap-3"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getIconBgClass(benefit.color)}`}
                    >
                      <Icon className={`w-5 h-5 ${getIconColorClass(benefit.color)}`} />
                    </div>
                    <span className="text-sm text-muted-foreground">
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
