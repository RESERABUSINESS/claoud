import { prisma } from "@/lib/prisma";
import type { Channel } from "@/types";

// =============================================
// أنواع البيانات الداخلية
// =============================================

interface TriggerData {
  waitMinutes?: number;
  dormantDays?: number;
  vipMinSpent?: number;
  vipMinOrders?: number;
  birthdayDaysBefore?: number;
  couponExpiryDays?: number;
}

interface ScenarioResult {
  scenarioId: string;
  scenarioName: string;
  campaignsCreated: number;
  errors: string[];
}

interface EngineRunResult {
  startedAt: Date;
  finishedAt: Date;
  results: ScenarioResult[];
  totalCampaigns: number;
  totalErrors: number;
}

// =============================================
// Logger
// =============================================

const log = {
  info: (msg: string, data?: Record<string, unknown>) =>
    console.log(`[ScenarioEngine] ℹ️  ${msg}`, data ? JSON.stringify(data) : ""),
  success: (msg: string, data?: Record<string, unknown>) =>
    console.log(`[ScenarioEngine] ✅ ${msg}`, data ? JSON.stringify(data) : ""),
  warn: (msg: string, data?: Record<string, unknown>) =>
    console.warn(`[ScenarioEngine] ⚠️  ${msg}`, data ? JSON.stringify(data) : ""),
  error: (msg: string, err?: unknown) =>
    console.error(`[ScenarioEngine] ❌ ${msg}`, err instanceof Error ? err.message : err),
};

// =============================================
// توليد كوبون فريد
// =============================================

export async function generateUniqueCoupon(prefix: string, storeId: string): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // بدون O/0/1/I عشان ما يتلخبط
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let random = "";
    for (let i = 0; i < 5; i++) {
      random += chars[Math.floor(Math.random() * chars.length)];
    }
    const code = `${prefix}-${random}`;

    const existing = await prisma.coupon.findUnique({
      where: { storeId_code: { storeId, code } },
    });

    if (!existing) return code;
  }

  // fallback: أضف timestamp
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  let random = "";
  const chars2 = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let i = 0; i < 3; i++) {
    random += chars2[Math.floor(Math.random() * chars2.length)];
  }
  return `${prefix}-${ts}${random}`;
}

// =============================================
// إنشاء حملة وكوبون
// =============================================

