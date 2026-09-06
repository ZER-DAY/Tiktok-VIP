"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  Gift,
  Info,
  LockKeyhole,
  Phone,
  ShieldCheck,
  Smartphone,
  Sparkles,
  WalletCards,
} from "lucide-react";

type PlanName = "individual" | "saver" | "agency";
type PaymentMethod = "card" | "mobile_wallet" | "manual_transfer";

type BillingData = {
  plans: Array<{
    id: string;
    name: PlanName;
    priceCents: number;
    reportsPerMonth: number | null;
  }>;
  currentPlan: string;
  currentPeriodEnd: string | null;
  payment: {
    currency: "EGP";
    conversionRate: number | null;
    methods: {
      card: { enabled: boolean };
      mobile_wallet: { enabled: boolean };
      manual_transfer: {
        enabled: boolean;
        accountLabel: string | null;
        accountNumber: string | null;
      };
      opay: { enabled: boolean };
      crypto: { enabled: boolean };
    };
  };
  orders: Array<{
    id: string;
    method: PaymentMethod;
    status: "pending" | "processing" | "manual_review" | "paid" | "failed" | "canceled";
    paymentAmountCents: number;
    paymentCurrency: string;
    createdAt: string;
    plan: { name: PlanName };
  }>;
};

const planFeatures: Record<PlanName, string[]> = {
  individual: ["100", "pdf", "comparison"],
  saver: ["200", "pdf", "comparison"],
  agency: ["unlimited", "crm", "priority"],
};

const wallets: Array<{
  id: string;
  label: string;
  shortLabel: string;
  className: string;
}> = [
  {
    id: "vodafone",
    label: "Vodafone Cash",
    shortLabel: "vodafone\nCASH",
    className: "from-[#f51b28] to-[#c90015]",
  },
  {
    id: "orange",
    label: "Orange Cash",
    shortLabel: "Orange\nMoney",
    className: "from-[#ff9500] to-[#f36d00]",
  },
  {
    id: "etisalat",
    label: "e& money",
    shortLabel: "e&\nmoney",
    className: "from-[#8dc63f] to-[#4e8d27]",
  },
  {
    id: "we",
    label: "WE Pay",
    shortLabel: "WE\nPay",
    className: "from-[#8d2092] to-[#59115f]",
  },
];

function isPlanName(value: string | null): value is PlanName {
  return value === "individual" || value === "saver" || value === "agency";
}

