import React from "react";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import CategoryLandingView from "./CategoryLandingView";
import SalonBookingPage from "./SalonBookingPage";

export default async function CategoryOrSalonPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const slug = categorySlug.toLowerCase();
  const CATEGORIES = ["hairdresser", "barber", "manicure", "beauty-salon"];

  if (CATEGORIES.includes(slug)) {
    return <CategoryLandingView categorySlug={slug} />;
  }

  // Utilizing Next.js Server Components to fetch data from GET /shops/{slug}
  let shopData = null;
  try {
    const res = await api.shops.getBySlug(categorySlug);
    if (res.success) {
      shopData = res.data;
    }
  } catch (err) {
    console.error("Error fetching shop server-side:", err);
  }

  if (!shopData) {
    notFound();
  }

  return <SalonBookingPage salonSlug={categorySlug} initialShopData={shopData} />;
}