async function createCampaignWithCoupon(
  scenarioId: string,
  storeId: string,
  customerId: string,
  couponPrefix: string,
  discountType: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING",
  discountValue: number,
  expiryDays: number,
  messageTemplate: string,
  channel: Channel,
  customerName: string | null
): Promise<string> {
  const couponCode = await generateUniqueCoupon(couponPrefix, storeId);

  // حساب تاريخ انتهاء الكوبون
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  // تجهيز نص الرسالة
  const discountLabel =
    discountType === "PERCENTAGE"
      ? `${discountValue}%`
      : discountType === "FIXED"
        ? `${discountValue} ر.س`
        : "شحن مجاني";

  const finalMessage = messageTemplate
    .replace(/{اسم_العميل}/g, customerName || "عزيزي العميل")
    .replace(/{الكوبون}/g, couponCode)
    .replace(/{قيمة_الخصم}/g, discountLabel)
    .replace(/{اسم_المنتج}/g, "منتجك");

  // إنشاء الحملة والكوبون في transaction
  const campaign = await prisma.$transaction(async (tx) => {
    const campaign = await tx.campaign.create({
      data: {
        scenarioId,
        customerId,
        couponCode,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    await tx.coupon.create({
      data: {
        storeId,
        campaignId: campaign.id,
        code: couponCode,
        discountType,
        discountValue,
        expiresAt,
      },
    });

    return campaign;
  });

  // إرسال الرسالة (placeholder — يتم ربطه لاحقاً بـ WhatsApp/SMS/Email API)
  await sendMessage(channel, customerName, finalMessage);

  return campaign.id;
}

// =============================================
// إرسال الرسالة (placeholder)
// =============================================

async function sendMessage(channel: Channel, recipient: string | null, message: string): Promise<void> {
  // TODO: ربط بـ WhatsApp Business API / SMS Gateway / Email Provider
  log.info(`إرسال رسالة عبر ${channel} إلى ${recipient || "عميل"}`, {
    channel,
    messageLength: message.length,
  });
}

// =============================================
// استخراج بيانات الـ trigger من السيناريو
// =============================================

function parseTrigger(trigger: unknown): TriggerData {
  if (typeof trigger === "object" && trigger !== null) {
    return trigger as TriggerData;
  }
  return {};
}

// =============================================
// 1. السلات المتروكة
// =============================================

export async function checkAbandonedCarts(): Promise<ScenarioResult[]> {
  log.info("بدء فحص السلات المتروكة...");
  const results: ScenarioResult[] = [];

  const scenarios = await prisma.scenario.findMany({
    where: { type: "ABANDONED_CART", isActive: true },
    include: { store: true },
  });

  for (const scenario of scenarios) {
    const result: ScenarioResult = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      campaignsCreated: 0,
      errors: [],
    };

    try {
      const trigger = parseTrigger(scenario.trigger);
      const waitMinutes = trigger.waitMinutes ?? scenario.waitDuration ?? 30;
      const expiryDays = trigger.couponExpiryDays ?? 7;
      const cutoffTime = new Date(Date.now() - waitMinutes * 60 * 1000);

      // جلب العملاء اللي عندهم segment = NEW أو ACTIVE وما عندهم طلبات حديثة
      // (السلة المتروكة تجي عادة عبر webhook — هنا نعالج العملاء اللي مر عليهم الوقت)
      const eligibleCustomers = await prisma.customer.findMany({
        where: {
          storeId: scenario.storeId,
          segment: { in: ["NEW", "ACTIVE"] },
          totalOrders: 0,
          createdAt: { lte: cutoffTime },
          // تأكد ما أرسلنا لهم حملة على نفس السيناريو
          campaigns: {
            none: {
              scenarioId: scenario.id,
              status: { in: ["SENT", "PENDING", "CONVERTED"] },
            },
          },
        },
      });

      log.info(`سيناريو "${scenario.name}": وُجد ${eligibleCustomers.length} عميل مؤهل`);

      for (const customer of eligibleCustomers) {
        try {
          await createCampaignWithCoupon(
            scenario.id,
            scenario.storeId,
            customer.id,
            scenario.couponPrefix || "CART",
            scenario.discountType,
            scenario.discountValue,
            expiryDays,
            scenario.messageTemplate,
            scenario.channel,
            customer.name
          );
          result.campaignsCreated++;
        } catch (err) {
          const msg = `فشل إنشاء حملة للعميل ${customer.id}: ${err instanceof Error ? err.message : err}`;
          result.errors.push(msg);
          log.error(msg, err);
        }
      }
    } catch (err) {
      const msg = `فشل معالجة سيناريو ${scenario.id}: ${err instanceof Error ? err.message : err}`;
      result.errors.push(msg);
      log.error(msg, err);
    }

    results.push(result);
  }

  log.success(`فحص السلات المتروكة اكتمل: ${results.reduce((s, r) => s + r.campaignsCreated, 0)} حملة`);
  return results;
}

// =============================================
// 2. العملاء الخاملين
// =============================================

export async function checkDormantCustomers(): Promise<ScenarioResult[]> {
  log.info("بدء فحص العملاء الخاملين...");
  const results: ScenarioResult[] = [];

  const scenarios = await prisma.scenario.findMany({
    where: { type: "DORMANT", isActive: true },
    include: { store: true },
  });

  for (const scenario of scenarios) {
    const result: ScenarioResult = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      campaignsCreated: 0,
      errors: [],
    };

    try {
      const trigger = parseTrigger(scenario.trigger);
      const dormantDays = trigger.dormantDays ?? 30;
      const expiryDays = trigger.couponExpiryDays ?? 7;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dormantDays);

      // العملاء اللي عندهم طلبات سابقة لكن ما طلبوا من فترة
      const dormantCustomers = await prisma.customer.findMany({
        where: {
          storeId: scenario.storeId,
          totalOrders: { gte: 1 },
          lastOrderDate: { lte: cutoffDate },
          // ما أرسلنا لهم عرض "عميل غايب" خلال آخر فترة الغياب المحددة
          campaigns: {
            none: {
              scenarioId: scenario.id,
              createdAt: { gte: cutoffDate },
            },
          },
        },
      });

      log.info(`سيناريو "${scenario.name}": وُجد ${dormantCustomers.length} عميل خامل`);

      for (const customer of dormantCustomers) {
        try {
          await createCampaignWithCoupon(
            scenario.id,
            scenario.storeId,
            customer.id,
            scenario.couponPrefix || "BACK",
            scenario.discountType,
            scenario.discountValue,
            expiryDays,
            scenario.messageTemplate,
            scenario.channel,
            customer.name
          );
          result.campaignsCreated++;

          // حدّث تصنيف العميل إلى خامل
          await prisma.customer.update({
            where: { id: customer.id },
            data: { segment: "DORMANT" },
          });
        } catch (err) {
          const msg = `فشل إنشاء حملة للعميل ${customer.id}: ${err instanceof Error ? err.message : err}`;
          result.errors.push(msg);
          log.error(msg, err);
        }
      }
    } catch (err) {
      const msg = `فشل معالجة سيناريو ${scenario.id}: ${err instanceof Error ? err.message : err}`;
      result.errors.push(msg);
      log.error(msg, err);
    }

    results.push(result);
  }

  log.success(`فحص العملاء الخاملين اكتمل: ${results.reduce((s, r) => s + r.campaignsCreated, 0)} حملة`);
  return results;
}

