/**
 * Phase 11B — Controlled Promotion of Lübeck (7 Audited Records)
 *
 * Promotes exactly 7 records to mosques.json (559 -> 566).
 * Preserves all 559 existing records byte-for-byte.
 * Enables Lübeck in city-registry-overrides.json.
 */

import fs from 'fs';
import path from 'path';
import { runPipeline } from '../src/pipeline/runner';
import { RawGooglePlaceRecord, MosqueEntity } from '../src/pipeline/types';

const ROOT = process.cwd();
const MOSQUES_PATH = path.join(ROOT, 'src/data/mosques.json');
const ALL_ENTITIES_PATH = path.join(ROOT, 'src/data/all-entities.json');
const REGISTRY_OVERRIDES_PATH = path.join(ROOT, 'src/data/city-registry-overrides.json');
const RAW_LUEBECK_PATH = path.join(ROOT, 'luebeck,germany.json');
const AUDIT_LOG_PATH = path.join(ROOT, 'reports/audit/production-audit-events.jsonl');

function main() {
  console.log('=== PHASE 11B: LÜBECK CONTROLLED PROMOTION ===\n');

  // 1. Verify existing production baseline
  const existingMosques: MosqueEntity[] = JSON.parse(fs.readFileSync(MOSQUES_PATH, 'utf8'));
  const existingAll: MosqueEntity[] = JSON.parse(fs.readFileSync(ALL_ENTITIES_PATH, 'utf8'));

  if (existingMosques.length !== 559) {
    throw new Error(`Abort: mosques.json has ${existingMosques.length} records; expected exactly 559.`);
  }
  if (existingAll.length !== 612) {
    throw new Error(`Abort: all-entities.json has ${existingAll.length} records; expected exactly 612.`);
  }

  console.log(`Verified baseline: ${existingMosques.length} published records, ${existingAll.length} all-entities records.`);

  // 2. Load and process raw records through pipeline
  const rawRecords: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(RAW_LUEBECK_PATH, 'utf8'));
  console.log(`Loaded ${rawRecords.length} raw Lübeck records.`);

  if (rawRecords.length !== 7) {
    throw new Error(`Abort: Expected 7 raw Lübeck records, got ${rawRecords.length}`);
  }

  const pipelineResult = runPipeline(rawRecords, 'Lübeck', {
    dryRun: true,
    includeExtendedCities: true,
  });

  const normalizedEntities = pipelineResult.allEntities;
  console.log(`Pipeline normalized ${normalizedEntities.length} entities.`);

  if (normalizedEntities.length !== 7) {
    throw new Error(`Abort: Expected 7 normalized entities, got ${normalizedEntities.length}`);
  }

  // 3. Verify all 7 entities are PUBLISHED and UNVERIFIED
  for (const entity of normalizedEntities) {
    if (entity.dataStatus !== 'PUBLISHED') {
      throw new Error(`Abort: Entity ${entity.canonicalName} (${entity.placeId}) has status ${entity.dataStatus}`);
    }
    if (entity.verificationStatus !== 'UNVERIFIED') {
      throw new Error(`Abort: Entity ${entity.canonicalName} (${entity.placeId}) has status ${entity.verificationStatus}; expected UNVERIFIED`);
    }
    if (existingMosques.some(m => m.placeId === entity.placeId)) {
      throw new Error(`Abort: Place ID collision with existing production: ${entity.placeId}`);
    }
    if (existingMosques.some(m => m.slug === entity.slug && m.city.toLowerCase() === entity.city.toLowerCase())) {
      throw new Error(`Abort: Slug collision with existing production: ${entity.slug}`);
    }
  }

  console.log('All 7 Lübeck entities validated cleanly for publication:');
  normalizedEntities.forEach((e, idx) => {
    console.log(`  ${idx + 1}. [${e.placeId}] ${e.canonicalName} — ${e.address}`);
  });

  // 4. Update mosques.json: 559 + 7 = 566
  const updatedMosques = [...existingMosques, ...normalizedEntities];
  console.log(`\nTarget mosques.json count: ${updatedMosques.length} (was ${existingMosques.length})`);

  // 5. Update all-entities.json: 612 + 7 = 619
  const updatedAll = [...existingAll, ...normalizedEntities];
  console.log(`Target all-entities.json count: ${updatedAll.length} (was ${existingAll.length})`);

  // 6. Update city-registry-overrides.json
  let registryOverrides: Record<string, unknown> = {};
  if (fs.existsSync(REGISTRY_OVERRIDES_PATH)) {
    registryOverrides = JSON.parse(fs.readFileSync(REGISTRY_OVERRIDES_PATH, 'utf8'));
  }
  const timestamp = new Date().toISOString();
  registryOverrides['luebeck'] = {
    status: 'PUBLISHED',
    publicationEnabled: true,
    seoIndexable: true,
    launchedAt: timestamp,
  };

  // 7. Write all targets atomically
  fs.writeFileSync(MOSQUES_PATH, JSON.stringify(updatedMosques, null, 2), 'utf8');
  fs.writeFileSync(ALL_ENTITIES_PATH, JSON.stringify(updatedAll, null, 2), 'utf8');
  fs.writeFileSync(REGISTRY_OVERRIDES_PATH, JSON.stringify(registryOverrides, null, 2), 'utf8');

  // 8. Append audit event
  const auditEvent = {
    timestamp,
    phase: '11B',
    action: 'CITY_PROMOTION',
    city: 'Lübeck',
    slug: 'luebeck',
    recordsAdded: 7,
    newTotalPublished: updatedMosques.length,
    newTotalAllEntities: updatedAll.length,
    promotedPlaceIds: normalizedEntities.map(e => e.placeId),
  };
  fs.appendFileSync(AUDIT_LOG_PATH, JSON.stringify(auditEvent) + '\n', 'utf8');

  console.log('\nSUCCESS: All data files updated cleanly.');
  console.log(`- src/data/mosques.json updated (${updatedMosques.length} records)`);
  console.log(`- src/data/all-entities.json updated (${updatedAll.length} records)`);
  console.log('- src/data/city-registry-overrides.json updated (Lübeck marked PUBLISHED)');
  console.log('- reports/audit/production-audit-events.jsonl appended audit record');
}

main();
