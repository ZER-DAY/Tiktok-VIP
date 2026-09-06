import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  type PaymobTransactionObject,
  verifyPaymobTransactionHmac,
} from "@/modules/billing/paymob";
import { activatePaidOrder } from "@/modules/billing/subscription-activation";

type PaymobWebhookBody = {
  type?: unknown;
  obj?: PaymobTransactionObject;
};

export async function POST(request: Request) {
  try {
    const hmacSecret = process.env.PAYMOB_HMAC_SECRET?.trim();
    const receivedHmac = new URL(request.url).searchParams.get("hmac") ?? "";
    if (!hmacSecret) {
      return NextResponse.json({ received: false }, { status: 503 });
    }

    const body = (await request.json()) as PaymobWebhookBody;
    const obj = body.obj;
    if (!obj || !verifyPaymobTransactionHmac(obj, receivedHmac, hmacSecret)) {
      return NextResponse.json({ received: false }, { status: 401 });
    }

    const orderId = String(obj.order?.merchant_order_id ?? "");
    const transactionId = String(obj.id ?? "");
    const amountCents = Number(obj.amount_cents);
    const currency = String(obj.currency ?? "").toUpperCase();
    const validOrderId =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId);
    if (!validOrderId || !transactionId || !Number.isSafeInteger(amountCents)) {
      return NextResponse.json({ received: false }, { status: 400 });
    }

    const order = await prisma.paymentOrder.findFirst({
      where: { id: orderId, provider: "paymob" },
      select: {
        id: true,
        status: true,
        paymentAmountCents: true,
        paymentCurrency: true,
      },
    });
    if (!order) {
      return NextResponse.json({ received: true });
    }

    if (order.paymentAmountCents !== amountCents || order.paymentCurrency !== currency) {
      await prisma.paymentOrder.updateMany({
        where: { id: order.id, status: { not: "paid" } },
        data: { status: "failed", failureReason: "PAYMENT_AMOUNT_MISMATCH" },
      });
      return NextResponse.json({ received: false }, { status: 400 });
    }

    const successful =
      obj.success === true &&
      obj.pending === false &&
      obj.error_occured === false &&
      obj.is_refunded !== true &&
      obj.is_voided !== true;

    if (successful) {
      await activatePaidOrder(order.id, transactionId);
    } else if (order.status !== "paid") {
      await prisma.paymentOrder.updateMany({
        where: { id: order.id, status: { not: "paid" } },
        data: {
          status: "failed",
          providerTransactionId: transactionId,
          failureReason: "PAYMENT_DECLINED",
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[PAYMOB WEBHOOK]", error);
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