// =============================================
// 3. العملاء الجدد (ترحيب)
// =============================================

export async function checkNewCustomers(): Promise<ScenarioResult[]> {
  log.info("بدء فحص العملاء الجدد...");
  const results: ScenarioResult[] = [];

  const scenarios = await prisma.scenario.findMany({
    where: { type: "WELCOME", isActive: true },
    include: { store: true },
  });

  for (const scenario of scenarios) {
    const result: ScenarioResult = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      campaignsCreated: 0,
      errors: [],
    };

    try {
      const trigger = parseTrigger(scenario.trigger);
      const expiryDays = trigger.couponExpiryDays ?? 7;

      // وقت الانتظار بعد التسجيل قبل الإرسال
      const waitMinutes = trigger.waitMinutes ?? scenario.waitDuration ?? 5;
      const cutoffTime = new Date(Date.now() - waitMinutes * 60 * 1000);

      // العملاء الجدد اللي سجّلوا ومر عليهم وقت الانتظار وما اشتروا
      const newCustomers = await prisma.customer.findMany({
        where: {
          storeId: scenario.storeId,
          segment: "NEW",
          totalOrders: 0,
          createdAt: { lte: cutoffTime },
          // ما أرسلنا لهم رسالة ترحيب قبل
          campaigns: {
            none: {
              scenarioId: scenario.id,
            },
          },
        },
      });

      log.info(`سيناريو "${scenario.name}": وُجد ${newCustomers.length} عميل جديد`);

      for (const customer of newCustomers) {
        try {
          await createCampaignWithCoupon(
            scenario.id,
            scenario.storeId,
            customer.id,
            scenario.couponPrefix || "WELCOME",
            scenario.discountType,
            scenario.discountValue,
            expiryDays,
            scenario.messageTemplate,
            scenario.channel,
            customer.name
          );
          result.campaignsCreated++;
        } catch (err) {
          const msg = `فشل إنشاء حملة للعميل ${customer.id}: ${err instanceof Error ? err.message : err}`;
          result.errors.push(msg);
          log.error(msg, err);
        }
      }
    } catch (err) {
      const msg = `فشل معالجة سيناريو ${scenario.id}: ${err instanceof Error ? err.message : err}`;
      result.errors.push(msg);
      log.error(msg, err);
    }

    results.push(result);
  }

  log.success(`فحص العملاء الجدد اكتمل: ${results.reduce((s, r) => s + r.campaignsCreated, 0)} حملة`);
  return results;
}

