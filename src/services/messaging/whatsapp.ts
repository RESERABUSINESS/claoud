import {
  type MessagingService,
  type SendResult,
  type MessageStatus,
  formatSaudiPhone,
  isValidSaudiPhone,
  whatsappLimiter,
} from "./types";

// =============================================
// إعدادات
// =============================================

type WhatsAppProvider = "meta" | "twilio";

interface WhatsAppConfig {
  provider: WhatsAppProvider;
  // Meta WhatsApp Business API
  meta?: {
    phoneNumberId: string;
    accessToken: string;
    apiVersion: string;
  };
  // Twilio WhatsApp
  twilio?: {
    accountSid: string;
    authToken: string;
    fromNumber: string;
  };
}

// =============================================
// WhatsAppService
// =============================================

export class WhatsAppService implements MessagingService {
  readonly provider = "whatsapp";
  private config: WhatsAppConfig;

  constructor(config?: Partial<WhatsAppConfig>) {
    this.config = {
      provider: (process.env.WHATSAPP_PROVIDER as WhatsAppProvider) || "meta",
      meta: {
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || "",
        apiVersion: process.env.WHATSAPP_API_VERSION || "v21.0",
      },
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || "",
        authToken: process.env.TWILIO_AUTH_TOKEN || "",
        fromNumber: process.env.TWILIO_WHATSAPP_FROM || "",
      },
      ...config,
    };
  }

  // ─── إرسال رسالة نصية ──────────────────────

  async sendMessage(phone: string, message: string): Promise<SendResult> {
    // تحويل الرقم للصيغة الدولية
    const formattedPhone = formatSaudiPhone(phone);

    if (!isValidSaudiPhone(formattedPhone)) {
      return { success: false, error: `رقم غير صالح: ${phone}`, provider: this.provider };
    }

    // Rate limiting
    if (!whatsappLimiter.tryConsume("global")) {
      return {
        success: false,
        error: "تم تجاوز الحد الأقصى للرسائل — حاول بعد دقيقة",
        provider: this.provider,
      };
    }

    // Rate limit لكل رقم: 3 رسائل / 5 دقائق
    const phoneKey = `phone:${formattedPhone}`;
    const phoneLimiter = new (await import("./types")).RateLimiter(3, 5 * 60_000);
    if (!phoneLimiter.tryConsume(phoneKey)) {
      return {
        success: false,
        error: `تم تجاوز حد الرسائل لهذا الرقم: ${formattedPhone}`,
        provider: this.provider,
      };
    }

    if (this.config.provider === "twilio") {
      return this.sendViaTwilio(formattedPhone, message);
    }
    return this.sendViaMeta(formattedPhone, message);
  }

  // ─── إرسال قالب معتمد ──────────────────────

  async sendTemplate(
    phone: string,
    templateName: string,
    variables: Record<string, string>
  ): Promise<SendResult> {
    const formattedPhone = formatSaudiPhone(phone);

    if (!isValidSaudiPhone(formattedPhone)) {
      return { success: false, error: `رقم غير صالح: ${phone}`, provider: this.provider };
    }

    if (!whatsappLimiter.tryConsume("global")) {
      return { success: false, error: "تم تجاوز حد الرسائل", provider: this.provider };
    }

    if (this.config.provider === "twilio") {
      // Twilio يرسل القالب كرسالة عادية مع content SID
      const message = Object.entries(variables).reduce(
        (msg, [key, val]) => msg.replace(`{{${key}}}`, val),
        templateName
      );
      return this.sendViaTwilio(formattedPhone, message);
    }

    return this.sendTemplateMeta(formattedPhone, templateName, variables);
  }

  // ─── حالة الرسالة ──────────────────────────

  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    if (this.config.provider === "twilio") {
      return this.getStatusTwilio(messageId);
    }
    // Meta API ما يدعم جلب الحالة مباشرة — تجي عبر webhook
    return {
      messageId,
      status: "sent",
    };
  }

  // =============================================
  // Meta WhatsApp Business API
  // =============================================

  private async sendViaMeta(phone: string, message: string): Promise<SendResult> {
    const { phoneNumberId, accessToken, apiVersion } = this.config.meta!;
    // إزالة + من بداية الرقم لـ Meta API
    const recipientPhone = phone.replace("+", "");

    try {
      const response = await fetch(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: recipientPhone,
            type: "text",
            text: { body: message },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message || `HTTP ${response.status}`,
          provider: "meta",
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.messages?.[0]?.id,
        provider: "meta",
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        provider: "meta",
      };
    }
  }

  private async sendTemplateMeta(
    phone: string,
    templateName: string,
    variables: Record<string, string>
  ): Promise<SendResult> {
    const { phoneNumberId, accessToken, apiVersion } = this.config.meta!;
    const recipientPhone = phone.replace("+", "");

    // تحويل المتغيرات لصيغة Meta
    const components = [];
    const params = Object.values(variables);
    if (params.length > 0) {
      components.push({
        type: "body",
        parameters: params.map((val) => ({ type: "text", text: val })),
      });
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: recipientPhone,
            type: "template",
            template: {
              name: templateName,
              language: { code: "ar" },
              components,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.error?.message || `HTTP ${response.status}`,
          provider: "meta",
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.messages?.[0]?.id,
        provider: "meta",
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        provider: "meta",
      };
    }
  }

  // =============================================
  // Twilio WhatsApp
  // =============================================

  private async sendViaTwilio(phone: string, message: string): Promise<SendResult> {
    const { accountSid, authToken, fromNumber } = this.config.twilio!;

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: `whatsapp:${phone}`,
            From: `whatsapp:${fromNumber}`,
            Body: message,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          error: error.message || `HTTP ${response.status}`,
          provider: "twilio",
        };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.sid,
        provider: "twilio",
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        provider: "twilio",
      };
    }
  }

  private async getStatusTwilio(messageId: string): Promise<MessageStatus> {
    const { accountSid, authToken } = this.config.twilio!;

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${messageId}.json`,
        {
          headers: {
            Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          },
        }
      );

      if (!response.ok) {
        return { messageId, status: "failed", error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      const statusMap: Record<string, MessageStatus["status"]> = {
        queued: "queued",
        sent: "sent",
        delivered: "delivered",
        read: "read",
        failed: "failed",
        undelivered: "failed",
      };

      return {
        messageId,
        status: statusMap[data.status] || "sent",
        timestamp: data.date_updated ? new Date(data.date_updated) : undefined,
      };
    } catch {
      return { messageId, status: "sent" };
    }
  }

  // ─── اختبار الاتصال ───────────────────────

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (this.config.provider === "meta") {
      const { phoneNumberId, accessToken, apiVersion } = this.config.meta!;
      if (!phoneNumberId || !accessToken) {
        return { success: false, error: "بيانات Meta WhatsApp ناقصة" };
      }
      try {
        const res = await fetch(
          `https://graph.facebook.com/${apiVersion}/${phoneNumberId}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return { success: res.ok, error: res.ok ? undefined : `HTTP ${res.status}` };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : String(err) };
      }
    }

    const { accountSid, authToken } = this.config.twilio!;
    if (!accountSid || !authToken) {
      return { success: false, error: "بيانات Twilio ناقصة" };
    }
    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
        {
          headers: {
            Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          },
        }
      );
      return { success: res.ok, error: res.ok ? undefined : `HTTP ${res.status}` };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }
}
