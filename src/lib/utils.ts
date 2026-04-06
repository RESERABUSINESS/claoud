import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function getDiscountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    PERCENTAGE: "نسبة مئوية",
    FIXED: "مبلغ ثابت",
    FREE_SHIPPING: "شحن مجاني",
  };
  return labels[type] || type;
}

export function getScenarioTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ABANDONED_CART: "سلة متروكة",
    DORMANT: "عميل خامل",
    WELCOME: "ترحيب",
    VIP: "عميل مميز",
    BIRTHDAY: "عيد ميلاد",
  };
  return labels[type] || type;
}

export function getSegmentLabel(segment: string): string {
  const labels: Record<string, string> = {
    NEW: "جديد",
    ACTIVE: "نشط",
    DORMANT: "خامل",
    VIP: "مميز",
  };
  return labels[segment] || segment;
}

export function getChannelLabel(channel: string): string {
  const labels: Record<string, string> = {
    WHATSAPP: "واتساب",
    SMS: "رسالة نصية",
    EMAIL: "بريد إلكتروني",
  };
  return labels[channel] || channel;
}

export function getCampaignStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "بانتظار الإرسال",
    SENT: "تم الإرسال",
    OPENED: "تم الفتح",
    CONVERTED: "تم التحويل",
    EXPIRED: "منتهي",
  };
  return labels[status] || status;
}
