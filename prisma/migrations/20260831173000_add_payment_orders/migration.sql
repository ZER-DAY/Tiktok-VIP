-- CreateEnum
CREATE TYPE "PaymentOrderStatus" AS ENUM ('pending', 'processing', 'manual_review', 'paid', 'failed', 'canceled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('card', 'mobile_wallet', 'manual_transfer');

-- CreateTable
CREATE TABLE "PaymentOrder" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentOrderStatus" NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL,
    "planPriceCents" INTEGER NOT NULL,
    "planPriceCurrency" TEXT NOT NULL DEFAULT 'USD',
    "paymentAmountCents" INTEGER NOT NULL,
    "paymentCurrency" TEXT NOT NULL,
    "providerIntentionId" TEXT,
    "providerTransactionId" TEXT,
    "customerPhone" TEXT,
    "transferReference" TEXT,
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_providerIntentionId_key" ON "PaymentOrder"("providerIntentionId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentOrder_providerTransactionId_key" ON "PaymentOrder"("providerTransactionId");

-- CreateIndex
CREATE INDEX "PaymentOrder_userId_createdAt_idx" ON "PaymentOrder"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PaymentOrder_status_createdAt_idx" ON "PaymentOrder"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "PaymentOrder_planId_idx" ON "PaymentOrder"("planId");

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentOrder" ADD CONSTRAINT "PaymentOrder_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
