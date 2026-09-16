import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { getPaymobServerConfig } from "./payment-config";

const intentionResponseSchema = z.object({
  id: z.string().min(1),
  client_secret: z.string().min(1),
});

export type PaymobMethod = "card" | "mobile_wallet";

export async function createPaymobIntention(input: {
  method: PaymobMethod;
  orderId: string;
  planName: string;
  amountCents: number;
  currency: "EGP";
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  notificationUrl: string;
  redirectionUrl: string;
}) {
  const config = getPaymobServerConfig(input.method);
  if (!config) throw new Error("PAYMENT_METHOD_NOT_CONFIGURED");

  const cleanName = input.customer.name.trim().replace(/\s+/g, " ");
  const [firstName, ...lastNameParts] = cleanName.split(" ");
  const lastName = lastNameParts.join(" ") || firstName || "Customer";
  const safeFirstName = firstName || "Customer";

  const response = await fetch(`${config.baseUrl}/v1/intention/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${config.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountCents,
      currency: input.currency,
      payment_methods: [config.integrationId],
      items: [
        {
          name: input.planName,
          amount: input.amountCents,
          description: "LIVE STREAM TECHNOLOGY monthly subscription",
          quantity: 1,
        },
      ],
      billing_data: {
        apartment: "NA",
        floor: "NA",
        first_name: safeFirstName,
        last_name: lastName,
        street: "NA",
        building: "NA",
        phone_number: input.customer.phone,
        shipping_method: "NA",
        postal_code: "NA",
        city: "Cairo",
        country: "EG",
        state: "Cairo",
        email: input.customer.email,
      },
      customer: {
        first_name: safeFirstName,
        last_name: lastName,
        email: input.customer.email,
      },
      special_reference: input.orderId,
      notification_url: input.notificationUrl,
      redirection_url: input.redirectionUrl,
      expiration: 3600,
      extras: {
        merchant_order_id: input.orderId,
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`PAYMOB_INTENTION_FAILED_${response.status}`);
  }

  const parsed = intentionResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error("PAYMOB_INVALID_RESPONSE");

  const checkoutUrl = new URL("/unifiedcheckout/", config.baseUrl);
  checkoutUrl.searchParams.set("publicKey", config.publicKey);
  checkoutUrl.searchParams.set("clientSecret", parsed.data.client_secret);

  return {
    intentionId: parsed.data.id,
    checkoutUrl: checkoutUrl.toString(),
  };
}

const HMAC_FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
] as const;

type PaymobTransactionObject = Record<string, unknown> & {
  order?: { id?: unknown; merchant_order_id?: unknown };
  source_data?: { pan?: unknown; sub_type?: unknown; type?: unknown };
};

export function getPaymobTransactionHmacValue(obj: PaymobTransactionObject) {
  const values = HMAC_FIELDS.map((field) => obj[field]);
  values.push(
    obj.order?.id,
    obj.owner,
    obj.pending,
    obj.source_data?.pan,
    obj.source_data?.sub_type,
    obj.source_data?.type,
    obj.success
  );
  return values.map((value) => String(value ?? "")).join("");
}

export function verifyPaymobTransactionHmac(
  obj: PaymobTransactionObject,
  receivedHmac: string,
  hmacSecret: string
) {
  if (!/^[a-f0-9]{128}$/i.test(receivedHmac)) return false;

  const expected = createHmac("sha512", hmacSecret)
    .update(getPaymobTransactionHmacValue(obj))
    .digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(receivedHmac, "hex");

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export type { PaymobTransactionObject };
