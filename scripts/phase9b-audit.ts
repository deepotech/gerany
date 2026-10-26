/**
 * Phase 9B — 12-City Data Audit Script
 *
 * Runs the full pipeline in dry-run mode on each of the 12 new city raw files.
 * Does NOT write to mosques.json, all-entities.json, sitemap, or any public output.
 * Reports quality gates, record counts, cross-city anomalies, and placeId overlaps.
 */

import fs from 'fs';
import path from 'path';
import { runPipeline } from '../src/pipeline/runner';
import { evaluateQualityGates } from '../src/pipeline/gates';
import { MosqueEntity } from '../src/pipeline/types';

const ROOT = process.cwd();
const MOSQUES_FILE = path.join(ROOT, 'src', 'data', 'mosques.json');

// ── City definitions ──────────────────────────────────────────────────────────
interface CityDef {
  slug: string;
  canonical: string;
  file: string;
}

const CITIES: CityDef[] = [
  { slug: 'bielefeld',    canonical: 'Bielefeld',           file: 'bielefeld,germany.json'    },
  { slug: 'muenster',     canonical: 'Münster',             file: 'muenster,germany.json'     },
  { slug: 'karlsruhe',    canonical: 'Karlsruhe',           file: 'karlsruhe,germany.json'    },
  { slug: 'augsburg',     canonical: 'Augsburg',            file: 'augsburg,germany.json'     },
  { slug: 'aachen',       canonical: 'Aachen',              file: 'aachen,germany.json'       },
  { slug: 'mainz',        canonical: 'Mainz',               file: 'mainz,germany.json'        },
  { slug: 'wiesbaden',    canonical: 'Wiesbaden',           file: 'wiesbaden,germany.json'    },
  { slug: 'kiel',         canonical: 'Kiel',                file: 'kiel,germany.json'         },
  { slug: 'luebeck',      canonical: 'Lübeck',              file: 'luebeck,germany.json'      },
  { slug: 'saarbruecken', canonical: 'Saarbrücken',         file: 'saarbruecken,germany.json' },
  { slug: 'freiburg',     canonical: 'Freiburg im Breisgau',file: 'freiburg,germany.json'     },
  { slug: 'regensburg',   canonical: 'Regensburg',          file: 'regensburg,germany.json'   },
];

