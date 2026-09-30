/**
 * Phase 2B SEO Regression Tests
 * MoscheeAtlas.de — Production SEO, Data Quality & Indexability Audit
 *
 * Assertions:
 * 1.  No hardcoded "germany-mosque-finder.de" domain in key config files
 * 2.  SITE_URL resolves to moscheeatlas.de
 * 3.  All 9 cities have published mosques (non-zero count)
 * 4.  No zero-coordinate mosques in published set
 * 5.  No same-city slug collisions
 * 6.  Total published count is >= 440 (Phase 2A baseline)
 * 7.  All published mosques have a city field
 * 8.  All published mosques have a slug field
 * 9.  No published mosque has status !== 'published'
 * 10. Sitemap has no duplicate URLs
 * 11. Sitemap has no admin URLs
 * 12. Sitemap has >= 1000 entries
 * 13. All sitemap URLs are HTTPS
 * 14. Robots.ts disallows /admin
 * 15. Robots.ts allows /
 * 16. DE i18n pilotBadge does NOT contain "Köln" or "Pilot" (must be Germany-wide)
 * 17. EN i18n pilotBadge does NOT contain "Cologne" or "Pilot"
 * 18. AR i18n pilotBadge does NOT contain "كولونيا" or "إطلاق"
 * 19. All 9 expected city slugs appear in published data
 * 20. No published mosque address contains "undefined" or "null" string
 */

import { describe, it, expect } from 'vitest';
import { JsonMosqueRepository } from '../src/lib/db/json-repository';
import { SITE_URL, SITE_NAME } from '../src/lib/config';
import { getDictionary } from '../src/lib/i18n';
import sitemap from '../src/app/sitemap';
import robots from '../src/app/robots';

const EXPECTED_CITY_SLUGS = [
  'Berlin',
  'Hamburg',
  'München',
  'Frankfurt', // actual city name in DB (not "Frankfurt am Main")
  'Dortmund',
  'Köln',
  'Stuttgart',
  'Düsseldorf',
  'Essen',
];

const EXPECTED_MIN_PUBLISHED = 440;

