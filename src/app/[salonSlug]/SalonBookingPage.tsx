"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api, Barber, Service, Customer, Shop, ShopWithBarbers, Product } from "@/lib/api";
import PhoneInput from "@/components/ui/PhoneInput";
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
  Trash2,
  ExternalLink
} from "lucide-react";
import { getEmbeddableMapUrl } from "@/lib/utils";
import { ApiRequestError } from "@/lib/api-error";
import {
  addDaysToDateString,
  formatDateInTimeZone,
  getEarliestBookableTime,
  normalizeTimeZone,
} from "@/lib/booking-time";

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const isStripeClientConfigured = stripePublishableKey.startsWith("pk_") && !stripePublishableKey.includes("mock");
const stripePromise = isStripeClientConfigured ? loadStripe(stripePublishableKey) : Promise.resolve(null);

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

// Location map component — Google Maps embed or Leaflet/OSM fallback
function LocationMap({ address, mapUrl }: { address: string; mapUrl?: string }) {
  const embedUrl = mapUrl ? getEmbeddableMapUrl(mapUrl) : "";

  if (embedUrl) {
    return (
      <div className="relative h-52 sm:h-60 w-full rounded-2xl overflow-hidden border border-ink/10 shadow-sm bg-canvas-soft">
        <iframe
          title="Interactive Google Map"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={embedUrl}
        />
      </div>
    );
  }

  const query = address?.trim() || "";

  if (!query) {
    return (
      <div className="relative h-48 w-full bg-canvas-soft border border-ink/5 rounded-2xl overflow-hidden flex items-center justify-center shadow-inner">
        <div className="flex flex-col items-center gap-2 text-mute-text">
          <MapPin className="w-8 h-8 opacity-30" />
          <span className="text-xs font-bold opacity-50">Location not set</span>
        </div>
      </div>
    );
  }

  const srcDoc = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html, #map { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; }
        .leaflet-popup-content-wrapper { border-radius: 12px; font-family: sans-serif; font-size: 12px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var query = decodeURIComponent("${encodeURIComponent(query)}");
        var map = L.map('map', { zoomControl: true, scrollWheelZoom: false }).setView([54.5, -4], 6);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        var cleanQuery = query.replace(/\\s+/g, '');
        var coords = cleanQuery.split(',');
        if (coords.length === 2 && !isNaN(parseFloat(coords[0])) && !isNaN(parseFloat(coords[1]))) {
          var lat = parseFloat(coords[0]);
          var lng = parseFloat(coords[1]);
          map.setView([lat, lng], 15);
          L.marker([lat, lng]).addTo(map).bindPopup(query).openPopup();
        } else {
          var url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query);
          fetch(url, { headers: { 'User-Agent': 'TrimlyBookingApp/1.0' } })
            .then(function(r) { return r.json(); })
            .then(function(data) {
              if (data && data.length > 0) {
                var lat = parseFloat(data[0].lat);
                var lon = parseFloat(data[0].lon);
                map.setView([lat, lon], 15);
                L.marker([lat, lon]).addTo(map).bindPopup(query).openPopup();
              }
            }).catch(function(e) {
              console.error(e);
            });
        }
      </script>
    </body>
    </html>
  `;

  return (
    <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-ink/10 shadow-sm bg-canvas-soft">
      <iframe
        title="Interactive Map"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        srcDoc={srcDoc}
      />
    </div>
  );
}

// Order Summary component
function OrderSummaryBlock({ 
  selectedService, 
  selectedBarber, 
  selectedSlot, 
  cart,
  timeZone,
}: { 
  selectedService: Service | null; 
  selectedBarber: Barber | null; 
  selectedSlot: string | null; 
  cart: Array<{ product: Product; quantity: number }>;
  timeZone: string;
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
          Specialist: <strong>{selectedBarber.name}</strong> • {new Date(selectedSlot).toLocaleDateString([], { timeZone })} at{" "}
          {new Date(selectedSlot).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone })}
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
  onSlotUnavailable,
  stripeEnabled,
}: {
  selectedBarber: Barber;
  selectedService: Service;
  selectedSlot: string;
  cart: Array<{ product: Product; quantity: number }>;
  isPaying: boolean;
  setIsPaying: (val: boolean) => void;
  setConfirmedBookingId: (id: string) => void;
  setStep: (step: number) => void;
  onSlotUnavailable: () => Promise<void>;
  stripeEnabled: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentOption, setPaymentOption] = useState<"STRIPE" | "ARRIVE">(
    stripeEnabled ? "STRIPE" : "ARRIVE"
  );
  const [nowMs, setNowMs] = useState(() => Date.now());
  const selectedSlotIsValid =
    new Date(selectedSlot).getTime() >= getEarliestBookableTime(new Date(nowMs)).getTime();

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarber || !selectedService || !selectedSlot) return;
    if (!selectedSlotIsValid) {
      setErrorMessage("This time is no longer available. Please choose another slot.");
      await onSlotUnavailable();
      return;
    }
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
        notes,
      });

      if (res.success) {
        if (paymentOption === "STRIPE") {
          if (!stripeEnabled) {
            throw new Error("Online card payment is not enabled yet. Please choose Pay on Arrival.");
          }
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
          } else {
            throw new Error("Online card payment is not available for this salon yet.");
          }
        }

        setConfirmedBookingId(res.data.booking.id);
        setStep(6); // Success screen
      }
    } catch (error: unknown) {
      const isSlotError =
        error instanceof ApiRequestError &&
        ["PAST_BOOKING", "SLOT_UNAVAILABLE", "CONFLICT"].includes(error.code || "");
      if (isSlotError) {
        setErrorMessage("This time is no longer available. Please choose another slot.");
        await onSlotUnavailable();
      } else {
        setErrorMessage(error instanceof Error ? error.message : "Checkout failed. Please try a different slot.");
      }
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      {/* Payment option selectors */}
      <div className={`grid ${stripeEnabled ? "grid-cols-2" : "grid-cols-1"} gap-3 mb-4`}>
        {stripeEnabled && (
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
        )}
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

      {paymentOption === "STRIPE" && stripeEnabled ? (
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

      {!selectedSlotIsValid && (
        <div className="text-xs font-bold text-negative bg-negative/5 p-3 rounded-xl border border-negative/10">
          This time is no longer available. Please choose another slot.
        </div>
      )}

      <button
        type="submit"
        className="button-primary w-full py-4 mt-6"
        disabled={isPaying || !selectedSlotIsValid}
      >
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
  initialShopData?: ShopWithBarbers;
}) {
  const { isSignedIn } = useUser();
  
  // State variables
  const [shop, setShop] = useState<Shop | null>(initialShopData?.shop || null);
  const shopTimeZone = normalizeTimeZone(shop?.timezone);
  const [stripeEnabled, setStripeEnabled] = useState(false);
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

  // Real Reviews State & Handlers
  const [realReviews, setRealReviews] = useState<Array<{ id: string; customerName: string; rating: number; comment?: string; createdAt: string }>>([]);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [newReviewName, setNewReviewName] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState("");

  useEffect(() => {
    if (!salonSlug) return;
    api.reviews.getBySlug(salonSlug)
      .then(res => {
        if (res.success) setRealReviews(res.data);
      })
      .catch(console.error);
  }, [salonSlug]);

  const totalReviews = realReviews.length;
  // FIXED: Do NOT use a fake fallback rating — show real data only
  const avgRating = totalReviews > 0
    ? realReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0;

  useEffect(() => {
    if (!isStripeClientConfigured) return;
    api.config
      .getPublic()
      .then((response) => setStripeEnabled(response.success && response.data.onlinePaymentsEnabled))
      .catch(() => setStripeEnabled(false));
  }, []);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewName.trim() || !newReviewComment.trim()) return;
    try {
      const res = await api.reviews.create(salonSlug, {
        customerName: newReviewName.trim(),
        rating: newReviewRating,
        comment: newReviewComment.trim(),
      });
      if (res.success) {
        setRealReviews(prev => [res.data, ...prev]);
        setNewReviewName("");
        setNewReviewRating(5);
        setNewReviewComment("");
      }
    } catch (err) {
      alert("Failed to submit review.");
    }
  };

  // Slots & Scheduling States
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [slotNotice, setSlotNotice] = useState("");
  const [availabilityNowMs, setAvailabilityNowMs] = useState(() => Date.now());

  // Customer Auth / Verification
  const [phone, setPhone] = useState("");
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [otpSendError, setOtpSendError] = useState("");
  const [otpVerifyError, setOtpVerifyError] = useState("");
  const [sandboxOtp, setSandboxOtp] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const gallery = (shop?.images && shop.images.filter(Boolean).length > 0)
    ? shop.images.filter(Boolean)
    : ((shop?.galleryPictures && shop.galleryPictures.filter(Boolean).length > 0)
        ? shop.galleryPictures.filter(Boolean)
        : []);

  const renderGallery = () => {
    const validGallery = gallery.filter(Boolean);

    // Case 0: No images uploaded
    if (validGallery.length === 0) {
      return (
        <div className="w-full h-64 md:h-[350px] bg-canvas border border-ink/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center shadow-sm relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary-pale rounded-full blur-2xl opacity-50 transition-all group-hover:scale-110 duration-500" />
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-primary-pale rounded-full blur-2xl opacity-50 transition-all group-hover:scale-110 duration-500" />
          
          <div className="w-14 h-14 bg-primary-pale text-ink rounded-full flex items-center justify-center border border-ink/10 mb-4 shadow-sm z-10 transition-transform duration-300 group-hover:scale-105">
            <Scissors className="w-7 h-7 text-ink" />
          </div>
          
          <h3 className="text-lg font-black text-ink tracking-tight z-10">Welcome to {shop?.name || "Our Salon"}</h3>
          <p className="text-xs text-mute-text mt-2 max-w-sm leading-relaxed z-10">
            Our work portfolio and salon gallery are currently being updated. Book an appointment today to experience our premium service!
          </p>
        </div>
      );
    }

    // Case 1: Exactly 1 image
    if (validGallery.length === 1) {
      return (
        <div 
          onClick={() => setActiveLightboxIndex(0)}
          className="w-full h-64 md:h-[350px] relative overflow-hidden rounded-xl bg-canvas cursor-pointer group shadow-sm"
        >
          <img src={validGallery[0]} alt="Salon details" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.015]" />
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <span className="text-white text-xs font-bold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">View Photo</span>
          </div>
        </div>
      );
    }

    // Case 2: Exactly 2 images
    if (validGallery.length === 2) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-64 md:h-[350px] w-full">
          <div onClick={() => setActiveLightboxIndex(0)} className="h-full relative overflow-hidden rounded-xl group cursor-pointer">
            <img src={validGallery[0]} alt="Salon details" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.015]" />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <span className="text-white text-xs font-bold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">View Photo</span>
            </div>
          </div>
          <div onClick={() => setActiveLightboxIndex(1)} className="hidden md:block h-full relative overflow-hidden rounded-xl group cursor-pointer">
            <img src={validGallery[1]} alt="Salon details" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.015]" />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <span className="text-white text-xs font-bold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">View Photo</span>
            </div>
          </div>
        </div>
      );
    }

    // Case 3: Exactly 3 images
    if (validGallery.length === 3) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-3 h-64 md:h-[350px] w-full">
          {/* Large Left Image (0) */}
          <div 
            onClick={() => setActiveLightboxIndex(0)} 
            className="md:col-start-1 md:col-span-2 md:row-start-1 md:row-span-2 h-full relative overflow-hidden rounded-xl group cursor-pointer"
          >
            <img src={validGallery[0]} alt="Salon details" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.015]" />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <span className="text-white text-xs font-bold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">View Photo</span>
            </div>
          </div>
          
          {/* Top-Right Image (1) */}
          <div 
            onClick={() => setActiveLightboxIndex(1)} 
            className="hidden md:block md:col-start-3 md:col-span-1 md:row-start-1 md:row-span-1 h-full relative overflow-hidden rounded-xl group cursor-pointer"
          >
            <img src={validGallery[1]} alt="Salon details" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
              <span className="text-white text-[10px] font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">View Photo</span>
            </div>
          </div>
          
          {/* Bottom-Right Image (2) */}
          <div 
            onClick={() => setActiveLightboxIndex(2)} 
            className="hidden md:block md:col-start-3 md:col-span-1 md:row-start-2 md:row-span-1 h-full relative overflow-hidden rounded-xl group cursor-pointer"
          >
            <img src={validGallery[2]} alt="Salon details" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
              <span className="text-white text-[10px] font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">View Photo</span>
            </div>
          </div>
        </div>
      );
    }

    // Case 4: Exactly 4 images
    if (validGallery.length === 4) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-3 h-64 md:h-[350px] w-full">
          {/* Large Left Image (0) */}
          <div 
            onClick={() => setActiveLightboxIndex(0)} 
            className="md:col-start-1 md:col-span-2 md:row-start-1 md:row-span-2 h-full relative overflow-hidden rounded-xl group cursor-pointer"
          >
            <img src={validGallery[0]} alt="Salon details" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.015]" />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <span className="text-white text-xs font-bold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">View Photo</span>
            </div>
          </div>
          
          {/* Middle Top Image (1) */}
          <div 
            onClick={() => setActiveLightboxIndex(1)} 
            className="hidden md:block md:col-start-3 md:col-span-1 md:row-start-1 md:row-span-1 h-full relative overflow-hidden rounded-xl group cursor-pointer"
          >
            <img src={validGallery[1]} alt="Salon details" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
              <span className="text-white text-[10px] font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">View Photo</span>
            </div>
          </div>
          
          {/* Middle Bottom Image (2) */}
          <div 
            onClick={() => setActiveLightboxIndex(2)} 
            className="hidden md:block md:col-start-3 md:col-span-1 md:row-start-2 md:row-span-1 h-full relative overflow-hidden rounded-xl group cursor-pointer"
          >
            <img src={validGallery[2]} alt="Salon details" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02]" />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
              <span className="text-white text-[10px] font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">View Photo</span>
            </div>
          </div>
          
          {/* Right Image (3) - spans full height */}
          <div 
            onClick={() => setActiveLightboxIndex(3)} 
            className="hidden md:block md:col-start-4 md:col-span-1 md:row-start-1 md:row-span-2 h-full relative overflow-hidden rounded-xl group cursor-pointer"
          >
            <img src={validGallery[3]} alt="Salon details" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.015]" />
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
              <span className="text-white text-xs font-bold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">View Photo</span>
            </div>
          </div>
        </div>
      );
    }

    // Case 5+: Airbnb-style layout (5 images in a grid: 1 large left, 2 stacked middle, 2 stacked right)
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-3 h-64 md:h-[350px] w-full">
        {/* Large Left Image (0) */}
        <div 
          onClick={() => setActiveLightboxIndex(0)}
          className="md:col-start-1 md:col-span-2 md:row-start-1 md:row-span-2 h-full relative overflow-hidden rounded-xl group cursor-pointer"
        >
          <img src={validGallery[0]} alt="Salon details" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.015]" />
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <span className="text-white text-xs font-bold bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">View Photo</span>
          </div>
        </div>
        
        {/* Middle Top Image (1) */}
        <div 
          onClick={() => setActiveLightboxIndex(1)}
          className="hidden md:block md:col-start-3 md:col-span-1 md:row-start-1 md:row-span-1 h-full relative overflow-hidden rounded-xl group cursor-pointer"
        >
          <img src={validGallery[1]} alt="Salon details" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02]" />
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
            <span className="text-white text-[10px] font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">View Photo</span>
          </div>
        </div>
        
        {/* Right Top Image (2) */}
        <div 
          onClick={() => setActiveLightboxIndex(2)}
          className="hidden md:block md:col-start-4 md:col-span-1 md:row-start-1 md:row-span-1 h-full relative overflow-hidden rounded-xl group cursor-pointer"
        >
          <img src={validGallery[2]} alt="Salon details" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02]" />
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
            <span className="text-white text-[10px] font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">View Photo</span>
          </div>
        </div>
        
        {/* Middle Bottom Image (3) */}
        <div 
          onClick={() => setActiveLightboxIndex(3)}
          className="hidden md:block md:col-start-3 md:col-span-1 md:row-start-2 md:row-span-1 h-full relative overflow-hidden rounded-xl group cursor-pointer"
        >
          <img src={validGallery[3]} alt="Salon details" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02]" />
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
            <span className="text-white text-[10px] font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">View Photo</span>
          </div>
        </div>
        
        {/* Right Bottom Image (4) with Blur Overlay if > 5 */}
        <div 
          onClick={() => setActiveLightboxIndex(4)}
          className="hidden md:block md:col-start-4 md:col-span-1 md:row-start-2 md:row-span-1 h-full relative overflow-hidden rounded-xl group cursor-pointer"
        >
          <img src={validGallery[4]} alt="Salon details" className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02]" />
          
          {validGallery.length > 5 ? (
            <div className="absolute inset-0 bg-black/35 backdrop-blur-xs flex flex-col items-center justify-center text-center p-3 text-white transition-colors group-hover:bg-black/45">
              <span className="font-extrabold text-xs tracking-wide">View all {validGallery.length} photos</span>
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
              <span className="text-white text-[10px] font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">View Photo</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Payment Confirmation
  const [isPaying, setIsPaying] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);

  const dates = useMemo(() => {
    const today = formatDateInTimeZone(new Date(), shopTimeZone);
    const arr: string[] = [];
    for (let i = 0; i < 7; i++) {
      arr.push(addDaysToDateString(today, i));
    }
    return arr;
  }, [shopTimeZone]);
  const activeSelectedDate = dates.includes(selectedDate) ? selectedDate : dates[0] || "";
  const visibleAvailableSlots = useMemo(() => {
    const earliest = getEarliestBookableTime(new Date(availabilityNowMs)).getTime();
    return availableSlots.filter((slot) => new Date(slot).getTime() >= earliest);
  }, [availableSlots, availabilityNowMs]);

  useEffect(() => {
    const timer = window.setInterval(() => setAvailabilityNowMs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
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

  const refreshAvailability = useCallback(async () => {
    if (!selectedBarber || !selectedService || !activeSelectedDate) return;
    setLoadingSlots(true);
    setSlotsError("");
    try {
      const res = await api.bookings.getAvailability(
        selectedBarber.clerkId,
        selectedService.id,
        activeSelectedDate
      );
      if (res.success) {
        const earliest = getEarliestBookableTime().getTime();
        const validSlots = res.data.filter((slot) => new Date(slot).getTime() >= earliest);
        setAvailableSlots(validSlots);
        setSelectedSlot((current) => (current && validSlots.includes(current) ? current : null));
      }
    } catch (error: unknown) {
      setAvailableSlots([]);
      setSlotsError(error instanceof Error ? error.message : "Unable to load appointment times.");
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedBarber, selectedService, activeSelectedDate]);

  // Fetch slots when scheduling criteria changes.
  useEffect(() => {
    void refreshAvailability(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [refreshAvailability]);

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
    setSlotNotice("");
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
    if (new Date(slot).getTime() < getEarliestBookableTime().getTime()) {
      void refreshAvailability();
      return;
    }
    setSlotNotice("");
    setSelectedSlot(slot);
    setStep(4); // OTP Verification
  };

  const handleSlotUnavailable = useCallback(async () => {
    setSelectedSlot(null);
    setSlotNotice("This time is no longer available. Please choose another slot.");
    setStep(3);
    await refreshAvailability();
  }, [refreshAvailability]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !isPhoneValid) return;
    setIsSendingOtp(true);
    setOtpSendError("");
    setSandboxOtp(null);
    try {
      const res = await api.auth.sendOtp(phone);
      if (res.success) {
        setIsOtpSent(true);
        // Development sandbox: display the OTP in the UI if returned
        if (res.sandboxOtp) {
          setSandboxOtp(res.sandboxOtp);
        }
      } else {
        setOtpSendError("Failed to send code. Please try again.");
      }
    } catch (err: unknown) {
      setOtpSendError(err instanceof Error ? err.message : "Failed to send code. Please check your number and try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !otpCode) return;
    setIsVerifying(true);
    setOtpVerifyError("");
    try {
      const res = await api.auth.verifyOtp(phone, otpCode);
      if (res.success) {
        setSandboxOtp(null);
        if (res.data.isNew) {
          setIsNewCustomer(true);
        } else {
          setCustomer(res.data.customer);
          setStep(5); // Proceed to Stripe Checkout
        }
      } else {
        setOtpVerifyError("Invalid code. Please try again.");
      }
    } catch (err: unknown) {
      setOtpVerifyError(err instanceof Error ? err.message : "Invalid verification code. Please check and try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !name || !email) return;
    setIsVerifying(true);
    setOtpVerifyError("");
    try {
      const res = await api.auth.register({ phone, email, name });
      if (res.success) {
        setCustomer(res.data.customer);
        setIsNewCustomer(false);
        setStep(5);
      } else {
        setOtpVerifyError("Registration failed. Please try again.");
      }
    } catch (err: unknown) {
      setOtpVerifyError(err instanceof Error ? err.message : "Registration failed. Please check your details and try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const resetFlow = () => {
    setSelectedService(null);
    setSelectedSlot(null);
    setSlotNotice("");
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
            {totalReviews > 0 ? (
              <>
                <div className="flex items-center gap-0.5 text-warning">
                  <Star className="w-4 h-4 fill-warning" />
                  <span className="font-extrabold text-sm text-ink ml-1">{avgRating.toFixed(1)}</span>
                </div>
                <div className="h-4 w-px bg-ink/10" />
                <button
                  onClick={() => setShowReviewsModal(true)}
                  className="text-[11px] font-bold text-mute-text hover:text-ink hover:underline cursor-pointer"
                >
                  {totalReviews} {totalReviews === 1 ? "Review" : "Reviews"}
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowReviewsModal(true)}
                className="text-[11px] font-bold text-mute-text hover:text-ink cursor-pointer flex items-center gap-1"
              >
                <Star className="w-3.5 h-3.5" />
                No reviews yet
              </button>
            )}
            <div className="h-4 w-px bg-ink/10" />
            <button
              onClick={() => setShowReviewsModal(true)}
              className="text-[11px] font-extrabold text-primary-deep bg-primary-pale hover:bg-primary px-2 py-0.5 rounded-md transition-colors cursor-pointer"
            >
              {totalReviews > 0 ? "All Reviews" : "Leave a Review"}
            </button>
          </div>
        </div>

        {/* Dynamic clean photo gallery */}
        {renderGallery()}

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
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-mute-text">Location & Map</h4>
                {address && (
                  <a 
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-bold text-ink hover:underline flex items-center gap-1 inline-flex"
                  >
                    Open Google Maps
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <LocationMap address={address} mapUrl={shop?.googleMapsUrl || shop?.mapUrl} />
              {address && (
                <div className="flex items-start gap-2 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-mute-text mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-body-text font-semibold leading-snug">{address}</p>
                </div>
              )}
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
                        {dates.map((dateVal) => {
                          const isSelected = dateVal === activeSelectedDate;
                          const displayDate = new Date(`${dateVal}T12:00:00.000Z`);
                          const dayName = displayDate.toLocaleDateString([], { weekday: "short", timeZone: "UTC" });
                          const dayNum = displayDate.getUTCDate();

                          return (
                            <button
                              key={dateVal}
                              onClick={() => {
                                setSelectedDate(dateVal);
                                setSlotNotice("");
                              }}
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
                        {slotNotice && (
                          <div className="mb-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-xs font-bold">
                            {slotNotice}
                          </div>
                        )}
                        {loadingSlots ? (
                          <div className="flex items-center justify-center min-h-[150px]">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : slotsError ? (
                          <div className="card-feature-sage p-8 text-center text-xs font-bold text-body-text border border-ink/5">
                            {slotsError}
                          </div>
                        ) : visibleAvailableSlots.length === 0 ? (
                          <div className="card-feature-sage p-8 text-center text-xs font-bold text-body-text border border-ink/5">
                            {activeSelectedDate === dates[0]
                              ? "No more appointments available today. Please choose another date."
                              : "No appointment times available on this date."}
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2.5">
                            {visibleAvailableSlots.map((slot) => {
                              const time = new Date(slot).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: shopTimeZone,
                              });
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
                            <p className="text-xs text-mute-text">Secure appointment booking with SMS OTP.</p>
                          </div>
                          <button
                            onClick={() => {
                              if (isNewCustomer) {
                                setIsNewCustomer(false);
                              } else {
                                setStep(3);
                              }
                            }}
                            className="text-xs font-bold text-mute-text hover:text-ink cursor-pointer"
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
                            <button type="submit" className="button-primary w-full py-4 cursor-pointer" disabled={isVerifying}>
                              {isVerifying ? "Registering..." : "Complete & Continue"}
                            </button>
                          </form>
                        ) : !isOtpSent ? (
                          <form onSubmit={handleSendOtp} className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-2">
                                Mobile Number
                              </label>
                              <PhoneInput
                                id="customer-phone"
                                value={phone}
                                onChange={setPhone}
                                onValidChange={setIsPhoneValid}
                                required
                              />
                            </div>
                            {otpSendError && (
                              <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                                <span className="flex-shrink-0">⚠️</span>
                                <span>{otpSendError}</span>
                              </div>
                            )}
                            <button
                              type="submit"
                              disabled={isSendingOtp || !isPhoneValid}
                              className="button-primary w-full py-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {isSendingOtp ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                  Sending...
                                </>
                              ) : "Send Verification Code"}
                            </button>
                          </form>
                        ) : (
                          <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="bg-primary-pale p-3 rounded-xl border border-primary/20 text-xs font-bold text-ink-deep text-center">
                              Code sent to <span className="font-black">{phone}</span>
                            </div>

                            {/* Sandbox development OTP display */}
                            {sandboxOtp && (
                              <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-center space-y-1">
                                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">🛠 Development Sandbox</p>
                                <p className="text-2xl font-black text-amber-900 tracking-widest">{sandboxOtp}</p>
                                <p className="text-[10px] text-amber-600 font-semibold">This code won&apos;t appear in production</p>
                              </div>
                            )}

                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-mute-text mb-2">
                                Enter 6-Digit Code
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                placeholder="123456"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                                className="text-input text-center font-extrabold text-2xl tracking-widest"
                                autoFocus
                                required
                              />
                            </div>

                            {otpVerifyError && (
                              <div className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                                <span className="flex-shrink-0">⚠️</span>
                                <span>{otpVerifyError}</span>
                              </div>
                            )}

                            <button
                              type="submit"
                              className="button-primary w-full py-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              disabled={isVerifying || otpCode.length !== 6}
                            >
                              {isVerifying ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                  Verifying...
                                </>
                              ) : "Verify & Continue"}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setIsOtpSent(false); setOtpCode(""); setOtpSendError(""); setOtpVerifyError(""); setSandboxOtp(null); }}
                              className="w-full text-center text-xs font-bold text-mute-text hover:text-ink mt-2 cursor-pointer"
                            >
                              ← Change phone number
                            </button>
                          </form>
                        )}

                      </div>

                      <div className="text-[10px] text-mute-text">
                        * SMS verification is required to confirm bookings and prevent automated spam scheduling.
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
                            <h3 className="text-lg font-black text-ink">Checkout</h3>
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
                          timeZone={shopTimeZone}
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
                              onSlotUnavailable={handleSlotUnavailable}
                              stripeEnabled={stripeEnabled}
                            />
                          </Elements>
                        )}
                      </div>

                      <div className="text-[10px] text-mute-text flex items-center justify-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-positive-deep" />
                        <span>
                          {stripeEnabled
                            ? "Card payments are handled securely by Stripe."
                            : "Online payment is unavailable. Pay on Arrival is enabled."}
                        </span>
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
                            {selectedSlot && new Date(selectedSlot).toLocaleDateString([], { timeZone: shopTimeZone })} at{" "}
                            {selectedSlot && new Date(selectedSlot).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: shopTimeZone })}
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

      {/* Reviews Modal */}
      <AnimatePresence>
        {showReviewsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Blur Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReviewsModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-canvas border border-ink shadow-2xl rounded-wise w-full max-w-lg h-[80vh] max-h-[600px] overflow-hidden flex flex-col relative z-10 animate-fade-in"
            >
              {/* Header */}
              <div className="p-6 border-b border-ink/5 flex justify-between items-center bg-canvas">
                <div>
                  <h3 className="text-lg font-black text-ink">Client Reviews</h3>
                  <p className="text-xs text-mute-text">Real feedback left by verified clients</p>
                </div>
                <button
                  onClick={() => setShowReviewsModal(false)}
                  className="w-8 h-8 rounded-full border border-ink/10 flex items-center justify-center text-mute-text hover:text-ink transition-colors text-sm hover:bg-canvas-soft cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Body (Scrollable) */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {/* Submit New Review Form */}
                <form onSubmit={handleReviewSubmit} className="bg-canvas-soft/30 border border-ink/5 p-4 rounded-xl space-y-4">
                  <span className="block text-xs font-black uppercase tracking-wider text-ink-deep">Leave a Review</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text mb-1">Your Name</label>
                      <input
                        type="text"
                        value={newReviewName}
                        onChange={(e) => setNewReviewName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full text-input py-2 px-3 text-xs font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text mb-1">Rating</label>
                      <select
                        value={newReviewRating}
                        onChange={(e) => setNewReviewRating(Number(e.target.value))}
                        className="w-full bg-canvas border border-ink/10 rounded-xl py-2 px-3 text-xs font-bold text-ink focus:outline-none focus:border-ink shadow-sm cursor-pointer"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                        <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                        <option value={3}>⭐⭐⭐ (3/5)</option>
                        <option value={2}>⭐⭐ (2/5)</option>
                        <option value={1}>⭐ (1/5)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-body-text mb-1">Notes & Comments</label>
                    <textarea
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Share details about your service, haircut, or styling..."
                      className="w-full bg-canvas border border-ink/10 rounded-xl py-2 px-3 text-xs font-bold text-ink placeholder:text-mute-text/40 focus:outline-none focus:border-ink transition-colors shadow-sm h-16 resize-none"
                      required
                    />
                  </div>
                  <button type="submit" className="button-primary w-full py-2.5 !text-xs cursor-pointer">
                    Submit Review
                  </button>
                </form>

                {/* Reviews List */}
                <div className="space-y-4">
                  {realReviews.length === 0 ? (
                    <div className="text-center py-8 text-xs text-mute-text border border-dashed border-ink/10 rounded-xl">
                      No reviews posted yet. Be the first to review!
                    </div>
                  ) : (
                    realReviews.map((r) => (
                      <div key={r.id} className="border-b border-ink/5 pb-4 last:border-0">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold text-sm text-ink">{r.customerName}</span>
                          <span className="text-[10px] text-mute-text font-bold">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center text-warning my-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < r.rating ? "fill-warning text-warning" : "text-canvas-soft/40"}`}
                            />
                          ))}
                          <span className="text-xs text-ink font-black ml-1.5">{r.rating}.0</span>
                        </div>
                        {r.comment && (
                          <p className="text-xs text-body-text font-semibold leading-relaxed bg-canvas-soft/20 p-2.5 rounded-lg border border-ink/5 mt-1">
                            {r.comment}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
