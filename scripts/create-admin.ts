/**
 * Create (or reset) a platform admin and print ready-to-send credentials.
 *
 * Run once against the database you want the admin to exist in. The
 * production DATABASE_URL lives in Vercel > Settings > Environment Variables.
 *
 *   DATABASE_URL="postgresql://..." pnpm exec tsx scripts/create-admin.ts admin@example.com
 *
 * Optionally pass a display name:
 *   ... scripts/create-admin.ts admin@example.com "طارق صقر"
 *
 * By default the password is generated here with crypto.randomBytes and
 * printed once. Set ADMIN_PASSWORD to use a password you already handed over,
 * so the credentials you sent stay valid:
 *
 *   ADMIN_PASSWORD="..." DATABASE_URL="..." pnpm exec tsx scripts/create-admin.ts admin@example.com
 *
 * Re-running for an existing email resets that account's password and keeps
 * the role, so it doubles as "the admin forgot their password".
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt, randomUUID } from "crypto";

const prisma = new PrismaClient();

// Same scheme Better Auth uses in this project (see prisma/seed.ts).
function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString("hex");
    const normalized = Buffer.from(password.normalize("NFKC"), "utf-8");
    scrypt(normalized, salt, 64, { N: 16384, r: 16, p: 1, maxmem: 256 * 1024 * 1024 }, (err, key) => {
      if (err) return reject(err);
      resolve(`${salt}:${key.toString("hex")}`);
    });
  });
}

/** 20 chars from a 62-char alphabet ≈ 119 bits, no ambiguous glyphs. */
function generatePassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(20);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const name = process.argv[3]?.trim() || "مدير المنصة";

  if (!email || !email.includes("@")) {
    console.error("Usage: pnpm exec tsx scripts/create-admin.ts <email> [name]");
    process.exit(1);
  }

  const role = await prisma.role.findUnique({ where: { name: "platform_admin" } });
  if (!role) {
    console.error("Role platform_admin is missing. Run the seed first: pnpm db:seed");
    process.exit(1);
  }

  const agencyPlan =
    (await prisma.plan.findFirst({ where: { name: "agency" } })) ??
    (await prisma.plan.findFirst({ where: { name: "free" } }));
  if (!agencyPlan) {
    console.error("No plans found. Run the seed first: pnpm db:seed");
    process.exit(1);
  }

  const supplied = process.env.ADMIN_PASSWORD?.trim();
  if (supplied && supplied.length < 12) {
    console.error("ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }
  const password = supplied || generatePassword();
  const hash = await hashPassword(password);

  const existing = await prisma.user.findUnique({ where: { email } });

  const user = existing
    ? await prisma.user.update({
        where: { email },
        data: { passwordHash: hash, emailVerified: true, emailVerifiedAt: new Date() },
      })
    : await prisma.user.create({
        data: {
          email,
          name,
          preferredLocale: "ar",
          emailVerified: true,
          emailVerifiedAt: new Date(),
          passwordHash: hash,
          plan: { connect: { id: agencyPlan.id } },
        },
      });

  // Better Auth signs in against the credential account row, not User.passwordHash.
  const account = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });
  if (account) {
    await prisma.account.update({ where: { id: account.id }, data: { password: hash } });
  } else {
    await prisma.account.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        accountId: user.id,
        providerId: "credential",
        password: hash,
      },
    });
  }

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://tiktok-vip-six.vercel.app").replace(/\/$/, "");

  console.log("");
  console.log("═══════════════════════════════════════════════");
  console.log(existing ? "  Admin password reset" : "  Admin account created");
  console.log("═══════════════════════════════════════════════");
  console.log("");
  console.log(`  الرابط:        ${appUrl}/ar/login`);
  console.log(`  البريد:        ${user.email}`);
  console.log(`  كلمة المرور:   ${supplied ? "(the one you supplied in ADMIN_PASSWORD)" : password}`);
  console.log("");
  console.log(`  لوحة الإدارة:  ${appUrl}/ar/admin/payments`);
  console.log("");
  console.log("═══════════════════════════════════════════════");
  console.log("  This password is shown once and is not stored anywhere");
  console.log("  in plain text. Ask the admin to change it after the");
  console.log("  first sign-in, from /ar/dashboard/settings.");
  console.log("═══════════════════════════════════════════════");
  console.log("");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
