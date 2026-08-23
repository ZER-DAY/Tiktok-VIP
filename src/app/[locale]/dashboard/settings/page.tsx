"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Bell, Globe, Trash2, Save } from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  preferredLocale: string;
  plan: {
    name: string;
  } | null;
}

export default function SettingsPage() {
  const t = useTranslations("dashboard.settings");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [preferredLocale, setPreferredLocale] = useState("ar");

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/dashboard/settings");
        if (res.ok) {
          const result = await res.json();
          setUser(result.data.user);
          setName(result.data.user.name);
          setPreferredLocale(result.data.user.preferredLocale);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          preferredLocale,
          emailNotifications,
        }),
      });

      if (res.ok) {
        setSuccess(t("saveSuccess"));
      } else {
        const data = await res.json();
        setError(data.message || t("saveError"));
      }
    } catch {
      setError(t("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/");
      }
    } catch {
      setError(t("deleteError"));
    }
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

      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success/10 border border-success/20 rounded-xl p-4"
        >
          <p className="text-success text-center">{success}</p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/10 border border-destructive/20 rounded-xl p-4"
        >
          <p className="text-destructive text-center">{error}</p>
        </motion.div>
      )}

      {/* Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <User className="w-5 h-5 text-brand-pink" />
          {t("profile")}
        </h2>

        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <p className="text-foreground font-medium">{user?.name}</p>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2">{t("name")}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-3 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-transparent transition-colors"
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2">{t("email")}</label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full bg-background border border-border rounded-xl py-3 px-4 text-muted-foreground cursor-not-allowed"
            />
          </div>
        </div>
      </motion.div>

      {/* Subscription Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-6">{t("subscription")}</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground font-medium">{user?.plan?.name || t("freePlan")}</p>
            <p className="text-muted-foreground text-sm">{t("currentPlan")}</p>
          </div>
          <button className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-all">
            {t("upgrade")}
          </button>
        </div>
      </motion.div>

      {/* Notifications Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-pink" />
          {t("notifications")}
        </h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-foreground">{t("emailNotifications")}</p>
              <p className="text-muted-foreground text-sm">{t("emailNotificationsDesc")}</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-pink"></div>
            </div>
          </label>
        </div>
      </motion.div>

      {/* Language Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
          <Globe className="w-5 h-5 text-brand-pink" />
          {t("language")}
        </h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-foreground">{t("preferredLanguage")}</p>
              <p className="text-muted-foreground text-sm">{t("preferredLanguageDesc")}</p>
            </div>
            <select
              value={preferredLocale}
              onChange={(e) => setPreferredLocale(e.target.value)}
              className="bg-background border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-transparent transition-colors"
            >
              <option value="ar">{tCommon("arabic")}</option>
              <option value="en">{tCommon("english")}</option>
            </select>
          </label>
        </div>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-destructive mb-6 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          {t("dangerZone")}
        </h2>

        {!showDeleteConfirm ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground">{t("deleteAccount")}</p>
              <p className="text-muted-foreground text-sm">{t("deleteAccountDesc")}</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-2 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-semibold hover:bg-destructive/20 transition-all"
            >
              {t("deleteAccount")}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-foreground">{t("deleteConfirm")}</p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteAccount}
                className="px-6 py-2 rounded-xl bg-destructive text-white font-semibold hover:bg-destructive/90 transition-all"
              >
                {t("deleteAccount")}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-2 rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-all"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-end"
      >
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {isSaving ? t("saving") : t("save")}
        </button>
      </motion.div>
    </div>
  );
}
