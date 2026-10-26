import fs from 'fs';
import path from 'path';
import { RawGooglePlaceRecord } from '../src/pipeline/types';

const raw: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync('saarbruecken,germany.json', 'utf8'));

raw.forEach((r, i) => {
  console.log(`\n============================================================`);
  console.log(`[RECORD ${i + 1}] ${r.title}`);
  console.log(`============================================================`);
  console.log(`Place ID: ${r.placeId}`);
  console.log(`Address: ${r.address}`);
  console.log(`Street: ${r.street} | Postal: ${r.postalCode} | City: ${r.city}`);
  console.log(`Location: ${r.location?.lat}, ${r.location?.lng}`);
  console.log(`Phone: "${r.phone}"`);
  console.log(`Website: "${r.website}"`);
  console.log(`Categories: ${JSON.stringify(r.categories)}`);
  console.log(`Reviews Count: ${r.reviewsCount} | Rating: ${r.totalScore}`);
  console.log(`Opening Hours (${r.openingHours?.length || 0}):`, r.openingHours);
  console.log(`Owner Description:`, (r as any).ownerDescription);
  console.log(`Additional Info:`, JSON.stringify(r.additionalInfo));
  const rawReviews = (r as any).reviews;
  if (rawReviews && rawReviews.length > 0) {
    console.log(`Reviews (${rawReviews.length}):`);
    rawReviews.forEach((rev: any, ri: number) => {
      console.log(`  [Review ${ri + 1}] (${rev.stars}★, ${rev.publishAt}) ${rev.text ? rev.text.replace(/\n/g, ' ') : '[No text]'}`);
    });
  }
});
