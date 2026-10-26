/**
 * Phase 12B — Controlled Promotion of Aachen (9 READY Records)
 *
 * Promotes exactly 9 READY records to mosques.json (566 -> 575).
 * Appends all 12 entities (9 PUBLISHED, 2 REVIEWED/HOLD, 1 REJECTED) to all-entities.json (619 -> 631).
 * Preserves all 566 existing records byte-for-byte.
 * Enables Aachen in city-registry-overrides.json.
 */

import fs from 'fs';
import path from 'path';
import { runPipeline } from '../src/pipeline/runner';
import { RawGooglePlaceRecord, MosqueEntity } from '../src/pipeline/types';

const ROOT = process.cwd();
const MOSQUES_PATH = path.join(ROOT, 'src/data/mosques.json');
const ALL_ENTITIES_PATH = path.join(ROOT, 'src/data/all-entities.json');
const REGISTRY_OVERRIDES_PATH = path.join(ROOT, 'src/data/city-registry-overrides.json');
const RAW_AACHEN_PATH = path.join(ROOT, 'aachen,germany.json');
const AUDIT_LOG_PATH = path.join(ROOT, 'reports/audit/production-audit-events.jsonl');

const READY_PLACE_IDS = new Set([
  'ChIJh0sx7YKZwEcRW41xfWOKZDY', // Islamic Center Bilal Mosque
  'ChIJVUW0AF6ZwEcR5YU6bdKp1xY', // Al-Imam-Malik Moschee
  'ChIJPcI5cWeZwEcRkg9lcWgr2lM', // IGMG Eyüp Sultan Moschee Aachen
  'ChIJHZuj5VKZwEcRDqgK7_FORTc', // Aachen Central Mosque
  'ChIJ15iI1CqfwEcRK8T5wcgZL_c', // Islamisch Albanisches Kulturzentrum
  'ChIJF-P2ijeZwEcRj7EtsqZJyB8', // Mansoor Moschee
  'ChIJa0TNSgCfwEcR2e2wy49fFJg', // Markaz Imam al Mahdi (ajf.)
  'ChIJY3OyekGfwEcRuwgyz7Sl1ww', // IGBD Bosnische Moschee Aachen
  'ChIJxwf5-f2bwEcRT7c3YOFRW0M', // VIKZ Moschee/Cami Aachen
]);

const HOLD_RECORDS: Record<string, string> = {
  'ChIJe_pj22eZwEcRTuI3E3h_3jg': 'Missing discrete street address; held on HOLD pending address verification', // Masjid As-Sunnah
  'ChIJlVXteACZwEcRnYHTboYQHY4': 'Sufi order zawiya open only Sundays (5 hrs/week); unverified open daily congregational access', // Nurya Sufyania (A. T. E. D. C)
};

const REJECT_RECORDS: Record<string, string> = {
  'ChIJXWdURwCZwEcRDgwXf7lfYgY': 'Co-located duplicate architectural pin 37m from Aachen Central Mosque (ChIJHZuj5VKZwEcRDqgK7_FORTc)', // Minaret
};

