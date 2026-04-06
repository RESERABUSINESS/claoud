// =============================================
// واجهة مشتركة لخدمات الرسائل
// =============================================

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: string;
}

export interface MessageStatus {
  messageId: string;
  status: "queued" | "sent" | "delivered" | "read" | "failed";
  timestamp?: Date;
  error?: string;
}

export interface MessagingService {
  readonly provider: string;

  /** إرسال رسالة نصية */
  sendMessage(phone: string, message: string): Promise<SendResult>;

  /** إرسال قالب معتمد (للواتساب) */
  sendTemplate?(
    phone: string,
    templateName: string,
    variables: Record<string, string>
  ): Promise<SendResult>;

  /** حالة الرسالة */
  getMessageStatus(messageId: string): Promise<MessageStatus>;
}

// =============================================
// تحويل أرقام الجوال السعودية للصيغة الدولية
// =============================================

/**
 * يحوّل رقم الجوال السعودي لصيغة +966XXXXXXXXX
 *
 * يقبل:
 * - 05XXXXXXXX → +9665XXXXXXXX
 * - 5XXXXXXXX  → +9665XXXXXXXX
 * - 9665XXXXXXXX → +9665XXXXXXXX
 * - +9665XXXXXXXX → +9665XXXXXXXX
 * - 009665XXXXXXXX → +9665XXXXXXXX
 */
export function formatSaudiPhone(phone: string): string {
  // إزالة المسافات والشرطات
  let cleaned = phone.replace(/[\s\-()]+/g, "");

  // إزالة 00 من البداية
  if (cleaned.startsWith("00")) {
    cleaned = "+" + cleaned.slice(2);
  }

  // إذا يبدأ بـ + خلاص
  if (cleaned.startsWith("+966")) {
    return cleaned;
  }

  // إذا يبدأ بـ 966
  if (cleaned.startsWith("966")) {
    return "+" + cleaned;
  }

  // إذا يبدأ بـ 05
  if (cleaned.startsWith("05")) {
    return "+966" + cleaned.slice(1);
  }

  // إذا يبدأ بـ 5 ورقم واحد بعده (9 أرقام)
  if (cleaned.startsWith("5") && cleaned.length === 9) {
    return "+966" + cleaned;
  }

  // إرجاع الرقم كما هو إذا ما عرفنا نحوّله
  return cleaned.startsWith("+") ? cleaned : "+" + cleaned;
}

/**
 * التحقق من صحة رقم سعودي
 */
export function isValidSaudiPhone(phone: string): boolean {
  const formatted = formatSaudiPhone(phone);
  return /^\+9665\d{8}$/.test(formatted);
}

// =============================================
// Rate Limiter — حماية من الإرسال المفرط
// =============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private maxRequests: number;
  private windowMs: number;

  /**
   * @param maxRequests الحد الأقصى للرسائل
   * @param windowMs نافذة الوقت بالملّي ثانية
   */
  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /** تحقق + سجّل محاولة. يرجع true إذا مسموح */
  tryConsume(key: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now >= entry.resetAt) {
      this.limits.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  /** كم محاولة باقية */
  remaining(key: string): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() >= entry.resetAt) return this.maxRequests;
    return Math.max(0, this.maxRequests - entry.count);
  }

  /** تنظيف الإدخالات المنتهية */
  cleanup(): void {
    const now = Date.now();
    this.limits.forEach((entry, key) => {
      if (now >= entry.resetAt) {
        this.limits.delete(key);
      }
    });
  }
}

// Rate limiters مشتركة
// واتساب: 80 رسالة / دقيقة (حد WhatsApp Business API)
export const whatsappLimiter = new RateLimiter(80, 60_000);

// SMS: 30 رسالة / دقيقة
export const smsLimiter = new RateLimiter(30, 60_000);

// إيميل: 100 رسالة / دقيقة
export const emailLimiter = new RateLimiter(100, 60_000);
