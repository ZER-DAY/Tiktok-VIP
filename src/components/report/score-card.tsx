"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

function getScoreLevel(score: number): "high" | "medium" | "low" {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function getScoreColor(level: "high" | "medium" | "low"): string {
  switch (level) {
    case "high":
      return "text-success";
    case "medium":
      return "text-warning";
    case "low":
      return "text-destructive";
  }
}

function getScoreBg(level: "high" | "medium" | "low"): string {
  switch (level) {
    case "high":
      return "bg-success";
    case "medium":
      return "bg-warning";
    case "low":
      return "bg-destructive";
  }
}

function getScoreSoftBg(level: "high" | "medium" | "low"): string {
  switch (level) {
    case "high":
      return "bg-success/10";
    case "medium":
      return "bg-warning/10";
    case "low":
      return "bg-destructive/10";
  }
}

function getScoreLabel(score: number, t: (key: string) => string): string {
  if (score >= 80) return t("excellent");
  if (score >= 60) return t("good");
  if (score >= 40) return t("average");
  return t("needsImprovement");
}

export function ScoreCard({
  title,
  score,
  icon: Icon,
  breakdown,
  showLabel = true,
  compact = false,
}: {
  title: string;
  score: number;
  icon: React.ElementType;
  breakdown?: Record<string, unknown>;
  showLabel?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("report.scoreCard");
  const [expanded, setExpanded] = useState(false);
  const level = getScoreLevel(score);

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-2xl border border-border bg-card ${compact ? "p-4" : "p-5"}`}
    >
      <div className="mb-4 flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div
            className={`grid size-9 shrink-0 place-items-center rounded-xl ${getScoreSoftBg(level)}`}
          >
            <Icon className={`w-4 h-4 ${getScoreColor(level)}`} />
          </div>
          <span className="min-w-0 break-words text-sm font-bold leading-snug text-foreground">
            {title}
          </span>
        </div>
        <div className="shrink-0 text-end">
          <span className={`text-3xl font-black ${getScoreColor(level)}`}>{score}</span>
          <span className="ms-1 text-[10px] text-muted-foreground">/100</span>
          {showLabel && (
            <p className={`text-xs ${getScoreColor(level)}`}>{getScoreLabel(score, t)}</p>
          )}
        </div>
      </div>

      <div className="mb-2 h-1.5 w-full rounded-full bg-muted">
        <motion.div
          className={`h-1.5 rounded-full ${getScoreBg(level)}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      {breakdown && Object.keys(breakdown).length > 0 && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-2 transition-colors"
          >
            {t("howWeCalculated")}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1"
            >
              {Object.entries(breakdown).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span>{key}</span>
                  <span className="text-foreground">{String(value)}</span>
                </div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
