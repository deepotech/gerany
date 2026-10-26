import * as fs from 'fs';
import * as path from 'path';
import { runPipeline } from '../src/pipeline/runner';

const ROOT = path.resolve(__dirname, '..');
const rawRecords = JSON.parse(fs.readFileSync(path.join(ROOT, 'muenster,germany.json'), 'utf8'));

console.log('Running canonical runPipeline on Münster in dryRun mode...');
const result = runPipeline(rawRecords, 'Münster', { dryRun: true, includeExtendedCities: true });

console.log(`\nPublished count (if dryRun=false): ${result.publishedEntities.length}`);
console.log(`All entities count: ${result.allEntities.length}`);
console.log(`Quality report:`, JSON.stringify(result.report, null, 2));

console.log('\nEntity Breakdown:');
result.allEntities.forEach((e, idx) => {
  console.log(`[${idx + 1}] ${e.canonicalName} (${e.placeId})`);
  console.log(`    Status: ${e.dataStatus}`);
  console.log(`    Category: ${e.category}`);
  console.log(`    Address: ${e.address}`);
  console.log(`    PostalCode: ${e.postalCode}`);
  console.log(`    City: ${e.city}, District: ${e.district}`);
  console.log(`    Coords: (${e.latitude}, ${e.longitude})`);
  console.log(`    Phone: ${e.phone}`);
  console.log(`    Website: ${e.website}`);
  console.log(`    ReviewCount: ${e.reviewCount}, Rating: ${e.rating}`);
  console.log(`    Slug: ${e.slug}`);
});

if (result.crossCityAnomalies && result.crossCityAnomalies.length > 0) {
  console.log('\nCross City Anomalies:');
  console.log(result.crossCityAnomalies);
}
