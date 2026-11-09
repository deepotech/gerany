import { CITY_CONFIGS, CityConfig } from '@/pipeline/city-config';

export type CitySeoTier = 'Tier 1' | 'Tier 2' | 'Tier 3';

export interface CityTierInfo {
  canonical: string;
  slug: string;
  englishSlug: string;
  state: string;
  tier: CitySeoTier;
  tierLabel: string;
  minMosqueThreshold: number;
  isIndexable: boolean;
  priority: number;
}

/**
 * City-level SEO Eligibility Policy for Germany
 *
 * Unlike the US project which handles hundreds of single-entity rural towns,
 * Germany's dataset consists of 20 strictly curated German cities, every single
 * one having >= 6 verified mosques, verified addresses, and established search demand.
 *
 * Tiers:
 * - Tier 1 (Metropolitan Hubs): >= 30 mosques OR >= 150 GSC impressions.
 *   Primary internal linking hubs and high-volume search landing pages.
 * - Tier 2 (Major Regional Centers): 10–29 mosques OR 20–149 GSC impressions.
 *   Dense regional directories with high verified contact/hours rates.
 * - Tier 3 (Emerging / Niche Regional Centers): 6–9 mosques with verified factual data.
 *   High content uniqueness and local geographic relevance.
 *
 * Strict Rule: Never automatically noindex a city that has genuine verified
 * entities and local relevance. All 20 published German cities qualify for indexation.
 */
export const MIN_MOSQUES_FOR_INDEXATION = 3;

/**
 * Known GSC impressions baseline (export 2026-11-09) for tier classification.
 */
export const GSC_CITY_IMPRESSIONS: Record<string, number> = {
  Berlin: 406,
  Hamburg: 258,
  Dortmund: 153,
  Leipzig: 119,
  Bremen: 76,
  Wuppertal: 71,
  Essen: 68,
  Stuttgart: 57,
  Münster: 55,
  Düsseldorf: 51,
  Nürnberg: 50,
  München: 46,
  Bonn: 38,
  Frankfurt: 34,
  Saarbrücken: 30,
  Aachen: 22,
  Freiburg: 20,
  'Freiburg im Breisgau': 20,
  Lübeck: 15,
  Wiesbaden: 6,
  Köln: 4,
};

export function isCityEligibleForSeo(mosqueCount: number): boolean {
  return mosqueCount >= MIN_MOSQUES_FOR_INDEXATION;
}

export function getCityTier(
  cityCanonical: string,
  mosqueCount: number,
  gscImpressions?: number
): CityTierInfo {
  const config = CITY_CONFIGS.find((c) => c.canonical === cityCanonical);
  const slug = config ? config.slug : cityCanonical.toLowerCase();
  const englishSlug = config ? config.englishSlug : cityCanonical.toLowerCase();
  const state = config ? config.state : 'Deutschland';

  const impressions = gscImpressions ?? GSC_CITY_IMPRESSIONS[cityCanonical] ?? 0;

  let tier: CitySeoTier = 'Tier 3';
  let tierLabel = 'Emerging Regional Center';
  let priority = 0.7;

  if (mosqueCount >= 30 || impressions >= 150) {
    tier = 'Tier 1';
    tierLabel = 'Metropolitan Mosque Hub';
    priority = 0.9;
  } else if (mosqueCount >= 10 || impressions >= 20) {
    tier = 'Tier 2';
    tierLabel = 'Major Regional Center';
    priority = 0.8;
  }

  return {
    canonical: cityCanonical,
    slug,
    englishSlug,
    state,
    tier,
    tierLabel,
    minMosqueThreshold: MIN_MOSQUES_FOR_INDEXATION,
    isIndexable: isCityEligibleForSeo(mosqueCount),
    priority,
  };
}
