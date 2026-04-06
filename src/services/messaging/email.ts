import {
  type MessagingService,
  type SendResult,
  type MessageStatus,
  emailLimiter,
} from "./types";

// =============================================
// EmailService — يدعم Resend و SMTP
// =============================================

type EmailProvider = "resend" | "smtp";

export class EmailService implements MessagingService {
  readonly provider = "email";
  private emailProvider: EmailProvider;

  constructor() {
    this.emailProvider = (process.env.EMAIL_PROVIDER as EmailProvider) || "resend";
  }

  async sendMessage(email: string, message: string): Promise<SendResult> {
    if (!email || !email.includes("@")) {
      return { success: false, error: `إيميل غير صالح: ${email}`, provider: this.provider };
    }

    if (!emailLimiter.tryConsume("global")) {
      return { success: false, error: "تم تجاوز حد الرسائل", provider: this.provider };
    }

    if (this.emailProvider === "smtp") {
      return this.sendViaSMTP(email, "عرض خاص من متجرك", message);
    }
    return this.sendViaResend(email, "عرض خاص من متجرك", message);
  }

  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    if (this.emailProvider === "resend") {
      return this.getStatusResend(messageId);
    }
    return { messageId, status: "sent" };
  }

  // ─── Resend (https://resend.com) ───────────

  private async sendViaResend(
    to: string,
    subject: string,
    htmlBody: string
  ): Promise<SendResult> {
    const apiKey = process.env.RESEND_API_KEY || "";
    const fromEmail = process.env.EMAIL_FROM || "offers@smartoffers.sa";

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `عروض ذكية <${fromEmail}>`,
          to: [to],
          subject,
          html: this.wrapInTemplate(htmlBody),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || `HTTP ${response.status}`, provider: "resend" };
      }

      const data = await response.json();
      return { success: true, messageId: data.id, provider: "resend" };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), provider: "resend" };
    }
  }

  private async getStatusResend(messageId: string): Promise<MessageStatus> {
    const apiKey = process.env.RESEND_API_KEY || "";

    try {
      const response = await fetch(`https://api.resend.com/emails/${messageId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!response.ok) return { messageId, status: "sent" };

      const data = await response.json();
      const statusMap: Record<string, MessageStatus["status"]> = {
        queued: "queued",
        sent: "sent",
        delivered: "delivered",
        opened: "read",
        bounced: "failed",
      };

      return {
        messageId,
        status: statusMap[data.last_event] || "sent",
        timestamp: data.created_at ? new Date(data.created_at) : undefined,
      };
    } catch {
      return { messageId, status: "sent" };
    }
  }

  // ─── SMTP (عبر Nodemailer endpoint) ────────

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async sendViaSMTP(to: string, subject: string, htmlBody: string): Promise<SendResult> {
    // TODO: ربط بـ Nodemailer أو خدمة SMTP
    // في الإنتاج: استخدم nodemailer مع SMTP credentials
    console.log(`[Email SMTP] إرسال إلى ${to}: ${subject}`);
    console.log(`[Email SMTP] ملاحظة: SMTP غير مفعّل — استخدم Resend بدلاً`);

    return {
      success: false,
      error: "SMTP غير مفعّل — استخدم Resend",
      provider: "smtp",
    };
  }

  // ─── قالب HTML بسيط للإيميلات ──────────────

  private wrapInTemplate(body: string): string {
    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="utf-8"></head>
<body style="font-family: 'Tajawal', Arial, sans-serif; background: #f5f5f5; padding: 20px; direction: rtl;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #10b981; font-size: 24px; margin: 0;">عروض ذكية</h1>
    </div>
    <div style="font-size: 16px; line-height: 1.8; color: #333; white-space: pre-wrap;">
${body}
    </div>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
    <p style="text-align: center; font-size: 12px; color: #999;">
      هذه رسالة تلقائية من نظام عروض ذكية
    </p>
  </div>
</body>
</html>`.trim();
  }
}
