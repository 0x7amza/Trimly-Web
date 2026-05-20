import React from "react";
import { api } from "@/lib/api";
import { notFound } from "next/navigation";

export default async function SalonSlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ salonSlug: string }>;
}) {
  const { salonSlug } = await params;

  let shopName = "Barbershop";
  try {
    const res = await api.shops.getBySlug(salonSlug);
    if (res.success) {
      shopName = res.data.shop.name;
    }
  } catch (err) {
    // If not found in mock state or error, trigger 404
    notFound();
  }

  return (
    <div className="min-h-screen bg-canvas-soft flex flex-col justify-start items-center py-0 sm:py-8 px-0 sm:px-4">
      {/* Mobile-first centered frame container */}
      <div className="w-full max-w-md min-h-screen sm:min-h-[850px] bg-canvas sm:rounded-wise sm:shadow-lg border-0 sm:border border-ink/5 flex flex-col justify-between overflow-hidden relative">
        {/* Salon Header Banner */}
        <header className="bg-canvas border-b border-ink/5 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-sm text-ink border border-ink/10">
              💈
            </div>
            <span className="font-extrabold text-md tracking-tight text-ink">{shopName}</span>
          </div>
          <span className="text-[10px] font-bold bg-primary-pale text-positive-deep px-2 py-0.5 rounded-full uppercase tracking-wider">
            Secure Booking
          </span>
        </header>

        {/* Content Pane */}
        <div className="flex-grow flex flex-col bg-canvas">
          {children}
        </div>

        {/* Brand Footer */}
        <footer className="py-4 border-t border-ink/5 text-center text-[10px] text-mute-text bg-canvas">
          Powered by <strong>Trimly</strong> • Wise Aesthetic
        </footer>
      </div>
    </div>
  );
}
