import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function getCurrentSession() {
  try {
    const headersList = await headers();
    const session = await auth().api.getSession({
      headers: headersList,
    });
    return session;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getCurrentSession();
  if (!session?.user) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      plan: true,
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  return user;
}

export async function hasPermission(userId: string, permissionKey: string): Promise<boolean> {
  const userWithRoles = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!userWithRoles) return false;

  return userWithRoles.roles.some((ur) =>
    ur.role.permissions.some((rp) => rp.permission.key === permissionKey)
  );
}

export async function requirePermission(permissionKey: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const hasPerm = await hasPermission(user.id, permissionKey);
  if (!hasPerm) {
    throw new Error("FORBIDDEN");
  }

  return user;
}
