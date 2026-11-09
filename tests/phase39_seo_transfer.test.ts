import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';
import { constructMetadata } from '../src/lib/seo/metadata';
import {
  generateCityCollectionSchema,
  generateMosqueJsonLd,
  generateBreadcrumbJsonLd,
  generateWebSiteSchema,
} from '../src/lib/seo/schema';
import {
  isCityEligibleForSeo,
  getCityTier,
  MIN_MOSQUES_FOR_INDEXATION,
} from '../src/lib/seo/city-tiers';
import { getMosqueRepository } from '../src/lib/db';
import { CITY_CONFIGS, getPublishedCityConfigs } from '../src/pipeline/city-config';
import { getCityUrl, getMosqueUrl, ARABIC_CITY_NAMES } from '../src/lib/routes';
import { SITE_NAME, SITE_URL } from '../src/lib/config';
import sitemap from '../src/app/sitemap';
import robots from '../src/app/robots';
import nextConfig from '../next.config.mjs';

import { generateMetadata as generateGermanCityMetadata } from '../src/app/[locale]/moscheen/[city]/page';
import { generateMetadata as generateEnArCityMetadata } from '../src/app/[locale]/mosques/[city]/page';
import { generateMetadata as generateGermanDetailMetadata } from '../src/app/[locale]/moschee/[city]/[slug]/page';
import { generateMetadata as generateEnArDetailMetadata } from '../src/app/[locale]/mosque/[city]/[slug]/page';
import { metadata as notFoundMetadata } from '../src/app/not-found';

const ROOT = path.resolve(__dirname, '..');

