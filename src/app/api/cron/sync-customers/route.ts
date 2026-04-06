import { NextRequest, NextResponse } from "next/server";
import { syncAllCustomers } from "@/services/customer-sync";
import type { ApiResponse } from "@/types";

// =============================================
// التحقق من صلاحية الطلب
// =============================================

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true;

  const cronKey = request.headers.get("x-cron-key");
  if (cronKey === process.env.CRON_SECRET) return true;

  if (process.env.NODE_ENV === "development") {
    const queryKey = request.nextUrl.searchParams.get("key");
    if (queryKey === process.env.CRON_SECRET) return true;
  }

  return false;
}

// =============================================
// GET /api/cron/sync-customers
// يُستدعى من Cloudflare Workers Cron Trigger
// =============================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  if (!isAuthorized(request)) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "غير مصرح — مفتاح CRON_SECRET غير صحيح" },
      { status: 401 }
    );
  }

  try {
    console.log("[Cron] بدء مزامنة العملاء...");

    const result = await syncAllCustomers();

    const duration = Date.now() - startTime;

    const report = {
      status: result.totals.errors > 0 ? "completed_with_errors" : "success",
      duration: `${duration}ms`,
      summary: result.totals,
      stores: result.results.map((r) => ({
        id: r.storeId,
        name: r.storeName,
        platform: r.platform,
        created: r.customersCreated,
        updated: r.customersUpdated,
        segmentsUpdated: r.segmentsUpdated,
        errors: r.errors.length > 0 ? r.errors : undefined,
      })),
      timestamps: {
        startedAt: result.startedAt.toISOString(),
        finishedAt: result.finishedAt.toISOString(),
      },
    };

    console.log(`[Cron] مزامنة اكتملت في ${duration}ms`);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: report,
      message: `تمت مزامنة ${result.totals.storesProcessed} متجر: +${result.totals.customersCreated} جديد، ~${result.totals.customersUpdated} محدّث`,
    });
  } catch (err) {
    const duration = Date.now() - startTime;
    console.error(`[Cron] فشل مزامنة العملاء بعد ${duration}ms:`, err);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "فشل مزامنة العملاء",
        data: {
          duration: `${duration}ms`,
          errorMessage: err instanceof Error ? err.message : String(err),
        },
      },
      { status: 500 }
    );
  }
}
