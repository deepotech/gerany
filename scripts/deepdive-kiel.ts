import fs from 'fs';
import { runPipeline } from '../src/pipeline/runner';

const raw = JSON.parse(fs.readFileSync('kiel,germany.json', 'utf8'));
const res = runPipeline(raw, 'Kiel', { dryRun: true, includeExtendedCities: true });

console.log('--- KIEL RECORDS DEEP DIVE ---');
res.allEntities.forEach((e, i) => {
  console.log(`#${i+1} [${e.dataStatus}] ${e.canonicalName} (${e.placeId})`);
  console.log(`   Address: ${e.address}`);
  console.log(`   Phone: ${e.phone} | Web: ${e.website}`);
  console.log(`   Rating: ${e.rating} (${e.reviewCount} reviews)`);
  if (e.reviewReason) console.log(`   HOLD Reason: ${e.reviewReason}`);
  if (e.rejectionReason) console.log(`   REJECT Reason: ${e.rejectionReason}`);
});