// ── Load production placeIds ─────────────────────────────────────────────────
const publishedMosques: MosqueEntity[] = JSON.parse(fs.readFileSync(MOSQUES_FILE, 'utf8'));
const productionPlaceIds = new Set(publishedMosques.map(m => m.placeId).filter(Boolean));
const productionByCity: Record<string, number> = {};
for (const m of publishedMosques) {
  productionByCity[m.city] = (productionByCity[m.city] || 0) + 1;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function countByStatus(entities: MosqueEntity[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of entities) {
    const s = e.dataStatus || 'UNKNOWN';
    counts[s] = (counts[s] || 0) + 1;
  }
  return counts;
}

function countByCategory(entities: MosqueEntity[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const e of entities) {
    const c = e.category || 'UNKNOWN';
    counts[c] = (counts[c] || 0) + 1;
  }
  return counts;
}

function outOfGermanyCoords(entities: MosqueEntity[]): MosqueEntity[] {
  // Germany bounding box: lat 47.2–55.1, lng 5.9–15.1
  return entities.filter(e => {
    if (!e.latitude || !e.longitude) return false;
    return e.latitude < 47.2 || e.latitude > 55.1 || e.longitude < 5.9 || e.longitude > 15.1;
  });
}

// Evaluate entity-level gates for all entities and summarise city-level stats
interface CityGateSummary {
  entitiesPassingAllGates: number;
  entitiesFailingAnyGate: number;
  gateFailCounts: Record<string, number>;
  gateWarnCounts: Record<string, number>;
}

function summariseGates(entities: MosqueEntity[]): CityGateSummary {
  const gateFailCounts: Record<string, number> = {};
  const gateWarnCounts: Record<string, number> = {};
  let passing = 0;
  let failing = 0;

  for (const entity of entities) {
    if (entity.dataStatus === 'REJECTED') {
      failing++;
      gateFailCounts['REJECTED_BY_CLASSIFY'] = (gateFailCounts['REJECTED_BY_CLASSIFY'] || 0) + 1;
      continue;
    }
    const result = evaluateQualityGates(entity);
    if (result.allPassed) {
      passing++;
    } else {
      failing++;
      for (const g of result.failedGates) {
        gateFailCounts[g] = (gateFailCounts[g] || 0) + 1;
      }
    }
    // Phone/website missing are warnings, not hard gate failures
    if (!entity.phone) gateWarnCounts['MISSING_PHONE'] = (gateWarnCounts['MISSING_PHONE'] || 0) + 1;
    if (!entity.website) gateWarnCounts['MISSING_WEBSITE'] = (gateWarnCounts['MISSING_WEBSITE'] || 0) + 1;
  }

  return { entitiesPassingAllGates: passing, entitiesFailingAnyGate: failing, gateFailCounts, gateWarnCounts };
}

// ── Main audit loop ──────────────────────────────────────────────────────────
interface CityResult {
  slug: string;
  canonical: string;
  fileFound: boolean;
  fileSizeBytes: number;
  rawCount: number;
  jsonValid: boolean;
  parseError?: string;
  normalizedCount: number;
  reviewedCount: number;    // REVIEWED
  publishedCount: number;   // PUBLISHED (from pipeline — should be 0 in dry-run)
  rejectedCount: number;    // REJECTED
  rawStatusCount: number;   // RAW (not yet normalized — edge case)
  normalizedStatusCount: number; // NORMALIZED
  statusBreakdown: Record<string, number>;
  categoryBreakdown: Record<string, number>;
  missingCoords: number;
  missingPhone: number;
  missingWebsite: number;
  outOfBoundsCoords: { placeId: string | null; title: string; lat: number; lng: number }[];
  crossCityAnomalies: number;
  crossCityDetails: { placeId: string | null; title: string; resolvedCity: string; address: string }[];
  productionOverlaps: string[];
  intraDatasetDuplicates: string[];
  interDatasetDuplicates: { placeId: string; otherCity: string }[];
  gateSummary: CityGateSummary;
  notes: string[];
}

const results: CityResult[] = [];

// Track all placeIds across datasets for inter-dataset duplicate detection
const seenAcrossCities = new Map<string, string>(); // placeId → city slug

for (const city of CITIES) {
  const filePath = path.join(ROOT, city.file);
  const result: CityResult = {
    slug: city.slug,
    canonical: city.canonical,
    fileFound: false,
    fileSizeBytes: 0,
    rawCount: 0,
    jsonValid: false,
    normalizedCount: 0,
    reviewedCount: 0,
    publishedCount: 0,
    rejectedCount: 0,
    rawStatusCount: 0,
    normalizedStatusCount: 0,
    statusBreakdown: {},
    categoryBreakdown: {},
    missingCoords: 0,
    missingPhone: 0,
    missingWebsite: 0,
    outOfBoundsCoords: [],
    crossCityAnomalies: 0,
    crossCityDetails: [],
    productionOverlaps: [],
    intraDatasetDuplicates: [],
    interDatasetDuplicates: [],
    gateSummary: { entitiesPassingAllGates: 0, entitiesFailingAnyGate: 0, gateFailCounts: {}, gateWarnCounts: {} },
    notes: [],
  };

  // ── File existence ─────────────────────────────────────────────────────────
  if (!fs.existsSync(filePath)) {
    result.notes.push(`ERROR: File not found at ${filePath}`);
    results.push(result);
    continue;
  }

  result.fileFound = true;
  result.fileSizeBytes = fs.statSync(filePath).size;

  // ── JSON parse ────────────────────────────────────────────────────────────
  let rawRecords: unknown[];
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    rawRecords = Array.isArray(parsed) ? parsed : [parsed];
    result.jsonValid = true;
    result.rawCount = rawRecords.length;
  } catch (e: unknown) {
    result.parseError = String(e);
    result.notes.push(`ERROR: JSON parse failed — ${result.parseError}`);
    results.push(result);
    continue;
  }

  // ── Intra-dataset duplicate placeId detection ─────────────────────────────
  const rawPlaceIds: string[] = [];
  for (const r of rawRecords as Record<string, unknown>[]) {
    if (r.placeId && typeof r.placeId === 'string') rawPlaceIds.push(r.placeId);
  }
  const placeIdCounts: Record<string, number> = {};
  for (const pid of rawPlaceIds) placeIdCounts[pid] = (placeIdCounts[pid] || 0) + 1;
  result.intraDatasetDuplicates = Object.entries(placeIdCounts)
    .filter(([, cnt]) => cnt > 1)
    .map(([pid]) => pid);

  // ── Inter-dataset duplicate detection ─────────────────────────────────────
  for (const pid of rawPlaceIds) {
    if (seenAcrossCities.has(pid)) {
      result.interDatasetDuplicates.push({ placeId: pid, otherCity: seenAcrossCities.get(pid)! });
    }
  }
  for (const pid of rawPlaceIds) {
    if (!seenAcrossCities.has(pid)) seenAcrossCities.set(pid, city.slug);
  }

  // ── Production placeId overlap ────────────────────────────────────────────
  for (const pid of rawPlaceIds) {
    if (productionPlaceIds.has(pid)) result.productionOverlaps.push(pid);
  }

  // ── Pipeline dry-run ──────────────────────────────────────────────────────
  let pipelineResult: ReturnType<typeof runPipeline> | null = null;
  try {
    pipelineResult = runPipeline(
      rawRecords as Parameters<typeof runPipeline>[0],
      city.canonical,
      { dryRun: true, includeExtendedCities: true }
    );
  } catch (e: unknown) {
    result.notes.push(`ERROR: Pipeline threw — ${String(e)}`);
    results.push(result);
    continue;
  }

  const { allEntities, crossCityAnomalies } = pipelineResult;

  result.normalizedCount    = allEntities.length;
  result.statusBreakdown    = countByStatus(allEntities);
  result.categoryBreakdown  = countByCategory(allEntities);

  result.reviewedCount          = allEntities.filter(e => e.dataStatus === 'REVIEWED').length;
  result.publishedCount         = allEntities.filter(e => e.dataStatus === 'PUBLISHED').length;
  result.rejectedCount          = allEntities.filter(e => e.dataStatus === 'REJECTED').length;
  result.rawStatusCount         = allEntities.filter(e => e.dataStatus === 'RAW').length;
  result.normalizedStatusCount  = allEntities.filter(e => e.dataStatus === 'NORMALIZED').length;

  result.missingCoords  = allEntities.filter(e => !e.latitude || !e.longitude).length;
  result.missingPhone   = allEntities.filter(e => !e.phone).length;
  result.missingWebsite = allEntities.filter(e => !e.website).length;

  const oob = outOfGermanyCoords(allEntities);
  result.outOfBoundsCoords = oob.map(e => ({
    placeId: e.placeId,
    title: e.canonicalName,
    lat: e.latitude!,
    lng: e.longitude!,
  }));

  result.crossCityAnomalies = crossCityAnomalies.length;
  result.crossCityDetails   = crossCityAnomalies.map(a => ({
    placeId: a.placeId,
    title: a.title,
    resolvedCity: a.resolvedCity,
    address: a.address,
  }));

  // ── Entity-level gate summary ─────────────────────────────────────────────
  result.gateSummary = summariseGates(allEntities);

  results.push(result);
}

