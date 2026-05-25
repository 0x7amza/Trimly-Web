// Trimly API Client with built-in Mock Mode
// Mapped to backend-api.md endpoints and schemas

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
    profileImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&h=300&q=80",
    profilePicture: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&h=300&q=80",
    images: [
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1605497746444-ac9dbd34f196?auto=format&fit=crop&w=800&q=80"
    ],
    galleryPictures: [
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1605497746444-ac9dbd34f196?auto=format&fit=crop&w=800&q=80"
    ],
    industryType: "Barber",
    city: "London",
    address: "123 Barber St, Shoreditch, London E1 6RF",
    businessHours: DEFAULT_BUSINESS_HOURS,
  },
  {
    id: "shop_2",
    ownerId: "user_luxe",
    name: "Luxe Hairdresser",
    slug: "luxe-hairdresser",
    subscription: {
      plan: "MONTHLY",
      status: "ACTIVE",
    },
    maxBarbersIncluded: 5,
    profileImage: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=300&h=300&q=80",
    profilePicture: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=300&h=300&q=80",
    images: [
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=800&q=80"
    ],
    galleryPictures: [
      "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=800&q=80"
    ],
    industryType: "Hairdresser",
    city: "London"
  },
  {
    id: "shop_3",
    ownerId: "user_bella",
    name: "Bella Nails & Spa",
    slug: "bella-nails",
    subscription: {
      plan: "MONTHLY",
      status: "ACTIVE",
    },
    maxBarbersIncluded: 3,
    profileImage: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=300&h=300&q=80",
    profilePicture: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=300&h=300&q=80",
    images: [
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1632345031435-8797b2d58045?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"
    ],
    galleryPictures: [
      "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1632345031435-8797b2d58045?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"
    ],
    industryType: "Manicure",
    city: "Manchester"
  },
  {
    id: "shop_4",
    ownerId: "user_glow",
    name: "Glow Beauty Lounge",
    slug: "glow-beauty",
    subscription: {
      plan: "MONTHLY",
      status: "ACTIVE",
    },
    maxBarbersIncluded: 4,
    profileImage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=300&h=300&q=80",
    profilePicture: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=300&h=300&q=80",
    images: [
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=800&q=80"
    ],
    galleryPictures: [
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=800&q=80"
    ],
    industryType: "Beauty Salon",
    city: "London"
  },
  {
    id: "shop_5",
    ownerId: "user_zen",
    name: "Zen Beauty & Wellness",
    slug: "zen-beauty",
    subscription: {
      plan: "MONTHLY",
      status: "ACTIVE",
    },
    maxBarbersIncluded: 5,
    profileImage: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=300&h=300&q=80",
    profilePicture: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=300&h=300&q=80",
    images: [
      "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80"
    ],
    galleryPictures: [
      "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80"
    ],
    industryType: "Beauty Salon",
    city: "Bristol"
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
    profileImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&h=300&q=80",
    images: ["https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80"],
    city: "London"
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
    profileImage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=300&h=300&q=80",
    images: ["https://images.unsplash.com/photo-1605497746444-ac9dbd34f196?auto=format&fit=crop&w=800&q=80"],
    city: "London"
  },
  {
    id: "barber_3",
    clerkId: "user_luxe",
    shopId: "shop_2",
    role: "OWNER",
    name: "Eliza Vance",
    email: "eliza@example.com",
    shopName: "Luxe Hairdresser",
    slug: "luxe-hairdresser",
    phone: "+447000000001",
    address: "45 Regent St, London",
    bio: "Senior Hair Stylist. Color specialist with 12+ years experience.",
    businessHours: DEFAULT_BUSINESS_HOURS,
    profileImage: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=300&h=300&q=80",
    images: ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"],
    city: "London"
  },
  {
    id: "barber_4",
    clerkId: "user_bella",
    shopId: "shop_3",
    role: "OWNER",
    name: "Bella Thorne",
    email: "bella@example.com",
    shopName: "Bella Nails & Spa",
    slug: "bella-nails",
    phone: "+447000000002",
    address: "12 Piccadilly, Manchester",
    bio: "Gel nail design expert and nail care specialist.",
    businessHours: DEFAULT_BUSINESS_HOURS,
    profileImage: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=300&h=300&q=80",
    images: ["https://images.unsplash.com/photo-1632345031435-8797b2d58045?auto=format&fit=crop&w=800&q=80"],
    city: "Manchester"
  },
  {
    id: "barber_5",
    clerkId: "user_glow",
    shopId: "shop_4",
    role: "OWNER",
    name: "Sarah Jenkins",
    email: "sarah@example.com",
    shopName: "Glow Beauty Lounge",
    slug: "glow-beauty",
    phone: "+447000000003",
    address: "78 Kensington Rd, London",
    bio: "Experienced esthetician & high-end skincare consultant.",
    businessHours: DEFAULT_BUSINESS_HOURS,
    profileImage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=300&h=300&q=80",
    images: ["https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80"],
    city: "London"
  },
  {
    id: "barber_6",
    clerkId: "user_zen",
    shopId: "shop_5",
    role: "OWNER",
    name: "David Miller",
    email: "david@example.com",
    shopName: "Zen Beauty & Wellness",
    slug: "zen-beauty",
    phone: "+447000000004",
    address: "8 Broad St, Bristol",
    bio: "Licensed beauty therapist & wellness specialist.",
    businessHours: DEFAULT_BUSINESS_HOURS,
    profileImage: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=300&h=300&q=80",
    images: ["https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80"],
    city: "Bristol"
  },
];

