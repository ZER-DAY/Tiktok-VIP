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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div className="pointer-events-none absolute -end-20 top-16 size-64 rounded-full border-[30px] border-brand/10" />
      <div className="pointer-events-none absolute -start-24 bottom-12 size-72 rounded-full border-[32px] border-brand-secondary/10" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md text-center"
      >
        {jobStatus === "failed" ? (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="mb-2 text-xl font-black text-foreground">{t("error")}</h1>
            <p className="mb-6 text-sm leading-7 text-muted-foreground">{errorMessage}</p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl bg-brand px-6 py-3 font-bold text-brand-foreground transition hover:bg-brand/90"
              >
                {t("retry")}
              </button>
              <Link
                href="/"
                className="rounded-xl border border-border px-6 py-3 font-bold text-foreground transition hover:bg-muted"
              >
                {t("backToHome")}
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="relative mx-auto mb-6 size-20">
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

            <h1 className="mb-2 text-xl font-black text-foreground">{t("title")}</h1>
            <p className="mb-4 text-sm text-muted-foreground">@{username.replace(/^@/, "")}</p>

            <div className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{t(`status.${jobStatus}`)}</span>
              <span className="text-xs">({elapsed}s)</span>
            </div>

            <div className="surface-card p-4 text-sm text-muted-foreground">
              <p className="leading-7">{t("subtitle")}</p>
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
