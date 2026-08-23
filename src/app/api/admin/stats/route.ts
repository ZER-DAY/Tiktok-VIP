import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth";
import { hasPermission } from "@/lib/auth";
import { getPlatformStats } from "@/modules/admin/stats";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const canAccess = await hasPermission(user.id, "admin.view_audit_logs");
    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: { message: "Forbidden" } },
        { status: 403 }
      );
    }

    const stats = await getPlatformStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error("[ADMIN STATS]", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch stats" } },
      { status: 500 }
    );
  }
}
