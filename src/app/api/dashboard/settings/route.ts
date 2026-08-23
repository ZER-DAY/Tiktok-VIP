import { NextResponse } from "next/server";
import { getCurrentUser } from "@/modules/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          preferredLocale: user.preferredLocale,
          plan: user.plan,
        },
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

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, preferredLocale } = body;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name && { name }),
        ...(preferredLocale && { preferredLocale }),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SETTINGS PATCH]", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to update settings" } },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    // Soft delete
    await prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SETTINGS DELETE]", error);
    return NextResponse.json(
      { success: false, error: { message: "Failed to delete account" } },
      { status: 500 }
    );
  }
}
