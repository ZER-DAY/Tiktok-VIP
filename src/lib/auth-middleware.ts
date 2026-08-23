import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const protectedRoutes = ["/dashboard", "/agency", "/admin"];

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes (handled by Better Auth)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Skip for public routes
  const isPublicRoute = !protectedRoutes.some((route) => pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  try {
    const session = await auth().api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      const loginUrl = new URL("/ar/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/ar/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }
}
