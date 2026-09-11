import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpLeft, Users } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { Link } from "@/i18n/navigation";
import bahaaPhoto from "@/assets/team/bahaa-alhabeel.jpg";
import tarekPhoto from "@/assets/team/tarek-saqr.jpg";

// The photos have different framings (square close-up vs. tall full-body), so
// each one carries its own focal point for the shared 4:5 card crop.
const TEAM = [
  { key: "bahaa", photo: bahaaPhoto, objectPosition: "50% 0%" },
  { key: "tarek", photo: tarekPhoto, objectPosition: "50% 18%" },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return { title: t("metaTitle"), description: t("subtitle") };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <>
      <Navbar />
      <main className="relative isolate overflow-hidden px-4 pb-20 pt-[124px] sm:px-6">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_6%,rgba(255,91,97,.08),transparent_30%),radial-gradient(circle_at_14%_38%,rgba(109,93,251,.05),transparent_32%)]" />

        <div className="mx-auto w-full max-w-[880px]">
          <header className="mx-auto max-w-2xl text-center duration-500 animate-in fade-in slide-in-from-bottom-3">
            <p className="eyebrow">
              <Users className="size-4" strokeWidth={2.5} />
              {t("eyebrow")}
            </p>
            <h1 className="mt-5 text-balance text-[38px] font-black leading-[1.25] tracking-[-0.045em] text-[#101625] sm:text-5xl lg:text-[56px]">
              {t("title")}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-[15px] leading-8 text-muted-foreground sm:text-base">
              {t("subtitle")}
            </p>
          </header>

          <section aria-labelledby="team-heading" className="mt-14">
            <h2 id="team-heading" className="sr-only">
              {t("teamHeading")}
            </h2>
            <ul className="grid gap-6 sm:grid-cols-2">
              {TEAM.map((member, index) => {
                const name = t(`members.${member.key}.name`);

                return (
                  <li
                    key={member.key}
                    className={`duration-700 fill-mode-both animate-in fade-in slide-in-from-bottom-4 ${
                      index === 0 ? "delay-150" : "delay-300"
                    }`}
                  >
                    <article className="group surface-card overflow-hidden p-2.5 transition-shadow duration-300 hover:shadow-[0_28px_60px_-36px_rgba(17,24,39,.55)]">
                      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
                        <Image
                          src={member.photo}
                          alt={t("photoAlt", { name })}
                          fill
                          placeholder="blur"
                          loading="eager"
                          sizes="(min-width: 640px) 430px, 100vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                          style={{ objectPosition: member.objectPosition }}
                        />
                        <div
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0b0f1a]/85 via-[#0b0f1a]/35 to-transparent"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                          <h3 className="text-2xl font-black tracking-[-0.02em] text-white sm:text-[28px]">
                            {name}
                          </h3>
                          <p className="mt-2.5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-bold text-white ring-1 ring-white/25 backdrop-blur-md">
                            <span aria-hidden="true" className="size-1.5 rounded-full bg-brand" />
                            {t(`members.${member.key}.role`)}
                          </p>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="surface-card mt-14 flex flex-col items-center gap-6 p-7 text-center sm:flex-row sm:justify-between sm:p-9 sm:text-start">
            <div>
              <h2 className="text-xl font-black text-foreground sm:text-2xl">{t("ctaTitle")}</h2>
              <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
                {t("ctaSubtitle")}
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-brand px-6 text-[15px] font-extrabold text-white shadow-[0_13px_28px_-13px_rgba(255,77,103,.75)] transition hover:-translate-y-0.5 hover:bg-[#f33f5b] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
            >
              {t("ctaButton")}
              <ArrowUpLeft className="size-4 rtl:rotate-0 ltr:rotate-90" />
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