// =============================================
// 4. عملاء VIP
// =============================================

export async function checkVIPCustomers(): Promise<ScenarioResult[]> {
  log.info("بدء فحص عملاء VIP...");
  const results: ScenarioResult[] = [];

  const scenarios = await prisma.scenario.findMany({
    where: { type: "VIP", isActive: true },
    include: { store: true },
  });

  for (const scenario of scenarios) {
    const result: ScenarioResult = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      campaignsCreated: 0,
      errors: [],
    };

    try {
      const trigger = parseTrigger(scenario.trigger);
      const minSpent = trigger.vipMinSpent ?? 5000;
      const minOrders = trigger.vipMinOrders ?? 10;
      const expiryDays = trigger.couponExpiryDays ?? 14;

      // أولاً: حدّث تصنيف العملاء اللي وصلوا حد VIP
      await prisma.customer.updateMany({
        where: {
          storeId: scenario.storeId,
          segment: { not: "VIP" },
          OR: [
            { totalSpent: { gte: minSpent } },
            { totalOrders: { gte: minOrders } },
          ],
        },
        data: { segment: "VIP" },
      });

      // جلب عملاء VIP اللي ما أرسلنا لهم عرض VIP خلال آخر 30 يوم
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const vipCustomers = await prisma.customer.findMany({
        where: {
          storeId: scenario.storeId,
          segment: "VIP",
          campaigns: {
            none: {
              scenarioId: scenario.id,
              createdAt: { gte: thirtyDaysAgo },
            },
          },
        },
      });

      log.info(`سيناريو "${scenario.name}": وُجد ${vipCustomers.length} عميل VIP مؤهل`);

      for (const customer of vipCustomers) {
        try {
          await createCampaignWithCoupon(
            scenario.id,
            scenario.storeId,
            customer.id,
            scenario.couponPrefix || "VIP",
            scenario.discountType,
            scenario.discountValue,
            expiryDays,
            scenario.messageTemplate,
            scenario.channel,
            customer.name
          );
          result.campaignsCreated++;
        } catch (err) {
          const msg = `فشل إنشاء حملة للعميل ${customer.id}: ${err instanceof Error ? err.message : err}`;
          result.errors.push(msg);
          log.error(msg, err);
        }
      }
    } catch (err) {
      const msg = `فشل معالجة سيناريو ${scenario.id}: ${err instanceof Error ? err.message : err}`;
      result.errors.push(msg);
      log.error(msg, err);
    }

    results.push(result);
  }

  log.success(`فحص عملاء VIP اكتمل: ${results.reduce((s, r) => s + r.campaignsCreated, 0)} حملة`);
  return results;
}

// =============================================
// 5. أعياد الميلاد
// =============================================

