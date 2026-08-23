import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth";
import { assignApplication } from "@/modules/agency-crm";
import { hasPermission } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const canManage = await hasPermission(user.id, "crm.manage_assignees");
    if (!canManage) {
      return NextResponse.json(
        { success: false, error: { message: "Forbidden" } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { assigneeUserId } = body;

    const application = await assignApplication(id, assigneeUserId || null);
    return NextResponse.json({ success: true, data: application });
  } catch (error) {
    console.error("[AGENCY ASSIGNEE PATCH]", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to assign" } },
      { status: 500 }
    );
  }
}
