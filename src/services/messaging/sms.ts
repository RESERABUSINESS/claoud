import {
  type MessagingService,
  type SendResult,
  type MessageStatus,
  formatSaudiPhone,
  isValidSaudiPhone,
  smsLimiter,
} from "./types";

// =============================================
// SMSService — يدعم Unifonic و Twilio
// =============================================

type SMSProvider = "unifonic" | "twilio";

export class SMSService implements MessagingService {
  readonly provider = "sms";
  private smsProvider: SMSProvider;

  constructor() {
    this.smsProvider = (process.env.SMS_PROVIDER as SMSProvider) || "unifonic";
  }

  async sendMessage(phone: string, message: string): Promise<SendResult> {
    const formattedPhone = formatSaudiPhone(phone);

    if (!isValidSaudiPhone(formattedPhone)) {
      return { success: false, error: `رقم غير صالح: ${phone}`, provider: this.provider };
    }

    if (!smsLimiter.tryConsume("global")) {
      return { success: false, error: "تم تجاوز حد الرسائل", provider: this.provider };
    }

    if (this.smsProvider === "twilio") {
      return this.sendViaTwilio(formattedPhone, message);
    }
    return this.sendViaUnifonic(formattedPhone, message);
  }

  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    if (this.smsProvider === "twilio") {
      return this.getStatusTwilio(messageId);
    }
    return this.getStatusUnifonic(messageId);
  }

  // ─── Unifonic ──────────────────────────────

  private async sendViaUnifonic(phone: string, message: string): Promise<SendResult> {
    const appSid = process.env.UNIFONIC_APP_SID || "";
    const senderId = process.env.UNIFONIC_SENDER_ID || "SmartOffers";

    try {
      // Unifonic API: https://docs.unifonic.com
      // POST https://el.cloud.unifonic.com/rest/SMS/messages
      const response = await fetch("https://el.cloud.unifonic.com/rest/SMS/messages", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          AppSid: appSid,
          Recipient: phone.replace("+", ""),
          Body: message,
          SenderID: senderId,
        }),
      });

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}`, provider: "unifonic" };
      }

      const data = await response.json();
      if (data.success === true || data.errorCode === "ER-00") {
        return {
          success: true,
          messageId: data.data?.MessageID || data.MessageID,
          provider: "unifonic",
        };
      }

      return {
        success: false,
        error: data.message || data.errorCode || "فشل الإرسال",
        provider: "unifonic",
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        provider: "unifonic",
      };
    }
  }

  private async getStatusUnifonic(messageId: string): Promise<MessageStatus> {
    const appSid = process.env.UNIFONIC_APP_SID || "";

    try {
      const response = await fetch(
        `https://el.cloud.unifonic.com/rest/SMS/messages/getMessageIDStatus?AppSid=${appSid}&MessageID=${messageId}`
      );

      if (!response.ok) {
        return { messageId, status: "sent" };
      }

      const data = await response.json();
      const statusMap: Record<string, MessageStatus["status"]> = {
        Sent: "sent",
        Delivered: "delivered",
        Rejected: "failed",
      };

      return {
        messageId,
        status: statusMap[data.data?.Status] || "sent",
      };
    } catch {
      return { messageId, status: "sent" };
    }
  }

  // ─── Twilio SMS ────────────────────────────

  private async sendViaTwilio(phone: string, message: string): Promise<SendResult> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    const authToken = process.env.TWILIO_AUTH_TOKEN || "";
    const fromNumber = process.env.TWILIO_SMS_FROM || "";

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
            To: phone,
            From: fromNumber,
            Body: message,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message || `HTTP ${response.status}`, provider: "twilio" };
      }

      const data = await response.json();
      return { success: true, messageId: data.sid, provider: "twilio" };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), provider: "twilio" };
    }
  }

  private async getStatusTwilio(messageId: string): Promise<MessageStatus> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    const authToken = process.env.TWILIO_AUTH_TOKEN || "";

    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${messageId}.json`,
        {
          headers: {
            Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          },
        }
      );

      if (!response.ok) return { messageId, status: "sent" };

      const data = await response.json();
      const statusMap: Record<string, MessageStatus["status"]> = {
        queued: "queued",
        sent: "sent",
        delivered: "delivered",
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
}
