import { BarberModel } from "@/lib/models/Barber";
import { ShopModel } from "@/lib/models/Shop";
import { normalizeTimeZone, type BusinessHoursLike } from "@/lib/booking-time";

export async function getBarberSchedule(clerkId: string) {
  const barber = await BarberModel.findOne({ clerkId }).lean();
  if (!barber) return null;

  const shop = barber.shopId ? await ShopModel.findById(barber.shopId).lean() : null;
  const shopHours = shop?.businessHours as BusinessHoursLike[] | undefined;
  const barberHours = barber.businessHours as BusinessHoursLike[] | undefined;
  const businessHours = shopHours?.length ? shopHours : barberHours?.length ? barberHours : undefined;
  const timeZone = normalizeTimeZone(shop?.timezone);

  return { barber, shop, businessHours, timeZone };
}
