"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: { name: string; email: string } | null;
}

export default function AuditLogsPage() {
  const t = useTranslations("admin.auditLogs");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (actionFilter) params.set("action", actionFilter);
      params.set("page", page.toString());

      const res = await fetch(`/api/admin/audit-logs?${params}`);
      if (res.ok) {
        const result = await res.json();
        setLogs(result.data.logs);
        setTotalPages(result.data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [search, actionFilter, page]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      await fetchLogs();
      if (!cancelled) setIsLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchLogs]);

  if (isLoading && logs.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted/50 rounded-2xl" />
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
        className="bg-card border border-border rounded-2xl p-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t("searchPlaceholder")}
              className="w-full bg-muted/50 border border-border rounded-xl py-3 pe-10 ps-4 text-foreground placeholder-muted-foreground focus:outline-none focus:border-brand-pink/50 transition-colors"
            />
          </div>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-muted/50 border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-brand-pink/50 transition-colors"
          >
            <option value="">{t("filterAll")}</option>
            <option value="view_contact_info">{t("filterViewContact")}</option>
            <option value="change_status">{t("filterChangeStatus")}</option>
            <option value="assign">{t("filterAssign")}</option>
          </select>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-start py-4 px-6 text-muted-foreground font-medium">
                  {t("actor")}
                </th>
                <th className="text-start py-4 px-6 text-muted-foreground font-medium">
                  {t("action")}
                </th>
                <th className="text-start py-4 px-6 text-muted-foreground font-medium">
                  {t("entity")}
                </th>
                <th className="text-center py-4 px-6 text-muted-foreground font-medium">
                  {t("date")}
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-4 px-6 text-foreground">{log.actor?.name || "System"}</td>
                  <td className="py-4 px-6">
                    <span className="px-3 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-muted-foreground">
                    {log.entityType}: {log.entityId.slice(0, 8)}...
                  </td>
                  <td className="py-4 px-6 text-center text-muted-foreground text-sm">
                    {new Date(log.createdAt).toLocaleDateString("ar-SA")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-lg transition-all ${
                  page === p
                    ? "bg-brand-pink text-white"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
