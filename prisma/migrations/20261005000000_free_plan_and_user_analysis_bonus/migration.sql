ALTER TABLE "User" ADD COLUMN "analysisBonus" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD CONSTRAINT "User_analysisBonus_nonnegative" CHECK ("analysisBonus" >= 0);
UPDATE "Plan" SET "reportsPerMonth" = 5, "billingInterval" = 'lifetime', "updatedAt" = NOW() WHERE "name" = 'free';
