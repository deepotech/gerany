/**
 * City Configuration for Germany-Wide Multi-City Pipeline
 *
 * Each entry defines:
 *   - canonical: Official German city name (stored in DB, shown in UI)
 *   - slug: URL-safe Latin slug (used in routes)
 *   - englishSlug: English city slug for /en/ routes
 *   - state: Bundesland
 *   - postalMin/Max: postal code range for canonical city detection
 *   - aliases: other names that map to this city (Google Maps variants, English names, etc.)
 *
 * Rules:
 *   - canonical must be the official German city name
 *   - If a record's address/postal code maps to a DIFFERENT canonical city, it is flagged as a CROSS_CITY_ANOMALY
 *   - Organization/affiliation is NEVER inferred from city or name alone
 */

export interface CityConfig {
  canonical: string;
  slug: string;
  englishSlug: string;
  state: string;
  postalMin: number;
  postalMax: number;
  postalRanges?: Array<{ min: number; max: number }>;
  aliases: string[];
}

export const CITY_CONFIGS: CityConfig[] = [
  {
    canonical: 'Köln',
    slug: 'koeln',
    englishSlug: 'cologne',
    state: 'Nordrhein-Westfalen',
    postalMin: 50667,
    postalMax: 51149,
    aliases: ['koeln', 'cologne', 'Cologne', 'Köln'],
  },
  {
    canonical: 'Berlin',
    slug: 'berlin',
    englishSlug: 'berlin',
    state: 'Berlin',
    postalMin: 10115,
    postalMax: 14199,
    aliases: ['berlin', 'Berlin'],
  },
  {
    canonical: 'Hamburg',
    slug: 'hamburg',
    englishSlug: 'hamburg',
    state: 'Hamburg',
    postalMin: 20001,
    postalMax: 22999,
    aliases: ['hamburg', 'Hamburg'],
  },
  {
    canonical: 'München',
    slug: 'muenchen',
    englishSlug: 'munich',
    state: 'Bayern',
    postalMin: 80001,
    postalMax: 81999,
    aliases: ['muenchen', 'munich', 'Munich', 'München'],
  },
  {
    canonical: 'Frankfurt',
    slug: 'frankfurt',
    englishSlug: 'frankfurt',
    state: 'Hessen',
    postalMin: 60001,
    postalMax: 60599,
    postalRanges: [
      { min: 60001, max: 60599 },
      { min: 65901, max: 65936 }, // Frankfurt West (Höchst, Griesheim, Sindlingen, Unterliederbach, Zeilsheim)
    ],
    aliases: ['frankfurt', 'Frankfurt', 'Frankfurt am Main', 'Frankfurt Am Main'],
  },
  {
    canonical: 'Düsseldorf',
    slug: 'duesseldorf',
    englishSlug: 'duesseldorf',
    state: 'Nordrhein-Westfalen',
    postalMin: 40001,
    postalMax: 40629,
    aliases: ['duesseldorf', 'düsseldorf', 'Düsseldorf'],
  },
  {
    canonical: 'Stuttgart',
    slug: 'stuttgart',
    englishSlug: 'stuttgart',
    state: 'Baden-Württemberg',
    postalMin: 70001,
    postalMax: 70629,
    aliases: ['stuttgart', 'Stuttgart'],
  },
  {
    canonical: 'Dortmund',
    slug: 'dortmund',
    englishSlug: 'dortmund',
    state: 'Nordrhein-Westfalen',
    postalMin: 44001,
    postalMax: 44399,
    aliases: ['dortmund', 'Dortmund'],
  },
  {
    canonical: 'Essen',
    slug: 'essen',
    englishSlug: 'essen',
    state: 'Nordrhein-Westfalen',
    postalMin: 45001,
    postalMax: 45359,
    aliases: ['essen', 'Essen'],
  },
  {
    canonical: 'Wuppertal',
    slug: 'wuppertal',
    englishSlug: 'wuppertal',
    state: 'Nordrhein-Westfalen',
    postalMin: 42103,
    postalMax: 42399,
    aliases: ["wuppertal","Wuppertal"],
  },
  {
    canonical: 'Bonn',
    slug: 'bonn',
    englishSlug: 'bonn',
    state: 'Nordrhein-Westfalen',
    postalMin: 53111,
    postalMax: 53229,
    aliases: ["bonn","Bonn"],
  },
  {
    canonical: 'Bremen',
    slug: 'bremen',
    englishSlug: 'bremen',
    state: 'Bremen',
    postalMin: 28195,
    postalMax: 28779,
    aliases: ["bremen","Bremen"],
  },
  {
    canonical: 'Nürnberg',
    slug: 'nuernberg',
    englishSlug: 'nuremberg',
    state: 'Bayern',
    postalMin: 90402,
    postalMax: 90491,
    aliases: ["nuernberg","nürnberg","Nürnberg","Nuremberg"],
  },
  {
    canonical: 'Leipzig',
    slug: 'leipzig',
    englishSlug: 'leipzig',
    state: 'Sachsen',
    postalMin: 4001,
    postalMax: 4579,
    aliases: ["leipzig","Leipzig"],
  },
];

