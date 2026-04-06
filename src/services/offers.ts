import { prisma } from "@/lib/prisma";
import type { CreateScenarioInput } from "@/types";

// =============================================
// السيناريوهات
// =============================================

export async function getScenariosByStore(storeId: string) {
  return prisma.scenario.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getScenarioById(id: string) {
  return prisma.scenario.findUnique({
    where: { id },
    include: { campaigns: { take: 10, orderBy: { createdAt: "desc" } } },
  });
}

export async function createScenario(input: CreateScenarioInput) {
  return prisma.scenario.create({
    data: {
      storeId: input.storeId,
      name: input.name,
      type: input.type,
      trigger: JSON.parse(JSON.stringify(input.trigger)),
      action: JSON.parse(JSON.stringify(input.action)),
      discountType: input.discountType,
      discountValue: input.discountValue,
      couponPrefix: input.couponPrefix,
      messageTemplate: input.messageTemplate,
      waitDuration: input.waitDuration ?? 0,
      channel: input.channel ?? "WHATSAPP",
    },
  });
}

export async function toggleScenario(id: string, isActive: boolean) {
  return prisma.scenario.update({
    where: { id },
    data: { isActive },
  });
}

export async function deleteScenario(id: string) {
  return prisma.scenario.delete({ where: { id } });
}

// =============================================
// الحملات
// =============================================

export async function getCampaignsByScenario(scenarioId: string) {
  return prisma.campaign.findMany({
    where: { scenarioId },
    include: { customer: true, coupon: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateCampaignStatus(
  id: string,
  status: "SENT" | "OPENED" | "CONVERTED" | "EXPIRED",
  revenue?: number
) {
  const now = new Date();
  return prisma.campaign.update({
    where: { id },
    data: {
      status,
      ...(status === "SENT" && { sentAt: now }),
      ...(status === "OPENED" && { openedAt: now }),
      ...(status === "CONVERTED" && { convertedAt: now, revenue: revenue ?? 0 }),
    },
  });
}

// =============================================
// الكوبونات
// =============================================

export async function validateCoupon(code: string, storeId: string) {
  const coupon = await prisma.coupon.findUnique({
    where: { storeId_code: { storeId, code } },
    include: { campaign: { include: { scenario: true } } },
  });

  if (!coupon) return { valid: false, error: "الكوبون غير موجود" };
  if (coupon.isUsed) return { valid: false, error: "الكوبون مستخدم مسبقاً" };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { valid: false, error: "الكوبون منتهي الصلاحية" };
  }

  return {
    valid: true,
    coupon,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
  };
}

export async function redeemCoupon(code: string, storeId: string, revenue: number) {
  const coupon = await prisma.coupon.update({
    where: { storeId_code: { storeId, code } },
    data: { isUsed: true, usedAt: new Date() },
  });

  await prisma.campaign.update({
    where: { id: coupon.campaignId },
    data: { status: "CONVERTED", convertedAt: new Date(), revenue },
  });

  return coupon;
}
