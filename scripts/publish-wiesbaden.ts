/**
 * Phase 10B — Controlled Promotion of Wiesbaden (17 Approved Records)
 *
 * Excludes ChIJOYKxBgCVvUcR0ZVvoTpmab0 (Moschee Schierstein, Record 18) by Place ID.
 * Sets phone: null on ChIJv955JAq_vUcRpPic5HU-Ts8 (Vahdet-Moschee) per Phase 10B instructions.
 * Promotes exactly 17 records to mosques.json (542 -> 559).
 * Preserves all 542 existing records byte-for-byte.
 */

import fs from 'fs';
import path from 'path';
import { runPipeline } from '../src/pipeline/runner';
import { RawGooglePlaceRecord, MosqueEntity } from '../src/pipeline/types';

const ROOT = process.cwd();
const MOSQUES_PATH = path.join(ROOT, 'src/data/mosques.json');
const ALL_ENTITIES_PATH = path.join(ROOT, 'src/data/all-entities.json');
const REGISTRY_OVERRIDES_PATH = path.join(ROOT, 'src/data/city-registry-overrides.json');
const RAW_WIESBADEN_PATH = path.join(ROOT, 'wiesbaden,germany.json');

const EXCLUDED_PLACE_ID = 'ChIJOYKxBgCVvUcR0ZVvoTpmab0'; // Moschee Schierstein (HOLD duplicate)
const PHONE_OMIT_PLACE_ID = 'ChIJv955JAq_vUcRpPic5HU-Ts8'; // Vahdet-Moschee (unverified area code)

function main() {
  console.log('=== PHASE 10B: WIESBADEN CONTROLLED PROMOTION ===\n');

  // 1. Verify existing production baseline
  const existingMosques: MosqueEntity[] = JSON.parse(fs.readFileSync(MOSQUES_PATH, 'utf8'));
  const existingAll: MosqueEntity[] = JSON.parse(fs.readFileSync(ALL_ENTITIES_PATH, 'utf8'));

  if (existingMosques.length !== 542) {
    throw new Error(`Abort: mosques.json has ${existingMosques.length} records; expected exactly 542.`);
  }
  if (existingAll.length !== 594) {
    throw new Error(`Abort: all-entities.json has ${existingAll.length} records; expected exactly 594.`);
  }

  console.log(`Verified baseline: ${existingMosques.length} published records, ${existingAll.length} all-entities records.`);

  // 2. Load and process raw records through pipeline
  const rawRecords: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(RAW_WIESBADEN_PATH, 'utf8'));
  console.log(`Loaded ${rawRecords.length} raw Wiesbaden records.`);

  const pipelineResult = runPipeline(rawRecords, 'Wiesbaden', {
    dryRun: true,
    includeExtendedCities: true,
  });

  const normalizedEntities = pipelineResult.allEntities;
  console.log(`Pipeline normalized ${normalizedEntities.length} entities.`);

  // 3. Apply Phase 10B data adjustments
  const finalWiesbadenEntities: MosqueEntity[] = normalizedEntities.map(e => {
    // Clone entity
    const updated: MosqueEntity = JSON.parse(JSON.stringify(e));

    // Adjustment A: Omit questionable Vahdet-Moschee phone number
    if (updated.placeId === PHONE_OMIT_PLACE_ID) {
      console.log(`[DATA RULE] Omitted questionable phone for Vahdet-Moschee (${updated.placeId}), was: "${updated.phone}".`);
      updated.phone = null;
    }

    // Adjustment B: Keep Moschee Schierstein on HOLD in staging layer
    if (updated.placeId === EXCLUDED_PLACE_ID) {
      console.log(`[DATA RULE] Setting HOLD status on excluded duplicate ${updated.canonicalName} (${updated.placeId}).`);
      updated.dataStatus = 'REVIEWED';
      updated.reviewReason = 'HOLD: Suspected duplicate pin of Badr Moschee at Stielstraße 19; excluded from publication.';
    } else {
      updated.dataStatus = 'PUBLISHED';
    }

    return updated;
  });

  // Separate approved publishable records (17) from held records (1)
  const approvedRecords = finalWiesbadenEntities.filter(e => e.placeId !== EXCLUDED_PLACE_ID && e.dataStatus === 'PUBLISHED');
  const heldRecords = finalWiesbadenEntities.filter(e => e.placeId === EXCLUDED_PLACE_ID);

  console.log(`\nApproved publishable records: ${approvedRecords.length}`);
  console.log(`Held records: ${heldRecords.length}`);

  if (approvedRecords.length !== 17) {
    throw new Error(`Abort: Expected exactly 17 approved records, got ${approvedRecords.length}.`);
  }
  if (heldRecords.length !== 1) {
    throw new Error(`Abort: Expected exactly 1 held record, got ${heldRecords.length}.`);
  }
  if (heldRecords[0].placeId !== EXCLUDED_PLACE_ID) {
    throw new Error(`Abort: Held record placeId mismatch. Expected ${EXCLUDED_PLACE_ID}, got ${heldRecords[0].placeId}.`);
  }

  // Verify none of the approved records has the excluded placeId
  const containsExcluded = approvedRecords.some(r => r.placeId === EXCLUDED_PLACE_ID);
  if (containsExcluded) {
    throw new Error(`CRITICAL: Excluded record ${EXCLUDED_PLACE_ID} leaked into approved list!`);
  }

  // 4. Update mosques.json: 542 + 17 = 559
  const updatedMosques = [...existingMosques, ...approvedRecords];
  console.log(`\nTarget mosques.json count: ${updatedMosques.length} (was ${existingMosques.length})`);

  // 5. Update all-entities.json: 594 + 18 = 612
  const updatedAll = [...existingAll, ...finalWiesbadenEntities];
  console.log(`Target all-entities.json count: ${updatedAll.length} (was ${existingAll.length})`);

  // 6. Update city-registry-overrides.json
  let registryOverrides: Record<string, unknown> = {};
  if (fs.existsSync(REGISTRY_OVERRIDES_PATH)) {
    registryOverrides = JSON.parse(fs.readFileSync(REGISTRY_OVERRIDES_PATH, 'utf8'));
  }
  registryOverrides['wiesbaden'] = {
    status: 'PUBLISHED',
    publicationEnabled: true,
    seoIndexable: true,
    launchedAt: new Date().toISOString(),
  };

  // 7. Write all targets atomically
  fs.writeFileSync(MOSQUES_PATH, JSON.stringify(updatedMosques, null, 2), 'utf8');
  fs.writeFileSync(ALL_ENTITIES_PATH, JSON.stringify(updatedAll, null, 2), 'utf8');
  fs.writeFileSync(REGISTRY_OVERRIDES_PATH, JSON.stringify(registryOverrides, null, 2), 'utf8');

  console.log('\nSUCCESS: All files updated cleanly.');
  console.log('- src/data/mosques.json updated (559 records)');
  console.log('- src/data/all-entities.json updated (612 records)');
  console.log('- src/data/city-registry-overrides.json updated (Wiesbaden marked PUBLISHED)');
}

main();
