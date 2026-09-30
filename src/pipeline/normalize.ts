import { RawGooglePlaceRecord, MosqueFacilities } from './types';
import { resolveCanonicalCity, CityConfig } from './city-config';

// Köln-specific postal → district lookup (Phase 1 data; other cities use address parsing only)
const KOELN_POSTAL_TO_DISTRICT: Record<string, string> = {
  '50667': 'Innenstadt',
  '50670': 'Innenstadt',
  '50672': 'Innenstadt',
  '50674': 'Innenstadt',
  '50676': 'Innenstadt',
  '50677': 'Innenstadt',
  '50678': 'Innenstadt',
  '50679': 'Innenstadt',
  '50733': 'Nippes',
  '50735': 'Nippes',
  '50737': 'Nippes',
  '50739': 'Nippes',
  '50765': 'Chorweiler',
  '50767': 'Chorweiler',
  '50769': 'Chorweiler',
  '50823': 'Ehrenfeld',
  '50825': 'Ehrenfeld',
  '50827': 'Ehrenfeld',
  '50829': 'Ehrenfeld',
  '50858': 'Lindenthal',
  '50859': 'Lindenthal',
  '50931': 'Lindenthal',
  '50933': 'Lindenthal',
  '50935': 'Lindenthal',
  '50937': 'Lindenthal',
  '50968': 'Rodenkirchen',
  '50969': 'Rodenkirchen',
  '50996': 'Rodenkirchen',
  '50997': 'Rodenkirchen',
  '50999': 'Rodenkirchen',
  '51061': 'Mülheim',
  '51063': 'Mülheim',
  '51065': 'Mülheim',
  '51067': 'Mülheim',
  '51069': 'Mülheim',
  '51103': 'Kalk',
  '51105': 'Kalk',
  '51107': 'Kalk',
  '51109': 'Kalk',
  '51143': 'Porz',
  '51145': 'Porz',
  '51147': 'Porz',
  '51149': 'Porz',
};

const KOELN_KNOWN_DISTRICTS = [
  'Innenstadt',
  'Rodenkirchen',
  'Lindenthal',
  'Ehrenfeld',
  'Nippes',
  'Chorweiler',
  'Porz',
  'Kalk',
  'Mülheim',
];

export interface NormalizedAddress {
  street: string | null;
  postalCode: string;
  city: string;
  district: string | null;
  state: string;
  country: string;
  formattedAddress: string;
  /** True if the record's canonical city differs from the source dataset city */
  isCrossCity: boolean;
  /** The resolved city config, null if unknown */
  cityConfig: CityConfig | null;
}

/**
 * Parse and normalize the address for any German city.
 * Uses postal-code-based canonical city resolution (Phase 2A).
 * sourceCity is the city from the dataset filename (e.g. "Stuttgart")
 * to detect cross-city anomalies (e.g. Kornwestheim record in Stuttgart dataset).
 */
