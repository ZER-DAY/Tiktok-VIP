"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const plans = [
  { key: "basic", popular: false, featureCount: 3 },
  { key: "advanced", popular: true, featureCount: 4 },
  { key: "professional", popular: false, featureCount: 4 },
] as const;

export function PricingSection() {
  const t = useTranslations("pricing");

  return (
    <section
      id="pricing"
      className="scroll-mt-24 rounded-[14px] border border-black/[0.07] bg-white px-4 py-4 shadow-[0_9px_24px_rgba(20,28,45,.055)] sm:pl-4 sm:pr-6"
    >
      <h2 className="mb-5 text-center text-[14px] font-bold text-[#1c2230]">{t("compactTitle")}</h2>

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-[200px_219px_215px] xl:gap-4">
        {plans.map((plan, index) => (
          <motion.article
            key={plan.key}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`relative flex min-h-[250px] flex-col rounded-[13px] border bg-white px-4 pb-4 pt-[18px] text-center ${
              plan.popular
                ? "border-brand/65 shadow-[0_13px_28px_-18px_rgba(255,77,103,.65)]"
                : "border-black/[0.07]"
            }`}
          >
            {plan.popular && (
              <>
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#fff0f0] px-3 py-1 text-[9px] font-black text-brand">
                  {t("mostPopular")}
                </span>
                <span className="absolute -top-3 right-[78%] hidden whitespace-nowrap rounded-full bg-[#fff0f0] px-2 py-1 text-[8px] font-bold text-brand xl:block">
                  {t("annualSaving")}
                </span>
              </>
            )}

            <h3 className="text-[12px] font-bold text-[#262c38]">{t(`${plan.key}.name`)}</h3>
            <div className="mt-2" dir="ltr">
              <strong className="text-[28px] font-black tracking-tight text-[#111724]">
                {t(`${plan.key}.price`)}
              </strong>
            </div>
            <span className="text-[9px] text-[#7a808a]">{t(`${plan.key}.period`)}</span>
            <p className="mt-2 min-h-8 text-[9px] leading-4 text-[#6e7480]">
              {t(`${plan.key}.description`)}
            </p>

            <ul className="mt-3 flex-1 space-y-2 border-t border-black/[0.06] pt-3 text-start">
              {Array.from({ length: plan.featureCount }, (_, featureIndex) => (
                <li
                  key={featureIndex}
                  className="flex items-start gap-2 text-[9px] leading-4 text-[#646b76]"
                >
                  <Check className="mt-0.5 size-3.5 shrink-0 text-[#12ad69]" strokeWidth={2.5} />
                  <span>{t(`${plan.key}.feature${featureIndex + 1}`)}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className={`mt-4 inline-flex h-9 items-center justify-center rounded-[9px] text-[11px] font-bold transition ${
                plan.popular
                  ? "bg-brand text-white hover:bg-[#f33f5b]"
                  : "border border-black/[0.08] text-[#353b47] hover:border-brand/25 hover:text-brand"
              }`}
            >
              {t("cta")}
            </Link>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
