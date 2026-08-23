import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth";
import { addApplicationNote } from "@/modules/agency-crm";
import { hasPermission } from "@/lib/auth";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { note } = body;

    if (!note) {
      return NextResponse.json(
        { success: false, error: { message: "Note is required" } },
        { status: 400 }
      );
    }

    const newNote = await addApplicationNote(id, user.id, note);
    return NextResponse.json({ success: true, data: newNote }, { status: 201 });
  } catch (error) {
    console.error("[AGENCY NOTE POST]", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to add note" } },
      { status: 500 }
    );
  }
}