export function parseAddress(
  rawAddress?: string,
  rawPostal?: string | null,
  sourceCityHint?: string,
  includeExtended?: boolean
): NormalizedAddress {
  // 1. Extract postal code from address string or raw field
  const postalFromAddr = rawAddress?.match(/\b(\d{5})\b/)?.[1] ?? null;
  const postalCode = rawPostal || postalFromAddr || '';

  // 2. Extract street (first comma-segment)
  const parts = (rawAddress || '').split(',').map((p) => p.trim());
  const street = parts[0] || null;

  // 3. Resolve canonical city from postal / city field / source hint
  const rawCityField = null; // raw records don't have a reliable city field for some datasets
  const resolved = resolveCanonicalCity(postalCode, rawCityField, sourceCityHint, includeExtended);

  // 4. Fall back gracefully
  if (!resolved) {
    return {
      street,
      postalCode: postalCode || '00000',
      city: sourceCityHint || 'Unknown',
      district: null,
      state: 'Deutschland',
      country: 'Germany',
      formattedAddress: rawAddress || `${sourceCityHint || 'Germany'}`,
      isCrossCity: false,
      cityConfig: null,
    };
  }

  const { config, isCrossCity } = resolved;
  const city = config.canonical;
  const state = config.state;

  // 5. Detect district
  let district: string | null = null;

  if (city === 'Köln') {
    // Use Köln-specific district detection
    const koelnDistrictMatch = rawAddress?.match(/Köln-([A-Za-zÄÖÜäöüß]+)/i);
    if (koelnDistrictMatch) {
      const rawMatch = koelnDistrictMatch[1];
      const found = KOELN_KNOWN_DISTRICTS.find(
        (d) => d.toLowerCase() === rawMatch.toLowerCase()
      );
      district = found || rawMatch;
    }

    if (!district) {
      for (const d of KOELN_KNOWN_DISTRICTS) {
        if (new RegExp(`\\b${d}\\b`, 'i').test(rawAddress || '')) {
          district = d;
          break;
        }
      }
    }

    if (!district && postalCode && KOELN_POSTAL_TO_DISTRICT[postalCode]) {
      district = KOELN_POSTAL_TO_DISTRICT[postalCode];
    }
  } else {
    // Generic district detection: look for "CityName-DistrictName" or "CityName Stadtbezirk" patterns
    // e.g. "Düsseldorf-Stadtbezirk 1" → strip it; "Hamburg-Wandsbek" → "Wandsbek"
    // Also detect locatedIn-style suburb indicators embedded in address
    const cityDistrictMatch = rawAddress?.match(
      new RegExp(`${escapeRegExp(city)}-([A-Za-zÄÖÜäöüß\\s]+?)(?:,|$)`, 'i')
    );
    if (cityDistrictMatch) {
      const rawDistrict = cityDistrictMatch[1].trim();
      // Filter out "Stadtbezirk N" — these are administrative zone labels, not useful as district names
      if (!/^stadtbezirk\s+\d/i.test(rawDistrict) && rawDistrict.length > 2) {
        district = rawDistrict;
      }
    }

    // Also check the second address segment for suburb names (e.g. "Wandsbek" in Hamburg)
    if (!district && parts.length >= 2) {
      const seg2 = parts[1].trim();
      // If seg2 looks like a district (not a postal+city pair)
      if (!/\d{5}/.test(seg2) && seg2.length > 2 && !seg2.toLowerCase().includes(city.toLowerCase())) {
        district = seg2;
      }
    }
  }

  const formattedAddress = `${street || ''}, ${postalCode} ${city}${
    district ? ` (${district})` : ''
  }, Germany`.replace(/^,\s*/, '');

  return {
    street,
    postalCode: postalCode || '',
    city,
    district,
    state,
    country: 'Germany',
    formattedAddress,
    isCrossCity,
    cityConfig: config,
  };
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Strict Organization Affiliation Rule:
 * NEVER infer organization affiliation solely from the mosque title/name!
 * Affiliation is ONLY established if verified by an official domain, website or external federation register.
 */
export function detectOrganization(title: string, website?: string | null): string | null {
  if (!website) return null; // Never infer solely from title if no verified website/domain exists

  const web = website.toLowerCase();
  try {
    const host = new URL(web).hostname.toLowerCase();
    if (host.includes('ditib.de') || host.includes('ditib-') || host.includes('-ditib') || host.includes('ditibcenter')) {
      return 'DITIB';
    }
    if (host.includes('vikz.de')) {
      return 'VIKZ';
    }
    if (host.includes('ahmadiyya.de')) {
      return 'AMJ';
    }
    if (host.includes('igmg.org') || host.includes('igmg.de')) {
      return 'IGMG';
    }
    if (host.includes('atib.org') || host.includes('atib.de')) {
      return 'ATIB';
    }
  } catch {
    // If not a valid URL, do not infer
    return null;
  }

  return null;
}

export function extractFacilities(raw: RawGooglePlaceRecord): MosqueFacilities {
  const info = raw.additionalInfo || {};
  let parking: boolean | null = null;
  let wheelchairAccessible: boolean | null = null;
  let restroom: boolean | null = null;
  let womenArea: boolean | null = null;
  let wudu: boolean | null = null;

  // Check Accessibility
  if (info['Accessibility']) {
    for (const item of info['Accessibility']) {
      if (
        item['Wheelchair accessible entrance'] ||
        item['Wheelchair accessible restroom'] ||
        item['Wheelchair accessible parking lot']
      ) {
        wheelchairAccessible = true;
      }
    }
  }

  // Check Amenities
  if (info['Amenities']) {
    for (const item of info['Amenities']) {
      if (item['Restroom']) {
        restroom = true;
      }
    }
  }

  // Check Parking
  if (info['Parking']) {
    for (const item of info['Parking']) {
      if (
        item['Free parking lot'] ||
        item['Free street parking'] ||
        item['On-site parking'] ||
        item['Wheelchair accessible parking lot']
      ) {
        parking = true;
      }
    }
  }

  // Strictly do NOT invent missing facilities - only set if explicit in data
  return {
    parking,
    womenArea,
    wheelchairAccessible,
    restroom,
    wudu,
    other: null,
  };
}

export function calculateRating(raw: RawGooglePlaceRecord): { rating: number | null; reviewCount: number } {
  if (raw.totalScore && typeof raw.totalScore === 'number') {
    return { rating: Math.round(raw.totalScore * 10) / 10, reviewCount: raw.reviewsCount || 0 };
  }
  if (raw.rating && typeof raw.rating === 'number') {
    return { rating: Math.round(raw.rating * 10) / 10, reviewCount: raw.reviewsCount || 0 };
  }

  if (raw.reviewsDistribution && raw.reviewsCount && raw.reviewsCount > 0) {
    const dist = raw.reviewsDistribution;
    const weightedSum =
      dist.oneStar * 1 +
      dist.twoStar * 2 +
      dist.threeStar * 3 +
      dist.fourStar * 4 +
      dist.fiveStar * 5;
    const avg = weightedSum / raw.reviewsCount;
    return { rating: Math.round(avg * 10) / 10, reviewCount: raw.reviewsCount };
  }

  return { rating: null, reviewCount: raw.reviewsCount || 0 };
}

export function normalizeMosqueName(rawTitle?: string | null): {
  canonicalName: string;
  rawTitle: string | null;
} {
  const raw = rawTitle ? String(rawTitle) : null;
  if (!raw || raw.trim().length === 0) {
    return { canonicalName: 'Moschee', rawTitle: raw };
  }

  // Preserve German characters (ä, ö, ü, ß) while normalizing whitespace and odd Unicode spaces
  const cleaned = raw
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width spaces
    .replace(/\s+/g, ' ') // collapse multi-spaces
    .trim();

  return { canonicalName: cleaned, rawTitle: raw };
}

export function validateCoordinatesQuality(
  lat?: number | null,
  lng?: number | null
): {
  isValid: boolean;
  isGermanyBounds: boolean;
  latitude: number;
  longitude: number;
  reason?: string;
} {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return {
      isValid: false,
      isGermanyBounds: false,
      latitude: 0,
      longitude: 0,
      reason: 'MISSING_COORDINATES: Coordinates are null or undefined',
    };
  }

  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return {
      isValid: false,
      isGermanyBounds: false,
      latitude: 0,
      longitude: 0,
      reason: 'INVALID_COORDINATES_TYPE: Coordinates are not valid numbers',
    };
  }

  if (lat === 0 && lng === 0) {
    return {
      isValid: false,
      isGermanyBounds: false,
      latitude: 0,
      longitude: 0,
      reason: 'ZERO_COORDINATES: Coordinates are identical to (0, 0)',
    };
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return {
      isValid: false,
      isGermanyBounds: false,
      latitude: lat,
      longitude: lng,
      reason: `OUT_OF_WORLD_BOUNDS: lat ${lat} or lng ${lng} is invalid`,
    };
  }

  // Strict Germany bounding box (lat ~47.0 to 55.5, lng ~5.5 to 15.5)
  const isGermany = lat >= 47.0 && lat <= 55.5 && lng >= 5.5 && lng <= 15.5;

  return {
    isValid: true,
    isGermanyBounds: isGermany,
    latitude: lat,
    longitude: lng,
    reason: isGermany ? undefined : `OUTSIDE_GERMANY_BOUNDS: lat ${lat}, lng ${lng} falls outside Germany`,
  };
}

