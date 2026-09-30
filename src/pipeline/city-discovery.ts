import { CityRegistryEntry, CityLifecycleStatus } from './city-registry';

export interface DiscoveredCityInput {
  name: string;
  slug: string;
  englishSlug?: string;
  state: string;
  postalMin: number;
  postalMax: number;
  aliases?: string[];
  discoverySource: 'operator_entry' | 'postal_range_expansion' | 'osm_city_scan';
  discoveryNotes?: string;
}

/**
 * Creates a new CityRegistryEntry in the DISCOVERED lifecycle state.
 *
 * CRITICAL SAFETY RULES:
 * - status is ALWAYS 'DISCOVERED'
 * - publicationEnabled is ALWAYS false
 * - seoIndexable is ALWAYS false
 * - It CANNOT be published until explicit quality assessment and city gates pass.
 */
export function createDiscoveredCity(input: DiscoveredCityInput): CityRegistryEntry {
  const normalizedSlug = input.slug.toLowerCase().trim();
  const normalizedEnglishSlug = (input.englishSlug || input.slug).toLowerCase().trim();

  return {
    id: normalizedSlug,
    canonical: input.name.trim(),
    slug: normalizedSlug,
    englishSlug: normalizedEnglishSlug,
    nameEn: input.name.trim(),
    state: input.state.trim(),
    country: 'Germany',
    status: 'DISCOVERED' as CityLifecycleStatus,
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: input.postalMin,
    postalMax: input.postalMax,
    aliases: Array.from(
      new Set([
        input.name.trim(),
        normalizedSlug,
        ...(input.aliases || []).map((a) => a.trim()),
      ])
    ),
  };
}

/**
 * Validates whether a discovered city is eligible to transition from DISCOVERED to REVIEW.
 * Eligibility requires valid German postal range, valid state, and at least 1 raw candidate record.
 */
export function canTransitionToReview(
  city: CityRegistryEntry,
  rawCandidateCount: number
): { canTransition: boolean; reason?: string } {
  if (city.status !== 'DISCOVERED') {
    return { canTransition: false, reason: `City is in status ${city.status}, not DISCOVERED` };
  }
  if (!city.postalMin || !city.postalMax || city.postalMin > city.postalMax) {
    return { canTransition: false, reason: 'Invalid postal code range' };
  }
  if (!city.state) {
    return { canTransition: false, reason: 'Missing German Bundesland (state)' };
  }
  if (rawCandidateCount < 1) {
    return { canTransition: false, reason: 'Zero raw candidate records available for review' };
  }

  return { canTransition: true };
}
