import { NextRequest, NextResponse } from "next/server";
import { getOffersByStore, createOffer } from "@/services/offers";
import type { ApiResponse, CreateOfferInput } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get("storeId");
    if (!storeId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "معرّف المتجر مطلوب" },
        { status: 400 }
      );
    }

    const offers = await getOffersByStore(storeId);
    return NextResponse.json<ApiResponse>({ success: true, data: offers });
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "حدث خطأ في جلب العروض" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateOfferInput;

    if (!body.storeId || !body.name || !body.type || !body.value || !body.startsAt) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "البيانات المطلوبة ناقصة" },
        { status: 400 }
      );
    }

    const offer = await createOffer(body);
    return NextResponse.json<ApiResponse>(
      { success: true, data: offer, message: "تم إنشاء العرض بنجاح" },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "حدث خطأ في إنشاء العرض" },
      { status: 500 }
    );
  }
}
