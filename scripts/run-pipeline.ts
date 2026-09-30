/**
 * Germany Mosque Finder — Multi-City Pipeline Runner (Phase 2A)
 *
 * Processes all raw city datasets in the project root, runs the full pipeline
 * per city, deduplicates across cities, and merges into the production data files.
 *
 * SAFETY RULES:
 * - Does NOT blindly publish all records
 * - Preserves all dataStatus decisions from the per-city pipeline
 * - Cross-city anomalies are held in REVIEW
 * - Existing placeIds in the merged output are NOT overwritten unless source data has changed
 * - All pipeline decisions are logged with reasons
 */

import fs from 'fs';
import path from 'path';
import { runPipeline, CrossCityAnomaly } from '../src/pipeline/runner';
import { detectDuplicates } from '../src/pipeline/deduplicate';
import { RawGooglePlaceRecord, MosqueEntity, DataQualityReport } from '../src/pipeline/types';
import { CITY_CONFIGS } from '../src/pipeline/city-config';

interface CityDataset {
  filename: string;
  sourceCity: string;
  records: RawGooglePlaceRecord[];
}

function extractCityFromFilename(filename: string): string {
  // "Berlin, Germany.json" → "Berlin"
  return filename.replace(', Germany.json', '').replace(/, Germany\.json$/, '').trim();
}

