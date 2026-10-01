import { describe, it, expect } from 'vitest';
import { getCityUrl, getMosqueUrl, normalizeCitySlug, getSearchUrl } from '../src/lib/routes';
import { generateMosqueJsonLd, generateBreadcrumbJsonLd } from '../src/lib/seo/schema';
import { JsonMosqueRepository } from '../src/lib/db/json-repository';
import { MosqueEntitySchema } from '../src/pipeline/validate';
import sitemap from '../src/app/sitemap';
import robots from '../src/app/robots';

describe('1. Multilingual Routing Requirements', () => {
  it('generates exact German routes', () => {
    expect(getSearchUrl('de')).toBe('/de/moscheen');
    expect(getCityUrl('de', 'koeln')).toBe('/de/moscheen/koeln');
    expect(getMosqueUrl('de', 'koeln', 'fatih-moschee')).toBe('/de/moschee/koeln/fatih-moschee');
  });

  it('generates exact English routes', () => {
    expect(getSearchUrl('en')).toBe('/en/mosques');
    expect(getCityUrl('en', 'cologne')).toBe('/en/mosques/cologne');
    expect(getMosqueUrl('en', 'cologne', 'fatih-moschee')).toBe('/en/mosque/cologne/fatih-moschee');
  });

  it('generates exact Arabic routes', () => {
    expect(getSearchUrl('ar')).toBe('/ar/mosques');
    expect(getCityUrl('ar', 'koeln')).toBe('/ar/mosques/koeln');
    expect(getMosqueUrl('ar', 'koeln', 'fatih-moschee')).toBe('/ar/mosque/koeln/fatih-moschee');
  });

  it('normalizes city slugs correctly', () => {
    expect(normalizeCitySlug('Cologne')).toBe('koeln');
    expect(normalizeCitySlug('Köln')).toBe('koeln');
    expect(normalizeCitySlug('koeln')).toBe('koeln');
  });
});

describe('2. SEO & Schema.org JSON-LD Generation', () => {
  const repo = new JsonMosqueRepository();

  it('generates valid Schema.org Mosque JSON-LD', async () => {
    const mosques = await repo.getAllPublished();
    const mosque = mosques[0];

    const jsonLd = generateMosqueJsonLd(mosque, 'de');
    expect(jsonLd['@context']).toBe('https://schema.org');
    expect(jsonLd['@type']).toBe('Mosque');
    expect(jsonLd.name).toBe(mosque.translations.de.name);
    expect(jsonLd.geo['@type']).toBe('GeoCoordinates');
    expect(jsonLd.geo.latitude).toBe(mosque.latitude);
    expect(jsonLd.geo.longitude).toBe(mosque.longitude);
    expect(jsonLd.address['@type']).toBe('PostalAddress');
    expect(jsonLd.address.addressCountry).toBe('DE');
  });

  it('generates valid BreadcrumbList JSON-LD', () => {
    const items = [
      { name: 'Home', url: '/de' },
      { name: 'Köln', url: '/de/moscheen/koeln' },
      { name: 'Fatih Moschee', url: '/de/moschee/koeln/fatih-moschee' },
    ];
    const breadcrumbLd = generateBreadcrumbJsonLd(items);
    expect(breadcrumbLd['@type']).toBe('BreadcrumbList');
    expect(breadcrumbLd.itemListElement.length).toBe(3);
    expect(breadcrumbLd.itemListElement[0].position).toBe(1);
    expect(breadcrumbLd.itemListElement[2].item).toContain('/de/moschee/koeln/fatih-moschee');
  });

  it('generates sitemap with all published mosques across 3 locales', async () => {
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(100); // 3 home + 3*9 city + (443 * 3) mosques

    const urls = entries.map((e) => e.url);
    expect(urls).toContain('https://moscheeindernaehe.de/de');
    expect(urls).toContain('https://moscheeindernaehe.de/en');
    expect(urls).toContain('https://moscheeindernaehe.de/ar');
    expect(urls).toContain('https://moscheeindernaehe.de/de/moscheen/koeln');
    expect(urls).toContain('https://moscheeindernaehe.de/en/mosques/cologne');
    expect(urls).toContain('https://moscheeindernaehe.de/ar/mosques/koeln');
  });

  it('generates robots.txt disallowing admin and thin query params', () => {
    const r = robots();
    expect(r.rules).toBeDefined();
    expect(r.sitemap).toBe('https://moscheeindernaehe.de/sitemap.xml');
  });
});

describe('3. Zod Strict Validation on All Published Entities', () => {
  const repo = new JsonMosqueRepository();

  it('validates that every published mosque satisfies the strict entity schema', async () => {
    const mosques = await repo.getAllPublished();
    expect(mosques.length).toBeGreaterThanOrEqual(38);

    for (const m of mosques) {
      const parsed = MosqueEntitySchema.safeParse(m);
      if (!parsed.success) {
        console.error('Failed entity:', m.canonicalName, parsed.error.errors);
      }
      expect(parsed.success).toBe(true);
      expect(m.latitude).toBeGreaterThanOrEqual(47.0);
      expect(m.latitude).toBeLessThanOrEqual(55.5);
      expect(m.longitude).toBeGreaterThanOrEqual(5.5);
      expect(m.longitude).toBeLessThanOrEqual(15.5);
      expect(m.postalCode).toMatch(/^\d{5}$/);
      expect(m.dataStatus).toBe('PUBLISHED');
      expect(m.translations.de.name.length).toBeGreaterThan(1);
      expect(m.translations.en.name.length).toBeGreaterThan(1);
      expect(m.translations.ar.name.length).toBeGreaterThan(1);
    }
  });
});
