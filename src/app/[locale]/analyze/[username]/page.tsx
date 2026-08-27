"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { AlertCircle, Clock, Cpu, CheckCircle2, Loader2, Trophy } from "lucide-react";

type JobStatus = "queued" | "processing" | "ready" | "failed";

const statusConfig: Record<JobStatus, { icon: React.ElementType; colorClass: string }> = {
  queued: { icon: Clock, colorClass: "text-muted-foreground" },
  processing: { icon: Cpu, colorClass: "text-brand-pink" },
  ready: { icon: CheckCircle2, colorClass: "text-success" },
  failed: { icon: AlertCircle, colorClass: "text-destructive" },
};

export default function AnalyzePage({
  params,
}: {
  params: Promise<{ locale: string; username: string }>;
}) {
  const { locale, username } = use(params);
  const t = useTranslations("analyze");
  const reportT = useTranslations("report");
  const router = useRouter();
  const [jobStatus, setJobStatus] = useState<JobStatus>("queued");
  const [errorMessage, setErrorMessage] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let isMounted = true;

    const timerInterval = setInterval(() => {
      if (isMounted) setElapsed((prev) => prev + 1);
    }, 1000);

    async function startAnalysis() {
      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, provider: "tiktok" }),
        });

        const data = await response.json();

        if (!isMounted) return;

        if (!data.success) {
          setJobStatus("failed");
          setErrorMessage(data.error?.message || t("errorGeneric"));
          return;
        }

        if (data.data.status === "ready" && data.data.reportId) {
          router.replace(`/${locale}/report/${data.data.reportId}`);
          return;
        }

        setJobStatus("processing");

        const jobId = data.data.jobId;
        pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/analyze/${jobId}/status`);
            const statusData = await statusRes.json();

            if (!isMounted) return;

            if (statusData.data.status === "ready" && statusData.data.reportId) {
              clearInterval(pollInterval);
              clearInterval(timerInterval);
              router.replace(`/${locale}/report/${statusData.data.reportId}`);
            } else if (statusData.data.status === "failed") {
              clearInterval(pollInterval);
              clearInterval(timerInterval);
              setJobStatus("failed");
              setErrorMessage(t("errorGeneric"));
            }
          } catch {
            // Continue polling
          }
        }, 2000);
      } catch {
        if (isMounted) {
          setJobStatus("failed");
          setErrorMessage(t("error"));
        }
      }
    }

    startAnalysis();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [username, router, locale, t]);

  const StatusIcon = statusConfig[jobStatus].icon;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md w-full"
      >
        {jobStatus === "failed" ? (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-2">{t("error")}</h1>
            <p className="text-muted-foreground mb-6">{errorMessage}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold hover:opacity-90 transition-all"
              >
                {t("retry")}
              </button>
              <Link
                href="/"
                className="px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-all"
              >
                {t("backToHome")}
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-border" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-pink animate-spin" />
              <div
                className="absolute inset-2 rounded-full border-4 border-transparent border-t-brand-purple animate-spin"
                style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <StatusIcon className={`w-6 h-6 ${statusConfig[jobStatus].colorClass}`} />
              </div>
            </div>

            <h1 className="text-xl font-bold text-foreground mb-2">{t("title")}</h1>
            <p className="text-muted-foreground text-sm mb-4">@{username.replace(/^@/, "")}</p>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t(`status.${jobStatus}`)}</span>
              <span className="text-xs">({elapsed}s)</span>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
              <p>{t("subtitle")}</p>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-start">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-500/15">
                  <Trophy className="size-5 text-amber-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-foreground">{reportT("liveAccountInfo")}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {reportT("liveAccountLevel")}
                  </p>
                </div>
                <Loader2 className="size-4 shrink-0 animate-spin text-amber-500" />
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
