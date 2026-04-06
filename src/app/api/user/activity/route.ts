import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import type { ApiResponse } from "@/types";

// =============================================
// GET /api/user/activity — جلب سجل نشاطات المستخدم
// =============================================

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "غير مسجّل دخول" },
        { status: 401 }
      );
    }

    const activities = await prisma.activityLog.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        action: true,
        details: true,
        ipAddress: true,
        createdAt: true,
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: activities,
    });
  } catch (err) {
    console.error("[User] فشل جلب النشاطات:", err);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "حدث خطأ" },
      { status: 500 }
    );
  }
}
