import { describe, it, expect } from 'vitest';
import { JsonMosqueRepository } from '../src/lib/db/json-repository';
import { MosqueEntitySchema } from '../src/pipeline/validate';
import { getCityUrl, getMosqueUrl, getSearchUrl, normalizeCitySlug } from '../src/lib/routes';
import sitemap from '../src/app/sitemap';
import robots from '../src/app/robots';
import nextConfig from '../next.config.mjs';

describe('Phase 1.5 Audit — 1. DATA QUALITY', () => {
  const repo = new JsonMosqueRepository();

  it('verifies that every published entity has all mandatory fields', async () => {
    const published = await repo.getAllPublished();
    expect(published.length).toBeGreaterThanOrEqual(38);

    const koelnMosques = published.filter((m) => m.city === 'Köln');
    expect(koelnMosques.length).toBeGreaterThanOrEqual(38);

    published.forEach((m) => {
      expect(m.canonicalName).toBeTruthy();
      expect(m.slug).toBeTruthy();
      expect(m.address).toBeTruthy();
      expect(m.postalCode).toMatch(/^\d{5}$/);
      expect(m.city).toBeTruthy();
      expect(m.latitude).toBeGreaterThanOrEqual(47.0);
      expect(m.latitude).toBeLessThanOrEqual(55.5);
      expect(m.longitude).toBeGreaterThanOrEqual(5.5);
      expect(m.longitude).toBeLessThanOrEqual(15.5);
      expect(m.category).toBeTruthy();
      expect(m.dataStatus).toBe('PUBLISHED');
      expect(MosqueEntitySchema.safeParse(m).success).toBe(true);
    });
  });

  it('verifies that organization affiliation is NEVER inferred solely from the mosque name', async () => {
    const published = await repo.getAllPublished();
    published.forEach((m) => {
      if (m.organization) {
        // Must have verified website domain provenance
        expect(m.website).toBeTruthy();
        const hasVerifiedDomain =
          m.website!.includes('ditib') ||
          m.website!.includes('vikz') ||
          m.website!.includes('ahmadiyya') ||
          m.website!.includes('igmg') ||
          m.website!.includes('atib');
        expect(hasVerifiedDomain).toBe(true);
      }
    });
  });

  it('verifies that co-located entities are NOT incorrectly merged', async () => {
    const report = await repo.getDataQualityReport();
    const coLocated = report.duplicateCandidates.filter((c) => c.actionTaken === 'FLAGGED_CO_LOCATED');
    expect(coLocated.length).toBeGreaterThan(0);

    // Verify both Masjid Hamza and Kulturzentrum were identified at Bergisch Gladbacher Str. 4 without blind merger
    const hamzaCheck = coLocated.find(
      (c) => c.primaryName.includes('Masjid Hamza') || c.duplicateName.includes('Masjid Hamza')
    );
    expect(hamzaCheck).toBeDefined();
    expect(hamzaCheck?.actionTaken).toBe('FLAGGED_CO_LOCATED');
  });

  it('verifies thin records with zero reviews/contact are held in REVIEWED', async () => {
    const all = await repo.getAllEntitiesForAdmin();
    const barboros = all.find((e) => e.canonicalName.includes('Barboros'));
    expect(barboros).toBeDefined();
    expect(barboros?.dataStatus).toBe('REVIEWED');
  });
});

