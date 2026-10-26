import fs from 'fs';
const raw = JSON.parse(fs.readFileSync('freiburg,germany.json', 'utf8'));

raw.forEach((r: any, idx: number) => {
  console.log(`=== RAW RECORD #${idx+1} ===`);
  console.log('Keys:', Object.keys(r));
  console.log('title:', r.title);
  console.log('placeId:', r.placeId);
  console.log('category:', r.category);
  console.log('categories:', r.categories);
  console.log('url:', r.url);
  console.log('rating:', r.totalScore, r.reviewsCount, r.rating, r.reviews);
  if (r.reviews && r.reviews.length > 0) {
    console.log('Sample review text:', r.reviews.slice(0, 2).map((x: any) => typeof x === 'string' ? x : x.text || x.snippet));
  }
});
