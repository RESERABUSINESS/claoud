import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySallaWebhookSignature, SALLA_WEBHOOK_EVENTS } from "@/services/platforms/salla";

// =============================================
// POST /api/webhooks/salla
// يستقبل أحداث سلة (طلب جديد، سلة متروكة، عميل جديد)
// =============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. قراءة البيانات الخام
    const rawBody = await request.text();
    const signature = request.headers.get("x-salla-signature") || "";

    // 2. التحقق من التوقيع
    const webhookSecret = process.env.SALLA_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = verifySallaWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error("[Salla Webhook] توقيع غير صالح");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // 3. معالجة الحدث
    const event: { event: string; merchant: number; data: Record<string, unknown> } = JSON.parse(rawBody);

    console.log(`[Salla Webhook] حدث: ${event.event} — تاجر: ${event.merchant}`);

    // البحث عن المتجر في قاعدة البيانات
    // merchant id يُخزن في externalId أو يمكن البحث بطريقة أخرى
    const store = await prisma.store.findFirst({
      where: { platform: "SALLA", isActive: true },
    });

    if (!store) {
      console.warn("[Salla Webhook] لم يتم العثور على متجر مربوط");
      return NextResponse.json({ received: true, warning: "no matching store" });
    }

    // 4. توجيه حسب نوع الحدث
    switch (event.event) {
      case SALLA_WEBHOOK_EVENTS.CUSTOMER_CREATED:
      case SALLA_WEBHOOK_EVENTS.CUSTOMER_UPDATED:
        await handleCustomerEvent(store.id, event.data);
        break;

      case SALLA_WEBHOOK_EVENTS.ORDER_CREATED:
        await handleNewOrder(store.id, event.data);
        break;

      case SALLA_WEBHOOK_EVENTS.ORDER_STATUS_UPDATED:
        await handleOrderStatusUpdate(store.id, event.data);
        break;

      case SALLA_WEBHOOK_EVENTS.CART_ABANDONED:
        await handleAbandonedCart(store.id, event.data);
        break;

      case SALLA_WEBHOOK_EVENTS.COUPON_APPLIED:
        await handleCouponApplied(store.id, event.data);
        break;

      default:
        console.log(`[Salla Webhook] حدث غير معالَج: ${event.event}`);
    }

    const duration = Date.now() - startTime;
    console.log(`[Salla Webhook] معالجة ${event.event} اكتملت في ${duration}ms`);

    return NextResponse.json({ received: true, event: event.event });
  } catch (err) {
    console.error("[Salla Webhook] خطأ:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// =============================================
// معالجات الأحداث
// =============================================

/**
 * عميل جديد أو تحديث بيانات عميل
 */
async function handleCustomerEvent(storeId: string, data: Record<string, unknown>) {
  const customer = data as {
    id: number;
    first_name?: string;
    last_name?: string;
    mobile?: string;
    email?: string;
    birthday?: string;
  };

  const externalId = String(customer.id);
  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || null;

  await prisma.customer.upsert({
    where: { storeId_externalId: { storeId, externalId } },
    create: {
      storeId,
      externalId,
      name,
      phone: customer.mobile || null,
      email: customer.email || null,
      birthday: customer.birthday ? new Date(customer.birthday) : null,
      segment: "NEW",
    },
    update: {
      name: name || undefined,
      phone: customer.mobile || undefined,
      email: customer.email || undefined,
      birthday: customer.birthday ? new Date(customer.birthday) : undefined,
    },
  });

  console.log(`[Salla Webhook] عميل ${externalId}: تم التحديث`);
}

/**
 * طلب جديد — تحديث بيانات العميل (عدد الطلبات، إجمالي المشتريات)
 */
async function handleNewOrder(storeId: string, data: Record<string, unknown>) {
  const order = data as {
    id: number;
    customer?: { id: number; first_name?: string; last_name?: string; mobile?: string; email?: string };
    amounts?: { total?: { amount: number } };
  };

  if (!order.customer) return;

  const externalId = String(order.customer.id);
  const orderAmount = order.amounts?.total?.amount ?? 0;
  const name = [order.customer.first_name, order.customer.last_name].filter(Boolean).join(" ") || null;

  // upsert العميل وزيادة عدد الطلبات
  const existing = await prisma.customer.findUnique({
    where: { storeId_externalId: { storeId, externalId } },
  });

  if (existing) {
    const newTotalOrders = existing.totalOrders + 1;
    const newTotalSpent = existing.totalSpent + orderAmount;

    // حساب التصنيف الجديد
    let newSegment = existing.segment;
    if (newTotalSpent >= 5000 || newTotalOrders >= 10) {
      newSegment = "VIP";
    } else if (newTotalOrders >= 1) {
      newSegment = "ACTIVE";
    }

    await prisma.customer.update({
      where: { id: existing.id },
      data: {
        totalOrders: newTotalOrders,
        totalSpent: newTotalSpent,
        lastOrderDate: new Date(),
        segment: newSegment,
      },
    });

    console.log(`[Salla Webhook] طلب جديد: العميل ${externalId} — ${orderAmount} ر.س (إجمالي: ${newTotalSpent} ر.س)`);
  } else {
    await prisma.customer.create({
      data: {
        storeId,
        externalId,
        name,
        phone: order.customer.mobile || null,
        email: order.customer.email || null,
        totalOrders: 1,
        totalSpent: orderAmount,
        lastOrderDate: new Date(),
        segment: "ACTIVE",
      },
    });

    console.log(`[Salla Webhook] طلب جديد: عميل جديد ${externalId} — ${orderAmount} ر.س`);
  }
}

/**
 * تحديث حالة طلب — تتبع التحويلات من الكوبونات
 */
async function handleOrderStatusUpdate(storeId: string, data: Record<string, unknown>) {
  const order = data as {
    id: number;
    status?: { slug: string };
    amounts?: { total?: { amount: number } };
    coupon?: { code: string };
  };

  // إذا الطلب فيه كوبون ناشئ من نظامنا
  if (order.coupon?.code) {
    const coupon = await prisma.coupon.findUnique({
      where: { storeId_code: { storeId, code: order.coupon.code } },
    });

    if (coupon && !coupon.isUsed) {
      const revenue = order.amounts?.total?.amount ?? 0;

      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { isUsed: true, usedAt: new Date() },
      });

      await prisma.campaign.update({
        where: { id: coupon.campaignId },
        data: {
          status: "CONVERTED",
          convertedAt: new Date(),
          revenue,
        },
      });

      console.log(`[Salla Webhook] تحويل! كوبون ${order.coupon.code} — إيراد: ${revenue} ر.س`);
    }
  }
}

