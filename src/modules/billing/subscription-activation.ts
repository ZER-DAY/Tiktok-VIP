import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function oneMonthFrom(date: Date) {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + 1);
  return result;
}

export async function activatePaidOrder(
  orderId: string,
  providerTransactionId: string,
  reviewedAt?: Date
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
              reviewedAt,
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
