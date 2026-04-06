import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validations";
import type { ApiResponse } from "@/types";

// =============================================
// POST /api/auth/change-password — تغيير كلمة المرور
// =============================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "غير مسجّل دخول" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const result = changePasswordSchema.safeParse(body);
    if (!result.success) {
      const errors = result.error.issues.map((e) => e.message);
      return NextResponse.json<ApiResponse>(
        { success: false, error: errors[0] },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = result.data;

    // التحقق من كلمة المرور الحالية
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.hashedPassword);
    if (!isValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "كلمة المرور الحالية غير صحيحة" },
        { status: 400 }
      );
    }

    // تحديث كلمة المرور
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { hashedPassword },
    });

    // تسجيل النشاط
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        action: "password_change",
        details: "تغيير كلمة المرور",
        ipAddress: ip,
        userAgent: request.headers.get("user-agent"),
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "تم تغيير كلمة المرور بنجاح",
    });
  } catch (err) {
    console.error("[Auth] فشل تغيير كلمة المرور:", err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "حدث خطأ. حاول مرة ثانية." },
      { status: 500 }
    );
  }
}
