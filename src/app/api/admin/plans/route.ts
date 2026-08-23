import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth";
import { hasPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const body = await request.json();
    const { plans } = body;

    for (const plan of plans) {
      await prisma.plan.update({
        where: { id: plan.id },
        data: {
          name: plan.name,
          priceCents: plan.priceCents,
          reportsPerDay: plan.reportsPerDay,
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
