/**
 * Promote an already-registered user to platform_admin.
 *
 * Register normally on the site first (so Better Auth stores your own
 * password hash), then run this once against the production database:
 *
 *   DATABASE_URL="postgresql://..." pnpm exec tsx scripts/grant-admin.ts you@example.com
 *
 * No password is read, written, or printed by this script.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: pnpm exec tsx scripts/grant-admin.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });
  if (!user) {
    console.error(`No user with email ${email}. Register on the site first, then re-run.`);
    process.exit(1);
  }

  const role = await prisma.role.findUnique({ where: { name: "platform_admin" } });
  if (!role) {
    console.error("Role platform_admin is missing. Run the seed first: pnpm db:seed");
    process.exit(1);
  }

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  });

  const permissions = await prisma.rolePermission.count({ where: { roleId: role.id } });
  console.log(`Granted platform_admin to ${user.email} (${permissions} permissions).`);
  console.log("Sign out and back in, then open /ar/admin/stats");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
