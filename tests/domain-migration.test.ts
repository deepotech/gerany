/**
 * Production Domain Migration Regression Test Suite
 * Canonical Domain: https://moscheeindernaehe.de
 * Brand: MoscheeAtlas
 */

import { describe, it, expect } from 'vitest';
import { SITE_URL, SITE_NAME, SITE_DOMAIN } from '../src/lib/config';
import sitemap from '../src/app/sitemap';
import robots from '../src/app/robots';
import { generateMosqueJsonLd, generateBreadcrumbJsonLd } from '../src/lib/seo/schema';
import { JsonMosqueRepository } from '../src/lib/db/json-repository';
import { metadata as rootMetadata } from '../src/app/layout';
import { generateMetadata as generateHomeMetadata } from '../src/app/[locale]/page';
import { generateMetadata as generateGermanSearchMetadata } from '../src/app/[locale]/moscheen/page';
import { generateMetadata as generateEnglishSearchMetadata } from '../src/app/[locale]/mosques/page';
import { generateMetadata as generateGermanCityMetadata } from '../src/app/[locale]/moscheen/[city]/page';
import { generateMetadata as generateEnglishArabicCityMetadata } from '../src/app/[locale]/mosques/[city]/page';
import { generateMetadata as generateGermanDetailMetadata } from '../src/app/[locale]/moschee/[city]/[slug]/page';
import { generateMetadata as generateEnglishArabicDetailMetadata } from '../src/app/[locale]/mosque/[city]/[slug]/page';
import { getPublishedCityConfigs } from '../src/pipeline/city-config';

