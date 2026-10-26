import fs from 'fs';
import path from 'path';
import { runPipeline } from '../src/pipeline/runner';
import { getPublishedCityConfigs, CITY_CONFIGS, EXTENDED_CITY_CONFIGS } from '../src/pipeline/city-config';
import { getCityRegistryEntry } from '../src/pipeline/city-registry';
import { MosqueEntity, RawGooglePlaceRecord } from '../src/pipeline/types';

const ROOT = process.cwd();
const RAW_FILE = path.join(ROOT, 'freiburg,germany.json');
const MOSQUES_FILE = path.join(ROOT, 'src', 'data', 'mosques.json');
const ALL_ENTITIES_FILE = path.join(ROOT, 'src', 'data', 'all-entities.json');

const rawList: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(RAW_FILE, 'utf8'));
const publishedMosques: MosqueEntity[] = JSON.parse(fs.readFileSync(MOSQUES_FILE, 'utf8'));
const allEntities: MosqueEntity[] = JSON.parse(fs.readFileSync(ALL_ENTITIES_FILE, 'utf8'));

console.log('=== FREIBURG RAW DATA INSPECTION ===');
console.log('Total records in freiburg,germany.json:', rawList.length);

// Check if any record is already in published or all-entities
const inPublished = rawList.filter(r => r.placeId && publishedMosques.some(m => m.placeId === r.placeId));
const inAllEntities = rawList.filter(r => r.placeId && allEntities.some(e => e.placeId === r.placeId));
console.log('Already in mosques.json:', inPublished.length);
console.log('Already in all-entities.json:', inAllEntities.length);

// City config & registry check
const freiburgExt = EXTENDED_CITY_CONFIGS.find(c => c.slug === 'freiburg');
const freiburgInCity = CITY_CONFIGS.find(c => c.slug === 'freiburg');
const freiburgReg = getCityRegistryEntry('freiburg');
console.log('\n--- Freiburg Registry & Config ---');
console.log('In CITY_CONFIGS:', !!freiburgInCity);
console.log('In EXTENDED_CITY_CONFIGS:', !!freiburgExt);
console.log('EXTENDED_CITY_CONFIGS entry:', JSON.stringify(freiburgExt, null, 2));
console.log('City Registry entry:', JSON.stringify(freiburgReg, null, 2));

// Run pipeline dry run
const pipeResult = runPipeline(rawList, 'Freiburg im Breisgau', { dryRun: true, includeExtendedCities: true });

console.log('\n--- Pipeline Dry Run Results ---');
console.log('Published eligible:', pipeResult.publishedEntities.length);
console.log('All entities processed:', pipeResult.allEntities.length);
console.log('Anomalies flagged:', pipeResult.crossCityAnomalies.length);

// Haversine distance helper
function haversineDistM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)*Math.sin(dLon/2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// Distance between Habsburgerstraße 56a records
const herdern = rawList.find(r => r.placeId === 'ChIJKwI2woYckUcRd9ll41_0lBs');
const ibad = rawList.find(r => r.placeId === 'ChIJ-xg0xIYckUcRO6tsryi7_Tc');
if (herdern && ibad && herdern.location?.lat && herdern.location?.lng && ibad.location?.lat && ibad.location?.lng) {
  const dist = haversineDistM(herdern.location.lat, herdern.location.lng, ibad.location.lat, ibad.location.lng);
  console.log(`\nDistance between Herdern Mosque and Ibad ur Rahman: ${dist} meters`);
}

// Full dump of each record
console.log('\n=== RECORD-BY-RECORD AUDIT DETAILS ===');
rawList.forEach((r: any, idx) => {
  const entity = pipeResult.allEntities[idx];
  console.log(`\n------------------------------------------------------------`);
  console.log(`Record #${idx + 1}: ${r.title}`);
  console.log(`Place ID: ${r.placeId}`);
  console.log(`Raw Address: ${r.address}`);
  console.log(`Normalized Address: ${entity?.address}`);
  console.log(`Postal Code: ${entity?.postalCode} | District: ${entity?.district}`);
  console.log(`Coordinates: lat=${r.location?.lat}, lng=${r.location?.lng}`);
  console.log(`Phone: raw="${r.phone}" -> normalized="${entity?.phone}"`);
  console.log(`Website: raw="${r.website}" -> normalized="${entity?.website}"`);
  console.log(`Opening Hours: ${JSON.stringify(r.openingHours)}`);
  console.log(`Rating: ${r.rating} (${r.reviewsCount || 0} reviews)`);
  console.log(`Category: ${r.category || (r as any).categories?.join(', ')}`);
  console.log(`Description / Snippet: ${(r as any).description || 'none'}`);
  console.log(`Pipeline Status: ${entity?.dataStatus}`);
  if (entity?.reviewReason) console.log(`Review Reason: ${entity.reviewReason}`);
  if (entity?.rejectionReason) console.log(`Rejection Reason: ${entity.rejectionReason}`);
});
