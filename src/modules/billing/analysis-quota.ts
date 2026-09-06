import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const GUEST_ANALYSIS_COOKIE = "ti_guest_analysis";

const FREE_PLAN_NAME = "free";
const FREE_TRIAL_LIMIT = 1;

const DEFAULT_MONTHLY_LIMITS: Record<string, number | null> = {
  free: FREE_TRIAL_LIMIT,
  individual: 100,
  pro: 100,
  saver: 200,
  agency: null,
};

type PlanEntitlement = {
  name: string;
  reportsPerMonth: number | null;
};

export type AnalysisQuotaSummary = {
  planName: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  periodKey: string;
  isTrial: boolean;
  isUnlimited: boolean;
};

export type AnalysisQuotaReservation = AnalysisQuotaSummary & {
  allowed: boolean;
  isNewReservation: boolean;
  requestId: string;
  userId: string | null;
  guestToken: string | null;
  guestTokenHash: string | null;
  subjectKey: string;
  reason?: "LIMIT_REACHED" | "REQUEST_ID_CONFLICT";
};

function hashGuestToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getMonthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

export function resolvePlanLimit(planName: string, configuredLimit: number | null) {
  if (configuredLimit !== null) return configuredLimit;
  return DEFAULT_MONTHLY_LIMITS[planName] ?? null;
}

function getPeriodKey(planName: string, date = new Date()) {
  return planName === FREE_PLAN_NAME ? "lifetime" : getMonthKey(date);
}

async function getUserPlan(userId: string): Promise<PlanEntitlement> {
  const now = new Date();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: {
        select: { name: true, reportsPerMonth: true, isActive: true },
      },
      subscriptions: {
        where: {
          status: "active",
          OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: now } }],
        },
        orderBy: { startedAt: "desc" },
        take: 1,
        select: {
          plan: {
            select: { name: true, reportsPerMonth: true, isActive: true },
          },
        },
      },
    },
  });

  const subscribedPlan = user?.subscriptions[0]?.plan;
  const selectedPlan = subscribedPlan?.isActive ? subscribedPlan : user?.plan;

  if (!selectedPlan?.isActive) {
    return { name: FREE_PLAN_NAME, reportsPerMonth: FREE_TRIAL_LIMIT };
  }

  return {
    name: selectedPlan.name,
    reportsPerMonth: resolvePlanLimit(selectedPlan.name, selectedPlan.reportsPerMonth),
  };
}

async function readCounter(subjectKey: string, periodKey: string) {
  const counter = await prisma.analysisUsageCounter.findUnique({
    where: { subjectKey_periodKey: { subjectKey, periodKey } },
    select: { used: true },
  });
  return counter?.used ?? 0;
}

function toSummary(plan: PlanEntitlement, periodKey: string, used: number): AnalysisQuotaSummary {
  const limit = resolvePlanLimit(plan.name, plan.reportsPerMonth);
  return {
    planName: plan.name,
    used,
    limit,
    remaining: limit === null ? null : Math.max(limit - used, 0),
    periodKey,
    isTrial: plan.name === FREE_PLAN_NAME,
    isUnlimited: limit === null,
  };
}

export async function getUserAnalysisQuota(userId: string): Promise<AnalysisQuotaSummary> {
  const plan = await getUserPlan(userId);
  const periodKey = getPeriodKey(plan.name);
  const used = await readCounter(`user:${userId}`, periodKey);
  return toSummary(plan, periodKey, used);
}

