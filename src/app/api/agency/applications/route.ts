import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth";
import { submitApplication, listApplications } from "@/modules/agency-crm";
import { hasPermission } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    const body = await request.json();
    const { accountId, fullName, phone, telegram, email } = body;

    if (!accountId || !fullName || !phone || !telegram || !email) {
      return NextResponse.json(
        { success: false, error: { message: "جميع الحقول مطلوبة" } },
        { status: 400 }
      );
    }

    const application = await submitApplication({
      accountId,
      fullName,
      phone,
      telegram,
      email,
      applicantUserId: user?.id,
    });

    return NextResponse.json({ success: true, data: application }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit application";
    if (message === "ALREADY_APPLIED") {
      return NextResponse.json(
        { success: false, error: { message: "لقد تقدمت بالفعل بطلب لهذا الحساب" } },
        { status: 409 }
      );
    }
    console.error("[AGENCY APPLICATION POST]", error);
    return NextResponse.json(
      { success: false, error: { message: "فشل تقديم الطلب" } },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get("status") as
        "new" | "reviewed" | "contacted" | "joined" | "rejected" | undefined,
      minScore: searchParams.get("minScore") ? parseInt(searchParams.get("minScore")!) : undefined,
      maxScore: searchParams.get("maxScore") ? parseInt(searchParams.get("maxScore")!) : undefined,
      minFollowers: searchParams.get("minFollowers")
        ? parseInt(searchParams.get("minFollowers")!)
        : undefined,
      maxFollowers: searchParams.get("maxFollowers")
        ? parseInt(searchParams.get("maxFollowers")!)
        : undefined,
      country: searchParams.get("country") || undefined,
      language: searchParams.get("language") || undefined,
      assigneeUserId: searchParams.get("assigneeUserId") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : 1,
      pageSize: searchParams.get("pageSize") ? parseInt(searchParams.get("pageSize")!) : 20,
      sortBy: (searchParams.get("sortBy") as "createdAt" | "score") || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    const result = await listApplications(filters);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("[AGENCY APPLICATIONS GET]", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to fetch applications" } },
      { status: 500 }
    );
  }
}
