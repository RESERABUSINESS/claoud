import { NextRequest, NextResponse } from "next/server";
import { runAllScenarios } from "@/services/scenario-engine";
import type { ApiResponse } from "@/types";

// POST /api/engine — تشغيل محرك السيناريوهات
export async function POST(request: NextRequest) {
  try {
    // تحقق بسيط من المفتاح
    const { searchParams } = request.nextUrl;
    const key = searchParams.get("key");
    if (key !== process.env.SECRET_KEY) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "غير مصرح" },
        { status: 401 }
      );
    }

    const result = await runAllScenarios();

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
      message: `تم تشغيل المحرك: ${result.totalCampaigns} حملة جديدة، ${result.totalErrors} خطأ`,
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "حدث خطأ في تشغيل المحرك" },
      { status: 500 }
    );
  }
}