export function normalizePhone(phone?: string | null): {
  normalized: string | null;
  raw: string | null;
  isValid: boolean;
  isSuspicious: boolean;
} {
  const raw = phone ? String(phone).trim() : null;
  if (!raw || raw.length === 0) {
    return { normalized: null, raw: null, isValid: true, isSuspicious: false };
  }

  // Strip common formatting artifacts
  let digitsOnly = raw.replace(/[^\d+]/g, '');

  // Handle German prefixes:
  // 0049... -> +49...
  if (digitsOnly.startsWith('0049')) {
    digitsOnly = '+49' + digitsOnly.slice(4);
  } else if (digitsOnly.startsWith('+49')) {
    // already +49
  } else if (digitsOnly.startsWith('0') && digitsOnly.length >= 8) {
    // Local German number (e.g. 030 123456) -> +49 30 123456
    digitsOnly = '+49' + digitsOnly.slice(1);
  }

  const numericCount = digitsOnly.replace(/\D/g, '').length;
  // A plausible German phone number has between 7 and 15 digits
  const isValid = numericCount >= 7 && numericCount <= 15;
  const isSuspicious = !isValid && numericCount > 0;

  return {
    normalized: isValid ? digitsOnly : raw,
    raw,
    isValid,
    isSuspicious,
  };
}

