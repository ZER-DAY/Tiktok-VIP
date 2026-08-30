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
      <div className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded-lg bg-muted" />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-muted/50" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-5 md:flex-row md:items-center"
      >
        <div>
          <p className="mb-2 text-sm font-bold text-brand">{t("kicker")}</p>
          <h1 className="text-3xl font-black tracking-tight text-foreground">{t("title")}</h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 font-bold text-brand-foreground shadow-[0_12px_24px_-16px_rgba(255,77,103,.85)] transition hover:-translate-y-0.5 hover:bg-brand/90"
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
          className="surface-card px-5 py-20 text-center"
        >
          <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-xl font-bold text-foreground mb-2">{t("emptyTitle")}</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t("emptyDescription")}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-bold text-brand-foreground transition hover:bg-brand/90"
          >
            <Plus className="w-5 h-5" />
            {t("analyzeFirst")}
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={`/dashboard/accounts/${account.id}`}
                className="surface-card block p-6 transition-all hover:-translate-y-1 hover:border-brand/25"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-12 shrink-0 place-items-center rounded-full bg-brand/10 text-lg font-bold text-brand">
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
                    className="flex items-center gap-1 text-sm font-bold text-brand transition-colors hover:text-brand/80"
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