// ── Console output ────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(80));
console.log('PHASE 9B — 12-CITY DATA AUDIT RESULTS');
console.log('='.repeat(80));
console.log(`Production baseline: ${publishedMosques.length} mosques across ${Object.keys(productionByCity).length} cities\n`);

for (const r of results) {
  console.log('-'.repeat(70));
  console.log(`CITY: ${r.canonical.toUpperCase()} (${r.slug})`);
  console.log(`  File found:   ${r.fileFound ? 'YES' : 'NO — MISSING'}  |  JSON valid: ${r.jsonValid}`);
  if (!r.fileFound || !r.jsonValid) {
    for (const n of r.notes) console.log(`  !! ${n}`);
    continue;
  }
  console.log(`  File size:    ${(r.fileSizeBytes / 1024).toFixed(1)} KB`);
  console.log(`  Raw records:  ${r.rawCount}  →  Normalized: ${r.normalizedCount}`);
  console.log(`  Status:  REVIEWED=${r.reviewedCount}  PUBLISHED=${r.publishedCount}  REJECTED=${r.rejectedCount}  NORMALIZED=${r.normalizedStatusCount}  RAW=${r.rawStatusCount}`);
  console.log(`  Categories:  ${JSON.stringify(r.categoryBreakdown)}`);
  console.log(`  Missing phone:    ${r.missingPhone}/${r.normalizedCount}`);
  console.log(`  Missing website:  ${r.missingWebsite}/${r.normalizedCount}`);
  console.log(`  Missing coords:   ${r.missingCoords}/${r.normalizedCount}`);
  if (r.outOfBoundsCoords.length > 0) {
    console.log(`  OUT-OF-BOUNDS COORDS (${r.outOfBoundsCoords.length}):`);
    for (const oob of r.outOfBoundsCoords) {
      console.log(`    !! "${oob.title}" (${oob.placeId})  lat=${oob.lat}  lng=${oob.lng}`);
    }
  }
  if (r.crossCityDetails.length > 0) {
    console.log(`  CROSS-CITY ANOMALIES (${r.crossCityAnomalies}):`);
    for (const cc of r.crossCityDetails) {
      console.log(`    >> "${cc.title}"  resolvedCity=${cc.resolvedCity}  addr="${cc.address}"`);
    }
  } else {
    console.log(`  Cross-city anomalies: 0`);
  }
  if (r.productionOverlaps.length > 0) {
    console.log(`  PRODUCTION OVERLAPS (${r.productionOverlaps.length}):`);
    for (const pid of r.productionOverlaps) console.log(`    OVERLAP: ${pid}`);
  } else {
    console.log(`  Production overlaps:  0`);
  }
  if (r.intraDatasetDuplicates.length > 0) {
    console.log(`  INTRA-DATASET DUPS (${r.intraDatasetDuplicates.length}):`);
    for (const pid of r.intraDatasetDuplicates) console.log(`    DUP: ${pid}`);
  }
  if (r.interDatasetDuplicates.length > 0) {
    console.log(`  INTER-DATASET DUPS (${r.interDatasetDuplicates.length}):`);
    for (const d of r.interDatasetDuplicates) {
      console.log(`    INTER-DUP: ${d.placeId}  (also in ${d.otherCity})`);
    }
  }
  const gs = r.gateSummary;
  console.log(`  Gate result:  PASSING=${gs.entitiesPassingAllGates}  FAILING=${gs.entitiesFailingAnyGate}`);
  if (Object.keys(gs.gateFailCounts).length > 0) {
    console.log(`    Gate failures: ${JSON.stringify(gs.gateFailCounts)}`);
  }
  if (Object.keys(gs.gateWarnCounts).length > 0) {
    console.log(`    Warnings:      ${JSON.stringify(gs.gateWarnCounts)}`);
  }
  for (const n of r.notes) console.log(`  NOTE: ${n}`);
}

