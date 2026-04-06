import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// =============================================
// إعدادات سلة
// =============================================

const SALLA_ACCOUNTS_URL = "https://accounts.salla.sa";
const SALLA_API_URL = "https://api.salla.dev/admin/v2";

// =============================================
// أنواع البيانات
// =============================================

export interface SallaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

interface SallaApiResponse<T> {
  status: number;
  success: boolean;
  data: T;
  pagination?: {
    count: number;
    total: number;
    perPage: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface SallaProduct {
  id: number;
  name: string;
  price: { amount: number; currency: string };
  status: string;
  quantity: number;
  sku: string | null;
  thumbnail: string | null;
}

export interface SallaOrder {
  id: number;
  reference_id: string;
  status: { id: number; name: string; slug: string };
  amounts: { total: { amount: number }; cash_on_delivery: { amount: number } };
  customer: { id: number; first_name: string; last_name: string; mobile: string; email: string };
  date: { date: string; timezone: string };
  items: { id: number; name: string; quantity: number; price: { amount: number } }[];
}

export interface SallaCustomer {
  id: number;
  first_name: string;
  last_name: string;
  mobile: string;
  mobile_code: string;
  email: string;
  gender: string | null;
  birthday: string | null;
  city: string | null;
  country: string | null;
  orders_count: number;
  total_spent: number;
  updated_at: { date: string };
  created_at: { date: string };
}

export interface SallaAbandonedCart {
  id: number;
  customer: { id: number; name: string; mobile: string; email: string } | null;
  items: { id: number; product_id: number; name: string; quantity: number; price: number }[];
  total: { amount: number };
  created_at: { date: string };
}

export interface SallaCoupon {
  id: number;
  code: string;
  type: string;
  amount: number;
  status: string;
  usage_count: number;
  start_date: string;
  expiry_date: string;
}

export interface SallaWebhookEvent {
  event: string;
  merchant: number;
  created_at: string;
  data: Record<string, unknown>;
}

// =============================================
// SallaClient
// =============================================

export class SallaClient {
  private accessToken: string;
  private refreshToken: string;
  private storeId: string;

  constructor(storeId: string, accessToken: string, refreshToken: string) {
    this.storeId = storeId;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  // ─── HTTP Helper ───────────────────────────

  private async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    body?: Record<string, unknown>,
    params?: Record<string, string>
  ): Promise<SallaApiResponse<T>> {
    const url = new URL(`${SALLA_API_URL}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    // التوكن منتهي — حاول تجدده
    if (response.status === 401) {
      await this.refreshAccessToken();

      const retryResponse = await fetch(url.toString(), {
        method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      if (!retryResponse.ok) {
        throw new Error(`Salla API Error: ${retryResponse.status} ${retryResponse.statusText}`);
      }
      return retryResponse.json();
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Salla API Error: ${response.status} — ${errorBody}`);
    }

    return response.json();
  }

  // ─── OAuth & Authentication ────────────────

  /**
   * رابط صفحة التصريح — يوجّه المستخدم لسلة للموافقة
   */
  static getAuthorizationUrl(redirectUri: string, state: string): string {
    const clientId = process.env.SALLA_CLIENT_ID!;
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: "offline_access customers.read orders.read carts.read coupons.read.write products.read",
      state,
    });
    return `${SALLA_ACCOUNTS_URL}/oauth2/auth?${params.toString()}`;
  }

  /**
   * استبدال الـ code بتوكنات الوصول
   */
  static async exchangeCodeForTokens(code: string, redirectUri: string): Promise<SallaTokens> {
    const response = await fetch(`${SALLA_ACCOUNTS_URL}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.SALLA_CLIENT_ID,
        client_secret: process.env.SALLA_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`فشل الحصول على التوكن: ${error}`);
    }

    const data = await response.json();

    // التوكن صالح 14 يوم
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (data.expires_in || 1209600));

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt,
    };
  }

  /**
   * تجديد التوكن — الـ refresh token صالح شهر واحد
   * تنبيه: كل refresh token يُستخدم مرة واحدة فقط
   */
  private async refreshAccessToken(): Promise<void> {
    const response = await fetch(`${SALLA_ACCOUNTS_URL}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.SALLA_CLIENT_ID,
        client_secret: process.env.SALLA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error("فشل تجديد التوكن — قد تحتاج إعادة ربط المتجر");
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (data.expires_in || 1209600));

    // حفظ التوكنات الجديدة في قاعدة البيانات
    await prisma.store.update({
      where: { id: this.storeId },
      data: {
        apiKey: this.accessToken,
        apiSecret: this.refreshToken,
      },
    });

    console.log(`[Salla] تم تجديد التوكن للمتجر ${this.storeId}`);
  }

  /**
   * جلب معلومات المتجر المربوط
   */
  async getStoreInfo(): Promise<Record<string, unknown>> {
    const res = await this.request<Record<string, unknown>>("GET", "/store/info");
    return res.data;
  }

  // ─── المنتجات ──────────────────────────────

  /**
   * جلب المنتجات
   * GET /products
   * Rate limit: 500 requests / 10 min
   */
  async getProducts(page = 1, perPage = 20): Promise<{
    products: SallaProduct[];
    total: number;
    totalPages: number;
  }> {
    const res = await this.request<SallaProduct[]>("GET", "/products", undefined, {
      page: String(page),
      per_page: String(perPage),
    });

    return {
      products: res.data,
      total: res.pagination?.total ?? 0,
      totalPages: res.pagination?.totalPages ?? 1,
    };
  }

  // ─── الطلبات ───────────────────────────────

  /**
   * جلب الطلبات
   * GET /orders
   */
  async getOrders(page = 1, status?: string): Promise<{
    orders: SallaOrder[];
    total: number;
    totalPages: number;
  }> {
    const params: Record<string, string> = { page: String(page) };
    if (status) params.status = status;

    const res = await this.request<SallaOrder[]>("GET", "/orders", undefined, params);

    return {
      orders: res.data,
      total: res.pagination?.total ?? 0,
      totalPages: res.pagination?.totalPages ?? 1,
    };
  }

  /**
   * جلب تفاصيل طلب معين
   * GET /orders/{id}
   */
  async getOrder(orderId: number): Promise<SallaOrder> {
    const res = await this.request<SallaOrder>("GET", `/orders/${orderId}`);
    return res.data;
  }

  // ─── العملاء ───────────────────────────────

  /**
   * جلب العملاء
   * GET /customers
   * Rate limit: 500 requests / 10 min
   */
  async getCustomers(page = 1, perPage = 20): Promise<{
    customers: SallaCustomer[];
    total: number;
    totalPages: number;
  }> {
    const res = await this.request<SallaCustomer[]>("GET", "/customers", undefined, {
      page: String(page),
      per_page: String(perPage),
    });

    return {
      customers: res.data,
      total: res.pagination?.total ?? 0,
      totalPages: res.pagination?.totalPages ?? 1,
    };
  }

  /**
   * جلب كل العملاء (كل الصفحات)
   */
  async getAllCustomers(): Promise<SallaCustomer[]> {
    const allCustomers: SallaCustomer[] = [];
    let page = 1;

    while (true) {
      const { customers, totalPages } = await this.getCustomers(page, 50);
      allCustomers.push(...customers);

      if (page >= totalPages) break;
      page++;

      // Rate limiting: انتظر قليل بين الصفحات
      await new Promise((r) => setTimeout(r, 200));
    }

    return allCustomers;
  }

  // ─── السلات المتروكة ──────────────────────

  /**
   * جلب السلات المتروكة
   * GET /carts/abandoned
   * Scope: carts.read
   */
  async getAbandonedCarts(page = 1): Promise<{
    carts: SallaAbandonedCart[];
    total: number;
    totalPages: number;
  }> {
    const res = await this.request<SallaAbandonedCart[]>("GET", "/carts/abandoned", undefined, {
      page: String(page),
    });

    return {
      carts: res.data,
      total: res.pagination?.total ?? 0,
      totalPages: res.pagination?.totalPages ?? 1,
    };
  }

  // ─── الكوبونات ─────────────────────────────

  /**
   * إنشاء كوبون خصم في متجر سلة
   * POST /coupons
   * Scope: coupons.read.write
   */
  async createCoupon(data: {
    code: string;
    type: "percentage" | "fixed";
    amount: number;
    startDate: string;  // YYYY-MM-DD
    expiryDate: string; // YYYY-MM-DD
    maximumUsage?: number;
    freeShipping?: boolean;
    excludeSaleProducts?: boolean;
    minimumAmount?: number;
  }): Promise<SallaCoupon> {
    const res = await this.request<SallaCoupon>("POST", "/coupons", {
      code: data.code,
      type: data.type,
      amount: data.amount,
      start_date: data.startDate,
      expiry_date: data.expiryDate,
      maximum_usage: data.maximumUsage,
      free_shipping: data.freeShipping ?? false,
      exclude_sale_products: data.excludeSaleProducts ?? false,
      minimum_amount: data.minimumAmount,
    });

    return res.data;
  }

  /**
   * التحقق من استخدام كوبون
   * GET /coupons/{id}
   */
  async getCouponUsage(couponId: number): Promise<{
    code: string;
    usageCount: number;
    status: string;
  }> {
    const res = await this.request<SallaCoupon>("GET", `/coupons/${couponId}`);

    return {
      code: res.data.code,
      usageCount: res.data.usage_count,
      status: res.data.status,
    };
  }

  // ─── Webhooks ──────────────────────────────

  /**
   * تسجيل webhook جديد
   * POST /webhooks
   */
  async registerWebhook(url: string, events: string[]): Promise<Record<string, unknown>> {
    const res = await this.request<Record<string, unknown>>("POST", "/webhooks", {
      name: "Smart Offers Webhook",
      url,
      events,
    });
    return res.data;
  }

  // ─── Helper: إنشاء client من بيانات المتجر ─

  static async fromStoreId(storeId: string): Promise<SallaClient> {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new Error(`المتجر غير موجود: ${storeId}`);
    if (store.platform !== "SALLA") throw new Error(`المتجر ليس على منصة سلة`);

    return new SallaClient(store.id, store.apiKey, store.apiSecret);
  }
}

// =============================================
// التحقق من توقيع Webhook
// =============================================

export function verifySallaWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// =============================================
// أحداث Webhook المدعومة
// =============================================

export const SALLA_WEBHOOK_EVENTS = {
  ORDER_CREATED: "order.created",
  ORDER_UPDATED: "order.updated",
  ORDER_STATUS_UPDATED: "order.status.updated",
  CUSTOMER_CREATED: "customer.created",
  CUSTOMER_UPDATED: "customer.updated",
  CART_ABANDONED: "abandoned.cart",
  COUPON_APPLIED: "coupon.applied",
} as const;