const INITIAL_SERVICES: Service[] = [
  { id: "serv_1", barberId: "user_john", name: "Men Haircut", price: 2500, durationMinutes: 30, isActive: true, category: "Haircuts", categoryName: "Haircuts" },
  { id: "serv_2", barberId: "user_john", name: "Beard Trim", price: 1500, durationMinutes: 15, isActive: true, category: "Beard Grooming", categoryName: "Beard Grooming" },
  { id: "serv_3", barberId: "user_john", name: "Haircut & Beard", price: 3500, durationMinutes: 45, isActive: true, category: "Combo Packages", categoryName: "Combo Packages" },
  { id: "serv_4", barberId: "user_jane", name: "Modern Skinfade", price: 3000, durationMinutes: 30, isActive: true, category: "Haircuts", categoryName: "Haircuts" },
  { id: "serv_5", barberId: "user_jane", name: "Beard & Grooming", price: 1800, durationMinutes: 20, isActive: true, category: "Beard Grooming", categoryName: "Beard Grooming" },
  { id: "serv_6", barberId: "user_luxe", name: "Women's Cut & Blow Dry", price: 5500, durationMinutes: 60, isActive: true, category: "Hair Styling", categoryName: "Hair Styling" },
  { id: "serv_7", barberId: "user_luxe", name: "Balayage Styling", price: 12000, durationMinutes: 120, isActive: true, category: "Coloring", categoryName: "Coloring" },
  { id: "serv_8", barberId: "user_bella", name: "Gel Manicure", price: 3500, durationMinutes: 45, isActive: true, category: "Manicure", categoryName: "Manicure" },
  { id: "serv_9", barberId: "user_bella", name: "Pedicure Deluxe", price: 4000, durationMinutes: 50, isActive: true, category: "Pedicure", categoryName: "Pedicure" },
  { id: "serv_10", barberId: "user_glow", name: "Facial Treatment", price: 4500, durationMinutes: 40, isActive: true, category: "Skincare", categoryName: "Skincare" },
  { id: "serv_11", barberId: "user_glow", name: "Eyebrow Shape & Tint", price: 2000, durationMinutes: 20, isActive: true, category: "Eyebrows", categoryName: "Eyebrows" },
  { id: "serv_12", barberId: "user_zen", name: "Deep Tissue Massage", price: 6500, durationMinutes: 60, isActive: true, category: "Massages", categoryName: "Massages" },
  { id: "serv_13", barberId: "user_zen", name: "Aromatherapy Massage", price: 7000, durationMinutes: 60, isActive: true, category: "Massages", categoryName: "Massages" },
];

