"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { CustomCombobox } from "@/components/ui/custom-combobox";
import { 
  Star, 
  MapPin, 
  Landmark, 
  Scissors, 
  Gem, 
  Sparkles, 
  ArrowRight 
} from "lucide-react";
import { api, Barber, Service, Shop } from "@/lib/api";

const CATEGORY_ICONS: Record<string, React.ComponentType<any>> = {
  hairdresser: Scissors,
  barber: Scissors,
  manicure: Gem,
  "beauty-salon": Sparkles,
};

const CATEGORY_INFO: Record<string, {
  title: string;
  subtitle: string;
  themeClass: string;
  badgeClass: string;
  imageUrl: string;
}> = {
  hairdresser: {
    title: "Premium Hair Stylists & Salons",
    subtitle: "Find the perfect salon for a fresh cut, vibrant color, blow-dry, or custom hair styling near you.",
    themeClass: "bg-gradient-to-br from-rose-50 to-pink-50/50 border-rose-100",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200/50",
    imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80"
  },
  barber: {
    title: "Expert Local Barbershops",
    subtitle: "Classic cuts, modern skinfades, hot towel shaves, and precise beard designs by master barbers.",
    themeClass: "bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200/50",
    imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80"
  },
  manicure: {
    title: "Professional Nail Salons & Spas",
    subtitle: "Pamper your hands and feet with luxury gel manicures, pedicures, extensions, and nail art.",
    themeClass: "bg-gradient-to-br from-purple-50 to-indigo-50/50 border-purple-100",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200/50",
    imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80"
  },
  "beauty-salon": {
    title: "Elite Beauty & Skincare Lounges",
    subtitle: "Revitalizing facials, professional eyebrow shaping, tinting, waxing, and skin therapies.",
    themeClass: "bg-gradient-to-br from-teal-50 to-emerald-50/50 border-teal-100",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-200/50",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80"
  },
};

