import { Locale } from './i18n';
import { CITY_CONFIGS } from '@/pipeline/city-config';

export function getHomeUrl(locale: Locale): string {
  return `/${locale}`;
}

export function getSearchUrl(locale: Locale): string {
  if (locale === 'de') return '/de/moscheen';
  return `/${locale}/mosques`;
}

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
