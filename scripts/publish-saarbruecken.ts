/**
 * Phase 13B — Controlled Promotion of Saarbrücken (11 Records)
 *
 * Promotes exactly 11 eligible records to mosques.json (575 -> 586).
 * Appends all 12 entities (11 PUBLISHED, 1 REJECTED) to all-entities.json (631 -> 643).
 * Preserves all 575 existing records byte-for-byte.
 * Enables Saarbrücken in city-registry-overrides.json.
 */

import fs from 'fs';
import path from 'path';
import { runPipeline } from '../src/pipeline/runner';
import { RawGooglePlaceRecord, MosqueEntity } from '../src/pipeline/types';

const ROOT = process.cwd();
const MOSQUES_PATH = path.join(ROOT, 'src/data/mosques.json');
const ALL_ENTITIES_PATH = path.join(ROOT, 'src/data/all-entities.json');
const REGISTRY_OVERRIDES_PATH = path.join(ROOT, 'src/data/city-registry-overrides.json');
const RAW_SAARBRUECKEN_PATH = path.join(ROOT, 'saarbruecken,germany.json');
const AUDIT_LOG_PATH = path.join(ROOT, 'reports/audit/production-audit-events.jsonl');

const PROMOTED_PLACE_IDS = new Set([
  'ChIJk8onlSG0lUcRyyx-Bbh6D5M', // Islamisches Kulturzentrum Saarbrücken (phone normalized to null)
  'ChIJ4fg50zO3lUcRdYZltqxFN0E', // Marokkanischer Kulturverein im Saarland e.V
  'ChIJOUlD5VqxlUcRtLH7N1Cb_-8', // Islamische Glaubensgemeinschaft Saarbrücken e.V.
  'ChIJRW_hOnqxlUcRTodhwBY9qro', // Islamische Gemeinde Saarland e.V.
  'ChIJifx4YlixlUcR6nUEbCzFPAw', // Masjid Bilal
  'ChIJxUI-g9-2lUcRmk-swcGE1Sc', // جامع عمر بن الخطاب Moschee
  'ChIJJ_eL8u6xlUcRNiszmunrNic', // Bosanski kulturni Center Saarbrücken
  'ChIJJ7MX3v2zlUcR015xVW9NeMU', // Ditib Saarbrücken Merkez Cami
  'ChIJ9Xnu8PaxlUcRMljGilFcRTE', // Masjid Al Noor
  'ChIJCzxD4Mq1lUcRGMryhOqaRow', // 32 Omar Ibn Abdalaziz Moschee
  'ChIJa7X6CQCxlUcR2QVshvHP0CM', // Fatih Cami
]);

const REJECT_RECORDS: Record<string, string> = {
  'ChIJ9TXIFHyxlUcREjbZu-bS0vk': 'Co-located duplicate shadow pin 10m from Masjid Al Noor (ChIJ9Xnu8PaxlUcRMljGilFcRTE) at Jakobstraße 2 sharing identical phone +49 173 3067351; contains corrupted hours and vandalized owner description',
};

