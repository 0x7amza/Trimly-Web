"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { B2BProviders, useB2BAuth } from "@/components/providers";
import { useUser, UserButton, SignIn } from "@clerk/nextjs";
import { 
  Calendar, 
  Scissors, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Settings as SettingsIcon,
  Home,
  ShoppingBag
} from "lucide-react";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { activeBarber, shop, role } = useB2BAuth();

  // Subscription Guard: check if subscription is cancelled/expired/none
  const hasSubscription = shop && ["ACTIVE", "TRIALING"].includes(shop.subscription?.status || "");
  const isBillingPage = pathname.endsWith("/billing");

  // Nav items based on role
  const navItems = [
    { label: "Calendar", path: "/dashboard/calendar", icon: Calendar, roles: ["OWNER", "BARBER"] },
    { label: "Services", path: "/dashboard/services", icon: Scissors, roles: ["OWNER", "BARBER"] },
    { label: "Products", path: "/dashboard/products", icon: ShoppingBag, roles: ["OWNER", "BARBER"] },
    { label: "Analytics", path: "/dashboard/analytics", icon: TrendingUp, roles: ["OWNER", "BARBER"] },
    { label: "Staff", path: "/dashboard/staff", icon: Users, roles: ["OWNER"] },
    { label: "Billing", path: "/dashboard/billing", icon: CreditCard, roles: ["OWNER"] },
    { label: "Settings", path: "/dashboard/settings", icon: SettingsIcon, roles: ["OWNER", "BARBER"] },
  ];

  // Filter items based on active role
  const allowedNavItems = navItems.filter((item) => item.roles.includes(role));

  // If locked by subscription guard and not already on billing, redirect or overlay
  const isLocked = !hasSubscription && !isBillingPage;

  return (
    <div className="flex min-h-screen bg-canvas-soft text-ink font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-canvas border-r border-ink/5 flex flex-col justify-between sticky top-0 h-screen z-20">
        <div>
          {/* Logo */}
          <div className="h-16 px-6 border-b border-ink/5 flex items-center gap-2">
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
            <span className="font-extrabold text-xl tracking-tight text-ink">Trimly Dashboard</span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {allowedNavItems.map((item) => {
              const active = pathname.startsWith(item.path);
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                    active
                      ? "bg-primary text-ink border border-ink/10"
                      : "text-body-text hover:bg-canvas-soft hover:text-ink"
                  }`}
                >
                  <IconComponent className="w-4 h-4 text-mute-text" />
                  {item.label}
                </Link>
              );
            })}

            {/* Persistent Back to Home Link inside navigation */}
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-body-text hover:bg-canvas-soft hover:text-ink transition-all border border-ink/5 mt-4"
            >
              <Home className="w-4 h-4 text-mute-text" />
              Back to Home / Exit Dashboard
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-grow flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 bg-canvas border-b border-ink/5 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h2 className="font-extrabold text-lg text-ink">{shop?.name || "My Barbershop"}</h2>
            <span className="text-xs font-bold bg-canvas-soft text-body-text px-2 py-0.5 rounded-md border border-ink/5">
              {role === "OWNER" ? "Owner Admin" : "Barber Staff"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="block text-sm font-bold text-ink">{activeBarber?.name}</span>
              <span className="block text-xs text-mute-text">{activeBarber?.email}</span>
            </div>
            <UserButton />
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-grow p-8 relative flex flex-col">
          {/* Subscription Guard Locked Screen */}
          {isLocked ? (
            <div className="flex-grow flex items-center justify-center p-8 min-h-[calc(100vh-12rem)]">
              <div className="max-w-md w-full card-content border border-ink/5 text-center shadow-xl p-8 bg-canvas rounded-wise">
                <div className="w-16 h-16 bg-negative-bg text-white rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🔒</span>
                </div>
                <h3 className="text-2xl font-black text-ink mb-3">Subscription Suspended</h3>
                <p className="text-sm text-body-text mb-6">
                  {role === "OWNER"
                    ? "Your shop's standard subscription is currently unpaid or expired. Please subscribe to restore calendar operations."
                    : "Your shop's subscription is expired. Please contact the shop owner to restore calendar and dashboard operations."}
                </p>
                <div className="flex flex-col gap-3">
                  {role === "OWNER" ? (
                    <button
                      onClick={() => router.push("/dashboard/billing")}
                      className="button-primary w-full"
                    >
                      Activate Subscription
                    </button>
                  ) : (
                    <div className="bg-canvas-soft border border-ink/5 p-3 rounded-xl text-xs font-bold text-mute-text">
                      Status: Contacting Shop Owner
                    </div>
                  )}
                  <Link href="/" className="button-secondary text-sm text-center py-3">
                    Back to Homepage
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser();

  // Loading state while Clerk initializes
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas-soft">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-mute-text">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // If not signed in, show sign-in form
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas-soft p-4">
        <div className="w-full max-w-md bg-canvas rounded-wise p-8 shadow-xl border border-ink/5 text-center flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6">
            <svg
              className="w-10 h-10 text-ink"
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
            <span className="font-extrabold text-2xl tracking-tight text-ink">Trimly</span>
          </div>
          <h2 className="text-2xl font-black text-ink mb-2">B2B Salon Login</h2>
          <p className="text-sm text-body-text mb-8">
            Access your schedule calendar, analytics, services, and staff management workspace.
          </p>
          <SignIn routing="hash" />
        </div>
      </div>
    );
  }

  // Signed in — render full dashboard
  return (
    <B2BProviders>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </B2BProviders>
  );
}
