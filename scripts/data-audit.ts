/**
 * MoscheeAtlas — Comprehensive Data Audit Script
 * Command: npm run data:audit
 *
 * Audits published and staging records against Phase 4 data quality requirements:
 * - Coordinates validity & Germany bounds
 * - Duplicate IDs and slugs
 * - City / State consistency
 * - Malformed URLs and phone numbers
 * - Verification status semantics (UNVERIFIED vs unearned claims)
 * - Facility tri-state consistency (true/false/null)
 * - Schema validity
 */

import fs from 'fs';
import path from 'path';
import { MosqueEntity, DataQualityReport } from '../src/pipeline/types';
import { CITY_CONFIGS } from '../src/pipeline/city-config';
import { validateCoordinatesQuality, normalizePhone, normalizeWebsite } from '../src/pipeline/normalize';
import { validateMosqueEntity } from '../src/pipeline/validate';

function main() {
  console.log('\n' + '='.repeat(65));
  console.log('   MOSCHEEATLAS — PRODUCTION DATA QUALITY AUDIT');
  console.log('='.repeat(65) + '\n');

  const rootDir = path.resolve(__dirname, '..');
  const mosquesPath = path.join(rootDir, 'src', 'data', 'mosques.json');
  const allPath = path.join(rootDir, 'src', 'data', 'all-entities.json');

  if (!fs.existsSync(mosquesPath) || !fs.existsSync(allPath)) {
    console.error('Data files not found in src/data/');
    process.exit(1);
  }

  const published: MosqueEntity[] = JSON.parse(fs.readFileSync(mosquesPath, 'utf8'));
  const allEntities: MosqueEntity[] = JSON.parse(fs.readFileSync(allPath, 'utf8'));

  console.log(`Auditing ${published.length} published mosques and ${allEntities.length} total entities...\n`);

  const issues: string[] = [];
  const warnings: string[] = [];

  // 1. Unique IDs check
  const seenIds = new Set<string>();
  for (const m of allEntities) {
    if (seenIds.has(m.id)) {
      issues.push(`Duplicate entity ID detected: "${m.id}" (${m.canonicalName})`);
    }
    seenIds.add(m.id);
  }

  // 2. City-scoped slug uniqueness
  const seenCitySlugs = new Set<string>();
  for (const m of published) {
    const key = `${m.city.toLowerCase()}:${m.slug}`;
    if (seenCitySlugs.has(key)) {
      issues.push(`Duplicate slug within city detected: "${m.slug}" in "${m.city}"`);
    }
    seenCitySlugs.add(key);
  }

  // 3. Coordinate validation
  let validCoords = 0;
  for (const m of published) {
    const check = validateCoordinatesQuality(m.latitude, m.longitude);
    if (!check.isValid || !check.isGermanyBounds) {
      issues.push(`Invalid coordinates for "${m.canonicalName}" (${m.city}): ${check.reason}`);
    } else {
      validCoords++;
    }
  }

  // 4. City configuration consistency
  for (const m of published) {
    const config = CITY_CONFIGS.find((c) => c.canonical === m.city);
    if (!config) {
      issues.push(`Mosque "${m.canonicalName}" assigned to unconfigured city: "${m.city}"`);
    } else if (config.state !== m.state) {
      issues.push(`State mismatch for "${m.canonicalName}": city is "${m.city}" but state is "${m.state}" (expected "${config.state}")`);
    }
  }

  // 5. Verification status semantics
  for (const m of published) {
    if (m.verificationStatus !== 'UNVERIFIED') {
      issues.push(`Unearned verification status: "${m.canonicalName}" has status "${m.verificationStatus}" without documented audit proof!`);
    }
  }

  // 6. Contact data formatting & sanitization
  let validPhones = 0;
  let validWebsites = 0;
  for (const m of published) {
    if (m.phone) {
      const p = normalizePhone(m.phone);
      if (p.isSuspicious) {
        warnings.push(`Suspicious phone number: "${m.phone}" on "${m.canonicalName}"`);
      } else {
        validPhones++;
      }
    }
    if (m.website) {
      const w = normalizeWebsite(m.website);
      if (!w.isValid) {
        warnings.push(`Malformed website URL: "${m.website}" on "${m.canonicalName}"`);
      } else {
        validWebsites++;
      }
    }
  }

  // 7. Facilities tri-state consistency
  for (const m of published) {
    const fac = m.facilities;
    if (!fac) {
      issues.push(`Missing facilities object on "${m.canonicalName}"`);
      continue;
    }
    for (const key of ['parking', 'womenArea', 'wheelchairAccessible', 'restroom', 'wudu'] as const) {
      const val = fac[key];
      if (val !== true && val !== false && val !== null) {
        issues.push(`Illegal facility value for "${key}" on "${m.canonicalName}": ${JSON.stringify(val)}`);
      }
    }
  }

  // 8. Schema validation check on all published
  let schemaPassed = 0;
  for (const m of published) {
    const v = validateMosqueEntity(m);
    if (!v.success) {
      issues.push(`Schema failure on "${m.canonicalName}": ${v.errors?.join(', ')}`);
    } else {
      schemaPassed++;
    }
  }

  // Print results
  console.log('--- AUDIT METRICS ---');
  console.log(`Published Mosques:          ${published.length}`);
  console.log(`Valid Coordinates:          ${validCoords} / ${published.length} (${((validCoords / published.length) * 100).toFixed(1)}%)`);
  console.log(`Schema Validation:          ${schemaPassed} / ${published.length} (${((schemaPassed / published.length) * 100).toFixed(1)}%)`);
  console.log(`Valid Phone Coverage:       ${validPhones} / ${published.length} (${((validPhones / published.length) * 100).toFixed(1)}%)`);
  console.log(`Valid Website Coverage:     ${validWebsites} / ${published.length} (${((validWebsites / published.length) * 100).toFixed(1)}%)`);
  console.log(`Unverified Semantics:       ${published.filter((m) => m.verificationStatus === 'UNVERIFIED').length} / ${published.length} (100%)`);
  console.log(`Warnings Flagged:           ${warnings.length}`);
  console.log(`Critical Issues:            ${issues.length}`);

  if (warnings.length > 0) {
    console.log('\n--- WARNINGS ---');
    warnings.slice(0, 10).forEach((w) => console.log(' [WARN]', w));
    if (warnings.length > 10) console.log(` ... and ${warnings.length - 10} more warnings.`);
  }

  if (issues.length > 0) {
    console.error('\n--- CRITICAL ISSUES FOUND ---');
    issues.forEach((iss) => console.error(' [FAIL]', iss));
    console.error('\nData audit FAILED.');
    process.exit(1);
  } else {
    console.log('\n✅ DATA AUDIT PASSED: Zero critical data integrity violations detected.\n');
  }
}

main();