describe('Production Domain Migration: moscheeindernaehe.de', () => {
  const repo = new JsonMosqueRepository();

  // 1. Canonical Domain Configuration
  describe('1. Central Site Configuration', () => {
    it('resolves SITE_URL to https://moscheeindernaehe.de by default', () => {
      const expected = process.env.NEXT_PUBLIC_SITE_URL || 'https://moscheeindernaehe.de';
      expect(SITE_URL).toBe(expected);
      expect(SITE_URL).toBe('https://moscheeindernaehe.de');
    });

    it('uses HTTPS protocol and no trailing slash', () => {
      expect(SITE_URL.startsWith('https://')).toBe(true);
      expect(SITE_URL.endsWith('/')).toBe(false);
    });

    it('uses apex domain without www prefix', () => {
      expect(SITE_URL).not.toContain('www.');
      expect(SITE_DOMAIN).toBe('moscheeindernaehe.de');
    });

    it('preserves the brand name as MoscheeAtlas', () => {
      expect(SITE_NAME).toBe('MoscheeAtlas');
    });

    it('does not contain old domain moscheeatlas.de in SITE_URL or SITE_DOMAIN', () => {
      expect(SITE_URL).not.toContain('moscheeatlas.de');
      expect(SITE_DOMAIN).not.toContain('moscheeatlas.de');
    });
  });

  // 2. Next.js Metadata & Root Layout
  describe('2. MetadataBase & Root Configuration', () => {
    it('sets metadataBase in root layout to https://moscheeindernaehe.de', () => {
      expect(rootMetadata.metadataBase).toBeDefined();
      expect(rootMetadata.metadataBase?.origin).toBe('https://moscheeindernaehe.de');
      expect(rootMetadata.metadataBase?.toString()).toBe('https://moscheeindernaehe.de/');
    });

    it('ensures root title uses MoscheeAtlas brand without old domain suffix', () => {
      const titleTemplate = (rootMetadata.title as { template?: string })?.template;
      expect(titleTemplate).toContain('MoscheeAtlas');
      expect(titleTemplate).not.toContain('moscheeatlas.de');
    });
  });

  // 3. Sitemap URL Canonicalization
  describe('3. Sitemap Generation', () => {
    it('generates all sitemap URLs strictly starting with https://moscheeindernaehe.de', async () => {
      const entries = await sitemap();
      expect(entries.length).toBe(1674);

      for (const entry of entries) {
        expect(entry.url.startsWith('https://moscheeindernaehe.de/')).toBe(true);
      }
    });

    it('contains ZERO occurrences of moscheeatlas.de in sitemap URLs', async () => {
      const entries = await sitemap();
      for (const entry of entries) {
        expect(entry.url).not.toContain('moscheeatlas.de');
      }
    });

    it('contains no duplicate URLs in sitemap', async () => {
      const entries = await sitemap();
      const urls = entries.map((e) => e.url);
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(entries.length);
    });

    it('contains no query string parameters or admin routes in sitemap', async () => {
      const entries = await sitemap();
      for (const entry of entries) {
        expect(entry.url).not.toContain('?');
        expect(entry.url).not.toContain('/admin');
      }
    });

    it('verifies exact baseline breakdown: 3 home, 3 search hub, 42 city, 1,626 detail = 1,674 URLs', async () => {
      const entries = await sitemap();
      const homeUrls = entries.filter((e) => ['/de', '/en', '/ar'].some((h) => e.url.endsWith(h)));
      expect(homeUrls.length).toBe(3);

      const hubUrls = entries.filter((e) =>
        ['/de/moscheen', '/en/mosques', '/ar/mosques'].some((h) => e.url.endsWith(h))
      );
      expect(hubUrls.length).toBe(3);

      const publishedCities = getPublishedCityConfigs();
      expect(publishedCities.length).toBe(14);

      const expectedTotal = 3 + 3 + (14 * 3) + (542 * 3);
      expect(expectedTotal).toBe(1674);
      expect(entries.length).toBe(1674);
    });
  });

  // 4. Robots.txt Configuration
  describe('4. Robots.txt Generation', () => {
    it('sets sitemap declaration to https://moscheeindernaehe.de/sitemap.xml', () => {
      const r = robots();
      expect(r.sitemap).toBe('https://moscheeindernaehe.de/sitemap.xml');
      expect(r.sitemap).not.toContain('moscheeatlas.de');
    });

    it('preserves existing crawl rules and admin protection', () => {
      const r = robots();
      const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
      const disallows = rules.flatMap((rule) =>
        Array.isArray(rule.disallow) ? rule.disallow : rule.disallow ? [rule.disallow] : []
      );
      expect(disallows).toContain('/admin');
      expect(disallows).toContain('/*/admin');
      expect(disallows).toContain('/api/');
    });
  });

  // 5. Alternates & Hreflang Configuration
  describe('5. Alternates & Hreflang across Routes', () => {
    it('generates home page alternates with valid localized relative paths matching metadataBase', async () => {
      const meta = await generateHomeMetadata({ params: { locale: 'de' } });
      expect(meta.alternates?.canonical).toBe('/de');
      expect(meta.alternates?.languages?.de).toBe('/de');
      expect(meta.alternates?.languages?.en).toBe('/en');
      expect(meta.alternates?.languages?.ar).toBe('/ar');
      expect(meta.openGraph?.url).toBe('https://moscheeindernaehe.de/de');
      expect(meta.openGraph?.siteName).toBe('MoscheeAtlas');
    });

    it('generates search page alternates with valid paths', async () => {
      const metaDe = await generateGermanSearchMetadata({ params: { locale: 'de' } });
      expect(metaDe.alternates?.canonical).toBe('/de/moscheen');

      const metaEn = await generateEnglishSearchMetadata({ params: { locale: 'en' } });
      expect(metaEn.alternates?.canonical).toBe('/en/mosques');
    });

    it('generates city collection page alternates and OpenGraph URLs', async () => {
      const metaDe = await generateGermanCityMetadata({ params: { locale: 'de', city: 'koeln' } });
      expect(metaDe.alternates?.canonical).toBe('/de/moscheen/koeln');
      expect(metaDe.openGraph?.url).toBe('https://moscheeindernaehe.de/de/moscheen/koeln');

      const metaEn = await generateEnglishArabicCityMetadata({ params: { locale: 'en', city: 'cologne' } });
      expect(metaEn.alternates?.canonical).toBe('/en/mosques/cologne');
      expect(metaEn.openGraph?.url).toBe('https://moscheeindernaehe.de/en/mosques/cologne');
    });

    it('generates mosque detail page alternates and OpenGraph URLs', async () => {
      const mosques = await repo.getAllPublished();
      const sample = mosques[0];
      const config = getPublishedCityConfigs().find((c) => c.canonical === sample.city)!;

      const metaDe = await generateGermanDetailMetadata({
        params: { locale: 'de', city: config.slug, slug: sample.slug },
      });
      expect(metaDe.alternates?.canonical).toBe(`/de/moschee/${config.slug}/${sample.slug}`);
      expect(metaDe.openGraph?.url).toBe(
        `https://moscheeindernaehe.de/de/moschee/${config.slug}/${sample.slug}`
      );
      expect(metaDe.openGraph?.url).not.toContain('moscheeatlas.de');

      const metaEn = await generateEnglishArabicDetailMetadata({
        params: { locale: 'en', city: config.englishSlug, slug: sample.slug },
      });
      expect(metaEn.alternates?.canonical).toBe(`/en/mosque/${config.englishSlug}/${sample.slug}`);
      expect(metaEn.openGraph?.url).toBe(
        `https://moscheeindernaehe.de/en/mosque/${config.englishSlug}/${sample.slug}`
      );
      expect(metaEn.openGraph?.url).not.toContain('moscheeatlas.de');
    });
  });

  // 6. JSON-LD Structured Data
  describe('6. JSON-LD Schema Canonical URLs', () => {
    it('generates Mosque JSON-LD with new canonical domain URL and @id', async () => {
      const mosques = await repo.getAllPublished();
      const sample = mosques[0];
      const schema = generateMosqueJsonLd(sample, 'de');

      expect(schema['@id'].startsWith('https://moscheeindernaehe.de/')).toBe(true);
      expect(schema.url.startsWith('https://moscheeindernaehe.de/')).toBe(true);
      expect(schema['@id']).not.toContain('moscheeatlas.de');
      expect(schema.url).not.toContain('moscheeatlas.de');
    });

    it('generates BreadcrumbList JSON-LD with new canonical domain', () => {
      const items = [
        { name: 'Home', url: '/de' },
        { name: 'Köln', url: '/de/moscheen/koeln' },
        { name: 'Moschee', url: '/de/moschee/koeln/sample-mosque' },
      ];
      const breadcrumbs = generateBreadcrumbJsonLd(items);

      expect(breadcrumbs.itemListElement[0].item).toBe('https://moscheeindernaehe.de/de');
      expect(breadcrumbs.itemListElement[1].item).toBe('https://moscheeindernaehe.de/de/moscheen/koeln');
      expect(breadcrumbs.itemListElement[2].item).toBe(
        'https://moscheeindernaehe.de/de/moschee/koeln/sample-mosque'
      );
      for (const el of breadcrumbs.itemListElement) {
        expect(el.item).not.toContain('moscheeatlas.de');
      }
    });
  });

  // 7. Production Baseline Safety
  describe('7. Production Baseline Invariant Protection', () => {
    it('verifies exactly 542 published records remain unchanged', async () => {
      const mosques = await repo.getAllPublished();
      expect(mosques.length).toBe(542);
    });

    it('verifies exactly 14 published cities remain unchanged', async () => {
      const cities = await repo.getCities();
      const liveCities = cities.filter((c) => c.count >= 1);
      expect(liveCities.length).toBe(14);
    });

    it('verifies all 542 published entities remain UNVERIFIED (zero artificial upgrades)', async () => {
      const mosques = await repo.getAllPublished();
      const unverified = mosques.filter((m) => m.verificationStatus === 'UNVERIFIED');
      expect(unverified.length).toBe(542);
    });
  });
});
