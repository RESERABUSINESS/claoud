import { prisma } from "@/lib/prisma";
import type { Platform } from "@/types";

// =============================================
// أنواع البيانات
// =============================================

interface ExternalCustomer {
  externalId: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: Date | null;
  birthday: Date | null;
}

interface SyncResult {
  storeId: string;
  storeName: string;
  platform: string;
  customersCreated: number;
  customersUpdated: number;
  segmentsUpdated: number;
  errors: string[];
}

// =============================================
// Logger
// =============================================

const log = {
  info: (msg: string, data?: Record<string, unknown>) =>
    console.log(`[CustomerSync] ℹ️  ${msg}`, data ? JSON.stringify(data) : ""),
  success: (msg: string, data?: Record<string, unknown>) =>
    console.log(`[CustomerSync] ✅ ${msg}`, data ? JSON.stringify(data) : ""),
  warn: (msg: string) =>
    console.warn(`[CustomerSync] ⚠️  ${msg}`),
  error: (msg: string, err?: unknown) =>
    console.error(`[CustomerSync] ❌ ${msg}`, err instanceof Error ? err.message : err),
};

// =============================================
// محولات المنصات (Platform Adapters)
// =============================================

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function fetchCustomersFromSalla(apiKey: string, apiSecret: string): Promise<ExternalCustomer[]> {
  // TODO: ربط بـ Salla API
  // GET https://api.salla.dev/admin/v2/customers
  log.info("جلب العملاء من Salla...", { apiKey: apiKey.slice(0, 8) + "..." });

  // placeholder — يرجع مصفوفة فاضية حتى يتم الربط
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function fetchCustomersFromZid(apiKey: string, apiSecret: string): Promise<ExternalCustomer[]> {
  // TODO: ربط بـ Zid API
  // GET https://api.zid.sa/v1/customers
  log.info("جلب العملاء من Zid...", { apiKey: apiKey.slice(0, 8) + "..." });

  return [];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function fetchCustomersFromShopify(apiKey: string, apiSecret: string): Promise<ExternalCustomer[]> {
  // TODO: ربط بـ Shopify Admin API
  // GET https://{store}.myshopify.com/admin/api/2024-01/customers.json
  log.info("جلب العملاء من Shopify...", { apiKey: apiKey.slice(0, 8) + "..." });

  return [];
}

async function fetchCustomersFromPlatform(
  platform: Platform,
  apiKey: string,
  apiSecret: string
): Promise<ExternalCustomer[]> {
  switch (platform) {
    case "SALLA":
      return fetchCustomersFromSalla(apiKey, apiSecret);
    case "ZID":
      return fetchCustomersFromZid(apiKey, apiSecret);
    case "SHOPIFY":
      return fetchCustomersFromShopify(apiKey, apiSecret);
    default:
      throw new Error(`منصة غير مدعومة: ${platform}`);
  }
}

// =============================================
// تحديث تصنيف العميل (Segment)
// =============================================

interface SegmentRules {
  vipMinSpent: number;
  vipMinOrders: number;
  dormantDays: number;
}

function calculateSegment(
  totalOrders: number,
  totalSpent: number,
  lastOrderDate: Date | null,
  rules: SegmentRules
): "NEW" | "ACTIVE" | "DORMANT" | "VIP" {
  // VIP: صرف كثير أو طلبات كثيرة
  if (totalSpent >= rules.vipMinSpent || totalOrders >= rules.vipMinOrders) {
    return "VIP";
  }

  // جديد: ما طلب أي طلب
  if (totalOrders === 0) {
    return "NEW";
  }

  // خامل: طلب قبل لكن ما طلب من فترة
  if (lastOrderDate) {
    const daysSinceLastOrder = Math.floor(
      (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastOrder >= rules.dormantDays) {
      return "DORMANT";
    }
  }

  // نشط: يطلب بانتظام
  return "ACTIVE";
}

// =============================================
// مزامنة عملاء متجر واحد
// =============================================

async function syncStoreCustomers(
  storeId: string,
  storeName: string,
  platform: Platform,
  apiKey: string,
  apiSecret: string
): Promise<SyncResult> {
  const result: SyncResult = {
    storeId,
    storeName,
    platform,
    customersCreated: 0,
    customersUpdated: 0,
    segmentsUpdated: 0,
    errors: [],
  };

  try {
    // 1. جلب العملاء من المنصة
    const externalCustomers = await fetchCustomersFromPlatform(platform, apiKey, apiSecret);
    log.info(`${storeName}: جلب ${externalCustomers.length} عميل من ${platform}`);

    // 2. قواعد التصنيف (يمكن تخصيصها لاحقاً من إعدادات المتجر)
    const segmentRules: SegmentRules = {
      vipMinSpent: 5000,
      vipMinOrders: 10,
      dormantDays: 30,
    };

    // 3. معالجة كل عميل
    for (const ext of externalCustomers) {
      try {
        const existing = await prisma.customer.findUnique({
          where: { storeId_externalId: { storeId, externalId: ext.externalId } },
        });

        const newSegment = calculateSegment(
          ext.totalOrders,
          ext.totalSpent,
          ext.lastOrderDate,
          segmentRules
        );

        if (existing) {
          // تحديث بيانات العميل الموجود
          const segmentChanged = existing.segment !== newSegment;

          await prisma.customer.update({
            where: { id: existing.id },
            data: {
              name: ext.name ?? existing.name,
              email: ext.email ?? existing.email,
              phone: ext.phone ?? existing.phone,
              totalOrders: ext.totalOrders,
              totalSpent: ext.totalSpent,
              lastOrderDate: ext.lastOrderDate,
              birthday: ext.birthday ?? existing.birthday,
              segment: newSegment,
            },
          });

          result.customersUpdated++;
          if (segmentChanged) result.segmentsUpdated++;
        } else {
          // إنشاء عميل جديد
          await prisma.customer.create({
            data: {
              storeId,
              externalId: ext.externalId,
              name: ext.name,
              email: ext.email,
              phone: ext.phone,
              totalOrders: ext.totalOrders,
              totalSpent: ext.totalSpent,
              lastOrderDate: ext.lastOrderDate,
              birthday: ext.birthday,
              segment: newSegment,
            },
          });

          result.customersCreated++;
        }
      } catch (err) {
        const msg = `فشل معالجة العميل ${ext.externalId}: ${err instanceof Error ? err.message : err}`;
        result.errors.push(msg);
        log.error(msg, err);
      }
    }

    // 4. تحديث تصنيفات العملاء الحاليين (حتى لو ما جاءوا في المزامنة)
    const allStoreCustomers = await prisma.customer.findMany({
      where: { storeId },
    });

    let bulkSegmentUpdates = 0;
    for (const customer of allStoreCustomers) {
      const correctSegment = calculateSegment(
        customer.totalOrders,
        customer.totalSpent,
        customer.lastOrderDate,
        segmentRules
      );

      if (customer.segment !== correctSegment) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { segment: correctSegment },
        });
        bulkSegmentUpdates++;
      }
    }

    result.segmentsUpdated += bulkSegmentUpdates;

  } catch (err) {
    const msg = `فشل مزامنة متجر ${storeName}: ${err instanceof Error ? err.message : err}`;
    result.errors.push(msg);
    log.error(msg, err);
  }

  return result;
}

