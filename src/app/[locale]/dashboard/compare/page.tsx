"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { BarChart3, X } from "lucide-react";

interface Account {
  id: string;
  username: string;
  lastScore: number;
  followers: number;
  avgViews: number | null;
  engagementRate: number | null;
  postingConsistency: number | null;
}

export default function ComparePage() {
  const t = useTranslations("dashboard.compare");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Account[]>([]);
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

  const addToCompare = (account: Account) => {
    if (selectedAccounts.length < 3 && !selectedAccounts.find((a) => a.id === account.id)) {
      setSelectedAccounts([...selectedAccounts, account]);
    }
  };

  const removeFromCompare = (accountId: string) => {
    setSelectedAccounts(selectedAccounts.filter((a) => a.id !== accountId));
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/3 rounded-lg bg-muted" />
          <div className="h-64 rounded-2xl bg-muted/50" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="mb-2 text-sm font-bold text-brand">{t("kicker")}</p>
        <h1 className="text-3xl font-black tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("subtitle")}</p>
      </motion.div>

      {/* Account Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="surface-card p-6"
      >
        <h2 className="mb-5 text-lg font-black text-foreground">{t("selectAccounts")}</h2>
        {accounts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{t("noAccounts")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => {
              const isSelected = !!selectedAccounts.find((a) => a.id === account.id);
              return (
                <button
                  key={account.id}
                  onClick={() => addToCompare(account)}
                  disabled={isSelected || selectedAccounts.length >= 3}
                  className={`rounded-2xl border p-4 text-start transition-all ${
                    isSelected
                      ? "bg-brand-pink/10 border-brand-pink/20"
                      : "border-border bg-muted/50 hover:border-brand/25 hover:bg-muted"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 font-bold text-brand">
                        {account.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-start">
                        <p className="text-foreground font-medium">@{account.username}</p>
                        <p className="text-muted-foreground text-sm">
                          {account.followers.toLocaleString()} {t("followers")}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xl font-bold ${getScoreColor(account.lastScore)}`}>
                      {account.lastScore}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Comparison Table */}
      {selectedAccounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="surface-card p-6"
        >
          <h2 className="mb-6 text-lg font-black text-foreground">{t("comparison")}</h2>

          {/* Selected Accounts */}
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-2 text-foreground"
              >
                <span>@{account.username}</span>
                <button
                  onClick={() => removeFromCompare(account.id)}
                  className="rounded-full p-1 text-muted-foreground transition hover:bg-background hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-start py-3 px-4 text-muted-foreground font-medium">
                    {t("metric")}
                  </th>
                  {selectedAccounts.map((account) => (
                    <th
                      key={account.id}
                      className="text-center py-3 px-4 text-foreground font-medium"
                    >
                      @{account.username}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 text-muted-foreground">{t("accountStrength")}</td>
                  {selectedAccounts.map((account) => (
                    <td key={account.id} className="text-center py-3 px-4">
                      <span className={`text-lg font-bold ${getScoreColor(account.lastScore)}`}>
                        {account.lastScore}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 text-muted-foreground">{t("followers")}</td>
                  {selectedAccounts.map((account) => (
                    <td key={account.id} className="text-center py-3 px-4 text-foreground">
                      {account.followers.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 text-muted-foreground">{t("avgViews")}</td>
                  {selectedAccounts.map((account) => (
                    <td key={account.id} className="text-center py-3 px-4 text-foreground">
                      {account.avgViews ? account.avgViews.toLocaleString() : "-"}
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border">
                  <td className="py-3 px-4 text-muted-foreground">{t("engagementRate")}</td>
                  {selectedAccounts.map((account) => (
                    <td key={account.id} className="text-center py-3 px-4 text-foreground">
                      {account.engagementRate ? `${account.engagementRate.toFixed(1)}%` : "-"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-3 px-4 text-muted-foreground">{t("postingConsistency")}</td>
                  {selectedAccounts.map((account) => (
                    <td key={account.id} className="text-center py-3 px-4 text-foreground">
                      {account.postingConsistency ? account.postingConsistency : "-"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {selectedAccounts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="surface-card px-5 py-14 text-center"
        >
          <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h2 className="text-xl font-bold text-foreground mb-2">{t("emptyTitle")}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">{t("emptyDescription")}</p>
        </motion.div>
      )}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-success";
  if (score >= 40) return "text-warning";
  return "text-destructive";
}
