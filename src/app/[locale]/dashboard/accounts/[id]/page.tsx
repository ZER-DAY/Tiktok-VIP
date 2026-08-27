"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  Target,
  Shield,
  CalendarDays,
  Trophy,
} from "lucide-react";
import { ScoreCard } from "@/components/report/score-card";
import { InsightSection } from "@/components/report/insight-section";

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
    liveCreatorLeague: string | null;
    liveAccountLevel: number | null;
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

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

export default function AccountReportPage() {
  const params = useParams();
  const t = useTranslations("report");
  const locale = useLocale();
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/dashboard/accounts/${params.id}`);
        if (res.ok) {
          const result = await res.json();
          setReport(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch report:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-40 bg-muted/50 rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted/50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">{t("notFound")}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
            {report.account.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">@{report.account.username}</h1>
              {report.account.isVerified && (
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs">
                  {t("verified")}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {new Date(report.generatedAt).toLocaleDateString("ar-SA")}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3.5" />
              {t("accountCreatedAt")}:{" "}
              {report.account.accountCreatedAtGuess
                ? new Intl.DateTimeFormat(locale, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(report.account.accountCreatedAtGuess))
                : t("accountCreatedAtUnavailable")}
              {report.account.accountCreatedAtGuess && report.account.isEstimated.createdAt
                ? ` (${t("estimated")})`
                : ""}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Trophy className="size-3.5 text-amber-500" />
              {t("liveAccountInfo")}: {t("liveAccountLevel")}:{" "}
              {report.account.liveAccountLevel ?? t("liveAccountLevelUnavailable")}
            </p>
          </div>
        </div>
        <div className="text-center">
          <div
            className={`text-4xl font-bold ${
              report.scores.accountStrength >= 70
                ? "text-success"
                : report.scores.accountStrength >= 40
                  ? "text-warning"
                  : "text-destructive"
            }`}
          >
            {report.scores.accountStrength}
          </div>
          <p className="text-xs text-muted-foreground">{t("accountStrength")}</p>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { label: t("followers"), value: report.statistics.followers },
          { label: t("following"), value: report.statistics.following },
          { label: t("totalLikes"), value: report.statistics.totalLikes },
          { label: t("videoCount"), value: report.statistics.videoCount },
        ].map((stat) => (
          <div key={stat.label} className="bg-muted/50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{formatNumber(stat.value)}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Scores Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-pink" />
          {t("aiResults")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ScoreCard
            title={t("scores.engagementQuality")}
            score={report.scores.engagementQuality}
            icon={Zap}
            breakdown={
              (report.scores.breakdown as Record<string, unknown>)?.engagement as Record<
                string,
                unknown
              >
            }
          />
          <ScoreCard
            title={t("scores.contentQuality")}
            score={report.scores.contentQuality}
            icon={BarChart3}
            breakdown={
              (report.scores.breakdown as Record<string, unknown>)?.content as Record<
                string,
                unknown
              >
            }
          />
          <ScoreCard
            title={t("scores.postingConsistency")}
            score={report.scores.postingConsistency}
            icon={Shield}
            breakdown={
              (report.scores.breakdown as Record<string, unknown>)?.consistency as Record<
                string,
                unknown
              >
            }
          />
          <ScoreCard
            title={t("scores.explorePotential")}
            score={report.scores.explorePotential}
            icon={Target}
            breakdown={
              (report.scores.breakdown as Record<string, unknown>)?.explore as Record<
                string,
                unknown
              >
            }
          />
          <ScoreCard
            title={t("scores.livePotential")}
            score={report.scores.livePotential}
            icon={BarChart3}
            breakdown={
              (report.scores.breakdown as Record<string, unknown>)?.live as Record<string, unknown>
            }
          />
          <ScoreCard
            title={t("scores.professionalism")}
            score={report.scores.professionalism}
            icon={Shield}
            breakdown={
              (report.scores.breakdown as Record<string, unknown>)?.professionalism as Record<
                string,
                unknown
              >
            }
          />
        </div>
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
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

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-wrap gap-4"
      >
        <Link
          href={`/report/${report.reportId}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-muted border border-border text-foreground hover:bg-accent transition-all"
        >
          {t("viewFullReport")}
        </Link>
        <a
          href={`/api/reports/${report.reportId}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-all"
        >
          {t("exportPDF")}
        </a>
      </motion.div>
    </div>
  );
}
