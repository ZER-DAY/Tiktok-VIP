"use client";

import { useTranslations } from "next-intl";

export default function LocaleError({ reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("errorPage");

  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-black text-foreground">{t("title")}</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{t("description")}</p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-brand px-6 font-bold text-brand-foreground transition hover:bg-brand/90"
        >
          {t("retry")}
        </button>
      </div>
    </main>
  );
}
