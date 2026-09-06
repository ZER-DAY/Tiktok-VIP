"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Clock3, CreditCard, RefreshCw, X } from "lucide-react";

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
  createdAt: string;
  user: { name: string; email: string };
  plan: { name: string };
};

export default function AdminPaymentsPage() {
  const t = useTranslations("admin.payments");
  const billingT = useTranslations("billing");
  const locale = useLocale();
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    const response = await fetch("/api/admin/payments", { cache: "no-store" });
    if (!response.ok) throw new Error("LOAD_FAILED");
    const result = await response.json();
    setOrders(result.data);
  }, []);

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

  async function review(orderId: string, decision: "approve" | "reject") {
    setReviewing(orderId);
    setError("");
    try {
      const response = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, decision }),
      });
      if (!response.ok) throw new Error("REVIEW_FAILED");
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
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString(
                        locale === "ar" ? "ar-EG" : "en-US"
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {order.status === "manual_review" ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={reviewing === order.id}
                            onClick={() => review(order.id, "approve")}
                            className="grid size-9 place-items-center rounded-lg bg-success/10 text-success hover:bg-success/20 disabled:opacity-50"
                            aria-label={t("approve")}
                          >
                            <Check className="size-4" />
                          </button>
                          <button
                            type="button"
                            disabled={reviewing === order.id}
                            onClick={() => review(order.id, "reject")}
                            className="grid size-9 place-items-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50"
                            aria-label={t("reject")}
                          >
                            <X className="size-4" />
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
    </div>
  );
}
