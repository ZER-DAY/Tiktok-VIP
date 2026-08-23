import { NextResponse } from "next/server";
import { getAgencyEligibilityThreshold, getHighPriorityThreshold } from "@/modules/admin/settings";

export async function GET() {
  try {
    const threshold = await getAgencyEligibilityThreshold();
    const highPriorityThreshold = await getHighPriorityThreshold();

    return NextResponse.json({
      success: true,
      data: {
        agencyEligibilityThreshold: threshold,
        highPriorityThreshold,
      },
    });
  } catch (error) {
    console.error("[SETTINGS GET]", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch settings" } },
      { status: 500 }
    );
  }
}