export default function CategoryLandingView({ categorySlug }: { categorySlug: string }) {
  const { isSignedIn } = useUser();
  const [selectedLocation, setSelectedLocation] = useState<string>("All");
  const [activeCities, setActiveCities] = useState<string[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Map category slug to industryType used in DB
    const industryTypeMap: Record<string, string> = {
      hairdresser: "Hairdresser",
      barber: "Barber",
      manicure: "Manicure",
      "beauty-salon": "Beauty Salon",
    };
    const industryType = industryTypeMap[categorySlug];
    const qs = industryType ? `?industryType=${encodeURIComponent(industryType)}` : "";
    fetch(`/api/v1/search${qs}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          // Build shop-like objects from search results
          const mappedShops: Shop[] = res.data.results.map((item: { id: string; name: string; slug: string; profileImage?: string; images?: string[]; city?: string; industryType?: string; address?: string }) => ({
            id: item.id,
            ownerId: "",
            name: item.name,
            slug: item.slug,
            profileImage: item.profileImage,
            profilePicture: item.profileImage,
            images: item.images,
            city: item.city,
            industryType: item.industryType,
            address: item.address,
          }));
          setShops(mappedShops);
          setActiveCities(res.data.cities || []);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [categorySlug]);


  const getCategorySlugForShop = (industryType?: string) => {
    if (!industryType) return "";
    const type = industryType.toLowerCase();
    if (type === "barber") return "barber";
    if (type === "hairdresser") return "hairdresser";
    if (type === "manicure") return "manicure";
    if (type === "beauty salon" || type === "beauty-salon") return "beauty-salon";
    return "";
  };

  const getShopBarbers = (shopId: string) => {
    return barbers.filter(b => b.shopId === shopId);
  };

  const getShopServices = (shopId: string) => {
    const shopBarberIds = getShopBarbers(shopId).map(b => b.clerkId);
    return services.filter(s => shopBarberIds.includes(s.barberId) && s.isActive);
  };

  const categoryInfo = CATEGORY_INFO[categorySlug] || {
    title: "Premium Directory",
    subtitle: "Find local professionals and book online.",
    themeClass: "bg-gradient-to-br from-rose-50 to-pink-50/50 border-rose-100",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200/50",
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80"
  };

  const locationsOptions = [
    { label: "All Locations", value: "All" },
    ...activeCities.map(city => ({ label: city, value: city }))
  ];

  const filteredShops = shops.filter(shop => {
    const isOfCategory = getCategorySlugForShop(shop.industryType) === categorySlug;
    if (!isOfCategory) return false;
    
    const activeLoc = selectedLocation || "All";
    if (activeLoc === "All") return true;

    return shop.city?.toLowerCase() === activeLoc.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-canvas-soft flex flex-col font-sans w-full">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-canvas/80 backdrop-blur-md border-b border-ink/5">
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

          <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider">
            <Link 
              href="/hairdresser" 
              className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${categorySlug === "hairdresser" ? "bg-ink text-white" : "text-body-text hover:text-ink hover:bg-ink/5"}`}
            >
              Hairdresser
            </Link>
            <Link 
              href="/barber" 
              className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${categorySlug === "barber" ? "bg-ink text-white" : "text-body-text hover:text-ink hover:bg-ink/5"}`}
            >
              Barber
            </Link>
            <Link 
              href="/manicure" 
              className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${categorySlug === "manicure" ? "bg-ink text-white" : "text-body-text hover:text-ink hover:bg-ink/5"}`}
            >
              Manicure
            </Link>
            <Link 
              href="/beauty-salon" 
              className={`px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${categorySlug === "beauty-salon" ? "bg-ink text-white" : "text-body-text hover:text-ink hover:bg-ink/5"}`}
            >
              Beauty Salon
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href={isSignedIn ? "/dashboard/calendar" : "/for-professionals"} className="button-primary text-xs !py-2 !px-4">
              For Professionals
            </Link>
            <Link href="/" className="button-tertiary text-xs !py-2 !px-4">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-6 bg-canvas border-b border-ink/5">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border ${categoryInfo.badgeClass}`}>
              {React.createElement(CATEGORY_ICONS[categorySlug] || Scissors, { className: "w-3.5 h-3.5" })}
              <span>{categorySlug.replace("-", " ")}</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-ink leading-[1.1] tracking-tight mb-4">
              {categoryInfo.title}
            </h1>
            
            <p className="text-base md:text-lg text-body-text max-w-xl leading-relaxed">
              {categoryInfo.subtitle} Check live availability, transparent pricing, and secure your appointment online 24/7.
            </p>
          </div>

          <div className="lg:col-span-5 flex justify-center w-full">
            <div className="w-full max-w-sm h-64 rounded-wise overflow-hidden shadow-lg border border-ink/10 relative group">
              <img 
                src={categoryInfo.imageUrl} 
                alt={categorySlug} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/10 transition-opacity duration-300" />
              <div className="absolute bottom-4 left-4 right-4 bg-canvas/95 backdrop-blur-sm border border-ink/5 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold text-ink">
                <span>Verified Professionals</span>
                <span className="badge-positive text-[10px]">100% Secure</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location Filter & Directory Content */}
      <section className="max-w-[1200px] mx-auto px-6 py-12 w-full flex-grow flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-ink/5 pb-6">
          <div>
            <h2 className="text-lg font-black text-ink">Available Professionals</h2>
            <p className="text-xs text-mute-text">Showing {filteredShops.length} salons matching filters</p>
          </div>
          
          <div className="w-56">
            <CustomCombobox
              value={selectedLocation === "All" ? "" : selectedLocation}
              onChange={(val) => setSelectedLocation(val || "All")}
              options={locationsOptions.filter(opt => opt.value !== "All")}
              placeholder="All Locations"
              searchPlaceholder="Search locations..."
            />
          </div>
        </div>

        {/* Directory Grid */}
        {filteredShops.length === 0 ? (
          <div className="card-content bg-canvas border border-ink/5 p-12 text-center flex flex-col items-center justify-center flex-grow">
            <Landmark className="w-12 h-12 text-mute-text mb-4 stroke-1" />
            <h3 className="font-extrabold text-lg text-ink">No Salons Found</h3>
            <p className="text-xs text-body-text max-w-sm mt-1.5">
              We couldn&apos;t find any {categorySlug.replace("-", " ")} salons in <strong>{selectedLocation}</strong>. Try selecting &quot;All Locations&quot;.
            </p>
            <button 
              onClick={() => setSelectedLocation("All")} 
              className="button-tertiary text-xs mt-4 !py-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredShops.map((shop) => {
              const shopBarbersList = getShopBarbers(shop.id);
              const shopServicesList = getShopServices(shop.id);
              const address = shop.address || (shop.city ? `${shop.city}, UK` : "Location, UK");
              const bio = shop.industryType ? `${shop.industryType} services in ${shop.city || "UK"}.` : "Premium beauty service specialists.";

              return (
                <div key={shop.id} className="card-content bg-canvas border border-ink/5 hover:border-ink/20 transition-all flex flex-col justify-between overflow-hidden p-0 group">
                  <div className="h-28 relative overflow-hidden flex items-end justify-between px-6 pb-3">
                    <img 
                      src={shop.profileImage || shop.profilePicture || categoryInfo.imageUrl} 
                      alt={shop.name} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="w-8 h-8 rounded-full bg-canvas/95 backdrop-blur-sm flex items-center justify-center border border-ink/5 z-10 text-ink">
                      {React.createElement(CATEGORY_ICONS[categorySlug] || Scissors, { className: "w-4 h-4" })}
                    </div>
                    <span className="badge-positive text-[9px] uppercase tracking-wider bg-canvas/95 backdrop-blur-sm text-positive-deep border border-ink/5 z-10 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-positive text-positive" />
                      <span>4.9 Rated</span>
                    </span>
                  </div>

                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-black text-lg text-ink tracking-tight group-hover:text-primary-deep transition-colors">
                        {shop.name}
                      </h3>
                      <p className="text-xs text-mute-text flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        {address}
                      </p>
                      <p className="text-xs text-body-text mt-3 line-clamp-2 leading-relaxed">
                        {bio}
                      </p>
                    </div>

                    {shopServicesList.length > 0 && (
                      <div className="bg-canvas-soft/30 rounded-xl p-3 border border-ink/5 space-y-2">
                        <span className="block text-[9px] font-bold text-mute-text uppercase tracking-wider">
                          Popular Services
                        </span>
                        {shopServicesList.slice(0, 2).map(serv => (
                          <div key={serv.id} className="flex justify-between items-center text-xs">
                            <span className="font-medium text-ink">{serv.name}</span>
                            <span className="font-extrabold text-ink">£{(serv.price / 100).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-ink/5 px-6 py-4 bg-canvas flex items-center justify-between">
                    <span className="text-[10px] text-mute-text font-bold uppercase tracking-wider">
                      Instantly Bookable
                    </span>
                    <Link 
                      href={`/${shop.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold bg-primary hover:bg-primary-hover text-ink py-2 px-4 rounded-full transition-all border border-ink/10"
                    >
                      Explore
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-ink text-canvas-soft py-12 px-6 mt-12 border-t border-ink/10">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-primary">Trimly</span>
            </div>
            <p className="text-xs text-canvas-soft/50 mt-2 max-w-xs">
              Instant appointment directory booking. Modern scheduling for premium clients.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-3">Categories</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-canvas-soft/60">
              <Link href="/hairdresser" className="hover:text-primary">Hairdresser</Link>
              <Link href="/barber" className="hover:text-primary">Barbershops</Link>
              <Link href="/manicure" className="hover:text-primary">Nail Salon</Link>
              <Link href="/beauty-salon" className="hover:text-primary">Beauty Care</Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-white mb-3">Support</h4>
            <p className="text-xs text-canvas-soft/60">
              Questions? Visit our help desk or B2B sales portal at <Link href="/for-professionals" className="underline hover:text-primary">Trimly Plans</Link>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
