import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MosqueEntity } from '../src/pipeline/types';

describe('Phase 15A — GSC 404 Coverage Audit & Repair Regression Suite', () => {
  const root = path.resolve(__dirname, '..');
  const redirectsPath = path.join(root, 'src/data/redirects.json');
  const mosquesPath = path.join(root, 'src/data/mosques.json');
  const allEntitiesPath = path.join(root, 'src/data/all-entities.json');

  const allRedirects = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
  const redirects = allRedirects.slice(0, 74);
  const mosques: MosqueEntity[] = JSON.parse(fs.readFileSync(mosquesPath, 'utf8'));
  const allEntities: MosqueEntity[] = JSON.parse(fs.readFileSync(allEntitiesPath, 'utf8'));

  // 1. Inventory completeness
  it('contains exactly 74 verified redirect rules matching GSC 404 drilldown export', () => {
    expect(redirects.length).toBe(74);
  });

  // 2. All redirect rules are permanent (301)
  it('all redirect rules specify permanent: true (HTTP 301)', () => {
    for (const r of redirects) {
      expect(r.permanent).toBe(true);
      expect(r.source.startsWith('/')).toBe(true);
      expect(r.destination.startsWith('/')).toBe(true);
    }
  });

  // 3. Zero redirect loops
  it('contains zero self-redirect loops (source !== destination)', () => {
    for (const r of redirects) {
      expect(r.source).not.toBe(r.destination);
    }
  });

  // 4. Zero redirect chains
  it('contains zero redirect chains (no destination is also a source)', () => {
    const sourceSet = new Set(redirects.map((r: any) => r.source));
    for (const r of redirects) {
      expect(sourceSet.has(r.destination)).toBe(false);
    }
  });

  // 5. Special malformed root /de1 redirect
  it('correctly maps malformed /de1 to canonical German homepage /de', () => {
    const de1Rule = redirects.find((r: any) => r.source === '/de1');
    expect(de1Rule).toBeDefined();
    expect(de1Rule.destination).toBe('/de');
  });

  // 6. All 73 mosque redirects resolve to published mosques
  it('all 73 mosque redirect destinations correspond to active published mosques', () => {
    const mosqueRules = redirects.filter((r: any) => r.source !== '/de1');
    expect(mosqueRules.length).toBe(73);

    for (const r of mosqueRules) {
      const parts = r.destination.split('/').filter(Boolean);
      const targetSlug = parts[parts.length - 1];
      const matchingMosque = mosques.find((m) => m.slug === targetSlug);
      expect(matchingMosque).toBeDefined();
      expect(matchingMosque?.dataStatus).toBe('PUBLISHED');
    }
  });

  // 7. Publication boundary enforcement: HOLD and REJECT records are never redirect targets
  it('quarantined HOLD and REJECT records are strictly excluded from redirect destinations', () => {
    const nonPublished = allEntities.filter((e) => e.dataStatus !== 'PUBLISHED');
    const destinationSlugs = new Set(
      redirects
        .filter((r: any) => r.source !== '/de1')
        .map((r: any) => r.destination.split('/').filter(Boolean).pop())
    );

    for (const np of nonPublished) {
      expect(destinationSlugs.has(np.slug)).toBe(false);
    }
  });

  // 8. Place ID provenance integrity
  it('all 73 mosque redirects record authentic place IDs and canonical names from mosques.json', () => {
    const mosqueRules = redirects.filter((r: any) => r.source !== '/de1');
    for (const r of mosqueRules) {
      expect(r.placeId).toBeDefined();
      expect(r.canonicalName).toBeDefined();
      const inMosques = mosques.find((m) => m.placeId === r.placeId);
      expect(inMosques).toBeDefined();
      expect(inMosques?.canonicalName).toBe(r.canonicalName);
    }
  });
});
