import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth";
import { linkGuestReportToUser } from "@/modules/auth/guest-flow";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { reportId } = body;

    if (!reportId) {
      return NextResponse.json(
        { success: false, error: { message: "Report ID is required" } },
        { status: 400 }
      );
    }

    const result = await linkGuestReportToUser(user.id, reportId);

    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json(
        { success: false, error: { message: result.message } },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[LINK GUEST]", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to link guest report" } },
      { status: 500 }
    );
  }
}
