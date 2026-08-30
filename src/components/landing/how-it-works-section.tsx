"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

const steps = ["step1", "step2", "step3"] as const;

export function HowItWorksSection() {
  const t = useTranslations("howItWorks");

  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 rounded-[14px] border border-black/[0.07] bg-white px-5 py-5 shadow-[0_9px_24px_rgba(20,28,45,.055)] sm:px-7"
    >
      <h2 className="text-center text-[16px] font-bold text-[#1c2230]">{t("compactTitle")}</h2>

      <div className="relative mt-6 grid gap-7 sm:grid-cols-3 sm:gap-3">
        <div className="pointer-events-none absolute inset-x-[16%] top-[16px] hidden items-center justify-around text-[#a7abb3] sm:flex">
          <span className="w-[30%] border-t border-dashed border-[#b9bdc5]" />
          <ArrowLeft className="size-4" />
          <span className="w-[30%] border-t border-dashed border-[#b9bdc5]" />
          <ArrowLeft className="size-4" />
        </div>

        {steps.map((step, index) => (
          <motion.article
            key={step}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.06 }}
            className={`relative text-center ${
              index === 0 ? "-left-px" : index === 1 ? "-left-[5px] -top-px" : "-left-[6px] -top-px"
            }`}
          >
            <span className="relative z-10 mx-auto grid size-9 place-items-center rounded-full bg-brand text-base font-black text-white shadow-[0_7px_16px_-7px_rgba(255,77,103,.8)]">
              {index + 1}
            </span>
            <h3 className="mt-4 text-[13px] font-bold text-[#252b37]">
              {t(`${step}CompactTitle`)}
            </h3>
            <p className="mx-auto mt-2 max-w-[150px] text-[10px] leading-[1.8] text-[#717782]">
              {t(`${step}CompactDesc`)}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
