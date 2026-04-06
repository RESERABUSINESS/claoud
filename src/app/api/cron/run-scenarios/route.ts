import { NextRequest, NextResponse } from "next/server";
import { runAllScenarios } from "@/services/scenario-engine";
import type { ApiResponse } from "@/types";

// =============================================
// التحقق من صلاحية الطلب
// =============================================

function isAuthorized(request: NextRequest): boolean {
  // طريقة 1: Bearer token في header (معيار OAuth)
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;

  // طريقة 2: Cloudflare Worker يرسل x-cron-key
  const cronKey = request.headers.get("x-cron-key");
  if (cronKey === process.env.CRON_SECRET) return true;

  // طريقة 3: Query parameter (للاختبار المحلي فقط)
  if (process.env.NODE_ENV === "development") {
    const queryKey = request.nextUrl.searchParams.get("key");
    if (queryKey === process.env.CRON_SECRET) return true;
  }

  return false;
}

// =============================================
// GET /api/cron/run-scenarios
// يُستدعى من Cloudflare Workers Cron Trigger
// =============================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // التحقق من الأمان
  if (!isAuthorized(request)) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "غير مصرح — مفتاح CRON_SECRET غير صحيح" },
      { status: 401 }
    );
  }

  try {
    console.log("[Cron] بدء تشغيل محرك السيناريوهات...");

    const result = await runAllScenarios();

    const duration = Date.now() - startTime;

    // تقرير مفصّل
    const report = {
      status: result.totalErrors > 0 ? "completed_with_errors" : "success",
      duration: `${duration}ms`,
      summary: {
        totalCampaignsSent: result.totalCampaigns,
        totalErrors: result.totalErrors,
        scenariosProcessed: result.results.length,
      },
      scenarios: result.results.map((r) => ({
        id: r.scenarioId,
        name: r.scenarioName,
        campaignsCreated: r.campaignsCreated,
        errors: r.errors.length > 0 ? r.errors : undefined,
      })),
      timestamps: {
        startedAt: result.startedAt.toISOString(),
        finishedAt: result.finishedAt.toISOString(),
      },
    };

    console.log(`[Cron] اكتمل في ${duration}ms — ${result.totalCampaigns} حملة، ${result.totalErrors} خطأ`);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: report,
      message: `تم تشغيل ${result.results.length} سيناريو: ${result.totalCampaigns} حملة جديدة`,
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`[Cron] فشل تشغيل المحرك بعد ${duration}ms:`, err);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "فشل تشغيل محرك السيناريوهات",
        data: {
          duration: `${duration}ms`,
          errorMessage: err instanceof Error ? err.message : String(err),
        },
      },
      { status: 500 }
    );
  }
}