describe('Phase 39 — US SEO Strategy Transfer to MoscheeAtlas Germany', () => {
  const repo = getMosqueRepository();

  // --------------------------------------------------------------------------
  // 1. Shared Metadata & Brand Suffix Deduplication
  // --------------------------------------------------------------------------
  describe('1. Shared Metadata & Brand Suffix Deduplication', () => {
    it('strips redundant brand suffixes to avoid double branding (e.g. "Title | MoscheeAtlas")', () => {
      const meta = constructMetadata({
        title: `Moscheen in Berlin | ${SITE_NAME}`,
        description: 'Verzeichnis der Moscheen in Berlin.',
        canonical: '/de/moscheen/berlin',
        locale: 'de',
      });
      // Title returned to Next.js must be cleaned so Next.js title template doesn't double-append
      expect(meta.title).toBe('Moscheen in Berlin');
      expect(meta.openGraph?.title).toBe(`Moscheen in Berlin | ${SITE_NAME}`);
      expect(meta.twitter?.title).toBe(`Moscheen in Berlin | ${SITE_NAME}`);
    });

    it('handles dash and en-dash brand suffixes cleanly', () => {
      const metaDash = constructMetadata({
        title: `Moscheen in Hamburg – ${SITE_NAME}`,
        description: 'Test description',
      });
      expect(metaDash.title).toBe('Moscheen in Hamburg');

      const metaHyphen = constructMetadata({
        title: `Moscheen in Köln - ${SITE_NAME}`,
        description: 'Test description',
      });
      expect(metaHyphen.title).toBe('Moscheen in Köln');
    });

    it('injects max-image-preview: large for indexable pages', () => {
      const meta = constructMetadata({
        title: 'Moscheen in Berlin',
        description: 'Test description',
        noIndex: false,
      });
      expect(meta.robots).toEqual({
        index: true,
        follow: true,
        'max-image-preview': 'large',
      });
    });

    it('supports independent noindex,follow for utility or sparse pages', () => {
      const meta = constructMetadata({
        title: 'Utility Page',
        description: 'Test description',
        noIndex: true,
        noFollow: false,
      });
      expect(meta.robots).toEqual({
        index: false,
        follow: true,
      });
    });

    it('populates summary_large_image Twitter cards and OpenGraph metadata', () => {
      const meta = constructMetadata({
        title: 'Moscheen in München',
        description: 'Test description',
        canonical: '/de/moscheen/muenchen',
        locale: 'de',
      });
      expect((meta.twitter as any)?.card).toBe('summary_large_image');
      expect(meta.openGraph?.siteName).toBe(SITE_NAME);
      expect(meta.openGraph?.locale).toBe('de_DE');
      expect(meta.openGraph?.url).toBe(`${SITE_URL}/de/moscheen/muenchen`);
    });

    it('not-found page metadata title avoids duplicate brand suffix', () => {
      expect(notFoundMetadata.title).toBe('404 – Seite nicht gefunden');
      expect(notFoundMetadata.robots).toEqual({
        index: false,
        follow: true,
      });
    });
  });

  // --------------------------------------------------------------------------
  // 2. Structured Data: CollectionPage, ItemList, PlaceOfWorship, WebSite
  // --------------------------------------------------------------------------
  describe('2. Structured Data Schemas', () => {
    it('generates CollectionPage and ItemList JSON-LD for city pages with correct entities', async () => {
      const config = CITY_CONFIGS.find((c) => c.canonical === 'Berlin')!;
      const mosques = await repo.getByCity('Berlin');
      expect(mosques.length).toBeGreaterThanOrEqual(100);

      const schema = generateCityCollectionSchema(config, mosques, 'de');
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('CollectionPage');
      expect(schema.name).toBe('Moscheen in Berlin');
      expect(schema.url).toBe(`${SITE_URL}/de/moscheen/berlin`);

      const mainEntity = schema.mainEntity as any;
      expect(mainEntity['@type']).toBe('ItemList');
      expect(mainEntity.numberOfItems).toBe(mosques.length);
      expect(mainEntity.itemListElement.length).toBe(mosques.length);

      const firstItem = mainEntity.itemListElement[0];
      expect(firstItem['@type']).toBe('ListItem');
      expect(firstItem.position).toBe(1);
      expect(firstItem.name).toBeDefined();
      expect(firstItem.url).toContain('/de/moschee/berlin/');
    });

    it('generates CollectionPage JSON-LD for English and Arabic city routes', async () => {
      const config = CITY_CONFIGS.find((c) => c.canonical === 'Köln')!;
      const mosques = await repo.getByCity('Köln');

      const schemaEn = generateCityCollectionSchema(config, mosques, 'en');
      expect(schemaEn.name).toBe('Mosques in Cologne');
      expect(schemaEn.url).toBe(`${SITE_URL}/en/mosques/cologne`);
      const listEn = schemaEn.mainEntity as any;
      expect(listEn.itemListElement[0].url).toContain('/en/mosque/cologne/');

      const schemaAr = generateCityCollectionSchema(config, mosques, 'ar');
      expect(schemaAr.name).toBe('مساجد كولونيا');
      expect(schemaAr.url).toBe(`${SITE_URL}/ar/mosques/koeln`);
      const listAr = schemaAr.mainEntity as any;
      expect(listAr.itemListElement[0].url).toContain('/ar/mosque/koeln/');
    });

    it('generates PlaceOfWorship and Mosque JSON-LD on detail pages with clean ID and OpeningHoursSpecification', async () => {
      const mosques = await repo.getAllPublished();
      const mosqueWithHours = mosques.find((m) => m.openingHours && m.openingHours.length > 0)!;
      expect(mosqueWithHours).toBeDefined();

      const jsonLd = generateMosqueJsonLd(mosqueWithHours, 'de');
      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBe('Mosque');
      expect(jsonLd.additionalType).toBe('https://schema.org/PlaceOfWorship');
      expect(jsonLd['@id']).toContain('#place');
      expect(jsonLd.address).toBeDefined();
      expect((jsonLd.address as any)['@type']).toBe('PostalAddress');
      expect((jsonLd.geo as any)['@type']).toBe('GeoCoordinates');

      // Check OpeningHoursSpecification
      expect(jsonLd.openingHoursSpecification).toBeDefined();
      const specs = jsonLd.openingHoursSpecification as any[];
      expect(specs.length).toBeGreaterThan(0);
      expect(specs[0]['@type']).toBe('OpeningHoursSpecification');
      expect(specs[0].dayOfWeek).toBeDefined();
      expect(specs[0].description).toBeDefined();
    });

    it('generates WebSite JSON-LD for localized homepages', () => {
      const wsDe = generateWebSiteSchema('de');
      expect(wsDe['@context']).toBe('https://schema.org');
      expect(wsDe['@type']).toBe('WebSite');
      expect(wsDe.name).toBe(SITE_NAME);
      expect(wsDe.url).toBe(`${SITE_URL}/de`);

      const wsEn = generateWebSiteSchema('en');
      expect(wsEn.url).toBe(`${SITE_URL}/en`);

      const wsAr = generateWebSiteSchema('ar');
      expect(wsAr.url).toBe(`${SITE_URL}/ar`);
    });

    it('BreadcrumbList JSON-LD contains clean sequential items without duplicate URLs', () => {
      const items = [
        { name: 'Startseite', url: '/de' },
        { name: 'Moscheen in Deutschland', url: '/de/moscheen' },
        { name: 'Moscheen in Berlin', url: '/de/moscheen/berlin' },
        { name: 'Sehitlik Moschee', url: '/de/moschee/berlin/sehitlik-moschee' },
      ];
      const bc = generateBreadcrumbJsonLd(items);
      expect(bc['@type']).toBe('BreadcrumbList');
      expect(bc.itemListElement.length).toBe(4);

      // Verify each position is strictly sequential 1..4
      bc.itemListElement.forEach((el, idx) => {
        expect(el.position).toBe(idx + 1);
      });

      // Verify no duplicate URLs exist in the breadcrumbs
      const urls = bc.itemListElement.map((el) => el.item);
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(urls.length);
    });
  });

  // --------------------------------------------------------------------------
  // 3. City Tier Classification & Indexation Eligibility
  // --------------------------------------------------------------------------
  describe('3. City Tier Classification & Indexation Eligibility', () => {
    it('evaluates all 20 published German cities as indexable (all have >= 6 mosques)', async () => {
      const cities = await repo.getCities();
      const liveCities = cities.filter((c) => c.count >= 1);
      expect(liveCities.length).toBe(20);

      for (const city of liveCities) {
        expect(city.count).toBeGreaterThanOrEqual(6);
        expect(isCityEligibleForSeo(city.count)).toBe(true);

        const tierInfo = getCityTier(city.name, city.count);
        expect(tierInfo.isIndexable).toBe(true);
        expect(tierInfo.minMosqueThreshold).toBe(MIN_MOSQUES_FOR_INDEXATION);
      }
    });

    it('correctly classifies top metropolitan hubs into Tier 1 (>= 30 mosques)', () => {
      const berlinTier = getCityTier('Berlin', 104, 406);
      expect(berlinTier.tier).toBe('Tier 1');
      expect(berlinTier.priority).toBe(0.9);

      const hamburgTier = getCityTier('Hamburg', 65, 258);
      expect(hamburgTier.tier).toBe('Tier 1');

      const dortmundTier = getCityTier('Dortmund', 50, 153);
      expect(dortmundTier.tier).toBe('Tier 1');
    });

    it('correctly classifies major regional centers into Tier 2 (10-29 mosques or active GSC search demand)', () => {
      const duesseldorfTier = getCityTier('Düsseldorf', 27, 51);
      expect(duesseldorfTier.tier).toBe('Tier 2');
      expect(duesseldorfTier.priority).toBe(0.8);

      const leipzigTier = getCityTier('Leipzig', 6, 119); // 6 mosques, 119 GSC impressions
      expect(leipzigTier.tier).toBe('Tier 2');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Page Metadata Consistency across Locales
  // --------------------------------------------------------------------------
  describe('4. Page Metadata Consistency across Locales', () => {
    it('city metadata generates complete reciprocal hreflang alternates', async () => {
      const metaDe = await generateGermanCityMetadata({
        params: { locale: 'de', city: 'berlin' },
      });
      expect(metaDe.alternates?.canonical).toBe('/de/moscheen/berlin');
      expect(metaDe.alternates?.languages?.de).toBe('/de/moscheen/berlin');
      expect(metaDe.alternates?.languages?.en).toBe('/en/mosques/berlin');
      expect(metaDe.alternates?.languages?.ar).toBe('/ar/mosques/berlin');
      expect(metaDe.alternates?.languages?.['x-default']).toBe('/de/moscheen/berlin');

      const metaEn = await generateEnArCityMetadata({
        params: { locale: 'en', city: 'cologne' },
      });
      expect(metaEn.alternates?.canonical).toBe('/en/mosques/cologne');
      expect(metaEn.alternates?.languages?.de).toBe('/de/moscheen/koeln');
      expect(metaEn.alternates?.languages?.en).toBe('/en/mosques/cologne');
      expect(metaEn.alternates?.languages?.ar).toBe('/ar/mosques/koeln');
    });

    it('mosque detail metadata generates complete reciprocal hreflang alternates and OpenGraph URLs', async () => {
      const mosques = await repo.getAllPublished();
      const sample = mosques[0];
      const config = getPublishedCityConfigs().find((c) => c.canonical === sample.city)!;

      const metaDe = await generateGermanDetailMetadata({
        params: { locale: 'de', city: config.slug, slug: sample.slug },
      });
      expect(metaDe.alternates?.canonical).toBe(`/de/moschee/${config.slug}/${sample.slug}`);
      expect(metaDe.alternates?.languages?.de).toBe(`/de/moschee/${config.slug}/${sample.slug}`);
      expect(metaDe.alternates?.languages?.en).toBe(`/en/mosque/${config.englishSlug}/${sample.slug}`);
      expect(metaDe.alternates?.languages?.ar).toBe(`/ar/mosque/${config.slug}/${sample.slug}`);
      expect(metaDe.openGraph?.url).toBe(`${SITE_URL}/de/moschee/${config.slug}/${sample.slug}`);

      const metaEn = await generateEnArDetailMetadata({
        params: { locale: 'en', city: config.englishSlug, slug: sample.slug },
      });
      expect(metaEn.alternates?.canonical).toBe(`/en/mosque/${config.englishSlug}/${sample.slug}`);
      expect(metaEn.openGraph?.url).toBe(`${SITE_URL}/en/mosque/${config.englishSlug}/${sample.slug}`);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Invariants Preservation
  // --------------------------------------------------------------------------
  describe('5. Invariants Preservation', () => {
    it('preserves exactly 601 published mosque entities', async () => {
      const published = await repo.getAllPublished();
      expect(published.length).toBe(601);
    });

    it('preserves exactly 20 published cities', async () => {
      const cities = await repo.getCities();
      const liveCities = cities.filter((c) => c.count >= 1);
      expect(liveCities.length).toBe(20);
    });

    it('preserves exactly 1,869 sitemap entries (3 home + 3 search + 20*3 cities + 601*3 mosques)', async () => {
      const entries = await sitemap();
      expect(entries.length).toBe(1869);
    });

    it('preserves robots.txt reference to root sitemap.xml', () => {
      const r = robots();
      expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    });

    it('preserves /de/sitemap.xml rewrite to /sitemap.xml in next.config.mjs', async () => {
      if (!nextConfig.rewrites) throw new Error('rewrites is undefined');
      const rewrites = await nextConfig.rewrites();
      const list = Array.isArray(rewrites) ? rewrites : rewrites.beforeFiles || [];
      const deRewrite = list.find((r: { source: string }) => r.source === '/de/sitemap.xml');
      expect(deRewrite).toBeDefined();
      expect(deRewrite?.destination).toBe('/sitemap.xml');
    });

    it('preserves all 454 redirect rules in src/data/redirects.json', async () => {
      const redirectsPath = path.join(ROOT, 'src/data/redirects.json');
      const redirectsList = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
      expect(redirectsList.length).toBe(454);

      if (!nextConfig.redirects) throw new Error('redirects is undefined');
      const configRedirects = await nextConfig.redirects();
      // 1 root redirect + 454 GSC redirects = 455
      expect(configRedirects.length).toBe(455);
    });
  });
});
