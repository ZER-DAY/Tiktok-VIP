import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt, randomUUID } from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = randomBytes(16).toString("hex");
    const normalized = Buffer.from(password.normalize("NFKC"), "utf-8");
    scrypt(
      normalized,
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

async function main() {
  console.log("Seeding database...");

  // ─── Roles ───────────────────────────────────────────────

  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: "creator" },
      update: {},
      create: { name: "creator", description: "مستخدم عادي، دور افتراضي لأي تسجيل جديد" },
    }),
    prisma.role.upsert({
      where: { name: "agency_staff" },
      update: {},
      create: { name: "agency_staff", description: "عضو فريق توظيف بالوكالة، وصول محدود لـ CRM" },
    }),
    prisma.role.upsert({
      where: { name: "agency_admin" },
      update: {},
      create: { name: "agency_admin", description: "مدير وكالة، وصول كامل لـ CRM وإعداداته" },
    }),
    prisma.role.upsert({
      where: { name: "platform_admin" },
      update: {},
      create: { name: "platform_admin", description: "مدير المنصة، وصول كامل لكل شيء" },
    }),
  ]);

  const [, , , platformAdmin] = roles;
  console.log("Roles created:", roles.map((r) => r.name).join(", "));

  // ─── Permissions ─────────────────────────────────────────

  const permissions = await Promise.all([
    prisma.permission.upsert({
      where: { key: "report.view_own" },
      update: {},
      create: { key: "report.view_own", description: "عرض التقارير الخاصة بالمستخدم" },
    }),
    prisma.permission.upsert({
      where: { key: "report.view_any" },
      update: {},
      create: { key: "report.view_any", description: "عرض أي تقرير في المنصة" },
    }),
    prisma.permission.upsert({
      where: { key: "crm.view_applicants" },
      update: {},
      create: { key: "crm.view_applicants", description: "عرض قائمة المتقدمين للوكالة" },
    }),
    prisma.permission.upsert({
      where: { key: "crm.edit_applicant_status" },
      update: {},
      create: { key: "crm.edit_applicant_status", description: "تعديل حالة طلب متقدم" },
    }),
    prisma.permission.upsert({
      where: { key: "crm.view_contact_info" },
      update: {},
      create: { key: "crm.view_contact_info", description: "عرض بيانات التواصل الحساسة للمتقدمين" },
    }),
    prisma.permission.upsert({
      where: { key: "crm.manage_assignees" },
      update: {},
      create: { key: "crm.manage_assignees", description: "تعيين وتعديل المسؤولين عن المتقدمين" },
    }),
    prisma.permission.upsert({
      where: { key: "admin.manage_users" },
      update: {},
      create: { key: "admin.manage_users", description: "إدارة المستخدمين" },
    }),
    prisma.permission.upsert({
      where: { key: "admin.manage_plans" },
      update: {},
      create: { key: "admin.manage_plans", description: "إدارة خطط الاشتراك" },
    }),
    prisma.permission.upsert({
      where: { key: "admin.manage_settings" },
      update: {},
      create: { key: "admin.manage_settings", description: "إدارة إعدادات النظام" },
    }),
    prisma.permission.upsert({
      where: { key: "admin.view_audit_logs" },
      update: {},
      create: { key: "admin.view_audit_logs", description: "عرض سجل العمليات" },
    }),
  ]);

  const permKeys = permissions.map((p) => p.key);
  console.log("Permissions created:", permKeys.length);

  // ─── Role-Permission mapping ─────────────────────────────

  const rolePermissions: Record<string, string[]> = {
    creator: ["report.view_own"],
    agency_staff: ["report.view_own", "crm.view_applicants", "crm.edit_applicant_status"],
    agency_admin: [
      "report.view_own",
      "report.view_any",
      "crm.view_applicants",
      "crm.edit_applicant_status",
      "crm.view_contact_info",
      "crm.manage_assignees",
    ],
    platform_admin: permKeys,
  };

  for (const [roleName, pKeys] of Object.entries(rolePermissions)) {
    const role = roles.find((r) => r.name === roleName)!;
    for (const pKey of pKeys) {
      const perm = permissions.find((p) => p.key === pKey)!;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
  }
  console.log("Role-Permission mappings created");

  // ─── Plans ───────────────────────────────────────────────

  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { name: "free" },
      update: {},
      create: {
        name: "free",
        priceCents: 0,
        billingInterval: null,
        reportsPerDay: 3,
        features: { pdfExport: false, competitorComparison: false, historicalTracking: false },
      },
    }),
    prisma.plan.upsert({
      where: { name: "pro" },
      update: {},
      create: {
        name: "pro",
        priceCents: 1900,
        billingInterval: "monthly",
        reportsPerDay: null,
        features: { pdfExport: true, competitorComparison: true, historicalTracking: true },
      },
    }),
    prisma.plan.upsert({
      where: { name: "agency" },
      update: {},
      create: {
        name: "agency",
        priceCents: 4900,
        billingInterval: "monthly",
        reportsPerDay: null,
        features: {
          pdfExport: true,
          competitorComparison: true,
          historicalTracking: true,
          bulkReports: true,
          crmAccess: true,
        },
      },
    }),
  ]);

  // freePlan is plans[0] — used implicitly via plans array
  console.log("Plans created:", plans.map((p) => p.name).join(", "));

  // ─── Providers ───────────────────────────────────────────

  const providers = await Promise.all([
    prisma.provider.upsert({
      where: { key: "tiktok" },
      update: { isActive: true },
      create: { key: "tiktok", displayName: "TikTok", isActive: true },
    }),
    prisma.provider.upsert({
      where: { key: "instagram" },
      update: {},
      create: { key: "instagram", displayName: "Instagram", isActive: false },
    }),
    prisma.provider.upsert({
      where: { key: "youtube" },
      update: {},
      create: { key: "youtube", displayName: "YouTube", isActive: false },
    }),
    prisma.provider.upsert({
      where: { key: "kick" },
      update: {},
      create: { key: "kick", displayName: "Kick", isActive: false },
    }),
    prisma.provider.upsert({
      where: { key: "twitch" },
      update: {},
      create: { key: "twitch", displayName: "Twitch", isActive: false },
    }),
  ]);

  const [tiktokProvider] = providers;
  console.log("Providers created:", providers.map((p) => p.key).join(", "));

  // ─── Admin User ──────────────────────────────────────────

  const adminEmail = "admin@tiktok-intelligence.test";
  const adminPassword = "Admin@12345";

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "مدير المنصة",
      passwordHash: await hashPassword(adminPassword),
      preferredLocale: "ar",
      planId: plans[2].id, // agency plan
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: platformAdmin.id } },
    update: {},
    create: { userId: adminUser.id, roleId: platformAdmin.id },
  });

  // Create credential account for Better Auth login
  const adminHash = await hashPassword(adminPassword);
  const existingAccount = await prisma.account.findFirst({
    where: { userId: adminUser.id, providerId: "credential" },
  });
  if (!existingAccount) {
    await prisma.account.create({
      data: {
        id: randomUUID(),
        userId: adminUser.id,
        accountId: adminUser.id,
        providerId: "credential",
        password: adminHash,
      },
    });
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("Admin User Credentials:");
  console.log(`  Email:    ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log("═══════════════════════════════════════════\n");

  // ─── Dummy AnalyzedAccounts with Snapshots & Reports ─────

  const dummyAccounts = [
    {
      username: "ahmad_creative",
      followers: 125000,
      following: 340,
      totalLikes: BigInt(2800000),
      videoCount: 186,
      avgViews: 45000,
      avgLikes: 3200,
      avgComments: 180,
      avgShares: 95,
      isVerified: false,
      accountType: "personal" as const,
      countryGuess: "Saudi Arabia",
      countryGuessConfidence: 0.72,
      bioLanguageGuess: "ar",
      accountCreatedAtGuess: new Date("2021-03-15"),
      scores: {
        accountStrength: 78,
        contentQuality: 72,
        engagementQuality: 85,
        postingConsistency: 68,
        explorePotential: 62,
        livePotential: 55,
        professionalism: 70,
      },
    },
    {
      username: "nour_fitness",
      followers: 52000,
      following: 210,
      totalLikes: BigInt(980000),
      videoCount: 94,
      avgViews: 18000,
      avgLikes: 1400,
      avgComments: 85,
      avgShares: 42,
      isVerified: true,
      accountType: "business" as const,
      countryGuess: "Egypt",
      countryGuessConfidence: 0.65,
      bioLanguageGuess: "ar",
      accountCreatedAtGuess: new Date("2022-07-20"),
      scores: {
        accountStrength: 65,
        contentQuality: 68,
        engagementQuality: 72,
        postingConsistency: 58,
        explorePotential: 55,
        livePotential: 70,
        professionalism: 75,
      },
    },
    {
      username: "tech_gamer_x",
      followers: 340000,
      following: 520,
      totalLikes: BigInt(8500000),
      videoCount: 312,
      avgViews: 120000,
      avgLikes: 8500,
      avgComments: 420,
      avgShares: 310,
      isVerified: true,
      accountType: "personal" as const,
      countryGuess: null,
      countryGuessConfidence: null,
      bioLanguageGuess: "en",
      accountCreatedAtGuess: null,
      scores: {
        accountStrength: 88,
        contentQuality: 82,
        engagementQuality: 78,
        postingConsistency: 92,
        explorePotential: 75,
        livePotential: 85,
        professionalism: 80,
      },
    },
  ];

  for (const acct of dummyAccounts) {
    const account = await prisma.analyzedAccount.upsert({
      where: {
        providerId_externalUsername: {
          providerId: tiktokProvider.id,
          externalUsername: acct.username,
        },
      },
      update: {},
      create: {
        providerId: tiktokProvider.id,
        externalUsername: acct.username,
        ownerId: adminUser.id,
        trackedByUserId: adminUser.id,
      },
    });

    const snapshot = await prisma.accountSnapshot.create({
      data: {
        accountId: account.id,
        followers: acct.followers,
        following: acct.following,
        totalLikes: acct.totalLikes,
        videoCount: acct.videoCount,
        avgViews: acct.avgViews,
        avgLikes: acct.avgLikes,
        avgComments: acct.avgComments,
        avgShares: acct.avgShares,
        isVerified: acct.isVerified,
        accountType: acct.accountType,
        countryGuess: acct.countryGuess,
        countryGuessConfidence: acct.countryGuessConfidence,
        bioLanguageGuess: acct.bioLanguageGuess,
        accountCreatedAtGuess: acct.accountCreatedAtGuess,
        rawPayload: {
          username: acct.username,
          followers: acct.followers,
          following: acct.following,
          totalLikes: Number(acct.totalLikes),
          videoCount: acct.videoCount,
          isVerified: acct.isVerified,
          bio: `Dummy profile for ${acct.username}`,
        },
      },
    });

    await prisma.analysisReport.create({
      data: {
        snapshotId: snapshot.id,
        accountStrengthScore: acct.scores.accountStrength,
        contentQualityScore: acct.scores.contentQuality,
        engagementQualityScore: acct.scores.engagementQuality,
        postingConsistencyScore: acct.scores.postingConsistency,
        explorePotentialPercent: acct.scores.explorePotential,
        livePotentialScore: acct.scores.livePotential,
        professionalismScore: acct.scores.professionalism,
        scoreBreakdown: {
          engagementRate:
            acct.avgLikes && acct.avgViews
              ? (
                  ((acct.avgLikes + (acct.avgComments ?? 0) + (acct.avgShares ?? 0)) /
                    acct.avgViews) *
                  100
                ).toFixed(1) + "%"
              : "N/A",
          viewsToFollowersRatio:
            acct.followers > 0 ? ((acct.avgViews / acct.followers) * 100).toFixed(1) + "%" : "N/A",
          accountSizeCategory:
            acct.followers < 10000
              ? "micro"
              : acct.followers < 100000
                ? "mid"
                : acct.followers < 1000000
                  ? "macro"
                  : "mega",
        },
        insights: {
          create: [
            {
              type: "strength",
              title: "معدل تفاعل مرتفع",
              description: "معدل التفاعل يتجاوز المعدل المرجعي لحسابات بنفس الحجم",
              order: 1,
            },
            {
              type: "strength",
              title: "انتظام النشر",
              description: "يُنشر بانتظام مما يحافظ على تفاعل الجمهور",
              order: 2,
            },
            {
              type: "weakness",
              title: "البث المباشر قليل",
              description: "لا يستخدم البث المباشر بشكل كافٍ لتعزيز التفاعل",
              order: 3,
            },
            {
              type: "recommendation",
              title: "زيادةfrequency البث المباشر",
              description: "البث المباشر يزيد التفاعل المباشر ويُحسّن فرص الوصول لـ For You",
              order: 4,
            },
          ],
        },
      },
    });

    console.log(`Account created: @${acct.username} with snapshot & report`);
  }

  console.log("\nSeed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
