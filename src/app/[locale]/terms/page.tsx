"use client";

import { useTranslations } from "next-intl";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export default function TermsPage() {
  const t = useTranslations("terms");

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">{t("title")}</h1>
          <p className="text-muted-foreground text-sm mb-8">{t("lastUpdated")}</p>

          <div className="space-y-8 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("acceptance.title")}</h2>
              <p className="mb-4">{t("acceptance.content")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("description.title")}</h2>
              <p className="mb-4">{t("description.content")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("accounts.title")}</h2>
              <p className="mb-4">{t("accounts.content")}</p>
              <ul className="list-disc list-inside space-y-2 ms-4">
                <li>{t("accounts.item1")}</li>
                <li>{t("accounts.item2")}</li>
                <li>{t("accounts.item3")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {t("subscriptions.title")}
              </h2>
              <p className="mb-4">{t("subscriptions.content")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("usage.title")}</h2>
              <p className="mb-4">{t("usage.content")}</p>
              <ul className="list-disc list-inside space-y-2 ms-4">
                <li>{t("usage.item1")}</li>
                <li>{t("usage.item2")}</li>
                <li>{t("usage.item3")}</li>
                <li>{t("usage.item4")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("content.title")}</h2>
              <p className="mb-4">{t("content.content")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {t("intellectualProperty.title")}
              </h2>
              <p className="mb-4">{t("intellectualProperty.content")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("limitation.title")}</h2>
              <p className="mb-4">{t("limitation.content")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("termination.title")}</h2>
              <p className="mb-4">{t("termination.content")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("governingLaw.title")}</h2>
              <p className="mb-4">{t("governingLaw.content")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("changes.title")}</h2>
              <p className="mb-4">{t("changes.content")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("contact.title")}</h2>
              <p className="mb-4">{t("contact.content")}</p>
            </section>

            <section className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {t("tiktokDisclaimer.title")}
              </h2>
              <p className="mb-4">{t("tiktokDisclaimer.content")}</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
