import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserAnalysisQuota } from "@/modules/billing/analysis-quota";
import { z } from "zod";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const canAccess = await hasPermission(user.id, "admin.manage_users");
    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: { message: "Forbidden" } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 20;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
          deletedAt: null,
        }
      : { deletedAt: null };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          preferredLocale: true,
          createdAt: true,
          analysisBonus: true,
          plan: { select: { name: true } },
          roles: { include: { role: true } },
          _count: { select: { ownedAccounts: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users: await Promise.all(
          users.map(async (user) => ({
            ...user,
            quota: await getUserAnalysisQuota(user.id),
          }))
        ),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("[ADMIN USERS GET]", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch users" } },
      { status: 500 }
    );
  }
}

const quotaSchema = z
  .object({
    userId: z.string().uuid(),
    analysisBonus: z.number().int().min(0).max(100000),
  })
  .strict();

export async function PATCH(request: Request) {
  try {
    const actor = await getCurrentUser();
    if (!actor) return NextResponse.json({ success: false }, { status: 401 });
    if (!(await hasPermission(actor.id, "admin.manage_users"))) {
      return NextResponse.json({ success: false }, { status: 403 });
    }
    const parsed = quotaSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false }, { status: 400 });
    const { userId, analysisBonus } = parsed.data;
    const updated = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findFirst({
        where: { id: userId, deletedAt: null },
        select: { analysisBonus: true },
      });
      if (!target) return false;
      await tx.user.update({ where: { id: userId }, data: { analysisBonus } });
      await tx.auditLog.create({
        data: {
          actorUserId: actor.id,
          action: "user.analysis_bonus_updated",
          entityType: "User",
          entityId: userId,
          metadata: { previousBonus: target.analysisBonus, analysisBonus },
        },
      });
      return true;
    });
    if (!updated) return NextResponse.json({ success: false }, { status: 404 });
    return NextResponse.json({
      success: true,
      data: { quota: await getUserAnalysisQuota(userId) },
    });
  } catch (error) {
    console.error("[ADMIN USERS PATCH]", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
