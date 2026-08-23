"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Plus, RefreshCw, BarChart3 } from "lucide-react";

interface Account {
  id: string;
  username: string;
  lastScore: number;
  lastAnalysisDate: string;
  trend: "up" | "down" | "stable";
  provider: string;
}

export default function AccountsPage() {
  const t = useTranslations("dashboard.accounts");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch("/api/dashboard/accounts");
        if (res.ok) {
          const result = await res.json();
          setAccounts(result.data.accounts);
        }
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAccounts();
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-muted/50 rounded-2xl" />
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
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" />
          {t("addAccount")}
        </Link>
      </motion.div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-xl font-bold text-foreground mb-2">{t("emptyTitle")}</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t("emptyDescription")}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-all"
          >
            <Plus className="w-5 h-5" />
            {t("analyzeFirst")}
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={`/dashboard/accounts/${account.id}`}
                className="block bg-card border border-border rounded-2xl p-6 hover:bg-muted transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                      {account.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-foreground font-medium">@{account.username}</p>
                      <p className="text-muted-foreground text-sm">{account.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-2xl font-bold ${
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
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {new Date(account.lastAnalysisDate).toLocaleDateString("ar-SA")}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      // Trigger re-analysis
                    }}
                    className="flex items-center gap-1 text-brand-pink hover:text-brand-pink/80 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    {t("refresh")}
                  </button>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
