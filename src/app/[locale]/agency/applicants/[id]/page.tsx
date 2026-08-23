"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Phone, Send, Mail, User, Clock, MessageSquare, Eye } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface ApplicationDetail {
  id: string;
  fullName: string;
  phone: string | null;
  telegram: string | null;
  email: string | null;
  status: string;
  createdAt: string;
  account: {
    externalUsername: string;
    provider: { displayName: string };
    snapshots: Array<{
      followers: number;
      following: number;
      totalLikes: bigint;
      videoCount: number;
      countryGuess: string | null;
      bioLanguageGuess: string | null;
      isVerified: boolean;
      accountType: string;
      analysisReport: {
        accountStrengthScore: number;
        contentQualityScore: number;
        engagementQualityScore: number;
        postingConsistencyScore: number;
        explorePotentialPercent: number;
        livePotentialScore: number;
        professionalismScore: number;
        insights: Array<{
          type: string;
          title: string;
          description: string;
        }>;
      } | null;
    }>;
  };
  assigneeUser: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  notes: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: {
      id: string;
      name: string;
      avatarUrl: string | null;
    };
  }>;
  statusHistory: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    changedAt: string;
    changedBy: {
      id: string;
      name: string;
    };
  }>;
}

const STATUS_CONFIG: Record<string, { color: string }> = {
  new: { color: "bg-blue-500/20 text-blue-400" },
  reviewed: { color: "bg-yellow-500/20 text-yellow-400" },
  contacted: { color: "bg-purple-500/20 text-purple-400" },
  joined: { color: "bg-green-500/20 text-green-400" },
  rejected: { color: "bg-red-500/20 text-red-400" },
};

const TRANSITION_STATUSES = ["reviewed", "contacted", "joined", "rejected"] as const;

function statusKey(status: string): string {
  return `status${status.charAt(0).toUpperCase() + status.slice(1)}`;
}

export default function ApplicantDetailPage() {
  const params = useParams();
  const t = useTranslations("agency.detail");
  const tStatus = useTranslations("agency.applicants");
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [statusNote, setStatusNote] = useState("");

  useEffect(() => {
    async function fetchApplication() {
      try {
        const res = await fetch(`/api/agency/applications/${params.id}`);
        if (res.ok) {
          const result = await res.json();
          setApplication(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch application:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchApplication();
  }, [params.id]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setIsAddingNote(true);
    try {
      const res = await fetch(`/api/agency/applications/${params.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: newNote }),
      });
      if (res.ok) {
        setNewNote("");
        const refreshRes = await fetch(`/api/agency/applications/${params.id}`);
        if (refreshRes.ok) {
          const result = await refreshRes.json();
          setApplication(result.data);
        }
      }
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/agency/applications/${params.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note: statusNote || undefined }),
      });
      if (res.ok) {
        setShowStatusDropdown(false);
        setStatusNote("");
        const refreshRes = await fetch(`/api/agency/applications/${params.id}`);
        if (refreshRes.ok) {
          const result = await refreshRes.json();
          setApplication(result.data);
        }
      }
    } catch (error) {
      console.error("Failed to change status:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted/50 rounded-2xl" />
          <div className="h-96 bg-muted/50 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">{t("notFound")}</p>
      </div>
    );
  }

  const latestSnapshot = application.account.snapshots[0];
  const report = latestSnapshot?.analysisReport;
  const statusInfo = STATUS_CONFIG[application.status] || STATUS_CONFIG.new;

  return (
    <div className="p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <Link
            href="/agency/applicants"
            className="p-2 rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{application.fullName}</h1>
            <p className="text-muted-foreground">@{application.account.externalUsername}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-full text-sm font-medium ${statusInfo.color}`}>
            {tStatus(statusKey(application.status) as never)}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="px-4 py-2 rounded-xl bg-muted/50 border border-border text-foreground hover:bg-muted transition-all"
            >
              {t("changeStatus")}
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-10">
                <div className="p-3 border-b border-border">
                  <input
                    type="text"
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    placeholder={t("statusNotePlaceholder")}
                    className="w-full bg-muted/50 border border-border rounded-lg py-2 px-3 text-foreground text-sm placeholder-muted-foreground focus:outline-none"
                  />
                </div>
                {TRANSITION_STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className="w-full text-start px-4 py-3 text-foreground hover:bg-muted/50 transition-colors"
                  >
                    {tStatus(statusKey(status) as never)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-brand-pink" />
              {t("contactInfo")}
              <span className="text-xs text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                {t("protected")}
              </span>
            </h2>
            <div className="space-y-4">
              {application.phone ? (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">{application.phone}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("notAvailable")}</span>
                </div>
              )}
              {application.telegram ? (
                <div className="flex items-center gap-3">
                  <Send className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">{application.telegram}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Send className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("notAvailable")}</span>
                </div>
              )}
              {application.email ? (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">{application.email}</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="text-muted-foreground">{t("notAvailable")}</span>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-pink" />
              {t("notes")}
            </h2>
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={t("notePlaceholder")}
                className="w-full bg-muted/50 border border-border rounded-xl py-3 px-4 text-foreground placeholder-muted-foreground focus:outline-none focus:border-brand-pink/50 transition-colors resize-none"
                rows={3}
              />
              <button
                onClick={handleAddNote}
                disabled={isAddingNote || !newNote.trim()}
                className="mt-2 px-4 py-2 rounded-lg bg-brand-pink text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
              >
                {isAddingNote ? t("addingNote") : t("addNote")}
              </button>
            </div>
            <div className="space-y-3">
              {application.notes.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">{t("noNotes")}</p>
              ) : (
                application.notes.map((note) => (
                  <div key={note.id} className="bg-muted/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <span className="text-foreground text-sm font-medium">
                          {note.author.name}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {new Date(note.createdAt).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm">{note.body}</p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {report && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h2 className="text-lg font-semibold text-foreground mb-6">{t("reportSummary")}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {report.accountStrengthScore}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{t("accountStrength")}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {latestSnapshot.followers.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{tStatus("followers")}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {report.engagementQualityScore}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{t("engagementQuality")}</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {report.explorePotentialPercent}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{t("explorePotential")}</p>
                </div>
              </div>
              {report.insights.length > 0 && (
                <div>
                  <h3 className="text-foreground font-medium mb-3">
                    {t("strengthsAndRecommendations")}
                  </h3>
                  <div className="space-y-2">
                    {report.insights.slice(0, 5).map((insight, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl text-sm ${insight.type === "strength" ? "bg-success/10 border border-success/20" : insight.type === "weakness" ? "bg-destructive/10 border border-destructive/20" : "bg-info/10 border border-info/20"}`}
                      >
                        <p className="text-foreground font-medium">{insight.title}</p>
                        <p className="text-muted-foreground text-xs mt-1">{insight.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand-pink" />
              {t("statusHistory")}
            </h2>
            <div className="space-y-4">
              {application.statusHistory.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">{t("noHistory")}</p>
              ) : (
                application.statusHistory.map((history) => (
                  <div key={history.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-brand-pink" />
                      <div className="w-px h-full bg-border" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${STATUS_CONFIG[history.fromStatus]?.color || ""}`}
                        >
                          {tStatus(statusKey(history.fromStatus) as never)}
                        </span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${STATUS_CONFIG[history.toStatus]?.color || ""}`}
                        >
                          {tStatus(statusKey(history.toStatus) as never)}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">
                        {t("changedBy")} {history.changedBy.name} {"\u2022"}{" "}
                        {new Date(history.changedAt).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