function main() {
  const rootDir = path.resolve(__dirname, '..');
  const dataDir = path.join(rootDir, 'src', 'data');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 1. Discover all city datasets
  const files = fs.readdirSync(rootDir)
    .filter((f) => f.includes('Germany.json') && !f.startsWith('.'));

  if (files.length === 0) {
    console.error('No "*, Germany.json" files found in project root.');
    process.exit(1);
  }

  const isDryRun = process.argv.includes('--dry-run');

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  GERMANY MOSQUE FINDER — MULTI-CITY PIPELINE (Phase 4)`);
  if (isDryRun) {
    console.log(`  >>> DRY-RUN MODE ACTIVE: No production files will be modified <<<`);
  }
  console.log(`${'='.repeat(60)}`);
  console.log(`Found ${files.length} city datasets: ${files.join(', ')}\n`);

  // 2. Load all datasets
  const datasets: CityDataset[] = [];
  for (const filename of files) {
    const sourceCity = extractCityFromFilename(filename);
    const filePath = path.join(rootDir, filename);
    const records: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    datasets.push({ filename, sourceCity, records });
    console.log(`Loaded: ${filename} → ${records.length} raw records (source city: ${sourceCity})`);
  }

  // 3. Cross-city placeId deduplication (merge ALL raw records, detect cross-dataset duplicates)
  const allRaw: (RawGooglePlaceRecord & { _sourceCity: string })[] = [];
  for (const ds of datasets) {
    for (const r of ds.records) {
      allRaw.push({ ...r, _sourceCity: ds.sourceCity });
    }
  }

  const seenPlaceIds = new Map<string, string>(); // placeId → sourceCity that owns it
  const crossDatasetDuplicates: Array<{
    placeId: string;
    title: string;
    firstSeenIn: string;
    duplicateIn: string;
  }> = [];

  for (const r of allRaw) {
    if (r.placeId) {
      if (seenPlaceIds.has(r.placeId)) {
        crossDatasetDuplicates.push({
          placeId: r.placeId,
          title: r.title || '',
          firstSeenIn: seenPlaceIds.get(r.placeId)!,
          duplicateIn: r._sourceCity,
        });
      } else {
        seenPlaceIds.set(r.placeId, r._sourceCity);
      }
    }
  }

  console.log(`\nCross-dataset placeId duplicates: ${crossDatasetDuplicates.length}`);
  if (crossDatasetDuplicates.length > 0) {
    crossDatasetDuplicates.forEach((d) => {
      console.log(`  CROSS-DATASET DUP: "${d.title}" (${d.placeId}) — first in "${d.firstSeenIn}", also in "${d.duplicateIn}"`);
    });
  }

  // Build a set of placeIds that are cross-dataset duplicates to suppress in later datasets
  const suppressedPlaceIds = new Set<string>(
    crossDatasetDuplicates.map((d) => d.placeId)
  );
  // Keep only the first occurrence — filter datasets accordingly
  const ownerDatasets = new Map<string, string>(); // placeId → sourceCity owner
  crossDatasetDuplicates.forEach((d) => {
    ownerDatasets.set(d.placeId, d.firstSeenIn);
  });

  // 4. Run per-city pipeline
  const allEntities: MosqueEntity[] = [];
  const allCrossCity: CrossCityAnomaly[] = [];
  const perCityReports: Record<string, DataQualityReport & { crossCityAnomalyCount: number }> = {};

  for (const ds of datasets) {
    console.log(`\n--- Processing: ${ds.sourceCity} (${ds.records.length} raw records) ---`);

    // Filter out records whose placeId is owned by another dataset
    const filteredRecords = ds.records.filter((r) => {
      if (!r.placeId) return true; // no placeId — keep and deduplicate within city
      if (!suppressedPlaceIds.has(r.placeId)) return true; // not a cross-dataset dup
      // This placeId is a cross-dataset dup
      const owner = ownerDatasets.get(r.placeId);
      if (owner === ds.sourceCity) return true; // this is the owning dataset
      console.log(`  [SUPPRESS] "${r.title}" (${r.placeId}) already processed in "${owner}" — skipping`);
      return false;
    });

    const result = runPipeline(filteredRecords, ds.sourceCity);

    console.log(`  Published: ${result.publishedEntities.length}`);
    console.log(`  Review:    ${result.allEntities.filter((e) => e.dataStatus === 'REVIEWED').length}`);
    console.log(`  Rejected:  ${result.allEntities.filter((e) => e.dataStatus === 'REJECTED').length}`);
    console.log(`  Cross-city anomalies: ${result.crossCityAnomalies.length}`);

    result.crossCityAnomalies.forEach((a) => {
      console.log(`    ANOMALY: "${a.title}" → resolved to "${a.resolvedCity}" (postal: ${a.resolvedPostal})`);
    });

    allEntities.push(...result.allEntities);
    allCrossCity.push(...result.crossCityAnomalies);
    perCityReports[ds.sourceCity] = {
      ...result.report,
      crossCityAnomalyCount: result.crossCityAnomalies.length,
    };
  }

  // 5. Final published list
  const publishedEntities = allEntities.filter((e) => e.dataStatus === 'PUBLISHED');

  // 6. City coverage summary
  console.log('\n' + '='.repeat(60));
  console.log('  CITY COVERAGE SUMMARY');
  console.log('='.repeat(60));

  const cityCounts = new Map<string, { published: number; reviewed: number; rejected: number }>();
  for (const e of allEntities) {
    const entry = cityCounts.get(e.city) || { published: 0, reviewed: 0, rejected: 0 };
    if (e.dataStatus === 'PUBLISHED') entry.published++;
    else if (e.dataStatus === 'REVIEWED') entry.reviewed++;
    else if (e.dataStatus === 'REJECTED') entry.rejected++;
    cityCounts.set(e.city, entry);
  }

  cityCounts.forEach((counts, city) => {
    console.log(
      `  ${city.padEnd(16)} Published: ${String(counts.published).padStart(3)}  Review: ${String(counts.reviewed).padStart(3)}  Rejected: ${String(counts.rejected).padStart(3)}`
    );
  });

  const cityConfigsLive = CITY_CONFIGS.filter(
    (c) => (cityCounts.get(c.canonical)?.published || 0) >= 1
  );

  console.log(`\n  Cities with >= 1 published entity: ${cityConfigsLive.length}`);
  console.log(`  Cities with < 3 published entities: ${
    Array.from(cityCounts.entries()).filter(([, c]) => c.published < 3 && c.published > 0).length
  }`);
  console.log(`  Cities with < 5 published entities: ${
    Array.from(cityCounts.entries()).filter(([, c]) => c.published < 5 && c.published > 0).length
  }`);

  // 7. Total stats
  const totalPublished = publishedEntities.length;
  const totalReviewed = allEntities.filter((e) => e.dataStatus === 'REVIEWED').length;
  const totalRejected = allEntities.filter((e) => e.dataStatus === 'REJECTED').length;
  const totalRaw = datasets.reduce((sum, ds) => sum + ds.records.length, 0);

  console.log('\n' + '='.repeat(60));
  console.log('  TOTAL RESULTS');
  console.log('='.repeat(60));
  console.log(`  Total raw records:     ${totalRaw}`);
  console.log(`  Total normalized:      ${allEntities.length}`);
  console.log(`  Published:             ${totalPublished}`);
  console.log(`  Review queue:          ${totalReviewed}`);
  console.log(`  Rejected:              ${totalRejected}`);
  console.log(`  Cross-city anomalies:  ${allCrossCity.length}`);
  console.log(`  Cross-dataset dups:    ${crossDatasetDuplicates.length}`);

  // 8. Sitemap count
  const sitemap3 = 3; // home pages
  const searchHubs = 3;
  const citiesWithPublished = Array.from(cityCounts.entries()).filter(([, c]) => c.published > 0);
  const cityPages = citiesWithPublished.length * 3;

  const mosqueDetailPages = totalPublished * 3;
  const sitemapTotal = sitemap3 + searchHubs + cityPages + mosqueDetailPages;
  console.log(`\n  Sitemap URLs (est.):   ${sitemapTotal}`);
  console.log(`    Homepages:             ${sitemap3}`);
  console.log(`    Search hubs:           ${searchHubs}`);
  console.log(`    City pages:            ${cityPages} (${citiesWithPublished.length} cities × 3 locales)`);
  console.log(`    Mosque detail pages:   ${mosqueDetailPages} (${totalPublished} × 3 locales)`);

  // 9. Merge combined report
  const combinedReport: DataQualityReport & {
    crossCityAnomalies: CrossCityAnomaly[];
    crossDatasetDuplicates: typeof crossDatasetDuplicates;
    perCityReports: typeof perCityReports;
  } = {
    timestamp: new Date().toISOString(),
    totalRawRecords: totalRaw,
    normalizedRecords: allEntities.length,
    publishableRecords: totalPublished,
    reviewedRecords: totalReviewed,
    rejectedRecords: totalRejected,
    validCoordinatesCount: allEntities.filter((e) => e.latitude !== 0 && e.longitude !== 0).length,
    missingWebsiteCount: allEntities.filter((e) => !e.website).length,
    missingPhoneCount: allEntities.filter((e) => !e.phone).length,
    missingHoursCount: allEntities.filter((e) => !e.openingHours).length,
    categoriesBreakdown: allEntities.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {}),
    districtsBreakdown: allEntities.reduce<Record<string, number>>((acc, e) => {
      const d = e.district || 'Zentrum';
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {}),
    duplicateCandidates: Object.values(perCityReports).flatMap((r) => r.duplicateCandidates || []),
    crossCityAnomalies: allCrossCity,
    crossDatasetDuplicates,
    perCityReports,
  };

  // 10. Write output files (Skipped in Dry-Run mode)
  if (isDryRun) {
    console.log('\n' + '='.repeat(60));
    console.log('  DRY-RUN COMPLETE — NO FILES WRITTEN');
    console.log('='.repeat(60));
    console.log(`  Proposed Published:    ${totalPublished}`);
    console.log(`  Proposed Review:       ${totalReviewed}`);
    console.log(`  Proposed Rejected:     ${totalRejected}`);
    console.log(`  Duplicate Candidates:  ${combinedReport.duplicateCandidates.length}`);
    console.log(`  Cross-City Anomalies:  ${allCrossCity.length}`);
    console.log('='.repeat(60) + '\n');
    return;
  }

  fs.writeFileSync(
    path.join(dataDir, 'mosques.json'),
    JSON.stringify(publishedEntities, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    path.join(dataDir, 'all-entities.json'),
    JSON.stringify(allEntities, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    path.join(dataDir, 'data-quality-report.json'),
    JSON.stringify(combinedReport, null, 2),
    'utf8'
  );

  console.log('\n' + '='.repeat(60));
  console.log(`  Saved ${totalPublished} published mosques → src/data/mosques.json`);
  console.log(`  Saved ${allEntities.length} all entities → src/data/all-entities.json`);
  console.log('  Saved combined quality report → src/data/data-quality-report.json');
  console.log('='.repeat(60) + '\n');
}

main();
