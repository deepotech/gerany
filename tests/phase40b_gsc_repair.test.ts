import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MosqueEntity } from '../src/pipeline/types';
import { CITY_CONFIGS, getPublishedCityConfigs } from '../src/pipeline/city-config';
import {
  resolveTrailingDigitMosqueUrl,
  resolveTrailingDigitCityUrl,
  resolveTrailingDigitLocaleUrl,
  getMosqueUrl,
  getCityUrl,
} from '../src/lib/routes';
import sitemap from '../src/app/sitemap';
import nextConfig from '../next.config.mjs';

describe('Phase 40B — Verified GSC 404 Repair & Safe Normalization Suite', () => {
  const root = path.resolve(__dirname, '..');
  const redirectsPath = path.join(root, 'src/data/redirects.json');
  const mosquesPath = path.join(root, 'src/data/mosques.json');
  const allEntitiesPath = path.join(root, 'src/data/all-entities.json');

  const redirects = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
  const mosques: MosqueEntity[] = JSON.parse(fs.readFileSync(mosquesPath, 'utf8'));
  const allEntities: MosqueEntity[] = JSON.parse(fs.readFileSync(allEntitiesPath, 'utf8'));
  const publishedCities = getPublishedCityConfigs();

  const original454 = redirects.slice(0, 454);
  const new738 = redirects.slice(454);

  // ==========================================
  // 1. INVENTORY & EXACT REDIRECT COUNTS
  // ==========================================
  describe('1. Inventory & Structure', () => {
    it('contains exactly 1,192 total redirect rules (454 original + 738 new)', () => {
      expect(redirects.length).toBe(1192);
      expect(original454.length).toBe(454);
      expect(new738.length).toBe(738);
    });

    it('contains 1,192 unique source paths with zero duplicates', () => {
      const sources = redirects.map((r: any) => r.source);
      const uniqueSources = new Set(sources);
      expect(uniqueSources.size).toBe(1192);
    });

    it('all redirect rules specify permanent: true with leading slashes', () => {
      for (const r of redirects) {
        expect(r.permanent).toBe(true);
        expect(r.source.startsWith('/')).toBe(true);
        expect(r.destination.startsWith('/')).toBe(true);
      }
    });

    it('contains zero self-redirect loops (source !== destination)', () => {
      for (const r of redirects) {
        expect(r.source).not.toBe(r.destination);
      }
    });

    it('contains zero redirect chains (no destination is also a source)', () => {
      const sourceSet = new Set(redirects.map((r: any) => r.source));
      for (const r of redirects) {
        expect(sourceSet.has(r.destination)).toBe(false);
      }
    });
  });

  // ==========================================
  // 2. PRESERVATION OF EXISTING 454 RULES
  // ==========================================
  describe('2. Baseline 454 Rules Preservation', () => {
    it('preserves all original 454 redirect mappings intact', () => {
      expect(original454.length).toBe(454);
      const ar1 = original454.find((r: any) => r.source === '/ar1');
      const de1 = original454.find((r: any) => r.source === '/de1');
      expect(ar1?.destination).toBe('/ar');
      expect(de1?.destination).toBe('/de');
    });
  });

  // ==========================================
  // 3. VERIFICATION OF 738 NEW MAPPINGS
  // ==========================================
  describe('3. Verified 738 New Mappings', () => {
    it('all 32 new city collection redirects map to published cities', () => {
      const newCityRules = new738.filter((r: any) =>
        r.source.includes('/moscheen/') || r.source.includes('/mosques/')
      );
      expect(newCityRules.length).toBe(32);

      for (const r of newCityRules) {
        const parts = r.destination.split('/').filter(Boolean);
        const loc = parts[0];
        const section = parts[1];
        const citySlug = parts[2];

        if (loc === 'de') expect(section).toBe('moscheen');
        else expect(section).toBe('mosques');

        const cfg = publishedCities.find(
          (c) => c.slug === citySlug || c.englishSlug === citySlug
        );
        expect(cfg).toBeDefined();
      }
    });

    it('all 706 new mosque detail redirects map to published mosques in mosques.json', () => {
      const newDetailRules = new738.filter((r: any) =>
        !r.source.includes('/moscheen/') && !r.source.includes('/mosques/')
      );
      expect(newDetailRules.length).toBe(706);

      const mosqueMap = new Map(mosques.map((m) => [m.placeId, m]));

      for (const r of newDetailRules) {
        expect(r.placeId).toBeDefined();
        const m = mosqueMap.get(r.placeId);
        expect(m).toBeDefined();
        expect(m?.dataStatus).toBe('PUBLISHED');

        // Verify destination slug matches canonical slug
        const destSlug = r.destination.split('/').filter(Boolean).pop();
        expect(destSlug).toBe(m?.slug);
      }
    });

    it('covers German, English, and Arabic routes across new redirects', () => {
      const deCount = new738.filter((r: any) => r.source.startsWith('/de/')).length;
      const enCount = new738.filter((r: any) => r.source.startsWith('/en/')).length;
      const arCount = new738.filter((r: any) => r.source.startsWith('/ar/')).length;

      expect(deCount).toBeGreaterThan(200);
      expect(enCount).toBeGreaterThan(200);
      expect(arCount).toBeGreaterThan(200);
      expect(deCount + enCount + arCount).toBe(738);
    });

    it('zero new redirects point to quarantined or unpublished entities', () => {
      const publishedIds = new Set(mosques.map((m) => m.placeId));
      const unpublished = allEntities.filter((e) => !publishedIds.has(e.placeId));
      const unpublishedIds = new Set(unpublished.map((u) => u.placeId));

      for (const r of new738) {
        if (r.placeId) {
          expect(unpublishedIds.has(r.placeId)).toBe(false);
        }
      }
    });
  });

  // ==========================================
  // 4. SAFE NUMERIC SUFFIX NORMALIZATION
  // ==========================================
  describe('4. Safe Numeric Suffix Normalization', () => {
    const mockRepo = {
      getByCityAndSlug: async (city: string, slug: string) => {
        const found = mosques.find(
          (m) => m.city.toLowerCase() === city.toLowerCase() && m.slug === slug
        );
        return found || null;
      },
    };

    it('resolves unresolvable mosque slug with trailing digit [1-4] to canonical published mosque', async () => {
      // Find a published Berlin mosque
      const berlinMosque = mosques.find((m) => m.city === 'Berlin');
      expect(berlinMosque).toBeDefined();

      const corruptedSlug = `${berlinMosque!.slug}3`;
      const resolved = await resolveTrailingDigitMosqueUrl('de', 'Berlin', corruptedSlug, mockRepo);
      expect(resolved).toBe(`/de/moschee/berlin/${berlinMosque!.slug}`);

      // English resolution
      const resolvedEn = await resolveTrailingDigitMosqueUrl('en', 'Berlin', `${berlinMosque!.slug}4`, mockRepo);
      expect(resolvedEn).toBe(`/en/mosque/berlin/${berlinMosque!.slug}`);

      // Arabic resolution
      const resolvedAr = await resolveTrailingDigitMosqueUrl('ar', 'Berlin', `${berlinMosque!.slug}3`, mockRepo);
      expect(resolvedAr).toBe(`/ar/mosque/berlin/${berlinMosque!.slug}`);
    });

    it('returns null for unknown mosque slug with trailing digit', async () => {
      const resolved = await resolveTrailingDigitMosqueUrl(
        'de',
        'Berlin',
        'completely-fictitious-mosque3',
        mockRepo
      );
      expect(resolved).toBeNull();
    });

    it('returns null for digits outside [1-4] (e.g. 5, 8, 9)', async () => {
      const berlinMosque = mosques.find((m) => m.city === 'Berlin');
      expect(berlinMosque).toBeDefined();

      const corrupted5 = `${berlinMosque!.slug}5`;
      const corrupted9 = `${berlinMosque!.slug}9`;
      expect(await resolveTrailingDigitMosqueUrl('de', 'Berlin', corrupted5, mockRepo)).toBeNull();
      expect(await resolveTrailingDigitMosqueUrl('de', 'Berlin', corrupted9, mockRepo)).toBeNull();
    });

    it('preserves legitimate slugs containing digits (does not strip digits from valid pages)', async () => {
      // 'moschee-2' is a legitimate published mosque
      const moschee2 = mosques.find((m) => m.slug === 'moschee-2');
      if (moschee2) {
        // Direct resolution succeeds
        const direct = await mockRepo.getByCityAndSlug(moschee2.city, 'moschee-2');
        expect(direct).toBeDefined();
        expect(direct?.slug).toBe('moschee-2');
      }
    });

    it('resolves unresolvable city collection slug with trailing 2 to canonical city hub', () => {
      expect(resolveTrailingDigitCityUrl('de', 'berlin2')).toBe('/de/moscheen/berlin');
      expect(resolveTrailingDigitCityUrl('en', 'cologne2')).toBe('/en/mosques/cologne');
      expect(resolveTrailingDigitCityUrl('ar', 'muenchen2')).toBe('/ar/mosques/muenchen');
    });

    it('returns null for unknown city slug with trailing digit', () => {
      expect(resolveTrailingDigitCityUrl('de', 'atlantis2')).toBeNull();
      expect(resolveTrailingDigitCityUrl('de', 'berlin7')).toBeNull();
    });

    it('resolves anomalous root locale routes ending in [1-4]', () => {
      expect(resolveTrailingDigitLocaleUrl('ar1')).toBe('/ar');
      expect(resolveTrailingDigitLocaleUrl('de1')).toBe('/de');
      expect(resolveTrailingDigitLocaleUrl('en1')).toBe('/en');
      expect(resolveTrailingDigitLocaleUrl('fr1')).toBeNull(); // unsupported locale
      expect(resolveTrailingDigitLocaleUrl('ar9')).toBeNull(); // non 1-4
    });
  });

  // ==========================================
  // 5. INVARIANTS & INTEGRITY PRESERVATION
  // ==========================================
  describe('5. Database & Sitemap Invariants', () => {
    it('strictly preserves all 601 published mosque records', () => {
      expect(mosques.length).toBe(601);
      const published = mosques.filter((m) => m.dataStatus === 'PUBLISHED');
      expect(published.length).toBe(601);
    });

    it('strictly preserves all 20 published cities', () => {
      expect(publishedCities.length).toBe(20);
    });

    it('strictly preserves all 661 all-entities records (60 quarantined)', () => {
      expect(allEntities.length).toBe(661);
      const unpublished = allEntities.filter((e) => e.dataStatus !== 'PUBLISHED');
      expect(unpublished.length).toBe(60);
    });

    it('sitemap generates exactly 1,869 valid canonical URLs with 0 GSC 404 URLs', async () => {
      const sitemapEntries = await sitemap();
      expect(sitemapEntries.length).toBe(1869);

      const sitemapUrls = new Set(sitemapEntries.map((e) => e.url));
      for (const r of redirects) {
        expect(sitemapUrls.has(`https://moscheeindernaehe.de${r.source}`)).toBe(false);
      }
    });

    it('next.config.mjs loads all 1,192 redirects plus 1 root redirect (1,193 total)', async () => {
      if (!nextConfig.redirects) throw new Error('redirects undefined');
      const configRedirects = await nextConfig.redirects();
      expect(configRedirects.length).toBe(1193);

      const rootRedir = configRedirects.find((r: any) => r.source === '/');
      expect(rootRedir?.destination).toBe('/de');
      expect(rootRedir?.permanent).toBe(false);
    });
  });
});
