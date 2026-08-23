"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart3, Plus } from "lucide-react";

interface DashboardData {
  accounts: Array<{
    id: string;
    username: string;
    lastScore: number;
    lastAnalysisDate: string;
    trend: "up" | "down" | "stable";
  }>;
  recentInsights: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
  }>;
  subscription: {
    planName: string;
    reportsUsed: number;
    reportsLimit: number;
  } | null;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const result = await res.json();
          setData(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted/50 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("welcome")}</h1>
          <p className="text-muted-foreground">{t("welcomeSubtitle")}</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" />
          {t("analyzeNew")}
        </Link>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* Accounts Count */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-pink/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-brand-pink" />
            </div>
            <span className="text-2xl font-bold text-foreground">{data?.accounts.length || 0}</span>
          </div>
          <p className="text-muted-foreground text-sm">{t("totalAccounts")}</p>
        </div>

        {/* Average Score */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <span className="text-2xl font-bold text-foreground">
              {data?.accounts.length
                ? Math.round(
                    data.accounts.reduce((sum, a) => sum + a.lastScore, 0) / data.accounts.length
                  )
                : 0}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">{t("averageScore")}</p>
        </div>

        {/* Subscription */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-info" />
            </div>
            <span className="text-lg font-bold text-foreground">
              {data?.subscription?.planName || t("freePlan")}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            {data?.subscription
              ? `${data.subscription.reportsUsed}/${data.subscription.reportsLimit} ${t("reportsUsed")}`
              : t("noSubscription")}
          </p>
        </div>
      </motion.div>

      {/* Recent Accounts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">{t("recentAccounts")}</h2>
          <Link
            href="/dashboard/accounts"
            className="text-brand-pink hover:text-brand-pink/80 text-sm flex items-center gap-1 transition-colors"
          >
            {t("viewAll")}
          </Link>
        </div>

        {data?.accounts.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{t("noAccounts")}</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-accent transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t("analyzeFirst")}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.accounts.slice(0, 5).map((account, index) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/dashboard/accounts/${account.id}`}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {account.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-foreground font-medium">@{account.username}</p>
                      <p className="text-muted-foreground text-sm">
                        {new Date(account.lastAnalysisDate).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xl font-bold ${
                        account.lastScore >= 70
                          ? "text-success"
                          : account.lastScore >= 40
                            ? "text-warning"
                            : "text-destructive"
                      }`}
                    >
                      {account.lastScore}
                    </span>
                    {account.trend === "up" ? (
                      <TrendingUp className="w-5 h-5 text-success" />
                    ) : account.trend === "down" ? (
                      <TrendingDown className="w-5 h-5 text-destructive" />
                    ) : null}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-6">{t("recentInsights")}</h2>

        {data?.recentInsights.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">{t("noInsights")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.recentInsights.slice(0, 3).map((insight) => (
              <div key={insight.id} className="p-4 bg-muted/50 rounded-xl">
                <p className="text-foreground font-medium mb-1">{insight.title}</p>
                <p className="text-muted-foreground text-sm">{insight.description}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
