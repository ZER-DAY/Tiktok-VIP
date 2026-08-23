#!/usr/bin/env node
/**
 * Reset admin user password using Better Auth's scrypt-based hashing.
 * Usage: node scripts/reset-admin-password.mjs [new-password]
 * Default password: Admin@12345
 */
import { PrismaClient } from "@prisma/client";
import { scryptAsync } from "@noble/hashes/scrypt.js";

const prisma = new PrismaClient();

function hexEncode(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password) {
  const salt = hexEncode(crypto.getRandomValues(new Uint8Array(16)));
  const key = await scryptAsync(password.normalize("NFKC"), salt, {
    N: 16384,
    r: 16,
    p: 1,
    dkLen: 64,
    maxmem: 128 * 16384 * 16 * 2,
  });
  return `${salt}:${hexEncode(key)}`;
}

const ADMIN_EMAIL = "admin@tiktok-intelligence.test";
const newPassword = process.argv[2] || "Admin@12345";

async function main() {
  console.log(`\nResetting password for ${ADMIN_EMAIL}...`);

  const hash = await hashPassword(newPassword);

  const user = await prisma.user.update({
    where: { email: ADMIN_EMAIL },
    data: { passwordHash: hash },
    select: { id: true, email: true, name: true },
  });

  console.log(`\n✅ Password updated successfully!`);
  console.log(`   Email:    ${user.email}`);
  console.log(`   Password: ${newPassword}`);
  console.log(`   User ID:  ${user.id}\n`);
}

main()
  .catch((e) => {
    if (e.code === "P2025") {
      console.error(`\n❌ User ${ADMIN_EMAIL} not found. Run seed first: pnpm db:seed\n`);
    } else {
      console.error("Failed:", e);
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
