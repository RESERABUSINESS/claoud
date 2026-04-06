import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// =============================================
// GET /api/webhooks/whatsapp — Webhook Verification
// Meta يرسل challenge عند تسجيل الـ webhook
// =============================================

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    console.log("[WhatsApp Webhook] تم التحقق بنجاح");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// =============================================
// POST /api/webhooks/whatsapp — استقبال أحداث الرسائل
// =============================================

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // التحقق من التوقيع (Meta)
    const signature = request.headers.get("x-hub-signature-256");
    if (signature && process.env.WHATSAPP_APP_SECRET) {
      const expected = "sha256=" + crypto
        .createHmac("sha256", process.env.WHATSAPP_APP_SECRET)
        .update(rawBody)
        .digest("hex");

      if (signature !== expected) {
        console.error("[WhatsApp Webhook] توقيع غير صالح");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody);

    // Meta WhatsApp Business API webhook format
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "messages") {
            await processWhatsAppStatuses(change.value?.statuses || []);
          }
        }
      }
    }

    // Twilio webhook format (POST form data)
    const twilioSid = request.nextUrl.searchParams.get("MessageSid");
    const twilioStatus = request.nextUrl.searchParams.get("MessageStatus");
    if (twilioSid && twilioStatus) {
      await processTwilioStatus(twilioSid, twilioStatus);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[WhatsApp Webhook] خطأ:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// =============================================
// معالجة حالات Meta WhatsApp
// =============================================

async function processWhatsAppStatuses(
  statuses: { id: string; status: string; timestamp: string; recipient_id: string }[]
) {
  for (const status of statuses) {
    console.log(`[WhatsApp Webhook] رسالة ${status.id}: ${status.status}`);

    // البحث عن الحملة بالـ message ID
    // نحتاج نخزن messageId في الحملة — حالياً نبحث بالـ couponCode أو طرق أخرى
    // هنا نحدّث حالة الحملات اللي حالتها SENT

    if (status.status === "delivered" || status.status === "read") {
      // البحث عن حملات مرسلة مؤخراً للرقم
      const phone = "+" + status.recipient_id;

      const campaigns = await prisma.campaign.findMany({
        where: {
          status: "SENT",
          customer: {
            OR: [
              { phone: { contains: status.recipient_id } },
              { phone },
            ],
          },
          sentAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // آخر 7 أيام
        },
        orderBy: { sentAt: "desc" },
        take: 1,
      });

      if (campaigns.length > 0 && status.status === "read") {
        await prisma.campaign.update({
          where: { id: campaigns[0].id },
          data: { status: "OPENED", openedAt: new Date() },
        });
        console.log(`[WhatsApp Webhook] حملة ${campaigns[0].id}: SENT → OPENED`);
      }
    }
  }
}

// =============================================
// معالجة حالات Twilio
// =============================================

async function processTwilioStatus(messageSid: string, status: string) {
  console.log(`[WhatsApp Webhook] Twilio ${messageSid}: ${status}`);

  if (status === "delivered" || status === "read") {
    // نفس المنطق — في الإنتاج: خزّن messageSid مع الحملة
    console.log(`[WhatsApp Webhook] Twilio status update: ${status}`);
  }
}
