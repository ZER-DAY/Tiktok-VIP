/**
 * Reset admin user password using Better Auth's scrypt-based hashing.
 * Usage: npx tsx scripts/reset-admin-password.ts [new-password]
 * Default password: Admin@12345
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt } from "crypto";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url:
        process.env.DATABASE_URL ??
        "postgresql://postgres:postgres@localhost:5432/tiktok_intelligence?schema=public",
    },
  },
});

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString("hex");
    scrypt(
      Buffer.from(password.normalize("NFKC"), "utf-8"),
      salt,
      64,
      { N: 16384, r: 16, p: 1, maxmem: 256 * 1024 * 1024 },
      (err, key) => {
        if (err) return reject(err);
        resolve(`${salt}:${key.toString("hex")}`);
      }
    );
  });
}

const ADMIN_EMAIL = "admin@tiktok-intelligence.test";
const newPassword = process.argv[2] || "Admin@12345";

async function main() {
  const hash = await hashPassword(newPassword);

  const user = await prisma.user.update({
    where: { email: ADMIN_EMAIL },
    data: { passwordHash: hash },
    select: { id: true, email: true, name: true },
  });

  // Update credential account too
  const account = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });
  if (account) {
    await prisma.account.update({
      where: { id: account.id },
      data: { password: hash },
    });
  }

  console.log(`\n✅ Password updated for ${user.email}`);
  console.log(`   Password: ${newPassword}`);
  console.log(`   Hash prefix: ${hash.substring(0, 30)}...\n`);
}

main()
  .catch((e) => {
    if (e.code === "P2025") {
      console.error(`❌ User ${ADMIN_EMAIL} not found. Run: pnpm db:seed`);
    } else {
      console.error("Failed:", e);
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
