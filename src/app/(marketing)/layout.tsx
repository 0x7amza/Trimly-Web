"use client";

import React from "react";
import Link from "next/link";
import { useUser, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <div className="flex flex-col min-h-screen bg-canvas-soft">
      {/* Global Navbar */}
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

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/discover" className="text-sm font-bold text-body-text hover:text-ink transition-colors">
              Find a Barbershop
            </Link>
            <Link href="/#features" className="text-sm font-bold text-body-text hover:text-ink transition-colors">
              Features
            </Link>
            <Link href="/tarifs" className="text-sm font-bold text-body-text hover:text-ink transition-colors">
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {!isLoaded ? (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : isSignedIn ? (
              <>
                <Link href="/dashboard/calendar" className="button-primary text-xs md:text-sm !py-2 !px-4">
                  For Professionals
                </Link>
                <Link href="/doe-barbershop" className="button-tertiary text-xs md:text-sm !py-2 !px-4">
                  Client Login
                </Link>
                <UserButton />
              </>
            ) : (
              <>
                <Link href="/for-professionals" className="button-primary text-xs md:text-sm !py-2 !px-4 text-center">
                  For Professionals
                </Link>
                <Link href="/doe-barbershop" className="button-tertiary text-xs md:text-sm !py-2 !px-4">
                  Client Login
                </Link>
              </>
            )}
          </div>
        </div>
        {/* Sub-navbar with marketplace categories */}
        <div className="border-t border-ink/5 bg-canvas/50">
          <div className="max-w-[1200px] mx-auto px-6 h-11 flex items-center justify-center gap-6 overflow-x-auto scrollbar-none text-xs font-bold uppercase tracking-wider">
            <Link href="/hairdresser" className="text-body-text hover:text-ink transition-colors whitespace-nowrap px-3 py-1 rounded-full hover:bg-ink/5">
              Hairdresser
            </Link>
            <Link href="/barber" className="text-body-text hover:text-ink transition-colors whitespace-nowrap px-3 py-1 rounded-full hover:bg-ink/5">
              Barber
            </Link>
            <Link href="/manicure" className="text-body-text hover:text-ink transition-colors whitespace-nowrap px-3 py-1 rounded-full hover:bg-ink/5">
              Manicure
            </Link>
            <Link href="/beauty-salon" className="text-body-text hover:text-ink transition-colors whitespace-nowrap px-3 py-1 rounded-full hover:bg-ink/5">
              Beauty Salon
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">{children}</main>

      {/* Dark Footer */}
      <footer className="bg-ink text-canvas-soft py-16 px-6">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <svg
                className="w-8 h-8 text-primary"
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
              <span className="font-extrabold text-2xl tracking-tight text-primary">Trimly</span>
            </div>
            <p className="text-sm text-canvas-soft/60 max-w-xs">
              Complete scheduling and client booking platform for premium barbershops.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Product</h4>
            <ul className="flex flex-col gap-2 text-sm text-canvas-soft/75">
              <li><Link href="/#features" className="hover:text-primary transition-colors">Features</Link></li>
              <li><Link href="/tarifs" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/doe-barbershop" className="hover:text-primary transition-colors">Booking Demo</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Company</h4>
            <ul className="flex flex-col gap-2 text-sm text-canvas-soft/75">
              <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contact Support</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">Legal</h4>
            <ul className="flex flex-col gap-2 text-sm text-canvas-soft/75">
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Refund Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-[1200px] mx-auto mt-16 pt-8 border-t border-canvas-soft/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-canvas-soft/40">
          <p>© {new Date().getFullYear()} Trimly Ltd. All rights reserved.</p>
          <p>Wise Brand Aesthetic Implementation.</p>
        </div>
      </footer>
    </div>
  );
}
