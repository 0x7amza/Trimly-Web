// Trimly API Client — connects to Next.js Route Handlers at /api/v1/
// All mock code removed. Backend is the Next.js Route Handlers.

import type {
  BusinessHours,
  Subscription,
  Barber,
  Shop,
  ShopWithBarbers,
  Customer,
  Service,
  Booking,
  Product
} from "@/types/api";
import { ApiRequestError, getClientErrorCode, getClientErrorMessage } from "@/lib/api-error";

export type {
  BusinessHours,
  Subscription,
  Barber,
  Shop,
  ShopWithBarbers,
  Customer,
  Service,
  Booking,
  Product
};

// ──────────────────────────────────────────────
// HTTP helper — attaches Clerk JWT (B2B) or customer token (B2C)
// ──────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);

  // Determine if this is a B2B (Clerk) route
  const isB2B =
    path.startsWith("/barbers") ||
    path.startsWith("/services") ||
    path.startsWith("/shops") ||
    path.startsWith("/statistics") ||
    path.startsWith("/bookings/manual") ||
    path.startsWith("/bookings/me/barber") ||
    // Dynamic booking routes — e.g. /bookings/{id}/status (Complete/Cancel job)
    (path.startsWith("/bookings/") && !path.startsWith("/bookings/me/customer") && !path.startsWith("/bookings/online") && !path.startsWith("/bookings/barber/"));

  let token: string | null = null;

  if (isB2B && typeof window !== "undefined") {
    const clerk = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string> } } }).Clerk;
    if (clerk?.session) {
      try {
        token = await clerk.session.getToken();
      } catch (err) {
        console.error("[api] Failed to retrieve Clerk token:", err);
      }
    }
  }

  // Fallback: customer JWT stored in localStorage
  if (!token && typeof window !== "undefined") {
    token = localStorage.getItem("trimly_auth_token");
  }

  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  const baseUrl = typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")
    : "";

  const method = options.method ?? "GET";
  const url = `${baseUrl}/api/v1${path}`;

  const response = await fetch(url, { ...options, headers });

  // Guard: if backend returned HTML (e.g. Next.js 500 page) instead of JSON,
  // surface a clean error rather than a JSON parse crash.
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    const text = await response.text();
    const safePreview = text.slice(0, 120).replace(/\s+/g, " ");

    if (process.env.NODE_ENV !== "production") {
      console.error(
        `[api] Non-JSON response from ${method} ${path}\n` +
        `  Status: ${response.status}\n` +
        `  Body preview: ${safePreview}`
      );
    }
    throw new Error(`Server error (${response.status}). The server returned a non-JSON response.`);
  }

  const data = await response.json();

  if (!response.ok) {
    const message = getClientErrorMessage(data);
    const code = getClientErrorCode(data);

    if (process.env.NODE_ENV !== "production") {
      const log = response.status >= 500 ? console.error : console.warn;
      log(
        `[api] Request failed: ${method} ${path}\n` +
        `  Status: ${response.status}\n` +
        `  Error: ${message}`
      );
    }

    throw new ApiRequestError(message, response.status, code);
  }

  return data;
}

