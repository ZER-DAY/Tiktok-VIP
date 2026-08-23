"use client";

import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ScoreCard } from "@/components/report/score-card";
import { InsightSection } from "@/components/report/insight-section";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Video,
  Clock,
  Zap,
  Target,
  Shield,
  Users,
  Download,
  Send,
  CheckCircle,
  FileText,
} from "lucide-react";

interface ReportData {
  reportId: string;
  account: {
    username: string;
    provider: string;
    isVerified: boolean;
    accountType: string;
    countryGuess: string | null;
    countryGuessConfidence: number | null;
    bioLanguageGuess: string | null;
    accountCreatedAtGuess: string | null;
    isEstimated: { country: boolean; createdAt: boolean };
  };
  statistics: {
    followers: number;
    following: number;
    totalLikes: number;
    videoCount: number;
    avgViews: number | null;
    avgLikes: number | null;
    avgComments: number | null;
    avgShares: number | null;
  };
  scores: {
    accountStrength: number;
    contentQuality: number;
    engagementQuality: number;
    postingConsistency: number;
    explorePotential: number;
    livePotential: number;
    professionalism: number;
    growthRate: number | null;
    breakdown: Record<string, unknown>;
  };
  insights: Array<{
    type: string;
    title: string;
    description: string;
    evidenceRef: unknown;
  }>;
  generatedAt: string;
  capturedAt: string;
}

const COUNTRY_TRANSLATION_KEYS: Record<string, string> = {
  "Saudi Arabia": "SaudiArabia",
  Egypt: "Egypt",
  UAE: "UAE",
  Kuwait: "Kuwait",
  Qatar: "Qatar",
  Bahrain: "Bahrain",
  Oman: "Oman",
  Jordan: "Jordan",
  Iraq: "Iraq",
  Morocco: "Morocco",
  Algeria: "Algeria",
  Tunisia: "Tunisia",
  Lebanon: "Lebanon",
  Palestine: "Palestine",
  Syria: "Syria",
};

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

function getScoreLevel(score: number): "high" | "medium" | "low" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function getScoreColorClass(level: "high" | "medium" | "low"): string {
  switch (level) {
    case "high":
      return "text-success";
    case "medium":
      return "text-warning";
    case "low":
      return "text-destructive";
  }
}

const scoreIcons = {
  engagementQuality: Zap,
  contentQuality: Video,
  postingConsistency: Clock,
  explorePotential: Target,
  livePotential: BarChart3,
  professionalism: Shield,
};

const scoreKeys = [
  "engagementQuality",
  "contentQuality",
  "postingConsistency",
  "explorePotential",
  "livePotential",
  "professionalism",
] as const;

