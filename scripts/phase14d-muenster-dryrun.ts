#!/usr/bin/env npx tsx
/**
 * Phase 14D — Münster Dry-Run Pipeline
 * Runs normalization + classification + quality checks against muenster,germany.json
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

const rawPath = path.join(ROOT, 'muenster,germany.json');
const rawRecords: any[] = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

console.log(`\n=== Phase 14D — Münster Dry-Run Pipeline ===`);
console.log(`Raw records loaded: ${rawRecords.length}\n`);

const mosques: any[] = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/mosques.json'), 'utf8'));
const publishedIds = new Set(mosques.map((m: any) => m.placeId));

const allEntities: any[] = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/all-entities.json'), 'utf8'));
const entityMap = new Map(allEntities.map((e: any) => [e.placeId, e]));

const GERMAN_POSTAL_RE = /^[0-9]{5}$/;
const PLACEHOLDER_PHONES = ['+49 123123456123456', '123456', '+491234567890'];

function isValidGermanPostal(code: string | undefined | null): boolean {
  if (!code) return false;
  return GERMAN_POSTAL_RE.test(String(code).trim());
}

function isPlaceholderPhone(phone: string | undefined | null): boolean {
  if (!phone) return false;
  return PLACEHOLDER_PHONES.some(p => phone.replace(/\s/g, '').includes(p.replace(/\s/g, '')));
}

function coordinatesInGermany(lat: number, lng: number): boolean {
  return lat >= 47.2 && lat <= 55.1 && lng >= 5.9 && lng <= 15.0;
}

interface RecordResult {
  name: string;
  placeId: string;
  postalCode: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  status: 'READY' | 'HOLD' | 'REJECT';
  holdReasons: string[];
  rejectReasons: string[];
  notes: string[];
  alreadyPublished: boolean;
  existingEntityStatus: string | null;
}

const results: RecordResult[] = [];

for (const rec of rawRecords) {
  const placeId: string = rec.placeId ?? rec.place_id ?? '';
  const name: string = rec.title ?? rec.name ?? '';
  const address: string = rec.address ?? rec.street ?? rec.vicinity ?? rec.formatted_address ?? '';
  
  let postalCode: string | null = rec.postalCode ?? null;
  if (!postalCode && Array.isArray(rec.address_components)) {
    const pc = rec.address_components.find((c: any) =>
      Array.isArray(c.types) && c.types.includes('postal_code')
    );
    if (pc) postalCode = pc.long_name ?? pc.short_name ?? null;
  }
  if (!postalCode && address) {
    const m = address.match(/\b(\d{5})\b/);
    if (m) postalCode = m[1];
  }

  const lat: number | null = rec.location?.lat ?? rec.geometry?.location?.lat ?? rec.lat ?? null;
  const lng: number | null = rec.location?.lng ?? rec.geometry?.location?.lng ?? rec.lng ?? null;
  const phone: string | null = rec.phone ?? rec.formatted_phone_number ?? rec.international_phone_number ?? null;
  const website: string | null = rec.url ?? rec.website ?? null;

  const holdReasons: string[] = [];
  const rejectReasons: string[] = [];
  const notes: string[] = [];

  const alreadyPublished = publishedIds.has(placeId);
  const existingEntity = entityMap.get(placeId);
  const existingEntityStatus: string | null = existingEntity?.dataStatus ?? null;

  if (alreadyPublished) {
    notes.push('Already in published dataset.');
  }

  if (!isValidGermanPostal(postalCode)) {
    holdReasons.push(`postalCode: Invalid or missing (got: ${JSON.stringify(postalCode)}). Must be a valid German 5-digit postal code.`);
  }

  if (lat === null || lng === null) {
    holdReasons.push('Coordinates: Missing lat/lng.');
  } else if (!coordinatesInGermany(lat, lng)) {
    rejectReasons.push(`Coordinates (${lat}, ${lng}) outside Germany bounding box.`);
  }

  if (phone && isPlaceholderPhone(phone)) {
    notes.push(`Phone "${phone}" detected as placeholder — will be nulled in normalized output.`);
  }

  let status: 'READY' | 'HOLD' | 'REJECT';
  if (rejectReasons.length > 0) {
    status = 'REJECT';
  } else if (holdReasons.length > 0) {
    status = 'HOLD';
  } else {
    status = 'READY';
  }

  results.push({
    name,
    placeId,
    postalCode,
    lat,
    lng,
    phone,
    website,
    address,
    status,
    holdReasons,
    rejectReasons,
    notes,
    alreadyPublished,
    existingEntityStatus,
  });
}

const ready = results.filter(r => r.status === 'READY');
const hold = results.filter(r => r.status === 'HOLD');
const reject = results.filter(r => r.status === 'REJECT');

console.log(`┌─────────────────────────────────────────────────────────────────┐`);
console.log(`│  Münster Dry-Run Summary                                        │`);
console.log(`├─────────────────────────────────────────────────────────────────┤`);
console.log(`│  Total raw records : ${String(results.length).padEnd(44)}│`);
console.log(`│  READY             : ${String(ready.length).padEnd(44)}│`);
console.log(`│  HOLD              : ${String(hold.length).padEnd(44)}│`);
console.log(`│  REJECT            : ${String(reject.length).padEnd(44)}│`);
console.log(`└─────────────────────────────────────────────────────────────────┘\n`);

for (const r of results) {
  console.log(`── [${r.status}] ${r.name}`);
  console.log(`   Place ID : ${r.placeId}`);
  console.log(`   Address  : ${r.address}`);
  console.log(`   Postal   : ${r.postalCode ?? '(missing)'}`);
  console.log(`   Coords   : ${r.lat}, ${r.lng}`);
  console.log(`   Phone    : ${r.phone ?? '(none)'}`);
  console.log(`   Website  : ${r.website ?? '(none)'}`);
  if (r.alreadyPublished) console.log(`   ⚠ Already published`);
  if (r.existingEntityStatus) console.log(`   Entity status: ${r.existingEntityStatus}`);
  for (const msg of r.holdReasons) console.log(`   HOLD   → ${msg}`);
  for (const msg of r.rejectReasons) console.log(`   REJECT → ${msg}`);
  for (const msg of r.notes) console.log(`   NOTE   → ${msg}`);
  console.log();
}

console.log(`\n=== READY records (${ready.length}) ===`);
for (const r of ready) {
  console.log(`  • ${r.placeId} | ${r.name} | ${r.postalCode} | (${r.lat}, ${r.lng})`);
}

console.log(`\n=== HOLD records (${hold.length}) ===`);
for (const r of hold) {
  console.log(`  • ${r.placeId} | ${r.name}`);
  for (const msg of r.holdReasons) console.log(`    → ${msg}`);
}

console.log(`\n=== REJECT records (${reject.length}) ===`);
for (const r of reject) {
  console.log(`  • ${r.placeId} | ${r.name}`);
  for (const msg of r.rejectReasons) console.log(`    → ${msg}`);
}
