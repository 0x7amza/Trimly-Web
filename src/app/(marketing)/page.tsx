"use client";

import React, { useState } from "react";
import { useUser, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";

export default function MarketingPage() {
  const { isSignedIn } = useUser();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-24 md:py-36 px-6 overflow-hidden">
        <div className="max-w-[850px] mx-auto text-center flex flex-col items-center">
          <h1 className="text-5xl md:text-7xl font-[900] text-ink leading-[1.05] tracking-tight mb-8">
            Your Shop. <br />
            <span className="text-primary-deep bg-primary px-4 py-1 rounded-2xl inline-block mt-2">Multiplied.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-body-text font-normal max-w-2xl mb-12 leading-relaxed">
            No double-bookings. Automate scheduling, handle instant walk-ins in 2 taps, and send automated WhatsApp reminders.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
            {isSignedIn ? (
              <Link href="/dashboard/calendar" className="button-primary text-lg px-8 py-4">
                Open Dashboard
              </Link>
            ) : (
              <SignUpButton mode="modal">
                <button className="button-primary text-lg px-8 py-4 cursor-pointer">
                  Start 14-Day Free Trial
                </button>
              </SignUpButton>
            )}
            <Link href="/doe-barbershop" className="button-tertiary text-lg px-8 py-4">
              View Demo Shop
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-32 px-6 bg-canvas">
        <div className="max-w-[1200px] mx-auto">
          <div className="max-w-2xl mb-16">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-ink mb-6">
              Built for speed, not administrative overhead.
            </h2>
            <p className="text-lg text-body-text">
              Barbers don&apos;t have time to battle complex calendar tools. That&apos;s why we optimized every action to be lightning-fast.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card-feature-sage flex flex-col justify-between h-[360px]">
              <div>
                <div className="w-12 h-12 bg-canvas rounded-full flex items-center justify-center mb-6 border border-ink/5">
                  <svg className="w-6 h-6 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-ink mb-3">2-Tap Walk-In Calendar</h3>
                <p className="text-sm text-body-text leading-relaxed">
                  Tap an empty slot, select the service, and hit save. Walk-in appointments added in under 3 seconds directly on your timeline.
                </p>
              </div>
              <div className="text-xs font-bold text-mute-text uppercase tracking-wider">
                Optimized B2B Workflow
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card-feature-green flex flex-col justify-between h-[360px]">
              <div>
                <div className="w-12 h-12 bg-canvas rounded-full flex items-center justify-center mb-6 border border-ink/5">
                  <svg className="w-6 h-6 text-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-ink mb-3">WhatsApp Confirmation</h3>
                <p className="text-sm text-body-text leading-relaxed">
                  Automatically ping clients via WhatsApp when they book online. Includes automatic cancel links to prevent no-shows.
                </p>
              </div>
              <div className="text-xs font-bold text-positive-deep uppercase tracking-wider">
                Automated Notifications
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card-feature-dark flex flex-col justify-between h-[360px]">
              <div>
                <div className="w-12 h-12 bg-canvas rounded-full flex items-center justify-center mb-6 border border-ink/5">
                  <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-primary mb-3">Custom Booking Link</h3>
                <p className="text-sm text-primary-pale/80 leading-relaxed">
                  A beautiful, lightning-fast mobile booking link you can put on Instagram or TikTok. Clean transitions, deposit taking, and zero clutter.
                </p>
              </div>
              <div className="text-xs font-bold text-primary-neutral uppercase tracking-wider">
                B2C Mobile Portal
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 px-6">
        <div className="max-w-[1200px] mx-auto text-center">
          <div className="max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-ink mb-6">Simple, transparent pricing.</h2>
            <p className="text-lg text-body-text">
              Try Trimly free for 14 days. Scale as your barbershop grows.
            </p>

            {/* Period Toggle */}
            <div className="inline-flex bg-canvas p-1.5 rounded-full border border-ink/10 mt-8">
              <button
                type="button"
                onClick={() => setBillingPeriod("monthly")}
                className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all cursor-pointer ${
                  billingPeriod === "monthly" ? "bg-ink text-white shadow-md" : "text-body-text hover:text-ink"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod("yearly")}
                className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all cursor-pointer ${
                  billingPeriod === "yearly" ? "bg-ink text-white shadow-md" : "text-body-text hover:text-ink"
                }`}
              >
                Yearly (Save 20%)
              </button>
            </div>
          </div>

          <div className="max-w-md mx-auto card-content text-left border border-ink/5">
            <div className="mb-6">
              <span className="badge-positive mb-4">Standard Plan</span>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-5xl font-black text-ink">
                  £{billingPeriod === "monthly" ? "29" : "23"}
                </span>
                <span className="text-sm font-bold text-mute-text">/ month</span>
              </div>
              {billingPeriod === "yearly" && (
                <p className="text-xs text-positive font-bold mt-2">Billed yearly at £276</p>
              )}
            </div>

            <p className="text-sm text-body-text mb-8">
              Perfect for modern barbershops looking to automate customer bookings and streamline calendar operations.
            </p>

            <ul className="space-y-4 mb-8 text-sm">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-positive flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ink font-semibold">Includes first 5 barbers</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-positive flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ink font-semibold">Custom B2C booking URL slug</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-positive flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ink font-semibold">Unlimited 2-Tap manual bookings</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-positive flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-ink font-semibold">WhatsApp client notifications</span>
              </li>
              <li className="flex items-center gap-3 text-mute-text">
                <svg className="w-5 h-5 text-positive flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>Additional barbers at £3/barber/mo</span>
              </li>
            </ul>

            {isSignedIn ? (
              <Link href="/dashboard/calendar" className="button-primary w-full text-center py-4 block">
                Open Dashboard
              </Link>
            ) : (
              <SignUpButton mode="modal">
                <button className="button-primary w-full text-center py-4 cursor-pointer">
                  Get Started Now
                </button>
              </SignUpButton>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
