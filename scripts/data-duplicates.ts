/**
 * MoscheeAtlas — Duplicate Audit Script
 * Command: npm run data:duplicates
 *
 * Scans the published and staging dataset for:
 * - Level 1: Exact Place ID duplicates
 * - Level 2: Exact coordinate duplicates
 * - Level 3: Address + strong name match
 * - Level 4: Phone + strong name match
 * - Level 5: Fuzzy candidates
 * - Co-located entities
 *
 * Displays transparent explainable evidence for each candidate.
 */

import fs from 'fs';
import path from 'path';
import { MosqueEntity, DuplicateCandidate } from '../src/pipeline/types';
import { calculateDuplicateEvidence } from '../src/pipeline/deduplicate';

function main() {
  console.log('\n' + '='.repeat(65));
  console.log('   MOSCHEEATLAS — DUPLICATE AUDIT REPORT');
  console.log('='.repeat(65) + '\n');

  const rootDir = path.resolve(__dirname, '..');
  const mosquesPath = path.join(rootDir, 'src', 'data', 'mosques.json');
  const allPath = path.join(rootDir, 'src', 'data', 'all-entities.json');

  const published: MosqueEntity[] = JSON.parse(fs.readFileSync(mosquesPath, 'utf8'));
  const all: MosqueEntity[] = JSON.parse(fs.readFileSync(allPath, 'utf8'));

  console.log(`Scanning ${published.length} published records across ${all.length} total entities for duplicates...\n`);

  const exactDups: any[] = [];
  const probableDups: any[] = [];
  const colocated: any[] = [];
  const fuzzyCandidates: any[] = [];

  // Pairwise duplicate detection
  for (let i = 0; i < published.length; i++) {
    for (let j = i + 1; j < published.length; j++) {
      const a = published[i];
      const b = published[j];

      // Convert to comparison format
      const recA = {
        title: a.canonicalName,
        phone: a.phone,
        address: a.address,
        location: { lat: a.latitude, lng: a.longitude },
        placeId: a.placeId,
      };
      const recB = {
        title: b.canonicalName,
        phone: b.phone,
        address: b.address,
        location: { lat: b.latitude, lng: b.longitude },
        placeId: b.placeId,
      };

      if (a.placeId && b.placeId && a.placeId === b.placeId) {
        exactDups.push({ a: a.canonicalName, b: b.canonicalName, placeId: a.placeId, evidence: 'Exact placeId match' });
        continue;
      }

      const { score, evidence } = calculateDuplicateEvidence(recA, recB);

      if (evidence.distanceMeters <= 5 && evidence.nameSimilarity >= 0.85) {
        probableDups.push({ a: a.canonicalName, b: b.canonicalName, city: a.city, score, evidence: evidence.explanation });
      } else if (evidence.phoneMatch && evidence.nameSimilarity >= 0.7) {
        probableDups.push({ a: a.canonicalName, b: b.canonicalName, city: a.city, score, evidence: evidence.explanation });
      } else if (evidence.addressMatch || evidence.distanceMeters <= 60) {
        colocated.push({ a: a.canonicalName, b: b.canonicalName, city: a.city, address: a.address, distance: `${evidence.distanceMeters}m`, evidence: evidence.explanation });
      } else if (evidence.nameSimilarity >= 0.85 && a.city.toLowerCase() === b.city.toLowerCase()) {
        fuzzyCandidates.push({ a: a.canonicalName, b: b.canonicalName, city: a.city, score, evidence: evidence.explanation });
      }
    }
  }

  console.log(`Exact Duplicate IDs:            ${exactDups.length}`);
  console.log(`Probable Unmerged Duplicates:   ${probableDups.length}`);
  console.log(`Co-Located Organizations:       ${colocated.length}`);
  console.log(`Fuzzy Review Candidates:        ${fuzzyCandidates.length}`);

  if (exactDups.length > 0) {
    console.log('\n--- EXACT DUPLICATES (CRITICAL) ---');
    exactDups.forEach((d) => console.log(`  [EXACT] ${d.a} <-> ${d.b} (${d.placeId})`));
  }

  if (probableDups.length > 0) {
    console.log('\n--- PROBABLE DUPLICATES ---');
    probableDups.forEach((d) => console.log(`  [PROBABLE] [${d.city}] ${d.a} <-> ${d.b} | ${d.evidence}`));
  }

  if (colocated.length > 0) {
    console.log(`\n--- CO-LOCATED ORGANIZATIONS (First 5 of ${colocated.length}) ---`);
    colocated.slice(0, 5).forEach((c) => {
      console.log(`  [CO-LOCATED] [${c.city}] "${c.a}" & "${c.b}" at ${c.address} (${c.distance})`);
      console.log(`               Evidence: ${c.evidence}`);
    });
  }

  if (fuzzyCandidates.length > 0) {
    console.log(`\n--- FUZZY CANDIDATES FOR REVIEW (First 5 of ${fuzzyCandidates.length}) ---`);
    fuzzyCandidates.slice(0, 5).forEach((f) => {
      console.log(`  [FUZZY] [${f.city}] "${f.a}" & "${f.b}" (Score: ${f.score})`);
      console.log(`          Evidence: ${f.evidence}`);
    });
  }

  console.log('\n✅ Duplicate audit complete.\n');
}

main();