export async function checkBirthdays(): Promise<ScenarioResult[]> {
  log.info("بدء فحص أعياد الميلاد...");
  const results: ScenarioResult[] = [];

  const scenarios = await prisma.scenario.findMany({
    where: { type: "BIRTHDAY", isActive: true },
    include: { store: true },
  });

  for (const scenario of scenarios) {
    const result: ScenarioResult = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      campaignsCreated: 0,
      errors: [],
    };

    try {
      const trigger = parseTrigger(scenario.trigger);
      const daysBefore = trigger.birthdayDaysBefore ?? 1;
      const expiryDays = trigger.couponExpiryDays ?? 7;

      // حساب التاريخ المستهدف (اليوم + عدد الأيام قبل الميلاد)
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBefore);
      const targetMonth = targetDate.getMonth() + 1; // 1-indexed
      const targetDay = targetDate.getDate();

      // جلب كل عملاء المتجر اللي عندهم تاريخ ميلاد
      const allCustomersWithBirthday = await prisma.customer.findMany({
        where: {
          storeId: scenario.storeId,
          birthday: { not: null },
        },
      });

      // فلتر يدوي حسب اليوم والشهر (Prisma ما يدعم EXTRACT مباشرة)
      const birthdayCustomers = allCustomersWithBirthday.filter((c) => {
        if (!c.birthday) return false;
        const bday = new Date(c.birthday);
        return bday.getMonth() + 1 === targetMonth && bday.getDate() === targetDay;
      });

      // استبعد اللي أرسلنا لهم هالسنة
      const yearStart = new Date(targetDate.getFullYear(), 0, 1);

      const eligibleCustomers: typeof birthdayCustomers = [];
      for (const customer of birthdayCustomers) {
        const existingCampaign = await prisma.campaign.findFirst({
          where: {
            scenarioId: scenario.id,
            customerId: customer.id,
            createdAt: { gte: yearStart },
          },
        });
        if (!existingCampaign) {
          eligibleCustomers.push(customer);
        }
      }

      log.info(`سيناريو "${scenario.name}": وُجد ${eligibleCustomers.length} عميل عيد ميلاده ${daysBefore === 0 ? "اليوم" : "قريب"}`);

      for (const customer of eligibleCustomers) {
        try {
          await createCampaignWithCoupon(
            scenario.id,
            scenario.storeId,
            customer.id,
            scenario.couponPrefix || "BDAY",
            scenario.discountType,
            scenario.discountValue,
            expiryDays,
            scenario.messageTemplate,
            scenario.channel,
            customer.name
          );
          result.campaignsCreated++;
        } catch (err) {
          const msg = `فشل إنشاء حملة للعميل ${customer.id}: ${err instanceof Error ? err.message : err}`;
          result.errors.push(msg);
          log.error(msg, err);
        }
      }
    } catch (err) {
      const msg = `فشل معالجة سيناريو ${scenario.id}: ${err instanceof Error ? err.message : err}`;
      result.errors.push(msg);
      log.error(msg, err);
    }

    results.push(result);
  }

  log.success(`فحص أعياد الميلاد اكتمل: ${results.reduce((s, r) => s + r.campaignsCreated, 0)} حملة`);
  return results;
}

// =============================================
// تشغيل كل السيناريوهات
// =============================================

export async function runAllScenarios(): Promise<EngineRunResult> {
  const startedAt = new Date();
  log.info("═══════════════════════════════════════");
  log.info("بدء تشغيل محرك السيناريوهات...");
  log.info(`الوقت: ${startedAt.toISOString()}`);
  log.info("═══════════════════════════════════════");

  const allResults: ScenarioResult[] = [];

  // تشغيل كل نوع بالتسلسل لتجنب race conditions
  const runners = [
    { name: "السلات المتروكة", fn: checkAbandonedCarts },
    { name: "العملاء الخاملين", fn: checkDormantCustomers },
    { name: "العملاء الجدد", fn: checkNewCustomers },
    { name: "عملاء VIP", fn: checkVIPCustomers },
    { name: "أعياد الميلاد", fn: checkBirthdays },
  ];

  for (const runner of runners) {
    try {
      log.info(`─── ${runner.name} ───`);
      const results = await runner.fn();
      allResults.push(...results);
    } catch (err) {
      log.error(`فشل تشغيل ${runner.name}`, err);
      allResults.push({
        scenarioId: "unknown",
        scenarioName: runner.name,
        campaignsCreated: 0,
        errors: [err instanceof Error ? err.message : String(err)],
      });
    }
  }

  const finishedAt = new Date();
  const totalCampaigns = allResults.reduce((sum, r) => sum + r.campaignsCreated, 0);
  const totalErrors = allResults.reduce((sum, r) => sum + r.errors.length, 0);
  const durationMs = finishedAt.getTime() - startedAt.getTime();

  log.info("═══════════════════════════════════════");
  log.success(`محرك السيناريوهات اكتمل في ${durationMs}ms`, {
    totalCampaigns,
    totalErrors,
    scenariosProcessed: allResults.length,
  });
  if (totalErrors > 0) {
    log.warn(`عدد الأخطاء: ${totalErrors}`);
  }
  log.info("═══════════════════════════════════════");

  return {
    startedAt,
    finishedAt,
    results: allResults,
    totalCampaigns,
    totalErrors,
  };
}
