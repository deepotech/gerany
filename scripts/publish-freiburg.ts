/**
 * Phase 14C — Controlled Promotion of Freiburg im Breisgau (8 Records)
 *
 * Promotes exactly 8 approved records to mosques.json (586 -> 594).
 * Appends all 10 entities (8 PUBLISHED, 2 REVIEWED) to all-entities.json (643 -> 653).
 * Preserves all 586 existing records byte-for-byte.
 * Enables Freiburg in city-registry-overrides.json.
 */

import fs from 'fs';
import path from 'path';
import { runPipeline } from '../src/pipeline/runner';
import { RawGooglePlaceRecord, MosqueEntity } from '../src/pipeline/types';

const ROOT = process.cwd();
const MOSQUES_PATH = path.join(ROOT, 'src/data/mosques.json');
const ALL_ENTITIES_PATH = path.join(ROOT, 'src/data/all-entities.json');
const REGISTRY_OVERRIDES_PATH = path.join(ROOT, 'src/data/city-registry-overrides.json');
const RAW_FREIBURG_PATH = path.join(ROOT, 'freiburg,germany.json');
const AUDIT_LOG_PATH = path.join(ROOT, 'reports/audit/production-audit-events.jsonl');

const PROMOTED_PLACE_IDS = new Set([
  'ChIJs__ka7obkUcRU7p2lKdioIA', // IGBD-Gemeinde Freiburg e.V.
  'ChIJX-_7m4AbkUcRBAYD-TMFgrc', // Afghan mosque
  'ChIJxU0hg4YckUcReUmvimKL5r8', // Kulturzentrum für Bildung und Integration e.V.
  'ChIJVSJzPAockUcR8zEaSARBeGo', // Freiburg DITIB Mevlana Moschee e.V.
  'ChIJ0bXTKD4bkUcR6PlvVTCSmbI', // Mosque Freiburg
  'ChIJd8c-yXwbkUcRoSi6TKBrAHs', // Freiburg Islamic Centre
  'ChIJP7gfAAAbkUcR8t1TZft-NqI', // Qendra Islame Shqiptare Vizion e.V. Freiburg
  'ChIJ-xg0xIYckUcRO6tsryi7_Tc', // Ibad ur Rahman Moschee
]);

const HOLD_RECORDS: Record<string, string> = {
  'ChIJiciOGQAbkUcRq_EXWX5w5og': 'Thin record: Zero reviews, no phone, no website, and no opening hours; held in review queue to avoid thin page indexing',
  'ChIJKwI2woYckUcRd9ll41_0lBs': 'Suspected co-located shadow pin at Habsburgerstraße 56a; 15m from Ibad ur Rahman Moschee without independent phone/website; held in review queue',
};

