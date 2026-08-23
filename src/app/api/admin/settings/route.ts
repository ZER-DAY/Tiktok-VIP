import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth";
import { hasPermission } from "@/lib/auth";
import { getSettings, setSettings } from "@/modules/admin/settings";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const canAccess = await hasPermission(user.id, "admin.manage_settings");
    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: { message: "Forbidden" } },
        { status: 403 }
      );
    }

    const settings = await getSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    console.error("[ADMIN SETTINGS GET]", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch settings" } },
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

    const canAccess = await hasPermission(user.id, "admin.manage_settings");
    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: { message: "Forbidden" } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { settings } = body;

    await setSettings(settings);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ADMIN SETTINGS PATCH]", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to update settings" } },
      { status: 500 }
    );
  }
}
