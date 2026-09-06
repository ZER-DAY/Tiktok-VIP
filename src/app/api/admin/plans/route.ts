import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updatePlansSchema = z.object({
  plans: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(50),
      priceCents: z.number().int().min(0),
      reportsPerMonth: z.number().int().min(0).nullable(),
      isActive: z.boolean(),
    })
  ),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const canAccess = await hasPermission(user.id, "admin.manage_plans");
    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: { message: "Forbidden" } },
        { status: 403 }
      );
    }

    const plans = await prisma.plan.findMany({
      orderBy: { priceCents: "asc" },
    });

    return NextResponse.json({ success: true, data: plans });
  } catch (error) {
    console.error("[ADMIN PLANS GET]", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch plans" } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const canAccess = await hasPermission(user.id, "admin.manage_plans");
    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: { message: "Forbidden" } },
        { status: 403 }
      );
    }

    const parsed = updatePlansSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid plan data" } },
        { status: 400 }
      );
    }

    for (const plan of parsed.data.plans) {
      await prisma.plan.update({
        where: { id: plan.id },
        data: {
          name: plan.name,
          priceCents: plan.priceCents,
          reportsPerMonth: plan.reportsPerMonth,
          isActive: plan.isActive,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN PLANS PATCH]", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to update plans" } },
      { status: 500 }
    );
  }
}