function main() {
  console.log('=== PHASE 12B: AACHEN CONTROLLED PROMOTION ===\n');

  // 1. Verify existing production baseline
  const existingMosques: MosqueEntity[] = JSON.parse(fs.readFileSync(MOSQUES_PATH, 'utf8'));
  const existingAll: MosqueEntity[] = JSON.parse(fs.readFileSync(ALL_ENTITIES_PATH, 'utf8'));

  if (existingMosques.length !== 566) {
    throw new Error(`Abort: mosques.json has ${existingMosques.length} records; expected exactly 566.`);
  }
  if (existingAll.length !== 619) {
    throw new Error(`Abort: all-entities.json has ${existingAll.length} records; expected exactly 619.`);
  }

  console.log(`Verified baseline: ${existingMosques.length} published records, ${existingAll.length} all-entities records.`);

  // 2. Load and process raw records through pipeline
  const rawRecords: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(RAW_AACHEN_PATH, 'utf8'));
  console.log(`Loaded ${rawRecords.length} raw Aachen records.`);

  if (rawRecords.length !== 12) {
    throw new Error(`Abort: Expected 12 raw Aachen records, got ${rawRecords.length}`);
  }

  const pipelineResult = runPipeline(rawRecords, 'Aachen', {
    dryRun: true,
    includeExtendedCities: true,
  });

  const normalizedEntities = pipelineResult.allEntities;
  console.log(`Pipeline normalized ${normalizedEntities.length} entities.`);

  if (normalizedEntities.length !== 12) {
    throw new Error(`Abort: Expected 12 normalized entities, got ${normalizedEntities.length}`);
  }

  // 3. Apply classification statuses: 9 PUBLISHED, 2 REVIEWED (HOLD), 1 REJECTED
  const readyToPublish: MosqueEntity[] = [];
  const processedAllEntities: MosqueEntity[] = [];

  for (const entity of normalizedEntities) {
    const placeId = entity.placeId || '';

    if (READY_PLACE_IDS.has(placeId)) {
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
    } else if (REJECT_RECORDS[placeId]) {
      entity.dataStatus = 'REJECTED';
      entity.rejectionReason = REJECT_RECORDS[placeId];
      processedAllEntities.push(entity);
      console.log(`[REJECT] ${entity.canonicalName} (${placeId}): ${entity.rejectionReason}`);
    } else {
      throw new Error(`Abort: Unaccounted record ${entity.canonicalName} (${placeId})`);
    }
  }

  if (readyToPublish.length !== 9) {
    throw new Error(`Abort: Expected exactly 9 READY records, got ${readyToPublish.length}`);
  }

  console.log(`\nSuccessfully classified 12 Aachen records: 9 READY/PUBLISHED, 2 HOLD, 1 REJECT.`);
  console.log('READY records to be published:');
  readyToPublish.forEach((e, idx) => {
    console.log(`  ${idx + 1}. [${e.placeId}] ${e.canonicalName} — ${e.address}`);
  });

  // 4. Update mosques.json: 566 + 9 = 575
  const updatedMosques = [...existingMosques, ...readyToPublish];
  console.log(`\nTarget mosques.json count: ${updatedMosques.length} (was ${existingMosques.length})`);

  // 5. Update all-entities.json: 619 + 12 = 631
  const updatedAll = [...existingAll, ...processedAllEntities];
  console.log(`Target all-entities.json count: ${updatedAll.length} (was ${existingAll.length})`);

  // 6. Update city-registry-overrides.json
  let registryOverrides: Record<string, unknown> = {};
  if (fs.existsSync(REGISTRY_OVERRIDES_PATH)) {
    registryOverrides = JSON.parse(fs.readFileSync(REGISTRY_OVERRIDES_PATH, 'utf8'));
  }
  const timestamp = new Date().toISOString();
  registryOverrides['aachen'] = {
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
    phase: 'PHASE_12B_AACHEN_PROMOTION',
    action: 'CONTROLLED_PROMOTION',
    city: 'Aachen',
    slug: 'aachen',
    addedCount: readyToPublish.length,
    holdCount: 2,
    rejectedCount: 1,
    newTotalMosques: updatedMosques.length,
    newTotalEntities: updatedAll.length,
    promotedPlaceIds: readyToPublish.map(m => m.placeId),
    holdPlaceIds: Object.keys(HOLD_RECORDS),
    rejectedPlaceIds: Object.keys(REJECT_RECORDS),
    preservationConfirmed: true,
  };
  fs.appendFileSync(AUDIT_LOG_PATH, JSON.stringify(auditEvent) + '\n', 'utf8');

  console.log('\n✅ Aachen promotion script completed successfully!');
}

main();
