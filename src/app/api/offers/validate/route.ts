import { NextRequest, NextResponse } from "next/server";
import { validateOffer } from "@/services/offers";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { code, storeId, orderAmount } = await request.json();

    if (!code || !storeId || !orderAmount) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "كود العرض ومعرّف المتجر ومبلغ الطلب مطلوبة" },
        { status: 400 }
      );
    }

    const result = await validateOffer(code, storeId, orderAmount);

    if (!result.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { discount: result.discount, offer: result.offer },
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "حدث خطأ في التحقق من العرض" },
      { status: 500 }
    );
  }
}
