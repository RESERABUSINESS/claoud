import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SallaClient, SALLA_WEBHOOK_EVENTS } from "@/services/platforms/salla";

// =============================================
// GET /api/auth/salla/callback
// يستقبل الرد من صفحة OAuth في سلة بعد موافقة التاجر
// =============================================

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/auth/salla/callback`;

  // 1. التحقق من الأخطاء
  if (error) {
    console.error(`[Salla OAuth] رفض التاجر: ${error}`);
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings/connect?error=denied`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings/connect?error=no_code`
    );
  }

  // 2. التحقق من الـ state (حماية CSRF)
  // في الإنتاج: قارن state مع القيمة المخزنة في الجلسة
  if (!state) {
    console.warn("[Salla OAuth] state مفقود");
  }

  try {
    // 3. استبدال الكود بالتوكنات
    const tokens = await SallaClient.exchangeCodeForTokens(code, redirectUri);

    // 4. جلب معلومات المتجر من سلة
    const tempClient = new SallaClient("temp", tokens.accessToken, tokens.refreshToken);
    const storeInfo = await tempClient.getStoreInfo();

    const storeName = (storeInfo.name as string) || "متجر سلة";
    const storeExternalId = String(storeInfo.id || Date.now());

    // 5. إنشاء أو تحديث المتجر في قاعدة البيانات
    const store = await prisma.store.upsert({
      where: { id: storeExternalId },
      create: {
        id: storeExternalId,
        name: storeName,
        platform: "SALLA",
        apiKey: tokens.accessToken,
        apiSecret: tokens.refreshToken,
        isActive: true,
      },
      update: {
        name: storeName,
        apiKey: tokens.accessToken,
        apiSecret: tokens.refreshToken,
        isActive: true,
      },
    });

    console.log(`[Salla OAuth] تم ربط المتجر: ${store.name} (${store.id})`);

    // 6. تسجيل الـ webhooks تلقائياً
    try {
      const client = new SallaClient(store.id, tokens.accessToken, tokens.refreshToken);
      const webhookUrl = `${appUrl}/api/webhooks/salla`;

      await client.registerWebhook(webhookUrl, [
        SALLA_WEBHOOK_EVENTS.ORDER_CREATED,
        SALLA_WEBHOOK_EVENTS.ORDER_STATUS_UPDATED,
        SALLA_WEBHOOK_EVENTS.CUSTOMER_CREATED,
        SALLA_WEBHOOK_EVENTS.CUSTOMER_UPDATED,
        SALLA_WEBHOOK_EVENTS.CART_ABANDONED,
        SALLA_WEBHOOK_EVENTS.COUPON_APPLIED,
      ]);

      // حفظ رابط الـ webhook
      await prisma.store.update({
        where: { id: store.id },
        data: { webhookUrl },
      });

      console.log(`[Salla OAuth] تم تسجيل الـ webhooks`);
    } catch (webhookErr) {
      // الـ webhook فشل لكن الربط نجح — مو مشكلة حرجة
      console.warn("[Salla OAuth] فشل تسجيل الـ webhooks:", webhookErr);
    }

    // 7. إعادة التوجيه لصفحة النجاح
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings/connect?success=true&store=${encodeURIComponent(storeName)}`
    );
  } catch (err) {
    console.error("[Salla OAuth] فشل:", err instanceof Error ? err.message : err);
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings/connect?error=auth_failed`
    );
  }
}
