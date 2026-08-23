import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth";
import { getApplicationById, logContactInfoView } from "@/modules/agency-crm";
import { hasPermission } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const canView = await hasPermission(user.id, "crm.view_applicants");
    if (!canView) {
      return NextResponse.json(
        { success: false, error: { message: "Forbidden" } },
        { status: 403 }
      );
    }

    const { id } = await params;
    const application = await getApplicationById(id);

    if (!application) {
      return NextResponse.json(
        { success: false, error: { message: "Application not found" } },
        { status: 404 }
      );
    }

    // Log contact info view if user has permission
    const canViewContact = await hasPermission(user.id, "crm.view_contact_info");
    if (canViewContact) {
      await logContactInfoView(user.id, application.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...application,
        // Only include contact info if user has permission
        phone: canViewContact ? application.phone : null,
        telegram: canViewContact ? application.telegram : null,
        email: canViewContact ? application.email : null,
      },
    });
  } catch (error) {
    console.error("[AGENCY APPLICATION GET]", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch application" } },
      { status: 500 }
    );
  }
}
