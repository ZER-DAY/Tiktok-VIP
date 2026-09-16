import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/modules/auth";
import {
  convertUsdCentsToEgp,
  getManualPaymentConfig,
  getPaymobServerConfig,
} from "@/modules/billing/payment-config";
import { createPaymobIntention } from "@/modules/billing/paymob";

const checkoutSchema = z.object({
  plan: z.enum(["individual", "saver", "agency"]),
  method: z.enum(["card", "mobile_wallet", "manual_transfer"]),
  locale: z.enum(["ar", "en"]),
  phone: z
    .string()
    .trim()
    .min(8)
    .max(20)
    .regex(/^\+?[0-9 ]+$/),
  transferReference: z.string().trim().min(4).max(100).optional(),
});

function getApplicationOrigin(request: Request) {
  if (process.env.NODE_ENV !== "production") return new URL(request.url).origin;
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!configured) throw new Error("APP_URL_NOT_CONFIGURED");
  const url = new URL(configured);
  if (url.protocol !== "https:") throw new Error("APP_URL_MUST_USE_HTTPS");
  return url.origin;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const parsed = checkoutSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid checkout data" },
        },
        { status: 400 }
      );
    }

    const { plan: planName, method, locale, phone, transferReference } = parsed.data;
    const plan = await prisma.plan.findFirst({
      where: { name: planName, isActive: true, priceCents: { gt: 0 } },
      select: { id: true, name: true, priceCents: true },
    });
    if (!plan) {
      return NextResponse.json(
        { success: false, error: { code: "PLAN_NOT_FOUND", message: "Plan not found" } },
        { status: 404 }
      );
    }

    if (method === "manual_transfer") {
      const manualConfig = await getManualPaymentConfig();
      // The sender's phone number is the match key: InstaPay and the Egyptian
      // wallets both show it to the recipient, so the admin can tie an incoming
      // transfer to an order without the payer transcribing a reference.
      if (!manualConfig) {
        return NextResponse.json(
          {
            success: false,
            error: { code: "PAYMENT_METHOD_NOT_CONFIGURED", message: "Method unavailable" },
          },
          { status: 503 }
        );
      }

      const existingReview = await prisma.paymentOrder.findFirst({
        where: {
          userId: user.id,
          planId: plan.id,
          method: "manual_transfer",
          status: "manual_review",
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        select: { id: true, status: true },
      });
      if (existingReview) {
        return NextResponse.json(
          {
            success: true,
            data: {
              orderId: existingReview.id,
              status: existingReview.status,
              duplicate: true,
            },
          },
          { status: 200 }
        );
      }

      const paymentAmountCents = convertUsdCentsToEgp(plan.priceCents, manualConfig.conversionRate);
      const order = await prisma.paymentOrder.create({
        data: {
          userId: user.id,
          planId: plan.id,
          method,
          status: "manual_review",
          provider: "manual",
          planPriceCents: plan.priceCents,
          planPriceCurrency: "USD",
          paymentAmountCents,
          paymentCurrency: "EGP",
          customerPhone: phone,
          transferReference,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      return NextResponse.json(
        { success: true, data: { orderId: order.id, status: order.status } },
        { status: 201 }
      );
    }

    const paymobConfig = getPaymobServerConfig(method);
    if (!paymobConfig) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "PAYMENT_METHOD_NOT_CONFIGURED", message: "Method unavailable" },
        },
        { status: 503 }
      );
    }

    const paymentAmountCents = convertUsdCentsToEgp(plan.priceCents, paymobConfig.conversionRate);
    const order = await prisma.paymentOrder.create({
      data: {
        userId: user.id,
        planId: plan.id,
        method,
        status: "pending",
        provider: "paymob",
        planPriceCents: plan.priceCents,
        planPriceCurrency: "USD",
        paymentAmountCents,
        paymentCurrency: "EGP",
        customerPhone: phone,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    try {
      const origin = getApplicationOrigin(request);
      const intention = await createPaymobIntention({
        method,
        orderId: order.id,
        planName: `LIVE STREAM TECHNOLOGY - ${plan.name}`,
        amountCents: paymentAmountCents,
        currency: "EGP",
        customer: { name: user.name, email: user.email, phone },
        notificationUrl: `${origin}/api/billing/paymob/webhook`,
        redirectionUrl: `${origin}/${locale}/dashboard/billing?payment=processing&orderId=${order.id}`,
      });

      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: {
          status: "processing",
          providerIntentionId: intention.intentionId,
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: { orderId: order.id, status: "processing", checkoutUrl: intention.checkoutUrl },
        },
        { status: 201 }
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 190) : "CHECKOUT_FAILED";
      await prisma.paymentOrder.update({
        where: { id: order.id },
        data: { status: "failed", failureReason: reason },
      });
      throw error;
    }
  } catch (error) {
    console.error("[BILLING CHECKOUT]", error instanceof Error ? error.message : error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "CHECKOUT_FAILED", message: "Failed to start checkout" },
      },
      { status: 500 }
    );
  }
}
