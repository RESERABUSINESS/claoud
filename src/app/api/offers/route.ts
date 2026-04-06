import { NextRequest, NextResponse } from "next/server";
import { getScenariosByStore, createScenario } from "@/services/offers";
import type { ApiResponse, CreateScenarioInput } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get("storeId");
    if (!storeId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "معرّف المتجر مطلوب" },
        { status: 400 }
      );
    }

    const scenarios = await getScenariosByStore(storeId);
    return NextResponse.json<ApiResponse>({ success: true, data: scenarios });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "حدث خطأ في جلب السيناريوهات" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateScenarioInput;

    if (!body.storeId || !body.name || !body.type || !body.discountType || !body.messageTemplate) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "البيانات المطلوبة ناقصة" },
        { status: 400 }
      );
    }

    const scenario = await createScenario(body);
    return NextResponse.json<ApiResponse>(
      { success: true, data: scenario, message: "تم إنشاء السيناريو بنجاح" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "حدث خطأ في إنشاء السيناريو" },
      { status: 500 }
    );
  }
}
