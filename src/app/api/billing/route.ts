import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth";
import { getPublicPaymentConfiguration } from "@/modules/billing/payment-config";
import { prisma } from "@/lib/prisma";

const PAID_PLAN_NAMES = ["individual", "saver", "agency"];

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const now = new Date();
    const [plans, activeSubscription, orders] = await Promise.all([
      prisma.plan.findMany({
        where: { name: { in: PAID_PLAN_NAMES }, isActive: true },
        select: {
          id: true,
          name: true,
          priceCents: true,
          billingInterval: true,
          reportsPerMonth: true,
        },
        orderBy: { priceCents: "asc" },
      }),
      prisma.subscription.findFirst({
        where: {
          userId: user.id,
          status: "active",
          OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: now } }],
        },
        orderBy: { startedAt: "desc" },
        select: {
          currentPeriodEnd: true,
          plan: { select: { name: true } },
        },
      }),
      prisma.paymentOrder.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          method: true,
          status: true,
          planPriceCents: true,
          planPriceCurrency: true,
          paymentAmountCents: true,
          paymentCurrency: true,
          customerPhone: true,
          transferReference: true,
          providerTransactionId: true,
          createdAt: true,
          paidAt: true,
          reviewedAt: true,
          plan: { select: { name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        plans,
        currentPlan: activeSubscription?.plan.name ?? user.plan.name,
        currentPeriodEnd: activeSubscription?.currentPeriodEnd ?? null,
        payment: await getPublicPaymentConfiguration(),
        orders,
      },
    });
  } catch (error) {
    console.error("[BILLING GET]", error);
    return NextResponse.json(
      { success: false, error: { code: "BILLING_FAILED", message: "Failed to load billing" } },
      { status: 500 }
    );
  }
}
