"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Users, FileText, BarChart3, Clock } from "lucide-react";

interface Stats {
  users: { total: number; newThisMonth: number };
  reports: { total: number; thisMonth: number };
  applications: {
    total: number;
    funnel: { new: number; reviewed: number; contacted: number; joined: number; rejected: number };
  };
  recentReports: Array<{ id: string; username: string; score: number; generatedAt: string }>;
}

const FUNNEL_ITEMS = ["new", "reviewed", "contacted", "joined", "rejected"] as const;
const FUNNEL_COLORS: Record<string, string> = {
  new: "bg-blue-500",
  reviewed: "bg-yellow-500",
  contacted: "bg-purple-500",
  joined: "bg-green-500",
  rejected: "bg-red-500",
};

export default function AdminStatsPage() {
  const t = useTranslations("admin.stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const result = await res.json();
          setStats(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted/50 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-brand-pink" />
            <span className="text-2xl font-bold text-foreground">{stats?.users.total || 0}</span>
          </div>
          <p className="text-muted-foreground text-sm">{t("totalUsers")}</p>
          <p className="text-success text-xs mt-1">
            +{stats?.users.newThisMonth || 0} {t("thisMonth")}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <FileText className="w-8 h-8 text-info" />
            <span className="text-2xl font-bold text-foreground">{stats?.reports.total || 0}</span>
          </div>
          <p className="text-muted-foreground text-sm">{t("totalReports")}</p>
          <p className="text-success text-xs mt-1">
            +{stats?.reports.thisMonth || 0} {t("thisMonth")}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="w-8 h-8 text-brand-purple" />
            <span className="text-2xl font-bold text-foreground">
              {stats?.applications.total || 0}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">{t("totalApplications")}</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-warning" />
            <span className="text-2xl font-bold text-foreground">
              {stats?.applications.funnel.joined || 0}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">{t("joined")}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-6">{t("applicationFunnel")}</h2>
        <div className="space-y-4">
          {FUNNEL_ITEMS.map((key) => {
            const value = stats?.applications.funnel[key] || 0;
            const total = stats?.applications.total || 1;
            return (
              <div key={key} className="flex items-center gap-4">
                <span className="text-muted-foreground w-24 text-sm">
                  {t(`status${key.charAt(0).toUpperCase() + key.slice(1)}` as never)}
                </span>
                <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full ${FUNNEL_COLORS[key]} transition-all duration-500`}
                    style={{ width: `${(value / total) * 100}%` }}
                  />
                </div>
                <span className="text-foreground font-medium w-12 text-start">{value}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-6">{t("recentReports")}</h2>
        <div className="space-y-3">
          {stats?.recentReports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-xl"
            >
              <span className="text-foreground">@{report.username}</span>
              <div className="flex items-center gap-4">
                <span
                  className={`font-bold ${report.score >= 70 ? "text-success" : report.score >= 40 ? "text-warning" : "text-destructive"}`}
                >
                  {report.score}
                </span>
                <span className="text-muted-foreground text-sm">
                  {new Date(report.generatedAt).toLocaleDateString("ar-SA")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
