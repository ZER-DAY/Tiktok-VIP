"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import {
  ArrowUpLeft,
  BarChart3,
  CheckCircle2,
  Eye,
  Heart,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { useState } from "react";

const chart = [22, 31, 28, 44, 39, 58, 52, 71, 64, 82, 76, 91];

export function HeroSection() {
  const t = useTranslations("hero");
  const router = useRouter();
  const [username, setUsername] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = username.replace(/^@/, "").trim();
    if (clean) router.push(`/analyze/${clean}`);
  };

  return (
    <section className="relative isolate overflow-hidden border-b border-border bg-background pb-16 pt-28 sm:pb-24 sm:pt-32">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70 [background-image:linear-gradient(to_right,#11182708_1px,transparent_1px),linear-gradient(to_bottom,#11182708_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="pointer-events-none absolute -end-32 top-12 -z-10 size-96 rounded-full bg-brand/10 blur-3xl" />

      <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-5 sm:px-8 lg:grid-cols-[0.83fr_1.17fr] lg:px-12 xl:gap-20">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-xl text-center lg:mx-0 lg:text-start"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/5 px-3.5 py-2 text-xs font-semibold text-brand">
            <Sparkles className="size-4" />
            {t("eyebrow")}
          </div>
          <h1 className="text-balance text-5xl font-black leading-[1.08] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-[4.5rem]">
            {t("titleLine1")}
            <span className="mt-1 block text-brand">{t("titleLine2")}</span>
          </h1>
          <p className="mx-auto mt-7 max-w-lg text-pretty text-base leading-8 text-muted-foreground sm:text-lg lg:mx-0">
            {t("subtitle")}
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-9 rounded-2xl border border-border bg-card p-2 shadow-[0_20px_55px_-30px_rgba(17,24,39,.35)] sm:flex"
          >
            <label className="relative block min-w-0 flex-1">
              <span className="sr-only">{t("inputPlaceholder")}</span>
              <Search className="absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder={t("inputPlaceholder")}
                className="h-14 w-full rounded-xl bg-transparent pe-4 ps-12 text-base text-foreground outline-none placeholder:text-muted-foreground focus:bg-muted/45"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </label>
            <button className="mt-2 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand px-7 font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand/90 sm:mt-0 sm:w-auto">
              {t("cta")}
              <ArrowUpLeft className="size-4 rtl:rotate-0 ltr:rotate-90" />
            </button>
          </form>

          <div className="mt-6 grid grid-cols-3 gap-3 text-start text-xs text-muted-foreground sm:flex sm:items-center sm:gap-6">
            <span className="flex items-center gap-1.5">
              <Zap className="size-4 text-brand" />
              {t("fastReport")}
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-brand-secondary" />
              {t("clearInsights")}
            </span>
            <span className="flex items-center gap-1.5">
              <LockKeyhole className="size-4 text-success" />
              {t("privacy")}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.12 }}
          className="relative"
        >
          <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-brand-secondary/5 blur-xl" />
          <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_32px_90px_-42px_rgba(17,24,39,.45)]">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-full bg-foreground text-sm font-black text-background">
                  K
                </div>
                <div>
                  <p className="font-bold text-foreground">{t("mockupUser")}</p>
                  <p className="text-xs text-muted-foreground">{t("mockupCreator")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
                <CheckCircle2 className="size-4" />
                {t("reportReady")}
              </div>
            </div>

            <div className="grid gap-5 p-5 sm:p-7 md:grid-cols-[150px_1fr]">
              <div className="rounded-2xl border border-border bg-background p-5 text-center">
                <p className="text-xs font-medium text-muted-foreground">{t("accountScore")}</p>
                <div className="relative mx-auto mt-3 grid size-24 place-items-center rounded-full bg-[conic-gradient(#20b486_0_87%,#e5e7eb_87%_100%)]">
                  <div className="grid size-[76px] place-items-center rounded-full bg-card">
                    <div>
                      <strong className="block text-3xl text-foreground">87</strong>
                      <span className="text-[10px] text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                </div>
                <span className="mt-3 inline-block rounded-full bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                  {t("veryGood")}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  [Users, t("mockupFollowers"), t("mockupFollowersLabel")],
                  [Heart, t("mockupLikes"), t("mockupLikesLabel")],
                  [TrendingUp, t("mockupGrowth"), t("mockupGrowthLabel")],
                ].map(([Icon, value, label], index) => {
                  const MetricIcon = Icon as typeof Users;
                  return (
                    <div
                      key={String(label)}
                      className="rounded-2xl border border-border p-3 sm:p-4"
                    >
                      <MetricIcon
                        className={`mb-3 size-4 ${index === 2 ? "text-success" : "text-brand-secondary"}`}
                      />
                      <strong className="block text-base text-foreground sm:text-xl">
                        {String(value)}
                      </strong>
                      <span className="text-[10px] text-muted-foreground sm:text-xs">
                        {String(label)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 px-5 pb-5 sm:px-7 sm:pb-7 md:grid-cols-[1.3fr_.7fr]">
              <div className="rounded-2xl border border-border p-4">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{t("performance")}</p>
                    <p className="text-xs text-muted-foreground">{t("lastThirtyDays")}</p>
                  </div>
                  <BarChart3 className="size-5 text-brand-secondary" />
                </div>
                <div className="flex h-28 items-end gap-1.5 border-b border-border">
                  {chart.map((height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-t-sm bg-brand-secondary/20 transition hover:bg-brand-secondary"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm font-bold text-foreground">{t("contentSignals")}</p>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Eye className="size-4 text-brand" />
                      {t("reach")}
                    </span>
                    <b>82%</b>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div className="h-full w-[82%] rounded-full bg-brand" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Video className="size-4 text-brand-secondary" />
                      {t("consistency")}
                    </span>
                    <b>74%</b>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted">
                    <div className="h-full w-[74%] rounded-full bg-brand-secondary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
