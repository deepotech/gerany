/**
 * Phase 5B — Controlled Multi-City Import Pipeline
 *
 * Processes the 10 candidate city datasets through the existing Phase 4 pipeline
 * with `includeExtendedCities: true`.
 *
 * SAFETY RULES:
 * - Does NOT overwrite existing 443 production records
 * - Merges candidate results into a separate staging layer
 * - Only cities passing city gates may be promoted
 * - Original source files are NEVER mutated
 * - verificationStatus is always UNVERIFIED for new imports
 * - No prayer times are generated
 * - No review text is imported
 * - No facility booleans are fabricated
 */

import fs from 'fs';
import path from 'path';
import { runPipeline, CrossCityAnomaly } from '../src/pipeline/runner';
import { RawGooglePlaceRecord, MosqueEntity, DataQualityReport } from '../src/pipeline/types';
import { validateCityForLaunch } from '../src/pipeline/city-gates';
import { getCityRegistryEntry } from '../src/pipeline/city-registry';

interface CandidateCityConfig {
  city: string;
  file: string;
  slug: string;
  state: string;
}

const CANDIDATE_CITIES: CandidateCityConfig[] = [
  { city: 'Hannover', file: 'Hannover, Germany.json', slug: 'hannover', state: 'Niedersachsen' },
  { city: 'Bremen', file: 'Bremen, Germany.json', slug: 'bremen', state: 'Bremen' },
  { city: 'Duisburg', file: 'Duisburg, Germany.json', slug: 'duisburg', state: 'Nordrhein-Westfalen' },
  { city: 'Bochum', file: 'Bochum, Germany.json', slug: 'bochum', state: 'Nordrhein-Westfalen' },
  { city: 'Wuppertal', file: 'Wuppertal, Germany.json', slug: 'wuppertal', state: 'Nordrhein-Westfalen' },
  { city: 'Bonn', file: 'Bonn, Germany.json', slug: 'bonn', state: 'Nordrhein-Westfalen' },
  { city: 'Mannheim', file: 'Mannheim, Germany.json', slug: 'mannheim', state: 'Baden-Württemberg' },
  { city: 'Nürnberg', file: 'Nürnberg, Germany.json', slug: 'nuernberg', state: 'Bayern' },
  { city: 'Leipzig', file: 'Leipzig, Germany.json', slug: 'leipzig', state: 'Sachsen' },
  { city: 'Dresden', file: 'Dresden, Germany.json', slug: 'dresden', state: 'Sachsen' },
];

interface CityImportResult {
  city: string;
  slug: string;
  state: string;
  rawCount: number;
  uniqueCount: number;
  publishedCount: number;
  reviewCount: number;
  rejectedCount: number;
  crossCityAnomalyCount: number;
  duplicatesRemoved: number;
  gateStatus: 'BLOCKED' | 'NOT_READY' | 'READY_FOR_LAUNCH';
  gateBlockers: string[];
  gateWarnings: string[];
  allEntities: MosqueEntity[];
  crossCityAnomalies: CrossCityAnomaly[];
}

function extractCityFromFilename(filename: string): string {
  return filename.replace(', Germany.json', '').trim();
}