// ── Grand totals ──────────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(80));
console.log('TOTALS ACROSS 12 NEW CITIES');
console.log('='.repeat(80));
const t = {
  raw:        results.reduce((s,r) => s + r.rawCount, 0),
  norm:       results.reduce((s,r) => s + r.normalizedCount, 0),
  reviewed:   results.reduce((s,r) => s + r.reviewedCount, 0),
  published:  results.reduce((s,r) => s + r.publishedCount, 0),
  rejected:   results.reduce((s,r) => s + r.rejectedCount, 0),
  misPhone:   results.reduce((s,r) => s + r.missingPhone, 0),
  misWeb:     results.reduce((s,r) => s + r.missingWebsite, 0),
  misCoords:  results.reduce((s,r) => s + r.missingCoords, 0),
  oob:        results.reduce((s,r) => s + r.outOfBoundsCoords.length, 0),
  crossCity:  results.reduce((s,r) => s + r.crossCityAnomalies, 0),
  prodOv:     results.reduce((s,r) => s + r.productionOverlaps.length, 0),
  interDup:   results.reduce((s,r) => s + r.interDatasetDuplicates.length, 0),
  gateFail:   results.reduce((s,r) => s + r.gateSummary.entitiesFailingAnyGate, 0),
  gatePass:   results.reduce((s,r) => s + r.gateSummary.entitiesPassingAllGates, 0),
};
console.log(`Raw records:         ${t.raw}`);
console.log(`Normalized:          ${t.norm}`);
console.log(`REVIEWED:            ${t.reviewed}`);
console.log(`PUBLISHED (dry-run): ${t.published}`);
console.log(`REJECTED:            ${t.rejected}`);
console.log(`Missing phone:       ${t.misPhone}`);
console.log(`Missing website:     ${t.misWeb}`);
console.log(`Missing coords:      ${t.misCoords}`);
console.log(`Out-of-bounds:       ${t.oob}`);
console.log(`Cross-city anomaly:  ${t.crossCity}`);
console.log(`Production overlaps: ${t.prodOv}`);
console.log(`Inter-dataset dups:  ${t.interDup}`);
console.log(`Gate PASSING:        ${t.gatePass}`);
console.log(`Gate FAILING:        ${t.gateFail}`);
console.log(`\nProduction mosques:  ${publishedMosques.length} (UNCHANGED — dry-run only)`);

// ── Write JSON results ────────────────────────────────────────────────────────
const jsonOutPath = path.join(ROOT, 'PHASE9B_AUDIT_RESULTS.json');
fs.writeFileSync(jsonOutPath, JSON.stringify({ generatedAt: new Date().toISOString(), productionCount: publishedMosques.length, results }, null, 2), 'utf8');
console.log(`\nJSON results → ${jsonOutPath}`);
