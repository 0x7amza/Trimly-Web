// Trimly API Client with built-in Mock Mode
// Mapped to backend-api.md endpoints and schemas

export interface BusinessHours {
  day: number; // 0-6
  open: string; // "HH:MM"
  close: string; // "HH:MM"
  isClosed: boolean;
}

export interface Subscription {
  plan: "MONTHLY" | "YEARLY" | "NONE";
  status: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: string;
  trialEndsAt?: string;
  gracePeriodEndsAt?: string;
}

export interface Barber {
  id: string;
  clerkId: string;
  shopId: string;
  role: "OWNER" | "BARBER";
  name: string;
  email: string;
  shopName?: string;
  slug?: string;
  phone?: string;
  address?: string;
  bio?: string;
  businessHours?: BusinessHours[];
}

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  subscription: Subscription;
  maxBarbersIncluded: number;
}

export interface ShopWithBarbers {
  shop: Shop;
  barbers: Barber[];
}

export interface Customer {
  id: string;
  phone: string;
  email: string;
  name: string;
}

export interface Service {
  id: string;
  barberId: string;
  name: string;
  price: number; // in pence (e.g. 2500 = £25.00)
  durationMinutes: number;
  isActive: boolean;
}

export interface Booking {
  id: string;
  barberId: string;
  customerId?: string;
  serviceId: string;
  serviceSnapshot: {
    name: string;
    price: number;
    durationMinutes: number;
  };
  startTime: string; // ISO string
  endTime: string; // ISO string
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  paymentStatus: "PENDING" | "PAID" | "REFUNDED";
  paymentIntentId?: string;
  type: "ONLINE" | "MANUAL";
  notes?: string;
}

// Initial Mock Database
const DEFAULT_BUSINESS_HOURS = [
  { day: 1, open: "09:00", close: "18:00", isClosed: false },
  { day: 2, open: "09:00", close: "18:00", isClosed: false },
  { day: 3, open: "09:00", close: "18:00", isClosed: false },
  { day: 4, open: "09:00", close: "18:00", isClosed: false },
  { day: 5, open: "09:00", close: "19:00", isClosed: false },
  { day: 6, open: "09:00", close: "17:00", isClosed: false },
  { day: 0, open: "09:00", close: "17:00", isClosed: true }, // Sunday closed
];

const INITIAL_SHOPS: Shop[] = [
  {
    id: "shop_1",
    ownerId: "user_john",
    name: "Doe Barbershop",
    slug: "doe-barbershop",
    subscription: {
      plan: "MONTHLY",
      status: "ACTIVE",
      stripeCustomerId: "cus_mock123",
      stripeSubscriptionId: "sub_mock123",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    },
    maxBarbersIncluded: 5,
  },
];

const INITIAL_BARBERS: Barber[] = [
  {
    id: "barber_1",
    clerkId: "user_john",
    shopId: "shop_1",
    role: "OWNER",
    name: "John Doe",
    email: "john@example.com",
    shopName: "Doe Barbershop",
    slug: "doe-barbershop",
    phone: "+447000000000",
    address: "123 Barber St, London",
    bio: "Owner & Lead Barber. Specializes in classic cuts and beard design.",
    businessHours: DEFAULT_BUSINESS_HOURS,
  },
  {
    id: "barber_2",
    clerkId: "user_jane",
    shopId: "shop_1",
    role: "BARBER",
    name: "Jane Barber",
    email: "jane@example.com",
    shopName: "Doe Barbershop",
    slug: "doe-barbershop",
    phone: "+447000000009",
    address: "123 Barber St, London",
    bio: "Senior Stylist. Master of fades and styling trends.",
    businessHours: DEFAULT_BUSINESS_HOURS,
  },
];

const INITIAL_SERVICES: Service[] = [
  { id: "serv_1", barberId: "user_john", name: "Men Haircut", price: 2500, durationMinutes: 30, isActive: true },
  { id: "serv_2", barberId: "user_john", name: "Beard Trim", price: 1500, durationMinutes: 15, isActive: true },
  { id: "serv_3", barberId: "user_john", name: "Haircut & Beard", price: 3500, durationMinutes: 45, isActive: true },
  { id: "serv_4", barberId: "user_jane", name: "Modern Skinfade", price: 3000, durationMinutes: 30, isActive: true },
  { id: "serv_5", barberId: "user_jane", name: "Beard & Grooming", price: 1800, durationMinutes: 20, isActive: true },
];

