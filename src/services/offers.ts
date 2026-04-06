import { prisma } from "@/lib/prisma";
import type { CreateOfferInput } from "@/types";

export async function getOffersByStore(storeId: string) {
  return prisma.offer.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOfferById(id: string) {
  return prisma.offer.findUnique({
    where: { id },
    include: { redemptions: true },
  });
}

export async function createOffer(input: CreateOfferInput) {
  return prisma.offer.create({
    data: {
      storeId: input.storeId,
      name: input.name,
      description: input.description,
      type: input.type,
      value: input.value,
      minOrderAmount: input.minOrderAmount,
      maxDiscount: input.maxDiscount,
      code: input.code,
      startsAt: new Date(input.startsAt),
      endsAt: input.endsAt ? new Date(input.endsAt) : null,
      conditions: input.conditions ? JSON.parse(JSON.stringify(input.conditions)) : undefined,
      usageLimit: input.usageLimit,
    },
  });
}

export async function updateOffer(id: string, data: Partial<CreateOfferInput>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { storeId, startsAt, endsAt, conditions, ...rest } = data;
  return prisma.offer.update({
    where: { id },
    data: {
      ...rest,
      ...(startsAt && { startsAt: new Date(startsAt) }),
      ...(endsAt && { endsAt: new Date(endsAt) }),
      ...(conditions && { conditions: JSON.parse(JSON.stringify(conditions)) }),
    },
  });
}

export async function deleteOffer(id: string) {
  return prisma.offer.delete({ where: { id } });
}

export async function validateOffer(code: string, storeId: string, orderAmount: number) {
  const offer = await prisma.offer.findFirst({
    where: {
      code,
      storeId,
      isActive: true,
      startsAt: { lte: new Date() },
      OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
    },
  });

  if (!offer) return { valid: false, error: "العرض غير موجود أو منتهي" };

  if (offer.usageLimit && offer.usageCount >= offer.usageLimit) {
    return { valid: false, error: "تم تجاوز حد الاستخدام" };
  }

  if (offer.minOrderAmount && orderAmount < offer.minOrderAmount) {
    return { valid: false, error: `الحد الأدنى للطلب ${offer.minOrderAmount} ريال` };
  }

  let discount = 0;
  if (offer.type === "PERCENTAGE") {
    discount = (orderAmount * offer.value) / 100;
    if (offer.maxDiscount) discount = Math.min(discount, offer.maxDiscount);
  } else if (offer.type === "FIXED") {
    discount = offer.value;
  }

  return { valid: true, offer, discount };
}
