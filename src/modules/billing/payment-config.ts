import { getSetting } from "@/modules/admin/settings";
import { getUsdToEgpRate } from "@/modules/billing/exchange-rate";

const PAYMOB_EGYPT_BASE_URL = "https://accept.paymob.com";

function positiveNumber(value: string | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function integrationId(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return null;
  return Number(value);
}

export function getPaymobServerConfig(method: "card" | "mobile_wallet") {
  const secretKey = process.env.PAYMOB_SECRET_KEY?.trim();
  const publicKey = process.env.PAYMOB_PUBLIC_KEY?.trim();
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET?.trim();
  const selectedIntegrationId = integrationId(
    method === "card"
      ? process.env.PAYMOB_CARD_INTEGRATION_ID
      : process.env.PAYMOB_WALLET_INTEGRATION_ID
  );
  const conversionRate = positiveNumber(process.env.PAYMENT_USD_TO_EGP_RATE);

  if (!secretKey || !publicKey || !hmacSecret || !selectedIntegrationId || !conversionRate) {
    return null;
  }

  // This deployment is intentionally limited to the Egyptian Paymob endpoint.
  // Do not turn an environment value into an arbitrary server-side fetch target.
  const configuredBaseUrl = process.env.PAYMOB_BASE_URL?.trim().replace(/\/$/, "");
  const baseUrl = configuredBaseUrl || PAYMOB_EGYPT_BASE_URL;
  if (baseUrl !== PAYMOB_EGYPT_BASE_URL) return null;

  return {
    baseUrl,
    secretKey,
    publicKey,
    hmacSecret,
    integrationId: selectedIntegrationId,
    conversionRate,
  };
}

export async function getManualPaymentConfig() {
  // Plans are priced in USD; Egyptian transfers are made in EGP, so the amount
  // shown to the buyer is converted at the live mid-market rate. The rate is
  // resolved once here and then frozen onto the order, so the figure the buyer
  // transfers is the figure the admin checks later.
  const [settingNumber, settingLabel, conversionRate] = await Promise.all([
    getSetting("payment.manual.accountNumber"),
    getSetting("payment.manual.accountLabel"),
    getUsdToEgpRate(),
  ]);

  const accountNumber =
    settingNumber?.trim() || process.env.MANUAL_PAYMENT_ACCOUNT_NUMBER?.trim();
  if (!accountNumber || !conversionRate) return null;

  return {
    accountNumber,
    accountLabel:
      settingLabel?.trim() ||
      process.env.MANUAL_PAYMENT_ACCOUNT_LABEL?.trim() ||
      "InstaPay / Mobile wallet",
    conversionRate,
  };
}

export function convertUsdCentsToEgp(usdCents: number, conversionRate: number) {
  if (!Number.isInteger(usdCents) || usdCents <= 0) {
    throw new Error("INVALID_PLAN_PRICE");
  }
  if (!Number.isFinite(conversionRate) || conversionRate <= 0) {
    throw new Error("INVALID_CONVERSION_RATE");
  }

  return Math.round(usdCents * conversionRate);
}

export async function getPublicPaymentConfiguration() {
  const card = getPaymobServerConfig("card");
  const mobileWallet = getPaymobServerConfig("mobile_wallet");
  const manual = await getManualPaymentConfig();
  const conversionRate =
    card?.conversionRate ?? mobileWallet?.conversionRate ?? manual?.conversionRate;

  return {
    currency: "EGP" as const,
    conversionRate: conversionRate ?? null,
    methods: {
      card: { enabled: Boolean(card) },
      mobile_wallet: { enabled: Boolean(mobileWallet) },
      manual_transfer: {
        enabled: Boolean(manual),
        accountLabel: manual?.accountLabel ?? null,
        accountNumber: manual?.accountNumber ?? null,
      },
      opay: { enabled: false },
      crypto: { enabled: false },
    },
  };
}
