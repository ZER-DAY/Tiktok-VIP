"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Clock3, CreditCard, Loader2, RefreshCw, X } from "lucide-react";
import { redirectToLogin } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type PaymentOrder = {
  id: string;
  method: "card" | "mobile_wallet" | "manual_transfer";
  status: "pending" | "processing" | "manual_review" | "paid" | "failed" | "canceled";
  provider: string;
  paymentAmountCents: number;
  paymentCurrency: string;
  customerPhone: string | null;
  transferReference: string | null;
  providerTransactionId: string | null;
  failureReason: string | null;
  createdAt: string;
  reviewedAt: string | null;
  user: { name: string; email: string };
  plan: { name: string };
};

type PendingReview = {
  order: PaymentOrder;
  decision: "approve" | "reject";
} | null;

export default function AdminPaymentsPage() {
  const t = useTranslations("admin.payments");
  const billingT = useTranslations("billing");
  const locale = useLocale();
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pendingReview, setPendingReview] = useState<PendingReview>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    setError("");
    const response = await fetch("/api/admin/payments", { cache: "no-store" });
    if (response.status === 401) {
      redirectToLogin(`${window.location.pathname}${window.location.search}`);
      throw new Error("UNAUTHORIZED");
    }
    if (response.status === 403) {
      setError(t("forbidden"));
      throw new Error("FORBIDDEN");
    }
    if (!response.ok) throw new Error("LOAD_FAILED");
    const result = await response.json();
    setOrders(result.data);
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    async function initialLoad() {
      try {
        await load();
      } catch {
        if (!cancelled) setError(t("loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void initialLoad();
    return () => {
      cancelled = true;
    };
  }, [load, t]);

  async function review() {
    if (!pendingReview || reviewing) return;
    const { order, decision } = pendingReview;
    setReviewing(order.id);
    setError("");
    try {
      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          decision,
          ...(decision === "reject" && rejectReason.trim() ? { reason: rejectReason.trim() } : {}),
        }),
      });
      if (!response.ok) throw new Error("REVIEW_FAILED");
      setPendingReview(null);
      setRejectReason("");
      await load();
    } catch {
      setError(t("reviewError"));
    } finally {
      setReviewing(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black text-foreground">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => load().catch(() => setError(t("loadError")))}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold hover:border-brand/30"
        >
          <RefreshCw className="size-4" />
          {t("refresh")}
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-bold text-destructive">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {loading ? (
          <div className="h-80 animate-pulse bg-muted/40" />
        ) : orders.length === 0 ? (
          <p className="p-12 text-center text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start">{t("customer")}</th>
                  <th className="px-4 py-3 text-start">{t("plan")}</th>
                  <th className="px-4 py-3 text-start">{t("method")}</th>
                  <th className="px-4 py-3 text-start">{t("amount")}</th>
                  <th className="px-4 py-3 text-start">{t("reference")}</th>
                  <th className="px-4 py-3 text-start">{t("status")}</th>
                  <th className="px-4 py-3 text-start">{t("date")}</th>
                  <th className="px-4 py-3 text-start">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="align-top hover:bg-muted/20">
                    <td className="px-4 py-4">
                      <strong className="block text-foreground">{order.user.name}</strong>
                      <span className="mt-1 block text-xs text-muted-foreground" dir="ltr">
                        {order.user.email}
                      </span>
                      {order.customerPhone && (
                        <span className="mt-1 block text-xs text-muted-foreground" dir="ltr">
                          {order.customerPhone}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 font-bold">
                      {billingT(`plans.${order.plan.name}.name`)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5">
                        <CreditCard className="size-4 text-muted-foreground" />
                        {billingT(`methods.${order.method}.title`)}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold" dir="ltr">
                      {(order.paymentAmountCents / 100).toLocaleString(
                        locale === "ar" ? "ar-EG" : "en-US"
                      )}{" "}
                      {order.paymentCurrency}
                    </td>
                    <td className="max-w-44 break-all px-4 py-4 text-xs" dir="ltr">
                      {order.transferReference || order.providerTransactionId || "—"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold status-${order.status}`}
                      >
                        {order.status === "manual_review" && <Clock3 className="size-3.5" />}
                        {billingT(`statuses.${order.status}`)}
                      </span>
                      {order.status === "failed" && order.failureReason && (
                        <span className="mt-1 block max-w-44 truncate text-[10px] text-destructive/80">
                          {order.failureReason}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString(
                        locale === "ar" ? "ar-EG" : "en-US"
                      )}
                      {order.reviewedAt && (
                        <span className="mt-1 block text-[10px]">
                          ✓{" "}
                          {new Date(order.reviewedAt).toLocaleString(
                            locale === "ar" ? "ar-EG" : "en-US"
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {order.status === "manual_review" ? (
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            disabled={reviewing === order.id}
                            onClick={() => {
                              setRejectReason("");
                              setPendingReview({ order, decision: "approve" });
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3 py-2 text-xs font-bold text-white hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Check className="size-3.5" />
                            {t("approve")}
                          </button>
                          <button
                            type="button"
                            disabled={reviewing === order.id}
                            onClick={() => {
                              setRejectReason("");
                              setPendingReview({ order, decision: "reject" });
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <X className="size-3.5" />
                            {t("reject")}
                          </button>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(pendingReview)}
        onOpenChange={(open) => {
          if (!open && !reviewing) {
            setPendingReview(null);
          }
        }}
      >
        <DialogContent showCloseButton={!reviewing}>
          <DialogHeader>
            <DialogTitle>
              {pendingReview?.decision === "approve"
                ? t("confirmApproveTitle")
                : t("confirmRejectTitle")}
            </DialogTitle>
            <DialogDescription>
              {pendingReview?.decision === "approve"
                ? t("confirmApproveDescription")
                : t("confirmRejectDescription")}
            </DialogDescription>
          </DialogHeader>

          {pendingReview?.order && (
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <p className="font-bold">
                {pendingReview.order.user.name} —{" "}
                {billingT(`plans.${pendingReview.order.plan.name}.name`)}
              </p>
              <p className="mt-1 text-muted-foreground" dir="ltr">
                {(pendingReview.order.paymentAmountCents / 100).toLocaleString(
                  locale === "ar" ? "ar-EG" : "en-US"
                )}{" "}
                {pendingReview.order.paymentCurrency}
              </p>
              {pendingReview.order.transferReference && (
                <p className="mt-1 text-muted-foreground" dir="ltr">
                  {t("reference")}: {pendingReview.order.transferReference}
                </p>
              )}
            </div>
          )}

          {pendingReview?.decision === "reject" && (
            <label className="block">
              <span className="mb-2 block text-sm text-muted-foreground">{t("rejectReason")}</span>
              <textarea
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                rows={2}
                maxLength={500}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10"
              />
            </label>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              disabled={Boolean(reviewing)}
              onClick={() => setPendingReview(null)}
            >
              {t("cancel")}
            </Button>
            <Button
              variant={pendingReview?.decision === "approve" ? "default" : "destructive"}
              disabled={Boolean(reviewing)}
              onClick={review}
            >
              {reviewing ? <Loader2 className="size-4 animate-spin" /> : null}
              {reviewing
                ? t("reviewing")
                : pendingReview?.decision === "approve"
                  ? t("confirmApprove")
                  : t("confirmReject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
