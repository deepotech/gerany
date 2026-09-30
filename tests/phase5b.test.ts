import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CITY_CONFIGS, getPublishedCityConfigs, resolveCanonicalCity } from '../src/pipeline/city-config';
import {
  getCityLifecycleStatus,
  isPublishedCity,
  getCityRegistryEntry,
  getPublishedCityRegistryEntries
} from '../src/pipeline/city-registry';
import { validateCityForLaunch } from '../src/pipeline/city-gates';
import { JsonMosqueRepository } from '../src/lib/db/json-repository';
import sitemap from '../src/app/sitemap';

describe('Phase 5B: Real Data Import & Controlled City Launch', () => {
  const rootDir = path.resolve(__dirname, '..');
  const mosquesPath = path.join(rootDir, 'src', 'data', 'mosques.json');
  const allPath = path.join(rootDir, 'src', 'data', 'all-entities.json');

  const mosques: any[] = JSON.parse(fs.readFileSync(mosquesPath, 'utf8'));
  const allEntities: any[] = JSON.parse(fs.readFileSync(allPath, 'utf8'));

  // 1. Production count integrity
  it('total published records is exactly 542 (443 baseline + 99 from 5 promoted cities)', () => {
    expect(mosques.length).toBe(542);
  });

  // 2. Original 9 cities baseline preserved
  it('preserves all original 443 records in the base 9 cities', () => {
    const baseCities = ['Berlin', 'Hamburg', 'München', 'Frankfurt', 'Dortmund', 'Köln', 'Stuttgart', 'Düsseldorf', 'Essen'];
    const baseCounts: Record<string, number> = {
      Berlin: 104,
      Hamburg: 65,
      München: 54,
      Frankfurt: 50,
      Dortmund: 50,
      Köln: 39,
      Stuttgart: 27,
      Düsseldorf: 27,
      Essen: 27,
    };

    for (const [city, count] of Object.entries(baseCounts)) {
      const actual = mosques.filter(m => m.city === city).length;
      expect(actual).toBe(count);
    }
  });

  // 3. Exactly 5 cities promoted
  it('has promoted exactly 5 candidate cities to PUBLISHED', () => {
    const promotedCandidateCities = ['Bremen', 'Wuppertal', 'Bonn', 'Nürnberg', 'Leipzig'];
    for (const city of promotedCandidateCities) {
      const count = mosques.filter(m => m.city === city).length;
      expect(count).toBeGreaterThan(0);
    }
  });

  // 4. Promoted city counts match expected
  it('promoted cities have expected published counts', () => {
    expect(mosques.filter(m => m.city === 'Bremen').length).toBe(37);
    expect(mosques.filter(m => m.city === 'Wuppertal').length).toBe(24);
    expect(mosques.filter(m => m.city === 'Bonn').length).toBe(14);
    expect(mosques.filter(m => m.city === 'Nürnberg').length).toBe(18);
    expect(mosques.filter(m => m.city === 'Leipzig').length).toBe(6);
  });

  // 5. Exactly 5 cities NOT promoted
  it('retains 5 cities in unpromoted status (0 records in mosques.json)', () => {
    const unpromotedCities = ['Hannover', 'Duisburg', 'Bochum', 'Mannheim', 'Dresden'];
    for (const city of unpromotedCities) {
      const inMosques = mosques.filter(m => m.city === city).length;
      expect(inMosques).toBe(0);
    }
  });

  // 6. Verification semantics: 100% UNVERIFIED
  it('100% of all published records have verificationStatus = UNVERIFIED', () => {
    const nonUnverified = mosques.filter(m => m.verificationStatus !== 'UNVERIFIED');
    expect(nonUnverified.length).toBe(0);
  });

  // 7. Trust semantics: null != false for facilities
  it('preserves null facilities semantics (unknown != false)', () => {
    const newlyAdded = mosques.filter(m => ['Bremen', 'Wuppertal', 'Bonn', 'Nürnberg', 'Leipzig'].includes(m.city));
    expect(newlyAdded.length).toBe(99);
    // Across 99 newly added records, facilities must have null values rather than being all defaulted to false
    let hasNullFacility = false;
    for (const m of newlyAdded) {
      if (m.facilities) {
        if (m.facilities.parking === null || m.facilities.womenArea === null || m.facilities.wheelchairAccessible === null) {
          hasNullFacility = true;
          break;
        }
      }
    }
    expect(hasNullFacility).toBe(true);
  });

  // 8. No fabricated prayer times
  it('does not fabricate prayer times for newly ingested records', () => {
    const newlyAdded = mosques.filter(m => ['Bremen', 'Wuppertal', 'Bonn', 'Nürnberg', 'Leipzig'].includes(m.city));
    for (const m of newlyAdded) {
      expect(m.prayerTimes).toBeUndefined();
    }
  });

  // 9. No third-party review text or reviewer names imported
  it('does not store Google review text or reviewer names in published entities', () => {
    for (const m of mosques) {
      expect((m as any).reviews).toBeUndefined();
      expect((m as any).userReviews).toBeUndefined();
      expect((m as any).reviewerName).toBeUndefined();
    }
  });

  // 10. City registry lifecycle reflects actual statuses
  it('city registry accurately reflects lifecycle statuses', () => {
    expect(isPublishedCity('bremen')).toBe(true);
    expect(isPublishedCity('wuppertal')).toBe(true);
    expect(isPublishedCity('bonn')).toBe(true);
    expect(isPublishedCity('nuernberg')).toBe(true);
    expect(isPublishedCity('leipzig')).toBe(true);

    expect(isPublishedCity('hannover')).toBe(false);
    expect(isPublishedCity('duisburg')).toBe(false);
    expect(isPublishedCity('bochum')).toBe(false);
    expect(isPublishedCity('mannheim')).toBe(false);
    expect(isPublishedCity('dresden')).toBe(false);
  });

  // 11. Published city configs count
  it('getPublishedCityConfigs returns exactly 14 published cities', () => {
    const publishedConfigs = getPublishedCityConfigs();
    expect(publishedConfigs.length).toBe(14);
  });

  // 12. City gate evaluation: Dresden fails GATE_F
  it('Dresden fails GATE_F (record count < 5)', () => {
    const dresdenRaw = [
      { dataStatus: 'PUBLISHED', placeId: 'dr1', latitude: 51.05, longitude: 13.73, street: 'A', city: 'Dresden', phone: '1', category: 'MOSQUE' },
      { dataStatus: 'PUBLISHED', placeId: 'dr2', latitude: 51.05, longitude: 13.73, street: 'B', city: 'Dresden', phone: '2', category: 'MOSQUE' },
      { dataStatus: 'PUBLISHED', placeId: 'dr3', latitude: 51.05, longitude: 13.73, street: 'C', city: 'Dresden', phone: '3', category: 'MOSQUE' },
    ];
    const report = validateCityForLaunch('dresden', dresdenRaw as any);
    expect(report.status).toBe('BLOCKED');
    expect(report.blockers.some(b => b.gate === 'GATE_F')).toBe(true);
  });

  // 13. City gate evaluation: Bochum fails GATE_D if OTHER present
  it('Bochum fails GATE_D when OTHER category is present', () => {
    const bochumWithOther = [
      { dataStatus: 'PUBLISHED', placeId: 'bo1', latitude: 51.48, longitude: 7.21, street: 'A', city: 'Bochum', phone: '1', category: 'OTHER' },
      ...Array(5).fill(0).map((_, i) => ({
        dataStatus: 'PUBLISHED', placeId: `bo_${i}`, latitude: 51.48, longitude: 7.21, street: 'B', city: 'Bochum', phone: '2', category: 'MOSQUE'
      }))
    ];
    const report = validateCityForLaunch('bochum', bochumWithOther as any);
    expect(report.status).toBe('BLOCKED');
    expect(report.blockers.some(b => b.gate === 'GATE_D')).toBe(true);
  });

  // 14. Sitemap URLs count integrity
  it('sitemap contains 1674 URLs matching the exact formula', async () => {
    const entries = await sitemap();
    const repo = new JsonMosqueRepository();
    const published = await repo.getAllPublished();
    const cities = await repo.getCities();
    const liveCities = cities.filter(c => c.count >= 1);

    expect(liveCities.length).toBe(14);
    expect(published.length).toBe(542);
    // 3 home + 3 search + (14 * 3) city pages + (542 * 3) detail pages = 1674
    const expected = 3 + 3 + (14 * 3) + (542 * 3);
    expect(expected).toBe(1674);
    expect(entries.length).toBe(expected);
  });

  // 15. All URLs in sitemap use valid domain
  it('all sitemap URLs start with https://moscheeatlas.de', async () => {
    const entries = await sitemap();
    for (const e of entries) {
      expect(e.url.startsWith('https://moscheeatlas.de/')).toBe(true);
    }
  });

  // 16. Multilingual parity in sitemap
  it('every published mosque has exactly 3 localized URLs (de, en, ar)', async () => {
    const entries = await sitemap();
    const urls = new Set(entries.map(e => e.url));

    for (const m of mosques) {
      const config = getPublishedCityConfigs().find(c => c.canonical === m.city);
      if (config) {
        expect(urls.has(`https://moscheeatlas.de/de/moschee/${config.slug}/${m.slug}`)).toBe(true);
        expect(urls.has(`https://moscheeatlas.de/en/mosque/${config.englishSlug}/${m.slug}`)).toBe(true);
        expect(urls.has(`https://moscheeatlas.de/ar/mosque/${config.slug}/${m.slug}`)).toBe(true);
      }
    }
  });

  // 17. Unpromoted city routes do NOT appear in sitemap
  it('unpromoted cities do not appear in sitemap', async () => {
    const entries = await sitemap();
    const unpromotedSlugs = ['hannover', 'hanover', 'duisburg', 'bochum', 'mannheim', 'dresden'];
    for (const slug of unpromotedSlugs) {
      const hasCityCollection = entries.some(e => e.url.endsWith(`/moscheen/${slug}`) || e.url.endsWith(`/mosques/${slug}`));
      expect(hasCityCollection).toBe(false);
    }
  });
});
