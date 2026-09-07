import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

const globalForAuth = globalThis as unknown as {
  auth: ReturnType<typeof createAuth> | undefined;
};

type UserCreateInput = {
  planId?: string | null;
  [key: string]: unknown;
};

export async function assignFreePlanOnCreate(user: UserCreateInput) {
  // planId is server-only (input:false below), so a public signup or update can
  // never set it. New users always get the free plan regardless of any value
  // found or provided.
  const freePlan = await prisma.plan.findUnique({
    where: { name: "free" },
    select: { id: true },
  });
  if (!freePlan) {
    throw new Error("FREE_PLAN_NOT_CONFIGURED");
  }

  return {
    data: {
      ...user,
      planId: freePlan.id,
    },
  };
}

export const USER_ADDITIONAL_FIELDS = {
  // Server-only: never accepted from public input, never exposed.
  passwordHash: {
    type: "string" as const,
    required: false,
    input: false,
    returned: false,
  },
  emailVerifiedAt: {
    type: "date" as const,
    required: false,
    input: false,
  },
  preferredLocale: {
    type: "string" as const,
    required: false,
    defaultValue: "ar",
  },
  planId: {
    type: "string" as const,
    required: false,
    input: false,
  },
};

function createAuth() {
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL,
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, token }: { user: { email: string }; token: string }) => {
        console.log(`[AUTH] Password reset for ${user.email}: ${token}`);
      },
      sendVerificationEmail: async ({
        user,
        token,
      }: {
        user: { email: string };
        token: string;
      }) => {
        console.log(`[AUTH] Verification for ${user.email}: ${token}`);
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // 1 day
    },
    advanced: {
      database: {
        generateId: () => randomUUID(),
      },
    },
    databaseHooks: {
      user: {
        create: {
          before: async (user) => assignFreePlanOnCreate(user as UserCreateInput),
        },
      },
    },
    user: {
      fields: {
        image: "avatarUrl",
      },
      additionalFields: USER_ADDITIONAL_FIELDS,
    },
  });
}

function getAuth() {
  if (!globalForAuth.auth) {
    globalForAuth.auth = createAuth();
  }
  return globalForAuth.auth;
}

export { getAuth as auth };

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"];

export async function getSessionUser(request: Request) {
  const authInstance = getAuth();
  const session = await authInstance.api.getSession({
    headers: request.headers,
  });
  return session?.user ?? null;
}

export async function requireAuth(request: Request) {
  const user = await getSessionUser(request);
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
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
