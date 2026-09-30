import { MosqueEntity } from './types';
import { getCityRegistryEntry } from './city-registry';

export interface CityLaunchGateResult {
  gate: string;
  passed: boolean;
  blocker: boolean;
  reason?: string;
  metric?: string | number;
}

export interface CityQualityReport {
  city: string;
  slug: string;
  evaluatedAt: string;
  status: 'BLOCKED' | 'NOT_READY' | 'READY_FOR_LAUNCH';
  passed: boolean;
  blockers: CityLaunchGateResult[];
  warnings: CityLaunchGateResult[];
  metrics: Record<string, number | string>;
  recommendation: string;
}

export const CITY_MIN_PUBLISHED_RECORDS = 5;

const VALID_LAT_MIN = 47;
const VALID_LAT_MAX = 55.5;
const VALID_LNG_MIN = 5.5;
const VALID_LNG_MAX = 15.5;

function isValidCoord(lat?: number | null, lng?: number | null): boolean {
  if (lat == null || lng == null) return false;
  return lat >= VALID_LAT_MIN && lat <= VALID_LAT_MAX && lng >= VALID_LNG_MIN && lng <= VALID_LNG_MAX;
}

export function validateCityForLaunch(
  citySlug: string,
  entities: MosqueEntity[]
): CityQualityReport {
  const registryEntry = getCityRegistryEntry(citySlug);
  const now = new Date().toISOString();
  
  const blockers: CityLaunchGateResult[] = [];
  const warnings: CityLaunchGateResult[] = [];
  const metrics: Record<string, number | string> = {};

  const publishableEntities = entities.filter(e => e.dataStatus === 'PUBLISHED' || e.dataStatus === 'REVIEWED' || e.dataStatus === 'NORMALIZED');
  const isPublishable = (e: MosqueEntity) => !['REJECTED', 'RAW'].includes(e.dataStatus || '');
  const publishable = entities.filter(isPublishable);
  const totalPublishable = publishable.length;

  metrics.totalEntities = entities.length;
  metrics.publishableEntities = totalPublishable;

  // GATE_A: City exists in registry with canonical name, slug, valid German state
  let gateAPassed = false;
  if (registryEntry && registryEntry.canonical && registryEntry.slug && registryEntry.state) {
    gateAPassed = true;
  }
  if (!gateAPassed) {
    blockers.push({ gate: 'GATE_A', passed: false, blocker: true, reason: 'City not in registry or missing core fields' });
  }

  // GATE_B: Published entities have valid Germany-bounded coords.
  const validCoordsCount = publishable.filter(e => isValidCoord(e.latitude, e.longitude)).length;
  const coordsPercent = totalPublishable > 0 ? validCoordsCount / totalPublishable : 0;
  metrics.coordsPercent = coordsPercent;
  
  if (totalPublishable > 0 && validCoordsCount === 0) {
    blockers.push({ gate: 'GATE_B', passed: false, blocker: true, reason: '0 publishable records have valid coordinates' });
  } else if (totalPublishable > 0 && coordsPercent < 0.8) {
    warnings.push({ gate: 'GATE_B', passed: false, blocker: false, reason: `< 80% records have valid coords (${Math.round(coordsPercent * 100)}%)`, metric: coordsPercent });
  }

  // GATE_C: Completeness
  const withPhone = publishable.filter(e => e.phone).length;
  const withWebsite = publishable.filter(e => e.website).length;
  const withAddress = publishable.filter(e => e.street && e.city).length;
  
  const noPhonePercent = totalPublishable > 0 ? (totalPublishable - withPhone) / totalPublishable : 1;
  const noWebsitePercent = totalPublishable > 0 ? (totalPublishable - withWebsite) / totalPublishable : 1;
  
  if (totalPublishable > 0 && withAddress === 0) {
    blockers.push({ gate: 'GATE_C', passed: false, blocker: true, reason: '0 publishable records have addresses' });
  } else {
    if (noPhonePercent > 0.5) warnings.push({ gate: 'GATE_C', passed: false, blocker: false, reason: '> 50% missing phone' });
    if (noWebsitePercent > 0.7) warnings.push({ gate: 'GATE_C', passed: false, blocker: false, reason: '> 70% missing website' });
  }

  // GATE_D: Categories — hard blocker only for genuinely non-Islamic entities (OTHER, e.g. clubs/sports)
  // COMMUNITY_CENTER and RELIGIOUS_ORGANIZATION are valid Islamic facility types — trigger warning not blocker
  const hardNonMosque = publishable.filter(
    (e) => e.category === 'OTHER'
  );
  const softNonMosque = publishable.filter(
    (e) =>
      e.category !== 'MOSQUE' &&
      e.category !== 'ISLAMIC_CENTER' &&
      e.category !== 'PRAYER_ROOM' &&
      e.category !== 'COMMUNITY_CENTER' &&
      e.category !== 'RELIGIOUS_ORGANIZATION'
  );
  const nonMosquePercent = totalPublishable > 0
    ? (hardNonMosque.length + softNonMosque.length) / totalPublishable
    : 0;

  if (hardNonMosque.length > 0) {
    blockers.push({
      gate: 'GATE_D',
      passed: false,
      blocker: true,
      reason: `Found ${hardNonMosque.length} non-Islamic entity (OTHER category) in publishable records`,
    });
  }
  if (nonMosquePercent > 0.1) {
    warnings.push({
      gate: 'GATE_D',
      passed: false,
      blocker: false,
      reason: `> 10% are non-mosque categories (${Math.round(nonMosquePercent * 100)}%)`,
    });
  }

  // GATE_E: No exact placeId duplicates
  const placeIds = publishable.map(e => e.placeId).filter(Boolean);
  const uniquePlaceIds = new Set(placeIds);
  if (placeIds.length > uniquePlaceIds.size) {
    blockers.push({ gate: 'GATE_E', passed: false, blocker: true, reason: 'Duplicate placeIds found in publishable records' });
  }

  // GATE_F: Minimum publishable records
  if (totalPublishable < CITY_MIN_PUBLISHED_RECORDS) {
    blockers.push({ gate: 'GATE_F', passed: false, blocker: true, reason: `${totalPublishable} publishable records (minimum required: ${CITY_MIN_PUBLISHED_RECORDS})`, metric: totalPublishable });
  }

  // GATE_G: Content quality
  const addressPercent = totalPublishable > 0 ? withAddress / totalPublishable : 0;
  if (addressPercent < 0.5) {
    blockers.push({ gate: 'GATE_G', passed: false, blocker: true, reason: '< 50% records have an address' });
  }
  if (totalPublishable > 0 && withPhone === 0 && withWebsite === 0) {
    blockers.push({ gate: 'GATE_G', passed: false, blocker: true, reason: 'No records have any phone or website' });
  }

  // GATE_H: valid slug and canonical
  if (registryEntry) {
    if (!/^[a-z0-9-]+$/.test(registryEntry.slug) || !registryEntry.canonical) {
      blockers.push({ gate: 'GATE_H', passed: false, blocker: true, reason: 'Invalid city slug or missing canonical name' });
    }
  }

  // GATE_I: Route patterns
  if (registryEntry) {
    if (!registryEntry.slug || !registryEntry.englishSlug) {
      blockers.push({ gate: 'GATE_I', passed: false, blocker: true, reason: 'Missing route slugs for EN/DE' });
    }
  }

  // GATE_J: Aliases
  if (registryEntry && (!registryEntry.aliases || registryEntry.aliases.length === 0)) {
    warnings.push({ gate: 'GATE_J', passed: false, blocker: false, reason: 'No aliases provided for search' });
  }

  let status: 'BLOCKED' | 'NOT_READY' | 'READY_FOR_LAUNCH' = 'READY_FOR_LAUNCH';
  let recommendation = 'City is ready for launch.';

  if (blockers.length > 0) {
    status = 'BLOCKED';
    recommendation = 'City has hard blockers that must be resolved before launch.';
  } else if (warnings.length > 0) {
    status = 'NOT_READY';
    recommendation = 'City has warnings. Please review before proceeding.';
  }

  return {
    city: registryEntry?.canonical || citySlug,
    slug: citySlug,
    evaluatedAt: now,
    status,
    passed: status === 'READY_FOR_LAUNCH',
    blockers,
    warnings,
    metrics,
    recommendation
  };
}
