import type { Channel } from "@/types";
import type { MessagingService, SendResult } from "./types";
import { WhatsAppService } from "./whatsapp";
import { SMSService } from "./sms";
import { EmailService } from "./email";

// =============================================
// Messaging Dispatcher
// يختار الخدمة المناسبة حسب القناة ويرسل
// =============================================

// Singletons
let whatsappService: WhatsAppService | null = null;
let smsService: SMSService | null = null;
let emailService: EmailService | null = null;

function getService(channel: Channel): MessagingService {
  switch (channel) {
    case "WHATSAPP":
      if (!whatsappService) whatsappService = new WhatsAppService();
      return whatsappService;
    case "SMS":
      if (!smsService) smsService = new SMSService();
      return smsService;
    case "EMAIL":
      if (!emailService) emailService = new EmailService();
      return emailService;
  }
}

/**
 * إرسال رسالة عبر القناة المحددة
 * يحدد تلقائياً: واتساب → رقم الجوال، إيميل → البريد
 */
export async function sendMessage(
  channel: Channel,
  recipient: string,
  message: string
): Promise<SendResult> {
  const service = getService(channel);

  console.log(`[Messaging] إرسال عبر ${channel} إلى ${recipient}`);

  const result = await service.sendMessage(recipient, message);

  if (result.success) {
    console.log(`[Messaging] ✅ تم الإرسال — ID: ${result.messageId}`);
  } else {
    console.error(`[Messaging] ❌ فشل الإرسال: ${result.error}`);
  }

  return result;
}

/**
 * إرسال قالب واتساب معتمد
 */
export async function sendWhatsAppTemplate(
  phone: string,
  templateName: string,
  variables: Record<string, string>
): Promise<SendResult> {
  if (!whatsappService) whatsappService = new WhatsAppService();
  return whatsappService.sendTemplate!(phone, templateName, variables);
}

/**
 * جلب حالة رسالة
 */
export async function getMessageStatus(channel: Channel, messageId: string) {
  const service = getService(channel);
  return service.getMessageStatus(messageId);
}

/**
 * اختبار اتصال الواتساب
 */
export async function testWhatsAppConnection() {
  if (!whatsappService) whatsappService = new WhatsAppService();
  return whatsappService.testConnection();
}

// Re-exports
export { WhatsAppService } from "./whatsapp";
export { SMSService } from "./sms";
export { EmailService } from "./email";
export type { MessagingService, SendResult, MessageStatus } from "./types";
export { formatSaudiPhone, isValidSaudiPhone } from "./types";
