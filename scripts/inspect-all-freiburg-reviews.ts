import fs from 'fs';
const raw: any[] = JSON.parse(fs.readFileSync('freiburg,germany.json', 'utf8'));

raw.forEach((r, i) => {
  console.log(`\n============================================================`);
  console.log(`#${i+1}: ${r.title} | ${r.placeId}`);
  console.log(`Address: ${r.address}`);
  console.log(`Categories: ${JSON.stringify(r.categories)}`);
  console.log(`Phone: ${r.phone || 'none'} | Web: ${r.website || 'none'}`);
  console.log(`Reviews Count: ${r.reviewsCount || 0}`);
  if (r.reviews && r.reviews.length > 0) {
    console.log(`Sample Reviews:`);
    r.reviews.forEach((rv: any, rIdx: number) => {
      if (rv.text && rIdx < 5) {
        console.log(`  - [${rv.stars}★] ${rv.name}: "${rv.text.replace(/\n/g, ' ')}"`);
      }
    });
  }
});
