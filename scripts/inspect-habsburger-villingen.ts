import fs from 'fs';
const raw: any[] = JSON.parse(fs.readFileSync('freiburg,germany.json', 'utf8'));

const herdern = raw.find(r => r.placeId === 'ChIJKwI2woYckUcRd9ll41_0lBs');
const ibad = raw.find(r => r.placeId === 'ChIJ-xg0xIYckUcRO6tsryi7_Tc');
const villingen = raw.find(r => r.placeId === 'ChIJiciOGQAbkUcRq_EXWX5w5og');

console.log('=== HABSBURGERSTRASSE 56A COMPARISON ===');
console.log('--- HERDERN ---');
console.log({
  title: herdern.title,
  placeId: herdern.placeId,
  address: herdern.address,
  street: herdern.street,
  postalCode: herdern.postalCode,
  location: herdern.location,
  phone: herdern.phone,
  website: herdern.website,
  categories: herdern.categories,
  reviewsCount: herdern.reviewsCount,
  reviews: herdern.reviews?.map((rv: any) => ({ text: rv.text, stars: rv.stars, name: rv.name, date: rv.publishedAtDate })),
  url: herdern.url
});

console.log('\n--- IBAD UR RAHMAN ---');
console.log({
  title: ibad.title,
  placeId: ibad.placeId,
  address: ibad.address,
  street: ibad.street,
  postalCode: ibad.postalCode,
  location: ibad.location,
  phone: ibad.phone,
  website: ibad.website,
  categories: ibad.categories,
  reviewsCount: ibad.reviewsCount,
  reviewsSample: ibad.reviews?.slice(0, 5).map((rv: any) => ({ text: rv.text, stars: rv.stars, name: rv.name, date: rv.publishedAtDate })),
  url: ibad.url
});

console.log('\n=== VILLINGEN DETAILS ===');
console.log({
  title: villingen.title,
  placeId: villingen.placeId,
  address: villingen.address,
  street: villingen.street,
  postalCode: villingen.postalCode,
  city: villingen.city,
  location: villingen.location,
  phone: villingen.phone,
  website: villingen.website,
  categories: villingen.categories,
  reviewsCount: villingen.reviewsCount,
  reviews: villingen.reviews,
  url: villingen.url,
  additionalInfo: villingen.additionalInfo
});
