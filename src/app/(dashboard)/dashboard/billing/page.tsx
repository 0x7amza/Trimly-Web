"use client";

import React, { useState } from "react";
import { useB2BAuth } from "@/components/providers";
import { mockDb, api } from "@/lib/api";

export default function BillingPage() {
  const { role, shop, allBarbers, refreshShopData } = useB2BAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Guard: Owner only page
  if (role !== "OWNER") {
    return (
      <div className="card-feature-sage p-12 text-center border border-ink/5 max-w-lg mx-auto mt-12">
        <div className="w-16 h-16 bg-negative-bg text-white rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">🚫</span>
        </div>
        <h3 className="text-2xl font-black text-ink mb-3">Access Restricted</h3>
        <p className="text-sm text-body-text">
          Only the salon owner has permissions to manage billing and subscriptions.
        </p>
      </div>
    );
  }

  const handleSubscribe = async (plan: "MONTHLY" | "YEARLY") => {
    setLoadingPlan(plan);
    try {
      // Call mock api which redirects or sets subscription active
      const res = await api.subscriptions.subscribe(plan);
      if (res.success) {
        // Toggle mock active
        const shops = mockDb.getShops();
        if (shops.length > 0) {
          shops[0].subscription = {
            plan,
            status: "ACTIVE",
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          };
          mockDb.setShops(shops);
        }
        await refreshShopData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleToggleSuspension = async () => {
    const shops = mockDb.getShops();
    if (shops.length > 0) {
      if (!shops[0].subscription) {
        shops[0].subscription = {
          plan: "MONTHLY",
          status: "EXPIRED",
          currentPeriodEnd: new Date().toISOString(),
        };
      }
      const active = shops[0].subscription.status === "ACTIVE";
      shops[0].subscription.status = active ? "EXPIRED" : "ACTIVE";
      mockDb.setShops(shops);
    }
    await refreshShopData();
  };

  const hasSubscription = shop && ["ACTIVE", "TRIALING"].includes(shop.subscription?.status || "");
  const activePlan = shop?.subscription?.plan || "NONE";

  return (
    <div className="flex flex-col h-full space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-ink">Billing & Plans</h1>
          <p className="text-sm text-body-text">
            Manage your subscription details, invoicing, and barber seat capacity.
          </p>
        </div>

        {/* Developer Sandbox Toggle */}
        <button
          onClick={handleToggleSuspension}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            hasSubscription
              ? "bg-negative-bg text-white border-negative"
              : "bg-primary text-ink border-ink/10"
          }`}
        >
          {hasSubscription ? "⚡ Simulate Expired Plan (Lock Dashboard)" : "⚡ Simulate Subscription Restoration"}
        </button>
      </div>

      {/* Plan Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Active subscription card */}
        <div className="md:col-span-2 card-content border border-ink/5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-ink text-lg">Current Subscription</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                hasSubscription
                  ? "bg-primary-pale text-positive-deep border border-primary/20"
                  : "bg-negative-bg text-white"
              }`}>
                {hasSubscription ? "ACTIVE" : "EXPIRED / UNPAID"}
              </span>
            </div>

            {hasSubscription ? (
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-ink">
                    £{activePlan === "MONTHLY" ? "29.00" : "23.00"}
                  </span>
                  <span className="text-sm text-mute-text">/ month</span>
                </div>
                <p className="text-sm text-body-text">
                  Your plan is active and will automatically renew on{" "}
                  <strong>
                    {shop?.subscription?.currentPeriodEnd
                      ? new Date(shop.subscription.currentPeriodEnd).toLocaleDateString()
                      : "next billing date"}
                  </strong>.
                </p>
              </div>
            ) : (
              <div className="bg-negative-bg/5 p-4 rounded-xl text-negative border border-negative/10 mb-6">
                <p className="text-sm font-semibold">
                  ⚠️ Your dashboard operations are locked. Please complete subscription setup below.
                </p>
              </div>
            )}
          </div>

          {hasSubscription && (
            <div className="pt-6 border-t border-ink/5 mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="https://billing.stripe.com/p/session/mocked_portal"
                target="_blank"
                rel="noreferrer"
                className="button-tertiary text-center text-sm"
              >
                Go to Stripe Customer Portal
              </a>
            </div>
          )}
        </div>

        {/* Barber seat capacity */}
        <div className="card-feature-sage flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-ink mb-4">Barber Seat Limits</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-body-text">Active seats used:</span>
                <span className="font-bold text-ink">{allBarbers.length} / {shop?.maxBarbersIncluded || 5}</span>
              </div>
              <div className="w-full bg-canvas rounded-full h-3 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${(allBarbers.length / (shop?.maxBarbersIncluded || 5)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="text-xs text-mute-text pt-4 border-t border-ink/5 mt-4">
            Seat limits are included in your standard plan. Extra seats can be unlocked for £3/barber/mo.
          </div>
        </div>
      </div>

      {/* Upgrade Options (shown when expired or none) */}
      {!hasSubscription && (
        <div className="space-y-6">
          <h3 className="text-xl font-black text-ink">Choose a subscription plan to unlock:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            {/* Monthly */}
            <div className="card-content border border-ink/5 flex flex-col justify-between h-[280px]">
              <div>
                <span className="badge-positive mb-3">Pay Monthly</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-black text-ink">£29.00</span>
                  <span className="text-xs font-bold text-mute-text">/ month</span>
                </div>
                <p className="text-sm text-body-text mt-3">
                  Cancel anytime. Standard platform features with standard support.
                </p>
              </div>
              <button
                onClick={() => handleSubscribe("MONTHLY")}
                className="button-primary w-full text-center"
                disabled={loadingPlan !== null}
              >
                {loadingPlan === "MONTHLY" ? "Processing..." : "Select Monthly"}
              </button>
            </div>

            {/* Yearly */}
            <div className="card-content border border-ink/5 flex flex-col justify-between h-[280px] bg-primary-pale border-primary/20">
              <div>
                <div className="flex justify-between items-center">
                  <span className="badge-positive bg-primary text-ink-deep font-bold">Pay Yearly</span>
                  <span className="text-xs font-bold text-positive-deep bg-white px-2 py-0.5 rounded">Save 20%</span>
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-black text-ink">£23.00</span>
                  <span className="text-xs font-bold text-mute-text">/ month equivalent</span>
                </div>
                <p className="text-sm text-body-text mt-3">
                  Billed annually at £276.00. Priority support and feature releases included.
                </p>
              </div>
              <button
                onClick={() => handleSubscribe("YEARLY")}
                className="button-primary w-full text-center"
                disabled={loadingPlan !== null}
              >
                {loadingPlan === "YEARLY" ? "Processing..." : "Select Yearly"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
