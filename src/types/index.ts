// =============================================
// Enums
// =============================================

export type Platform = "SALLA" | "ZID" | "SHOPIFY";
export type CustomerSegment = "NEW" | "ACTIVE" | "DORMANT" | "VIP";
export type ScenarioType = "ABANDONED_CART" | "DORMANT" | "WELCOME" | "VIP" | "BIRTHDAY";
export type DiscountType = "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
export type Channel = "WHATSAPP" | "SMS" | "EMAIL";
export type CampaignStatus = "PENDING" | "SENT" | "OPENED" | "CONVERTED" | "EXPIRED";

// =============================================
// Models
// =============================================

export interface Store {
  id: string;
  name: string;
  platform: Platform;
  apiKey: string;
  apiSecret: string;
  webhookUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface Customer {
  id: string;
  storeId: string;
  externalId: string;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: Date | null;
  birthday?: Date | null;
  segment: CustomerSegment;
  createdAt: Date;
}

export interface Scenario {
  id: string;
  storeId: string;
  name: string;
  type: ScenarioType;
  isActive: boolean;
  trigger: Record<string, unknown>;
  action: Record<string, unknown>;
  discountType: DiscountType;
  discountValue: number;
  couponPrefix?: string | null;
  messageTemplate: string;
  waitDuration: number;
  channel: Channel;
  createdAt: Date;
}

export interface Campaign {
  id: string;
  scenarioId: string;
  customerId: string;
  couponCode?: string | null;
  status: CampaignStatus;
  sentAt?: Date | null;
  openedAt?: Date | null;
  convertedAt?: Date | null;
  revenue: number;
  createdAt: Date;
}

export interface Coupon {
  id: string;
  storeId: string;
  campaignId: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  expiresAt?: Date | null;
  isUsed: boolean;
  usedAt?: Date | null;
  createdAt: Date;
}

// =============================================
// API Inputs
// =============================================

export interface CreateScenarioInput {
  storeId: string;
  name: string;
  type: ScenarioType;
  trigger: Record<string, unknown>;
  action: Record<string, unknown>;
  discountType: DiscountType;
  discountValue: number;
  couponPrefix?: string;
  messageTemplate: string;
  waitDuration?: number;
  channel?: Channel;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
