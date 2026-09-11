import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/modules/auth";
import { hasPermission } from "@/lib/auth";

// Lightweight counter for the admin sidebar badge. Deliberately separate from
// GET /api/admin/payments, which pulls 100 full order rows.
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED" } },
        { status: 401 }
      );
    }
    if (!(await hasPermission(user.id, "admin.manage_plans"))) {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN" } }, { status: 403 });
    }

    const pending = await prisma.paymentOrder.count({ where: { status: "manual_review" } });

    return NextResponse.json({ success: true, data: { pending } });
  } catch (error) {
    console.error("[ADMIN PAYMENTS PENDING COUNT]", error);
    return NextResponse.json(
      { success: false, error: { code: "PENDING_COUNT_FAILED" } },
      { status: 500 }
    );
  }
}