/**
 * سلة متروكة — تسجيل الحدث لمعالجته لاحقاً بواسطة المحرك
 */
async function handleAbandonedCart(storeId: string, data: Record<string, unknown>) {
  const cart = data as {
    id: number;
    customer?: { id: number; name?: string; mobile?: string; email?: string };
    total?: { amount: number };
  };

  if (!cart.customer) {
    console.log("[Salla Webhook] سلة متروكة بدون بيانات عميل — تم تجاهلها");
    return;
  }

  const externalId = String(cart.customer.id);

  // تأكد إن العميل موجود في قاعدة البيانات
  await prisma.customer.upsert({
    where: { storeId_externalId: { storeId, externalId } },
    create: {
      storeId,
      externalId,
      name: cart.customer.name || null,
      phone: cart.customer.mobile || null,
      email: cart.customer.email || null,
      segment: "NEW",
    },
    update: {},
  });

  console.log(`[Salla Webhook] سلة متروكة: عميل ${externalId} — ${cart.total?.amount ?? 0} ر.س`);
  // المحرك (scenario-engine) سيلتقط هذا العميل في الدورة التالية
}

/**
 * كوبون مُستخدم — تتبع استخدام الكوبونات
 */
async function handleCouponApplied(storeId: string, data: Record<string, unknown>) {
  const couponData = data as { code?: string; order_id?: number };
  if (!couponData.code) return;

  const coupon = await prisma.coupon.findUnique({
    where: { storeId_code: { storeId, code: couponData.code } },
  });

  if (coupon) {
    // الكوبون من نظامنا — حدّث حالة الحملة
    await prisma.campaign.update({
      where: { id: coupon.campaignId },
      data: { status: "OPENED", openedAt: new Date() },
    });

    console.log(`[Salla Webhook] كوبون ${couponData.code} تم تطبيقه`);
  }
}
