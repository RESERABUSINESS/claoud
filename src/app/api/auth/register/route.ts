import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types";

// =============================================
// POST /api/auth/register — تسجيل حساب جديد
// =============================================

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = checkRateLimit(`register:${ip}`, RATE_LIMITS.register);
  if (!limit.allowed) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "عدد المحاولات كثير. حاول بعد شوي." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const body = await request.json();

    // Validation
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message);
      return NextResponse.json<ApiResponse>(
        { success: false, error: errors[0] },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // التحقق من عدم وجود حساب مسبق
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "هذا الإيميل مسجّل مسبقاً" },
        { status: 409 }
      );
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12);

    // إنشاء المستخدم
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // تسجيل النشاط
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "register",
        details: "تسجيل حساب جديد",
        ipAddress: ip,
        userAgent: request.headers.get("user-agent"),
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: user,
      message: "تم إنشاء الحساب بنجاح",
    }, { status: 201 });
  } catch (err) {
    console.error("[Auth] فشل التسجيل:", err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "حدث خطأ أثناء إنشاء الحساب" },
      { status: 500 }
    );
  }
}
