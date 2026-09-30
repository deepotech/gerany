import { describe, it, expect } from 'vitest';
import { JsonMosqueRepository } from '@/lib/db/json-repository';
import { normalizeGermanPhonetic } from '@/lib/normalize';
import { getDictionary } from '@/lib/i18n';
import { CITY_CONFIGS } from '@/pipeline/city-config';
import fs from 'fs';
import path from 'path';

describe('Phase 3A — Data Counts & Single Source of Truth', () => {
  const repo = new JsonMosqueRepository();

  it('1. Total published count is at least 443 (grows with each production phase)', async () => {
    const published = await repo.getAllPublished();
    expect(published.length).toBeGreaterThanOrEqual(443);
  });

  it('2. Original 9 city counts match authoritative Phase 1–3 published dataset', async () => {
    const cities = await repo.getCities();
    const expectedCounts: Record<string, number> = {
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

    let totalSum = 0;
    for (const [cityName, expected] of Object.entries(expectedCounts)) {
      const cityEntry = cities.find((c) => c.name === cityName);
      expect(cityEntry, `City entry for ${cityName} should exist`).toBeDefined();
      expect(cityEntry!.count, `Count for ${cityName}`).toBe(expected);
      totalSum += cityEntry!.count;
    }

    expect(totalSum).toBe(443);
  });

  it('3. Sum of getByCity matches getAllPublished count', async () => {
    const all = await repo.getAllPublished();
    let sum = 0;
    for (const cfg of CITY_CONFIGS) {
      const cityMosques = await repo.getByCity(cfg.canonical);
      sum += cityMosques.length;
    }
    // sum covers CITY_CONFIGS cities only; total may include newly promoted cities
    expect(sum).toBeGreaterThanOrEqual(443);
    expect(sum).toBeLessThanOrEqual(all.length);
  });

  it('4. No reviewed or rejected records appear in published repository', async () => {
    const published = await repo.getAllPublished();
    for (const m of published) {
      expect(m.dataStatus).toBe('PUBLISHED');
    }
  });

  it('5. HomeHero.tsx contains no hardcoded POPULAR_CITIES array with count literals', () => {
    const heroPath = path.resolve(process.cwd(), 'src/components/HomeHero.tsx');
    const heroCode = fs.readFileSync(heroPath, 'utf8');
    expect(heroCode).not.toContain('count: 104');
    expect(heroCode).not.toContain('count: 65');
    expect(heroCode).not.toContain('POPULAR_CITIES = [');
  });

  it('6. Footer.tsx contains no hardcoded city counts array', () => {
    const footerPath = path.resolve(process.cwd(), 'src/components/Footer.tsx');
    const footerCode = fs.readFileSync(footerPath, 'utf8');
    expect(footerCode).not.toContain('443 Moscheen live');
    expect(footerCode).not.toContain('POPULAR_CITIES = [');
  });
});

describe('Phase 3A — Search Normalization & Query Intent', () => {
  const repo = new JsonMosqueRepository();

  it('7. normalizeGermanPhonetic handles umlauts and transliterations', () => {
    expect(normalizeGermanPhonetic('Köln')).toBe('koln');
    expect(normalizeGermanPhonetic('Koeln')).toBe('koln');
    expect(normalizeGermanPhonetic('Koln')).toBe('koln');
    expect(normalizeGermanPhonetic('München')).toBe('munchen');
    expect(normalizeGermanPhonetic('Munchen')).toBe('munchen');
    expect(normalizeGermanPhonetic('Muenchen')).toBe('munchen');
    expect(normalizeGermanPhonetic('Düsseldorf')).toBe('dusseldorf');
    expect(normalizeGermanPhonetic('Duesseldorf')).toBe('dusseldorf');
    expect(normalizeGermanPhonetic('Dusseldorf')).toBe('dusseldorf');
    expect(normalizeGermanPhonetic('Groß-Gerau')).toBe('gross gerau');
  });

  it('8. Server search finds Köln with Köln, Koeln, and Koln queries', async () => {
    const q1 = await repo.getAllPublished({ query: 'Köln' });
    const q2 = await repo.getAllPublished({ query: 'Koeln' });
    const q3 = await repo.getAllPublished({ query: 'Koln' });

    expect(q1.length).toBeGreaterThan(30);
    expect(q2.length).toBeGreaterThan(30);
    expect(q3.length).toBeGreaterThan(30);
    expect(q1.length).toBe(q2.length);
    expect(q2.length).toBe(q3.length);
  });

  it('9. Server search finds München with München and Muenchen queries', async () => {
    const q1 = await repo.getAllPublished({ query: 'München' });
    const q2 = await repo.getAllPublished({ query: 'Muenchen' });
    expect(q1.length).toBeGreaterThan(45);
    expect(q2.length).toBeGreaterThan(45);
    expect(q1.length).toBe(q2.length);
  });

  it('10. Search matches postal codes correctly', async () => {
    const results = await repo.getAllPublished({ query: '10557' });
    expect(results.length).toBeGreaterThanOrEqual(1);
    for (const m of results) {
      expect(m.postalCode).toContain('10557');
    }
  });

  it('11. Search with empty query returns all published mosques (>= 443)', async () => {
    const results = await repo.getAllPublished({ query: '' });
    expect(results.length).toBeGreaterThanOrEqual(443);
  });

  it('12. Search with non-existent query returns 0 mosques', async () => {
    const results = await repo.getAllPublished({ query: 'xyznonexistentquery999' });
    expect(results.length).toBe(0);
  });
});

describe('Phase 3A — Map & Nearby Sorting', () => {
  const repo = new JsonMosqueRepository();

  it('13. getNearby excludes the current mosque slug', async () => {
    const published = await repo.getAllPublished();
    const target = published[0];
    const nearby = await repo.getNearby(target.latitude, target.longitude, 5, target.slug);

    expect(nearby.length).toBeLessThanOrEqual(5);
    for (const m of nearby) {
      expect(m.slug).not.toBe(target.slug);
    }
  });

  it('14. getNearby sorts results by distance in ascending order', async () => {
    const published = await repo.getAllPublished();
    const target = published[0];
    const nearby = await repo.getNearby(target.latitude, target.longitude, 4, target.slug);

    expect(nearby.length).toBeGreaterThan(1);
    for (let i = 1; i < nearby.length; i++) {
      expect(nearby[i].distanceKm!).toBeGreaterThanOrEqual(nearby[i - 1].distanceKm!);
    }
  });
});

describe('Phase 3A — Data Trust & Verification Semantics', () => {
  const repo = new JsonMosqueRepository();

  it('15. Verification dictionary semantics are correctly separated by tier', () => {
    const de = getDictionary('de');
    const en = getDictionary('en');
    const ar = getDictionary('ar');

    // UNVERIFIED = source-derived records (our current 443): displayed as neutral "Erfasst"
    expect(de.common.unverified).toBe('Erfasst');
    expect(en.common.unverified).toBe('Listed');
    expect(ar.common.unverified).toBe('مُدرج');

    // COMMUNITY_VERIFIED = mosque community has directly confirmed: reserved for future use
    expect(de.common.communityVerified).toBe('Gemeinde-bestätigt');
    expect(en.common.communityVerified).toBe('Community Verified');
    expect(ar.common.communityVerified).toBe('معتمد مجتمعياً');

    // OFFICIALLY_VERIFIED = official registry verification: reserved for future use
    expect(de.common.verified).toBe('Offiziell verifiziert');
    expect(en.common.verified).toBe('Officially Verified');
    expect(ar.common.verified).toBe('معتمد رسمياً');

    // COMMUNITY_VERIFIED must never be the same string as UNVERIFIED
    expect(de.common.communityVerified).not.toBe(de.common.unverified);
    expect(en.common.communityVerified).not.toBe(en.common.unverified);
  });

  it('16. Dictionary contains noInfo, resetFilters, and reviews keys across all locales', () => {
    for (const loc of ['de', 'en', 'ar'] as const) {
      const dict = getDictionary(loc);
      expect(dict.common.noInfo).toBeDefined();
      expect(dict.common.noInfo.length).toBeGreaterThan(0);
      expect(dict.common.resetFilters).toBeDefined();
      expect(dict.common.resetFilters.length).toBeGreaterThan(0);
      expect(dict.common.reviews).toBeDefined();
      expect(dict.common.reviews.length).toBeGreaterThan(0);
    }
  });

  it('17. MosqueDetailView does not contain hardcoded speculative Jummah times', () => {
    const detailPath = path.resolve(process.cwd(), 'src/components/MosqueDetailView.tsx');
    const detailCode = fs.readFileSync(detailPath, 'utf8');
    expect(detailCode).not.toContain('13:00 und 14:30');
    expect(detailCode).not.toContain('Pilot ID');
  });

  it('18. No published records have COMMUNITY_VERIFIED status (requires explicit confirmation)', async () => {
    const published = await repo.getAllPublished();
    const communityVerifiedRecords = published.filter(
      (m) => m.verificationStatus === 'COMMUNITY_VERIFIED'
    );
    expect(communityVerifiedRecords.length).toBe(0);
  });

  it('19. No published records have OFFICIALLY_VERIFIED status (none have been formally onboarded)', async () => {
    const published = await repo.getAllPublished();
    const officiallyVerifiedRecords = published.filter(
      (m) => m.verificationStatus === 'OFFICIALLY_VERIFIED'
    );
    expect(officiallyVerifiedRecords.length).toBe(0);
  });

  it('20. All published records have UNVERIFIED status (source-derived, not community-confirmed)', async () => {
    const published = await repo.getAllPublished();
    expect(published.length).toBeGreaterThan(0);
    for (const m of published) {
      expect(
        m.verificationStatus,
        `Record ${m.slug} in ${m.city} should be UNVERIFIED`
      ).toBe('UNVERIFIED');
    }
  });

  it('21. classify.ts does not assign COMMUNITY_VERIFIED from pipeline signals alone', () => {
    const classifyPath = path.resolve(process.cwd(), 'src/pipeline/classify.ts');
    const classifyCode = fs.readFileSync(classifyPath, 'utf8');
    expect(classifyCode).not.toContain("verificationStatus: 'COMMUNITY_VERIFIED'");
  });
});
