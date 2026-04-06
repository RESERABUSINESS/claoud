import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types";

// =============================================
// POST /api/auth/forgot-password — طلب استعادة كلمة المرور
// =============================================

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const limit = checkRateLimit(`forgot:${ip}`, RATE_LIMITS.forgotPassword);
  if (!limit.allowed) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "عدد المحاولات كثير. حاول بعد شوي." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();

    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // دائماً نرجع نجاح (حتى لو الإيميل مو موجود) — عشان ما نكشف الحسابات
    if (user) {
      // TODO: إرسال إيميل استعادة كلمة المرور عبر خدمة الإيميل
      // يمكن استخدام crypto.randomUUID() لإنشاء token
      // وحفظه في جدول PasswordResetToken مع تاريخ انتهاء

      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "forgot_password",
          details: "طلب استعادة كلمة المرور",
          ipAddress: ip,
          userAgent: request.headers.get("user-agent"),
        },
      });

      console.log(`[Auth] طلب استعادة كلمة المرور: ${normalizedEmail}`);
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "إذا كان الإيميل مسجّل عندنا، تم إرسال رابط استعادة كلمة المرور",
    });
  } catch (err) {
    console.error("[Auth] فشل طلب الاستعادة:", err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "حدث خطأ. حاول مرة ثانية." },
      { status: 500 }
    );
  }
}
