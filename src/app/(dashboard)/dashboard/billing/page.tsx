"use client";

import React, { useState, useEffect } from "react";
import { useB2BAuth } from "@/components/providers";
import { api } from "@/lib/api";

export default function BillingPage() {
  const { role, shop, allBarbers } = useB2BAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [billingEnabled, setBillingEnabled] = useState(false);
  const [billingError, setBillingError] = useState("");

  const handleSubscribe = async (plan: "MONTHLY" | "YEARLY") => {
    setLoadingPlan(plan);
    setBillingError("");
    try {
      const res = await api.subscriptions.subscribe(plan);
      if (res.success && res.data.sessionUrl) {
        // Only follow a real Stripe Checkout URL returned by the server.
        if (!res.data.sessionUrl.startsWith("https://checkout.stripe.com/")) {
          setBillingError("Subscription checkout did not return a valid Stripe URL.");
          // Refuse unexpected local or placeholder redirects.
          return;
        }
        // Redirect to Stripe Checkout.
        window.location.href = res.data.sessionUrl;
      }
    } catch (err: unknown) {
      setBillingError(err instanceof Error ? err.message : "Subscription checkout is unavailable.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleBillingPortal = async () => {
    setLoadingPlan("PORTAL");
    setBillingError("");
    try {
      const res = await api.subscriptions.billingPortal();
      if (res.success && res.data.portalUrl.startsWith("https://billing.stripe.com/")) {
        window.location.href = res.data.portalUrl;
      } else {
        setBillingError("The billing portal did not return a valid Stripe URL.");
      }
    } catch (err: unknown) {
      setBillingError(err instanceof Error ? err.message : "The billing portal is unavailable.");
    } finally {
      setLoadingPlan(null);
    }
  };

  useEffect(() => {
    api.config
      .getPublic()
      .then((res) => setBillingEnabled(res.success && res.data.subscriptionBillingEnabled))
      .catch(() => setBillingEnabled(false));
  }, []);

  const activePlan = shop?.subscription?.plan || "NONE";

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

      </div>

      {!billingEnabled && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm font-semibold">
          Online subscription billing is not enabled yet. No plan or billing changes can be made until Stripe is configured.
        </div>
      )}

      {billingError && (
        <div className="bg-negative-bg/5 border border-negative/10 text-negative rounded-xl px-4 py-3 text-sm font-semibold">
          {billingError}
        </div>
      )}

      {/* Plan Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Active subscription card */}
        <div className="md:col-span-2 card-content border border-ink/5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-extrabold text-ink text-lg">Current Subscription</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                shop?.subscription?.status === "ACTIVE"
                  ? "bg-primary-pale text-positive-deep border border-primary/20"
                  : shop?.subscription?.status === "TRIALING"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-negative-bg text-white"
              }`}>
                {shop?.subscription?.status === "ACTIVE" ? "ACTIVE" : shop?.subscription?.status === "TRIALING" ? "FREE TRIAL" : "EXPIRED / UNPAID"}
              </span>
            </div>

            {shop?.subscription?.status === "ACTIVE" ? (
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-ink">
                    £{activePlan === "MONTHLY" ? "29.00" : activePlan === "YEARLY" ? "23.00" : "0.00"}
                  </span>
                  <span className="text-sm text-mute-text">/ month</span>
                </div>
                <p className="text-sm text-body-text">
                  <strong>{activePlan === "MONTHLY" ? "Growth Monthly" : activePlan === "YEARLY" ? "Growth Yearly" : "Plan"}</strong> — renews on{" "}
                  <strong>
                    {shop?.subscription?.currentPeriodEnd
                      ? new Date(shop.subscription.currentPeriodEnd).toLocaleDateString()
                      : "next billing date"}
                  </strong>.
                </p>
              </div>
            ) : shop?.subscription?.status === "TRIALING" ? (
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-ink">FREE</span>
                  <span className="text-sm text-mute-text">14-day trial</span>
                </div>
                <p className="text-sm text-body-text">
                  You are currently on a free trial.{" "}
                  {shop?.subscription?.trialEndsAt
                    ? <>Trial ends on <strong>{new Date(shop.subscription.trialEndsAt).toLocaleDateString()}</strong>. Subscribe below to keep access.</>
                    : "Subscribe to a plan below to unlock all features when your trial ends."}
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

          {shop?.subscription?.status === "ACTIVE" && (
            <div className="pt-6 border-t border-ink/5 mt-8 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleBillingPortal}
                disabled={!billingEnabled || loadingPlan !== null}
                className="button-tertiary text-center text-sm"
              >
                {loadingPlan === "PORTAL" ? "Opening..." : "Go to Stripe Customer Portal"}
              </button>
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

      {/* Upgrade/Subscribe Options (shown when not ACTIVE) */}
      {shop?.subscription?.status !== "ACTIVE" && (
        <div className="space-y-6">
          <h3 className="text-xl font-black text-ink">
            {shop?.subscription?.status === "TRIALING" ? "Activate a plan to keep your access:" : "Choose a subscription plan to unlock:"}
          </h3>
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
                disabled={!billingEnabled || loadingPlan !== null}
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
                disabled={!billingEnabled || loadingPlan !== null}
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