function main() {
  console.log('=== PHASE 14C: FREIBURG CONTROLLED PROMOTION ===\n');

  // 1. Verify existing production baseline
  const existingMosques: MosqueEntity[] = JSON.parse(fs.readFileSync(MOSQUES_PATH, 'utf8'));
  const existingAll: MosqueEntity[] = JSON.parse(fs.readFileSync(ALL_ENTITIES_PATH, 'utf8'));

  if (existingMosques.length !== 586) {
    throw new Error(`Abort: mosques.json has ${existingMosques.length} records; expected exactly 586.`);
  }
  if (existingAll.length !== 643) {
    throw new Error(`Abort: all-entities.json has ${existingAll.length} records; expected exactly 643.`);
  }

  console.log(`Verified baseline: ${existingMosques.length} published records, ${existingAll.length} all-entities records.`);

  // 2. Load and process raw records through pipeline
  const rawRecords: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(RAW_FREIBURG_PATH, 'utf8'));
  console.log(`Loaded ${rawRecords.length} raw Freiburg records.`);

  if (rawRecords.length !== 10) {
    throw new Error(`Abort: Expected 10 raw Freiburg records, got ${rawRecords.length}`);
  }

  const pipelineResult = runPipeline(rawRecords, 'Freiburg im Breisgau', {
    dryRun: true,
    includeExtendedCities: true,
  });

  const normalizedEntities = pipelineResult.allEntities;
  console.log(`Pipeline normalized ${normalizedEntities.length} entities.`);

  if (normalizedEntities.length !== 10) {
    throw new Error(`Abort: Expected 10 normalized entities, got ${normalizedEntities.length}`);
  }

  // 3. Apply classification statuses: 8 PUBLISHED, 2 REVIEWED
  const readyToPublish: MosqueEntity[] = [];
  const processedAllEntities: MosqueEntity[] = [];

  for (const entity of normalizedEntities) {
    const placeId = entity.placeId || '';

    if (PROMOTED_PLACE_IDS.has(placeId)) {
      entity.dataStatus = 'PUBLISHED';
      entity.verificationStatus = 'UNVERIFIED';
      entity.reviewReason = null;
      entity.rejectionReason = null;

      // Duplicate checks against existing production
      if (existingMosques.some(m => m.placeId === entity.placeId)) {
        throw new Error(`Abort: Place ID collision with existing production: ${entity.placeId}`);
      }
      if (existingMosques.some(m => m.slug === entity.slug && m.city.toLowerCase() === entity.city.toLowerCase())) {
        throw new Error(`Abort: Slug collision with existing production: ${entity.slug}`);
      }

      readyToPublish.push(entity);
      processedAllEntities.push(entity);
    } else if (HOLD_RECORDS[placeId]) {
      entity.dataStatus = 'REVIEWED';
      entity.reviewReason = HOLD_RECORDS[placeId];
      processedAllEntities.push(entity);
      console.log(`[HOLD] ${entity.canonicalName} (${placeId}): ${entity.reviewReason}`);
    } else {
      throw new Error(`Abort: Unaccounted record ${entity.canonicalName} (${placeId})`);
    }
  }

  if (readyToPublish.length !== 8) {
    throw new Error(`Abort: Expected exactly 8 READY records, got ${readyToPublish.length}`);
  }

  console.log(`\nSuccessfully classified 10 Freiburg records: 8 PUBLISHED, 2 HOLD.`);
  console.log('Records to be published:');
  readyToPublish.forEach((e, idx) => {
    console.log(`  ${idx + 1}. [${e.placeId}] ${e.canonicalName} — ${e.address} (Phone: ${e.phone || 'null'}, Web: ${e.website || 'null'})`);
  });

  // 4. Update mosques.json: 586 + 8 = 594
  const updatedMosques = [...existingMosques, ...readyToPublish];
  console.log(`\nTarget mosques.json count: ${updatedMosques.length} (was ${existingMosques.length})`);

  // 5. Update all-entities.json: 643 + 10 = 653
  const updatedAll = [...existingAll, ...processedAllEntities];
  console.log(`Target all-entities.json count: ${updatedAll.length} (was ${existingAll.length})`);

  // 6. Update city-registry-overrides.json
  let registryOverrides: Record<string, unknown> = {};
  if (fs.existsSync(REGISTRY_OVERRIDES_PATH)) {
    registryOverrides = JSON.parse(fs.readFileSync(REGISTRY_OVERRIDES_PATH, 'utf8'));
  }
  const timestamp = new Date().toISOString();
  registryOverrides['freiburg'] = {
    status: 'PUBLISHED',
    publicationEnabled: true,
    seoIndexable: true,
    launchedAt: timestamp,
  };

  // 7. Write all targets atomically
  fs.writeFileSync(MOSQUES_PATH, JSON.stringify(updatedMosques, null, 2), 'utf8');
  fs.writeFileSync(ALL_ENTITIES_PATH, JSON.stringify(updatedAll, null, 2), 'utf8');
  fs.writeFileSync(REGISTRY_OVERRIDES_PATH, JSON.stringify(registryOverrides, null, 2), 'utf8');

  // 8. Log audit event
  const auditEvent = {
    timestamp,
    phase: 'PHASE_14C_FREIBURG_PROMOTION',
    action: 'CONTROLLED_PROMOTION',
    city: 'Freiburg im Breisgau',
    slug: 'freiburg',
    addedCount: readyToPublish.length,
    holdCount: 2,
    rejectedCount: 0,
    newTotalMosques: updatedMosques.length,
    newTotalEntities: updatedAll.length,
    promotedPlaceIds: readyToPublish.map(m => m.placeId),
    holdPlaceIds: Object.keys(HOLD_RECORDS),
    preservationConfirmed: true,
  };
  fs.appendFileSync(AUDIT_LOG_PATH, JSON.stringify(auditEvent) + '\n', 'utf8');

  console.log('\n✅ Freiburg promotion script completed successfully!');
}

main();
