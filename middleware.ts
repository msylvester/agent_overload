import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

async function isValidAdminSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get("admin-session")?.value;
  if (!token) return false;
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    "default-admin-secret-change-in-production";
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin/* routes (not /admin itself or /api/admin/auth)
  if (
    pathname.startsWith("/admin/") &&
    !pathname.startsWith("/api/admin/auth")
  ) {
    const valid = await isValidAdminSession(request);
    if (!valid) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path+"],
};
