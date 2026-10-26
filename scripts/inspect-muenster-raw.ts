#!/usr/bin/env npx tsx
/**
 * Detailed inspection of all 8 records in muenster,germany.json
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const rawRecords = JSON.parse(fs.readFileSync(path.join(ROOT, 'muenster,germany.json'), 'utf8'));

console.log(`Loaded ${rawRecords.length} Münster records.\n`);

rawRecords.forEach((r: any, idx: number) => {
  console.log(`================================================================`);
  console.log(`RECORD ${idx + 1}: ${r.title || r.name}`);
  console.log(`Place ID: ${r.placeId || r.place_id}`);
  console.log(`Category: ${r.categoryName || r.categories?.join(', ')}`);
  console.log(`Address: ${r.address || r.street || r.vicinity}`);
  console.log(`Street: ${r.street}`);
  console.log(`Postal Code: ${r.postalCode}`);
  console.log(`City: ${r.city}, State: ${r.state}, Country: ${r.countryCode}`);
  console.log(`Location: Lat ${r.location?.lat}, Lng ${r.location?.lng}`);
  console.log(`Plus Code: ${r.plusCode}`);
  console.log(`Phone: ${r.phone}`);
  console.log(`URL/Website: ${r.url}`);
  console.log(`Website: ${r.website}`);
  console.log(`Reviews Count: ${r.reviewsCount}`);
  console.log(`Opening Hours: ${JSON.stringify(r.openingHours)}`);
  console.log(`Description: ${r.description}`);
  console.log(`Additional Info: ${JSON.stringify(r.additionalInfo)}`);
  if (r.reviews && r.reviews.length > 0) {
    console.log(`First 2 reviews sample:`);
    r.reviews.slice(0, 2).forEach((rev: any, revIdx: number) => {
      console.log(`  [Review ${revIdx + 1}] Stars: ${rev.stars}, Text: ${rev.text?.slice(0, 150)}...`);
    });
  }
  console.log();
});