// ──────────────────────────────────────────────────────────────────
// API object — mirrors backend-api.md endpoints exactly
// ──────────────────────────────────────────────────────────────────
export const api = {

  config: {
    getPublic: () =>
      request<{
        success: boolean;
        data: {
          stripeConfigured: boolean;
          onlinePaymentsEnabled: boolean;
          subscriptionBillingEnabled: boolean;
          bookingBufferMinutes: number;
        };
      }>(
        "/config/public"
      ),
  },

  // 1. AUTHENTICATION (B2C Customers)
  auth: {
    sendOtp: (phone: string) =>
      request<{ success: boolean; message: string; sandboxOtp?: string }>("/auth/customer/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone }),
      }),

    verifyOtp: async (phone: string, code: string) => {
      const res = await request<{ success: boolean; data: { customer: Customer; token: string; isNew: boolean } }>(
        "/auth/customer/verify-otp",
        { method: "POST", body: JSON.stringify({ phone, code }) }
      );
      if (res.success && typeof window !== "undefined") {
        localStorage.setItem("trimly_auth_token", res.data.token);
        localStorage.setItem("trimly_customer", JSON.stringify(res.data.customer));
      }
      return res;
    },

    register: async (payload: { phone: string; email?: string; name: string; password?: string }) => {
      const res = await request<{ success: boolean; data: { customer: Customer; token: string } }>(
        "/auth/customer/register",
        { method: "POST", body: JSON.stringify(payload) }
      );
      if (res.success && typeof window !== "undefined") {
        localStorage.setItem("trimly_auth_token", res.data.token);
        localStorage.setItem("trimly_customer", JSON.stringify(res.data.customer));
      }
      return res;
    },

    login: async (identifier: string, password: string) => {
      const res = await request<{ success: boolean; data: { customer: Customer; token: string } }>(
        "/auth/customer/login",
        { method: "POST", body: JSON.stringify({ identifier, password }) }
      );
      if (res.success && typeof window !== "undefined") {
        localStorage.setItem("trimly_auth_token", res.data.token);
        localStorage.setItem("trimly_customer", JSON.stringify(res.data.customer));
      }
      return res;
    },

    logout: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("trimly_auth_token");
        localStorage.removeItem("trimly_customer");
      }
    },

    getCurrentCustomer: (): Customer | null => {
      if (typeof window === "undefined") return null;
      const raw = localStorage.getItem("trimly_customer");
      return raw ? JSON.parse(raw) : null;
    },
  },

  // 2. BARBERS (B2B)
  barbers: {
    sync: (payload: { name: string; email: string; shopId?: string }) =>
      request<{ success: boolean; data: Barber }>("/barbers/sync", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    getMe: () => request<{ success: boolean; data: Barber }>("/barbers/me"),

    updateMe: (payload: Partial<Barber>) =>
      request<{ success: boolean; data: Barber }>("/barbers/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
  },

  // 3. SERVICES
  services: {
    create: (payload: { name: string; price: number; durationMinutes: number; category?: string }) =>
      request<{ success: boolean; data: Service }>("/services", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    getBarberServices: (clerkId: string) =>
      request<{ success: boolean; data: Service[] }>(`/services/barber/${clerkId}`),

    update: (id: string, payload: { name?: string; price?: number; durationMinutes?: number; category?: string }) =>
      request<{ success: boolean; data: Service }>(`/services/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),

    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/services/${id}`, { method: "DELETE" }),
  },

  // 4. BOOKINGS
  bookings: {
    getAvailability: (clerkId: string, serviceId: string, dateStr: string) =>
      request<{ success: boolean; data: string[] }>(
        `/bookings/barber/${clerkId}/availability?serviceId=${serviceId}&date=${dateStr}`
      ),

    createOnline: (payload: { barberId: string; serviceId: string; startTime: string; paymentOption?: "ARRIVE" | "STRIPE"; notes?: string }) =>
      request<{ success: boolean; data: { booking: Booking; clientSecret: string | null } }>("/bookings/online", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    createManual: (payload: { serviceId: string; startTime: string; customerName?: string; customerPhone?: string; notes?: string; durationMinutes?: number }) =>
      request<{ success: boolean; data: Booking }>("/bookings/manual", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    getBarberBookings: () =>
      request<{ success: boolean; data: Booking[] }>("/bookings/me/barber"),

    getCustomerBookings: () =>
      request<{ success: boolean; data: Booking[] }>("/bookings/me/customer"),

    updateStatus: (id: string, status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED") =>
      request<{ success: boolean; data: Booking }>(`/bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
  },

  // 5. SHOPS
  shops: {
    create: (name: string, country: string, state: string, timezone?: string) =>
      request<{ success: boolean; data: Shop }>("/shops", {
        method: "POST",
        body: JSON.stringify({ name, country, state, timezone }),
      }),

    getMe: () =>
      request<{ success: boolean; data: ShopWithBarbers }>("/shops/me"),

    updateMe: (payload: Partial<Shop>) =>
      request<{ success: boolean; data: Shop }>("/shops/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),

    addBarber: (payload: { barberName?: string; barberEmail: string }) =>
      request<{ success: boolean; data: Barber }>("/shops/me/barbers", {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    getBySlug: (slug: string) =>
      request<{ success: boolean; data: ShopWithBarbers }>(`/shops/${slug}`),
  },

  // 6. SUBSCRIPTIONS
  subscriptions: {
    subscribe: (plan: "MONTHLY" | "YEARLY") =>
      request<{ success: boolean; data: { sessionUrl: string } }>("/shops/me/subscribe", {
        method: "POST",
        body: JSON.stringify({ plan }),
      }),

    billingPortal: () =>
      request<{ success: boolean; data: { portalUrl: string } }>("/shops/me/billing-portal", {
        method: "POST",
      }),
  },

  // 7. STATISTICS
  statistics: {
    getShopStats: () =>
      request<{ success: boolean; data: { totalBookings: number; completedBookings: number; upcomingBookings: number; cancelledBookings: number; totalBarbers: number } }>(
        "/statistics/shop"
      ),

    getBarberStats: (barberId?: string) =>
      request<{ success: boolean; data: { totalBookings: number; completedBookings: number; upcomingBookings: number; cancelledBookings: number } }>(
        `/statistics/barber/${barberId ?? ""}`
      ),
  },

  // 8. SEARCH (reads from MongoDB via route handler)
  search: (params: { city?: string; country?: string; state?: string; searchQuery?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params.city) query.set("city", params.city);
    if (params.country) query.set("country", params.country);
    if (params.state) query.set("state", params.state);
    if (params.searchQuery) query.set("searchQuery", params.searchQuery);
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    return request<{ success: boolean; data: { results: Array<{ type: string; id: string; name: string; slug: string; images?: string[]; profileImage?: string; country?: string; state?: string; city?: string }>; pagination: { total: number; page: number; limit: number; totalPages: number } } }>(
      `/search?${query.toString()}`
    );
  },

  // 9. PRODUCTS
  products: {
    getShopProducts: (shopId: string) =>
      request<{ success: boolean; data: Product[] }>(`/shops/${shopId}/products`),

    create: (payload: { shopId: string; name: string; description: string; price: number; imageUrl: string }) =>
      request<{ success: boolean; data: Product }>(`/shops/${payload.shopId}/products`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    update: (id: string, shopId: string, payload: Partial<{ name: string; description: string; price: number; imageUrl: string; isActive: boolean }>) =>
      request<{ success: boolean; data: Product }>(`/shops/${shopId}/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),

    delete: (id: string, shopId: string) =>
      request<{ success: boolean }>(`/shops/${shopId}/products/${id}`, { method: "DELETE" }),
  },

  // 10. FILE UPLOAD
  upload: async (file: File): Promise<{ success: boolean; data: { url: string; filename: string; contentType: string; size: number } }> => {
    const headers = new Headers();
    if (typeof window !== "undefined") {
      const clerk = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string> } } }).Clerk;
      if (clerk?.session) {
        try {
          const token = await clerk.session.getToken();
          if (token) headers.set("Authorization", `Bearer ${token}`);
        } catch (err) {
          console.error("Failed to retrieve Clerk token for upload:", err);
        }
      }
    }
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/v1/upload", { method: "POST", body: formData, headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "File upload failed");
    return data;
  },

  // 11. REVIEWS
  reviews: {
    getBySlug: (slug: string) =>
      request<{ success: boolean; data: Array<{ id: string; customerName: string; rating: number; comment?: string; createdAt: string }> }>(
        `/shops/${slug}/reviews`
      ),
    create: (slug: string, payload: { customerName: string; rating: number; comment?: string }) =>
      request<{ success: boolean; data: { id: string; customerName: string; rating: number; comment?: string; createdAt: string } }>(
        `/shops/${slug}/reviews`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      ),
  },
};

// Legacy mockDb export kept as a no-op stub to avoid breaking any references
// Remove this once all components have been updated
export const mockDb = {
  getBarbers: () => [] as Barber[],
  setBarbers: () => {},
  getActiveUser: () => ({ clerkId: "", role: "OWNER" as const }),
  setActiveUser: () => {},
};
