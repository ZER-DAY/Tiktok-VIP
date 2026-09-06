import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ActivationOptions = {
  reviewedAt?: Date;
  actorUserId?: string;
};

function oneMonthFrom(date: Date) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + 1);
  return result;
}

export async function activatePaidOrder(
  orderId: string,
  providerTransactionId: string,
  options: ActivationOptions = {}
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const now = new Date();
          const claimed = await tx.paymentOrder.updateMany({
            where: { id: orderId, status: { not: "paid" } },
            data: {
              status: "paid",
              providerTransactionId,
              paidAt: now,
              reviewedAt: options.reviewedAt ?? null,
              failureReason: null,
            },
          });

          if (claimed.count === 0) {
            const existing = await tx.paymentOrder.findUnique({
              where: { id: orderId },
              select: { status: true },
            });
            return { activated: false, status: existing?.status ?? null };
          }

          const order = await tx.paymentOrder.findUniqueOrThrow({
            where: { id: orderId },
            select: { userId: true, planId: true },
          });

          await tx.subscription.updateMany({
            where: { userId: order.userId, status: "active" },
            data: { status: "canceled" },
          });
          await tx.subscription.create({
            data: {
              userId: order.userId,
              planId: order.planId,
              status: "active",
              currentPeriodEnd: oneMonthFrom(now),
              paymentProviderRef: providerTransactionId,
            },
          });
          await tx.user.update({
            where: { id: order.userId },
            data: { planId: order.planId },
          });
          await tx.auditLog.create({
            data: {
              actorUserId: options.actorUserId ?? null,
              action: "payment_order_activated",
              entityType: "PaymentOrder",
              entityId: orderId,
              metadata: {
                providerTransactionId,
                reviewedAt: options.reviewedAt?.toISOString() ?? null,
              },
            },
          });

          return { activated: true, status: "paid" as const };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (error) {
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
      if (!retryable || attempt === 2) throw error;
    }
  }

  throw new Error("PAYMENT_ACTIVATION_RETRY_EXHAUSTED");
}

export async function rejectManualOrder(orderId: string, reason: string, actorUserId: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const claimed = await tx.paymentOrder.updateMany({
            where: { id: orderId, provider: "manual", status: "manual_review" },
            data: {
              status: "failed",
              failureReason: reason?.trim() || "MANUAL_PAYMENT_REJECTED",
              reviewedAt: new Date(),
            },
          });

          if (claimed.count === 0) {
            const existing = await tx.paymentOrder.findUnique({
              where: { id: orderId },
              select: { status: true },
            });
            return { rejected: false, status: existing?.status ?? null };
          }

          await tx.auditLog.create({
            data: {
              actorUserId,
              action: "manual_payment_reject",
              entityType: "PaymentOrder",
              entityId: orderId,
              metadata: { reason: reason?.trim() || null },
            },
          });

          return { rejected: true, status: "failed" as const };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (error) {
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
      if (!retryable || attempt === 2) throw error;
    }
  }

  throw new Error("PAYMENT_REJECT_RETRY_EXHAUSTED");
}

export function isOrderPaymentValid(order: {
  planPriceCents: number;
  paymentAmountCents: number;
  paymentCurrency: string | null;
  plan: { name: string; priceCents: number; isActive: boolean };
}) {
  return (
    Number.isInteger(order.planPriceCents) &&
    order.planPriceCents > 0 &&
    Number.isInteger(order.paymentAmountCents) &&
    order.paymentAmountCents > 0 &&
    order.paymentCurrency === "EGP" &&
    order.plan.isActive &&
    order.plan.priceCents === order.planPriceCents &&
    order.paymentAmountCents >= order.planPriceCents &&
    order.paymentAmountCents <= order.planPriceCents * 100
  );
}
