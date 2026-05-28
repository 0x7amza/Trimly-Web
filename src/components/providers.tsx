"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { api, Barber, Shop } from "@/lib/api";

interface B2BAuthContextType {
  activeBarber: Barber | null;
  shop: Shop | null;
  allBarbers: Barber[];
  role: "OWNER" | "BARBER";
  isLoading: boolean;
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

  const loadData = async () => {
    if (!isClerkLoaded || !user) return;
    setIsLoading(true);
    try {
      // Always use real Clerk identity
      const clerkEmail = user.primaryEmailAddress?.emailAddress ?? "";
      const clerkName = user.fullName || user.username || "Authenticated User";

      let inviteShopId: string | undefined = undefined;
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("inviteShopId");
        if (stored) inviteShopId = stored;
      }

      // Sync with backend — creates or updates the barber record
      const syncRes = await api.barbers.sync({
        name: clerkName,
        email: clerkEmail,
        shopId: inviteShopId,
      });

      if (syncRes.success) {
        setActiveBarber(syncRes.data);
        setRole(syncRes.data.role);
        if (typeof window !== "undefined") {
          localStorage.removeItem("inviteShopId");
        }
      }

      // Try to load shop data
      try {
        const shopRes = await api.shops.getMe();
        if (shopRes.success) {
          setShop(shopRes.data.shop);
          setAllBarbers(shopRes.data.barbers);
        }
      } catch {
        // New user — no shop yet, that's fine
        setShop(null);
        setAllBarbers([]);
      }
    } catch (err) {
      console.error("Error loading B2B auth data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isClerkLoaded && user) {
      loadData();
    } else if (isClerkLoaded && !user) {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClerkLoaded, user?.id]);

  const refreshShopData = async () => {
    try {
      const shopRes = await api.shops.getMe();
      if (shopRes.success) {
        setShop(shopRes.data.shop);
        setAllBarbers(shopRes.data.barbers);
      }
    } catch {
      // ignore
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
