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
import { mockDb } from "@/lib/api";
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
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchError, setSearchError] = useState("");

  // Pricing Period Toggle
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  
  // Simulated Toast for Contact Sales
  const [showSalesToast, setShowSalesToast] = useState(false);

  // Search suggestions filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const allShops = mockDb.getShops();
    const allServices = mockDb.getServices();

    const getCategoryName = (slug: string) => {
      if (slug.includes("hairdresser")) return "Hairdresser";
      if (slug.includes("barber")) return "Barber";
      if (slug.includes("nails")) return "Manicure";
      if (slug.includes("beauty")) return "Beauty Salon";
      return "Salon";
    };

    const matchingShops: SuggestionItem[] = allShops
      .filter(shop => shop.name.toLowerCase().includes(query))
      .map(shop => ({
        id: shop.id,
        name: shop.name,
        type: "shop" as const,
        category: getCategoryName(shop.slug),
        slug: shop.slug
      }));

    const matchingServices: SuggestionItem[] = allServices
      .filter(service => service.name.toLowerCase().includes(query) && service.isActive)
      .map(service => {
        const barber = mockDb.getBarbers().find(b => b.clerkId === service.barberId);
        const shop = allShops.find(s => s.id === barber?.shopId);
        return {
          id: service.id,
          name: service.name,
          type: "service" as const,
          category: getCategoryName(shop?.slug || ""),
          shopName: shop?.name || "Premium Salon"
        };
      });

    const combined = [...matchingShops, ...matchingServices];
    setSuggestions(combined.slice(0, 8));
  }, [searchQuery]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");

    // Submit redirects to /discover with parameters
    const url = `/discover?query=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(locationQuery)}`;
    router.push(url);
  };

  const handleSelectSuggestion = (item: SuggestionItem) => {
    setShowSuggestions(false);
    if (item.type === "shop" && item.slug) {
      router.push(`/${item.slug}`);
    } else {
      setSearchQuery(item.name);
      router.push(`/discover?query=${encodeURIComponent(item.name)}&location=${encodeURIComponent(locationQuery)}`);
    }
  };

  // Carousel slider configuration
  const categories = [
    {
      coverImage: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80",
      icon: Scissors,
      title: "Hairdresser",
      description: "Transform your hair with professional cuts, colors, and styling.",
      gradient: "from-pink-500/20 via-pink-500/10 to-transparent border-pink-500/10",
      textColor: "text-pink-500",
      badgeColor: "bg-pink-500/10 text-pink-700 border-pink-500/20",
      slug: "hairdresser"
    },
    {
      coverImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80",
      icon: Sparkles,
      title: "Barber",
      description: "Get a sharp skin fade, classic cut, or beard trim from top barbers.",
      gradient: "from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/10",
      textColor: "text-amber-500",
      badgeColor: "bg-amber-500/10 text-amber-700 border-amber-500/20",
      slug: "barber"
    },
    {
      coverImage: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80",
      icon: Star,
      title: "Manicure",
      description: "Pamper your nails with professional extensions, gels, and nail art.",
      gradient: "from-purple-500/20 via-purple-500/10 to-transparent border-purple-500/10",
      textColor: "text-purple-500",
      badgeColor: "bg-purple-500/10 text-purple-700 border-purple-500/20",
      slug: "manicure"
    },
    {
      coverImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
      icon: Sparkles,
      title: "Beauty Salon",
      description: "Rejuvenate with custom facials, lashes, and specialized skin therapies.",
      gradient: "from-teal-500/20 via-teal-500/10 to-transparent border-teal-500/10",
      textColor: "text-teal-500",
      badgeColor: "bg-teal-500/10 text-teal-700 border-teal-500/20",
      slug: "beauty-salon"
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  // Touch swipe support
  const touchStartX = React.useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) { delta > 0 ? nextSlide() : prevSlide(); }
    touchStartX.current = null;
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = categories.length - itemsPerView;
      if (maxIndex <= 0) return 0;
      if (prev >= maxIndex) {
        return 0; // wrap to start
      }
      return prev + 1;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = categories.length - itemsPerView;
      if (maxIndex <= 0) return 0;
      if (prev <= 0) {
        return maxIndex; // wrap to end
      }
      return prev - 1;
    });
  };

  // Adjust sliding bounds on view size change
  useEffect(() => {
    const maxIndex = categories.length - itemsPerView;
    if (currentIndex > maxIndex) {
      setCurrentIndex(Math.max(0, maxIndex));
    }
  }, [itemsPerView, currentIndex]);

  // Autoplay removed — manual arrow + touch navigation only


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
              Book your local beauty <br />
              & hair appointments. <br />
              <span className="text-primary-deep bg-primary px-3 py-1.5 rounded-2xl inline-block mt-2">Immediate. 24/7.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-body-text font-normal max-w-xl mb-8 leading-relaxed">
              Find and book local hairdressers, barbershops, manicure tables, beauty care facilities, and wellness centers in seconds. Check live slots and get absolute scheduling certainty.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/discover" className="button-primary text-sm font-bold px-6 py-3.5">
                Explore Directory
              </Link>
              <Link href="#pricing" className="button-tertiary text-sm font-bold px-6 py-3.5">
                Trimly B2B SaaS Plans
              </Link>
            </div>
          </div>

          {/* Right Column: Immersive Dashboard Mockup */}
          <div className="lg:col-span-5 w-full flex justify-center">
            <div className="w-full max-w-md card-content bg-canvas border border-ink/10 shadow-2xl relative rounded-wise overflow-hidden">
              {/* Mock Browser Header */}
              <div className="pb-4 border-b border-ink/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-negative" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warning" />
                  <div className="w-2.5 h-2.5 rounded-full bg-positive" />
                </div>
                <span className="text-[10px] md:text-xs font-semibold text-mute-text bg-canvas-soft px-3 py-0.5 rounded-md">
                  trimly.app/doe-barbershop
                </span>
                <div className="w-4 h-4" />
              </div>

              {/* Mock Shop Card Info */}
              <div className="pt-5 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-black text-ink flex items-center gap-1.5">
                      <Scissors className="w-4 h-4 text-mute-text" /> 
                      Doe Barbershop
                    </h4>
                    <p className="text-xs text-mute-text">123 Barber St, London</p>
                  </div>
                  <span className="badge-positive text-[10px] md:text-xs">Open Now</span>
                </div>

                {/* Rating & Barbers */}
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1 text-ink font-bold">
                    <Star className="w-3.5 h-3.5 fill-warning text-warning" />
                    4.9 <span className="text-mute-text font-normal">(184 reviews)</span>
                  </div>
                  <div className="flex items-center gap-1 text-mute-text">
                    <Users className="w-3.5 h-3.5" />
                    <span>2 Master Barbers</span>
                  </div>
                </div>

                {/* Services Selection Mockup */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-mute-text uppercase tracking-wider">Popular Services</span>
                  <div className="bg-canvas-soft/30 p-3 rounded-xl border border-ink/5 flex items-center justify-between hover:bg-primary-pale transition-all cursor-pointer">
                    <div>
                      <span className="text-xs font-bold block text-ink">Modern Skinfade</span>
                      <span className="text-[10px] text-mute-text flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> 30 min
                      </span>
                    </div>
                    <span className="text-xs font-black text-ink">£30.00</span>
                  </div>
                </div>

                {/* Booking Timeline Mockup */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-mute-text uppercase tracking-wider">Live Open Slots</span>
                  <div className="flex gap-2">
                    <span className="flex-1 text-center bg-primary text-ink text-[11px] font-bold py-2 rounded-lg border border-ink/10 shadow-sm cursor-pointer">10:00 AM</span>
                    <span className="flex-1 text-center bg-canvas-soft/50 text-[11px] font-bold py-2 rounded-lg text-ink cursor-pointer">11:30 AM</span>
                    <span className="flex-1 text-center bg-canvas-soft/50 text-[11px] font-bold py-2 rounded-lg text-ink cursor-pointer">2:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
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
              <input
                type="text"
                placeholder="Address, city or postcode"
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                className="w-full bg-transparent border-0 outline-none text-ink py-1 text-sm font-semibold placeholder:text-mute-text focus:ring-0"
              />
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

        {/* Quick Category Tab Navigation below discovery bar */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                className="flex items-center gap-2 bg-canvas hover:bg-canvas-soft border border-ink/5 hover:border-ink/20 px-5 py-2.5 rounded-full transition-all text-xs font-bold text-ink shadow-sm"
              >
                <Icon className="w-3.5 h-3.5 text-mute-text" />
                <span>{cat.title}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. Interactive "Discover Our Professionals" Carousel */}
      <section className="py-20 px-6 bg-canvas border-t border-b border-ink/5">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-mute-text bg-canvas-soft border border-ink/5 px-3 py-1 rounded-full">
                Featured Categories
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-ink mt-3 tracking-tight">
                Discover Our Professionals
              </h2>
            </div>
            
            {/* Carousel navigation controls */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={prevSlide}
                className="p-3 bg-canvas border border-ink/10 hover:bg-canvas-soft text-ink rounded-full transition-all cursor-pointer shadow-sm"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                className="p-3 bg-canvas border border-ink/10 hover:bg-canvas-soft text-ink rounded-full transition-all cursor-pointer shadow-sm"
                aria-label="Next slide"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Carousel sliding view track */}
          <div
            className="relative overflow-hidden w-full py-4"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <motion.div 
              className="flex -mx-3"
              animate={{ x: `-${currentIndex * (100 / itemsPerView)}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
              style={{ willChange: "transform" }}
            >
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div 
                    key={cat.slug} 
                    className="w-full flex-shrink-0 px-3" 
                    style={{ width: `${100 / itemsPerView}%` }}
                  >
                    <div className="card-content bg-canvas border border-ink/5 hover:border-ink/20 transition-all rounded-wise overflow-hidden p-0 flex flex-col justify-between h-[360px] relative group shadow-md bg-gradient-to-b from-canvas to-canvas-soft/30">
                      
                      {/* Premium Cover Photo */}
                      <div className="relative h-44 w-full overflow-hidden">
                        <img 
                          src={cat.coverImage} 
                          alt={cat.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        <span className={`absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border bg-canvas/90 backdrop-blur-sm shadow-sm ${cat.badgeColor}`}>
                          Trimly Pro
                        </span>
                      </div>

                      {/* Content Panel */}
                      <div className="p-5 flex-grow flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-canvas-soft/80 rounded-lg border border-ink/5">
                              <Icon className={`w-4 h-4 ${cat.textColor}`} />
                            </div>
                            <h3 className="text-lg font-black text-ink">{cat.title}</h3>
                          </div>
                          <p className="text-xs text-body-text leading-relaxed line-clamp-2">{cat.description}</p>
                        </div>
                        
                        <Link 
                          href={`/${cat.slug}`} 
                          className="inline-flex items-center gap-1 text-xs font-bold text-ink hover:text-primary-deep group-hover:translate-x-1 transition-all mt-4"
                        >
                          Explore Specialists <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

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
              <h4 className="font-bold text-ink border-b border-ink/5 pb-2">Hairdresser Styling</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/discover?category=hairdresser&location=London" className="text-body-text hover:text-ink hover:underline transition-all">Hairdressers in London</Link></li>
                <li><Link href="/discover?category=hairdresser&location=Manchester" className="text-body-text hover:text-ink hover:underline transition-all">Hairdressers in Manchester</Link></li>
                <li><Link href="/discover?category=hairdresser&location=Bristol" className="text-body-text hover:text-ink hover:underline transition-all">Hairdressers in Bristol</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-ink border-b border-ink/5 pb-2">Barber Fades & Shaves</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/discover?category=barber&location=London" className="text-body-text hover:text-ink hover:underline transition-all">Barbers in London</Link></li>
                <li><Link href="/discover?category=barber&location=Manchester" className="text-body-text hover:text-ink hover:underline transition-all">Barbers in Manchester</Link></li>
                <li><Link href="/discover?category=barber&location=Bristol" className="text-body-text hover:text-ink hover:underline transition-all">Barbers in Bristol</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-ink border-b border-ink/5 pb-2">Nail & Manicure Care</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/discover?category=manicure&location=London" className="text-body-text hover:text-ink hover:underline transition-all">Nail Salons in London</Link></li>
                <li><Link href="/discover?category=manicure&location=Manchester" className="text-body-text hover:text-ink hover:underline transition-all">Nail Salons in Manchester</Link></li>
                <li><Link href="/discover?category=manicure&location=Bristol" className="text-body-text hover:text-ink hover:underline transition-all">Nail Salons in Bristol</Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-ink border-b border-ink/5 pb-2">Beauty & Skincare</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/discover?category=beauty-salon&location=London" className="text-body-text hover:text-ink hover:underline transition-all">Beauty Salons in London</Link></li>
                <li><Link href="/discover?category=beauty-salon&location=Manchester" className="text-body-text hover:text-ink hover:underline transition-all">Beauty Salons in Manchester</Link></li>
                <li><Link href="/discover?category=beauty-salon&location=Bristol" className="text-body-text hover:text-ink hover:underline transition-all">Beauty Salons in Bristol</Link></li>
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
              Try Trimly free for 14 days. Scale as your barbershop grows.
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

          {/* SaaS Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch text-left">
            
            {/* Free Tier Card */}
            <Card className="flex flex-col justify-between">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-mute-text bg-canvas-soft px-2 py-1 rounded">Solo Professional</span>
                </div>
                <CardTitle className="mt-2">Free</CardTitle>
                <CardDescription>Perfect for solo specialists starting out.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-4xl font-black text-ink">£0</span>
                  <span className="text-xs font-bold text-mute-text">/ month</span>
                </div>
                <ul className="space-y-3.5 text-xs text-body-text mt-4">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                    <span><strong>1 Professional</strong> profile</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                    <span>2-Tap manual bookings</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                    <span>Standard mobile booking URL</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                    <span>Standard email support</span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                {isSignedIn ? (
                  <Link href="/dashboard/calendar" className="button-tertiary w-full text-center py-3">
                    Open Dashboard
                  </Link>
                ) : (
                  <Link href="/for-professionals" className="button-tertiary w-full text-center block py-3">
                    Get Started Free
                  </Link>
                )}
              </div>
            </Card>

            {/* Growth Tier Card (Popular) */}
            <Card className="border-ink ring-2 ring-primary relative flex flex-col justify-between">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-primary text-ink-deep text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-ink">
                Most Popular
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-positive-deep bg-primary-pale px-2 py-1 rounded">Growth Tier</span>
                </div>
                <CardTitle className="mt-2">Growth</CardTitle>
                <CardDescription>Streamline customer bookings & automate reminders.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-4xl font-black text-ink">
                    £{billingPeriod === "monthly" ? "29" : "23"}
                  </span>
                  <span className="text-xs font-bold text-mute-text">/ month</span>
                </div>
                {billingPeriod === "yearly" && (
                  <span className="text-[10px] font-bold text-positive bg-primary-pale px-2 py-0.5 rounded">Billed annually at £276</span>
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
                  <Link href="/dashboard/calendar" className="button-primary w-full text-center py-3">
                    Open Dashboard
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
                <CardTitle className="mt-2">Pro</CardTitle>
                <CardDescription>For multi-location or high volume salons.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-baseline gap-1 my-4">
                  <span className="text-4xl font-black text-ink">
                    £{billingPeriod === "monthly" ? "59" : "47"}
                  </span>
                  <span className="text-xs font-bold text-mute-text">/ month</span>
                </div>
                {billingPeriod === "yearly" && (
                  <span className="text-[10px] font-bold text-positive bg-primary-pale px-2 py-0.5 rounded">Billed annually at £564</span>
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
                    <span>Dedicated 24/7 account manager</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                    <span>Advanced report suite & POS sync</span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                <button 
                  onClick={() => {
                    setShowSalesToast(true);
                    setTimeout(() => setShowSalesToast(false), 4000);
                  }}
                  className="button-tertiary w-full text-center py-3 cursor-pointer"
                >
                  Contact Sales
                </button>
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