describe('Phase 1.5 Audit — 2. SEO INDEXATION SAFETY', () => {
  const repo = new JsonMosqueRepository();

  it('verifies no /admin URLs appear in sitemap and robots disallows admin', async () => {
    const sitemapEntries = await sitemap();
    const urls = sitemapEntries.map((e) => e.url);

    expect(urls.some((u) => u.includes('admin'))).toBe(false);

    const r = robots();
    const disallowRules = Array.isArray(r.rules) ? r.rules[0].disallow : r.rules.disallow;
    expect(disallowRules).toContain('/admin');
    expect(disallowRules).toContain('/*/admin');
  });

  it('verifies sitemap contains only canonical indexable URLs with zero rejected/reviewed entities', async () => {
    const sitemapEntries = await sitemap();
    const published = await repo.getAllPublished();
    const all = await repo.getAllEntitiesForAdmin();
    const cities = await repo.getCities();
    const liveCities = cities.filter((c) => c.count >= 1);

    // Formula: 3 home + 3 search hubs + (liveCities * 3) city collection + (published * 3) detail pages
    // Only cities appearing in getPublishedCityConfigs contribute to the sitemap
    const { getPublishedCityConfigs: getPubConfigs } = await import('../src/pipeline/city-config');
    const publishedConfigs = getPubConfigs();
    const liveCitiesInSitemap = liveCities.filter(c => publishedConfigs.some(cfg => cfg.canonical === c.name));
    expect(sitemapEntries.length).toBe(3 + 3 + liveCitiesInSitemap.length * 3 + published.length * 3);

    const reviewedOrRejected = all.filter((e) => e.dataStatus !== 'PUBLISHED');
    const { CITY_CONFIGS } = await import('../src/pipeline/city-config');
    const sitemapUrls = new Set(sitemapEntries.map((s) => s.url));

    reviewedOrRejected.forEach((item) => {
      // If there is no published entity in that city with the exact same slug, that city+slug combo must not be in sitemap
      const config = CITY_CONFIGS.find((c) => c.canonical === item.city);
      if (config) {
        const publishedInSameCityWithSlug = published.some(
          (p) => p.city === item.city && p.slug === item.slug
        );
        if (!publishedInSameCityWithSlug) {
          expect(sitemapUrls.has(`https://moscheeatlas.de/de/moschee/${config.slug}/${item.slug}`)).toBe(false);
          expect(sitemapUrls.has(`https://moscheeatlas.de/en/mosque/${config.englishSlug}/${item.slug}`)).toBe(false);
          expect(sitemapUrls.has(`https://moscheeatlas.de/ar/mosque/${config.slug}/${item.slug}`)).toBe(false);
        }
      }
    });
  });

  it('verifies every published mosque appears exactly once per locale in sitemap', async () => {
    const sitemapEntries = await sitemap();
    const urls = sitemapEntries.map((e) => e.url);
    const published = await repo.getAllPublished();
    const { CITY_CONFIGS } = await import('../src/pipeline/city-config');

    published.forEach((m) => {
      const config = CITY_CONFIGS.find((c) => c.canonical === m.city);
      if (!config) return;
      const deMatches = urls.filter((u) => u === `https://moscheeatlas.de/de/moschee/${config.slug}/${m.slug}`);
      const enMatches = urls.filter((u) => u === `https://moscheeatlas.de/en/mosque/${config.englishSlug}/${m.slug}`);
      const arMatches = urls.filter((u) => u === `https://moscheeatlas.de/ar/mosque/${config.slug}/${m.slug}`);

      expect(deMatches.length).toBe(1);
      expect(enMatches.length).toBe(1);
      expect(arMatches.length).toBe(1);
    });
  });
});

describe('Phase 1.5 Audit — 3. CONTENT QUALITY', () => {
  const repo = new JsonMosqueRepository();

  it('verifies that missing information is never fabricated', async () => {
    const published = await repo.getAllPublished();

    // Verify entities with no phone remain null
    const withoutPhone = published.filter((m) => m.phone === null);
    expect(withoutPhone.length).toBeGreaterThan(0);

    // Verify entities with no website remain null
    const withoutWeb = published.filter((m) => m.website === null);
    expect(withoutWeb.length).toBeGreaterThan(0);

    // Verify entities with no hours remain null
    const withoutHours = published.filter((m) => m.openingHours === null);
    expect(withoutHours.length).toBeGreaterThan(0);

    // Verify unconfirmed facilities remain null
    published.forEach((m) => {
      expect(typeof m.facilities).toBe('object');
      // If facility not explicitly present in raw data, it must be null (never assumed true)
      if (m.facilities.womenArea !== true) {
        expect(m.facilities.womenArea).toBeNull();
      }
    });
  });
});

