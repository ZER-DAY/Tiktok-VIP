-- Better Auth 1.6 core user fields.
ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
UPDATE "User" SET "emailVerified" = true WHERE "emailVerifiedAt" IS NOT NULL;

-- Better Auth requires every session token to be present and unique.
ALTER TABLE "Session" ALTER COLUMN "token" SET NOT NULL;
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- Required for OAuth token refresh metadata.
ALTER TABLE "Account" ADD COLUMN "refreshTokenExpiresAt" TIMESTAMP(3);
