"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Save } from "lucide-react";

interface Setting {
  key: string;
  value: string;
}

export default function AdminSettingsPage() {
  const t = useTranslations("admin.settings");
  const [settings, setSettings] = useState<Setting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const result = await res.json();
        return result.data;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      const data = await fetchSettings();
      if (!cancelled && data) setSettings(data);
      if (!cancelled) setIsLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    setSuccess("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      if (res.ok) {
        setSuccess(t("saveSuccess"));
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
  };

  const getSetting = (key: string) => settings.find((s) => s.key === key)?.value || "";

  if (isLoading) {
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

      {success && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success/10 border border-success/20 rounded-xl p-4"
        >
          <p className="text-success text-center">{success}</p>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-6">{t("agencySettings")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              {t("eligibilityThreshold")}
            </label>
            <input
              type="number"
              value={getSetting("agency.eligibility.minScore")}
              onChange={(e) => updateSetting("agency.eligibility.minScore", e.target.value)}
              min="0"
              max="100"
              className="w-full bg-muted/50 border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-brand-pink/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              {t("highPriorityThreshold")}
            </label>
            <input
              type="number"
              value={getSetting("agency.eligibility.highPriorityScore")}
              onChange={(e) =>
                updateSetting("agency.eligibility.highPriorityScore", e.target.value)
              }
              min="0"
              max="100"
              className="w-full bg-muted/50 border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-brand-pink/50 transition-colors"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-6">{t("cacheSettings")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              {t("snapshotCacheTtl")}
            </label>
            <input
              type="number"
              value={getSetting("cache.snapshot.ttlHours")}
              onChange={(e) => updateSetting("cache.snapshot.ttlHours", e.target.value)}
              min="1"
              className="w-full bg-muted/50 border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-brand-pink/50 transition-colors"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-6">{t("rateLimitSettings")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              {t("freePlanReportsPerDay")}
            </label>
            <input
              type="number"
              value={getSetting("rateLimit.freePlan.reportsPerDay")}
              onChange={(e) => updateSetting("rateLimit.freePlan.reportsPerDay", e.target.value)}
              min="0"
              className="w-full bg-muted/50 border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-brand-pink/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              {t("guestReportsPerDay")}
            </label>
            <input
              type="number"
              value={getSetting("rateLimit.guest.reportsPerDay")}
              onChange={(e) => updateSetting("rateLimit.guest.reportsPerDay", e.target.value)}
              min="0"
              className="w-full bg-muted/50 border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-brand-pink/50 transition-colors"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-end"
      >
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-pink text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {isSaving ? t("saving") : t("save")}
        </button>
      </motion.div>
    </div>
  );
}
