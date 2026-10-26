import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const rawRecords = JSON.parse(fs.readFileSync(path.join(ROOT, 'muenster,germany.json'), 'utf8'));

for (let i = 1; i < rawRecords.length; i++) {
  const r = rawRecords[i];
  console.log(`\n================================================================`);
  console.log(`RECORD ${i + 1}: ${r.title} (${r.placeId})`);
  console.log(`Address: ${r.address} | PLZ: ${r.postalCode}`);
  console.log(`Phone: ${r.phone || '(none)'} | Web: ${r.website || r.url}`);
  console.log(`Reviews Count: ${r.reviewsCount}`);
  if (r.reviews && r.reviews.length > 0) {
    console.log(`Reviews (${r.reviews.length}):`);
    r.reviews.forEach((rev: any, idx: number) => {
      if (rev.text) {
        console.log(`  [${rev.stars}★] ${rev.text.replace(/\n/g, ' ').slice(0, 200)}`);
      }
    });
  }
}
