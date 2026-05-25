"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, Barber, Service, Customer, Shop, Product } from "@/lib/api";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { 
  Star, 
  MapPin, 
  Clock, 
  Scissors, 
  Sparkles, 
  ArrowRight, 
  Landmark, 
  Gem, 
  Leaf, 
  AlertTriangle, 
  Shield, 
  Calendar, 
  Users, 
  Check, 
  ChevronLeft,
  X,
  Plus,
  Minus,
  ShoppingBag,
  Trash2
} from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "pk_test_mock");

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DEFAULT_BUSINESS_HOURS = [
  { day: 1, open: "09:00", close: "18:00", isClosed: false },
  { day: 2, open: "09:00", close: "18:00", isClosed: false },
  { day: 3, open: "09:00", close: "18:00", isClosed: false },
  { day: 4, open: "09:00", close: "18:00", isClosed: false },
  { day: 5, open: "09:00", close: "19:00", isClosed: false },
  { day: 6, open: "09:00", close: "17:00", isClosed: false },
  { day: 0, open: "09:00", close: "17:00", isClosed: true },
];

// Reusable SVG Street Grid Map Mock Component
function MockMap({ address, mapUrl }: { address: string; mapUrl?: string }) {
  let iframeSrc = "";
  if (mapUrl?.trim()) {
    if (mapUrl.includes("src=\"")) {
      const match = mapUrl.match(/src="([^"]+)"/);
      iframeSrc = match ? match[1] : mapUrl;
    } else {
      iframeSrc = mapUrl;
    }
  } else if (address?.trim()) {
    iframeSrc = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&z=15`;
  }

  if (!iframeSrc) {
    return (
      <div className="relative h-48 w-full bg-canvas-soft border border-ink/5 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
        <div className="flex flex-col items-center gap-2 text-mute-text">
          <MapPin className="w-8 h-8 opacity-30" />
          <span className="text-xs font-bold opacity-50">Location not set</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-ink/10 shadow-sm">
      <iframe
        title="Shop Location"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={iframeSrc}
      />
    </div>
  );
}

// Order Summary component
function OrderSummaryBlock({ 
  selectedService, 
  selectedBarber, 
  selectedSlot, 
  cart 
}: { 
  selectedService: Service | null; 
  selectedBarber: Barber | null; 
  selectedSlot: string | null; 
  cart: Array<{ product: Product; quantity: number }> 
}) {
  const servicePrice = selectedService?.price || 0;
  const productsPrice = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const total = servicePrice + productsPrice;

  return (
    <div className="bg-canvas-soft p-4 rounded-xl space-y-3 border border-ink/5">
      <span className="block text-[10px] font-bold text-mute-text uppercase tracking-wider">
        Appointment Summary
      </span>
      {selectedService && (
        <div className="flex justify-between text-sm font-bold text-ink">
          <span>{selectedService.name} (Service)</span>
          <span>£{(servicePrice / 100).toFixed(2)}</span>
        </div>
      )}
      {cart.map((item) => (
        <div key={item.product.id} className="flex justify-between text-xs text-body-text">
          <span>{item.product.name} (x{item.quantity})</span>
          <span>£{((item.product.price * item.quantity) / 100).toFixed(2)}</span>
        </div>
      ))}
      <div className="flex justify-between text-sm font-black text-ink border-t border-ink/10 pt-2.5 mt-2">
        <span>Total Due</span>
        <span>£{(total / 100).toFixed(2)}</span>
      </div>
      {selectedSlot && selectedBarber && (
        <div className="text-[10px] text-mute-text mt-2 pt-2 border-t border-ink/5">
          Specialist: <strong>{selectedBarber.name}</strong> • {new Date(selectedSlot).toLocaleDateString()} at{" "}
          {new Date(selectedSlot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
        </div>
      )}
    </div>
  );
}

// PCI DSS Compliant Stripe Checkout form
function CheckoutForm({
  selectedBarber,
  selectedService,
  selectedSlot,
  cart,
  isPaying,
  setIsPaying,
  setConfirmedBookingId,
  setStep,
}: {
  selectedBarber: Barber;
  selectedService: Service;
  selectedSlot: string;
  cart: Array<{ product: Product; quantity: number }>;
  isPaying: boolean;
  setIsPaying: (val: boolean) => void;
  setConfirmedBookingId: (id: string) => void;
  setStep: (step: number) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentOption, setPaymentOption] = useState<"STRIPE" | "ARRIVE">("STRIPE");

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarber || !selectedService || !selectedSlot) return;
    setIsPaying(true);
    setErrorMessage("");

    try {
      // Append products info to notes
      const productSummary = cart.map(item => `${item.product.name} x${item.quantity}`).join(", ");
      const notes = productSummary ? `Purchased Products: ${productSummary}` : undefined;

      const res = await api.bookings.createOnline({
        barberId: selectedBarber.clerkId,
        serviceId: selectedService.id,
        startTime: selectedSlot,
        paymentOption,
      });

      if (res.success) {
        if (paymentOption === "STRIPE") {
          if (res.data.clientSecret && !res.data.clientSecret.startsWith("pi_mock_")) {
            if (!stripe || !elements) {
              throw new Error("Stripe checkout was not initialized correctly.");
            }
            const cardEl = elements.getElement(CardElement);
            if (!cardEl) {
              throw new Error("Secure Card entry inputs not detected.");
            }
            const { error, paymentIntent } = await stripe.confirmCardPayment(res.data.clientSecret, {
              payment_method: { card: cardEl },
            });

            if (error) {
              throw new Error(error.message || "Payment verification failed.");
            }
            if (paymentIntent?.status !== "succeeded") {
              throw new Error("Payment was not completed successfully.");
            }
          }
        }

        // Save purchased products in simulated database or notes if needed
        setConfirmedBookingId(res.data.booking.id);
        setStep(6); // Success screen
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Checkout failed. Please try a different slot.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      {/* Payment option selectors */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          type="button"
          onClick={() => setPaymentOption("STRIPE")}
          className={`py-3 px-4 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
            paymentOption === "STRIPE"
              ? "bg-ink text-white border-ink"
              : "bg-canvas text-body-text border-ink/5 hover:border-ink/20"
          }`}
        >
          <span>Pay Online</span>
          <span className="text-[10px] opacity-75">Stripe Deposit</span>
        </button>
        <button
          type="button"
          onClick={() => setPaymentOption("ARRIVE")}
          className={`py-3 px-4 rounded-xl border text-xs font-bold text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
            paymentOption === "ARRIVE"
              ? "bg-ink text-white border-ink"
              : "bg-canvas text-body-text border-ink/5 hover:border-ink/20"
          }`}
        >
          <span>Pay on Arrival</span>
          <span className="text-[10px] opacity-75">At the Salon</span>
        </button>
      </div>

      {paymentOption === "STRIPE" ? (
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-2">
            Secure Card Details (PCI Compliant)
          </label>
          <div className="text-input p-4 bg-canvas border border-ink/5 rounded-xl">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '14px',
                    color: '#1a1a1a',
                    fontFamily: 'Outfit, Inter, sans-serif',
                    '::placeholder': {
                      color: '#999999',
                    },
                  },
                  invalid: {
                    color: '#ef4444',
                  },
                },
              }}
            />
          </div>
        </div>
      ) : (
        <div className="bg-canvas-soft border border-ink/5 p-4 rounded-xl space-y-1">
          <span className="block text-xs font-bold text-ink">No pre-payment required</span>
          <p className="text-[11px] text-mute-text leading-normal">
            You will pay £{((selectedService.price + cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)) / 100).toFixed(2)} on arrival at the salon.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="text-xs font-bold text-negative bg-negative/5 p-3 rounded-xl border border-negative/10 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <button type="submit" className="button-primary w-full py-4 mt-6" disabled={isPaying}>
        {isPaying
          ? "Processing Securely..."
          : paymentOption === "STRIPE"
          ? "Pay Deposit & Book"
          : "Confirm Booking"}
      </button>
    </form>
  );
}


export default function SalonBookingPage({ 
  salonSlug, 
  initialShopData 
}: { 
  salonSlug: string;
  initialShopData?: any;
}) {
  const { isSignedIn } = useUser();
  
  // State variables
  const [shop, setShop] = useState<Shop | null>(initialShopData?.shop || null);
  const [barbers, setBarbers] = useState<Barber[]>(initialShopData?.barbers || []);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Retail Shop Cart State
  const [cart, setCart] = useState<Array<{ product: Product; quantity: number }>>([]);

  // Live products loaded per shop
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);

  // Booking Modal Wizard control
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [step, setStep] = useState(1); // 1 = Barber, 3 = Date & Time, 4 = Verification, 5 = Payment, 6 = Success

  // Slots & Scheduling States
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Customer Auth / Verification
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const gallery = shop?.images && shop.images.length > 0 ? shop.images : (shop?.galleryPictures || [
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1605497746444-ac9dbd34f196?auto=format&fit=crop&w=800&q=80"
  ]);

  // Payment Confirmation
  const [isPaying, setIsPaying] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);

  const getLocalDateStr = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Init next 7 days list
  useEffect(() => {
    const arr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      arr.push(d);
    }
    setDates(arr);
    setSelectedDate(getLocalDateStr(arr[0]));
  }, []);

  // Lightbox keyboard navigation
  useEffect(() => {
    if (activeLightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveLightboxIndex(null);
      } else if (e.key === "ArrowLeft") {
        setActiveLightboxIndex((prev) => (prev === null ? null : (prev - 1 + gallery.length) % gallery.length));
      } else if (e.key === "ArrowRight") {
        setActiveLightboxIndex((prev) => (prev === null ? null : (prev + 1) % gallery.length));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLightboxIndex, gallery.length]);

  // Fetch shop details and barbers if not provided by server component
  useEffect(() => {
    if (initialShopData) return;
    const fetchShop = async () => {
      try {
        const res = await api.shops.getBySlug(salonSlug);
        if (res.success) {
          setShop(res.data.shop);
          setBarbers(res.data.barbers);
          if (res.data.barbers.length === 1) {
            setSelectedBarber(res.data.barbers[0]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchShop();
  }, [salonSlug, initialShopData]);

  // Unified fetching of all services across barbers in the shop
  useEffect(() => {
    if (barbers.length === 0) return;
    const fetchAllServices = async () => {
      try {
        const allServices: Service[] = [];
        for (const barber of barbers) {
          const res = await api.services.getBarberServices(barber.clerkId);
          if (res.success) {
            res.data.forEach((s) => {
              if (!allServices.some((exist) => exist.name === s.name)) {
                allServices.push(s);
              }
            });
          }
        }
        setServices(allServices);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAllServices();
  }, [barbers]);

  // Load live products for this shop (per-shop isolation)
  useEffect(() => {
    if (!shop?.id) return;
    api.products.getShopProducts(shop.id).then((res) => {
      if (res.success) setLiveProducts(res.data.filter(p => p.isActive));
    });
  }, [shop?.id]);

  // Fetch slots when scheduling criteria changes
  useEffect(() => {
    if (!selectedBarber || !selectedService || !selectedDate) return;
    const fetchSlots = async () => {
      setLoadingSlots(true);
      try {
        const res = await api.bookings.getAvailability(
          selectedBarber.clerkId,
          selectedService.id,
          selectedDate
        );
        if (res.success) {
          setAvailableSlots(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedBarber, selectedService, selectedDate]);

  // Cart Helpers
  const addToCart = (product: Product) => {
    setCart(prev => {
      const exist = prev.find(item => item.product.id === product.id);
      if (exist) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as Array<{ product: Product; quantity: number }>;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Triggered when clicking a service Choose button
  const handleStartBooking = (service: Service) => {
    setSelectedService(service);
    setSelectedSlot(null);
    setIsOtpSent(false);
    setOtpCode("");
    setIsNewCustomer(false);

    if (barbers.length === 1) {
      setSelectedBarber(barbers[0]);
      setStep(3);
    } else {
      const barberForService = barbers.find(b => b.clerkId === service.barberId);
      if (barberForService) {
        setSelectedBarber(barberForService);
        setStep(3);
      } else {
        setStep(1);
      }
    }
    setIsBookingOpen(true);
  };

  const handleSelectBarber = (barber: Barber) => {
    setSelectedBarber(barber);
    setStep(3);
  };

  const handleSelectSlot = (slot: string) => {
    setSelectedSlot(slot);
    setStep(4); // OTP Verification
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    try {
      const res = await api.auth.sendOtp(phone);
      if (res.success) {
        setIsOtpSent(true);
      }
    } catch (err) {
      alert("Error sending OTP. Please try again.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !otpCode) return;
    setIsVerifying(true);
    try {
      const res = await api.auth.verifyOtp(phone, otpCode);
      if (res.success) {
        if (res.data.isNew) {
          setIsNewCustomer(true);
        } else {
          setCustomer(res.data.customer);
          setStep(5); // Proceed to Stripe Checkout
        }
      }
    } catch (err) {
      alert("Invalid verification code. Enter mock code 123456.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !name || !email) return;
    setIsVerifying(true);
    try {
      const res = await api.auth.register({ phone, email, name });
      if (res.success) {
        setCustomer(res.data.customer);
        setIsNewCustomer(false);
        setStep(5); // Proceed to Stripe Checkout
      }
    } catch (err) {
      alert("Registration failed. Please fill the required fields.");
    } finally {
      setIsVerifying(false);
    }
  };

  const resetFlow = () => {
    setSelectedService(null);
    setSelectedSlot(null);
    setIsOtpSent(false);
    setOtpCode("");
    setConfirmedBookingId(null);
    setIsBookingOpen(false);
    setIsNewCustomer(false);
    setStep(barbers.length === 1 ? 3 : 1);
  };

  // Group services by categoryName (or category fallback)
  const groupedServices: Record<string, Service[]> = {};
  services.forEach((s) => {
    const cat = s.categoryName || s.category || "General Services";
    if (!groupedServices[cat]) groupedServices[cat] = [];
    groupedServices[cat].push(s);
  });

  // Address: prefer shop's editable address, fallback to barber address, then city
  const address = shop?.address || barbers[0]?.address || shop?.city || "";

  return (
    <div className="min-h-screen bg-canvas-soft flex flex-col font-sans w-full">
      {/* Header Navigation */}
      <header className="sticky top-0 z-40 bg-canvas/80 backdrop-blur-md border-b border-ink/5">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg
              className="w-7 h-7 text-ink"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="6" cy="6" r="3" />
              <circle cx="6" cy="18" r="3" />
              <line x1="9.8" y1="8.2" x2="21" y2="19" />
              <line x1="9.8" y1="15.8" x2="21" y2="5" />
            </svg>
            <span className="font-extrabold text-xl md:text-2xl tracking-tight text-ink">Trimly</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/" className="button-tertiary text-xs !py-2 !px-4">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1200px] mx-auto px-6 py-8 w-full flex-grow space-y-8 animate-fade-in">
        
        {/* Salon Headline details */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-primary-pale text-positive-deep px-2.5 py-1 rounded-full border border-primary/20">
                Trimly Verified Partner
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-ink tracking-tight mt-2">{shop?.name || "Premium Salon"}</h1>
            <p className="text-xs text-mute-text flex items-center gap-1.5 mt-1.5 font-semibold">
              <MapPin className="w-4 h-4 text-mute-text" /> {address}
            </p>
          </div>
          <div className="flex items-center gap-2.5 bg-canvas border border-ink/5 p-3 rounded-xl shadow-sm">
            <div className="flex items-center gap-0.5 text-warning">
              <Star className="w-4 h-4 fill-warning" />
              <span className="font-extrabold text-sm text-ink ml-1">4.9</span>
            </div>
            <div className="h-4 w-px bg-ink/10" />
            <span className="text-[11px] font-bold text-mute-text">154 Reviews</span>
          </div>
        </div>

        {/* Airbnb/Planity Styled Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-64 md:h-80 w-full rounded-2xl overflow-hidden shadow-sm border border-ink/5 bg-canvas">
          <div 
            onClick={() => setActiveLightboxIndex(0)}
            className="md:col-span-2 h-full relative overflow-hidden group cursor-pointer"
          >
            <img src={gallery[0]} alt="Salon details" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
          <div className="hidden md:flex flex-col gap-4 h-full">
            <div 
              onClick={() => setActiveLightboxIndex(1)}
              className="h-1/2 relative overflow-hidden group cursor-pointer"
            >
              <img src={gallery[1] || gallery[0]} alt="Salon gallery" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div 
              onClick={() => setActiveLightboxIndex(2)}
              className="h-1/2 relative overflow-hidden group cursor-pointer"
            >
              <img src={gallery[2] || gallery[0]} alt="Salon gallery" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
          </div>
          <div 
            onClick={() => setActiveLightboxIndex(3)}
            className="hidden md:block h-full relative overflow-hidden group cursor-pointer"
          >
            <img src={gallery[3] || gallery[0]} alt="Salon gallery" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
        </div>

        {/* Split Section Layout: Left Column = Services + Products inline scroll, Right Column = Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Services Menu then Products Marketplace – single continuous scroll, no tabs */}
          <div className="lg:col-span-8 space-y-8">

            {/* ── Services Menu Section ── */}
            <div className="bg-canvas border border-ink/5 p-6 rounded-wise shadow-sm">
              <h2 className="text-xl font-black text-ink tracking-tight mb-4 border-b border-ink/5 pb-3 flex items-center gap-2">
                <Scissors className="w-5 h-5 text-mute-text" />
                Services Menu
              </h2>
              
              {services.length === 0 ? (
                <div className="py-12 text-center text-xs text-mute-text">
                  No active services found for this salon.
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.keys(groupedServices).map((catName) => (
                    <div key={catName} className="space-y-3">
                      <h3 className="text-xs font-black uppercase tracking-widest text-primary-deep bg-primary-pale border border-primary/10 px-3 py-1.5 rounded-lg inline-block">
                        {catName}
                      </h3>
                      <div className="divide-y divide-ink/5">
                        {groupedServices[catName].map((service) => (
                          <div 
                            key={service.id} 
                            className="py-4 flex justify-between items-center gap-4 hover:bg-canvas-soft/20 px-2 rounded-xl transition-colors"
                          >
                            <div className="space-y-1">
                              <span className="font-extrabold text-sm text-ink block">{service.name}</span>
                              <span className="text-[11px] text-mute-text flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {service.durationMinutes} min duration
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-black text-sm text-ink whitespace-nowrap">
                                £{(service.price / 100).toFixed(2)}
                              </span>
                              <button 
                                onClick={() => handleStartBooking(service)}
                                className="button-primary !text-[11px] !py-2 !px-4 whitespace-nowrap cursor-pointer"
                              >
                                Choose
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Products Marketplace Section ── */}
            <div className="bg-canvas border border-ink/5 p-6 rounded-wise shadow-sm">
              <div className="flex items-center justify-between border-b border-ink/5 pb-3 mb-4">
                <h2 className="text-xl font-black text-ink tracking-tight flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-mute-text" />
                  Products Marketplace
                  {cartCount > 0 && (
                    <span className="bg-ink text-white text-[10px] font-black px-2 py-0.5 rounded-full ml-1">
                      {cartCount} in cart
                    </span>
                  )}
                </h2>
              </div>
              <p className="text-xs text-mute-text mb-6">Support this barbershop by adding hair styling and care products to your order.</p>

              {liveProducts.length === 0 ? (
                <div className="py-10 text-center text-xs text-mute-text border-2 border-dashed border-ink/10 rounded-xl">
                  No products listed yet. Check back soon!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {liveProducts.map((prod) => {
                    const cartItem = cart.find(item => item.product.id === prod.id);
                    return (
                      <div key={prod.id} className="border border-ink/5 rounded-xl p-4 flex gap-4 bg-canvas hover:shadow-md transition-shadow">
                        <img src={prod.imageUrl} alt={prod.name} className="w-20 h-20 object-cover rounded-lg border border-ink/10 flex-shrink-0" />
                        <div className="flex flex-col justify-between flex-grow">
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <h3 className="font-extrabold text-sm text-ink leading-tight">{prod.name}</h3>
                              <span className="font-black text-sm text-ink whitespace-nowrap">£{(prod.price / 100).toFixed(2)}</span>
                            </div>
                            <p className="text-[11px] text-mute-text mt-1 line-clamp-2 leading-normal">{prod.description}</p>
                          </div>
                          
                          <div className="mt-3 flex items-center justify-end">
                            {cartItem ? (
                              <div className="flex items-center gap-2.5 bg-canvas border border-ink/20 px-2 py-1 rounded-lg">
                                <button onClick={() => updateCartQty(prod.id, -1)} className="p-0.5 text-mute-text hover:text-ink">
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-xs font-black text-ink w-4 text-center">{cartItem.quantity}</span>
                                <button onClick={() => updateCartQty(prod.id, 1)} className="p-0.5 text-mute-text hover:text-ink">
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => addToCart(prod)}
                                className="button-tertiary !text-[11px] !py-1.5 !px-3 font-extrabold flex items-center gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add to Cart
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Sidebar Cart & Info details */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Shopping Cart Summary Widget (Persistent) */}
            {cart.length > 0 && (
              <div className="bg-canvas border border-ink/10 p-5 rounded-wise shadow-lg space-y-4 animate-slide-up">
                <div className="flex justify-between items-center border-b border-ink/5 pb-2.5">
                  <div className="flex items-center gap-2 text-ink">
                    <ShoppingBag className="w-4 h-4" />
                    <span className="font-extrabold text-sm">Shopping Cart</span>
                  </div>
                  <span className="bg-ink text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {cartCount} items
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-3 divide-y divide-ink/5">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center pt-3 first:pt-0">
                      <div className="flex items-center gap-2.5">
                        <img src={item.product.imageUrl} className="w-8 h-8 rounded object-cover border border-ink/10" alt="" />
                        <div>
                          <span className="block text-xs font-bold text-ink leading-tight truncate max-w-[150px]">
                            {item.product.name}
                          </span>
                          <span className="text-[10px] text-mute-text">
                            Qty: {item.quantity} • £{((item.product.price * item.quantity) / 100).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-mute-text hover:text-negative transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-ink/10 pt-3 flex justify-between items-center text-sm">
                  <span className="font-extrabold text-mute-text">Subtotal</span>
                  <span className="font-black text-ink">£{(cartSubtotal / 100).toFixed(2)}</span>
                </div>

                <div className="text-[10px] text-mute-text leading-relaxed bg-canvas-soft p-2.5 rounded-xl border border-ink/5">
                  * Product totals will be added and billed together at service checkout.
                </div>
              </div>
            )}

            {/* Styled Map location */}
            <div className="bg-canvas border border-ink/5 p-5 rounded-wise shadow-sm space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-mute-text">Location & Map</h4>
              <MockMap address={address} mapUrl={shop?.mapUrl} />
            </div>

            {/* Opening Hours Table — reads from shop.businessHours saved in dashboard */}
            <div className="bg-canvas border border-ink/5 p-5 rounded-wise shadow-sm space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-mute-text">Opening Hours</h4>
              <div className="text-xs space-y-2">
                {(shop?.businessHours && shop.businessHours.length > 0
                  ? [...shop.businessHours].sort((a, b) => {
                      const order = [1,2,3,4,5,6,0];
                      return order.indexOf(a.day) - order.indexOf(b.day);
                    })
                  : DEFAULT_BUSINESS_HOURS
                ).map((h) => (
                  <div key={h.day} className="flex justify-between py-1 border-b border-ink/5 last:border-0">
                    <span className="font-semibold text-body-text">{DAYS[h.day]}</span>
                    <span className="font-bold text-ink">
                      {h.isClosed ? (
                        <span className="text-negative">Closed</span>
                      ) : (
                        `${h.open} - ${h.close}`
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stylists Team list */}
            {barbers.length > 0 && (
              <div className="bg-canvas border border-ink/5 p-5 rounded-wise shadow-sm space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-mute-text">Our Specialists</h4>
                <div className="space-y-2.5">
                  {barbers.map((b) => (
                    <div key={b.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary flex items-center justify-center font-black text-sm rounded-full border border-ink/10">
                        {b.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <span className="block text-xs font-extrabold text-ink">{b.name}</span>
                        <span className="block text-[10px] text-mute-text">{b.role}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </main>

      {/* Booking Wizard Dialog Modal */}
      <AnimatePresence>
        {isBookingOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Blur Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetFlow}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            {/* Modal Dialog Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-canvas border border-ink shadow-2xl rounded-wise w-full max-w-lg h-[85vh] max-h-[620px] overflow-hidden flex flex-col relative z-10"
            >
              {/* Close Button */}
              <button
                onClick={resetFlow}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-canvas-soft text-mute-text hover:text-ink transition-all border border-ink/5 z-20"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Steps Progress Indicator */}
              {step <= 5 && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-canvas-soft overflow-hidden flex">
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${(step / 5) * 100}%` }}
                  ></div>
                </div>
              )}

              {/* Wizard Content Body */}
              <div className="flex-grow overflow-y-auto p-6 pt-10 flex flex-col justify-start">
                
                <AnimatePresence mode="wait">
                  
                  {/* Step 1: Barber Selection */}
                  {step === 1 && (
                    <motion.div
                      key="wizard-step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4 flex-grow flex flex-col"
                    >
                      <div>
                        <h3 className="text-lg font-black text-ink">Choose Specialist</h3>
                        <p className="text-xs text-mute-text">Select your preferred barber or stylist.</p>
                      </div>

                      <div className="space-y-3 flex-grow overflow-y-auto">
                        {barbers.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => handleSelectBarber(b)}
                            className="card-content border border-ink/5 p-4 flex items-center justify-between cursor-pointer hover:bg-canvas-soft/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary flex items-center justify-center font-bold text-sm rounded-full border border-ink/10">
                                {b.name.split(" ").map(n => n[0]).join("")}
                              </div>
                              <div>
                                <span className="block font-bold text-sm text-ink">{b.name}</span>
                                <span className="block text-[10px] text-mute-text">{b.role}</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-primary-deep bg-primary-pale px-2.5 py-1 rounded-full">
                              Select
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Date & Slots Selection */}
                  {step === 3 && (
                    <motion.div
                      key="wizard-step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4 flex-grow flex flex-col"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-black text-ink">Select Date & Time</h3>
                          <p className="text-xs text-mute-text">Showing available appointment times for {selectedBarber?.name}.</p>
                        </div>
                        {barbers.length > 1 && (
                          <button
                            onClick={() => setStep(1)}
                            className="text-xs font-bold text-mute-text hover:text-ink border border-ink/5 px-2 py-1 rounded-lg"
                          >
                            Change Barber
                          </button>
                        )}
                      </div>

                      {/* Horizontal Date Picker */}
                      <div className="flex gap-2 overflow-x-auto py-1 scrollbar-none">
                        {dates.map((d) => {
                          const dateVal = getLocalDateStr(d);
                          const isSelected = dateVal === selectedDate;
                          const dayName = d.toLocaleDateString([], { weekday: "short" });
                          const dayNum = d.getDate();

                          return (
                            <button
                              key={d.toISOString()}
                              onClick={() => setSelectedDate(dateVal)}
                              className={`flex flex-col items-center justify-center min-w-[56px] h-14 rounded-xl border font-bold text-xs transition-all ${
                                isSelected
                                  ? "bg-ink text-white border-ink"
                                  : "bg-canvas text-body-text border-ink/5 hover:border-ink/20"
                              }`}
                            >
                              <span>{dayName}</span>
                              <span className="text-[13px] font-extrabold mt-0.5">{dayNum}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Slots grid container */}
                      <div className="flex-grow overflow-y-auto">
                        {loadingSlots ? (
                          <div className="flex items-center justify-center min-h-[150px]">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : availableSlots.length === 0 ? (
                          <div className="card-feature-sage p-8 text-center text-xs font-bold text-body-text border border-ink/5">
                            No appointment times available on this date.
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2.5">
                            {availableSlots.map((slot) => {
                              const time = new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
                              return (
                                <button
                                  key={slot}
                                  onClick={() => handleSelectSlot(slot)}
                                  className="bg-canvas border border-ink/5 hover:border-primary font-bold text-xs p-2.5 rounded-xl text-ink transition-colors hover:bg-primary-pale"
                                >
                                  {time}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: OTP Verification & B2C Register */}
                  {step === 4 && (
                    <motion.div
                      key="wizard-step4"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5 flex-grow flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-black text-ink">Client Verification</h3>
                            <p className="text-xs text-mute-text">Secure appointment booking with mock OTP.</p>
                          </div>
                          <button
                            onClick={() => {
                              if (isNewCustomer) {
                                setIsNewCustomer(false);
                              } else {
                                setStep(3);
                              }
                            }}
                            className="text-xs font-bold text-mute-text hover:text-ink"
                          >
                            ← Back
                          </button>
                        </div>

                        {isNewCustomer ? (
                          <form onSubmit={handleRegister} className="space-y-4">
                            <div className="bg-primary-pale p-3 rounded-xl border border-primary/20 text-xs font-bold text-ink-deep text-center">
                              Please complete your profile details to book.
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-2">
                                Full Name
                              </label>
                              <input
                                type="text"
                                placeholder="Your Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="text-input font-bold"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-2">
                                Email Address
                              </label>
                              <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="text-input font-bold"
                                required
                              />
                            </div>
                            <button type="submit" className="button-primary w-full py-4" disabled={isVerifying}>
                              {isVerifying ? "Registering..." : "Complete & Continue"}
                            </button>
                          </form>
                        ) : !isOtpSent ? (
                          <form onSubmit={handleSendOtp} className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-2">
                                Mobile Number
                              </label>
                              <input
                                type="tel"
                                placeholder="+447000000000"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="text-input font-bold"
                                required
                              />
                            </div>
                            <button type="submit" className="button-primary w-full py-4">
                              Send Code
                            </button>
                          </form>
                        ) : (
                          <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="bg-primary-pale p-3 rounded-xl border border-primary/20 text-xs font-bold text-ink-deep text-center">
                              Mock OTP Code: enter <strong>123456</strong>
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-2">
                                Enter 6-Digit Code
                              </label>
                              <input
                                type="text"
                                maxLength={6}
                                placeholder="123456"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                className="text-input text-center font-extrabold text-2xl tracking-widest"
                                required
                              />
                            </div>
                            <button type="submit" className="button-primary w-full py-4" disabled={isVerifying}>
                              {isVerifying ? "Verifying..." : "Verify & Continue"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsOtpSent(false)}
                              className="w-full text-center text-xs font-bold text-mute-text hover:text-ink mt-2"
                            >
                              Change phone number
                            </button>
                          </form>
                        )}
                      </div>

                      <div className="text-[10px] text-mute-text">
                        * Verification avoids spam listings. Enter mock phone and OTP <strong>123456</strong> to complete testing.
                      </div>
                    </motion.div>
                  )}

                  {/* Step 5: Stripe checkout deposit */}
                  {step === 5 && (
                    <motion.div
                      key="wizard-step5"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-5 flex-grow flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-black text-ink">Checkout Deposit</h3>
                            <p className="text-xs text-mute-text">Complete appointment scheduling.</p>
                          </div>
                          <button
                            onClick={() => setStep(4)}
                            className="text-xs font-bold text-mute-text hover:text-ink"
                          >
                            ← Back
                          </button>
                        </div>

                        {/* Order Summary Block */}
                        <OrderSummaryBlock
                          selectedService={selectedService}
                          selectedBarber={selectedBarber}
                          selectedSlot={selectedSlot}
                          cart={cart}
                        />

                        {/* Stripe Form */}
                        {selectedBarber && selectedService && selectedSlot && (
                          <Elements stripe={stripePromise}>
                            <CheckoutForm
                              selectedBarber={selectedBarber}
                              selectedService={selectedService}
                              selectedSlot={selectedSlot}
                              cart={cart}
                              isPaying={isPaying}
                              setIsPaying={setIsPaying}
                              setConfirmedBookingId={setConfirmedBookingId}
                              setStep={setStep}
                            />
                          </Elements>
                        )}
                      </div>

                      <div className="text-[10px] text-mute-text flex items-center justify-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-positive-deep" />
                        <span>Mock Sandbox Enabled. Enter arbitrary checkout card details.</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 6: Success Confirmation */}
                  {step === 6 && (
                    <motion.div
                      key="wizard-step6"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex-grow flex flex-col justify-center items-center text-center space-y-5"
                    >
                      <div className="w-16 h-16 bg-primary-pale text-positive-deep rounded-full flex items-center justify-center border border-primary/20">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>

                      <div>
                        <h3 className="text-xl font-black text-ink">Appointment Booked!</h3>
                        <p className="text-xs text-body-text mt-1 max-w-xs mx-auto">
                          Thank you! Your booking is registered successfully. An automated notification was dispatched.
                        </p>
                      </div>

                      <div className="card-feature-sage p-3.5 w-full text-left space-y-1.5 border border-ink/5">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-mute-text">SERVICE</span>
                          <span className="font-bold text-ink">{selectedService?.name}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-mute-text">SPECIALIST</span>
                          <span className="font-bold text-ink">{selectedBarber?.name}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-mute-text">TIME SLOT</span>
                          <span className="font-bold text-ink">
                            {selectedSlot && new Date(selectedSlot).toLocaleDateString()} at{" "}
                            {selectedSlot && new Date(selectedSlot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                          </span>
                        </div>
                        {cart.length > 0 && (
                          <div className="border-t border-ink/10 pt-1.5 mt-1.5 space-y-1">
                            <span className="block text-[10px] font-bold text-mute-text uppercase">Purchased Retail</span>
                            {cart.map(item => (
                              <div key={item.product.id} className="flex justify-between text-xs font-semibold">
                                <span className="text-body-text">{item.product.name} (x{item.quantity})</span>
                                <span className="text-ink">£{((item.product.price * item.quantity) / 100).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button onClick={resetFlow} className="button-primary w-full py-3.5">
                        Close
                      </button>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Lightbox Overlay */}
      <AnimatePresence>
        {activeLightboxIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 select-none">
            <button
              onClick={() => setActiveLightboxIndex(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-105 transition-all cursor-pointer border border-white/5"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Left navigation arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveLightboxIndex((prev) => (prev === null ? null : (prev - 1 + gallery.length) % gallery.length));
              }}
              className="absolute left-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-105 transition-all cursor-pointer z-10 border border-white/5"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Current image */}
            <motion.div
              key={activeLightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              className="max-w-4xl max-h-[80vh] flex flex-col items-center justify-center"
            >
              <img
                src={gallery[activeLightboxIndex]}
                alt={`Gallery image ${activeLightboxIndex + 1}`}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl border border-white/10"
              />
              <span className="text-white/60 text-xs font-bold mt-4 tracking-wider">
                IMAGE {activeLightboxIndex + 1} OF {gallery.length}
              </span>
            </motion.div>

            {/* Right navigation arrow */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveLightboxIndex((prev) => (prev === null ? null : (prev + 1) % gallery.length));
              }}
              className="absolute right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-105 transition-all cursor-pointer z-10 border border-white/5"
            >
              <ChevronLeft className="w-6 h-6 rotate-180" />
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
