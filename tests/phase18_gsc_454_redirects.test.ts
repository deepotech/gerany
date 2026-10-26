import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MosqueEntity } from '../src/pipeline/types';
import { CITY_CONFIGS } from '../src/pipeline/city-config';

describe('Phase 18 — Comprehensive 454 GSC Redirects & 404 Health Suite', () => {
  const root = path.resolve(__dirname, '..');
  const redirectsPath = path.join(root, 'src/data/redirects.json');
  const mosquesPath = path.join(root, 'src/data/mosques.json');
  const allEntitiesPath = path.join(root, 'src/data/all-entities.json');

  const redirects = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
  const mosques: MosqueEntity[] = JSON.parse(fs.readFileSync(mosquesPath, 'utf8'));
  const allEntities: MosqueEntity[] = JSON.parse(fs.readFileSync(allEntitiesPath, 'utf8'));

  // 1. Total count
  it('contains exactly 454 redirect rules', () => {
    expect(redirects.length).toBe(454);
  });

  // 2. Uniqueness
  it('contains 454 unique sources with zero duplicates', () => {
    const sources = redirects.map((r: any) => r.source);
    const uniqueSources = new Set(sources);
    expect(uniqueSources.size).toBe(454);
  });

  // 3. Permanent flag
  it('all rules specify permanent: true with valid leading slashes', () => {
    for (const r of redirects) {
      expect(r.permanent).toBe(true);
      expect(r.source.startsWith('/')).toBe(true);
      expect(r.destination.startsWith('/')).toBe(true);
    }
  });

  // 4. Zero loops
  it('contains zero self-redirect loops', () => {
    for (const r of redirects) {
      expect(r.source).not.toBe(r.destination);
    }
  });

  // 5. Zero chains
  it('contains zero redirect chains', () => {
    const sourceSet = new Set(redirects.map((r: any) => r.source));
    for (const r of redirects) {
      expect(sourceSet.has(r.destination)).toBe(false);
    }
  });

  // 6. Root landing redirects
  it('correctly maps malformed root locales /de1 and /ar1 to canonical roots', () => {
    const de1 = redirects.find((r: any) => r.source === '/de1');
    const ar1 = redirects.find((r: any) => r.source === '/ar1');
    expect(de1).toBeDefined();
    expect(de1.destination).toBe('/de');
    expect(ar1).toBeDefined();
    expect(ar1.destination).toBe('/ar');
  });

  // 7. City collection redirects
  it('all 11 city collection redirects map to active published cities with valid locale routes', () => {
    const cityRules = redirects.filter((r: any) => 
      r.source.includes('/moscheen/') || r.source.includes('/mosques/')
    );
    expect(cityRules.length).toBe(11);

    for (const r of cityRules) {
      const parts = r.destination.split('/').filter(Boolean);
      const loc = parts[0];
      const citySlug = parts[2];
      const cfg = CITY_CONFIGS.find(
        (c) => c.slug === citySlug || c.englishSlug === citySlug
      );
      expect(cfg).toBeDefined();
      if (loc === 'de') {
        expect(parts[1]).toBe('moscheen');
      } else {
        expect(parts[1]).toBe('mosques');
      }
    }
  });

  // 8. Mosque detail redirects
  it('all 441 mosque detail redirects map to published mosques in mosques.json', () => {
    const detailRules = redirects.filter((r: any) => 
      r.source !== '/de1' && r.source !== '/ar1' &&
      !r.source.includes('/moscheen/') && !r.source.includes('/mosques/')
    );
    expect(detailRules.length).toBe(441);

    for (const r of detailRules) {
      expect(r.placeId).toBeDefined();
      expect(r.canonicalName).toBeDefined();
      const mosque = mosques.find((m) => (m.id || m.placeId) === r.placeId);
      expect(mosque).toBeDefined();
      expect(mosque?.dataStatus).toBe('PUBLISHED');
      const targetSlug = r.destination.split('/').filter(Boolean).pop();
      expect(targetSlug).toBe(mosque?.slug);
    }
  });

  // 9. Quarantine boundary
  it('strictly excludes quarantined and non-published entities from all redirect destinations', () => {
    const nonPublishedPlaceIds = new Set(
      allEntities.filter((e) => e.dataStatus !== 'PUBLISHED').map((e) => e.id || e.placeId)
    );

    for (const r of redirects) {
      if (r.placeId) {
        expect(nonPublishedPlaceIds.has(r.placeId)).toBe(false);
      }
    }
  });
});
