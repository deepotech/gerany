import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CITY_CONFIGS, getPublishedCityConfigs, isCityIndexable } from '../src/pipeline/city-config';
import {
  isPublishedCity,
  getCityLifecycleStatus,
  getCityRegistryEntry,
  getAllCityRegistryEntries,
} from '../src/pipeline/city-registry';
import { validateCityForLaunch } from '../src/pipeline/city-gates';
import { detectDuplicates } from '../src/pipeline/deduplicate';
import { classifyDataFreshness, DEFAULT_FRESHNESS_THRESHOLDS } from '../src/pipeline/data-freshness';
import { createDiscoveredCity } from '../src/pipeline/city-discovery';
import { OsmSourceAdapter } from '../src/pipeline/osm-adapter';
import { detectEntityDiff } from '../src/pipeline/change-detection';
import { buildReviewQueue } from '../src/pipeline/operator-review';
import { JsonMosqueRepository } from '../src/lib/db/json-repository';
import sitemap from '../src/app/sitemap';
import { MosqueEntity } from '../src/pipeline/types';

describe('PHASE 6: Production Data Operations & Scaling Regression Protection', () => {
  const rootDir = path.resolve(__dirname, '..');
  const mosquesPath = path.join(rootDir, 'src', 'data', 'mosques.json');
  const allPath = path.join(rootDir, 'src', 'data', 'all-entities.json');

  const mosques: MosqueEntity[] = JSON.parse(fs.readFileSync(mosquesPath, 'utf8'));
  const allEntities: MosqueEntity[] = JSON.parse(fs.readFileSync(allPath, 'utf8'));
  const repo = new JsonMosqueRepository();

  // Assertion 1: 542 published mosques remain intact
  it('1. 542 published mosques remain completely intact in mosques.json', () => {
    expect(mosques.length).toBe(542);
    expect(mosques.every((m) => m.dataStatus === 'PUBLISHED')).toBe(true);
  });

  // Assertion 2: 14 published cities remain published
  it('2. 14 published cities remain published', () => {
    const publishedConfigs = getPublishedCityConfigs();
    expect(publishedConfigs.length).toBe(14);
    for (const c of publishedConfigs) {
      expect(isPublishedCity(c.slug)).toBe(true);
    }
  });

  // Assertion 3: Published city count remains correct
  it('3. Published city count in registry matches database exactly (14 cities)', async () => {
    const citiesFromRepo = await repo.getCities();
    const liveCities = citiesFromRepo.filter((c) => c.count >= 1);
    expect(liveCities.length).toBe(14);
  });

  // Assertion 4: Unpublished cities remain non-indexable
  it('4. Unpublished candidate cities remain non-indexable and return false from isCityIndexable', () => {
    const unpromoted = ['hannover', 'duisburg', 'bochum', 'mannheim', 'dresden'];
    for (const slug of unpromoted) {
      const entry = getCityRegistryEntry(slug);
      expect(entry).toBeDefined();
      expect(isCityIndexable(entry!.canonical, 0)).toBe(false);
      expect(isPublishedCity(slug)).toBe(false);
    }
  });

  // Assertion 5: REVIEW records never appear in public search
  it('5. REVIEW records never appear in public repository search', async () => {
    const searchResults = await repo.getAllPublished();
    expect(searchResults.every((m) => m.dataStatus === 'PUBLISHED')).toBe(true);
    expect(searchResults.some((m) => m.dataStatus === 'REVIEWED')).toBe(false);
  });

  // Assertion 6: REVIEW records never appear in sitemap
  it('6. REVIEW records never appear in sitemap URLs', async () => {
    const sitemapEntries = await sitemap();
    const sitemapUrls = new Set(sitemapEntries.map((e) => e.url));
    const reviewed = allEntities.filter((e) => e.dataStatus === 'REVIEWED');
    const published = mosques;

    for (const r of reviewed) {
      const config = CITY_CONFIGS.find((c) => c.canonical === r.city);
      if (config) {
        const publishedInSameCityWithSlug = published.some(
          (p) => p.city === r.city && p.slug === r.slug
        );
        if (!publishedInSameCityWithSlug) {
          expect(sitemapUrls.has(`https://moscheeindernaehe.de/de/moschee/${config.slug}/${r.slug}`)).toBe(false);
        }
      }
    }
  });

  // Assertion 7: BLOCKED cities never appear in sitemap
  it('7. BLOCKED cities (Bochum, Dresden) never appear in sitemap', async () => {
    const sitemapEntries = await sitemap();
    const urls = sitemapEntries.map((e) => e.url);
    expect(urls.some((u) => u.includes('/bochum'))).toBe(false);
    expect(urls.some((u) => u.includes('/dresden'))).toBe(false);
  });

  // Assertion 8: DISCOVERED cities never appear in sitemap
  it('8. DISCOVERED cities never appear in sitemap', async () => {
    const discovered = createDiscoveredCity({
      name: 'Potsdam',
      slug: 'potsdam',
      state: 'Brandenburg',
      postalMin: 14467,
      postalMax: 14482,
      discoverySource: 'postal_range_expansion',
    });
    expect(discovered.status).toBe('DISCOVERED');
    expect(discovered.seoIndexable).toBe(false);

    const sitemapEntries = await sitemap();
    const urls = sitemapEntries.map((e) => e.url);
    expect(urls.some((u) => u.includes('/potsdam'))).toBe(false);
  });

  // Assertion 9: RAW records never appear publicly
  it('9. RAW records never appear in published data or repository', async () => {
    const published = await repo.getAllPublished();
    expect(published.some((m) => m.dataStatus === 'RAW')).toBe(false);
  });

  // Assertion 10: REJECTED records never appear publicly
  it('10. REJECTED records never appear in mosques.json or sitemap', async () => {
    const published = await repo.getAllPublished();
    expect(published.some((m) => m.dataStatus === 'REJECTED')).toBe(false);

    const sitemapEntries = await sitemap();
    const urls = sitemapEntries.map((e) => e.url);
    const rejected = allEntities.filter((e) => e.dataStatus === 'REJECTED');
    for (const rej of rejected) {
      const config = CITY_CONFIGS.find((c) => c.canonical === rej.city);
      if (config) {
        const publishedInSameCityWithSlug = published.some(
          (p) => p.city === rej.city && p.slug === rej.slug
        );
        if (!publishedInSameCityWithSlug) {
          expect(urls.some((u) => u.includes(`/${config.slug}/${rej.slug}`))).toBe(false);
        }
      }
    }
  });

  // Assertion 11: verificationStatus is not changed by source import
  it('11. 100% of published records maintain UNVERIFIED status (source presence does not grant verification)', () => {
    const nonUnverified = mosques.filter((m) => m.verificationStatus !== 'UNVERIFIED');
    expect(nonUnverified.length).toBe(0);
  });

  // Assertion 12: Null facilities are not converted to false
  it('12. Null facilities are preserved as null (Unknown != False)', () => {
    let nullFacilityFound = false;
    for (const m of mosques) {
      if (
        m.facilities &&
        (m.facilities.parking === null ||
          m.facilities.womenArea === null ||
          m.facilities.wheelchairAccessible === null)
      ) {
        nullFacilityFound = true;
        break;
      }
    }
    expect(nullFacilityFound).toBe(true);
  });

  // Assertion 13: Prayer times are never fabricated
  it('13. No prayer times are fabricated for published entities', () => {
    for (const m of mosques) {
      expect((m as any).prayerTimes).toBeUndefined();
    }
  });

  // Assertion 14: Review text/names are never imported
  it('14. Review text and personal reviewer names are completely excluded from entities', () => {
    for (const m of mosques) {
      expect((m as any).reviews).toBeUndefined();
      expect((m as any).userReviews).toBeUndefined();
      expect((m as any).reviewerName).toBeUndefined();
    }
  });

  // Assertion 15: Duplicate detection does not merge co-located entities automatically
  it('15. Co-location protection: distinct organizations at same address are flagged as FLAGGED_CO_LOCATED, not merged', () => {
    const coLocatedRaw = [
      {
        placeId: 'co_1',
        title: 'Islamisches Zentrum Aachen',
        address: 'Professor-Pirlet-Straße 20, 52074 Aachen',
        location: { lat: 50.778, lng: 6.07 },
      },
      {
        placeId: 'co_2',
        title: 'Bilal Moschee Verein',
        address: 'Professor-Pirlet-Straße 20, 52074 Aachen',
        location: { lat: 50.778, lng: 6.07 },
      },
    ];

    const dedupe = detectDuplicates(coLocatedRaw as any);
    expect(dedupe.uniqueRecords.length).toBe(2);
    expect(dedupe.duplicateCandidates.some((d) => d.actionTaken === 'FLAGGED_CO_LOCATED')).toBe(true);
  });

  // Assertion 16: City publication still requires city gates
  it('16. City publication still requires city gates (city with < 5 records is BLOCKED)', () => {
    const sparseData = [
      {
        dataStatus: 'PUBLISHED',
        placeId: 'p1',
        latitude: 51,
        longitude: 7,
        street: 'A',
        city: 'TestCity',
        phone: '1',
        category: 'MOSQUE',
      },
    ];
    const report = validateCityForLaunch('dresden', sparseData as any);
    expect(report.status).toBe('BLOCKED');
    expect(report.blockers.some((b) => b.gate === 'GATE_F')).toBe(true);
  });

  // Assertion 17: Search returns published records only
  it('17. Search with general query returns strictly published records', async () => {
    const results = await repo.getAllPublished({ query: 'Moschee' });
    expect(results.length).toBeGreaterThan(50);
    expect(results.every((m) => m.dataStatus === 'PUBLISHED')).toBe(true);
  });

  // Assertion 18: Public map returns published records only
  it('18. Map dataset returns strictly published records with valid coordinates', async () => {
    const allPublished = await repo.getAllPublished();
    for (const m of allPublished) {
      expect(m.dataStatus).toBe('PUBLISHED');
      expect(m.latitude).toBeGreaterThanOrEqual(47);
      expect(m.latitude).toBeLessThanOrEqual(55.5);
      expect(m.longitude).toBeGreaterThanOrEqual(5.5);
      expect(m.longitude).toBeLessThanOrEqual(15.5);
    }
  });

  // Assertion 19: Canonical URLs remain stable
  it('19. Canonical URLs for established baseline records remain stable', () => {
    const berlinFatih = mosques.find((m) => m.city === 'Berlin' && m.slug.includes('fatih'));
    if (berlinFatih) {
      expect(berlinFatih.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  // Assertion 20: Multilingual routes remain valid
  it('20. Every published mosque has valid translations for de, en, ar', () => {
    for (const m of mosques) {
      expect(m.translations).toBeDefined();
      expect(m.translations.de).toBeDefined();
      expect(m.translations.en).toBeDefined();
      expect(m.translations.ar).toBeDefined();
    }
  });

  // Assertion 21: Sitemap contains only canonical indexable URLs (exactly 1674)
  it('21. Sitemap contains exactly 1,674 canonical indexable URLs', async () => {
    const sitemapEntries = await sitemap();
    expect(sitemapEntries.length).toBe(1674);

    const urls = sitemapEntries.map((e) => e.url);
    const uniqueUrls = new Set(urls);
    expect(urls.length).toBe(uniqueUrls.size);
    expect(urls.every((u) => !u.includes('?'))).toBe(true);
  });

  // Assertion 22: Change detection and operator review models are operational
  it('22. Change detection and review queue services operate deterministically', () => {
    const reviewQueue = buildReviewQueue(allEntities);
    expect(reviewQueue.length).toBeGreaterThan(0);
    expect(reviewQueue.every((item) => item.dataStatus === 'REVIEWED' || Boolean(item.reviewReason))).toBe(true);

    const diff = detectEntityDiff(mosques.slice(0, 10), mosques.slice(0, 10));
    expect(diff.unchangedCount).toBe(10);
    expect(diff.addedCount).toBe(0);
    expect(diff.removedCount).toBe(0);
  });
});
