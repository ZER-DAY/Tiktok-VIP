import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/modules/auth";
import { hasPermission } from "@/lib/auth";
import {
  activatePaidOrder,
  isOrderPaymentValid,
  rejectManualOrder,
} from "@/modules/billing/subscription-activation";

const reviewSchema = z.object({
  orderId: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(500).optional(),
});

async function requirePaymentsAdmin() {
  const user = await getCurrentUser();
  if (!user) return { error: "UNAUTHORIZED" as const, user: null };
  if (!(await hasPermission(user.id, "admin.manage_plans"))) {
    return { error: "FORBIDDEN" as const, user: null };
  }
  return { error: null, user };
}

export async function GET() {
  try {
    const access = await requirePaymentsAdmin();
    if (access.error) {
      return NextResponse.json(
        { success: false, error: { code: access.error } },
        { status: access.error === "UNAUTHORIZED" ? 401 : 403 }
      );
    }

    const orders = await prisma.paymentOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        method: true,
        status: true,
        provider: true,
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
        failureReason: true,
        user: { select: { name: true, email: true } },
        plan: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error) {
    console.error("[ADMIN PAYMENTS GET]", error);
    return NextResponse.json(
      { success: false, error: { code: "PAYMENTS_FAILED" } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requirePaymentsAdmin();
    if (access.error || !access.user) {
      return NextResponse.json(
        { success: false, error: { code: access.error } },
        { status: access.error === "UNAUTHORIZED" ? 401 : 403 }
      );
    }

    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR" } },
        { status: 400 }
      );
    }

    const order = await prisma.paymentOrder.findFirst({
      where: {
        id: parsed.data.orderId,
        provider: "manual",
        status: "manual_review",
      },
      select: {
        id: true,
        planPriceCents: true,
        paymentAmountCents: true,
        paymentCurrency: true,
        plan: { select: { name: true, priceCents: true, isActive: true } },
      },
    });
    if (!order) {
      return NextResponse.json(
        { success: false, error: { code: "ORDER_NOT_REVIEWABLE" } },
        { status: 409 }
      );
    }
    if (!isOrderPaymentValid(order)) {
      return NextResponse.json(
        { success: false, error: { code: "ORDER_INVALID" } },
        { status: 422 }
      );
    }

    if (parsed.data.decision === "approve") {
      await activatePaidOrder(order.id, `manual:${order.id}`, {
        reviewedAt: new Date(),
        actorUserId: access.user.id,
      });
    } else {
      await rejectManualOrder(
        order.id,
        parsed.data.reason ?? "MANUAL_PAYMENT_REJECTED",
        access.user.id
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN PAYMENTS PATCH]", error);
    return NextResponse.json(
      { success: false, error: { code: "PAYMENT_REVIEW_FAILED" } },
      { status: 500 }
    );
  }
}
