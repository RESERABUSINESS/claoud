import { NextRequest, NextResponse } from "next/server";
import { validateCoupon, redeemCoupon } from "@/services/offers";
import type { ApiResponse } from "@/types";

// التحقق من صلاحية كوبون
export async function POST(request: NextRequest) {
  try {
    const { code, storeId, redeem, revenue } = await request.json();

    if (!code || !storeId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "كود الكوبون ومعرّف المتجر مطلوبة" },
        { status: 400 }
      );
    }

    // إذا طلب الاسترداد (استخدام الكوبون)
    if (redeem) {
      const coupon = await redeemCoupon(code, storeId, revenue ?? 0);
      return NextResponse.json<ApiResponse>({
        success: true,
        data: coupon,
        message: "تم استخدام الكوبون بنجاح",
      });
    }

    // التحقق فقط
    const result = await validateCoupon(code, storeId);

    if (!result.valid) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        discountType: result.discountType,
        discountValue: result.discountValue,
      },
    });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "حدث خطأ في التحقق من الكوبون" },
      { status: 500 }
    );
  }
}
