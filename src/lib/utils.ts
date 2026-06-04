import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeMapInput(input: string | undefined | null): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  
  // Security check: no javascript URLs or dangerous characters
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:")) {
    return null;
  }
  if (/<script/i.test(trimmed) || /on\w+\s*=/i.test(trimmed)) {
    return null;
  }
  if (trimmed.includes("<") && !trimmed.startsWith("<iframe")) {
    return null;
  }
  
  return trimmed;
}

export function extractGoogleMapsEmbedSrc(input: string | undefined | null): string | null {
  if (!input) return null;
  const sanitized = sanitizeMapInput(input);
  if (!sanitized) return null;

  if (sanitized.startsWith("<iframe")) {
    const match = sanitized.match(/src="([^"]+)"/);
    if (match && match[1]) {
      const src = match[1];
      try {
        const url = new URL(src);
        if (
          (url.protocol === "http:" || url.protocol === "https:") &&
          (url.hostname.endsWith("google.com") ||
            url.hostname.endsWith("google.co.uk") ||
            url.hostname.includes("google.co") ||
            url.hostname === "maps.google.com")
        ) {
          return src;
        }
      } catch {
        return null;
      }
    }
    return null;
  }

  return sanitized;
}

export function getGoogleMapsSearchUrl(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function getEmbeddableMapUrl(input: string | undefined | null, addressFallback?: string): string | null {
  const sanitized = sanitizeMapInput(input);
  
  let urlStr = sanitized;
  if (sanitized && sanitized.startsWith("<iframe")) {
    urlStr = extractGoogleMapsEmbedSrc(sanitized);
  }

  // If we have a valid URL string
  if (urlStr) {
    // If it's already an embed URL
    if (urlStr.includes("/maps/embed") || urlStr.includes("output=embed")) {
      return urlStr;
    }

    // Short links - maps.app.goo.gl or goo.gl/maps
    // Return null so frontend can show address fallback or wait for backend redirect resolution
    if (urlStr.includes("maps.app.goo.gl") || urlStr.includes("goo.gl/maps")) {
      if (addressFallback && addressFallback.trim()) {
        return `https://maps.google.com/maps?q=${encodeURIComponent(addressFallback.trim())}&output=embed`;
      }
      return null;
    }

    // Long place URLs, e.g. /maps/place/Some+Place+Name/
    const placeRegex = /\/maps\/place\/([^/]+)/;
    const placeMatch = urlStr.match(placeRegex);
    if (placeMatch && placeMatch[1]) {
      const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
      return `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&output=embed`;
    }

    // Coordinates in path, e.g. /maps/@lat,lng,z...
    const coordRegex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
    const coordMatch = urlStr.match(coordRegex);
    if (coordMatch && coordMatch[1] && coordMatch[2]) {
      const lat = coordMatch[1];
      const lng = coordMatch[2];
      return `https://maps.google.com/maps?q=${lat},${lng}&output=embed`;
    }

    // Check query params in a valid URL
    if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) {
      try {
        const parsed = new URL(urlStr);
        const q = parsed.searchParams.get("q");
        if (q) {
          return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
        }
      } catch {}

      if (urlStr.includes("google.com/maps")) {
        const separator = urlStr.includes("?") ? "&" : "?";
        return `${urlStr}${separator}output=embed`;
      }
    }

    // If it's not a URL, treat it as a search query
    if (!urlStr.startsWith("http://") && !urlStr.startsWith("https://") && urlStr.length > 0) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(urlStr)}&output=embed`;
    }
  }

  // Fallback to address query
  if (addressFallback && addressFallback.trim()) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(addressFallback.trim())}&output=embed`;
  }

  return null;
}