export default function ReportPage({
  params,
}: {
  params: Promise<{ locale: string; reportId: string }>;
}) {
  const { locale, reportId } = use(params);
  const t = useTranslations("report");
  const router = useRouter();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eligibilityThreshold, setEligibilityThreshold] = useState(60);

  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  const [applicationError, setApplicationError] = useState("");
  const [applicationForm, setApplicationForm] = useState({
    fullName: "",
    phone: "",
    telegram: "",
    email: "",
  });

  const handleApplicationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingApplication(true);
    setApplicationError("");

    try {
      const res = await fetch("/api/agency/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: report?.account.username,
          ...applicationForm,
        }),
      });

      if (res.ok) {
        setApplicationSuccess(true);
      } else {
        const data = await res.json();
        setApplicationError(data.error?.message || t("application.error"));
      }
    } catch {
      setApplicationError(t("application.error"));
    } finally {
      setIsSubmittingApplication(false);
    }
  };

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/${reportId}`);
        const data = await res.json();
        if (data.success) {
          setReport(data.data);
        } else {
          setError(data.error?.message || t("notFound"));
        }
      } catch {
        setError(t("error"));
      } finally {
        setLoading(false);
      }
    }

    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.success) {
          setEligibilityThreshold(data.data.agencyEligibilityThreshold);
        }
      } catch {
        // Use default threshold
      }
    }

    fetchReport();
    fetchSettings();
  }, [reportId, t]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background pt-24 pb-12 px-4">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
            <div className="h-40 bg-muted/50 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !report) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground mb-2">{t("error")}</h1>
            <p className="text-muted-foreground mb-6">{error || t("notFound")}</p>
            <button
              onClick={() => router.refresh()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-all"
            >
              {t("retry")}
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const isAgencyEligible = report.scores.accountStrength >= eligibilityThreshold;
  const breakdown = report.scores.breakdown as Record<string, Record<string, unknown>>;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background px-4 pb-16 pt-28 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-bold text-brand">
                <BarChart3 className="size-4" />
                {t("reportLabel")}
              </div>
              <h1 className="text-4xl font-black tracking-tight text-foreground">{t("title")}</h1>
              <p className="text-muted-foreground text-sm">
                {new Date(report.generatedAt).toLocaleDateString(
                  locale === "ar" ? "ar-SA" : "en-US"
                )}{" "}
                • @{report.account.username}
              </p>
            </div>
            <a
              href={`/api/reports/${reportId}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white shadow-lg shadow-brand/15 transition hover:-translate-y-0.5 hover:bg-brand/90"
            >
              <Download className="w-4 h-4" />
              {t("exportPDF")}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-5 overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_25px_70px_-48px_rgba(17,24,39,.5)]"
          >
            <div className="grid items-stretch lg:grid-cols-[1fr_1px_.52fr_1px_180px]">
              <div className="flex items-center gap-5 p-6 sm:p-8">
                <div className="grid size-20 shrink-0 place-items-center rounded-full bg-foreground text-2xl font-black text-background ring-4 ring-muted">
                  {report.account.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="truncate text-2xl font-black text-foreground">
                      @{report.account.username}
                    </h2>
                    {report.account.isVerified && (
                      <span className="shrink-0 rounded-full bg-info/10 px-2 py-0.5 text-xs font-bold text-info">
                        {t("verified")}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {report.account.accountType === "business"
                      ? t("business")
                      : report.account.accountType === "personal"
                        ? t("personal")
                        : t("unknown")}
                  </p>
                </div>
              </div>
              <div className="hidden bg-border lg:block" />
              <div className="grid grid-cols-2 gap-x-7 gap-y-5 border-t border-border p-6 lg:border-t-0 lg:p-8">
                {[
                  { label: t("followers"), value: report.statistics.followers },
                  { label: t("following"), value: report.statistics.following },
                  { label: t("totalLikes"), value: report.statistics.totalLikes },
                  { label: t("videoCount"), value: report.statistics.videoCount },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xl font-black text-foreground">{formatNumber(stat.value)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
              <div className="hidden bg-border lg:block" />
              <div className="grid place-items-center border-t border-border p-6 text-center lg:border-t-0">
                <div>
                  <p className="mb-3 text-xs font-bold text-muted-foreground">
                    {t("accountStrength")}
                  </p>
                  <div
                    className={`mx-auto grid size-28 place-items-center rounded-full ${report.scores.accountStrength >= 70 ? "bg-[conic-gradient(#16a34a_0_var(--score),#e5e7eb_var(--score)_100%)]" : report.scores.accountStrength >= 40 ? "bg-[conic-gradient(#ea580c_0_var(--score),#e5e7eb_var(--score)_100%)]" : "bg-[conic-gradient(#dc2626_0_var(--score),#e5e7eb_var(--score)_100%)]"}`}
                    style={
                      { "--score": `${report.scores.accountStrength}%` } as React.CSSProperties
                    }
                  >
                    <div className="grid size-[88px] place-items-center rounded-full bg-card">
                      <div>
                        <strong
                          className={`block text-4xl ${getScoreColorClass(getScoreLevel(report.scores.accountStrength))}`}
                        >
                          {report.scores.accountStrength}
                        </strong>
                        <span className="text-[10px] text-muted-foreground">/ 100</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {(report.statistics.avgViews || report.statistics.avgLikes) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
            >
              {[
                { label: t("avgViews"), value: report.statistics.avgViews },
                { label: t("avgLikes"), value: report.statistics.avgLikes },
                { label: t("avgComments"), value: report.statistics.avgComments },
                { label: t("avgShares"), value: report.statistics.avgShares },
              ]
                .filter((s) => s.value !== null)
                .map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-card border border-border rounded-xl p-4 text-center"
                  >
                    <p className="text-lg font-bold text-foreground">
                      {stat.value ? formatNumber(stat.value) : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <h3 className="mb-4 flex items-center gap-2 text-lg font-black text-foreground">
              <BarChart3 className="w-5 h-5 text-brand" />
              {t("aiResults")}
            </h3>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {scoreKeys.slice(0, 4).map((key) => (
                <ScoreCard
                  key={key}
                  title={t(`scores.${key}`)}
                  score={report.scores[key]}
                  icon={scoreIcons[key]}
                  breakdown={breakdown?.[key]}
                />
              ))}
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {scoreKeys.slice(4).map((key) => (
                <ScoreCard
                  key={key}
                  title={t(`scores.${key}`)}
                  score={report.scores[key]}
                  icon={scoreIcons[key]}
                  breakdown={breakdown?.[key]}
                  compact
                />
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6"
          >
            <p className="text-sm text-warning">{t("disclaimer.explore")}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <InsightSection
              title={t("insights.strengths")}
              insights={report.insights}
              type="strength"
              icon={TrendingUp}
              colorClass="text-success"
            />
            <InsightSection
              title={t("insights.weaknesses")}
              insights={report.insights}
              type="weakness"
              icon={TrendingDown}
              colorClass="text-destructive"
            />
            <InsightSection
              title={t("insights.recommendations")}
              insights={report.insights}
              type="recommendation"
              icon={Target}
              colorClass="text-info"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <InsightSection
              title={t("insights.audience")}
              insights={report.insights}
              type="audience"
              icon={Users}
              colorClass="text-brand-purple"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <InsightSection
              title={t("insights.competitors")}
              insights={report.insights}
              type="competitor"
              icon={Users}
              colorClass="text-brand-pink"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-card border border-border rounded-2xl p-6 mb-6"
          >
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              {t("accountInfo")}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {report.account.countryGuess && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("country")}</p>
                  <p className="text-foreground flex items-center gap-2">
                    {COUNTRY_TRANSLATION_KEYS[report.account.countryGuess]
                      ? t(`countries.${COUNTRY_TRANSLATION_KEYS[report.account.countryGuess]}`)
                      : report.account.countryGuess}
                    {report.account.isEstimated.country && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs">
                        {t("estimated")}
                      </span>
                    )}
                  </p>
                  {report.account.countryGuessConfidence !== null && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("countryConfidence", {
                        confidence: Math.round(report.account.countryGuessConfidence * 100),
                      })}
                    </p>
                  )}
                </div>
              )}
              {report.account.bioLanguageGuess && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("language")}</p>
                  <p className="text-foreground">{report.account.bioLanguageGuess}</p>
                </div>
              )}
            </div>
          </motion.div>

          {isAgencyEligible && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-border rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{t("agency.eligible")}</h3>
              </div>
              <p className="text-muted-foreground mb-4">
                {t("agency.scoreDescription", { score: report.scores.accountStrength })}
              </p>

              {!showApplicationForm ? (
                <button
                  onClick={() => setShowApplicationForm(true)}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-all"
                >
                  {t("agency.joinCTA")}
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-card border border-border rounded-xl p-6 mt-4"
                >
                  <h4 className="text-foreground font-semibold mb-4">
                    {t("application.formTitle")}
                  </h4>

                  {applicationSuccess ? (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="w-6 h-6 text-success" />
                      </div>
                      <p className="text-foreground font-medium">{t("application.success")}</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        {t("application.successMessage")}
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleApplicationSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-muted-foreground mb-1">
                            {t("application.fullName")} *
                          </label>
                          <input
                            type="text"
                            value={applicationForm.fullName}
                            onChange={(e) =>
                              setApplicationForm({ ...applicationForm, fullName: e.target.value })
                            }
                            className="w-full bg-background border border-border rounded-xl py-2 px-3 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-1">
                            {t("application.phone")} *
                          </label>
                          <input
                            type="tel"
                            value={applicationForm.phone}
                            onChange={(e) =>
                              setApplicationForm({ ...applicationForm, phone: e.target.value })
                            }
                            className="w-full bg-background border border-border rounded-xl py-2 px-3 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-transparent"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-1">
                            {t("application.telegram")} *
                          </label>
                          <input
                            type="text"
                            value={applicationForm.telegram}
                            onChange={(e) =>
                              setApplicationForm({ ...applicationForm, telegram: e.target.value })
                            }
                            className="w-full bg-background border border-border rounded-xl py-2 px-3 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-transparent"
                            placeholder="@username"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-muted-foreground mb-1">
                            {t("application.email")} *
                          </label>
                          <input
                            type="email"
                            value={applicationForm.email}
                            onChange={(e) =>
                              setApplicationForm({ ...applicationForm, email: e.target.value })
                            }
                            className="w-full bg-background border border-border rounded-xl py-2 px-3 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-transparent"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={isSubmittingApplication}
                          className="px-6 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          {isSubmittingApplication
                            ? t("application.submitting")
                            : t("application.submit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowApplicationForm(false)}
                          className="px-6 py-2 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-all"
                        >
                          {t("application.cancel")}
                        </button>
                      </div>
                      {applicationError && (
                        <p className="text-destructive text-sm">{applicationError}</p>
                      )}
                    </form>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
