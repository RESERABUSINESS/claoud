import { z } from "zod";

// =============================================
// Zod Validation Schemas
// =============================================

// --- Auth ---

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "الإيميل مطلوب")
    .email("صيغة الإيميل غير صحيحة"),
  password: z
    .string()
    .min(1, "كلمة المرور مطلوبة"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .max(50, "الاسم طويل جداً"),
  email: z
    .string()
    .min(1, "الإيميل مطلوب")
    .email("صيغة الإيميل غير صحيحة"),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير واحد على الأقل")
    .regex(/[0-9]/, "يجب أن تحتوي على رقم واحد على الأقل"),
  confirmPassword: z
    .string()
    .min(1, "تأكيد كلمة المرور مطلوب"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمة المرور غير متطابقة",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "الإيميل مطلوب")
    .email("صيغة الإيميل غير صحيحة"),
});

export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .regex(/[A-Z]/, "يجب أن تحتوي على حرف كبير واحد على الأقل")
    .regex(/[0-9]/, "يجب أن تحتوي على رقم واحد على الأقل"),
  confirmNewPassword: z
    .string()
    .min(1, "تأكيد كلمة المرور مطلوب"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "كلمة المرور غير متطابقة",
  path: ["confirmNewPassword"],
});

// --- Scenarios ---

export const createScenarioSchema = z.object({
  storeId: z.string().min(1, "معرف المتجر مطلوب"),
  name: z.string().min(2, "اسم السيناريو مطلوب").max(100),
  type: z.enum(["ABANDONED_CART", "DORMANT", "WELCOME", "VIP", "BIRTHDAY"]),
  trigger: z.record(z.string(), z.unknown()),
  action: z.record(z.string(), z.unknown()),
  discountType: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
  discountValue: z.number().min(0).max(100),
  couponPrefix: z.string().max(20).optional(),
  messageTemplate: z.string().min(10, "قالب الرسالة قصير جداً"),
  waitDuration: z.number().min(0).optional(),
  channel: z.enum(["WHATSAPP", "SMS", "EMAIL"]).optional(),
});

// --- Coupon Validation ---

export const validateCouponSchema = z.object({
  code: z.string().min(1, "كود الكوبون مطلوب").max(30),
  storeId: z.string().min(1, "معرف المتجر مطلوب"),
});

// --- Types ---

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
