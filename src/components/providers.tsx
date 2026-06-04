"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { api, Barber, Shop } from "@/lib/api";

interface B2BAuthContextType {
  activeBarber: Barber | null;
  shop: Shop | null;
  allBarbers: Barber[];
  role: "OWNER" | "BARBER";
  isLoading: boolean;
  /** Non-null when the initial sync failed — safe to display to the user */
  syncError: string | null;
  /** Call to retry after a sync error */
  retrySync: () => void;
  refreshShopData: () => Promise<void>;
}

const B2BAuthContext = createContext<B2BAuthContextType | undefined>(undefined);

export function B2BProviders({ children }: { children: React.ReactNode }) {
  const { user, isLoaded: isClerkLoaded } = useUser();
  const [activeBarber, setActiveBarber] = useState<Barber | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [allBarbers, setAllBarbers] = useState<Barber[]>([]);
  const [role, setRole] = useState<"OWNER" | "BARBER">("OWNER");
  const [isLoading, setIsLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!isClerkLoaded || !user) return;

    setIsLoading(true);
    setSyncError(null);

    try {
      // Always use real Clerk identity — never fabricate or cache these values
      const clerkEmail = user.primaryEmailAddress?.emailAddress ?? "";
      const clerkName  = user.fullName || user.username || "Authenticated User";

      // Read pending invite from localStorage (set by /for-professionals page)
      let inviteShopId: string | undefined = undefined;
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("inviteShopId");
        if (stored && stored.trim()) inviteShopId = stored.trim();
      }

      // Sync with backend — creates or updates the barber record
      const syncRes = await api.barbers.sync({
        name:   clerkName,
        email:  clerkEmail,
        ...(inviteShopId ? { shopId: inviteShopId } : {}),
      });

      if (syncRes.success) {
        setActiveBarber(syncRes.data);
        setRole(syncRes.data.role);
        // Only clear the invite token after a confirmed successful sync
        if (typeof window !== "undefined") {
          localStorage.removeItem("inviteShopId");
        }
      }

      // Try to load shop data — failing here is not fatal (new user has no shop yet)
      try {
        const shopRes = await api.shops.getMe();
        if (shopRes.success) {
          setShop(shopRes.data.shop);
          setAllBarbers(shopRes.data.barbers);
        }
      } catch {
        // New user — no shop yet. This is expected and not an error state.
        setShop(null);
        setAllBarbers([]);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while loading your workspace.";
      console.error("[B2BProviders] Sync error:", err);
      setSyncError(message);
      // Do NOT set activeBarber or shop — preserve null state so the UI can
      // show a proper error rather than an empty/broken dashboard.
    } finally {
      setIsLoading(false);
    }
  }, [isClerkLoaded, user]);

  useEffect(() => {
    if (isClerkLoaded && user) {
      void loadData(); // eslint-disable-line react-hooks/set-state-in-effect
    } else if (isClerkLoaded && !user) {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClerkLoaded, user?.id]);

  const retrySync = useCallback(() => {
    if (isClerkLoaded && user) {
      loadData();
    }
  }, [isClerkLoaded, user, loadData]);

  const refreshShopData = async () => {
    try {
      const shopRes = await api.shops.getMe();
      if (shopRes.success) {
        setShop(shopRes.data.shop);
        setAllBarbers(shopRes.data.barbers);
      }
    } catch {
      // ignore — shop fetch failure should not crash the dashboard
    }
  };

  return (
    <B2BAuthContext.Provider
      value={{
        activeBarber,
        shop,
        allBarbers,
        role,
        isLoading: isLoading || !isClerkLoaded,
        syncError,
        retrySync,
        refreshShopData,
      }}
    >
      {children}
    </B2BAuthContext.Provider>
  );
}

export function useB2BAuth() {
  const context = useContext(B2BAuthContext);
  if (!context) {
    throw new Error("useB2BAuth must be used within B2BProviders");
  }
  return context;
}
