import fs from 'fs';
import { runPipeline } from '../src/pipeline/runner';

console.log('--- MÜNSTER RECORDS DEEP DIVE ---');
const rawMuenster = JSON.parse(fs.readFileSync('muenster,germany.json', 'utf8'));
const resMuenster = runPipeline(rawMuenster, 'Münster', { dryRun: true, includeExtendedCities: true });
resMuenster.allEntities.forEach((e, i) => {
  console.log(`#${i+1} [${e.dataStatus}] ${e.canonicalName} (${e.placeId})`);
  console.log(`   Address: ${e.address}`);
  console.log(`   Phone: ${e.phone} | Web: ${e.website}`);
  console.log(`   Rating: ${e.rating} (${e.reviewCount} reviews)`);
  if (e.reviewReason) console.log(`   HOLD Reason: ${e.reviewReason}`);
  if (e.rejectionReason) console.log(`   REJECT Reason: ${e.rejectionReason}`);
});

console.log('\n--- REGENSBURG RECORDS DEEP DIVE ---');
const rawRegensburg = JSON.parse(fs.readFileSync('regensburg,germany.json', 'utf8'));
const resRegensburg = runPipeline(rawRegensburg, 'Regensburg', { dryRun: true, includeExtendedCities: true });
resRegensburg.allEntities.forEach((e, i) => {
  console.log(`#${i+1} [${e.dataStatus}] ${e.canonicalName} (${e.placeId})`);
  console.log(`   Address: ${e.address}`);
  console.log(`   Phone: ${e.phone} | Web: ${e.website}`);
  console.log(`   Rating: ${e.rating} (${e.reviewCount} reviews)`);
  if (e.reviewReason) console.log(`   HOLD Reason: ${e.reviewReason}`);
  if (e.rejectionReason) console.log(`   REJECT Reason: ${e.rejectionReason}`);
});
