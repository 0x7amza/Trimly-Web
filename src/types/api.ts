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
  avatarUrl?: string;
  images?: string[];
  galleryPictures?: string[]; // fallback
  profileImage?: string;
  profilePicture?: string; // fallback
  city?: string;
  businessHours?: BusinessHours[];
}

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  subscription?: Subscription;
  maxBarbersIncluded?: number;
  images?: string[];
  galleryPictures?: string[]; // fallback
  profileImage?: string;
  profilePicture?: string; // fallback
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  mapUrl?: string;
  googleMapsUrl?: string;
  businessHours?: BusinessHours[];
  avgRating?: number;
  totalReviews?: number;
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
  price: number; // in pence
  durationMinutes: number;
  isActive: boolean;
  categoryName?: string;
  categoryId?: string;
  category?: string; // fallback
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
  customerName?: string;   // walk-in or online customer name
  customerPhone?: string;  // used to call the customer directly
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string;
  price: number; // in pence
  imageUrl: string;
  isActive: boolean;
}
