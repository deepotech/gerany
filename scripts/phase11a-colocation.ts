import fs from 'fs';
import path from 'path';
import { RawGooglePlaceRecord } from '../src/pipeline/types';

const ROOT = process.cwd();

const files = [
  'luebeck,germany.json',
  'saarbruecken,germany.json',
  'aachen,germany.json',
  'freiburg,germany.json',
  'kiel,germany.json',
  'mainz,germany.json',
  'regensburg,germany.json',
  'karlsruhe,germany.json',
  'augsburg,germany.json',
  'bielefeld,germany.json',
  'muenster,germany.json',
];

function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

console.log('=== CHECKING CO-LOCATED OR NEARBY PINS (< 25m) IN CANDIDATE FILES ===\n');

for (const f of files) {
  const records: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const suspiciousPairs: Array<{ r1: string; r2: string; dist: number; addr1: string; addr2: string }> = [];

  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      const r1 = records[i];
      const r2 = records[j];
      if (r1.location?.lat && r1.location?.lng && r2.location?.lat && r2.location?.lng) {
        const d = haversineDistanceMeters(r1.location.lat, r1.location.lng, r2.location.lat, r2.location.lng);
        if (d < 30) {
          suspiciousPairs.push({
            r1: r1.title || '',
            r2: r2.title || '',
            dist: Math.round(d),
            addr1: r1.address || '',
            addr2: r2.address || '',
          });
        }
      }
    }
  }

  if (suspiciousPairs.length > 0) {
    console.log(`[${f}] Found ${suspiciousPairs.length} co-located pairs (<30m):`);
    for (const p of suspiciousPairs) {
      console.log(`  - "${p.r1}" and "${p.r2}" (Distance: ${p.dist}m)`);
      console.log(`    Addr 1: ${p.addr1}`);
      console.log(`    Addr 2: ${p.addr2}`);
    }
  } else {
    console.log(`[${f}] 0 co-located pairs (<30m).`);
  }
}
