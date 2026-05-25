"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Users, 
  Tag, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  Zap, 
  Lock 
} from "lucide-react";

export default function ForProfessionalsPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    staffCount: "1",
    category: "barber"
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate API registration lag
    setTimeout(() => {
      localStorage.setItem("trimly_b2b_authorized", "true");
      setSubmitting(false);
      setSuccess(true);
      
      // Redirect to pricing page after a short display of success
      setTimeout(() => {
        router.push("/tarifs");
      }, 1000);
    }, 1200);
  };

  const categories = [
    { value: "hairdresser", label: "Hairdresser" },
    { value: "barber", label: "Barber" },
    { value: "manicure", label: "Manicure" },
    { value: "beauty-salon", label: "Beauty Salon" },
  ];

  return (
    <div className="min-h-screen bg-canvas-soft flex items-center justify-center py-16 px-4 md:px-8 relative overflow-hidden">
      {/* Background blobs for premium glassmorphic depth */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-[1100px] w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Left Column: Premium Marketing Copy & Value Prop */}
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
              Join the UK's leading local booking directory. Unlock instant appointments, client deposits, and custom calendars tailored specifically to salon workflows.
            </p>
          </div>

          {/* Core B2B Features Grid */}
          <div className="space-y-4 pt-4 border-t border-ink/5">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-canvas border border-ink/10 flex items-center justify-center text-ink flex-shrink-0 shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-ink text-sm">30% Average Booking Increase</h4>
                <p className="text-xs text-mute-text">Listed directly on our interactive high-traffic customer marketplace search engine.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-canvas border border-ink/10 flex items-center justify-center text-ink flex-shrink-0 shadow-sm">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-ink text-sm">No-Show Protection</h4>
                <p className="text-xs text-mute-text">Require deposits or full pre-payment. Automated custom reminders via WhatsApp.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-canvas border border-ink/10 flex items-center justify-center text-ink flex-shrink-0 shadow-sm">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-ink text-sm">Cancel Anytime</h4>
                <p className="text-xs text-mute-text">Start with a 14-day free trial on all plans. Adjust, downgrade, or cancel directly.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Lead Form Card */}
        <div className="lg:col-span-7">
          <div className="bg-canvas border border-ink/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden">
            {success ? (
              <div className="py-16 text-center space-y-4 animate-fade-in">
                <div className="w-16 h-16 bg-positive-pale border border-positive/30 text-positive rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-ink">Details Registered!</h3>
                <p className="text-sm text-body-text max-w-xs mx-auto">
                  Authorizing access to premium subscriptions. Redirecting to plan configurations...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-ink tracking-tight">Register Your Business</h3>
                  <p className="text-xs text-mute-text mt-1 font-semibold">
                    Tell us about your salon to see custom pricing and activate your account.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Business Name */}
                  <div className="space-y-2">
                    <label htmlFor="businessName" className="text-[10px] font-bold uppercase tracking-wider text-body-text">
                      Business Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mute-text">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        id="businessName"
                        required
                        placeholder="e.g. Sharp & Co"
                        value={form.businessName}
                        onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                        className="w-full bg-canvas border border-ink/10 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-ink focus:outline-none focus:border-ink transition-colors shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Owner Name */}
                  <div className="space-y-2">
                    <label htmlFor="ownerName" className="text-[10px] font-bold uppercase tracking-wider text-body-text">
                      Owner Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mute-text">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        id="ownerName"
                        required
                        placeholder="e.g. John Doe"
                        value={form.ownerName}
                        onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                        className="w-full bg-canvas border border-ink/10 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-ink focus:outline-none focus:border-ink transition-colors shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-body-text">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mute-text">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        required
                        placeholder="owner@domain.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-canvas border border-ink/10 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-ink focus:outline-none focus:border-ink transition-colors shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-wider text-body-text">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mute-text">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        required
                        placeholder="e.g. +44 7700 900077"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full bg-canvas border border-ink/10 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-ink focus:outline-none focus:border-ink transition-colors shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-2">
                    <label htmlFor="category" className="text-[10px] font-bold uppercase tracking-wider text-body-text">
                      Primary Service Category
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mute-text z-10">
                        <Tag className="w-4 h-4" />
                      </div>
                      <select
                        id="category"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full bg-canvas border border-ink/10 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-ink focus:outline-none focus:border-ink transition-colors shadow-sm appearance-none cursor-pointer relative"
                      >
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value} className="text-ink">
                            {cat.label}
                          </option>
                        ))}
                      </select>
                      {/* Custom dropdown indicator */}
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-mute-text">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Staff Count */}
                  <div className="space-y-2">
                    <label htmlFor="staffCount" className="text-[10px] font-bold uppercase tracking-wider text-body-text">
                      Number of Stylists/Barbers
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mute-text">
                        <Users className="w-4 h-4" />
                      </div>
                      <input
                        type="number"
                        id="staffCount"
                        min="1"
                        max="100"
                        required
                        value={form.staffCount}
                        onChange={(e) => setForm({ ...form, staffCount: e.target.value })}
                        className="w-full bg-canvas border border-ink/10 rounded-xl py-3 pl-11 pr-4 text-sm font-semibold text-ink focus:outline-none focus:border-ink transition-colors shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 text-xs md:text-sm font-bold bg-ink text-white hover:bg-ink-hover py-4 rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-55"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Continue to Plans & Pricing</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
