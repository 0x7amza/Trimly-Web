"use client";

import React, { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useUser, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TarifsPage() {
  const { isSignedIn } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [showSalesToast, setShowSalesToast] = useState(false);

  useEffect(() => {
    const isAuth = localStorage.getItem("trimly_b2b_authorized") === "true";
    if (!isAuth) {
      router.replace("/for-professionals");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas-soft">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="py-16 md:py-24 px-6 bg-canvas-soft min-h-screen">
      <div className="max-w-[1200px] mx-auto text-center">
        {/* Header Hook */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-pale text-positive-deep rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-primary/20">
            <Sparkles className="w-3.5 h-3.5 text-positive-deep" />
            Simple, Transparent Rates
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-ink mb-4">
            Trimly Business Subscriptions
          </h1>
          <p className="text-base md:text-lg text-body-text">
            Start with our 14-day free trial. Cancel or change plans anytime. No hidden booking commission for standard plans.
          </p>

          {/* Billing period switcher */}
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

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch text-left mb-16">
          {/* Free Tier Card */}
          <Card className="flex flex-col justify-between border border-ink/5 bg-canvas rounded-wise shadow-sm">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-mute-text bg-canvas-soft px-2.5 py-1 rounded-md">
                  Solo Professional
                </span>
              </div>
              <CardTitle className="text-2xl font-extrabold text-ink mt-2">Free</CardTitle>
              <CardDescription className="text-xs text-body-text">Perfect for solo specialists starting out.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow p-6 pt-0">
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-4xl font-black text-ink">£0</span>
                <span className="text-xs font-bold text-mute-text">/ month</span>
              </div>
              <ul className="space-y-3 text-xs text-body-text mt-4">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                  <span><strong>1 Professional</strong> profile</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                  <span>2-Tap manual walk-in bookings</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                  <span>Standard mobile booking URL link</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                  <span>Basic email support response</span>
                </li>
              </ul>
            </CardContent>
            <div className="p-6 pt-0 mt-auto">
              {isSignedIn ? (
                <Link href="/dashboard/calendar" className="button-tertiary w-full text-center py-3 text-sm">
                  Go to Dashboard
                </Link>
              ) : (
                <SignUpButton mode="modal">
                  <button className="button-tertiary w-full text-center py-3 text-sm cursor-pointer">
                    Get Started Free
                  </button>
                </SignUpButton>
              )}
            </div>
          </Card>

          {/* Growth Tier Card (Popular) */}
          <Card className="border-2 border-ink bg-canvas rounded-wise shadow-lg relative flex flex-col justify-between">
            <div className="absolute top-0 right-6 -translate-y-1/2 bg-primary text-ink-deep text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-ink">
              Most Popular
            </div>
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-positive-deep bg-primary-pale px-2.5 py-1 rounded-md">
                  Active Salons
                </span>
              </div>
              <CardTitle className="text-2xl font-extrabold text-ink mt-2">Growth</CardTitle>
              <CardDescription className="text-xs text-body-text">Streamline client bookings & automate WhatsApp alerts.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow p-6 pt-0">
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-4xl font-black text-ink">
                  £{billingPeriod === "monthly" ? "29" : "23"}
                </span>
                <span className="text-xs font-bold text-mute-text">/ month</span>
              </div>
              {billingPeriod === "yearly" && (
                <span className="text-[10px] font-bold text-positive bg-primary-pale px-2 py-0.5 rounded-full">Billed annually at £276</span>
              )}
              <ul className="space-y-3 text-xs text-body-text mt-4">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                  <span>Includes first <strong>5 Staff members</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                  <span>Custom B2C booking URL directory slug</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                  <span>Automated WhatsApp notifications & codes</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                  <span>Priority email & direct chat support</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                  <span>Full-scale B2C checkout deposits taking</span>
                </li>
              </ul>
            </CardContent>
            <div className="p-6 pt-0 mt-auto">
              {isSignedIn ? (
                <Link href="/dashboard/calendar" className="button-primary w-full text-center py-3 text-sm">
                  Go to Dashboard
                </Link>
              ) : (
                <SignUpButton mode="modal">
                  <button className="button-primary w-full text-center py-3 text-sm cursor-pointer">
                    Start 14-Day Free Trial
                  </button>
                </SignUpButton>
              )}
            </div>
          </Card>

          {/* Pro Tier Card */}
          <Card className="flex flex-col justify-between border border-ink/5 bg-canvas rounded-wise shadow-sm">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-mute-text bg-canvas-soft px-2.5 py-1 rounded-md">
                  Multi-Location
                </span>
              </div>
              <CardTitle className="text-2xl font-extrabold text-ink mt-2">Pro</CardTitle>
              <CardDescription className="text-xs text-body-text">For multi-location or high volume salons.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow p-6 pt-0">
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-4xl font-black text-ink">
                  £{billingPeriod === "monthly" ? "59" : "47"}
                </span>
                <span className="text-xs font-bold text-mute-text">/ month</span>
              </div>
              {billingPeriod === "yearly" && (
                <span className="text-[10px] font-bold text-positive bg-primary-pale px-2 py-0.5 rounded-full">Billed annually at £564</span>
              )}
              <ul className="space-y-3 text-xs text-body-text mt-4">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                  <span><strong>Unlimited Staff</strong> & salon locations</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                  <span>Custom domain integrations (booking.yourbrand.com)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                  <span>Custom SMS/WhatsApp sender IDs & API access</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                  <span>Dedicated account manager & 1-on-1 onboarding</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-positive flex-shrink-0 mt-0.5" />
                  <span>Advanced report suites & POS register integration</span>
                </li>
              </ul>
            </CardContent>
            <div className="p-6 pt-0 mt-auto">
              <button 
                onClick={() => {
                  setShowSalesToast(true);
                  setTimeout(() => setShowSalesToast(false), 4000);
                }}
                className="button-tertiary w-full text-center py-3 text-sm cursor-pointer"
              >
                Contact Sales
              </button>
            </div>
          </Card>
        </div>

        {/* Client Booking Fee Details */}
        <div className="max-w-3xl mx-auto bg-canvas border border-ink/5 p-8 rounded-wise text-left space-y-4">
          <h2 className="text-xl font-extrabold text-ink flex items-center gap-2">
            💡 Consumer & Client Booking Information
          </h2>
          <p className="text-xs text-body-text leading-relaxed">
            Trimly functions as a B2B2C Marketplace platform. 
            When booking an appointment through our directory listing, a small payment processing fee of <strong>£0.50</strong> may be charged on B2C online transactions to cover secure card vaulting (PCI-DSS compliance) and instant SMS/WhatsApp reminder notifications. 
            There are absolutely no charges to clients for cancellation or modifying bookings when processed within the salon&apos;s grace cancellation window.
          </p>
        </div>
      </div>

      {/* Simulated toast */}
      {showSalesToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-white py-4 px-6 rounded-wise shadow-2xl border border-primary/20 max-w-sm transition-all animate-bounce">
          <div className="flex items-start gap-3">
            <span className="text-xl">📞</span>
            <div>
              <p className="font-bold text-sm">Demo Request Registered</p>
              <p className="text-xs text-canvas-soft/70 mt-1">
                Thank you! Our sales team will get back to you shortly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
