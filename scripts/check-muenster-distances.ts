import * as fs from 'fs';
import * as path from 'path';

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

const ROOT = path.resolve(__dirname, '..');
const rawRecords = JSON.parse(fs.readFileSync(path.join(ROOT, 'muenster,germany.json'), 'utf8'));

console.log('Pairwise distances between Münster pins:');
for (let i = 0; i < rawRecords.length; i++) {
  for (let j = i + 1; j < rawRecords.length; j++) {
    const r1 = rawRecords[i];
    const r2 = rawRecords[j];
    const dist = getDistanceMeters(r1.location.lat, r1.location.lng, r2.location.lat, r2.location.lng);
    console.log(`${r1.title?.slice(0, 20)} <-> ${r2.title?.slice(0, 20)}: ${Math.round(dist)} m`);
  }
}