describe('Phase 1.5 Audit — 4. SEARCH & GERMAN UMLAUTS', () => {
  const repo = new JsonMosqueRepository();

  it('supports case-insensitive German umlaut search (muelheim -> Mülheim)', async () => {
    const muelheimResults = await repo.getAllPublished({ query: 'muelheim' });
    const muelheimUmlaut = await repo.getAllPublished({ query: 'Mülheim' });

    expect(muelheimResults.length).toBeGreaterThan(0);
    expect(muelheimResults.length).toBe(muelheimUmlaut.length);
  });

  it('supports case-insensitive city search (koln -> Köln)', async () => {
    const kolnResults = await repo.getAllPublished({ query: 'koln' });
    const koelnResults = await repo.getAllPublished({ query: 'Köln' });

    expect(kolnResults.length).toBeGreaterThan(0);
    expect(kolnResults.length).toBe(koelnResults.length);
  });

  it('filters by postal code accurately', async () => {
    const results = await repo.getAllPublished({ postalCode: '51103' });
    expect(results.length).toBeGreaterThan(0);
    results.forEach((m) => expect(m.postalCode).toBe('51103'));
  });

  it('filters by category accurately', async () => {
    const mosquesOnly = await repo.getAllPublished({ category: 'MOSQUE' });
    expect(mosquesOnly.length).toBeGreaterThan(0);
    mosquesOnly.forEach((m) => expect(m.category).toBe('MOSQUE'));
  });

  it('sorts by distance when user location is provided', async () => {
    // Center of Köln
    const userLat = 50.9375;
    const userLng = 6.9603;

    const results = await repo.getAllPublished({
      userLocation: { latitude: userLat, longitude: userLng },
    });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].distanceKm).toBeDefined();
    for (let i = 0; i < results.length - 1; i++) {
      expect(results[i].distanceKm!).toBeLessThanOrEqual(results[i + 1].distanceKm!);
    }
  });

  it('handles empty/no-result states cleanly', async () => {
    const results = await repo.getAllPublished({ query: 'XYZNonExistentMosque12345' });
    expect(results.length).toBe(0);
  });
});

describe('Phase 1.5 Audit — 5. MAP INTEGRATION', () => {
  const repo = new JsonMosqueRepository();

  it('verifies all published coordinates are valid and map markers only show published entities', async () => {
    const published = await repo.getAllPublished();
    const all = await repo.getAllEntitiesForAdmin();

    published.forEach((m) => {
      expect(Number.isFinite(m.latitude)).toBe(true);
      expect(Number.isFinite(m.longitude)).toBe(true);
    });

    const publishedIds = new Set(published.map((p) => p.id));
    const rejectedIds = all.filter((e) => e.dataStatus === 'REJECTED').map((r) => r.id);

    rejectedIds.forEach((id) => {
      expect(publishedIds.has(id)).toBe(false);
    });
  });
});

describe('Phase 1.5 Audit — 6. ROUTING INTEGRITY', () => {
  const repo = new JsonMosqueRepository();

  it('returns null for unknown slugs', async () => {
    const unknown = await repo.getBySlug('non-existent-mosque-slug-999');
    expect(unknown).toBeNull();
  });

  it('normalizes city slugs correctly', () => {
    expect(normalizeCitySlug('cologne')).toBe('koeln');
    expect(normalizeCitySlug('Cologne')).toBe('koeln');
    expect(normalizeCitySlug('Köln')).toBe('koeln');
    expect(normalizeCitySlug('unknown-city')).toBe('unknown-city');
  });
});

describe('Phase 1.5 Audit — 7. SECURITY & CLIENT HYGIENE', () => {
  it('verifies nextConfig contains required security headers', async () => {
    const headers = await nextConfig.headers!();
    const allHeaders = headers[0].headers;

    const keys = allHeaders.map((h: any) => h.key);
    expect(keys).toContain('Strict-Transport-Security');
    expect(keys).toContain('X-Content-Type-Options');
    expect(keys).toContain('X-Frame-Options');
    expect(keys).toContain('Referrer-Policy');
    expect(keys).toContain('Content-Security-Policy');
    expect(keys).toContain('Permissions-Policy');
  });
});