function BillingPageContent() {
  const t = useTranslations("billing");
  const locale = useLocale() as "ar" | "en";
  const searchParams = useSearchParams();
  const requestedPlan = searchParams.get("plan");
  const [data, setData] = useState<BillingData | null>(null);
  const [selectedPlanOverride, setSelectedPlanOverride] = useState<PlanName | null>(null);
  const selectedPlan =
    selectedPlanOverride ?? (isPlanName(requestedPlan) ? requestedPlan : "individual");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("mobile_wallet");
  const [phone, setPhone] = useState("");
  const [transferReference, setTransferReference] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadBilling = useCallback(async () => {
    const response = await fetch("/api/billing", { cache: "no-store" });
    if (response.status === 401) {
      const callbackUrl = `${window.location.pathname}${window.location.search}`;
      const loginPath = window.location.pathname.startsWith("/en/") ? "/en/login" : "/ar/login";
      window.location.replace(`${loginPath}?callbackUrl=${encodeURIComponent(callbackUrl)}`);
      return;
    }
    if (!response.ok) throw new Error("LOAD_FAILED");
    const result = await response.json();
    const billingData = result.data as BillingData;
    setData(billingData);
    setSelectedMethod((currentMethod) => {
      if (billingData.payment.methods[currentMethod].enabled) return currentMethod;
      if (billingData.payment.methods.mobile_wallet.enabled) return "mobile_wallet";
      if (billingData.payment.methods.card.enabled) return "card";
      return "manual_transfer";
    });
  }, [setData, setSelectedMethod]);

  useEffect(() => {
    let cancelled = false;
    async function initialLoad() {
      try {
        await loadBilling();
      } catch {
        if (!cancelled) setError(t("loadError"));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void initialLoad();
    return () => {
      cancelled = true;
    };
  }, [loadBilling, t]);

  useEffect(() => {
    if (!data?.orders.some((order) => order.status === "processing")) return;
    const timer = window.setInterval(() => {
      loadBilling().catch(() => undefined);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [data?.orders, loadBilling]);

  const plan = useMemo(
    () => data?.plans.find((item) => item.name === selectedPlan) ?? data?.plans[0],
    [data?.plans, selectedPlan]
  );
  const convertedPrice =
    plan && data?.payment.conversionRate
      ? (plan.priceCents / 100) * data.payment.conversionRate
      : null;
  const methodEnabled = data?.payment.methods[selectedMethod].enabled ?? false;
  const formattedPrice =
    convertedPrice === null
      ? t("afterConfiguration")
      : new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-EG", {
          style: "currency",
          currency: "EGP",
          maximumFractionDigits: 0,
        }).format(convertedPrice);

  async function submitCheckout() {
    if (!plan || !methodEnabled) return;
    setError("");
    setSuccess("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: plan.name,
          method: selectedMethod,
          locale,
          phone,
          ...(selectedMethod === "manual_transfer" ? { transferReference } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.code || "CHECKOUT_FAILED");
      if (result.data.checkoutUrl) {
        window.location.assign(result.data.checkoutUrl);
        return;
      }
      setSuccess(t("manualSubmitted"));
      setTransferReference("");
      await loadBilling();
    } catch (checkoutError) {
      const code = checkoutError instanceof Error ? checkoutError.message : "CHECKOUT_FAILED";
      setError(
        code === "PAYMENT_METHOD_NOT_CONFIGURED" ? t("methodUnavailable") : t("checkoutError")
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyAccountNumber() {
    const accountNumber = data?.payment.methods.manual_transfer.accountNumber;
    if (!accountNumber) return;
    await navigator.clipboard.writeText(accountNumber);
    setSuccess(t("accountCopied"));
  }

  function choosePlan(planName: PlanName) {
    setSelectedPlanOverride(planName);
    const url = new URL(window.location.href);
    url.searchParams.set("plan", planName);
    window.history.replaceState(window.history.state, "", url);
  }

  if (isLoading) {
    return <BillingPageSkeleton />;
  }

  return (
    <div
      className="mx-auto w-full max-w-[1380px] p-2 sm:p-5 lg:p-7"
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className="overflow-hidden rounded-[26px] border border-[#252c3a] bg-[#0d1017] text-[#f7f8fb] shadow-[0_30px_80px_-45px_rgba(15,23,42,.75)] sm:rounded-[34px]">
        <header className="relative overflow-hidden border-b border-[#252c3a] px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
          <div className="absolute -start-20 -top-28 size-72 rounded-full bg-[#ff1768]/10 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-black text-[#ff347a]">
                <Sparkles className="size-4" />
                {t("kicker")}
              </div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{t("title")}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#8490a8]">{t("subtitle")}</p>
            </div>
            <div className="flex w-fit items-center gap-3 rounded-2xl border border-[#ff1768]/35 bg-[#ff1768]/10 px-4 py-3">
              <WalletCards className="size-5 text-[#ff347a]" />
              <div>
                <p className="text-[11px] text-[#8e9ab1]">{t("currentPlan")}</p>
                <p className="font-black text-[#ff347a]">
                  {data ? t(`plans.${data.currentPlan}.name`) : "—"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="border-b border-[#252c3a] bg-[#11151d] px-4 py-6 sm:px-8 lg:px-10">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#ff347a]">{t("stepOne")}</p>
              <h2 className="mt-1 text-lg font-black">{t("choosePlan")}</h2>
            </div>
            <span className="rounded-full border border-[#293140] bg-[#171c25] px-3 py-1.5 text-xs text-[#8e9ab1]">
              {t("monthlySubscription")}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {data?.plans.map((item) => {
              const selected = item.name === plan?.name;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => choosePlan(item.name)}
                  className={`group relative min-h-44 overflow-hidden rounded-[22px] border p-5 text-start transition-all ${
                    selected
                      ? "border-[#ff1768] bg-[#ff1768]/[0.075] shadow-[0_18px_38px_-25px_rgba(255,23,104,.85)]"
                      : "border-[#28303e] bg-[#171b24] hover:border-[#465064]"
                  }`}
                >
                  {selected && (
                    <span className="absolute end-4 top-4 grid size-7 place-items-center rounded-full bg-[#ed1763] text-white">
                      <Check className="size-4" strokeWidth={3} />
                    </span>
                  )}
                  {item.name === "saver" && !selected && (
                    <span className="absolute end-4 top-4 rounded-full bg-[#ed1763] px-2.5 py-1 text-[10px] font-black text-white">
                      {t("mostPopular")}
                    </span>
                  )}
                  <p className="font-black">{t(`plans.${item.name}.name`)}</p>
                  <div className="mt-3 flex items-end gap-1" dir="ltr">
                    <strong className="text-3xl font-black">
                      ${(item.priceCents / 100).toFixed(0)}
                    </strong>
                    <span className="pb-1 text-xs text-[#8994aa]">/{t("month")}</span>
                  </div>
                  <ul className="mt-4 space-y-1.5">
                    {planFeatures[item.name].slice(0, 2).map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-xs text-[#9aa5ba]">
                        <Check className="size-3.5 shrink-0 text-[#28d28c]" />
                        {t(`features.${feature}`)}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(310px,.8fr)]">
          <main className="border-[#252c3a] lg:border-e">
            <section className="border-b border-[#252c3a] px-4 py-6 sm:px-8 lg:px-10">
              <div className="mb-5">
                <p className="text-xs font-bold text-[#ff347a]">{t("stepTwo")}</p>
                <h2 className="mt-1 flex items-center gap-2 text-xl font-black">
                  <WalletCards className="size-5 text-[#ff347a]" />
                  {t("chooseMethod")}
                </h2>
                <p className="mt-2 text-sm text-[#7f8aa0]">{t("chooseMethodHint")}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <PaymentMethodButton
                  active={selectedMethod === "mobile_wallet"}
                  enabled={data?.payment.methods.mobile_wallet.enabled ?? false}
                  onClick={() => setSelectedMethod("mobile_wallet")}
                  icon={<Smartphone className="size-5" />}
                  title={t("methods.mobile_wallet.title")}
                  subtitle={t("methods.mobile_wallet.subtitle")}
                />
                <PaymentMethodButton
                  active={selectedMethod === "card"}
                  enabled={data?.payment.methods.card.enabled ?? false}
                  onClick={() => setSelectedMethod("card")}
                  icon={<CreditCard className="size-5" />}
                  title={t("methods.card.title")}
                  subtitle={t("methods.card.subtitle")}
                />
                <PaymentMethodButton
                  active={selectedMethod === "manual_transfer"}
                  enabled={data?.payment.methods.manual_transfer.enabled ?? false}
                  onClick={() => setSelectedMethod("manual_transfer")}
                  icon={<Banknote className="size-5" />}
                  title={t("methods.manual_transfer.title")}
                  subtitle={t("methods.manual_transfer.subtitle")}
                />
              </div>
            </section>

            {selectedMethod === "mobile_wallet" && (
              <section className="border-b border-[#252c3a] px-4 py-6 sm:px-8 lg:px-10">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-black">{t("supportedWallets")}</h3>
                  {methodEnabled && (
                    <span className="rounded-full border border-[#1d6b53] bg-[#12382f] px-3 py-1 text-xs font-bold text-[#31d69a]">
                      {t("automatic")}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {wallets.map((wallet) => (
                    <div
                      key={wallet.id}
                      className="relative rounded-[20px] border border-[#28303e] bg-[#151a23] p-3"
                    >
                      <span
                        className={`mx-auto grid aspect-square w-full max-w-28 place-items-center rounded-2xl bg-gradient-to-br ${wallet.className} px-2 text-center text-lg font-black leading-5 whitespace-pre-line text-white shadow-lg`}
                      >
                        {wallet.shortLabel}
                      </span>
                      <span className="mt-3 block text-center text-xs font-bold text-[#dfe3eb]">
                        {wallet.label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#7f8aa0]">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-[#ff347a]" />
                  {t("walletRedirectHint")}
                </p>
              </section>
            )}

            {selectedMethod === "manual_transfer" && methodEnabled && (
              <section className="border-b border-[#252c3a] px-4 py-6 sm:px-8 lg:px-10">
                <h3 className="mb-4 flex items-center gap-2 font-black text-[#8e9ab1]">
                  <Phone className="size-4 text-[#ff347a]" />
                  {t("transferToNumber")}
                </h3>
                <div className="flex items-center justify-between gap-3 rounded-[22px] border border-[#293140] bg-[#171c25] p-4 sm:p-5">
                  <div className="min-w-0">
                    <p className="text-xs text-[#7f8aa0]">
                      {data?.payment.methods.manual_transfer.accountLabel}
                    </p>
                    <strong className="mt-1 block truncate text-xl tracking-wide" dir="ltr">
                      {data?.payment.methods.manual_transfer.accountNumber}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={copyAccountNumber}
                    className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[#ff1768]/35 bg-[#ff1768]/10 text-[#ff347a] transition hover:bg-[#ff1768]/20"
                    aria-label={t("copyAccount")}
                  >
                    <Copy className="size-5" />
                  </button>
                </div>
                <div className="mt-5 rounded-[22px] border border-[#28303e] bg-[#151a22] p-4 sm:p-5">
                  <h4 className="mb-4 flex items-center gap-2 font-black text-[#929db2]">
                    <CheckCircle2 className="size-4 text-[#ff347a]" />
                    {t("depositSteps")}
                  </h4>
                  <ol className="space-y-3">
                    {["depositStep1", "depositStep2", "depositStep3"].map((key, index) => (
                      <li key={key} className="flex items-start gap-3 text-sm text-[#9aa5ba]">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#ed1763] font-black text-white">
                          {index + 1}
                        </span>
                        <span className="pt-1">{t(key)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </section>
            )}

            <section className="px-4 py-6 sm:px-8 sm:py-8 lg:px-10">
              {!methodEnabled && (
                <div className="mb-5 rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4 text-sm font-bold text-amber-300">
                  {t("methodUnavailable")}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-[#929db2]">{t("phone")}</span>
                  <span className="relative block">
                    <Phone className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-[#445069]" />
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      dir="ltr"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+201xxxxxxxxx"
                      className="h-14 w-full rounded-2xl border border-[#293140] bg-[#171c25] px-12 text-start text-[#f7f8fb] outline-none transition placeholder:text-[#465168] focus:border-[#ff347a] focus:ring-4 focus:ring-[#ff1768]/10"
                    />
                  </span>
                </label>
                {selectedMethod === "manual_transfer" && (
                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-[#929db2]">
                      {t("transferReference")}
                    </span>
                    <span className="relative block">
                      <Gift className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-[#445069]" />
                      <input
                        dir="ltr"
                        value={transferReference}
                        onChange={(event) => setTransferReference(event.target.value)}
                        placeholder={t("transferReferencePlaceholder")}
                        className="h-14 w-full rounded-2xl border border-[#293140] bg-[#171c25] px-12 text-start text-[#f7f8fb] outline-none transition placeholder:text-[#465168] focus:border-[#ff347a] focus:ring-4 focus:ring-[#ff1768]/10"
                      />
                    </span>
                  </label>
                )}
              </div>

              {selectedMethod === "manual_transfer" && methodEnabled && (
                <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] p-4 text-sm leading-6 text-amber-300">
                  <div className="flex items-start gap-2">
                    <Info className="mt-1 size-4 shrink-0" />
                    {t("manualInstructions")}
                  </div>
                </div>
              )}
              {error && (
                <p className="mt-4 text-sm font-bold text-red-400" role="alert">
                  {error}
                </p>
              )}
              {success && (
                <p className="mt-4 text-sm font-bold text-[#31d69a]" role="status">
                  {success}
                </p>
              )}

              <button
                type="button"
                disabled={
                  isSubmitting ||
                  !methodEnabled ||
                  phone.trim().length < 8 ||
                  (selectedMethod === "manual_transfer" && transferReference.trim().length < 4)
                }
                onClick={submitCheckout}
                className="mt-6 inline-flex h-16 w-full items-center justify-center gap-3 rounded-[22px] bg-gradient-to-l from-[#ff1768] to-[#d80e55] px-6 text-lg font-black text-white shadow-[0_18px_34px_-16px_rgba(255,23,104,.8)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? (
                  <Clock3 className="size-5 animate-spin" />
                ) : (
                  <ShieldCheck className="size-5" />
                )}
                {isSubmitting
                  ? t("processing")
                  : selectedMethod === "manual_transfer"
                    ? t("submitManual")
                    : t("payNow")}
              </button>
              <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-[#6f7a91]">
                <LockKeyhole className="size-3.5 text-[#31d69a]" />
                {t("securePaymentHint")}
              </p>
            </section>
          </main>

          <aside className="bg-[#10141c] px-4 py-6 sm:px-8 lg:px-7 lg:py-8">
            <div className="lg:sticky lg:top-6">
              <h2 className="text-lg font-black">{t("summary")}</h2>
              <div className="mt-5 overflow-hidden rounded-[24px] border border-[#293140] bg-[#171c25]">
                <div className="border-b border-[#293140] p-5">
                  <p className="text-xs text-[#7f8aa0]">{t("selectedPlan")}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <strong>{plan ? t(`plans.${plan.name}.name`) : "—"}</strong>
                    <span className="rounded-full bg-[#ff1768]/10 px-3 py-1 text-xs font-bold text-[#ff4c87]">
                      {t("monthlySubscription")}
                    </span>
                  </div>
                </div>
                <div className="space-y-4 p-5 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-[#818da4]">{t("monthlyPrice")}</span>
                    <strong dir="ltr">${plan ? (plan.priceCents / 100).toFixed(0) : "—"}</strong>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#818da4]">{t("paymentMethod")}</span>
                    <strong>{t(`methods.${selectedMethod}.title`)}</strong>
                  </div>
                  <div className="border-t border-[#293140] pt-4">
                    <span className="text-xs text-[#818da4]">{t("chargedAmount")}</span>
                    <strong className="mt-2 block text-2xl text-[#ff4c87]" dir="ltr">
                      {formattedPrice}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[22px] border border-[#1c5546] bg-[#112a25] p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#31d69a]" />
                  <div>
                    <h3 className="font-black text-[#dff9ef]">{t("secureTitle")}</h3>
                    <p className="mt-1 text-xs leading-5 text-[#7fa99b]">
                      {t("secureDescription")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[22px] border border-[#293140] bg-[#151922] p-4">
                <p className="text-xs font-black text-[#8e9ab1]">{t("includedFeatures")}</p>
                <ul className="mt-3 space-y-3">
                  {(plan ? planFeatures[plan.name] : []).map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-xs text-[#a2acbd]">
                      <CheckCircle2 className="size-4 shrink-0 text-[#31d69a]" />
                      {t(`features.${feature}`)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        </div>

        <section className="border-t border-[#252c3a] bg-[#0f131a] px-4 py-6 sm:px-8 lg:px-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-black">{t("paymentHistory")}</h2>
            {data?.orders.length ? (
              <span className="text-xs text-[#768197]">
                {data.orders.length} {t("operations")}
              </span>
            ) : null}
          </div>
          {data?.orders.length ? (
            <div className="divide-y divide-[#293140] overflow-hidden rounded-[22px] border border-[#293140] bg-[#171b24]">
              {data.orders.map((order) => (
                <div
                  key={order.id}
                  className="grid gap-3 px-4 py-4 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-5"
                >
                  <div>
                    <p className="font-bold">{t(`plans.${order.plan.name}.name`)}</p>
                    <p className="mt-1 text-xs text-[#7f8aa0]">
                      {new Date(order.createdAt).toLocaleDateString(
                        locale === "ar" ? "ar-EG" : "en-US"
                      )}
                      {" · "}
                      {t(`methods.${order.method}.title`)}
                    </p>
                  </div>
                  <strong dir="ltr">
                    {(order.paymentAmountCents / 100).toLocaleString(
                      locale === "ar" ? "ar-EG" : "en-US"
                    )}{" "}
                    {order.paymentCurrency}
                  </strong>
                  <span
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold status-${order.status}`}
                  >
                    {order.status === "processing" || order.status === "manual_review" ? (
                      <Clock3 className="size-3.5" />
                    ) : null}
                    {t(`statuses.${order.status}`)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-[#303746] bg-[#151922] px-6 py-10 text-center">
              <WalletCards className="mx-auto size-8 text-[#3c465a]" />
              <p className="mt-3 text-sm text-[#778299]">{t("noPayments")}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function BillingPageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-5 p-3 sm:p-6 lg:p-8">
      <div className="h-28 animate-pulse rounded-[28px] bg-[#171b24]" />
      <div className="grid gap-5 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-64 animate-pulse rounded-[28px] bg-[#171b24]" />
        ))}
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<BillingPageSkeleton />}>
      <BillingPageContent />
    </Suspense>
  );
}

function PaymentMethodButton({
  active,
  enabled,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  enabled: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`relative flex min-h-24 items-center gap-3 rounded-[20px] border p-4 text-start transition ${
        active
          ? "border-[#ff1768] bg-[#ff1768]/[0.075] ring-2 ring-[#ff1768]/10"
          : "border-[#293140] bg-[#171c25] hover:border-[#465064]"
      } ${enabled ? "" : "opacity-60"}`}
    >
      <span
        className={`grid size-11 shrink-0 place-items-center rounded-2xl ${active ? "bg-[#ed1763] text-white" : "bg-[#222936] text-[#8390a7]"}`}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <strong className="block text-sm text-[#f7f8fb]">{title}</strong>
        <span className="mt-1 block text-[11px] leading-4 text-[#7f8aa0]">{subtitle}</span>
      </span>
      <ArrowLeft
        className={`ms-auto size-4 shrink-0 text-[#5d687e] ${active ? "opacity-100" : "opacity-0"}`}
      />
    </button>
  );
}
