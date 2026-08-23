"use client";

import { useTranslations } from "next-intl";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export default function PrivacyPage() {
  const t = useTranslations("privacy");

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-8">{t("title")}</h1>
          <p className="text-muted-foreground text-sm mb-8">{t("lastUpdated")}</p>

          <div className="space-y-8 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("intro.title")}</h2>
              <p className="mb-4">{t("intro.content")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {t("dataCollection.title")}
              </h2>
              <p className="mb-4">{t("dataCollection.content")}</p>
              <ul className="list-disc list-inside space-y-2 ms-4">
                <li>{t("dataCollection.item1")}</li>
                <li>{t("dataCollection.item2")}</li>
                <li>{t("dataCollection.item3")}</li>
                <li>{t("dataCollection.item4")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("dataUsage.title")}</h2>
              <p className="mb-4">{t("dataUsage.content")}</p>
              <ul className="list-disc list-inside space-y-2 ms-4">
                <li>{t("dataUsage.item1")}</li>
                <li>{t("dataUsage.item2")}</li>
                <li>{t("dataUsage.item3")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("dataSharing.title")}</h2>
              <p className="mb-4">{t("dataSharing.content")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {t("dataRetention.title")}
              </h2>
              <p className="mb-4">{t("dataRetention.content")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("security.title")}</h2>
              <p className="mb-4">{t("security.content")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("rights.title")}</h2>
              <p className="mb-4">{t("rights.content")}</p>
              <ul className="list-disc list-inside space-y-2 ms-4">
                <li>{t("rights.item1")}</li>
                <li>{t("rights.item2")}</li>
                <li>{t("rights.item3")}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("cookies.title")}</h2>
              <p className="mb-4">{t("cookies.content")}</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">{t("children.title")}</h2>
              <p className="mb-4">{t("children.content")}</p>
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