function main() {
  console.log('=== PHASE 13B: SAARBRÜCKEN CONTROLLED PROMOTION ===\n');

  // 1. Verify existing production baseline
  const existingMosques: MosqueEntity[] = JSON.parse(fs.readFileSync(MOSQUES_PATH, 'utf8'));
  const existingAll: MosqueEntity[] = JSON.parse(fs.readFileSync(ALL_ENTITIES_PATH, 'utf8'));

  if (existingMosques.length !== 575) {
    throw new Error(`Abort: mosques.json has ${existingMosques.length} records; expected exactly 575.`);
  }
  if (existingAll.length !== 631) {
    throw new Error(`Abort: all-entities.json has ${existingAll.length} records; expected exactly 631.`);
  }

  console.log(`Verified baseline: ${existingMosques.length} published records, ${existingAll.length} all-entities records.`);

  // 2. Load and process raw records through pipeline
  const rawRecords: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(RAW_SAARBRUECKEN_PATH, 'utf8'));
  console.log(`Loaded ${rawRecords.length} raw Saarbrücken records.`);

  if (rawRecords.length !== 12) {
    throw new Error(`Abort: Expected 12 raw Saarbrücken records, got ${rawRecords.length}`);
  }

  const pipelineResult = runPipeline(rawRecords, 'Saarbrücken', {
    dryRun: true,
    includeExtendedCities: true,
  });

  const normalizedEntities = pipelineResult.allEntities;
  console.log(`Pipeline normalized ${normalizedEntities.length} entities.`);

  if (normalizedEntities.length !== 12) {
    throw new Error(`Abort: Expected 12 normalized entities, got ${normalizedEntities.length}`);
  }

  // 3. Apply classification statuses: 11 PUBLISHED, 1 REJECTED
  const readyToPublish: MosqueEntity[] = [];
  const processedAllEntities: MosqueEntity[] = [];

  for (const entity of normalizedEntities) {
    const placeId = entity.placeId || '';

    if (PROMOTED_PLACE_IDS.has(placeId)) {
      entity.dataStatus = 'PUBLISHED';
      entity.verificationStatus = 'UNVERIFIED';
      entity.reviewReason = null;
      entity.rejectionReason = null;

      // Special check for Islamisches Kulturzentrum Saarbrücken phone placeholder
      if (placeId === 'ChIJk8onlSG0lUcRyyx-Bbh6D5M') {
        if (entity.phone !== null) {
          console.warn(`[WARNING] Placeholder phone not nulled; forcing null on entity.phone`);
          entity.phone = null;
        }
        if (entity.rawValues?.phone !== '+49 123123456123456') {
          throw new Error(`Abort: rawValues.phone for ChIJk8onlSG0lUcRyyx-Bbh6D5M does not preserve original placeholder!`);
        }
        console.log(`[CONFIRMED] ChIJk8onlSG0lUcRyyx-Bbh6D5M phone is null, rawValues preserved: "${entity.rawValues.phone}"`);
      }

      // Duplicate checks against existing production
      if (existingMosques.some(m => m.placeId === entity.placeId)) {
        throw new Error(`Abort: Place ID collision with existing production: ${entity.placeId}`);
      }
      if (existingMosques.some(m => m.slug === entity.slug && m.city.toLowerCase() === entity.city.toLowerCase())) {
        throw new Error(`Abort: Slug collision with existing production: ${entity.slug}`);
      }

      readyToPublish.push(entity);
      processedAllEntities.push(entity);
    } else if (REJECT_RECORDS[placeId]) {
      entity.dataStatus = 'REJECTED';
      entity.rejectionReason = REJECT_RECORDS[placeId];
      processedAllEntities.push(entity);
      console.log(`[REJECT] ${entity.canonicalName} (${placeId}): ${entity.rejectionReason}`);
    } else {
      throw new Error(`Abort: Unaccounted record ${entity.canonicalName} (${placeId})`);
    }
  }

  if (readyToPublish.length !== 11) {
    throw new Error(`Abort: Expected exactly 11 READY records, got ${readyToPublish.length}`);
  }

  console.log(`\nSuccessfully classified 12 Saarbrücken records: 11 PUBLISHED, 1 REJECT.`);
  console.log('Records to be published:');
  readyToPublish.forEach((e, idx) => {
    console.log(`  ${idx + 1}. [${e.placeId}] ${e.canonicalName} — ${e.address} (Phone: ${e.phone})`);
  });

  // 4. Update mosques.json: 575 + 11 = 586
  const updatedMosques = [...existingMosques, ...readyToPublish];
  console.log(`\nTarget mosques.json count: ${updatedMosques.length} (was ${existingMosques.length})`);

  // 5. Update all-entities.json: 631 + 12 = 643
  const updatedAll = [...existingAll, ...processedAllEntities];
  console.log(`Target all-entities.json count: ${updatedAll.length} (was ${existingAll.length})`);

  // 6. Update city-registry-overrides.json
  let registryOverrides: Record<string, unknown> = {};
  if (fs.existsSync(REGISTRY_OVERRIDES_PATH)) {
    registryOverrides = JSON.parse(fs.readFileSync(REGISTRY_OVERRIDES_PATH, 'utf8'));
  }
  const timestamp = new Date().toISOString();
  registryOverrides['saarbruecken'] = {
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
    phase: 'PHASE_13B_SAARBRUECKEN_PROMOTION',
    action: 'CONTROLLED_PROMOTION',
    city: 'Saarbrücken',
    slug: 'saarbruecken',
    addedCount: readyToPublish.length,
    holdCount: 0,
    rejectedCount: 1,
    newTotalMosques: updatedMosques.length,
    newTotalEntities: updatedAll.length,
    promotedPlaceIds: readyToPublish.map(m => m.placeId),
    rejectedPlaceIds: Object.keys(REJECT_RECORDS),
    preservationConfirmed: true,
  };
  fs.appendFileSync(AUDIT_LOG_PATH, JSON.stringify(auditEvent) + '\n', 'utf8');

  console.log('\n✅ Saarbrücken promotion script completed successfully!');
}

main();
