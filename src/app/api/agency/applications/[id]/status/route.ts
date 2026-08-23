import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth";
import { changeApplicationStatus } from "@/modules/agency-crm";
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

    const canEdit = await hasPermission(user.id, "crm.edit_applicant_status");
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: { message: "Forbidden" } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, note } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: { message: "Status is required" } },
        { status: 400 }
      );
    }

    const application = await changeApplicationStatus(id, status, user.id, note);
    return NextResponse.json({ success: true, data: application });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update status";
    if (message === "INVALID_STATUS_TRANSITION") {
      return NextResponse.json(
        { success: false, error: { message: "انتقال الحالة غير صالح" } },
        { status: 400 }
      );
    }
    console.error("[AGENCY STATUS PATCH]", error);
    return NextResponse.json(
      { success: false, error: { message: "فشل تحديث الحالة" } },
      { status: 500 }
    );
  }
}
