/**
 * Create (or reset) a platform admin, then prove it works.
 *
 * Self-sufficient on purpose: it creates the permissions, the platform_admin
 * role and the role→permission links if they are missing, so it works against
 * a database that has had migrations applied but was never seeded. It never
 * runs the demo seed, so it will not put seed.ts's publicly-known admin
 * password into a production database.
 *
 *   DATABASE_URL="postgresql://..." pnpm exec tsx scripts/create-admin.ts admin@example.com
 *
 * Optionally pass a display name:
 *   ... scripts/create-admin.ts admin@example.com "طارق صقر"
 *
 * By default the password is generated here with crypto.randomBytes and
 * printed once. Set ADMIN_PASSWORD to use a password you already handed over,
 * so credentials you already sent stay valid:
 *
 *   ADMIN_PASSWORD="..." DATABASE_URL="..." pnpm exec tsx scripts/create-admin.ts admin@example.com
 *
 * Re-running for an existing email resets that account's password and keeps
 * the role, so it doubles as "the admin forgot their password".
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt, randomUUID } from "crypto";

const prisma = new PrismaClient();

/** Every permission the platform recognises, mirroring prisma/seed.ts. */
const PERMISSIONS: Array<[key: string, description: string]> = [
  ["report.view_own", "عرض التقارير الخاصة بالمستخدم"],
  ["report.view_any", "عرض أي تقرير في المنصة"],
  ["crm.view_applicants", "عرض قائمة المتقدمين للوكالة"],
  ["crm.edit_applicant_status", "تعديل حالة طلب متقدم"],
  ["crm.view_contact_info", "عرض بيانات التواصل الحساسة للمتقدمين"],
  ["crm.manage_assignees", "تعيين وتعديل المسؤولين عن المتقدمين"],
  ["admin.manage_users", "إدارة المستخدمين"],
  ["admin.manage_plans", "إدارة خطط الاشتراك"],
  ["admin.manage_settings", "إدارة إعدادات النظام"],
  ["admin.view_audit_logs", "عرض سجل العمليات"],
];

/** The keys the admin pages actually gate on — checked again after writing. */
const REQUIRED_FOR_ADMIN_UI = [
  "admin.manage_plans",
  "admin.manage_users",
  "admin.manage_settings",
  "admin.view_audit_logs",
  "crm.view_applicants",
];

/** The demo account prisma/seed.ts creates, with a password that is in git. */
const SEED_ADMIN_EMAIL = "admin@tiktok-intelligence.test";

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

/** 20 chars from a 57-char alphabet ≈ 116 bits, no ambiguous glyphs. */
function generatePassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(20);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

/** Create the RBAC rows the admin panel needs, if they are not there yet. */
async function ensurePlatformAdminRole() {
  const permissions = [];
  for (const [key, description] of PERMISSIONS) {
    permissions.push(
      await prisma.permission.upsert({ where: { key }, update: {}, create: { key, description } })
    );
  }

  const role = await prisma.role.upsert({
    where: { name: "platform_admin" },
    update: {},
    create: { name: "platform_admin", description: "مدير المنصة، وصول كامل لكل شيء" },
  });

  for (const permission of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {},
      create: { roleId: role.id, permissionId: permission.id },
    });
  }

  return role;
}

/** Users need a plan; fall back to creating the free one rather than failing. */
async function ensurePlan() {
  const existing =
    (await prisma.plan.findFirst({ where: { name: "agency" } })) ??
    (await prisma.plan.findFirst({ where: { name: "free" } })) ??
    (await prisma.plan.findFirst({ where: { isActive: true } }));
  if (existing) return existing;

  return prisma.plan.create({
    data: {
      name: "free",
      priceCents: 0,
      billingInterval: "lifetime",
      reportsPerMonth: 1,
      features: { pdfExport: false, competitorComparison: false, historicalTracking: false },
    },
  });
}

/** Re-read from the database and resolve permissions exactly as the app does. */
async function verify(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
  });

  const account = await prisma.account.findFirst({
    where: { userId, providerId: "credential" },
  });

  const granted = new Set(
    (user?.roles ?? []).flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.key))
  );
  const missing = REQUIRED_FOR_ADMIN_UI.filter((key) => !granted.has(key));

  return {
    ok: Boolean(user) && Boolean(account?.password) && missing.length === 0,
    hasCredential: Boolean(account?.password),
    roles: (user?.roles ?? []).map((ur) => ur.role.name),
    missing,
  };
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const name = process.argv[3]?.trim() || "مدير المنصة";

  if (!email || !email.includes("@")) {
    console.error("Usage: pnpm exec tsx scripts/create-admin.ts <email> [name]");
    process.exit(1);
  }

  const supplied = process.env.ADMIN_PASSWORD?.trim();
  if (supplied && supplied.length < 12) {
    console.error("ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }
  const password = supplied || generatePassword();

  const role = await ensurePlatformAdminRole();
  const plan = await ensurePlan();
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
          plan: { connect: { id: plan.id } },
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

  const check = await verify(user.id);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://tiktok-vip-six.vercel.app").replace(/\/$/, "");

  console.log("");
  console.log("═══════════════════════════════════════════════");
  console.log(existing ? "  Admin password reset" : "  Admin account created");
  console.log("═══════════════════════════════════════════════");
  console.log("");
  console.log(`  الرابط:        ${appUrl}/ar/login`);
  console.log(`  البريد:        ${user.email}`);
  console.log(`  كلمة المرور:   ${supplied ? "(نفس الكلمة اللي مررتها في ADMIN_PASSWORD)" : password}`);
  console.log("");
  console.log(`  لوحة الإدارة:  ${appUrl}/ar/admin/payments`);
  console.log("");
  console.log("───────────────────────────────────────────────");
  console.log(`  حساب الدخول (credential):  ${check.hasCredential ? "✅" : "❌"}`);
  console.log(`  الأدوار:                    ${check.roles.join(", ") || "(لا يوجد)"}`);
  console.log(`  صلاحيات لوحة الإدارة:      ${check.missing.length === 0 ? "✅ كاملة" : "❌ ناقص: " + check.missing.join(", ")}`);
  console.log("───────────────────────────────────────────────");

  const seedAdmin = await prisma.user.findUnique({ where: { email: SEED_ADMIN_EMAIL } });
  if (seedAdmin) {
    console.log("");
    console.log("  ⚠️  تحذير: حساب الديمو موجود في قاعدة البيانات دي:");
    console.log(`      ${SEED_ADMIN_EMAIL}`);
    console.log("      كلمة مروره مكتوبة بالنص في prisma/seed.ts على GitHub.");
    console.log("      غيّرها أو احذف الحساب:");
    console.log(`      pnpm exec tsx scripts/create-admin.ts ${SEED_ADMIN_EMAIL}`);
  }

  console.log("");
  if (!check.ok) {
    console.error("  ❌ التحقق فشل — الحساب مش جاهز. راجع الرسائل فوق.");
    process.exit(1);
  }
  console.log("  ✅ تم التحقق: الحساب يقدر يفتح كل صفحات الإدارة.");
  console.log("     غيّر كلمة المرور بعد أول دخول من /ar/dashboard/settings");
  console.log("");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
