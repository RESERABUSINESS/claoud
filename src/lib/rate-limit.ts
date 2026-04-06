// =============================================
// Rate Limiting للـ API Routes
// =============================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// تنظيف دوري كل 5 دقائق
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (entry.resetAt < now) store.delete(key);
  });
}, 5 * 60 * 1000);

interface RateLimitConfig {
  maxRequests: number;   // عدد الطلبات المسموحة
  windowMs: number;      // النافذة الزمنية بالمللي ثانية
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  entry.count++;
  const remaining = Math.max(0, config.maxRequests - entry.count);

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining, resetAt: entry.resetAt };
}

// إعدادات مسبقة للـ API routes
export const RATE_LIMITS = {
  // تسجيل الدخول: 5 محاولات / دقيقة
  auth: { maxRequests: 5, windowMs: 60 * 1000 },
  // التسجيل: 3 محاولات / 5 دقائق
  register: { maxRequests: 3, windowMs: 5 * 60 * 1000 },
  // API عام: 60 طلب / دقيقة
  api: { maxRequests: 60, windowMs: 60 * 1000 },
  // نسيت كلمة المرور: 3 محاولات / 15 دقيقة
  forgotPassword: { maxRequests: 3, windowMs: 15 * 60 * 1000 },
} as const;
