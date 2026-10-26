import fs from 'fs';
import path from 'path';
import { runPipeline } from '../src/pipeline/runner';
import { getPublishedCityConfigs, CITY_CONFIGS, EXTENDED_CITY_CONFIGS } from '../src/pipeline/city-config';
import { getCityRegistryEntry } from '../src/pipeline/city-registry';
import { MosqueEntity, RawGooglePlaceRecord } from '../src/pipeline/types';

const ROOT = process.cwd();
const MOSQUES_FILE = path.join(ROOT, 'src', 'data', 'mosques.json');
const ALL_ENTITIES_FILE = path.join(ROOT, 'src', 'data', 'all-entities.json');

const publishedMosques: MosqueEntity[] = JSON.parse(fs.readFileSync(MOSQUES_FILE, 'utf8'));
const prodPlaceIds = new Set(publishedMosques.map(m => m.placeId).filter(Boolean) as string[]);

const candidateCities = [
  { slug: 'freiburg', canonical: 'Freiburg im Breisgau', file: 'freiburg,germany.json' },
  { slug: 'karlsruhe', canonical: 'Karlsruhe', file: 'karlsruhe,germany.json' },
  { slug: 'muenster', canonical: 'Münster', file: 'muenster,germany.json' },
  { slug: 'mainz', canonical: 'Mainz', file: 'mainz,germany.json' },
  { slug: 'bielefeld', canonical: 'Bielefeld', file: 'bielefeld,germany.json' },
  { slug: 'augsburg', canonical: 'Augsburg', file: 'augsburg,germany.json' },
  { slug: 'regensburg', canonical: 'Regensburg', file: 'regensburg,germany.json' },
  { slug: 'kiel', canonical: 'Kiel', file: 'kiel,germany.json' },
  { slug: 'duisburg', canonical: 'Duisburg', file: 'Duisburg, Germany.json' },
  { slug: 'hannover', canonical: 'Hannover', file: 'Hannover, Germany.json' },
];

interface CandidateAuditResult {
  slug: string;
  canonical: string;
  file: string;
  rawCount: number;
  duplicatePlaceIdInRaw: number;
  pipelineReady: number;
  pipelineHold: number;
  pipelineReject: number;
  prodOverlapCount: number;
  missingPhone: number;
  missingWebsite: number;
  missingHours: number;
  invalidCoords: number;
  sameAddressGroups: Array<{ address: string; names: string[]; placeIds: string[] }>;
  reviewReasons: Record<string, number>;
  rejectReasons: Record<string, number>;
  registryStatus: string;
  publicationEnabled: boolean;
  seoIndexable: boolean;
  inCityConfigs: boolean;
  inExtendedConfigs: boolean;
  notes: string[];
}

const results: CandidateAuditResult[] = [];

