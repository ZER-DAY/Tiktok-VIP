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
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </motion.div>

      {/* Account Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("selectAccounts")}</h2>
        {accounts.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{t("noAccounts")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => {
              const isSelected = !!selectedAccounts.find((a) => a.id === account.id);
              return (
                <button
                  key={account.id}
                  onClick={() => addToCompare(account)}
                  disabled={isSelected || selectedAccounts.length >= 3}
                  className={`p-4 rounded-xl border text-start transition-all ${
                    isSelected
                      ? "bg-brand-pink/10 border-brand-pink/20"
                      : "bg-muted/50 border-border hover:bg-muted"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold">
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
          className="bg-card border border-border rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-foreground mb-6">{t("comparison")}</h2>

          {/* Selected Accounts */}
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-foreground"
              >
                <span>@{account.username}</span>
                <button
                  onClick={() => removeFromCompare(account.id)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
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
          className="text-center py-12"
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