export const BASE_CITY_CONFIGS: CityConfig[] = CITY_CONFIGS;

export const EXTENDED_CITY_CONFIGS: CityConfig[] = [
  {
    canonical: 'Hannover',
    slug: 'hannover',
    englishSlug: 'hanover',
    state: 'Niedersachsen',
    postalMin: 30159,
    postalMax: 30669,
    aliases: ['hannover', 'Hanover', 'Hannover'],
  },
  {
    canonical: 'Bremen',
    slug: 'bremen',
    englishSlug: 'bremen',
    state: 'Bremen',
    postalMin: 28195,
    postalMax: 28779,
    aliases: ['bremen', 'Bremen'],
  },
  {
    canonical: 'Nürnberg',
    slug: 'nuernberg',
    englishSlug: 'nuremberg',
    state: 'Bayern',
    postalMin: 90402,
    postalMax: 90491,
    aliases: ['nuernberg', 'nürnberg', 'Nürnberg', 'Nuremberg'],
  },
  {
    canonical: 'Leipzig',
    slug: 'leipzig',
    englishSlug: 'leipzig',
    state: 'Sachsen',
    postalMin: 4001,   // 04001 as integer — covers all 04xxx Leipzig codes
    postalMax: 4579,   // 04579 as integer — full Leipzig metropolitan area
    aliases: ['leipzig', 'Leipzig'],
  },
  {
    canonical: 'Dresden',
    slug: 'dresden',
    englishSlug: 'dresden',
    state: 'Sachsen',
    postalMin: 1001,   // 01001 as integer — covers all 01xxx Dresden codes
    postalMax: 1477,   // 01477 as integer — full Dresden postal range
    aliases: ['dresden', 'Dresden'],
  },
  {
    canonical: 'Duisburg',
    slug: 'duisburg',
    englishSlug: 'duisburg',
    state: 'Nordrhein-Westfalen',
    postalMin: 47051,
    postalMax: 47279,
    aliases: ['duisburg', 'Duisburg'],
  },
  {
    canonical: 'Bochum',
    slug: 'bochum',
    englishSlug: 'bochum',
    state: 'Nordrhein-Westfalen',
    postalMin: 44787,
    postalMax: 44894,
    aliases: ['bochum', 'Bochum'],
  },
  {
    canonical: 'Wuppertal',
    slug: 'wuppertal',
    englishSlug: 'wuppertal',
    state: 'Nordrhein-Westfalen',
    postalMin: 42103,
    postalMax: 42399,
    aliases: ['wuppertal', 'Wuppertal'],
  },
  {
    canonical: 'Bonn',
    slug: 'bonn',
    englishSlug: 'bonn',
    state: 'Nordrhein-Westfalen',
    postalMin: 53111,
    postalMax: 53229,
    aliases: ['bonn', 'Bonn'],
  },
  {
    canonical: 'Mannheim',
    slug: 'mannheim',
    englishSlug: 'mannheim',
    state: 'Baden-Württemberg',
    postalMin: 68159,
    postalMax: 68309,
    aliases: ['mannheim', 'Mannheim'],
  },
];

let dynamicallyRegisteredConfigs: CityConfig[] = [];

export function registerCityConfig(config: CityConfig): void {
  const existing = dynamicallyRegisteredConfigs.find(
    (c) => c.canonical.toLowerCase() === config.canonical.toLowerCase() || c.slug === config.slug
  );
  if (!existing) {
    dynamicallyRegisteredConfigs.push(config);
  }
}

export function clearRegisteredCityConfigs(): void {
  dynamicallyRegisteredConfigs = [];
}

export function getAllCityConfigs(): CityConfig[] {
  return [...CITY_CONFIGS, ...dynamicallyRegisteredConfigs];
}


