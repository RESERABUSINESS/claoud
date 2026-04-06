import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// =============================================
// Middleware — حماية الصفحات والـ API
// =============================================

// المسارات العامة (ما تحتاج تسجيل دخول)
const publicPaths = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/api/auth",
  "/api/webhooks",
  "/api/cron",
  "/api/offers/validate",
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // تجاوز الملفات الثابتة و favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // المسارات العامة — مرور مباشر
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // التحقق من وجود token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // غير مسجّل دخول — توجيه لصفحة تسجيل الدخول
  if (!token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // CSRF protection للـ API routes (POST, PUT, DELETE)
  if (pathname.startsWith("/api/") && !isPublicPath(pathname)) {
    const method = request.method;
    if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      const origin = request.headers.get("origin");
      const host = request.headers.get("host");

      if (origin && host) {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return NextResponse.json(
            { success: false, error: "طلب غير مصرح — CSRF" },
            { status: 403 }
          );
        }
      }
    }
  }

  // إضافة معلومات المستخدم في الـ headers
  const response = NextResponse.next();
  response.headers.set("x-user-id", token.id as string);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
