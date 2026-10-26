import fs from 'fs';
const raw = JSON.parse(fs.readFileSync('luebeck,germany.json', 'utf8'));
console.log('Total raw records:', raw.length);
raw.forEach((r: any, idx: number) => {
  console.log(`\n--- Record ${idx + 1} ---`);
  console.log('Place ID:', r.placeId);
  console.log('Title:', r.title);
  console.log('Address:', r.address);
  console.log('Street:', r.street);
  console.log('Postal Code:', r.postalCode);
  console.log('Phone:', r.phone || 'NONE');
  console.log('Website:', r.website || 'NONE');
  console.log('Category:', r.categoryName);
  console.log('Coords:', r.location?.lat, r.location?.lng);
  console.log('Reviews count:', r.reviewsCount);
});
