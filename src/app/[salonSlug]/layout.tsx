import React from "react";
import { api } from "@/lib/api";
import { notFound } from "next/navigation";

export default async function CategoryOrSalonLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ salonSlug: string }>;
}) {
  const { salonSlug } = await params;
  const slug = salonSlug.toLowerCase();
  
  const RESERVED_SLUGS = ["dashboard", "billing", "pricing", "api", "login", "admin", "settings", "register", "auth"];
  if (RESERVED_SLUGS.includes(slug)) {
    notFound();
  }

  // Marketplace Categories list
  const CATEGORIES = ["hairdresser", "barber", "manicure", "beauty-salon"];
  if (CATEGORIES.includes(slug)) {
    return <>{children}</>;
  }

  try {
    const res = await api.shops.getBySlug(salonSlug);
    if (!res.success) {
      notFound();
    }
  } catch (err) {
    notFound();
  }

  return <>{children}</>;
}