export function sanitizePhone(phone?: string | null): string | null {
  const res = normalizePhone(phone);
  return res.isValid ? res.normalized : res.raw;
}

export function normalizeWebsite(website?: string | null): {
  normalized: string | null;
  raw: string | null;
  isValid: boolean;
  hostname: string | null;
} {
  const raw = website ? String(website).trim() : null;
  if (!raw || raw.length === 0) {
    return { normalized: null, raw: null, isValid: true, hostname: null };
  }

  let formatted = raw;
  if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
    formatted = `https://${formatted}`;
  }

  try {
    const u = new URL(formatted);
    // Strip common tracking and marketing parameters
    u.searchParams.delete('utm_source');
    u.searchParams.delete('utm_medium');
    u.searchParams.delete('utm_campaign');
    u.searchParams.delete('utm_term');
    u.searchParams.delete('utm_content');
    u.searchParams.delete('fbclid');
    u.searchParams.delete('gclid');

    // Remove trailing slash
    let cleanUrl = u.toString().replace(/\/+$/, '');

    return {
      normalized: cleanUrl,
      raw,
      isValid: Boolean(u.hostname && u.hostname.includes('.')),
      hostname: u.hostname.toLowerCase(),
    };
  } catch {
    return {
      normalized: raw,
      raw,
      isValid: false,
      hostname: null,
    };
  }
}

export function sanitizeWebsite(website?: string | null): string | null {
  const res = normalizeWebsite(website);
  return res.normalized;
}

export function normalizeOpeningHours(
  hours?: Array<{ day: string; hours: string }> | null
): {
  normalized: Array<{ day: string; hours: string }> | null;
  isValid: boolean;
} {
  if (!hours || !Array.isArray(hours) || hours.length === 0) {
    return { normalized: null, isValid: true };
  }

  const validEntries = hours.filter(
    (h) => h && typeof h.day === 'string' && typeof h.hours === 'string' && h.day.trim().length > 0
  );

  if (validEntries.length === 0) {
    return { normalized: null, isValid: false };
  }

  return {
    normalized: validEntries.map((h) => ({ day: h.day.trim(), hours: h.hours.trim() })),
    isValid: true,
  };
}

