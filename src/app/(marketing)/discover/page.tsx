"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { mockDb, Shop, Barber, Service } from "@/lib/api";
import Link from "next/link";
import { Star, MapPin, Scissors, Sparkles, ArrowRight, Landmark, Search, Clock, Gem } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";

// Wrap search logic in a sub-component to safely use useSearchParams in Next.js Suspense boundary
function DiscoverDirectory() {
  const searchParams = useSearchParams();
  
  const [shops, setShops] = useState<Shop[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");

  useEffect(() => {
    // Load database
    setShops(mockDb.getShops());
    setBarbers(mockDb.getBarbers());
    setServices(mockDb.getServices());

    // Parse query parameters
    const query = searchParams.get("query") || "";
    const category = searchParams.get("category") || "All";
    const location = searchParams.get("location") || "All";

    if (query) setSearchQuery(query);
    if (category) setSelectedCategory(category);
    if (location) setSelectedLocation(location);
  }, [searchParams]);

  const getCategorySlugForShop = (slug: string) => {
    if (slug.includes("hairdresser")) return "hairdresser";
    if (slug.includes("barber")) return "barber";
    if (slug.includes("nails")) return "manicure";
    if (slug.includes("beauty")) return "beauty-salon";
    return "";
  };

  const getShopBarbers = (shopId: string) => {
    return barbers.filter(b => b.shopId === shopId);
  };

  const getShopServices = (shopId: string) => {
    const shopBarberIds = getShopBarbers(shopId).map(b => b.clerkId);
    return services.filter(s => shopBarberIds.includes(s.barberId) && s.isActive);
  };

  // Filter logic
  const filteredShops = shops.filter((shop) => {
    // 1. Text Search query
    const shopBarbersList = getShopBarbers(shop.id);
    const shopServicesList = getShopServices(shop.id);
    
    const matchesText = !searchQuery.trim() || 
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shopBarbersList.some(b => b.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      shopServicesList.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // 2. Category match
    const shopCategory = getCategorySlugForShop(shop.slug);
    const matchesCategory = selectedCategory === "All" || shopCategory === selectedCategory;

    // 3. Location match via shop.city field
    const matchesLocation = selectedLocation === "All" || 
      shop.city?.toLowerCase() === selectedLocation.toLowerCase();

    return matchesText && matchesCategory && matchesLocation;
  });

  const categoriesList = [
    { label: "All Categories", value: "All" },
    { label: "Hairdresser", value: "hairdresser" },
    { label: "Barber", value: "barber" },
    { label: "Manicure", value: "manicure" },
    { label: "Beauty Salon", value: "beauty-salon" },
  ];

  // Build city list dynamically from live shop data
  const allCities = Array.from(
    new Set(shops.map(s => s.city).filter(Boolean))
  ) as string[];
  const locationsOptions = [
    { value: "All", label: "All Locations" },
    ...allCities.map(city => ({ value: city, label: city })),
  ];

  return (
    <div className="py-12 px-6 bg-canvas-soft min-h-screen">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* Title & Stats */}
        <div>
          <h1 className="text-3xl font-black text-ink tracking-tight flex items-center gap-2">
            <Search className="w-7 h-7 text-ink" /> Discover Local Professionals
          </h1>
          <p className="text-xs text-mute-text mt-1">
            Browse and instantly book top-rated salons, independent hairdressers, manicure bars, and wellness spas.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-canvas border border-ink/5 p-5 rounded-wise shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Search Input */}
            <div>
              <label className="block text-[10px] font-bold text-mute-text uppercase tracking-wider mb-2">Search Name or Service</label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-mute-text" />
                <input
                  type="text"
                  placeholder="Fade, manicure, blowdry..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-input pl-10 !py-2.5 font-bold placeholder:text-mute-text/70"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[10px] font-bold text-mute-text uppercase tracking-wider mb-2">Filter by Category</label>
              <CustomSelect
                value={selectedCategory}
                onChange={(val) => setSelectedCategory(val)}
                options={categoriesList}
              />
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-[10px] font-bold text-mute-text uppercase tracking-wider mb-2">Filter by Location</label>
              <CustomSelect
                value={selectedLocation}
                onChange={(val) => setSelectedLocation(val)}
                options={locationsOptions}
              />
            </div>

          </div>
        </div>

        {/* Directory Listings */}
        {filteredShops.length === 0 ? (
          <div className="card-content bg-canvas border border-ink/5 p-16 text-center flex flex-col items-center justify-center">
            <Landmark className="w-16 h-16 text-mute-text mb-4 stroke-1" />
            <h3 className="font-extrabold text-lg text-ink">No Salons Match Filters</h3>
            <p className="text-xs text-body-text max-w-sm mt-1.5 leading-relaxed">
              We couldn&apos;t find any professionals matching your search for &quot;{searchQuery}&quot; in category &quot;{selectedCategory}&quot; at &quot;{selectedLocation}&quot;.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
                setSelectedLocation("All");
              }}
              className="button-tertiary text-xs mt-6"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredShops.map((shop) => {
              const shopCategory = getCategorySlugForShop(shop.slug);
              const shopBarbersList = getShopBarbers(shop.id);
              const shopServicesList = getShopServices(shop.id);
              const address = shopBarbersList[0]?.address || "Location, UK";
              const bio = shopBarbersList[0]?.bio || "Premium beauty service specialists.";

              // Category-specific backgrounds
              const categoryImages: Record<string, string> = {
                hairdresser: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80",
                barber: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80",
                manicure: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80",
                "beauty-salon": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
              };

              const categoryIcons: Record<string, React.ComponentType<any>> = {
                hairdresser: Scissors,
                barber: Scissors,
                manicure: Gem,
                "beauty-salon": Sparkles,
              };

              const imageUrl = categoryImages[shopCategory] || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80";

              return (
                <div key={shop.id} className="card-content bg-canvas border border-ink/5 hover:border-ink/20 transition-all flex flex-col justify-between overflow-hidden p-0 group">
                  {/* Category Image Header */}
                  <div className="h-28 relative overflow-hidden flex items-end justify-between px-6 pb-3">
                    <img 
                      src={imageUrl} 
                      alt={shop.name} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                    <span className="text-[10px] font-bold bg-canvas/95 backdrop-blur-sm text-ink px-2.5 py-1 rounded-full uppercase tracking-wider border border-ink/5 shadow-sm z-10 flex items-center gap-1">
                      {React.createElement(categoryIcons[shopCategory] || Scissors, { className: "w-3 h-3" })}
                      <span>{shopCategory.replace("-", " ")}</span>
                    </span>
                    <span className="badge-positive text-[9px] uppercase tracking-wider bg-canvas/95 backdrop-blur-sm text-positive-deep border border-ink/5 shadow-sm z-10 flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-positive-deep text-positive-deep" />
                      <span>4.9 Verified</span>
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-black text-lg text-ink tracking-tight group-hover:text-primary-deep transition-colors">
                        {shop.name}
                      </h3>
                      <p className="text-xs text-mute-text flex items-center gap-1 mt-1 font-semibold">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        {address}
                      </p>
                      <p className="text-xs text-body-text mt-3 line-clamp-2 leading-relaxed">
                        {bio}
                      </p>
                    </div>

                    {/* Services Preview list */}
                    {shopServicesList.length > 0 && (
                      <div className="bg-canvas-soft/30 rounded-xl p-3 border border-ink/5 space-y-2">
                        <span className="block text-[9px] font-bold text-mute-text uppercase tracking-wider">
                          Services Offered
                        </span>
                        {shopServicesList.slice(0, 2).map((serv) => (
                          <div key={serv.id} className="flex justify-between items-center text-xs">
                            <span className="font-medium text-body-text">{serv.name}</span>
                            <span className="font-extrabold text-ink">£{(serv.price / 100).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Footer */}
                  <div className="border-t border-ink/5 px-6 py-4 bg-canvas flex items-center justify-between">
                    <span className="text-[10px] text-mute-text font-bold uppercase tracking-wider">
                      Instantly Bookable
                    </span>
                    <Link
                      href={`/${shop.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold bg-primary hover:bg-primary-hover text-ink py-2 px-4 rounded-full transition-all border border-ink/10 shadow-sm"
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

      </div>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-canvas-soft">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <DiscoverDirectory />
    </Suspense>
  );
}