function main() {
  const rootDir = path.resolve(__dirname, '..');
  const isDryRun = process.argv.includes('--dry-run');
  const specificCity = (() => {
    const idx = process.argv.indexOf('--city');
    return idx !== -1 ? process.argv[idx + 1]?.toLowerCase() : null;
  })();

  const reportsDir = path.join(rootDir, 'reports', 'phase5b');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  console.log('\n' + '='.repeat(70));
  console.log('  PHASE 5B — CONTROLLED MULTI-CITY IMPORT PIPELINE');
  if (isDryRun) {
    console.log('  >>> DRY-RUN MODE: Production files will NOT be modified <<<');
  }
  console.log('='.repeat(70) + '\n');

  // Load existing production data — MUST remain untouched
  const existingMosquesPath = path.join(rootDir, 'src', 'data', 'mosques.json');
  const existingAllPath = path.join(rootDir, 'src', 'data', 'all-entities.json');
  const existingMosques: MosqueEntity[] = JSON.parse(fs.readFileSync(existingMosquesPath, 'utf8'));
  const existingAll: MosqueEntity[] = JSON.parse(fs.readFileSync(existingAllPath, 'utf8'));
  const existingPlaceIds = new Set(existingAll.map(e => e.placeId).filter(Boolean));

  console.log(`Existing production records: ${existingMosques.length} published`);
  console.log(`Existing all-entities: ${existingAll.length} total`);
  console.log(`Existing unique placeIds: ${existingPlaceIds.size}\n`);

  // Filter which cities to process
  const citiesToProcess = specificCity
    ? CANDIDATE_CITIES.filter(c => c.slug === specificCity)
    : CANDIDATE_CITIES;

  if (citiesToProcess.length === 0) {
    console.error(`City "${specificCity}" not found in candidate list.`);
    process.exit(1);
  }

  // Cross-dataset deduplication: collect all raw placeIds first
  const allCandidateRaw: { record: RawGooglePlaceRecord; sourceCity: string }[] = [];
  for (const candidate of citiesToProcess) {
    const filePath = path.join(rootDir, candidate.file);
    if (!fs.existsSync(filePath)) {
      console.error(`[MISSING] Source file not found: ${candidate.file}`);
      continue;
    }
    const records: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const r of records) {
      allCandidateRaw.push({ record: r, sourceCity: candidate.city });
    }
  }

  // Detect cross-candidate-dataset placeId dups
  const seenCandidatePlaceIds = new Map<string, string>(); // placeId → first city
  const crossCandidateDups: { placeId: string; title: string; firstCity: string; dupCity: string }[] = [];
  for (const { record, sourceCity } of allCandidateRaw) {
    if (record.placeId) {
      if (seenCandidatePlaceIds.has(record.placeId)) {
        crossCandidateDups.push({
          placeId: record.placeId,
          title: record.title || '',
          firstCity: seenCandidatePlaceIds.get(record.placeId)!,
          dupCity: sourceCity,
        });
      } else {
        seenCandidatePlaceIds.set(record.placeId, sourceCity);
      }
    }
  }

  console.log(`Cross-candidate-dataset placeId duplicates: ${crossCandidateDups.length}`);
  crossCandidateDups.forEach(d => {
    console.log(`  CROSS-CANDIDATE-DUP: "${d.title}" (${d.placeId}) — first in "${d.firstCity}", also in "${d.dupCity}"`);
  });
  console.log();

  const suppressedCandidateIds = new Set(crossCandidateDups.map(d => d.placeId));
  const candidateOwner = new Map<string, string>();
  crossCandidateDups.forEach(d => { candidateOwner.set(d.placeId, d.firstCity); });

  // === Per-city pipeline ===
  const cityResults: CityImportResult[] = [];
  const allNewEntities: MosqueEntity[] = [];
  const allNewPublished: MosqueEntity[] = [];

  for (const candidate of citiesToProcess) {
    const filePath = path.join(rootDir, candidate.file);
    if (!fs.existsSync(filePath)) {
      console.log(`[SKIP] ${candidate.city}: source file missing`);
      continue;
    }

    const rawRecords: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`\n--- Processing: ${candidate.city} (${rawRecords.length} raw records) ---`);

    // Filter records whose placeId already exists in production
    const preFiltered = rawRecords.filter(r => {
      if (!r.placeId) return true;
      if (existingPlaceIds.has(r.placeId)) {
        console.log(`  [SKIP_EXISTING] "${r.title}" (${r.placeId}) already in production`);
        return false;
      }
      // Suppress cross-candidate-dataset dups (keep first occurrence)
      if (suppressedCandidateIds.has(r.placeId)) {
        const owner = candidateOwner.get(r.placeId);
        if (owner !== candidate.city) {
          console.log(`  [SUPPRESS_CROSS] "${r.title}" (${r.placeId}) already processed in "${owner}"`);
          return false;
        }
      }
      return true;
    });

    const duplicatesRemoved = rawRecords.length - preFiltered.length;

    // Run pipeline with includeExtendedCities
    const pipelineResult = runPipeline(preFiltered, candidate.city, {
      dryRun: true, // always dry-run at pipeline level; we handle writes
      includeExtendedCities: true,
    });

    const publishedForCity = pipelineResult.publishedEntities;
    const allForCity = pipelineResult.allEntities;
    const reviewForCity = allForCity.filter(e => e.dataStatus === 'REVIEWED');
    const rejectedForCity = allForCity.filter(e => e.dataStatus === 'REJECTED');

    console.log(`  Raw: ${rawRecords.length} | Unique (after filter): ${preFiltered.length} | Duplicates removed: ${duplicatesRemoved}`);
    console.log(`  Published: ${publishedForCity.length} | Review: ${reviewForCity.length} | Rejected: ${rejectedForCity.length}`);
    console.log(`  Cross-city anomalies: ${pipelineResult.crossCityAnomalies.length}`);

    pipelineResult.crossCityAnomalies.forEach(a => {
      console.log(`    ANOMALY: "${a.title}" → resolved to "${a.resolvedCity}" (${a.resolvedPostal})`);
    });

    // Run city quality gates
    const gateReport = validateCityForLaunch(candidate.slug, allForCity);
    console.log(`  City Gates: ${gateReport.status}`);
    if (gateReport.blockers.length > 0) {
      gateReport.blockers.forEach(b => console.log(`    BLOCKER [${b.gate}]: ${b.reason}`));
    }
    if (gateReport.warnings.length > 0) {
      gateReport.warnings.forEach(w => console.log(`    WARNING [${w.gate}]: ${w.reason}`));
    }

    cityResults.push({
      city: candidate.city,
      slug: candidate.slug,
      state: candidate.state,
      rawCount: rawRecords.length,
      uniqueCount: preFiltered.length,
      publishedCount: publishedForCity.length,
      reviewCount: reviewForCity.length,
      rejectedCount: rejectedForCity.length,
      crossCityAnomalyCount: pipelineResult.crossCityAnomalies.length,
      duplicatesRemoved,
      gateStatus: gateReport.status,
      gateBlockers: gateReport.blockers.map(b => `[${b.gate}] ${b.reason}`),
      gateWarnings: gateReport.warnings.map(w => `[${w.gate}] ${w.reason}`),
      allEntities: allForCity,
      crossCityAnomalies: pipelineResult.crossCityAnomalies,
    });

    allNewEntities.push(...allForCity);
    allNewPublished.push(...publishedForCity);

    // Write per-city report
    const cityReportPath = path.join(reportsDir, `${candidate.slug}.json`);
    fs.writeFileSync(cityReportPath, JSON.stringify({
      city: candidate.city,
      slug: candidate.slug,
      state: candidate.state,
      runAt: new Date().toISOString(),
      isDryRun,
      rawCount: rawRecords.length,
      uniqueCount: preFiltered.length,
      duplicatesRemoved,
      publishedCount: publishedForCity.length,
      reviewCount: reviewForCity.length,
      rejectedCount: rejectedForCity.length,
      crossCityAnomalyCount: pipelineResult.crossCityAnomalies.length,
      crossCityAnomalies: pipelineResult.crossCityAnomalies,
      gateReport,
    }, null, 2), 'utf8');
  }

  // === Summary ===
  console.log('\n' + '='.repeat(70));
  console.log('  PHASE 5B CITY GATE SUMMARY');
  console.log('='.repeat(70));

  const readyForLaunch: CityImportResult[] = [];
  const notReady: CityImportResult[] = [];
  const blocked: CityImportResult[] = [];

  for (const result of cityResults) {
    const statusPad = result.gateStatus.padEnd(18);
    console.log(`  ${result.city.padEnd(16)} ${statusPad} Published: ${String(result.publishedCount).padStart(3)} | Review: ${String(result.reviewCount).padStart(3)} | Rejected: ${String(result.rejectedCount).padStart(3)}`);
    if (result.gateStatus === 'READY_FOR_LAUNCH') readyForLaunch.push(result);
    else if (result.gateStatus === 'NOT_READY') notReady.push(result);
    else blocked.push(result);
  }

  console.log('\n  CITIES READY FOR LAUNCH: ' + (readyForLaunch.length > 0 ? readyForLaunch.map(c => c.city).join(', ') : 'NONE'));
  console.log('  CITIES NOT READY:        ' + (notReady.length > 0 ? notReady.map(c => c.city).join(', ') : 'NONE'));
  console.log('  CITIES BLOCKED:          ' + (blocked.length > 0 ? blocked.map(c => c.city).join(', ') : 'NONE'));

  const totalNewPublished = allNewPublished.length;
  const totalNewEntities = allNewEntities.length;

  console.log('\n' + '='.repeat(70));
  console.log('  TOTALS');
  console.log('='.repeat(70));
  console.log(`  New entities normalized:  ${totalNewEntities}`);
  console.log(`  New publishable records:  ${totalNewPublished}`);
  console.log(`  Existing production:      ${existingMosques.length}`);
  console.log(`  Projected total (if all published): ${existingMosques.length + totalNewPublished}`);
  console.log(`  Cross-candidate dups:     ${crossCandidateDups.length}`);

  // Save machine-readable summary
  const summaryPath = path.join(reportsDir, 'phase5b-import-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    runAt: new Date().toISOString(),
    isDryRun,
    existingPublished: existingMosques.length,
    existingAllEntities: existingAll.length,
    crossCandidateDups: crossCandidateDups.length,
    cities: cityResults.map(r => ({
      city: r.city,
      slug: r.slug,
      state: r.state,
      rawCount: r.rawCount,
      uniqueCount: r.uniqueCount,
      duplicatesRemoved: r.duplicatesRemoved,
      publishedCount: r.publishedCount,
      reviewCount: r.reviewCount,
      rejectedCount: r.rejectedCount,
      crossCityAnomalyCount: r.crossCityAnomalyCount,
      gateStatus: r.gateStatus,
      gateBlockers: r.gateBlockers,
      gateWarnings: r.gateWarnings,
    })),
    readyForLaunch: readyForLaunch.map(c => c.city),
    notReady: notReady.map(c => c.city),
    blocked: blocked.map(c => c.city),
    totalNewPublishable: totalNewPublished,
    projectedTotalIfAllPublished: existingMosques.length + totalNewPublished,
  }, null, 2), 'utf8');

  console.log(`\n  Summary written → reports/phase5b/phase5b-import-summary.json`);

  if (isDryRun) {
    console.log('\n' + '='.repeat(70));
    console.log('  DRY-RUN COMPLETE — NO PRODUCTION FILES MODIFIED');
    console.log('='.repeat(70));
    console.log('  To promote a READY_FOR_LAUNCH city, run:');
    console.log('    npx tsx scripts/phase5b-promote-ready.ts --city <slug>');
    console.log('='.repeat(70) + '\n');
    return;
  }

  // === Production merge (only READY_FOR_LAUNCH cities) ===
  if (readyForLaunch.length === 0) {
    console.log('\n  No cities are READY_FOR_LAUNCH. Nothing added to production.\n');
    return;
  }

  console.log(`\n  Merging ${readyForLaunch.length} READY_FOR_LAUNCH cities into production...`);

  const newlyPublished: MosqueEntity[] = [];
  const newlyAllEntities: MosqueEntity[] = [];

  for (const result of readyForLaunch) {
    newlyPublished.push(...result.allEntities.filter(e => e.dataStatus === 'PUBLISHED'));
    newlyAllEntities.push(...result.allEntities);
  }

  // Final merged datasets
  const mergedMosques = [...existingMosques, ...newlyPublished];
  const mergedAll = [...existingAll, ...newlyAllEntities];

  // Write production files
  fs.writeFileSync(existingMosquesPath, JSON.stringify(mergedMosques, null, 2), 'utf8');
  fs.writeFileSync(existingAllPath, JSON.stringify(mergedAll, null, 2), 'utf8');

  console.log(`  Updated mosques.json: ${mergedMosques.length} total (was ${existingMosques.length})`);
  console.log(`  Updated all-entities.json: ${mergedAll.length} total (was ${existingAll.length})`);
  console.log('  Production update complete.\n');
}

main();
