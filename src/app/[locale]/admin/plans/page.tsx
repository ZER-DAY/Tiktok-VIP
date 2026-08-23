"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Save } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  priceCents: number;
  reportsPerDay: number | null;
  features: Record<string, boolean> | null;
  isActive: boolean;
}

export default function AdminPlansPage() {
  const t = useTranslations("admin.plans");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState("");

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/plans");
      if (res.ok) {
        const result = await res.json();
        return result.data;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      const data = await fetchPlans();
      if (!cancelled && data) setPlans(data);
      if (!cancelled) setIsLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchPlans]);

  const handleSave = async () => {
    setIsSaving(true);
    setSuccess("");
    try {
      const res = await fetch("/api/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plans }),
      });
      if (res.ok) {
        setSuccess(t("saveSuccess"));
      }
    } catch (error) {
      console.error("Failed to save plans:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePlan = (id: string, field: keyof Plan, value: unknown) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

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

      <div className="space-y-6">
        {plans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={plan.isActive}
                  onChange={(e) => updatePlan(plan.id, "isActive", e.target.checked)}
                  className="w-5 h-5 rounded bg-muted border-border text-brand-pink focus:ring-brand-pink"
                />
                <span className="text-muted-foreground text-sm">{t("active")}</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">{t("price")}</label>
                <input
                  type="number"
                  value={plan.priceCents / 100}
                  onChange={(e) =>
                    updatePlan(
                      plan.id,
                      "priceCents",
                      Math.round(parseFloat(e.target.value || "0") * 100)
                    )
                  }
                  min="0"
                  step="0.01"
                  className="w-full bg-muted/50 border border-border rounded-xl py-3 px-4 text-foreground focus:outline-none focus:border-brand-pink/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  {t("reportsPerDay")}
                </label>
                <input
                  type="number"
                  value={plan.reportsPerDay || ""}
                  onChange={(e) =>
                    updatePlan(
                      plan.id,
                      "reportsPerDay",
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  min="0"
                  placeholder={t("unlimited")}
                  className="w-full bg-muted/50 border border-border rounded-xl py-3 px-4 text-foreground placeholder-muted-foreground focus:outline-none focus:border-brand-pink/50 transition-colors"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

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
