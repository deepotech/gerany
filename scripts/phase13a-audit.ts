import fs from 'fs';
import path from 'path';
import { runPipeline } from '../src/pipeline/runner';
import { validateCityForLaunch } from '../src/pipeline/city-gates';
import { getCityRegistryEntry } from '../src/pipeline/city-registry';
import { getPublishedCityConfigs } from '../src/pipeline/city-config';
import { evaluateQualityGates } from '../src/pipeline/gates';
import { MosqueEntity, RawGooglePlaceRecord } from '../src/pipeline/types';
import sitemap from '../src/app/sitemap';

const ROOT = process.cwd();
const MOSQUES_FILE = path.join(ROOT, 'src', 'data', 'mosques.json');
const ALL_ENTITIES_FILE = path.join(ROOT, 'src', 'data', 'all-entities.json');
const SAARBRUECKEN_RAW = path.join(ROOT, 'saarbruecken,germany.json');

function haversineDistanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

async function audit() {
  console.log('=== PHASE 13A: SAARBRÜCKEN PRE-PROMOTION AUDIT ===\n');

  // 1. Confirm baseline
  console.log('--- 1. Baseline Invariant Verification ---');
  const publishedMosques: MosqueEntity[] = JSON.parse(fs.readFileSync(MOSQUES_FILE, 'utf8'));
  const allEntities: MosqueEntity[] = JSON.parse(fs.readFileSync(ALL_ENTITIES_FILE, 'utf8'));
  const publishedConfigs = getPublishedCityConfigs();
  const sitemapEntries = await sitemap();

  console.log(`Published Mosques Count: ${publishedMosques.length} (Target: 575)`);
  console.log(`All Entities Count: ${allEntities.length} (Target: 631)`);
  console.log(`Published City Configs Count: ${publishedConfigs.length} (Target: 17)`);
  console.log(`Sitemap Canonical URLs Count: ${sitemapEntries.length} (Target: 1782)`);

  const distinctPublishedCities = [...new Set(publishedMosques.map(m => m.city))].sort();
  console.log(`Published Cities (${distinctPublishedCities.length}):`, distinctPublishedCities.join(', '));

  // Aachen check in baseline
  const aachenPublished = publishedMosques.filter(m => m.city === 'Aachen');
  const aachenAll = allEntities.filter(m => m.city === 'Aachen');
  console.log(`Aachen in published mosques: ${aachenPublished.length} (Target: 9)`);
  console.log(`Aachen in all-entities: ${aachenAll.length} (Target: 12)`);
  const aachenHold = aachenAll.filter(m => m.dataStatus === 'REVIEWED');
  const aachenRejected = aachenAll.filter(m => m.dataStatus === 'REJECTED');
  console.log(`Aachen REVIEWED (HOLD) records: ${aachenHold.length} (Target: 2) -> ${aachenHold.map(h => `${h.canonicalName} (${h.placeId})`).join(', ')}`);
  console.log(`Aachen REJECTED records: ${aachenRejected.length} (Target: 1) -> ${aachenRejected.map(r => `${r.canonicalName} (${r.placeId})`).join(', ')}`);

  // Candidate city registry status
  const candidateSlugs = ['saarbruecken', 'freiburg', 'kiel', 'mainz', 'regensburg', 'karlsruhe', 'augsburg', 'bielefeld', 'muenster'];
  console.log('\nCandidate City Registry Status:');
  for (const slug of candidateSlugs) {
    const entry = getCityRegistryEntry(slug);
    console.log(`  - ${slug}: status=${entry?.status}, pubEnabled=${entry?.publicationEnabled}, seoIndexable=${entry?.seoIndexable}`);
  }

  // 2. Raw Saarbrücken records audit
  console.log('\n--- 2. Inspecting saarbruecken,germany.json ---');
  const rawRecords: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(SAARBRUECKEN_RAW, 'utf8'));
  console.log(`Total raw records: ${rawRecords.length}`);

  // Run pipeline dry run
  const pipelineResult = runPipeline(rawRecords, 'Saarbrücken', {
    dryRun: true,
    includeExtendedCities: true,
  });

  console.log(`\nPipeline Dry-Run Output:`);
  console.log(`  All Entities: ${pipelineResult.allEntities.length}`);
  console.log(`  Published Eligible (dry-run): ${pipelineResult.publishedEntities.length}`);
  console.log(`  Cross-City Anomalies: ${pipelineResult.crossCityAnomalies.length}`);

  // Cross checks against existing 575 published records
  const publishedPlaceIds = new Set(publishedMosques.map(m => m.placeId).filter(Boolean));
  const publishedSlugs = new Set(publishedMosques.map(m => m.slug));

  console.log('\n--- 3. Detailed Per-Record Analysis ---');
  pipelineResult.allEntities.forEach((entity, idx) => {
    const raw = rawRecords.find(r => r.placeId === entity.placeId) || rawRecords[idx];
    const gates = evaluateQualityGates(entity);

    console.log(`\n============================================================`);
    console.log(`Record #${idx + 1}: ${raw.title}`);
    console.log(`============================================================`);
    console.log(`Raw Title: "${raw.title}"`);
    console.log(`Place ID: ${raw.placeId}`);
    console.log(`Raw Street: "${raw.street}"`);
    console.log(`Raw Postal Code: "${raw.postalCode}"`);
    console.log(`Raw City: "${raw.city}"`);
    console.log(`Raw Address: "${raw.address}"`);
    console.log(`Raw Location: lat=${raw.location?.lat}, lng=${raw.location?.lng}`);
    console.log(`Raw Phone: "${raw.phone}"`);
    console.log(`Raw Website: "${raw.website}"`);
    console.log(`Raw Category / Categories: "${raw.categoryName}" / ${JSON.stringify(raw.categories)}`);
    console.log(`Raw Description: "${raw.description}"`);
    console.log(`Raw Opening Hours Count: ${raw.openingHours?.length || 0}`);
    if (raw.openingHours && raw.openingHours.length > 0) {
      console.log(`  Hours: ${JSON.stringify(raw.openingHours)}`);
    }
    console.log(`Raw Reviews Count: ${raw.reviewsCount}, Total Score: ${raw.totalScore}`);
    const rawReviews = (raw as any).reviews;
    if (rawReviews && rawReviews.length > 0) {
      console.log(`  Sample reviews (${rawReviews.length}):`);
      for (const rev of rawReviews.slice(0, 3)) {
        console.log(`    - [${rev.stars}*] "${rev.text?.slice(0, 100)}..."`);
      }
    }

    console.log(`\nNormalized Output:`);
    console.log(`  Canonical Name: "${entity.canonicalName}"`);
    console.log(`  Slug: "${entity.slug}"`);
    console.log(`  Street: "${entity.street}"`);
    console.log(`  Postal Code: "${entity.postalCode}"`);
    console.log(`  City: "${entity.city}" (state: ${entity.state})`);
    console.log(`  District: "${entity.district}"`);
    console.log(`  Formatted Address: "${entity.address}"`);
    console.log(`  Coordinates: lat=${entity.latitude}, lng=${entity.longitude}`);
    console.log(`  Phone: "${entity.phone}"`);
    console.log(`  Website: "${entity.website}"`);
    console.log(`  Category: "${entity.category}"`);
    console.log(`  Organization: "${entity.organization}"`);
    console.log(`  Opening Hours: ${JSON.stringify(entity.openingHours)}`);
    console.log(`  Data Status: ${entity.dataStatus}`);
    console.log(`  Review Reason: ${entity.reviewReason}`);

    // Quality gate checks
    console.log(`\nQuality Gates Evaluation:`);
    console.log(`  Gate Passed: ${gates.allPassed}`);
    console.log(`  Can Publish: ${gates.canPublish}`);
    console.log(`  Failed Gates: ${JSON.stringify(gates.failedGates)}`);

    // Conflicts with published records
    const placeIdConflict = raw.placeId && publishedPlaceIds.has(raw.placeId);
    const slugConflict = publishedSlugs.has(entity.slug);
    console.log(`\nConflict Checks with 575 Published Records:`);
    console.log(`  Place ID collision: ${placeIdConflict ? 'YES (CONFLICT!)' : 'NONE'}`);
    console.log(`  Slug collision: ${slugConflict ? 'YES (CONFLICT!)' : 'NONE'}`);

    // Check city boundary
    const postalInt = parseInt(entity.postalCode, 10);
    const isSaarbrueckenPostal = postalInt >= 66111 && postalInt <= 66133;
    console.log(`  Postal Boundary Check (66111-66133): ${entity.postalCode} -> ${isSaarbrueckenPostal ? 'VALID' : 'INVALID'}`);
  });

  // 4. Pairwise distance analysis (Co-locations / nearby pins)
  console.log('\n--- 4. Pairwise Distance Matrix (< 500m) ---');
  for (let i = 0; i < pipelineResult.allEntities.length; i++) {
    for (let j = i + 1; j < pipelineResult.allEntities.length; j++) {
      const e1 = pipelineResult.allEntities[i];
      const e2 = pipelineResult.allEntities[j];
      const dist = haversineDistanceM(
        e1.latitude,
        e1.longitude,
        e2.latitude,
        e2.longitude
      );
      if (dist < 500) {
        console.log(`\nPair: [#${i + 1}] "${e1.canonicalName}" <--> [#${j + 1}] "${e2.canonicalName}"`);
        console.log(`  Distance: ${dist} meters`);
        console.log(`  Address 1: ${e1.address}`);
        console.log(`  Address 2: ${e2.address}`);
        console.log(`  Place ID 1: ${e1.placeId}`);
        console.log(`  Place ID 2: ${e2.placeId}`);
        console.log(`  Phone 1: ${e1.phone} | Phone 2: ${e2.phone}`);
        console.log(`  Website 1: ${e1.website} | Website 2: ${e2.website}`);
      }
    }
  }

  // 5. City Launch Gates Validation
  const launchReport = validateCityForLaunch('saarbruecken', pipelineResult.allEntities);
  console.log(`\n--- 5. City Gates Validation for Saarbrücken ---`);
  console.log(`  Status: ${launchReport.status}`);
  console.log(`  Recommendation: ${launchReport.recommendation}`);
  console.log(`  Blockers (${launchReport.blockers.length}):`);
  launchReport.blockers.forEach(b => console.log(`    - [${b.gate}] ${b.reason}`));
  console.log(`  Warnings (${launchReport.warnings.length}):`);
  launchReport.warnings.forEach(w => console.log(`    - [${w.gate}] ${w.reason}`));
}

audit().catch(console.error);