for (const cand of candidateCities) {
  const filePath = path.join(ROOT, cand.file);
  if (!fs.existsSync(filePath)) {
    console.log(`[${cand.canonical}] File not found: ${cand.file}`);
    continue;
  }

  const rawList: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const rawCount = rawList.length;

  const rawPlaceIds = rawList.map(r => r.placeId).filter(Boolean) as string[];
  const uniquePlaceIds = new Set(rawPlaceIds);
  const dupPlaceIdCount = rawPlaceIds.length - uniquePlaceIds.size;

  const prodOverlaps = rawPlaceIds.filter(pid => prodPlaceIds.has(pid));

  const pipeResult = runPipeline(rawList, cand.canonical, { dryRun: true, includeExtendedCities: true });

  let ready = 0;
  let hold = 0;
  let reject = 0;
  const reviewReasons: Record<string, number> = {};
  const rejectReasons: Record<string, number> = {};
  let missingPhone = 0;
  let missingWebsite = 0;
  let missingHours = 0;
  let invalidCoords = 0;

  for (const e of pipeResult.allEntities) {
    if (e.dataStatus === 'PUBLISHED') ready++;
    else if (e.dataStatus === 'REJECTED') {
      reject++;
      const r = e.rejectionReason || 'Unknown';
      rejectReasons[r] = (rejectReasons[r] || 0) + 1;
    } else {
      hold++;
      const r = e.reviewReason || 'Unknown';
      reviewReasons[r] = (reviewReasons[r] || 0) + 1;
    }

    if (!e.phone) missingPhone++;
    if (!e.website) missingWebsite++;
    if (!e.openingHours || Object.keys(e.openingHours).length === 0) missingHours++;
    if (!e.latitude || !e.longitude || e.latitude < 47.0 || e.latitude > 55.5 || e.longitude < 5.5 || e.longitude > 15.5) {
      invalidCoords++;
    }
  }

  // Address grouping
  const addrMap: Record<string, Array<{ name: string; placeId: string }>> = {};
  for (const e of pipeResult.allEntities) {
    const addr = (e.address || '').toLowerCase().trim();
    if (addr) {
      if (!addrMap[addr]) addrMap[addr] = [];
      addrMap[addr].push({ name: e.canonicalName, placeId: e.placeId || '' });
    }
  }
  const sameAddressGroups = Object.entries(addrMap)
    .filter(([_, list]) => list.length > 1)
    .map(([address, list]) => ({
      address,
      names: list.map(x => x.name),
      placeIds: list.map(x => x.placeId)
    }));

  const reg = getCityRegistryEntry(cand.slug);
  const inCityConfigs = CITY_CONFIGS.some(c => c.slug === cand.slug);
  const inExtendedConfigs = EXTENDED_CITY_CONFIGS.some(c => c.slug === cand.slug);

  const notes: string[] = [];
  // Specific notes per city
  if (cand.slug === 'freiburg') {
    notes.push('Near-ready candidate. 1 co-located pair at Hugstetter Str. 55 (different communities: DITIB vs Islamic Center).');
  } else if (cand.slug === 'karlsruhe') {
    notes.push('Medium candidate. Multiple cultural associations and community centers.');
  } else if (cand.slug === 'muenster') {
    notes.push('Includes university prayer room without permanent postal address.');
  } else if (cand.slug === 'mainz') {
    notes.push('Includes Türk Federasyonu Mainz Ülkü Ocağı (cultural/political clubhouse requiring HOLD).');
  } else if (cand.slug === 'bielefeld') {
    notes.push('Includes Afrikanische Islamische Kultur Verein (tagged corporate office but active prayer facility).');
  } else if (cand.slug === 'augsburg') {
    notes.push('Requires inspection of cultural association premises.');
  } else if (cand.slug === 'regensburg') {
    notes.push('Smaller city dataset with university / student prayer facilities.');
  } else if (cand.slug === 'kiel') {
    notes.push('Northern city, clean dataset with solid community mosques.');
  } else if (cand.slug === 'duisburg') {
    notes.push('Large dataset from initial ingestion batch. High volume, needs thorough deduplication.');
  } else if (cand.slug === 'hannover') {
    notes.push('Large dataset from initial ingestion batch. High volume, needs cross-city anomaly resolution.');
  }

  results.push({
    slug: cand.slug,
    canonical: cand.canonical,
    file: cand.file,
    rawCount,
    duplicatePlaceIdInRaw: dupPlaceIdCount,
    pipelineReady: ready,
    pipelineHold: hold,
    pipelineReject: reject,
    prodOverlapCount: prodOverlaps.length,
    missingPhone,
    missingWebsite,
    missingHours,
    invalidCoords,
    sameAddressGroups,
    reviewReasons,
    rejectReasons,
    registryStatus: reg?.status || 'NOT_FOUND',
    publicationEnabled: reg?.publicationEnabled ?? false,
    seoIndexable: reg?.seoIndexable ?? false,
    inCityConfigs,
    inExtendedConfigs,
    notes,
  });
}

fs.writeFileSync(path.join(ROOT, 'candidate_audit_results.json'), JSON.stringify(results, null, 2));
console.log('Successfully wrote candidate_audit_results.json');
