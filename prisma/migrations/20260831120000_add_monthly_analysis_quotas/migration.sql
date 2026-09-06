-- Add monthly quota configuration to subscription plans.
ALTER TABLE "Plan" ADD COLUMN "reportsPerMonth" INTEGER;

-- Migrate the original plan names and launch prices to the approved packages.
UPDATE "Plan"
SET "name" = 'individual'
WHERE "name" = 'pro'
  AND NOT EXISTS (SELECT 1 FROM "Plan" WHERE "name" = 'individual');

UPDATE "Plan"
SET "priceCents" = 0,
    "billingInterval" = 'lifetime',
    "reportsPerDay" = NULL,
    "reportsPerMonth" = 1
WHERE "name" = 'free';

UPDATE "Plan"
SET "priceCents" = 2000,
    "billingInterval" = 'monthly',
    "reportsPerDay" = NULL,
    "reportsPerMonth" = 100
WHERE "name" IN ('individual', 'pro');

INSERT INTO "Plan" (
  "id",
  "name",
  "priceCents",
  "billingInterval",
  "reportsPerDay",
  "reportsPerMonth",
  "features",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  'saver',
  3000,
  'monthly',
  NULL,
  200,
  '{"pdfExport":true,"competitorComparison":true,"historicalTracking":true}'::jsonb,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Plan" WHERE "name" = 'saver');

UPDATE "Plan"
SET "priceCents" = 5000,
    "billingInterval" = 'monthly',
    "reportsPerDay" = NULL,
    "reportsPerMonth" = NULL
WHERE "name" = 'agency';

CREATE TABLE "AnalysisUsageCounter" (
  "subjectKey" TEXT NOT NULL,
  "periodKey" TEXT NOT NULL,
  "used" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AnalysisUsageCounter_pkey" PRIMARY KEY ("subjectKey", "periodKey")
);

CREATE TABLE "AnalysisUsage" (
  "id" UUID NOT NULL,
  "requestId" UUID NOT NULL,
  "userId" UUID,
  "guestTokenHash" TEXT,
  "subjectKey" TEXT NOT NULL,
  "periodKey" TEXT NOT NULL,
  "planName" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "externalUsername" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AnalysisUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AnalysisUsage_requestId_key" ON "AnalysisUsage"("requestId");
CREATE INDEX "AnalysisUsage_userId_createdAt_idx" ON "AnalysisUsage"("userId", "createdAt");
CREATE INDEX "AnalysisUsage_guestTokenHash_createdAt_idx" ON "AnalysisUsage"("guestTokenHash", "createdAt");
CREATE INDEX "AnalysisUsage_subjectKey_periodKey_idx" ON "AnalysisUsage"("subjectKey", "periodKey");

ALTER TABLE "AnalysisUsage"
ADD CONSTRAINT "AnalysisUsage_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
