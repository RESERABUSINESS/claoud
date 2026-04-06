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

export function getOfferTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    PERCENTAGE: "نسبة مئوية",
    FIXED: "مبلغ ثابت",
    BUY_X_GET_Y: "اشتري واحصل",
    FREE_SHIPPING: "شحن مجاني",
  };
  return labels[type] || type;
}
