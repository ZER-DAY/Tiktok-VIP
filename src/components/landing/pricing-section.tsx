"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    key: "free",
    popular: false,
    features: 3,
  },
  {
    key: "pro",
    popular: true,
    features: 4,
  },
  {
    key: "agency",
    popular: false,
    features: 4,
  },
];

export function PricingSection() {
  const t = useTranslations("pricing");

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8" id="pricing">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t("title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">{t("subtitle")}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative bg-card border rounded-2xl p-8 ${
                plan.popular ? "border-brand/50 shadow-xl shadow-brand/10" : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-brand-foreground text-xs font-semibold px-4 py-1 rounded-full">
                  {t("popular")}
                </div>
              )}

              <h3 className="text-xl font-semibold text-foreground mb-2">{t(`${plan.key}`)}</h3>

              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">{t(`${plan.key}Price`)}</span>
                <span className="text-muted-foreground text-sm">{t(`${plan.key}Period`)}</span>
              </div>

              <ul className="space-y-3 mb-8">
                {Array.from({ length: plan.features }, (_, i) => i + 1).map((i) => {
                  const featureKey = `${plan.key}Feature${i}`;
                  return (
                    <li key={i} className="flex items-center gap-3 text-muted-foreground text-sm">
                      <Check className="w-4 h-4 text-success shrink-0" />
                      {t(featureKey)}
                    </li>
                  );
                })}
              </ul>

              <button
                className={`w-full py-3 rounded-full font-semibold transition-all hover:scale-105 active:scale-95 ${
                  plan.popular
                    ? "bg-brand text-brand-foreground hover:opacity-90"
                    : "bg-muted text-foreground hover:bg-accent border border-border"
                }`}
              >
                {t("cta")}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