export const GERMAN_STATES = [
  'Baden-Württemberg',
  'Bayern',
  'Berlin',
  'Brandenburg',
  'Bremen',
  'Hamburg',
  'Hessen',
  'Mecklenburg-Vorpommern',
  'Niedersachsen',
  'Nordrhein-Westfalen',
  'Rheinland-Pfalz',
  'Saarland',
  'Sachsen',
  'Sachsen-Anhalt',
  'Schleswig-Holstein',
  'Thüringen',
] as const;


/**
 * City Page Indexability Threshold Rule:
 * A city collection page is indexable if:
 * 1. It belongs to a known canonical CityConfig
 * 2. It has at least 1 published mosque entity (satisfies quality threshold to prevent thin programmatic SEO)
 */
export function isCityIndexable(canonicalName: string, publishedCount: number): boolean {
  if (publishedCount < 1) return false;
  return CITY_CONFIGS.some((c) => c.canonical === canonicalName);
}


/**
 * Returns the canonical CityConfig for a given address, postal code, or city field.
 * Priority: postal code match > city alias match > null (flagged for review).
 */
export function resolveCanonicalCity(
  postalCode: string | null | undefined,
  cityField: string | null | undefined,
  sourceCity?: string,
  includeExtended?: boolean
): { config: CityConfig; isCrossCity: boolean } | null {
  const configsToSearch = includeExtended ? [...CITY_CONFIGS, ...EXTENDED_CITY_CONFIGS] : CITY_CONFIGS;
  const postal = parseInt(postalCode || '0', 10);

  // 1. Postal code is the most reliable signal
  if (postal > 0) {
    const byPostal = configsToSearch.find((c) => {
      if (c.postalRanges) {
        return c.postalRanges.some((r) => postal >= r.min && postal <= r.max);
      }
      return postal >= c.postalMin && postal <= c.postalMax;
    });
    if (byPostal) {
      // Check if this conflicts with the source dataset city
      const isCrossCity = sourceCity
        ? !byPostal.aliases.some(
            (a) => a.toLowerCase() === sourceCity.toLowerCase()
          ) &&
          byPostal.slug !== sourceCity.toLowerCase() &&
          byPostal.canonical.toLowerCase() !== sourceCity.toLowerCase()
        : false;
      return { config: byPostal, isCrossCity };
    }
    // Postal code is present but doesn't match any known city →
    // DO NOT fall back to source city — flag as unknown for review
    return null;
  }

  // 2. City field alias match (only when no postal code available)
  const cityStr = (cityField || '').trim();
  if (cityStr) {
    const byAlias = configsToSearch.find((c) =>
      c.aliases.some(
        (a) => a.toLowerCase() === cityStr.toLowerCase()
      )
    );
    if (byAlias) {
      return { config: byAlias, isCrossCity: false };
    }
  }

  // 3. Source city as last resort (only when no postal and no city field)
  if (sourceCity) {
    const bySrc = configsToSearch.find(
      (c) =>
        c.canonical.toLowerCase() === sourceCity.toLowerCase() ||
        c.slug === sourceCity.toLowerCase() ||
        c.aliases.some((a) => a.toLowerCase() === sourceCity.toLowerCase())
    );
    if (bySrc) {
      return { config: bySrc, isCrossCity: false };
    }
  }

  return null; // Unknown city — flag for review
}

/**
 * Returns the URL-safe city slug for public routes.
 * English routes use englishSlug; German and Arabic use slug.
 */
export function getCityRouteSlug(cityCanonical: string, locale: 'de' | 'en' | 'ar'): string {
  const config = CITY_CONFIGS.find(
    (c) => c.canonical === cityCanonical
  );
  if (!config) {
    // fallback: transliterate umlauts
    return cityCanonical
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-');
  }
  return locale === 'en' ? config.englishSlug : config.slug;
}

/**
 * Returns CityConfig[] for only PUBLISHED cities.
 * Uses the city registry as the source of truth.
 * Falls back to CITY_CONFIGS for backward compatibility.
 */
export function getPublishedCityConfigs(): CityConfig[] {
  // Avoid circular import — check registry by importing lazily
  // For Phase 5A: CITY_CONFIGS are all PUBLISHED, so return them directly.
  // When a new city is promoted, it gets added to CITY_CONFIGS as part of promotion.
  return CITY_CONFIGS;
}
