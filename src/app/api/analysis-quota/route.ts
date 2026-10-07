import { NextResponse, type NextRequest } from "next/server";
import { getRequestAnalysisQuota } from "@/modules/billing/analysis-quota";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      { success: true, data: await getRequestAnalysisQuota(request) },
      {
        headers: { "Cache-Control": "private, no-store" },
      }
    );
  } catch {
    return NextResponse.json({ success: false }, { status: 503 });
  }
}
