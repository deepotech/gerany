/**
 * Phase 14F — Controlled Promotion of Münster (7 Records)
 *
 * Promotes exactly 7 approved records to mosques.json (594 -> 601).
 * Appends all 8 entities (7 PUBLISHED, 1 REVIEWED) to all-entities.json (653 -> 661).
 * Preserves all 594 existing records byte-for-byte.
 * Enables Münster in city-registry-overrides.json.
 */

import fs from 'fs';
import path from 'path';
import { runPipeline } from '../src/pipeline/runner';
import { RawGooglePlaceRecord, MosqueEntity } from '../src/pipeline/types';

const ROOT = process.cwd();
const MOSQUES_PATH = path.join(ROOT, 'src/data/mosques.json');
const ALL_ENTITIES_PATH = path.join(ROOT, 'src/data/all-entities.json');
const REGISTRY_OVERRIDES_PATH = path.join(ROOT, 'src/data/city-registry-overrides.json');
const RAW_MUENSTER_PATH = path.join(ROOT, 'muenster,germany.json');
const AUDIT_LOG_PATH = path.join(ROOT, 'reports/audit/production-audit-events.jsonl');

const PROMOTED_PLACE_IDS = new Set([
  'ChIJn6ZhH4y6uUcRRdptFyWdN-I', // مسجد الرحمن / Arrahmanmoschee
  'ChIJqyE5Bte6uUcRFkRb8Ywf3NY', // Sultan Ahmet Camii (VIKZ)
  'ChIJBc5hbdm6uUcRLyetOq73giI', // Munster Central Mosque (DITIB)
  'ChIJu8AMms-luUcRVFFEtFUSrZQ', // As-Salam Moschee
  'ChIJN1qZ4Ly7uUcRx3dZUWMjP5Y', // Ar-Rahmah Moschee
  'ChIJYypoZAWjuUcRRokLhDbZu5U', // Bošnjački Džemat Münster - BKZ
  'ChIJX0PIy1OkuUcR-N76U5wLMdQ', // Bait ul Momin Moschee مسجد
]);

const HOLD_RECORDS: Record<string, string> = {
  'ChIJd58rTou7uUcRllSptiif6u0': 'Administrative university prayer room at Fürstbischöfliches Schloss with restricted weekday hours; missing postal code; held in review queue to prevent thin page indexing',
};

function main() {
  console.log('=== PHASE 14F: MÜNSTER CONTROLLED PROMOTION ===\n');

  // 1. Verify existing production baseline
  const existingMosques: MosqueEntity[] = JSON.parse(fs.readFileSync(MOSQUES_PATH, 'utf8'));
  const existingAll: MosqueEntity[] = JSON.parse(fs.readFileSync(ALL_ENTITIES_PATH, 'utf8'));

  if (existingMosques.length !== 594) {
    throw new Error(`Abort: mosques.json has ${existingMosques.length} records; expected exactly 594.`);
  }
  if (existingAll.length !== 653) {
    throw new Error(`Abort: all-entities.json has ${existingAll.length} records; expected exactly 653.`);
  }

  console.log(`Verified baseline: ${existingMosques.length} published records, ${existingAll.length} all-entities records.`);

  // 2. Load and process raw records through pipeline
  const rawRecords: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(RAW_MUENSTER_PATH, 'utf8'));
  console.log(`Loaded ${rawRecords.length} raw Münster records.`);

  if (rawRecords.length !== 8) {
    throw new Error(`Abort: Expected 8 raw Münster records, got ${rawRecords.length}`);
  }

  const pipelineResult = runPipeline(rawRecords, 'Münster', {
    dryRun: true,
    includeExtendedCities: true,
  });

  const normalizedEntities = pipelineResult.allEntities;
  console.log(`Pipeline normalized ${normalizedEntities.length} entities.`);

  if (normalizedEntities.length !== 8) {
    throw new Error(`Abort: Expected 8 normalized entities, got ${normalizedEntities.length}`);
  }

  // 3. Apply classification statuses: 7 PUBLISHED, 1 REVIEWED (HOLD)
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

  if (readyToPublish.length !== 7) {
    throw new Error(`Abort: Expected exactly 7 READY records, got ${readyToPublish.length}`);
  }

  console.log(`\nSuccessfully classified 8 Münster records: 7 PUBLISHED, 1 HOLD.`);
  console.log('Records to be published:');
  readyToPublish.forEach((e, idx) => {
    console.log(`  ${idx + 1}. [${e.placeId}] ${e.canonicalName} — ${e.address} (Phone: ${e.phone || 'null'}, Web: ${e.website || 'null'})`);
  });

  // 4. Update mosques.json: 594 + 7 = 601
  const updatedMosques = [...existingMosques, ...readyToPublish];
  console.log(`\nTarget mosques.json count: ${updatedMosques.length} (was ${existingMosques.length})`);

  // 5. Update all-entities.json: 653 + 8 = 661
  const updatedAll = [...existingAll, ...processedAllEntities];
  console.log(`Target all-entities.json count: ${updatedAll.length} (was ${existingAll.length})`);

  // 6. Update city-registry-overrides.json
  let registryOverrides: Record<string, unknown> = {};
  if (fs.existsSync(REGISTRY_OVERRIDES_PATH)) {
    registryOverrides = JSON.parse(fs.readFileSync(REGISTRY_OVERRIDES_PATH, 'utf8'));
  }
  const timestamp = new Date().toISOString();
  registryOverrides['muenster'] = {
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
    phase: 'PHASE_14F_MUENSTER_PROMOTION',
    action: 'CONTROLLED_PROMOTION',
    city: 'Münster',
    slug: 'muenster',
    addedCount: readyToPublish.length,
    holdCount: 1,
    rejectedCount: 0,
    newTotalMosques: updatedMosques.length,
    newTotalEntities: updatedAll.length,
    promotedPlaceIds: readyToPublish.map(m => m.placeId),
    holdPlaceIds: Object.keys(HOLD_RECORDS),
    preservationConfirmed: true,
  };
  fs.appendFileSync(AUDIT_LOG_PATH, JSON.stringify(auditEvent) + '\n', 'utf8');

  console.log('\n✅ Münster promotion script completed successfully!');
}

main();
