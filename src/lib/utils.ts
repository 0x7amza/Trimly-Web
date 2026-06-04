import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEmbeddableMapUrl(url: string | undefined | null): string {
  if (!url) return "";
  let cleanUrl = url.trim();

  // 1. If it's an iframe, extract the src attribute
  if (cleanUrl.includes("<iframe")) {
    const match = cleanUrl.match(/src="([^"]+)"/);
    if (match && match[1]) {
      cleanUrl = match[1];
    }
  }

  // 2. If it's already embeddable, return it
  if (cleanUrl.includes("/maps/embed") || cleanUrl.includes("output=embed")) {
    return cleanUrl;
  }

  // 3. If it is a short link format (maps.app.goo.gl or goo.gl/maps),
  // return empty string since these will block iframe rendering due to X-Frame-Options
  // (unless resolved by the backend).
  if (cleanUrl.includes("maps.app.goo.gl") || cleanUrl.includes("goo.gl/maps")) {
    return "";
  }

  // 4. If it's a long place URL, e.g. /maps/place/Some+Place+Name/
  // Structure is typically: https://www.google.com/maps/place/PlaceName/
  const placeRegex = /\/maps\/place\/([^/]+)/;
  const placeMatch = cleanUrl.match(placeRegex);

  if (placeMatch && placeMatch[1]) {
    const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    return `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&output=embed`;
  }

  // 5. If it contains coordinates in the path, e.g. /maps/@lat,lng,z... or /place/PlaceName/@lat,lng,z
  const coordRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
  const coordMatch = cleanUrl.match(coordRegex);

  if (coordMatch && coordMatch[1] && coordMatch[2]) {
    const lat = coordMatch[1];
    const lng = coordMatch[2];
    return `https://maps.google.com/maps?q=${lat},${lng}&output=embed`;
  }

  // 6. Generic web pages or search queries
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    try {
      const parsed = new URL(cleanUrl);
      const q = parsed.searchParams.get("q");
      if (q) {
        return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
      }
    } catch {}
    
    if (cleanUrl.includes("google.com/maps")) {
      const separator = cleanUrl.includes("?") ? "&" : "?";
      return `${cleanUrl}${separator}output=embed`;
    }
  }

  // 7. If it's a plain address/search query (not a URL)
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://") && cleanUrl.length > 0) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(cleanUrl)}&output=embed`;
  }

  return cleanUrl;
}
