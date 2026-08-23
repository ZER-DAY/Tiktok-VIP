"use client";

import { useTranslations } from "next-intl";
import { Database, Headphones, LockKeyhole, ShieldCheck } from "lucide-react";

const items = [
  { key: "privacy", icon: LockKeyhole },
  { key: "fresh", icon: Database },
  { key: "actionable", icon: ShieldCheck },
  { key: "support", icon: Headphones },
];

export function SocialProofSection() {
  const t = useTranslations("socialProof");
  return (
    <section className="border-y border-border bg-card/70 px-5 py-7 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <p className="mb-6 text-center text-sm font-bold text-foreground">{t("trustLine")}</p>
        <div className="grid grid-cols-2 gap-x-5 gap-y-5 md:grid-cols-4">
          {items.map(({ key, icon: Icon }, index) => (
            <div
              key={key}
              className={`flex items-center justify-center gap-2.5 text-xs font-medium text-muted-foreground md:text-sm ${index ? "md:border-e md:border-border" : ""}`}
            >
              <Icon className="size-4 text-brand-secondary" />
              {t(`trust.${key}`)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