describe('Phase 2B — SEO & Data Quality Regression', () => {
  const repo = new JsonMosqueRepository();

  // ---- Test 1: No hardcoded legacy domain in SITE_URL ----
  it('1. SITE_URL does not contain legacy germany-mosque-finder.de domain', () => {
    expect(SITE_URL).not.toContain('germany-mosque-finder.de');
  });

  // ---- Test 2: SITE_URL resolves to moscheeatlas.de (default) ----
  it('2. SITE_URL default resolves to moscheeatlas.de', () => {
    // Allow override via env but the default must be correct
    const expected = process.env.NEXT_PUBLIC_SITE_URL || 'https://moscheeatlas.de';
    expect(SITE_URL).toBe(expected);
  });

  // ---- Tests 3–9: Published data quality ----
  it('3. All 9 expected cities have at least 1 published mosque', async () => {
    const mosques = await repo.getAllPublished();
    for (const cityName of EXPECTED_CITY_SLUGS) {
      const count = mosques.filter((m) => m.city === cityName).length;
      expect(count, `Expected >0 published mosques for city: ${cityName}`).toBeGreaterThan(0);
    }
  });

  it('4. No published mosque has zero or missing coordinates', async () => {
    const mosques = await repo.getAllPublished();
    const zeroCoords = mosques.filter(
      (m) => {
        const lat = (m as unknown as { latitude?: number }).latitude;
        const lng = (m as unknown as { longitude?: number }).longitude;
        return !lat || !lng || lat === 0 || lng === 0;
      }
    );
    expect(zeroCoords.length, `Found ${zeroCoords.length} mosques with zero/missing coordinates`).toBe(0);
  });

  it('5. No same-city slug collisions in published data', async () => {
    const mosques = await repo.getAllPublished();
    const seen = new Set<string>();
    const collisions: string[] = [];
    for (const m of mosques) {
      const key = `${m.city}::${m.slug}`;
      if (seen.has(key)) {
        collisions.push(key);
      }
      seen.add(key);
    }
    expect(collisions, `Same-city slug collisions: ${collisions.join(', ')}`).toHaveLength(0);
  });

  it('6. Total published count is >= 440 (Phase 2A baseline)', async () => {
    const mosques = await repo.getAllPublished();
    expect(mosques.length).toBeGreaterThanOrEqual(EXPECTED_MIN_PUBLISHED);
  });

  it('7. All published mosques have a non-empty city field', async () => {
    const mosques = await repo.getAllPublished();
    const missing = mosques.filter((m) => !m.city || m.city.trim() === '');
    expect(missing.length, `${missing.length} mosques missing city field`).toBe(0);
  });

  it('8. All published mosques have a non-empty slug field', async () => {
    const mosques = await repo.getAllPublished();
    const missing = mosques.filter((m) => !m.slug || m.slug.trim() === '');
    expect(missing.length, `${missing.length} mosques missing slug`).toBe(0);
  });

  it('9. No published mosque has status other than "published"', async () => {
    const mosques = await repo.getAllPublished();
    const bad = mosques.filter((m) => (m as { status?: string }).status && (m as { status?: string }).status !== 'published');
    expect(bad.length, `${bad.length} mosques with non-published status`).toBe(0);
  });

  // ---- Tests 10–13: Sitemap ----
  it('10. Sitemap has no duplicate URLs', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size, `Sitemap has ${urls.length - uniqueUrls.size} duplicate URLs`).toBe(urls.length);
  });

  it('11. Sitemap has no admin URLs', async () => {
    const entries = await sitemap();
    const adminUrls = entries.filter((e) => e.url.includes('/admin'));
    expect(adminUrls.length, `Sitemap contains admin URLs: ${adminUrls.map((e) => e.url).join(', ')}`).toBe(0);
  });

  it('12. Sitemap has >= 1000 entries', async () => {
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThanOrEqual(1000);
  });

  it('13. All sitemap URLs are HTTPS', async () => {
    const entries = await sitemap();
    const nonHttps = entries.filter((e) => !e.url.startsWith('https://'));
    expect(nonHttps.length, `Non-HTTPS URLs in sitemap: ${nonHttps.map((e) => e.url).join(', ')}`).toBe(0);
  });

  // ---- Tests 14–15: Robots ----
  it('14. Robots disallows /admin path', async () => {
    const result = await robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const allDisallowed = rules.flatMap((r) =>
      Array.isArray(r.disallow) ? r.disallow : r.disallow ? [r.disallow] : []
    );
    const disallowsAdmin = allDisallowed.some((d) => d.includes('/admin') || d === '/admin');
    expect(disallowsAdmin, 'Robots.txt should disallow /admin').toBe(true);
  });

  it('15. Robots allows /', async () => {
    const result = await robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const allAllowed = rules.flatMap((r) =>
      Array.isArray(r.allow) ? r.allow : r.allow ? [r.allow] : []
    );
    // Either allow '/' explicitly, or no disallow of '/' (allow by default)
    const disallowsRoot = rules.flatMap((r) =>
      Array.isArray(r.disallow) ? r.disallow : r.disallow ? [r.disallow] : []
    ).includes('/');
    expect(disallowsRoot, 'Robots.txt must not disallow /').toBe(false);
  });

  // ---- Tests 16–18: i18n copy quality ----
  it('16. DE pilotBadge does not contain "Köln" or "Pilot"', () => {
    const dict = getDictionary('de');
    const badge = dict.home.pilotBadge;
    expect(badge).not.toMatch(/Köln/i);
    expect(badge).not.toMatch(/Pilot/i);
  });

  it('17. EN pilotBadge does not contain "Cologne" or "Pilot"', () => {
    const dict = getDictionary('en');
    const badge = dict.home.pilotBadge;
    expect(badge).not.toMatch(/Cologne/i);
    expect(badge).not.toMatch(/Pilot/i);
  });

  it('18. AR pilotBadge does not contain Cologne pilot Arabic text', () => {
    const dict = getDictionary('ar');
    const badge = dict.home.pilotBadge;
    expect(badge).not.toContain('كولونيا');
    expect(badge).not.toContain('إطلاق');
  });

  // ---- Test 19: All 9 cities present ----
  it('19. All 9 expected city names appear in published data', async () => {
    const mosques = await repo.getAllPublished();
    const cities = new Set(mosques.map((m) => m.city));
    for (const cityName of EXPECTED_CITY_SLUGS) {
      expect(cities.has(cityName), `City "${cityName}" not found in published data`).toBe(true);
    }
  });

  // ---- Test 20: No "undefined" or "null" string in addresses ----
  it('20. No published mosque address contains literal "undefined" or "null"', async () => {
    const mosques = await repo.getAllPublished();
    const bad = mosques.filter((m) => {
      const addr = [m.address, m.canonicalName].filter(Boolean).join(' ');
      return addr.includes('undefined') || addr.includes('null');
    });
    expect(bad.length, `${bad.length} mosques have "undefined"/"null" in address/name`).toBe(0);
  });
});
