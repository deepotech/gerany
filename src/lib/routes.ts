import { Locale } from './i18n';
import { CITY_CONFIGS } from '@/pipeline/city-config';

export function getHomeUrl(locale: Locale): string {
  return `/${locale}`;
}

export function getSearchUrl(locale: Locale): string {
  if (locale === 'de') return '/de/moscheen';
  return `/${locale}/mosques`;
}

export function getImpressumUrl(locale: Locale): string {
  return `/${locale}/impressum`;
}

export function getDatenschutzUrl(locale: Locale): string {
  return `/${locale}/datenschutz`;
}

export function getAboutUrl(locale: Locale): string {
  return `/${locale}/about`;
}

export function getContactUrl(locale: Locale): string {
  return `/${locale}/contact`;
}

export const ARABIC_CITY_NAMES: Record<string, string> = {
  'Köln': 'كولونيا',
  'Berlin': 'برلين',
  'Hamburg': 'هامبورغ',
  'München': 'ميونيخ',
  'Frankfurt': 'فرانكفورت',
  'Düsseldorf': 'دوسلدورف',
  'Stuttgart': 'شتوتغارت',
  'Dortmund': 'دورتموند',
  'Essen': 'إيسن',
  'Bremen': 'بريمن',
  'Wuppertal': 'فوبيرتال',
  'Bonn': 'بون',
  'Nürnberg': 'نورنبرغ',
  'Leipzig': 'لايبزيغ',
  'Wiesbaden': 'فيسبادن',
  'Lübeck': 'لوبيك',
  'Aachen': 'آخن',
  'Saarbrücken': 'زاربروكن',
  'Freiburg im Breisgau': 'فرايبورغ إم برايسغاو',
  'Münster': 'مونستر',
};


/**
 * Returns the canonical URL for a city collection page.
 * English routes use the englishSlug; German and Arabic use the Latin slug.
 * e.g. Köln → /de/moscheen/koeln | /en/mosques/cologne | /ar/mosques/koeln
 */
export function getCityUrl(locale: Locale, cityCanonical: string): string {
  const config = CITY_CONFIGS.find(
    (c) =>
      c.canonical === cityCanonical ||
      c.aliases.some((a) => a.toLowerCase() === cityCanonical.toLowerCase()) ||
      c.slug === cityCanonical.toLowerCase()
  );

  if (!config) {
    // Fallback: transliterate umlauts
    const fallbackSlug = cityCanonical
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-');
    if (locale === 'de') return `/de/moscheen/${fallbackSlug}`;
    return `/${locale}/mosques/${fallbackSlug}`;
  }

  if (locale === 'de') return `/de/moscheen/${config.slug}`;
  if (locale === 'en') return `/en/mosques/${config.englishSlug}`;
  return `/ar/mosques/${config.slug}`;
}

/**
 * Returns the canonical URL for a mosque detail page.
 * English routes use englishSlug for city; German and Arabic use Latin slug.
 */
export function getMosqueUrl(locale: Locale, cityCanonical: string, slug: string): string {
  const config = CITY_CONFIGS.find(
    (c) =>
      c.canonical === cityCanonical ||
      c.aliases.some((a) => a.toLowerCase() === cityCanonical.toLowerCase()) ||
      c.slug === cityCanonical.toLowerCase()
  );

  if (!config) {
    const fallbackSlug = cityCanonical
      .toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-');
    if (locale === 'de') return `/de/moschee/${fallbackSlug}/${slug}`;
    return `/${locale}/mosque/${fallbackSlug}/${slug}`;
  }

  if (locale === 'de') return `/de/moschee/${config.slug}/${slug}`;
  if (locale === 'en') return `/en/mosque/${config.englishSlug}/${slug}`;
  return `/ar/mosque/${config.slug}/${slug}`;
}

/**
 * Normalizes a city URL param to a canonical city slug.
 * Handles: cologne→koeln, münchen→muenchen, etc.
 */
export function normalizeCitySlug(cityParam: string): string {
  const lower = cityParam.toLowerCase().trim();

  // Check direct slug match first
  const bySlug = CITY_CONFIGS.find(
    (c) => c.slug === lower || c.englishSlug === lower
  );
  if (bySlug) return bySlug.slug;

  // Check alias match (e.g. "Cologne" → "koeln")
  const byAlias = CITY_CONFIGS.find((c) =>
    c.aliases.some((a) => a.toLowerCase() === lower)
  );
  if (byAlias) return byAlias.slug;

  return lower;
}

/**
 * Returns the canonical city config for a given URL slug (either German or English).
 */
export function getCityConfigBySlug(cityUrlSlug: string) {
  const lower = cityUrlSlug.toLowerCase().trim();
  return (
    CITY_CONFIGS.find(
      (c) =>
        c.slug === lower ||
        c.englishSlug === lower ||
        c.aliases.some((a) => a.toLowerCase() === lower)
    ) || null
  );
}

/**
 * Safely resolves an unresolvable mosque slug that ends in an external citation-style digit [1-4].
 * ONLY returns a canonical URL if stripping exactly one trailing digit [1-4] matches
 * an active, published mosque in the given city.
 */
export async function resolveTrailingDigitMosqueUrl(
  locale: Locale,
  cityCanonical: string,
  unresolvedSlug: string,
  repo: { getByCityAndSlug: (city: string, slug: string) => Promise<{ slug: string; dataStatus?: string } | null> }
): Promise<string | null> {
  if (!/[1-4]$/.test(unresolvedSlug)) {
    return null;
  }
  const candidateSlug = unresolvedSlug.slice(0, -1);
  const candidate = await repo.getByCityAndSlug(cityCanonical, candidateSlug);
  if (candidate && candidate.dataStatus === 'PUBLISHED') {
    return getMosqueUrl(locale, cityCanonical, candidate.slug);
  }
  return null;
}

/**
 * Safely resolves an unresolvable city slug that ends in an external citation-style digit [1-4].
 * ONLY returns a canonical URL if stripping exactly one trailing digit [1-4] matches
 * a published city collection.
 */
export function resolveTrailingDigitCityUrl(
  locale: Locale,
  unresolvedCity: string
): string | null {
  if (!/[1-4]$/.test(unresolvedCity)) {
    return null;
  }
  const candidateCity = unresolvedCity.slice(0, -1);
  const normalized = normalizeCitySlug(candidateCity);
  const config = CITY_CONFIGS.find(
    (c) => c.slug === normalized || c.englishSlug === normalized || c.canonical.toLowerCase() === normalized
  );
  if (config) {
    return getCityUrl(locale, config.canonical);
  }
  return null;
}

/**
 * Safely resolves an unresolvable locale string that ends in a citation-style digit [1-4].
 * e.g. 'ar1' -> '/ar', 'de1' -> '/de'
 */
export function resolveTrailingDigitLocaleUrl(
  unresolvedLocale: string
): string | null {
  if (unresolvedLocale.length === 3 && /[1-4]$/.test(unresolvedLocale)) {
    const candidateLocale = unresolvedLocale.slice(0, 2) as Locale;
    if (candidateLocale === 'de' || candidateLocale === 'en' || candidateLocale === 'ar') {
      return `/${candidateLocale}`;
    }
  }
  return null;
}
