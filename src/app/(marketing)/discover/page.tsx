"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Shop, Service } from "@/lib/api";
import Link from "next/link";
import { Star, MapPin, Scissors, Sparkles, ArrowRight, Landmark, Search, Gem } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";

type SearchResult = {
  type: string;
  id: string;
  name: string;
  slug: string;
  images?: string[];
  profileImage?: string;
  industryType?: string;
  city?: string;
  address?: string;
  avgRating?: number;
  totalReviews?: number;
};

function DiscoverDirectory() {
  const searchParams = useSearchParams();

  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("query") || "");
  const [selectedLocation, setSelectedLocation] = useState(() => searchParams.get("location") || "All");

  // Fetch results from /api/v1/search (real DB)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    const params: Record<string, string> = {};
    if (searchQuery) params.searchQuery = searchQuery;
    if (selectedLocation !== "All") params.city = selectedLocation;

    fetch(`/api/v1/search?${new URLSearchParams(params)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setResults(res.data.results);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [searchQuery, selectedLocation]);

  const uniqueCities = Array.from(new Set(results.map((r) => r.city).filter(Boolean))) as string[];

  const locationsOptions = [
    { value: "All", label: "All Locations" },
    ...uniqueCities.map((city) => ({ value: city, label: city })),
  ];

  return (
    <div className="py-12 px-6 bg-canvas-soft min-h-screen">
      <div className="max-w-[1200px] mx-auto space-y-8">

        <div>
          <h1 className="text-3xl font-black text-ink tracking-tight flex items-center gap-2">
            <Search className="w-7 h-7 text-ink" /> Discover Local Barbershops
          </h1>
          <p className="text-xs text-mute-text mt-1">
            Browse and instantly book top-rated barbershops and master barbers near you.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-canvas border border-ink/5 p-5 rounded-wise shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-mute-text uppercase tracking-wider mb-2">Search Barbershop Name</label>
              <div className="relative">
                <Search className="absolute left-3 top-3.5 w-4 h-4 text-mute-text" />
                <input
                  type="text"
                  placeholder="e.g. Gentlemen's..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-input pl-10 !py-2.5 font-bold placeholder:text-mute-text/70"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-mute-text uppercase tracking-wider mb-2">Filter by Location</label>
              <CustomSelect value={selectedLocation} onChange={setSelectedLocation} options={locationsOptions} />
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="card-content border border-ink/5 animate-pulse h-64 bg-canvas-soft" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="card-content bg-canvas border border-ink/5 p-16 text-center flex flex-col items-center justify-center">
            <Landmark className="w-16 h-16 text-mute-text mb-4 stroke-1" />
            <h3 className="font-extrabold text-lg text-ink">No Barbershops Found</h3>
            <p className="text-xs text-body-text max-w-sm mt-1.5 leading-relaxed">
              No barbershops match your current filters. Try broadening your search.
            </p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedLocation("All"); }}
              className="button-tertiary text-xs mt-6"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((item) => {
              const imgUrl = item.profileImage || item.images?.[0] || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80";
              return (
                <div key={item.id} className="card-content bg-canvas border border-ink/5 hover:border-ink/20 transition-all flex flex-col justify-between overflow-hidden p-0 group">
                  <div className="h-28 relative overflow-hidden flex items-end justify-between px-6 pb-3">
                    <img src={imgUrl} alt={item.name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                    <span className="text-[10px] font-bold bg-canvas/95 backdrop-blur-sm text-ink px-2.5 py-1 rounded-full uppercase tracking-wider border border-ink/5 shadow-sm z-10 flex items-center gap-1">
                      <Scissors className="w-3 h-3" />
                      <span>Barbershop</span>
                    </span>
                    {item.totalReviews && item.totalReviews > 0 ? (
                      <span className="badge-positive text-[9px] uppercase tracking-wider bg-canvas/95 backdrop-blur-sm text-positive-deep border border-ink/5 shadow-sm z-10 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-positive-deep text-positive-deep" />
                        <span>{item.avgRating?.toFixed(1)} ({item.totalReviews})</span>
                      </span>
                    ) : (
                      <span className="text-[9px] uppercase tracking-wider bg-canvas/95 backdrop-blur-sm text-mute-text border border-ink/5 shadow-sm rounded-full px-2 py-0.5 z-10 flex items-center gap-1 font-bold">
                        <span>No reviews yet</span>
                      </span>
                    )}
                  </div>
                  <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                    <div>
                      <h3 className="font-black text-lg text-ink tracking-tight group-hover:text-primary-deep transition-colors">{item.name}</h3>
                      {item.city && (
                        <p className="text-xs text-mute-text flex items-center gap-1 mt-1 font-semibold">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {item.city}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="border-t border-ink/5 px-6 py-4 bg-canvas flex items-center justify-between">
                    <span className="text-[10px] text-mute-text font-bold uppercase tracking-wider">Instantly Bookable</span>
                    <Link href={`/${item.slug}`} className="inline-flex items-center gap-1 text-xs font-bold bg-primary hover:bg-primary-hover text-ink py-2 px-4 rounded-full transition-all border border-ink/10 shadow-sm">
                      Explore <ArrowRight className="w-3.5 h-3.5" />
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
