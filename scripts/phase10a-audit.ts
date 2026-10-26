/**
 * Phase 10A — Final Wiesbaden Pre-Publication Audit Script
 *
 * Strictly read-only: does not modify mosques.json, all-entities.json,
 * city-registry-overrides.json, sitemap, or raw data files.
 */

import fs from 'fs';
import path from 'path';
import { runPipeline } from '../src/pipeline/runner';
import { validateCityForLaunch } from '../src/pipeline/city-gates';
import { getCityRegistryEntry } from '../src/pipeline/city-registry';
import { CITY_CONFIGS, EXTENDED_CITY_CONFIGS } from '../src/pipeline/city-config';
import { MosqueEntity, RawGooglePlaceRecord } from '../src/pipeline/types';

const ROOT = process.cwd();

// 1. Baseline
const mosques: MosqueEntity[] = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/mosques.json'), 'utf8'));
const allEntities: MosqueEntity[] = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/all-entities.json'), 'utf8'));
const publishedCities = [...new Set(mosques.map(m => m.city))].sort();

console.log('================================================================');
console.log('PHASE 10A — WIESBADEN PRE-PUBLICATION AUDIT');
console.log('================================================================');
console.log(`Current published mosques: ${mosques.length}`);
console.log(`Current all-entities count: ${allEntities.length}`);
console.log(`Current published cities (${publishedCities.length}): ${publishedCities.join(', ')}`);

// Registry status
const registryEntry = getCityRegistryEntry('wiesbaden');
console.log(`Wiesbaden registry status: ${registryEntry?.status}`);
console.log(`Wiesbaden publicationEnabled: ${registryEntry?.publicationEnabled}`);
console.log(`Wiesbaden seoIndexable: ${registryEntry?.seoIndexable}`);

// 2. Raw Wiesbaden dataset
const rawFile = path.join(ROOT, 'wiesbaden,germany.json');
const rawRecords: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(rawFile, 'utf8'));
console.log(`Raw records in wiesbaden,germany.json: ${rawRecords.length}`);

// Run pipeline dry run
const pipelineResult = runPipeline(rawRecords, 'Wiesbaden', {
  dryRun: true,
  includeExtendedCities: true,
});

console.log(`\nPipeline output:`);
console.log(`  allEntities: ${pipelineResult.allEntities.length}`);
console.log(`  publishedEntities (dry-run): ${pipelineResult.publishedEntities.length}`);
console.log(`  crossCityAnomalies: ${pipelineResult.crossCityAnomalies.length}`);

// City launch gates
const cityReport = validateCityForLaunch('wiesbaden', pipelineResult.allEntities);
console.log(`\nCity Gates evaluation:`);
console.log(`  status: ${cityReport.status}`);
console.log(`  recommendation: ${cityReport.recommendation}`);
console.log(`  blockers: ${cityReport.blockers.length}`);
cityReport.blockers.forEach(b => console.log(`    - [${b.gate}] ${b.reason}`));
console.log(`  warnings: ${cityReport.warnings.length}`);
cityReport.warnings.forEach(w => console.log(`    - [${w.gate}] ${w.reason}`));

// Check duplicates against production
const prodPlaceIds = new Set(mosques.map(m => m.placeId).filter(Boolean));
const overlaps = rawRecords.filter(r => r.placeId && prodPlaceIds.has(r.placeId));
console.log(`Production placeId collisions: ${overlaps.length}`);

// Output summary for report
const auditOutput = {
  baseline: {
    publishedMosques: mosques.length,
    publishedCitiesCount: publishedCities.length,
    publishedCities,
    allEntitiesCount: allEntities.length,
    wiesbadenRegistryStatus: registryEntry?.status,
    wiesbadenPublicationEnabled: registryEntry?.publicationEnabled,
  },
  pipelineResult: {
    rawCount: rawRecords.length,
    normalizedCount: pipelineResult.allEntities.length,
    dryRunPublishedCount: pipelineResult.publishedEntities.length,
    crossCityAnomalies: pipelineResult.crossCityAnomalies,
  },
  cityReport,
  records: pipelineResult.allEntities.map((e, idx) => {
    const raw = rawRecords.find(r => r.placeId === e.placeId) || rawRecords[idx];
    return {
      index: idx + 1,
      id: e.id,
      slug: e.slug,
      placeId: e.placeId,
      canonicalName: e.canonicalName,
      rawTitle: raw?.title,
      address: e.address,
      street: e.street,
      postalCode: e.postalCode,
      city: e.city,
      latitude: e.latitude,
      longitude: e.longitude,
      category: e.category,
      dataStatus: e.dataStatus,
      phone: e.phone,
      website: e.website,
      reviewsCount: e.reviewCount,
      openingHoursCount: e.openingHours ? e.openingHours.length : 0,
      facilities: e.facilities,
    };
  }),
};

fs.writeFileSync(path.join(ROOT, 'PHASE10A_AUDIT_DATA.json'), JSON.stringify(auditOutput, null, 2));
console.log('\nAudit data written to PHASE10A_AUDIT_DATA.json');
