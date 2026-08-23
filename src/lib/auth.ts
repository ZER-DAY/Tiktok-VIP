import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

const globalForAuth = globalThis as unknown as {
  auth: ReturnType<typeof createAuth> | undefined;
};

function createAuth() {
  return betterAuth({
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
    user: {
      additionalFields: {
        passwordHash: {
          type: "string",
          required: false,
        },
        name: {
          type: "string",
          required: false,
        },
        avatarUrl: {
          type: "string",
          required: false,
        },
        emailVerifiedAt: {
          type: "date",
          required: false,
        },
        preferredLocale: {
          type: "string",
          required: false,
          defaultValue: "ar",
        },
        planId: {
          type: "string",
          required: false,
        },
      },
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