// =============================================
// مزامنة كل المتاجر
// =============================================

export async function syncAllCustomers(): Promise<{
  startedAt: Date;
  finishedAt: Date;
  results: SyncResult[];
  totals: {
    storesProcessed: number;
    customersCreated: number;
    customersUpdated: number;
    segmentsUpdated: number;
    errors: number;
  };
}> {
  const startedAt = new Date();
  log.info("═══════════════════════════════════════");
  log.info("بدء مزامنة العملاء...");
  log.info("═══════════════════════════════════════");

  const stores = await prisma.store.findMany({
    where: { isActive: true },
  });

  log.info(`عدد المتاجر النشطة: ${stores.length}`);

  const results: SyncResult[] = [];

  for (const store of stores) {
    log.info(`─── مزامنة: ${store.name} (${store.platform}) ───`);
    const result = await syncStoreCustomers(
      store.id,
      store.name,
      store.platform as Platform,
      store.apiKey,
      store.apiSecret
    );
    results.push(result);

    log.success(`${store.name}: +${result.customersCreated} جديد، ~${result.customersUpdated} محدّث، ${result.segmentsUpdated} تصنيف`);
  }

  const finishedAt = new Date();

  const totals = {
    storesProcessed: results.length,
    customersCreated: results.reduce((s, r) => s + r.customersCreated, 0),
    customersUpdated: results.reduce((s, r) => s + r.customersUpdated, 0),
    segmentsUpdated: results.reduce((s, r) => s + r.segmentsUpdated, 0),
    errors: results.reduce((s, r) => s + r.errors.length, 0),
  };

  const durationMs = finishedAt.getTime() - startedAt.getTime();
  log.info("═══════════════════════════════════════");
  log.success(`مزامنة العملاء اكتملت في ${durationMs}ms`, totals as unknown as Record<string, unknown>);
  log.info("═══════════════════════════════════════");

  return { startedAt, finishedAt, results, totals };
}
