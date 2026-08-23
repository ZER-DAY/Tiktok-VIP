"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Search, Filter, ChevronDown, ChevronUp, Eye, User, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface Application {
  id: string;
  fullName: string;
  email: string;
  status: string;
  createdAt: string;
  account: {
    externalUsername: string;
    snapshots: Array<{
      followers: number;
      countryGuess: string | null;
      bioLanguageGuess: string | null;
      analysisReport: {
        accountStrengthScore: number;
      } | null;
    }>;
  };
  assigneeUser: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
}

const STATUS_CONFIG: Record<string, { color: string }> = {
  new: { color: "bg-blue-500/20 text-blue-400" },
  reviewed: { color: "bg-yellow-500/20 text-yellow-400" },
  contacted: { color: "bg-purple-500/20 text-purple-400" },
  joined: { color: "bg-green-500/20 text-green-400" },
  rejected: { color: "bg-red-500/20 text-red-400" },
};

export default function ApplicantsPage() {
  const t = useTranslations("agency.applicants");
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"createdAt" | "score">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchApplications = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (minScore) params.set("minScore", minScore);
      if (maxScore) params.set("maxScore", maxScore);
      params.set("page", currentPage.toString());
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/agency/applications?${params}`);
      if (res.ok) {
        const result = await res.json();
        return result.data;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch applications:", error);
      return null;
    }
  }, [search, statusFilter, minScore, maxScore, currentPage, sortBy, sortOrder]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      const data = await fetchApplications();
      if (!cancelled && data) {
        setApplications(data.applications);
        setTotalPages(data.totalPages);
      }
      if (!cancelled) {
        setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchApplications]);

  if (isLoading && applications.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-12 bg-muted/50 rounded-xl" />
          <div className="h-96 bg-muted/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full bg-muted/50 border border-border rounded-xl py-3 pe-10 ps-4 text-foreground placeholder-muted-foreground focus:outline-none focus:border-brand-pink/50 transition-colors"
            />
          </div>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [by, order] = e.target.value.split("-");
              setSortBy(by as "createdAt" | "score");
              setSortOrder(order as "asc" | "desc");
            }}
            className="bg-muted/50 border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-brand-pink/50 transition-colors"
          >
            <option value="createdAt-desc">{t("sortNewest")}</option>
            <option value="createdAt-asc">{t("sortOldest")}</option>
            <option value="score-desc">{t("sortScoreHigh")}</option>
            <option value="score-asc">{t("sortScoreLow")}</option>
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-muted/50 border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <Filter className="w-5 h-5" />
            {t("filters")}
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-sm text-muted-foreground mb-2">{t("status")}</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-brand-pink/50 transition-colors"
              >
                <option value="">{t("all")}</option>
                <option value="new">{t("statusNew")}</option>
                <option value="reviewed">{t("statusReviewed")}</option>
                <option value="contacted">{t("statusContacted")}</option>
                <option value="joined">{t("statusJoined")}</option>
                <option value="rejected">{t("statusRejected")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">{t("minScore")}</label>
              <input
                type="number"
                value={minScore}
                onChange={(e) => setMinScore(e.target.value)}
                placeholder="0"
                min="0"
                max="100"
                className="w-full bg-muted/50 border border-border rounded-xl py-3 px-4 text-foreground placeholder-muted-foreground focus:outline-none focus:border-brand-pink/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">{t("maxScore")}</label>
              <input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
                placeholder="100"
                min="0"
                max="100"
                className="w-full bg-muted/50 border border-border rounded-xl py-3 px-4 text-foreground placeholder-muted-foreground focus:outline-none focus:border-brand-pink/50 transition-colors"
              />
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        {applications.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-muted-foreground/50 mx-auto mb-6" />
            <h2 className="text-xl font-bold text-foreground mb-2">{t("emptyTitle")}</h2>
            <p className="text-muted-foreground">{t("emptyDescription")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-start py-4 px-6 text-muted-foreground font-medium">
                    {t("name")}
                  </th>
                  <th className="text-start py-4 px-6 text-muted-foreground font-medium">
                    {t("account")}
                  </th>
                  <th className="text-center py-4 px-6 text-muted-foreground font-medium">
                    {t("score")}
                  </th>
                  <th className="text-center py-4 px-6 text-muted-foreground font-medium">
                    {t("followers")}
                  </th>
                  <th className="text-center py-4 px-6 text-muted-foreground font-medium">
                    {t("country")}
                  </th>
                  <th className="text-center py-4 px-6 text-muted-foreground font-medium">
                    {t("status")}
                  </th>
                  <th className="text-center py-4 px-6 text-muted-foreground font-medium">
                    {t("assignee")}
                  </th>
                  <th className="text-center py-4 px-6 text-muted-foreground font-medium">
                    {t("date")}
                  </th>
                  <th className="text-center py-4 px-6 text-muted-foreground font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app, index) => {
                  const latestSnapshot = app.account.snapshots[0];
                  const report = latestSnapshot?.analysisReport;
                  const score = report?.accountStrengthScore || 0;
                  const statusInfo = STATUS_CONFIG[app.status] || STATUS_CONFIG.new;

                  return (
                    <motion.tr
                      key={app.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-pink/20 flex items-center justify-center text-brand-pink text-sm font-bold">
                            {app.fullName.charAt(0)}
                          </div>
                          <span className="text-foreground font-medium">{app.fullName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">
                        @{app.account.externalUsername}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`text-lg font-bold ${
                            score >= 70
                              ? "text-success"
                              : score >= 40
                                ? "text-warning"
                                : "text-destructive"
                          }`}
                        >
                          {report?.accountStrengthScore || "-"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center text-muted-foreground">
                        {latestSnapshot?.followers?.toLocaleString() || "-"}
                      </td>
                      <td className="py-4 px-6 text-center text-muted-foreground">
                        {latestSnapshot?.countryGuess || "-"}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                        >
                          {t(
                            `status${app.status.charAt(0).toUpperCase() + app.status.slice(1)}` as keyof typeof t extends never
                              ? never
                              : never
                          )}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {app.assigneeUser ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                              <User className="w-3 h-3 text-muted-foreground" />
                            </div>
                            <span className="text-muted-foreground text-sm">
                              {app.assigneeUser.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center text-muted-foreground text-sm">
                        {new Date(app.createdAt).toLocaleDateString("ar-SA")}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Link
                          href={`/agency/applicants/${app.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all text-sm"
                        >
                          <Eye className="w-4 h-4" />
                          {t("view")}
                        </Link>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg transition-all ${
                  currentPage === page
                    ? "bg-brand-pink text-white"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