// Helper to generate some bookings for the current date
const generateMockBookings = (): Booking[] => {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0]; // YYYY-MM-DD
  return [
    {
      id: "book_1",
      barberId: "user_john",
      customerId: "cust_1",
      serviceId: "serv_1",
      serviceSnapshot: { name: "Men Haircut", price: 2500, durationMinutes: 30 },
      startTime: `${dateStr}T10:00:00.000Z`,
      endTime: `${dateStr}T10:30:00.000Z`,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      paymentIntentId: "pi_mock1",
      type: "ONLINE",
      notes: "High fade please",
    },
    {
      id: "book_2",
      barberId: "user_john",
      serviceId: "serv_2",
      serviceSnapshot: { name: "Beard Trim", price: 1500, durationMinutes: 15 },
      startTime: `${dateStr}T11:30:00.000Z`,
      endTime: `${dateStr}T11:45:00.000Z`,
      status: "CONFIRMED",
      paymentStatus: "PENDING",
      type: "MANUAL",
      notes: "Walk-in customer",
    },
    {
      id: "book_3",
      barberId: "user_jane",
      customerId: "cust_2",
      serviceId: "serv_4",
      serviceSnapshot: { name: "Modern Skinfade", price: 3000, durationMinutes: 30 },
      startTime: `${dateStr}T14:00:00.000Z`,
      endTime: `${dateStr}T14:30:00.000Z`,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      paymentIntentId: "pi_mock2",
      type: "ONLINE",
    },
  ];
};

// Safe localStorage access helper
class MockDb {
  private isClient = typeof window !== "undefined";

  private get<T>(key: string, defaultValue: T): T {
    if (!this.isClient) return defaultValue;
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  }

  private set<T>(key: string, value: T): void {
    if (!this.isClient) return;
    localStorage.setItem(key, JSON.stringify(value));
  }

  getShops() { return this.get("trimly_shops", INITIAL_SHOPS); }
  setShops(data: Shop[]) { this.set("trimly_shops", data); }

  getBarbers() { return this.get("trimly_barbers", INITIAL_BARBERS); }
  setBarbers(data: Barber[]) { this.set("trimly_barbers", data); }

  getServices() { return this.get("trimly_services", INITIAL_SERVICES); }
  setServices(data: Service[]) { this.set("trimly_services", data); }

  getBookings() { return this.get("trimly_bookings", generateMockBookings()); }
  setBookings(data: Booking[]) { this.set("trimly_bookings", data); }

  getCurrentCustomer() { return this.get<Customer | null>("trimly_curr_customer", null); }
  setCurrentCustomer(cust: Customer | null) { this.set("trimly_curr_customer", cust); }

  getActiveUser() {
    // Simulated active B2B user (Clerk replacement in mock mode)
    return this.get<{ clerkId: string; role: "OWNER" | "BARBER" }>("trimly_active_user", {
      clerkId: "user_john",
      role: "OWNER",
    });
  }
  setActiveUser(user: { clerkId: string; role: "OWNER" | "BARBER" }) {
    this.set("trimly_active_user", user);
  }
}

export const mockDb = new MockDb();

// Active API configuration
const USE_MOCK = true; // Hardcoded default to ensure it works smoothly in user's environment.

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = typeof window !== "undefined" ? localStorage.getItem("trimly_auth_token") : null;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  headers.set("Content-Type", "application/json");

  const response = await fetch(`/api/v1${path}`, { ...options, headers });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "API Request Failed");
  }
  return data;
}

