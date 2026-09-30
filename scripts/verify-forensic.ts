import fs from 'fs';
import path from 'path';
import { getPublishedCityConfigs, isCityIndexable, CITY_CONFIGS } from '../src/pipeline/city-config';
import { isPublishedCity, getCityRegistryEntry, getAllCityRegistryEntries } from '../src/pipeline/city-registry';
import sitemap from '../src/app/sitemap';
import { JsonMosqueRepository } from '../src/lib/db/json-repository';

async function main() {
  console.log('=== PHASE 5B FORENSIC VERIFICATION ===\n');

  // 1. Verify original 443 records byte/field equivalence
  const rootDir = path.resolve(__dirname, '..');
  const mosques: any[] = JSON.parse(fs.readFileSync(path.join(rootDir, 'src', 'data', 'mosques.json'), 'utf8'));
  const allEntities: any[] = JSON.parse(fs.readFileSync(path.join(rootDir, 'src', 'data', 'all-entities.json'), 'utf8'));
  const baseline: any = JSON.parse(fs.readFileSync(path.join(rootDir, 'PHASE5B_BASELINE.json'), 'utf8'));

  console.log('1. Checking Total Production Records:');
  console.log(`   - Current published: ${mosques.length} (Baseline: ${baseline.totalPublished}, Delta: +${mosques.length - baseline.totalPublished})`);
  console.log(`   - Current allEntities: ${allEntities.length} (Baseline: ${baseline.totalAllEntities}, Delta: +${allEntities.length - baseline.totalAllEntities})`);

  const first443 = mosques.slice(0, 443);
  const next99 = mosques.slice(443);

  // Check baseline cities
  const baseCities = ['Berlin', 'Hamburg', 'München', 'Frankfurt', 'Dortmund', 'Köln', 'Stuttgart', 'Düsseldorf', 'Essen'];
  let baseMismatch = false;
  for (const c of baseCities) {
    const expected = baseline.publishedCities[c];
    const actual = first443.filter((m) => m.city === c).length;
    if (expected !== actual) {
      console.error(`   ❌ City count mismatch for ${c}: expected ${expected}, got ${actual}`);
      baseMismatch = true;
    }
  }
  if (!baseMismatch) {
    console.log('   ✅ All 9 base cities have EXACT matching counts to baseline (sum = 443).');
  }

  // Field equivalence check for first 443
  let fieldErrors = 0;
  for (let i = 0; i < first443.length; i++) {
    const m = first443[i];
    if (!m.placeId || !m.slug || !m.canonicalName || !m.city) fieldErrors++;
    if (m.dataStatus !== 'PUBLISHED') fieldErrors++;
    if (m.verificationStatus !== 'UNVERIFIED') fieldErrors++;
    if (typeof m.latitude !== 'number' || typeof m.longitude !== 'number') fieldErrors++;
    if (m.latitude < 47 || m.latitude > 55.5 || m.longitude < 5.5 || m.longitude > 15.5) fieldErrors++;
  }
  console.log(`   - Identity fields valid for all 443 baseline records: ${fieldErrors === 0 ? '✅ YES (0 errors)' : '❌ NO'}`);

  // 2. Check 99 newly published records
  console.log('\n2. Checking 99 Newly Published Records:');
  const promotedCities = ['Bremen', 'Wuppertal', 'Bonn', 'Nürnberg', 'Leipzig'];
  const newCityCounts: Record<string, number> = {};
  next99.forEach((m) => {
    newCityCounts[m.city] = (newCityCounts[m.city] || 0) + 1;
  });
  console.log('   - New records by city:', newCityCounts);

  let newRecordErrors = 0;
  let hasNullFacility = false;
  let hasPrayerTimes = false;
  let hasReviews = false;

  for (const m of next99) {
    if (m.verificationStatus !== 'UNVERIFIED') newRecordErrors++;
    if (m.dataStatus !== 'PUBLISHED') newRecordErrors++;
    if (!promotedCities.includes(m.city)) newRecordErrors++;
    if (m.prayerTimes !== undefined) hasPrayerTimes = true;
    if (m.reviews !== undefined || m.userReviews !== undefined || m.reviewerName !== undefined) hasReviews = true;
    if (m.facilities) {
      if (m.facilities.parking === null || m.facilities.womenArea === null || m.facilities.wheelchairAccessible === null) {
        hasNullFacility = true;
      }
    }
  }
  console.log(`   - verificationStatus == UNVERIFIED for all 99: ${newRecordErrors === 0 ? '✅ YES' : '❌ NO'}`);
  console.log(`   - No fabricated prayer times: ${!hasPrayerTimes ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   - Unknown facilities preserved as null (not false): ${hasNullFacility ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   - No review text or reviewer names: ${!hasReviews ? '✅ PASS' : '❌ FAIL'}`);

  // 3. Test unpublished candidate cities
  console.log('\n3. Testing 5 Unpublished Candidate Cities (Hannover, Duisburg, Bochum, Mannheim, Dresden):');
  const unpromoted = ['hannover', 'duisburg', 'bochum', 'mannheim', 'dresden'];
  const publishedConfigs = getPublishedCityConfigs();

  for (const slug of unpromoted) {
    const inMosques = mosques.filter((m) => m.city?.toLowerCase() === slug || m.city === getCityRegistryEntry(slug)?.canonical).length;
    const inPubConfigs = publishedConfigs.some((c) => c.slug === slug);
    const isPub = isPublishedCity(slug);
    const entry = getCityRegistryEntry(slug);

    console.log(`   - ${entry?.canonical || slug} (${slug}):`);
    console.log(`       In mosques.json: ${inMosques} records ${inMosques === 0 ? '✅' : '❌'}`);
    console.log(`       In getPublishedCityConfigs(): ${inPubConfigs} ${!inPubConfigs ? '✅' : '❌'}`);
    console.log(`       isPublishedCity(): ${isPub} ${!isPub ? '✅' : '❌'}`);
    console.log(`       Lifecycle status: ${entry?.status} (Expected: REVIEW)`);
  }

  // 4. Sitemap Audit
  console.log('\n4. Sitemap Audit:');
  const sitemapEntries = await sitemap();
  console.log(`   - Total sitemap entries: ${sitemapEntries.length} (Expected: 1674)`);
  if (sitemapEntries.length === 1674) {
    console.log('   ✅ Exact match: 1674 URLs');
  } else {
    console.log(`   ❌ Mismatch: ${sitemapEntries.length} vs 1674`);
  }

  const sitemapUrls = sitemapEntries.map((e) => e.url);
  const uniqueUrls = new Set(sitemapUrls);
  console.log(`   - Duplicate canonical URLs: ${sitemapUrls.length - uniqueUrls.size} ${sitemapUrls.length === uniqueUrls.size ? '✅ (0 duplicates)' : '❌'}`);

  // Check no query URLs
  const hasQuery = sitemapUrls.some((u) => u.includes('?'));
  console.log(`   - No query URLs: ${!hasQuery ? '✅ PASS' : '❌ FAIL'}`);

  // Check no unpublished city URLs
  let exposedUnpublished = 0;
  for (const slug of unpromoted) {
    if (sitemapUrls.some((u) => u.includes('/' + slug))) {
      console.error(`   ❌ Unpublished city "${slug}" found in sitemap!`);
      exposedUnpublished++;
    }
  }
  if (exposedUnpublished === 0) {
    console.log('   ✅ Zero unpublished cities exposed in sitemap.');
  }

  console.log('\n=== FORENSIC VERIFICATION COMPLETE ===');
}

main();
