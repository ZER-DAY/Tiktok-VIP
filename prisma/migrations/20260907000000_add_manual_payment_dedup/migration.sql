-- Prevent duplicate manual-transfer submissions from the same user with the
-- same transaction reference. NULL references (gateway orders) stay unique.
CREATE UNIQUE INDEX "PaymentOrder_userId_transferReference_key"
  ON "PaymentOrder"("userId", "transferReference");