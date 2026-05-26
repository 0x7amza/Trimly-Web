"use client";

import React, { useState, useEffect } from "react";
import { useUser, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  MapPin, 
  Sparkles, 
  Scissors, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Star, 
  Users, 
  Clock,
  ArrowRight,
  TrendingUp,
  Map,
  Phone,
  MessageSquare,
  AlertTriangle
} from "lucide-react";
import { api } from "@/lib/api";
import { CustomCombobox } from "@/components/ui/custom-combobox";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";

interface SuggestionItem {
  id: string;
  name: string;
  type: "shop" | "service";
  category: string;
  slug?: string;
  shopName?: string;
}




export default function MarketingPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  // Search & Discovery State
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [activeCities, setActiveCities] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    fetch("/api/v1/search")
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.cities) {
          setActiveCities(res.data.cities);
        }
      })
      .catch(console.error);
  }, []);

  // Real shop state for hero card mockup
  const [heroShop, setHeroShop] = useState<{
    name: string;
    slug: string;
    address: string;
    barbersCount: number;
    popularService: { name: string; duration: number; price: number } | null;
    slots: string[];
    status: "loading" | "real" | "no-shops";
  }>({
    name: "Loading Preview...",
    slug: "",
    address: "",
    barbersCount: 0,
    popularService: null,
    slots: [],
    status: "loading",
  });

  // Pricing Period Toggle
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  
  // Simulated Toast for Contact Sales
  const [showSalesToast, setShowSalesToast] = useState(false);

  // Search suggestions filtering — debounced call to /api/v1/search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await api.search({ searchQuery: searchQuery.trim(), limit: 8 });
        if (res.success) {
          const items = res.data.results.map((r) => ({
            id: r.id,
            name: r.name,
            type: "shop" as const,
            category: "Barbershop",
            slug: r.slug,
          }));
          setSuggestions(items);
        }
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Fetch first real shop from database on mount for hero card
  useEffect(() => {
    async function loadHeroShop() {
      try {
        const searchRes = await api.search({ limit: 1 });
        if (searchRes.success && searchRes.data.results.length > 0) {
          const firstShop = searchRes.data.results[0];
          const shopRes = await api.shops.getBySlug(firstShop.slug);
          if (shopRes.success) {
            const { shop, barbers } = shopRes.data;
            let popularService = null;
            if (barbers.length > 0) {
              const servicesRes = await api.services.getBarberServices(barbers[0].clerkId);
              if (servicesRes.success && servicesRes.data.length > 0) {
                const service = servicesRes.data[0];
                popularService = {
                  name: service.name,
                  duration: service.durationMinutes,
                  price: service.price / 100,
                };
              }
            }
            if (!popularService) {
              popularService = {
                name: "Standard Cut",
                duration: 30,
                price: 25.0,
              };
            }
            setHeroShop({
              name: shop.name,
              slug: shop.slug,
              address: shop.address || shop.city || "Local shop",
              barbersCount: barbers.length || 1,
              popularService,
              slots: ["10:00 AM", "11:30 AM", "2:00 PM"],
              status: "real",
            });
            return;
          }
        }
        // Fallback/No shops registered yet
        setHeroShop({
          name: "Register Your Shop",
          slug: "for-professionals",
          address: "Create your booking profile in 60 seconds",
          barbersCount: 0,
          popularService: {
            name: "Get Started Now",
            duration: 1,
            price: 0,
          },
          slots: ["Add Slots", "Set Hours", "Go Live"],
          status: "no-shops",
        });
      } catch (err) {
        console.error("Failed to load real hero shop:", err);
        setHeroShop({
          name: "Register Your Shop",
          slug: "for-professionals",
          address: "Create your booking profile in 60 seconds",
          barbersCount: 0,
          popularService: {
            name: "Get Started Now",
            duration: 1,
            price: 0,
          },
          slots: ["Add Slots", "Set Hours", "Go Live"],
          status: "no-shops",
        });
      }
    }
    loadHeroShop();
  }, []);


  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");

    const cityParam = locationQuery.trim() ? `?city=${encodeURIComponent(locationQuery.trim())}` : "";
    router.push(`/barber${cityParam}`);
  };

  const handleSelectSuggestion = (item: SuggestionItem) => {
    setShowSuggestions(false);
    if (item.type === "shop" && item.slug) {
      router.push(`/${item.slug}`);
    } else {
      setSearchQuery(item.name);
      const cityParam = locationQuery.trim() ? `?city=${encodeURIComponent(locationQuery.trim())}` : "";
      router.push(`/barber${cityParam}`);
    }
  };




  return (
    <div className="flex flex-col min-h-screen relative bg-white bg-[#FFFFFF] text-ink">
      
      {/* 1. Immersive Split Hero Section */}
      <section className="relative py-16 md:py-28 px-6 bg-transparent overflow-hidden border-b border-ink/5">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Marketplace Title and CTA */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-pale text-positive-deep rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-primary/20">
              <Sparkles className="w-3.5 h-3.5 text-positive-deep animate-pulse" />
              Smarter Bookings • Verified Professionals
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-ink leading-[1.1] tracking-tight mb-6">
              Book your local <br />
              barber appointments. <br />
              <span className="text-primary-deep bg-primary px-3 py-1.5 rounded-2xl inline-block mt-2">Immediate. 24/7.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-body-text font-normal max-w-xl mb-8 leading-relaxed">
              Find and book local barbershops in seconds. Get a sharp skin fade, classic trim, or hot towel shave. Check live open slots and get absolute scheduling certainty.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/barber" className="button-primary text-sm font-bold px-6 py-3.5">
                Book a Barber
              </Link>
              <Link href="#pricing" className="button-tertiary text-sm font-bold px-6 py-3.5">
                Trimly B2B SaaS Plans
              </Link>
            </div>
          </div>

          {/* Right Column: Immersive Dashboard Mockup */}
          <div className="lg:col-span-5 w-full flex justify-center">
            {heroShop.status === "loading" ? (
              <div className="w-full max-w-md card-content bg-canvas border border-ink/10 shadow-2xl relative rounded-wise overflow-hidden h-[360px] flex items-center justify-center">
                <div className="text-sm font-bold text-mute-text animate-pulse">Loading Live Booking Preview...</div>
              </div>
            ) : (
              <Link href={heroShop.status === "real" ? `/${heroShop.slug}` : `/for-professionals`} className="w-full max-w-md block group">
                <div className="w-full card-content bg-canvas border border-ink/10 group-hover:border-primary/50 shadow-2xl relative rounded-wise overflow-hidden transition-all duration-300">
                  {/* Mock Browser Header */}
                  <div className="pb-4 border-b border-ink/5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-negative" />
                      <div className="w-2.5 h-2.5 rounded-full bg-warning" />
                      <div className="w-2.5 h-2.5 rounded-full bg-positive" />
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-mute-text bg-canvas-soft px-3 py-0.5 rounded-md transition-colors group-hover:bg-primary-pale group-hover:text-primary-deep">
                      {heroShop.status === "real" ? `trimly.app/${heroShop.slug}` : "trimly.app/your-salon"}
                    </span>
                    <div className="w-4 h-4" />
                  </div>

                  {/* Mock Shop Card Info */}
                  <div className="pt-5 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-black text-ink flex items-center gap-1.5">
                          <Scissors className="w-4 h-4 text-mute-text" /> 
                          {heroShop.name}
                        </h4>
                        <p className="text-xs text-mute-text">{heroShop.address}</p>
                      </div>
                      {heroShop.status === "real" ? (
                        <span className="badge-positive text-[10px] md:text-xs">Open Now</span>
                      ) : (
                        <span className="bg-primary/20 text-primary-deep border border-primary/30 rounded-full px-2.5 py-0.5 text-[10px] md:text-xs font-bold animate-pulse">Claim Shop</span>
                      )}
                    </div>

                    {/* Rating & Barbers */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1 text-ink font-bold">
                        <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                        4.9 <span className="text-mute-text font-normal">(184 reviews)</span>
                      </div>
                      <div className="flex items-center gap-1 text-mute-text">
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {heroShop.status === "real" 
                            ? `${heroShop.barbersCount} ${heroShop.barbersCount === 1 ? 'Specialist' : 'Specialists'}` 
                            : "Unlimited Staff"
                          }
                        </span>
                      </div>
                    </div>

                    {/* Services Selection Mockup */}
                    {heroShop.popularService && (
                      <div className="space-y-2">
                        <span className="block text-[10px] font-bold text-mute-text uppercase tracking-wider">
                          {heroShop.status === "real" ? "Popular Services" : "Onboarding Steps"}
                        </span>
                        <div className="bg-canvas-soft/30 p-3 rounded-xl border border-ink/5 flex items-center justify-between group-hover:bg-primary-pale transition-all">
                          <div>
                            <span className="text-xs font-bold block text-ink">{heroShop.popularService.name}</span>
                            <span className="text-[10px] text-mute-text flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" /> {heroShop.popularService.duration} min
                            </span>
                          </div>
                          <span className="text-xs font-black text-ink">
                            {heroShop.status === "real" ? `£${heroShop.popularService.price.toFixed(2)}` : "Free"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Booking Timeline Mockup */}
                    <div className="space-y-2">
                      <span className="block text-[10px] font-bold text-mute-text uppercase tracking-wider">
                        {heroShop.status === "real" ? "Live Open Slots" : "Timeline Setup"}
                      </span>
                      <div className="flex gap-2">
                        {heroShop.slots.map((slot, index) => (
                          <span 
                            key={slot} 
                            className={`flex-1 text-center text-[11px] font-bold py-2 rounded-lg border shadow-sm transition-all ${
                              index === 0 
                                ? "bg-primary text-ink border-ink/10 group-hover:bg-primary-deep" 
                                : "bg-canvas-soft/50 text-ink border-transparent"
                            }`}
                          >
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 2. Centered Floating Discovery Bar */}
      <div id="discovery" className="relative z-30 max-w-[1200px] mx-auto px-6 -mt-8 md:-mt-10 mb-16 w-full">
        <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto">
          <div className="bg-canvas border border-ink shadow-2xl rounded-2xl md:rounded-full p-2.5 flex flex-col md:flex-row items-stretch gap-2 md:gap-0 relative">
            
            {/* Input A: Search Services/Shops */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2 border-b md:border-b-0 md:border-r border-ink/10 relative">
              <Search className="w-5 h-5 text-mute-text flex-shrink-0" />
              <input
                type="text"
                placeholder="What service or salon are you looking for?"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full bg-transparent border-0 outline-none text-ink py-1 text-sm font-semibold placeholder:text-mute-text focus:ring-0"
              />
              
              {/* Autocompletion suggestions box */}
              {showSuggestions && searchQuery.trim() && (
                <div className="absolute top-[105%] left-0 right-0 mt-2 bg-canvas border border-ink shadow-2xl rounded-wise overflow-hidden z-50 p-2">
                  <div className="p-2 text-[10px] font-bold text-mute-text uppercase tracking-wider border-b border-ink/5 mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Search Recommendations
                  </div>
                  {suggestions.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto">
                      {suggestions.map((item) => (
                        <button
                          key={`${item.type}-${item.id}`}
                          type="button"
                          onClick={() => handleSelectSuggestion(item)}
                          className="w-full text-left px-4 py-3 rounded-xl hover:bg-primary-pale text-ink transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <span className="font-bold text-sm block group-hover:text-ink-deep">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-mute-text">
                              {item.type === "shop" 
                                ? `${item.category} • Full-service Salon` 
                                : `${item.category} Service • Offered at ${item.shopName}`
                              }
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-mute-text bg-canvas-soft group-hover:bg-primary group-hover:text-ink transition-all px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {item.type}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-mute-text">
                      No matching shops or services found. Search for <span className="font-bold text-ink">"Doe"</span> or <span className="font-bold text-ink">"Fade"</span>.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input B: Location Field */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2 relative">
              <MapPin className="w-5 h-5 text-mute-text flex-shrink-0" />
              <div className="flex-grow">
                <CustomCombobox
                  value={locationQuery}
                  onChange={(val) => setLocationQuery(val || "")}
                  options={activeCities.map((city) => ({ label: city, value: city }))}
                  placeholder="Select city..."
                  searchPlaceholder="Search cities..."
                  borderless={true}
                  className="w-full"
                />
              </div>
            </div>

            {/* Search Submit Action Button */}
            <button
              type="submit"
              className="button-primary !py-3 md:!py-3.5 !px-8 text-sm font-bold whitespace-nowrap rounded-xl md:rounded-full flex items-center gap-2 justify-center cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>

        {/* Suggestion Dropdown overlay background close click helper */}
        {showSuggestions && searchQuery.trim() && (
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setShowSuggestions(false)} 
          />
        )}

        {/* Dynamic Search Error Message */}
        {searchError && (
          <div className="max-w-md mx-auto mt-4 text-center text-xs font-bold text-negative bg-negative-bg/5 p-3 rounded-xl border border-negative/10">
            ⚠️ {searchError}
          </div>
        )}
      </div>



      {/* 4. Structural SEO Directory Searches */}
      <section className="py-16 px-6 bg-canvas-soft border-b border-ink/5">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-10 text-center md:text-left">
            <h3 className="text-xs font-bold uppercase tracking-widest text-mute-text flex items-center justify-center md:justify-start gap-1.5">
              <Map className="w-4 h-4 text-mute-text" /> Localized Marketplace Search
            </h3>
            <h2 className="text-2xl font-black text-ink mt-2">Popular Searches Near You</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            <div className="space-y-3">
              <h4 className="font-bold text-ink border-b border-ink/5 pb-2">London Barbers</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/barber?city=London" className="text-body-text hover:text-ink hover:underline transition-all">Top Barbers in London</Link></li>
                <li><Link href="/barber?city=London" className="text-body-text hover:text-ink hover:underline transition-all">Skin Fades in London</Link></li>
                <li><Link href="/barber?city=London" className="text-body-text hover:text-ink hover:underline transition-all">Beard Grooming London</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-ink border-b border-ink/5 pb-2">Manchester Barbers</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/barber?city=Manchester" className="text-body-text hover:text-ink hover:underline transition-all">Top Barbers in Manchester</Link></li>
                <li><Link href="/barber?city=Manchester" className="text-body-text hover:text-ink hover:underline transition-all">Skin Fades in Manchester</Link></li>
                <li><Link href="/barber?city=Manchester" className="text-body-text hover:text-ink hover:underline transition-all">Beard Grooming Manchester</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-ink border-b border-ink/5 pb-2">Bristol Barbers</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/barber?city=Bristol" className="text-body-text hover:text-ink hover:underline transition-all">Top Barbers in Bristol</Link></li>
                <li><Link href="/barber?city=Bristol" className="text-body-text hover:text-ink hover:underline transition-all">Skin Fades in Bristol</Link></li>
                <li><Link href="/barber?city=Bristol" className="text-body-text hover:text-ink hover:underline transition-all">Beard Grooming Bristol</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-ink border-b border-ink/5 pb-2">Birmingham Barbers</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/barber?city=Birmingham" className="text-body-text hover:text-ink hover:underline transition-all">Top Barbers in Birmingham</Link></li>
                <li><Link href="/barber?city=Birmingham" className="text-body-text hover:text-ink hover:underline transition-all">Skin Fades in Birmingham</Link></li>
                <li><Link href="/barber?city=Birmingham" className="text-body-text hover:text-ink hover:underline transition-all">Beard Grooming Birmingham</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Product Features Section */}
      <section id="features" className="py-20 px-6 bg-canvas border-b border-ink/5">
        <div className="max-w-[1200px] mx-auto">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-ink mb-4">
              Built for speed, not administrative overhead.
            </h2>
            <p className="text-base text-body-text">
              Salons and clients don&apos;t have time to battle complex scheduling links. That&apos;s why we optimized every action to be lightning-fast.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card-feature-sage flex flex-col justify-between h-[340px]">
              <div>
                <div className="w-11 h-11 bg-canvas rounded-full flex items-center justify-center mb-6 border border-ink/5 shadow-sm">
                  <svg className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-ink mb-2">2-Tap Walk-In Calendar</h3>
                <p className="text-xs text-body-text leading-relaxed">
                  Tap an empty slot, select the service, and hit save. Walk-in appointments added in under 3 seconds directly on your timeline.
                </p>
              </div>
              <div className="text-[10px] font-bold text-mute-text uppercase tracking-wider">
                Optimized B2B Workflow
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card-feature-green flex flex-col justify-between h-[340px]">
              <div>
                <div className="w-11 h-11 bg-canvas rounded-full flex items-center justify-center mb-6 border border-ink/5 shadow-sm">
                  <svg className="w-5 h-5 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-ink mb-2">WhatsApp Confirmation</h3>
                <p className="text-xs text-body-text leading-relaxed">
                  Automatically ping clients via WhatsApp when they book online. Includes automatic cancellation links to protect salon slots.
                </p>
              </div>
              <div className="text-[10px] font-bold text-positive-deep uppercase tracking-wider">
                Automated Notifications
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card-feature-dark flex flex-col justify-between h-[340px]">
              <div>
                <div className="w-11 h-11 bg-canvas rounded-full flex items-center justify-center mb-6 border border-ink/5 shadow-sm">
                  <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-primary mb-2">Custom Booking Link</h3>
                <p className="text-xs text-primary-pale/85 leading-relaxed">
                  A beautiful, lightning-fast mobile booking link you can put on Instagram or TikTok. Clean transitions, deposit taking, and zero clutter.
                </p>
              </div>
              <div className="text-[10px] font-bold text-primary-neutral uppercase tracking-wider">
                B2C Mobile Portal
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. B2B Pricing Section */}
      <section id="pricing" className="py-20 md:py-28 px-6 bg-canvas-soft">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-5xl font-black text-ink mb-4">
              Simple, transparent pricing.
            </h2>
            <p className="text-base text-body-text">
              Start your 14-day free trial. No credit card required. Scale as your business grows.
            </p>

            {/* Period Toggle */}
            <div className="inline-flex bg-canvas p-1.5 rounded-full border border-ink/10 mt-8">
              <button
                type="button"
                onClick={() => setBillingPeriod("monthly")}
                className={`px-5 py-2 rounded-full font-bold text-xs md:text-sm transition-all cursor-pointer ${
                  billingPeriod === "monthly" 
                    ? "bg-ink text-white shadow-md" 
                    : "text-body-text hover:text-ink"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod("yearly")}
                className={`px-5 py-2 rounded-full font-bold text-xs md:text-sm transition-all cursor-pointer ${
                  billingPeriod === "yearly" 
                    ? "bg-ink text-white shadow-md" 
                    : "text-body-text hover:text-ink"
                }`}
              >
                Yearly (Save 20%)
              </button>
            </div>
          </div>

          {/* SaaS Pricing Cards — 2 column */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch text-left">
            
            {/* Growth Tier Card (Popular) */}
            <Card className="border-ink ring-2 ring-primary relative flex flex-col justify-between">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-primary text-ink-deep text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-ink">
                Most Popular
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-positive-deep bg-primary-pale px-2 py-1 rounded">Growth</span>
                </div>
                <CardTitle className="mt-2">Growth Plan</CardTitle>
                <CardDescription>Streamline customer bookings & automate reminders for your team.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-4xl font-black text-ink">
                    £{billingPeriod === "monthly" ? "29" : "23"}
                  </span>
                  <span className="text-xs font-bold text-mute-text">/ month</span>
                </div>
                {billingPeriod === "yearly" && (
                  <span className="text-[10px] font-bold text-positive bg-primary-pale px-2 py-0.5 rounded">Billed annually at £276 — save £72/yr</span>
                )}
                <ul className="space-y-3.5 text-xs text-body-text mt-4">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                    <span>Includes first <strong>5 Barbers/Stylists</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                    <span>Custom B2C booking URL slug</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                    <span>Automated WhatsApp notifications</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                    <span>Online & manual booking calendar</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                    <span>Priority email & chat support</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                    <span>Basic sales & schedule analytics</span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                {isSignedIn ? (
                  <Link
                    href={`/dashboard/billing?plan=${billingPeriod === "monthly" ? "MONTHLY" : "YEARLY"}`}
                    className="button-primary w-full text-center py-3 block"
                  >
                    Subscribe to Growth — £{billingPeriod === "monthly" ? "29" : "23"}/mo
                  </Link>
                ) : (
                  <Link href="/for-professionals" className="button-primary w-full text-center block py-3">
                    Start 14-Day Free Trial
                  </Link>
                )}
              </div>
            </Card>

            {/* Pro Tier Card */}
            <Card className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-mute-text bg-canvas-soft px-2 py-1 rounded">Enterprise</span>
                </div>
                <CardTitle className="mt-2">Pro Plan</CardTitle>
                <CardDescription>For multi-location or high-volume salons needing advanced tools.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-4xl font-black text-ink">
                    £{billingPeriod === "monthly" ? "59" : "47"}
                  </span>
                  <span className="text-xs font-bold text-mute-text">/ month</span>
                </div>
                {billingPeriod === "yearly" && (
                  <span className="text-[10px] font-bold text-positive bg-primary-pale px-2 py-0.5 rounded">Billed annually at £564 — save £144/yr</span>
                )}
                <ul className="space-y-3.5 text-xs text-body-text mt-4">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                    <span><strong>Unlimited Professionals</strong> & locations</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                    <span>Custom domain (bookings.yourbrand.com)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                    <span>Custom SMS sender name & API access</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                    <span>White-label client booking portal</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                    <span>Dedicated 24/7 account manager</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                    <span>Advanced report suite & POS sync</span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                {isSignedIn ? (
                  <Link
                    href={`/dashboard/billing?plan=${billingPeriod === "monthly" ? "MONTHLY" : "YEARLY"}`}
                    className="button-tertiary w-full text-center py-3 block"
                  >
                    Subscribe to Pro — £{billingPeriod === "monthly" ? "59" : "47"}/mo
                  </Link>
                ) : (
                  <Link href="/for-professionals" className="button-tertiary w-full text-center block py-3">
                    Start 14-Day Free Trial
                  </Link>
                )}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Dynamic Search Error Message */}
      {searchError && (
        <div className="max-w-md mx-auto mt-4 text-center text-xs font-bold text-negative bg-negative-bg/5 p-3 rounded-xl border border-negative/10 flex items-center justify-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-negative" /> {searchError}
        </div>
      )}

      {/* Toast Notification Simulation */}
      {showSalesToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-white py-4 px-6 rounded-wise shadow-2xl border border-primary/20 max-w-sm transition-all animate-bounce">
          <div className="flex items-start gap-3">
            <div className="p-1 bg-primary text-ink rounded-lg mt-0.5">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-sm">Demo Request Registered</p>
              <p className="text-xs text-canvas-soft/70 mt-1">
                Thank you! Enterprise Pro features are currently mock-enabled for development tests.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
