export type OfferType = "PERCENTAGE" | "FIXED" | "BUY_X_GET_Y" | "FREE_SHIPPING";

export interface Store {
  id: string;
  name: string;
  domain: string;
  apiKey: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Offer {
  id: string;
  storeId: string;
  name: string;
  description?: string | null;
  type: OfferType;
  value: number;
  minOrderAmount?: number | null;
  maxDiscount?: number | null;
  code?: string | null;
  isActive: boolean;
  startsAt: Date;
  endsAt?: Date | null;
  conditions?: Record<string, unknown> | null;
  usageLimit?: number | null;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  storeId: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  totalOrders: number;
  totalSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Redemption {
  id: string;
  offerId: string;
  customerId: string;
  orderAmount: number;
  discount: number;
  createdAt: Date;
}

export interface CreateOfferInput {
  storeId: string;
  name: string;
  description?: string;
  type: OfferType;
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  code?: string;
  startsAt: string;
  endsAt?: string;
  conditions?: Record<string, unknown>;
  usageLimit?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
