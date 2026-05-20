"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { api, mockDb, Barber, Shop } from "@/lib/api";

interface B2BAuthContextType {
  activeBarber: Barber | null;
  shop: Shop | null;
  allBarbers: Barber[];
  role: "OWNER" | "BARBER";
  isMockMode: boolean;
  isLoading: boolean;
  loginAs: (clerkId: string) => void;
  refreshShopData: () => Promise<void>;
  addMockBarber: (name: string, email: string) => void;
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
    if (!isClerkLoaded) return;
    setIsLoading(true);
    try {
      if (user) {
        // Sync logged-in Clerk user with our barbers database
        const syncRes = await api.barbers.sync({
          name: user.fullName || user.username || "Authenticated Barber",
          email: user.primaryEmailAddress?.emailAddress || "barber@example.com",
        });

        if (syncRes.success) {
          const syncedBarber = syncRes.data;
          
          // For high-fidelity testing: Map mock owner (user_john) to the logged in Clerk user
          const barbers = mockDb.getBarbers();
          const idx = barbers.findIndex(b => b.clerkId === "user_john" || b.clerkId === user.id);
          if (idx !== -1) {
            barbers[idx].clerkId = user.id;
            barbers[idx].name = syncedBarber.name;
            barbers[idx].email = syncedBarber.email;
            mockDb.setBarbers(barbers);
            
            // Set mock active user to this Clerk ID
            mockDb.setActiveUser({ clerkId: user.id, role: barbers[idx].role });
          }

          setActiveBarber({
            ...syncedBarber,
            clerkId: user.id,
          });
          setRole(syncedBarber.role);
        }
      }

      // Fetch shop details
      const shopRes = await api.shops.getMe();
      if (shopRes.success) {
        setShop(shopRes.data.shop);
        setAllBarbers(shopRes.data.barbers);
      }
    } catch (err) {
      console.error("Error loading B2B authentication data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isClerkLoaded) {
      loadData();
    }
  }, [isClerkLoaded, user]);

  const loginAs = (clerkId: string) => {
    const barbers = mockDb.getBarbers();
    const b = barbers.find(barb => barb.clerkId === clerkId);
    if (b) {
      mockDb.setActiveUser({ clerkId: b.clerkId, role: b.role });
      setActiveBarber(b);
      setRole(b.role);
      refreshShopData();
    }
  };

  const refreshShopData = async () => {
    const shopRes = await api.shops.getMe();
    if (shopRes.success) {
      setShop(shopRes.data.shop);
      setAllBarbers(shopRes.data.barbers);
    }
  };

  const addMockBarber = (name: string, email: string) => {
    api.shops.addBarber({ barberName: name, barberEmail: email }).then(() => {
      refreshShopData();
    });
  };

  return (
    <B2BAuthContext.Provider
      value={{
        activeBarber,
        shop,
        allBarbers,
        role,
        isMockMode: true,
        isLoading: isLoading || !isClerkLoaded,
        loginAs,
        refreshShopData,
        addMockBarber,
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
