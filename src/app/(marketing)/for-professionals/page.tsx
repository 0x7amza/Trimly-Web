"use client";

import React, { useState } from "react";
import { SignIn, SignUp } from "@clerk/nextjs";
import {
  Sparkles,
  TrendingUp,
  Zap,
  Lock,
  LogIn,
  UserPlus,
  ArrowLeft,
  Scissors,
  Building2,
} from "lucide-react";

type View = "choose" | "signin" | "signup";

export default function ForProfessionalsPage() {
  const [view, setView] = useState<View>("choose");

  return (
    <div className="min-h-screen bg-canvas-soft flex items-center justify-center py-16 px-4 md:px-8 relative overflow-hidden">
      {/* Background depth blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1100px] w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

        {/* Left Column: Value Prop */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 text-ink text-xs font-bold uppercase tracking-wider rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              Trimly for Business
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-ink tracking-tight leading-none">
              Grow Your Salon. <br />
              <span className="bg-gradient-to-r from-ink to-primary-hover bg-clip-text text-transparent">
                Automate Bookings.
              </span>
            </h1>
            <p className="text-base text-body-text leading-relaxed">
              Join the UK's leading local booking directory. Unlock instant
              appointments, client deposits, and custom calendars tailored
              specifically to salon workflows.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4 pt-4 border-t border-ink/5">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-canvas border border-ink/10 flex items-center justify-center text-ink flex-shrink-0 shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-ink text-sm">30% Average Booking Increase</h4>
                <p className="text-xs text-mute-text">Listed directly on our interactive high-traffic customer marketplace.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-canvas border border-ink/10 flex items-center justify-center text-ink flex-shrink-0 shadow-sm">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-ink text-sm">No-Show Protection</h4>
                <p className="text-xs text-mute-text">Require deposits or full pre-payment. Automated reminders via WhatsApp.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-canvas border border-ink/10 flex items-center justify-center text-ink flex-shrink-0 shadow-sm">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-ink text-sm">Cancel Anytime</h4>
                <p className="text-xs text-mute-text">Start with a 14-day free trial on all plans. Adjust or cancel directly.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Auth Panel */}
        <div className="lg:col-span-7">
          <div className="bg-canvas border border-ink/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">

            {/* ── CHOOSE VIEW ── */}
            {view === "choose" && (
              <div className="space-y-8 animate-fade-in">
                <div>
                  <h3 className="text-2xl font-black text-ink tracking-tight">Welcome, Professional</h3>
                  <p className="text-xs text-mute-text mt-1 font-semibold">
                    Are you an existing member or opening a new salon on Trimly?
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Existing barber / owner — Sign In */}
                  <button
                    id="btn-signin-choose"
                    onClick={() => setView("signin")}
                    className="group relative flex flex-col items-start gap-4 p-6 bg-canvas-soft border border-ink/10 rounded-2xl hover:border-ink/30 hover:shadow-lg transition-all text-left cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-ink text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <LogIn className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-ink text-base">Sign In</h4>
                      <p className="text-xs text-mute-text mt-1 leading-relaxed">
                        Already have a Trimly account? Log into your dashboard.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-ink/40 group-hover:text-ink transition-colors mt-auto">
                      Existing member →
                    </span>
                  </button>

                  {/* New shop owner — Sign Up */}
                  <button
                    id="btn-signup-choose"
                    onClick={() => setView("signup")}
                    className="group relative flex flex-col items-start gap-4 p-6 bg-canvas-soft border border-ink/10 rounded-2xl hover:border-primary/50 hover:shadow-lg transition-all text-left cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary text-ink flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-black text-ink text-base">Open My Shop</h4>
                      <p className="text-xs text-mute-text mt-1 leading-relaxed">
                        New to Trimly? Create your shop account and go live.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-primary/60 group-hover:text-primary transition-colors mt-auto">
                      New salon →
                    </span>
                  </button>
                </div>

                {/* Barber invite hint */}
                <div className="flex items-start gap-3 p-4 bg-canvas-soft border border-ink/5 rounded-xl">
                  <Scissors className="w-4 h-4 text-mute-text flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-mute-text leading-relaxed">
                    <span className="font-bold text-body-text">Barber joining a team?</span>{" "}
                    Your shop owner will share a direct invite link. Click it to create your account and join the salon.
                  </p>
                </div>
              </div>
            )}

            {/* ── SIGN IN VIEW ── */}
            {view === "signin" && (
              <div className="animate-fade-in">
                <button
                  id="btn-back-signin"
                  onClick={() => setView("choose")}
                  className="flex items-center gap-1.5 text-xs font-bold text-mute-text hover:text-ink transition-colors mb-6 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <LogIn className="w-5 h-5 text-ink" />
                    <h3 className="text-xl font-black text-ink">Sign In to Your Account</h3>
                  </div>
                  <p className="text-xs text-mute-text font-semibold">
                    Access your dashboard, calendar, analytics, and staff workspace.
                  </p>
                </div>
                <SignIn routing="hash" forceRedirectUrl="/dashboard/calendar" />
              </div>
            )}

            {/* ── SIGN UP VIEW ── */}
            {view === "signup" && (
              <div className="animate-fade-in">
                <button
                  id="btn-back-signup"
                  onClick={() => setView("choose")}
                  className="flex items-center gap-1.5 text-xs font-bold text-mute-text hover:text-ink transition-colors mb-6 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <UserPlus className="w-5 h-5 text-ink" />
                    <h3 className="text-xl font-black text-ink">Create Your Shop Account</h3>
                  </div>
                  <p className="text-xs text-mute-text font-semibold">
                    Register as a salon owner. You'll be redirected to set up your shop after sign-up.
                  </p>
                </div>
                <SignUp routing="hash" forceRedirectUrl="/dashboard/calendar" />
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