// Helper to generate some bookings for the current date
// ─── Initial Products seed (per shop_1) ──────────────────────────────────
const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    shopId: "shop_1",
    name: "Trimly Pomade (Ultra Hold)",
    description: "Premium strong-hold pomade for sleek and structured classic styles.",
    price: 1400,
    imageUrl: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=400&h=400&q=80",
    isActive: true,
  },
  {
    id: "prod_2",
    shopId: "shop_1",
    name: "Sandalwood Beard & Face Oil",
    description: "Organic jojoba and argan oils blended with warm sandalwood aroma.",
    price: 1600,
    imageUrl: "https://images.unsplash.com/photo-1626015276681-2b44a2425026?auto=format&fit=crop&w=400&h=400&q=80",
    isActive: true,
  },
  {
    id: "prod_3",
    shopId: "shop_1",
    name: "Hydrating Tea Tree Shampoo",
    description: "Refreshing scalp therapy shampoo infused with tea tree extracts.",
    price: 1850,
    imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&h=400&q=80",
    isActive: true,
  },
  {
    id: "prod_4",
    shopId: "shop_1",
    name: "Matte Texture Styling Clay",
    description: "High-definition matte clay for a natural and textured modern look.",
    price: 1500,
    imageUrl: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=400&h=400&q=80",
    isActive: true,
  },
];

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

  // Products are stored per-shop to enable per-shop isolation
  getProducts(shopId: string): Product[] {
    const allProducts = this.get<Product[]>("trimly_products_all", INITIAL_PRODUCTS);
    return allProducts.filter(p => p.shopId === shopId);
  }
  setProducts(shopId: string, shopProducts: Product[]) {
    const allProducts = this.get<Product[]>("trimly_products_all", INITIAL_PRODUCTS);
    const others = allProducts.filter(p => p.shopId !== shopId);
    this.set("trimly_products_all", [...others, ...shopProducts]);
  }

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
  
  let token: string | null = null;
  const isB2B = path.startsWith("/barbers") || 
                path.startsWith("/services") || 
                path.startsWith("/shops") || 
                path.startsWith("/statistics") || 
                path.startsWith("/bookings/manual") || 
                path.startsWith("/bookings/me/barber");

  if (isB2B && typeof window !== "undefined") {
    const clerk = (window as any).Clerk;
    if (clerk?.session) {
      try {
        token = await clerk.session.getToken();
      } catch (err) {
        console.error("Failed to retrieve Clerk B2B token:", err);
      }
    }
  }

  if (!token && typeof window !== "undefined") {
    token = localStorage.getItem("trimly_auth_token");
  }

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
    create: async (payload: { name: string; price: number; durationMinutes: number; category?: string }): Promise<{ success: boolean; data: Service }> => {
      if (USE_MOCK) {
        const active = mockDb.getActiveUser();
        const newServ: Service = {
          id: "serv_" + Math.random().toString(36).substr(2, 9),
          barberId: active.clerkId,
          name: payload.name,
          price: payload.price,
          durationMinutes: payload.durationMinutes,
          isActive: true,
          category: payload.category,
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

    update: async (id: string, payload: { name?: string; price?: number; durationMinutes?: number; category?: string }): Promise<{ success: boolean; data: Service }> => {
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
        // Query ±1 day window to capture bookings crossing midnight or shifted timezone boundaries
        const startOfDay = new Date(`${dateStr}T00:00:00.000Z`).getTime();
        const endOfDay = new Date(`${dateStr}T23:59:59.999Z`).getTime();

        const bookings = mockDb.getBookings().filter(b => {
          if (b.barberId !== clerkId || b.status === "CANCELLED") return false;
          const bStart = new Date(b.startTime).getTime();
          const bEnd = new Date(b.endTime).getTime();
          return bStart <= endOfDay && bEnd >= startOfDay;
        });

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

    createOnline: async (payload: { barberId: string; serviceId: string; startTime: string; paymentOption?: "ARRIVE" | "STRIPE" }): Promise<{ success: boolean; data: { booking: Booking; clientSecret: string } }> => {
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
          paymentStatus: payload.paymentOption === "ARRIVE" ? "PENDING" : "PAID",
          paymentIntentId: payload.paymentOption === "ARRIVE" ? undefined : "pi_mock_" + Math.random().toString(36).substr(2, 5),
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

    createManual: async (payload: { serviceId: string; startTime: string; customerName?: string; customerPhone?: string; notes?: string; durationMinutes?: number }): Promise<{ success: boolean; data: Booking }> => {
      if (USE_MOCK) {
        const active = mockDb.getActiveUser();
        const services = mockDb.getServices();
        const service = services.find(s => s.id === payload.serviceId);
        const duration = payload.durationMinutes || (service ? service.durationMinutes : 30);
        const endTime = new Date(new Date(payload.startTime).getTime() + duration * 60 * 1000).toISOString();

        const isBlocked = payload.notes?.startsWith("[BLOCKED]");
        const newBooking: Booking = {
          id: "book_" + Math.random().toString(36).substr(2, 9),
          barberId: active.clerkId,
          serviceId: payload.serviceId,
          serviceSnapshot: {
            name: isBlocked ? "Blocked Time" : (service ? service.name : "Men Haircut"),
            price: isBlocked ? 0 : (service ? service.price : 2500),
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
        const slug = name.toLowerCase().replace(/ /g, "-");
        const RESERVED_SLUGS = ["dashboard", "billing", "pricing", "api", "login", "admin", "settings", "register", "auth"];
        if (RESERVED_SLUGS.includes(slug)) {
          throw new Error("This salon slug matches a system-reserved route. Please choose another name.");
        }
        const newShop: Shop = {
          id: "shop_" + Math.random().toString(36).substr(2, 9),
          ownerId: active.clerkId,
          name,
          slug,
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
    
    updateMe: async (payload: Partial<Shop>): Promise<{ success: boolean; data: Shop }> => {
      if (USE_MOCK) {
        const active = mockDb.getActiveUser();
        const shops = mockDb.getShops();
        const idx = shops.findIndex(s => s.ownerId === active.clerkId || s.id === mockDb.getBarbers().find(b => b.clerkId === active.clerkId)?.shopId);
        if (idx === -1) throw new Error("Shop not found");
        shops[idx] = { ...shops[idx], ...payload };
        mockDb.setShops(shops);
        return { success: true, data: shops[idx] };
      }
      return request("/shops/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
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

  // ==========================================
  // 8. SEARCH & MEDIA UPLOAD
  // ==========================================
  search: async (params: {
    city?: string;
    industryType?: string;
    searchQuery?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    success: boolean;
    data: {
      results: Array<{
        type: "shop" | "barber";
        id: string;
        name: string;
        slug: string;
        images?: string[];
        profileImage?: string;
        industryType?: string;
        city?: string;
      }>;
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    };
  }> => {
    if (USE_MOCK) {
      const shops = mockDb.getShops();
      const barbers = mockDb.getBarbers();
      const results: any[] = [];

      // Filter shops
      shops.forEach(shop => {
        let match = true;
        if (params.city && shop.city?.toLowerCase() !== params.city.toLowerCase()) {
          match = false;
        }
        if (params.industryType && shop.industryType !== params.industryType) {
          match = false;
        }
        if (params.searchQuery && !shop.name.toLowerCase().includes(params.searchQuery.toLowerCase())) {
          match = false;
        }
        if (match) {
          results.push({
            type: "shop",
            id: shop.id,
            name: shop.name,
            slug: shop.slug,
            images: shop.images,
            profileImage: shop.profileImage,
            industryType: shop.industryType,
            city: shop.city
          });
        }
      });

      // Filter barbers (if industryType is "Barber" or not specified)
      const isBarberIndustry = !params.industryType || params.industryType === "Barber";
      if (isBarberIndustry) {
        barbers.forEach(barber => {
          let match = true;
          if (params.city && barber.city?.toLowerCase() !== params.city.toLowerCase() && !barber.address?.toLowerCase().includes(params.city.toLowerCase())) {
            match = false;
          }
          if (params.searchQuery && !barber.name.toLowerCase().includes(params.searchQuery.toLowerCase())) {
            match = false;
          }
          if (match) {
            results.push({
              type: "barber",
              id: barber.id,
              name: barber.name,
              slug: barber.slug,
              images: barber.images,
              profileImage: barber.profileImage,
              industryType: "Barber",
              city: barber.city || "London"
            });
          }
        });
      }

      const page = params.page || 1;
      const limit = params.limit || 10;
      const total = results.length;
      const totalPages = Math.ceil(total / limit);
      const paginatedResults = results.slice((page - 1) * limit, page * limit);

      return {
        success: true,
        data: {
          results: paginatedResults,
          pagination: {
            total,
            page,
            limit,
            totalPages
          }
        }
      };
    }

    const query = new URLSearchParams();
    if (params.city) query.set("city", params.city);
    if (params.industryType) query.set("industryType", params.industryType);
    if (params.searchQuery) query.set("searchQuery", params.searchQuery);
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());

    return request(`/search?${query.toString()}`);
  },

  upload: async (file: File): Promise<{ success: boolean; data: { url: string; filename: string; contentType: string; size: number } }> => {
    if (USE_MOCK) {
      const active = mockDb.getActiveUser();
      const mockUrl = `https://cdn.trimly.app/uploads/barbers/${active.clerkId}/images/${Math.random().toString(36).substr(2, 9)}_${file.name}`;
      return {
        success: true,
        data: {
          url: mockUrl,
          filename: file.name,
          contentType: file.type,
          size: file.size
        }
      };
    }

    const formData = new FormData();
    formData.append("file", file);

    const headers = new Headers();
    if (typeof window !== "undefined") {
      const clerk = (window as any).Clerk;
      if (clerk?.session) {
        try {
          const token = await clerk.session.getToken();
          if (token) headers.set("Authorization", `Bearer ${token}`);
        } catch (err) {
          console.error("Failed to retrieve Clerk token for upload:", err);
        }
      }
    }
    const response = await fetch(`/api/v1/upload`, {
      method: "POST",
      body: formData,
      headers
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "File upload failed");
    }
    return data;
  },

  // ==========================================
  // 9. PRODUCTS MARKETPLACE (Per-Shop)
  // ==========================================
  products: {
    getShopProducts: async (shopId: string): Promise<{ success: boolean; data: Product[] }> => {
      if (USE_MOCK) {
        const products = mockDb.getProducts(shopId);
        return { success: true, data: products };
      }
      return request(`/shops/${shopId}/products`);
    },

    create: async (payload: {
      shopId: string;
      name: string;
      description: string;
      price: number;
      imageUrl: string;
    }): Promise<{ success: boolean; data: Product }> => {
      if (USE_MOCK) {
        const products = mockDb.getProducts(payload.shopId);
        const newProd: Product = {
          id: "prod_" + Math.random().toString(36).substr(2, 9),
          shopId: payload.shopId,
          name: payload.name,
          description: payload.description,
          price: payload.price,
          imageUrl: payload.imageUrl,
          isActive: true,
        };
        mockDb.setProducts(payload.shopId, [...products, newProd]);
        return { success: true, data: newProd };
      }
      return request(`/shops/${payload.shopId}/products`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    update: async (id: string, shopId: string, payload: Partial<{
      name: string;
      description: string;
      price: number;
      imageUrl: string;
      isActive: boolean;
    }>): Promise<{ success: boolean; data: Product }> => {
      if (USE_MOCK) {
        const products = mockDb.getProducts(shopId);
        const updated = products.map(p => p.id === id ? { ...p, ...payload } : p);
        mockDb.setProducts(shopId, updated);
        const result = updated.find(p => p.id === id)!;
        return { success: true, data: result };
      }
      return request(`/shops/${shopId}/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },

    delete: async (id: string, shopId: string): Promise<{ success: boolean }> => {
      if (USE_MOCK) {
        const products = mockDb.getProducts(shopId);
        mockDb.setProducts(shopId, products.filter(p => p.id !== id));
        return { success: true };
      }
      return request(`/shops/${shopId}/products/${id}`, { method: "DELETE" });
    },
  },
};

