"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { EligibilityResult } from "@/modules/backstage/result";

export function BackstageEligibility({ reportId }: { reportId: string }) {
  const t = useTranslations("report.backstage");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<EligibilityResult | null>(null);
  const [error, setError] = useState("");
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  async function check() {
    setBusy(true);
    setError("");
    setResult(null);
    const controller = new AbortController();
    active.current = controller;
    try {
      let response = await fetch("/api/agency/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
        signal: controller.signal,
      });
      if (response.status === 401) {
        setError("login");
        return;
      }
      if (response.status === 429) {
        setError("busy");
        return;
      }
      if (!response.ok) throw new Error("unavailable");
      let payload = await response.json();
      const jobId = payload.data.jobId;
      for (let i = 0; payload.data.state !== "completed" && i < 45; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        if (controller.signal.aborted) return;
        response = await fetch(`/api/agency/eligibility?jobId=${encodeURIComponent(jobId)}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("unavailable");
        payload = await response.json();
      }
      if (payload.data.state !== "completed") throw new Error("timeout");
      setResult(payload.data.result);
    } catch {
      if (!controller.signal.aborted) setError("unavailable");
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  return (
    <section className="mb-6 rounded-2xl border border-brand/20 bg-brand/5 p-6">
      <h3 className="text-lg font-bold">{t("title")}</h3>
      <p className="my-3 text-sm leading-7 text-muted-foreground">{t("description")}</p>
      <button
        type="button"
        disabled={busy}
        onClick={check}
        className="rounded-xl bg-brand px-5 py-3 font-bold text-brand-foreground disabled:opacity-60"
      >
        {t(busy ? "checking" : "check")}
      </button>
      <div role="status" className="mt-4 text-sm leading-7" aria-live="polite">
        {result && (
          <>
            <p className="font-bold">{t(`reasons.${result.reason}`)}</p>
            <p className="text-muted-foreground">
              {t("checkedAt", { time: new Date(result.checkedAt).toLocaleString() })}
            </p>
            {result.status === "eligible" && <p>{t("notInvitation")}</p>}
          </>
        )}
        {error && <p>{t(error)}</p>}
        {error === "login" && (
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(`/report/${reportId}`)}`}
            className="font-bold underline"
          >
            {t("signIn")}
          </Link>
        )}
      </div>
    </section>
  );
}
