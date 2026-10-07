"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

export function QuotaExhaustedDialog({ isTrial }: { isTrial: boolean }) {
  const t = useTranslations("quotaNotice");
  const locale = useLocale();
  const [open, setOpen] = useState(true);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 sm:max-w-md"
      >
        <DialogTitle className="text-xl font-bold">
          {t(isTrial ? "trialTitle" : "title")}
        </DialogTitle>
        <DialogDescription className="leading-7">
          {t(isTrial ? "trialDescription" : "description")}
        </DialogDescription>
        <Link
          href={isTrial ? "/register" : "/dashboard/billing"}
          className="rounded-xl bg-brand px-4 py-3 text-center font-bold text-brand-foreground"
        >
          {t(isTrial ? "register" : "renew")}
        </Link>
        {isTrial && (
          <Link href="/login" className="text-center font-semibold text-brand-ink">
            {t("login")}
          </Link>
        )}
        <DialogClose className="rounded-xl border border-border px-4 py-3 font-semibold">
          {t("later")}
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

// On the completed report, check the server allowance rather than prompting
// when an analysis is merely queued or trusting URL parameters.
export function ReportQuotaNotice() {
  const [quota, setQuota] = useState<{ remaining: number | null; isTrial: boolean } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/analysis-quota", { cache: "no-store", signal: controller.signal })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (result?.success) setQuota(result.data);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);
  return quota?.remaining === 0 ? <QuotaExhaustedDialog isTrial={quota.isTrial} /> : null;
}
