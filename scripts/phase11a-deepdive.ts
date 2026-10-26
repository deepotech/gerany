import fs from 'fs';
import path from 'path';
import { RawGooglePlaceRecord } from '../src/pipeline/types';

const ROOT = process.cwd();

function inspectRecord(file: string, query: (r: RawGooglePlaceRecord) => boolean, label: string) {
  const filePath = path.join(ROOT, file);
  const records: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const found = records.filter(query);
  console.log(`\n======================================================`);
  console.log(`DEEP DIVE: ${label} (${file})`);
  console.log(`Matches found: ${found.length}`);
  for (const r of found) {
    console.log(`- Title: "${r.title}"`);
    console.log(`  Place ID: ${r.placeId}`);
    console.log(`  Address: "${r.address}"`);
    console.log(`  Street: "${r.street}"`);
    console.log(`  Postal Code: "${r.postalCode}"`);
    console.log(`  City: "${r.city}"`);
    console.log(`  Coordinates: lat=${r.location?.lat}, lng=${r.location?.lng}`);
    console.log(`  Categories: ${JSON.stringify(r.categories)}`);
    console.log(`  CategoryName: "${r.categoryName}"`);
    console.log(`  Phone: "${r.phone}"`);
    console.log(`  Website: "${r.website}"`);
    console.log(`  Reviews count: ${r.reviewsCount}`);
    console.log(`  Opening hours: ${r.openingHours ? JSON.stringify(r.openingHours) : 'None'}`);
    const rawAny = r as any;
    if (rawAny.reviews && rawAny.reviews.length > 0) {
      console.log(`  Reviews sample:`);
      rawAny.reviews.slice(0, 3).forEach((rev: any, idx: number) => {
        console.log(`    [Review ${idx + 1}] "${rev.text?.slice(0, 150)}..." (Rating: ${rev.rating})`);
      });
    }
  }
}

// 1. Mainz: Türk Fedarasyonu Mainz Ülkü Ocağı
inspectRecord('mainz,germany.json', r => r.placeId === 'ChIJD8H9MUuXvUcR7RJCG3BoK5s' || /ülkü/i.test(r.title || ''), 'Mainz - Türk Fedarasyonu Mainz Ülkü Ocağı');

// 2. Bielefeld: Afrikanische Islamische Kultur Verein
inspectRecord('bielefeld,germany.json', r => r.placeId === 'ChIJffIr0Zk9ukcRguMGRgL-vzc' || /afrikanisch/i.test(r.title || ''), 'Bielefeld - Afrikanische Islamische Kultur Verein');

// 3. Aachen: Masjid As-Sunnah
inspectRecord('aachen,germany.json', r => r.placeId === 'ChIJe_pj22eZwEcRTuI3E3h_3jg' || /sunnah/i.test(r.title || ''), 'Aachen - Masjid As-Sunnah');

// 4. Münster: Palace Square Prayer Room
inspectRecord('muenster,germany.json', r => r.placeId === 'ChIJd58rTou7uUcRllSptiif6u0' || /palace/i.test(r.title || '') || /schloss/i.test(r.title || ''), 'Münster - Palace Square Prayer Room');

// 5. Postal boundary check between Wiesbaden and Mainz
console.log(`\n======================================================`);
console.log(`DEEP DIVE: Mainz & Wiesbaden Postal Boundary Check (55246 & 55252)`);
const mainzRecords: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(path.join(ROOT, 'mainz,germany.json'), 'utf8'));
const wiesbadenRecords: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(path.join(ROOT, 'wiesbaden,germany.json'), 'utf8'));

const mainzCodes552xx = mainzRecords.filter(r => (r.postalCode && (r.postalCode.startsWith('55246') || r.postalCode.startsWith('55252'))) || (r.address && (r.address.includes('55246') || r.address.includes('55252'))));
console.log(`Mainz records with 55246 or 55252: ${mainzCodes552xx.length}`);
if (mainzCodes552xx.length > 0) {
  mainzCodes552xx.forEach(r => console.log(`  - ${r.title} (${r.address})`));
}

const wiesbadenCodes552xx = wiesbadenRecords.filter(r => (r.postalCode && (r.postalCode.startsWith('55246') || r.postalCode.startsWith('55252'))) || (r.address && (r.address.includes('55246') || r.address.includes('55252'))));
console.log(`Wiesbaden records with 55246 or 55252: ${wiesbadenCodes552xx.length}`);
wiesbadenCodes552xx.forEach(r => console.log(`  - ${r.title} (Postal: ${r.postalCode}, Address: ${r.address})`));
