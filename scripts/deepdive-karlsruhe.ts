import fs from 'fs';
import { runPipeline } from '../src/pipeline/runner';

console.log('--- KARLSRUHE RECORDS DEEP DIVE ---');
const rawKarlsruhe = JSON.parse(fs.readFileSync('karlsruhe,germany.json', 'utf8'));
const resKarlsruhe = runPipeline(rawKarlsruhe, 'Karlsruhe', { dryRun: true, includeExtendedCities: true });
resKarlsruhe.allEntities.forEach((e, i) => {
  console.log(`#${i+1} [${e.dataStatus}] ${e.canonicalName} (${e.placeId})`);
  console.log(`   Address: ${e.address}`);
  console.log(`   Phone: ${e.phone} | Web: ${e.website}`);
  console.log(`   Rating: ${e.rating} (${e.reviewCount} reviews)`);
  if (e.reviewReason) console.log(`   HOLD Reason: ${e.reviewReason}`);
  if (e.rejectionReason) console.log(`   REJECT Reason: ${e.rejectionReason}`);
});