async function reserveInTransaction(args: {
  requestId: string;
  userId: string | null;
  guestTokenHash: string | null;
  subjectKey: string;
  periodKey: string;
  plan: PlanEntitlement;
  provider: string;
  username: string;
}) {
  return prisma.$transaction(
    async (tx) => {
      const existing = await tx.analysisUsage.findUnique({
        where: { requestId: args.requestId },
      });

      if (existing) {
        if (
          existing.subjectKey !== args.subjectKey ||
          existing.provider !== args.provider ||
          existing.externalUsername !== args.username
        ) {
          return { allowed: false as const, conflict: true, isNewReservation: false, used: 0 };
        }

        const current = await tx.analysisUsageCounter.findUnique({
          where: {
            subjectKey_periodKey: {
              subjectKey: existing.subjectKey,
              periodKey: existing.periodKey,
            },
          },
          select: { used: true },
        });
        return {
          allowed: true as const,
          conflict: false,
          isNewReservation: false,
          used: current?.used ?? 0,
        };
      }

      const limit = resolvePlanLimit(args.plan.name, args.plan.reportsPerMonth);
      if (limit === 0) {
        const current = await tx.analysisUsageCounter.findUnique({
          where: {
            subjectKey_periodKey: {
              subjectKey: args.subjectKey,
              periodKey: args.periodKey,
            },
          },
          select: { used: true },
        });
        return {
          allowed: false as const,
          conflict: false,
          isNewReservation: false,
          used: current?.used ?? 0,
        };
      }

      const rows =
        limit === null
          ? await tx.$queryRaw<Array<{ used: number }>>`
              INSERT INTO "AnalysisUsageCounter" ("subjectKey", "periodKey", "used", "createdAt", "updatedAt")
              VALUES (${args.subjectKey}, ${args.periodKey}, 1, NOW(), NOW())
              ON CONFLICT ("subjectKey", "periodKey")
              DO UPDATE SET "used" = "AnalysisUsageCounter"."used" + 1, "updatedAt" = NOW()
              RETURNING "used"
            `
          : await tx.$queryRaw<Array<{ used: number }>>`
              INSERT INTO "AnalysisUsageCounter" ("subjectKey", "periodKey", "used", "createdAt", "updatedAt")
              VALUES (${args.subjectKey}, ${args.periodKey}, 1, NOW(), NOW())
              ON CONFLICT ("subjectKey", "periodKey")
              DO UPDATE SET "used" = "AnalysisUsageCounter"."used" + 1, "updatedAt" = NOW()
              WHERE "AnalysisUsageCounter"."used" < ${limit}
              RETURNING "used"
            `;

      if (rows.length === 0) {
        const current = await tx.analysisUsageCounter.findUnique({
          where: {
            subjectKey_periodKey: { subjectKey: args.subjectKey, periodKey: args.periodKey },
          },
          select: { used: true },
        });
        return {
          allowed: false as const,
          conflict: false,
          isNewReservation: false,
          used: current?.used ?? limit ?? 0,
        };
      }

      await tx.analysisUsage.create({
        data: {
          requestId: args.requestId,
          userId: args.userId,
          guestTokenHash: args.guestTokenHash,
          subjectKey: args.subjectKey,
          periodKey: args.periodKey,
          planName: args.plan.name,
          provider: args.provider,
          externalUsername: args.username,
        },
      });

      return {
        allowed: true as const,
        conflict: false,
        isNewReservation: true,
        used: rows[0].used,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export async function reserveAnalysisQuota(args: {
  request: NextRequest;
  requestId: string;
  provider: string;
  username: string;
}): Promise<AnalysisQuotaReservation> {
  const sessionUser = await getSessionUser(args.request);
  const cookieToken = args.request.cookies.get(GUEST_ANALYSIS_COOKIE)?.value;
  // Reusing the request UUID for the first cookie keeps React development retries idempotent.
  const guestToken = cookieToken || args.requestId;
  const guestTokenHash = hashGuestToken(guestToken);
  const userId = sessionUser?.id ?? null;
  const plan = userId
    ? await getUserPlan(userId)
    : { name: FREE_PLAN_NAME, reportsPerMonth: FREE_TRIAL_LIMIT };
  const subjectKey = userId ? `user:${userId}` : `guest:${guestTokenHash}`;
  const periodKey = getPeriodKey(plan.name);

  // A guest trial already used in this browser remains consumed after sign-up.
  if (userId && plan.name === FREE_PLAN_NAME && cookieToken) {
    const guestUsed = await readCounter(`guest:${guestTokenHash}`, "lifetime");
    if (guestUsed >= FREE_TRIAL_LIMIT) {
      return {
        ...toSummary(plan, periodKey, FREE_TRIAL_LIMIT),
        allowed: false,
        isNewReservation: false,
        requestId: args.requestId,
        userId,
        guestToken,
        guestTokenHash,
        subjectKey,
        reason: "LIMIT_REACHED",
      };
    }
  }

  let result: Awaited<ReturnType<typeof reserveInTransaction>> | undefined;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      result = await reserveInTransaction({
        requestId: args.requestId,
        userId,
        guestTokenHash: userId ? null : guestTokenHash,
        subjectKey,
        periodKey,
        plan,
        provider: args.provider,
        username: args.username,
      });
      break;
    } catch (error) {
      const retryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2034" || error.code === "P2002");
      if (!retryable || attempt === 2) throw error;
    }
  }

  if (!result) throw new Error("Unable to reserve analysis quota");

  return {
    ...toSummary(plan, periodKey, result.used),
    allowed: result.allowed,
    isNewReservation: result.isNewReservation,
    requestId: args.requestId,
    userId,
    guestToken,
    guestTokenHash,
    subjectKey,
    reason: result.conflict ? "REQUEST_ID_CONFLICT" : result.allowed ? undefined : "LIMIT_REACHED",
  };
}

export async function releaseAnalysisQuota(requestId: string) {
  await prisma.$transaction(async (tx) => {
    const usage = await tx.analysisUsage.findUnique({ where: { requestId } });
    if (!usage) return;

    await tx.analysisUsage.delete({ where: { requestId } });
    await tx.analysisUsageCounter.updateMany({
      where: {
        subjectKey: usage.subjectKey,
        periodKey: usage.periodKey,
        used: { gt: 0 },
      },
      data: { used: { decrement: 1 } },
    });
  });
}

export function attachGuestAnalysisCookie(
  response: NextResponse,
  reservation: AnalysisQuotaReservation
) {
  if (!reservation.guestToken) return response;

  response.cookies.set(GUEST_ANALYSIS_COOKIE, reservation.guestToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}