export const api = {
  // ==========================================
  // 1. AUTHENTICATION (B2C)
  // ==========================================
  auth: {
    sendOtp: async (phone: string): Promise<{ success: boolean; message: string }> => {
      if (USE_MOCK) {
        return { success: true, message: "Mock OTP sent successfully" };
      }
      return request("/auth/customer/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
    },

    verifyOtp: async (phone: string, code: string): Promise<{ success: boolean; data: { customer: Customer; token: string; isNew: boolean } }> => {
      if (USE_MOCK) {
        const mockCust: Customer = {
          id: "cust_" + Math.random().toString(36).substr(2, 9),
          phone,
          email: "customer@example.com",
          name: "Mock Customer",
        };
        mockDb.setCurrentCustomer(mockCust);
        return {
          success: true,
          data: {
            customer: mockCust,
            token: "mock-jwt-token-12345",
            isNew: false,
          },
        };
      }
      const res = await request<{ success: boolean; data: { customer: Customer; token: string; isNew: boolean } }>("/auth/customer/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, code }),
      });
      if (res.success) {
        mockDb.setCurrentCustomer(res.data.customer);
        localStorage.setItem("trimly_auth_token", res.data.token);
      }
      return res;
    },

    register: async (payload: { phone: string; email: string; name: string }): Promise<{ success: boolean; data: { customer: Customer; token: string } }> => {
      if (USE_MOCK) {
        const mockCust: Customer = {
          id: "cust_" + Math.random().toString(36).substr(2, 9),
          phone: payload.phone,
          email: payload.email,
          name: payload.name,
        };
        mockDb.setCurrentCustomer(mockCust);
        return {
          success: true,
          data: {
            customer: mockCust,
            token: "mock-jwt-token-12345",
          },
        };
      }
      const res = await request<{ success: boolean; data: { customer: Customer; token: string } }>("/auth/customer/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.success) {
        mockDb.setCurrentCustomer(res.data.customer);
        localStorage.setItem("trimly_auth_token", res.data.token);
      }
      return res;
    },

    logout: () => {
      mockDb.setCurrentCustomer(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("trimly_auth_token");
      }
    },
  },

  // ==========================================
  // 2. BARBERS (B2B)
  // ==========================================
  barbers: {
    sync: async (payload: { name: string; email: string }): Promise<{ success: boolean; data: Barber }> => {
      if (USE_MOCK) {
        const active = mockDb.getActiveUser();
        let barber = mockDb.getBarbers().find(b => b.clerkId === active.clerkId);
        if (!barber) {
          barber = {
            id: "barber_" + Math.random().toString(36).substr(2, 9),
            clerkId: active.clerkId,
            shopId: "shop_1",
            role: "BARBER",
            name: payload.name,
            email: payload.email,
            businessHours: DEFAULT_BUSINESS_HOURS,
          };
          mockDb.setBarbers([...mockDb.getBarbers(), barber]);
        }
        return { success: true, data: barber };
      }
      return request("/barbers/sync", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    getMe: async (): Promise<{ success: boolean; data: Barber }> => {
      if (USE_MOCK) {
        const active = mockDb.getActiveUser();
        const barber = mockDb.getBarbers().find(b => b.clerkId === active.clerkId);
        if (!barber) throw new Error("Barber profile not found in mock mode");
        return { success: true, data: barber };
      }
      return request("/barbers/me");
    },

    updateMe: async (payload: Partial<Barber>): Promise<{ success: boolean; data: Barber }> => {
      if (USE_MOCK) {
        const active = mockDb.getActiveUser();
        const barbers = mockDb.getBarbers();
        const idx = barbers.findIndex(b => b.clerkId === active.clerkId);
        if (idx === -1) throw new Error("Profile not found");
        barbers[idx] = { ...barbers[idx], ...payload };
        mockDb.setBarbers(barbers);
        return { success: true, data: barbers[idx] };
      }
      return request("/barbers/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
  },

  // ==========================================
  // 3. SERVICES
  // ==========================================
  services: {
    create: async (payload: { name: string; price: number; durationMinutes: number }): Promise<{ success: boolean; data: Service }> => {
      if (USE_MOCK) {
        const active = mockDb.getActiveUser();
        const newServ: Service = {
          id: "serv_" + Math.random().toString(36).substr(2, 9),
          barberId: active.clerkId,
          name: payload.name,
          price: payload.price,
          durationMinutes: payload.durationMinutes,
          isActive: true,
        };
        mockDb.setServices([...mockDb.getServices(), newServ]);
        return { success: true, data: newServ };
      }
      return request("/services", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    getBarberServices: async (clerkId: string): Promise<{ success: boolean; data: Service[] }> => {
      if (USE_MOCK) {
        const list = mockDb.getServices().filter(s => s.barberId === clerkId && s.isActive);
        return { success: true, data: list };
      }
      return request(`/services/barber/${clerkId}`);
    },

    update: async (id: string, payload: { name?: string; price?: number; durationMinutes?: number }): Promise<{ success: boolean; data: Service }> => {
      if (USE_MOCK) {
        const services = mockDb.getServices();
        const idx = services.findIndex(s => s.id === id);
        if (idx === -1) throw new Error("Service not found");
        services[idx] = { ...services[idx], ...payload };
        mockDb.setServices(services);
        return { success: true, data: services[idx] };
      }
      return request(`/services/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },

    delete: async (id: string): Promise<{ success: boolean; message: string }> => {
      if (USE_MOCK) {
        const services = mockDb.getServices();
        const idx = services.findIndex(s => s.id === id);
        if (idx === -1) throw new Error("Service not found");
        services[idx].isActive = false; // Soft delete
        mockDb.setServices(services);
        return { success: true, message: "Service deleted successfully" };
      }
      return request(`/services/${id}`, {
        method: "DELETE",
      });
    },
  },

  // ==========================================
  // 4. BOOKINGS
  // ==========================================
  bookings: {
    getAvailability: async (clerkId: string, serviceId: string, dateStr: string): Promise<{ success: boolean; data: string[] }> => {
      if (USE_MOCK) {
        // Mocking timeline slots: 09:00 to 18:00 in 15 minute steps.
        // Remove slots that overlap with existing bookings.
        const bookings = mockDb.getBookings().filter(b => b.barberId === clerkId && b.status !== "CANCELLED" && b.startTime.startsWith(dateStr));
        const services = mockDb.getServices();
        const service = services.find(s => s.id === serviceId);
        const duration = service ? service.durationMinutes : 30;

        const slots: string[] = [];
        const openTime = 9 * 60; // 09:00
        const closeTime = 18 * 60; // 18:00

        for (let min = openTime; min < closeTime; min += 15) {
          const hour = Math.floor(min / 60);
          const mins = min % 60;
          const timeStr = `${dateStr}T${hour.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:00.000Z`;
          const slotStart = new Date(timeStr).getTime();
          const slotEnd = slotStart + duration * 60 * 1000;

          // Check if slot overlaps with any booking
          const isOverlapping = bookings.some(b => {
            const bStart = new Date(b.startTime).getTime();
            const bEnd = new Date(b.endTime).getTime();
            return (slotStart >= bStart && slotStart < bEnd) || (slotEnd > bStart && slotEnd <= bEnd) || (slotStart <= bStart && slotEnd >= bEnd);
          });

          if (!isOverlapping) {
            slots.push(timeStr);
          }
        }
        return { success: true, data: slots };
      }
      return request(`/bookings/barber/${clerkId}/availability?serviceId=${serviceId}&date=${dateStr}`);
    },

    createOnline: async (payload: { barberId: string; serviceId: string; startTime: string }): Promise<{ success: boolean; data: { booking: Booking; clientSecret: string } }> => {
      if (USE_MOCK) {
        const services = mockDb.getServices();
        const service = services.find(s => s.id === payload.serviceId);
        const duration = service ? service.durationMinutes : 30;
        const endTime = new Date(new Date(payload.startTime).getTime() + duration * 60 * 1000).toISOString();

        const cust = mockDb.getCurrentCustomer();
        const newBooking: Booking = {
          id: "book_" + Math.random().toString(36).substr(2, 9),
          barberId: payload.barberId,
          customerId: cust?.id || "cust_guest",
          serviceId: payload.serviceId,
          serviceSnapshot: {
            name: service ? service.name : "Custom Cut",
            price: service ? service.price : 2500,
            durationMinutes: duration,
          },
          startTime: payload.startTime,
          endTime,
          status: "CONFIRMED",
          paymentStatus: "PAID",
          paymentIntentId: "pi_mock_" + Math.random().toString(36).substr(2, 5),
          type: "ONLINE",
        };

        mockDb.setBookings([...mockDb.getBookings(), newBooking]);
        return {
          success: true,
          data: {
            booking: newBooking,
            clientSecret: "pi_mock_secret_" + Math.random().toString(36).substr(2, 9),
          },
        };
      }
      return request("/bookings/online", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    createManual: async (payload: { serviceId: string; startTime: string; customerName?: string; customerPhone?: string; notes?: string }): Promise<{ success: boolean; data: Booking }> => {
      if (USE_MOCK) {
        const active = mockDb.getActiveUser();
        const services = mockDb.getServices();
        const service = services.find(s => s.id === payload.serviceId);
        const duration = service ? service.durationMinutes : 30;
        const endTime = new Date(new Date(payload.startTime).getTime() + duration * 60 * 1000).toISOString();

        const newBooking: Booking = {
          id: "book_" + Math.random().toString(36).substr(2, 9),
          barberId: active.clerkId,
          serviceId: payload.serviceId,
          serviceSnapshot: {
            name: service ? service.name : "Men Haircut",
            price: service ? service.price : 2500,
            durationMinutes: duration,
          },
          startTime: payload.startTime,
          endTime,
          status: "CONFIRMED",
          paymentStatus: "PENDING",
          type: "MANUAL",
          notes: payload.notes || `Manual Booking for ${payload.customerName || "Walk-in"}`,
        };

        mockDb.setBookings([...mockDb.getBookings(), newBooking]);
        return { success: true, data: newBooking };
      }
      return request("/bookings/manual", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    getBarberBookings: async (): Promise<{ success: boolean; data: Booking[] }> => {
      if (USE_MOCK) {
        const active = mockDb.getActiveUser();
        const list = mockDb.getBookings().filter(b => b.barberId === active.clerkId && b.status !== "CANCELLED");
        return { success: true, data: list };
      }
      return request("/bookings/me/barber");
    },

    getCustomerBookings: async (): Promise<{ success: boolean; data: Booking[] }> => {
      if (USE_MOCK) {
        const cust = mockDb.getCurrentCustomer();
        if (!cust) return { success: true, data: [] };
        const list = mockDb.getBookings().filter(b => b.customerId === cust.id);
        return { success: true, data: list };
      }
      return request("/bookings/me/customer");
    },

    updateStatus: async (id: string, status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"): Promise<{ success: boolean; data: Booking }> => {
      if (USE_MOCK) {
        const bookings = mockDb.getBookings();
        const idx = bookings.findIndex(b => b.id === id);
        if (idx === -1) throw new Error("Booking not found");
        bookings[idx].status = status;
        mockDb.setBookings(bookings);
        return { success: true, data: bookings[idx] };
      }
      return request(`/bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
  },

  // ==========================================
  // 5. SHOPS
  // ==========================================
  shops: {
    create: async (name: string): Promise<{ success: boolean; data: Shop }> => {
      if (USE_MOCK) {
        const active = mockDb.getActiveUser();
        const newShop: Shop = {
          id: "shop_" + Math.random().toString(36).substr(2, 9),
          ownerId: active.clerkId,
          name,
          slug: name.toLowerCase().replace(/ /g, "-"),
          subscription: { plan: "MONTHLY", status: "ACTIVE" },
          maxBarbersIncluded: 5,
        };
        mockDb.setShops([...mockDb.getShops(), newShop]);
        return { success: true, data: newShop };
      }
      return request("/shops", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
    },

    getMe: async (): Promise<{ success: boolean; data: ShopWithBarbers }> => {
      if (USE_MOCK) {
        const active = mockDb.getActiveUser();
        const shops = mockDb.getShops();
        const barbers = mockDb.getBarbers();

        // Match shop owned by user or where barber belongs
        let barber = barbers.find(b => b.clerkId === active.clerkId);
        let shop = shops.find(s => s.id === barber?.shopId || s.ownerId === active.clerkId);

        if (!shop) {
          // Fallback, create a default shop if somehow missing
          shop = shops[0];
        }

        const shopBarbers = barbers.filter(b => b.shopId === shop.id);
        return { success: true, data: { shop, barbers: shopBarbers } };
      }
      return request("/shops/me");
    },

    addBarber: async (payload: { barberName: string; barberEmail: string; barberPassword?: string }): Promise<{ success: boolean; data: Barber }> => {
      if (USE_MOCK) {
        const active = mockDb.getActiveUser();
        const shops = mockDb.getShops();
        const shop = shops.find(s => s.ownerId === active.clerkId);
        if (!shop) throw new Error("Only the shop owner can add barbers");

        const newBarber: Barber = {
          id: "barber_" + Math.random().toString(36).substr(2, 9),
          clerkId: "user_" + Math.random().toString(36).substr(2, 9),
          shopId: shop.id,
          role: "BARBER",
          name: payload.barberName,
          email: payload.barberEmail,
          shopName: shop.name,
          slug: shop.slug,
          businessHours: DEFAULT_BUSINESS_HOURS,
        };

        mockDb.setBarbers([...mockDb.getBarbers(), newBarber]);
        return { success: true, data: newBarber };
      }
      return request("/shops/me/barbers", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    getBySlug: async (slug: string): Promise<{ success: boolean; data: ShopWithBarbers }> => {
      if (USE_MOCK) {
        const shops = mockDb.getShops();
        const shop = shops.find(s => s.slug === slug);
        if (!shop) throw new Error(`Shop with slug "${slug}" not found`);
        const barbers = mockDb.getBarbers().filter(b => b.shopId === shop.id);
        return { success: true, data: { shop, barbers } };
      }
      return request(`/shops/${slug}`);
    },
  },

  // ==========================================
  // 6. SUBSCRIPTIONS
  // ==========================================
  subscriptions: {
    subscribe: async (plan: "MONTHLY" | "YEARLY"): Promise<{ success: boolean; data: { sessionUrl: string } }> => {
      if (USE_MOCK) {
        return {
          success: true,
          data: { sessionUrl: "/dashboard/billing?session_completed=true" },
        };
      }
      return request("/shops/me/subscribe", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
    },

    billingPortal: async (): Promise<{ success: boolean; data: { portalUrl: string } }> => {
      if (USE_MOCK) {
        return {
          success: true,
          data: { portalUrl: "https://billing.stripe.com/p/session/mocked_portal" },
        };
      }
      return request("/shops/me/billing-portal", {
        method: "POST",
      });
    },
  },

  // ==========================================
  // 7. STATISTICS
  // ==========================================
  statistics: {
    getShopStats: async (): Promise<{ success: boolean; data: { totalBookings: number; completedBookings: number; upcomingBookings: number; cancelledBookings: number; totalBarbers: number } }> => {
      if (USE_MOCK) {
        const bookings = mockDb.getBookings();
        const barbers = mockDb.getBarbers();
        const totalBookings = bookings.length;
        const completedBookings = bookings.filter(b => b.status === "COMPLETED").length || Math.floor(totalBookings * 0.7);
        const upcomingBookings = bookings.filter(b => b.status === "CONFIRMED" || b.status === "PENDING").length;
        const cancelledBookings = bookings.filter(b => b.status === "CANCELLED").length;

        return {
          success: true,
          data: {
            totalBookings,
            completedBookings,
            upcomingBookings,
            cancelledBookings,
            totalBarbers: barbers.length,
          },
        };
      }
      return request("/statistics/shop");
    },

    getBarberStats: async (barberId?: string): Promise<{ success: boolean; data: { totalBookings: number; completedBookings: number; upcomingBookings: number; cancelledBookings: number } }> => {
      if (USE_MOCK) {
        const active = mockDb.getActiveUser();
        const targetId = barberId || active.clerkId;
        const bookings = mockDb.getBookings().filter(b => b.barberId === targetId);

        const totalBookings = bookings.length;
        const completedBookings = bookings.filter(b => b.status === "COMPLETED").length || Math.floor(totalBookings * 0.8);
        const upcomingBookings = bookings.filter(b => b.status === "CONFIRMED" || b.status === "PENDING").length;
        const cancelledBookings = bookings.filter(b => b.status === "CANCELLED").length;

        return {
          success: true,
          data: {
            totalBookings,
            completedBookings,
            upcomingBookings,
            cancelledBookings,
          },
        };
      }
      return request(`/statistics/barber/${barberId || ""}`);
    },
  },
};
