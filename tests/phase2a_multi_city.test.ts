import { describe, it, expect } from 'vitest';
import { parseAddress } from '../src/pipeline/normalize';
import { classifyRecord } from '../src/pipeline/classify';
import { ensureUniqueSlugs, generateCanonicalSlug } from '../src/pipeline/slugs';
import { resolveCanonicalCity, CITY_CONFIGS, getCityRouteSlug } from '../src/pipeline/city-config';
import { normalizeCitySlug, getCityUrl, getMosqueUrl } from '../src/lib/routes';
import { runPipeline } from '../src/pipeline/runner';

// ─── 1. Multi-City Normalization ───────────────────────────────────────────────

describe('Phase 2A — Multi-City Normalization', () => {
  it('resolves Berlin postal codes to Berlin', () => {
    const result = resolveCanonicalCity('10115', null, 'Berlin');
    expect(result).not.toBeNull();
    expect(result!.config.canonical).toBe('Berlin');
    expect(result!.isCrossCity).toBe(false);
  });

  it('resolves München postal codes to München', () => {
    const result = resolveCanonicalCity('80331', null, 'München');
    expect(result).not.toBeNull();
    expect(result!.config.canonical).toBe('München');
  });

  it('resolves Frankfurt postal code to Frankfurt', () => {
    const result = resolveCanonicalCity('60329', null, 'Frankfurt');
    expect(result).not.toBeNull();
    expect(result!.config.canonical).toBe('Frankfurt');
  });

  it('normalizes Frankfurt am Main city field to canonical Frankfurt', () => {
    const result = resolveCanonicalCity(null, 'Frankfurt am Main', undefined);
    expect(result).not.toBeNull();
    expect(result!.config.canonical).toBe('Frankfurt');
  });

  it('parses Berlin address and extracts city correctly', () => {
    const addr = parseAddress('Quickborner Str. 96, 13439 Berlin, Germany', '13439', 'Berlin');
    expect(addr.city).toBe('Berlin');
    expect(addr.postalCode).toBe('13439');
    expect(addr.state).toBe('Berlin');
  });

  it('parses Hamburg address with suburb district', () => {
    const addr = parseAddress('Efftingestraße 19, 22041 Wandsbek, Germany', '22041', 'Hamburg');
    expect(addr.city).toBe('Hamburg');
    expect(addr.postalCode).toBe('22041');
  });

  it('parses München address correctly', () => {
    const addr = parseAddress('Neumarkter Str. 70A, 81673 München-Berg am Laim, Germany', '81673', 'München');
    expect(addr.city).toBe('München');
  });

  it('detects Kornwestheim (70806) as cross-city anomaly in Stuttgart dataset', () => {
    const result = resolveCanonicalCity('70806', null, 'Stuttgart');
    // 70806 is outside Stuttgart's 70001-70629 range.
    // It should not resolve to Stuttgart; returns null to flag as unknown city for review
    expect(result).toBeNull();
  });

  it('Köln pilot: still resolves Köln postal 50735 correctly', () => {
    const addr = parseAddress('Eichhornstraße 4, 50735 Nippes, Germany', '50735', 'Köln');
    expect(addr.city).toBe('Köln');
    expect(addr.district).toBe('Nippes');
    expect(addr.postalCode).toBe('50735');
  });
});

// ─── 2. Cross-City Deduplication ─────────────────────────────────────────────

describe('Phase 2A — Cross-City Deduplication', () => {
  it('allows same slug in different cities', () => {
    const slugs = ensureUniqueSlugs([
      { title: 'Fatih Moschee', city: 'Köln', district: null },
      { title: 'Fatih Moschee', city: 'Berlin', district: null },
    ]);
    // Both should get the same slug (no collision since different cities)
    expect(slugs[0]).toBe('fatih-moschee');
    expect(slugs[1]).toBe('fatih-moschee');
  });

  it('disambiguates same slug within same city', () => {
    const slugs = ensureUniqueSlugs([
      { title: 'DITIB Moschee', city: 'Berlin', district: 'Mitte' },
      { title: 'DITIB Moschee', city: 'Berlin', district: 'Neukölln' },
    ]);
    expect(slugs[0]).toBe('ditib-moschee');
    expect(slugs[1]).toBe('ditib-moschee-neukoelln');
  });

  it('pipelines two cities independently without cross-contamination', () => {
    const berlinRaw = [
      { placeId: 'BER001', title: 'Omar Moschee', address: 'Str. 1, 10115 Berlin, Germany', postalCode: '10115', categoryName: 'Mosque', location: { lat: 52.5, lng: 13.4 }, reviewsCount: 10 },
    ];
    const hamburhRaw = [
      { placeId: 'HBG001', title: 'Omar Moschee', address: 'Str. 1, 20099 Hamburg, Germany', postalCode: '20099', categoryName: 'Mosque', location: { lat: 53.5, lng: 10.0 }, reviewsCount: 8 },
    ];
    const berResult = runPipeline(berlinRaw, 'Berlin');
    const hbgResult = runPipeline(hamburhRaw, 'Hamburg');

    // Both should be published with their own city
    expect(berResult.publishedEntities[0].city).toBe('Berlin');
    expect(hbgResult.publishedEntities[0].city).toBe('Hamburg');

    // Same slug is allowed across cities
    expect(berResult.publishedEntities[0].slug).toBe(hbgResult.publishedEntities[0].slug);
  });
});

// ─── 3. Canonical City Detection ─────────────────────────────────────────────

describe('Phase 2A — Canonical City from Postal Code', () => {
  it('resolves each city by its canonical postal range', () => {
    const cases: Array<[string, string]> = [
      ['50667', 'Köln'],
      ['10115', 'Berlin'],
      ['20099', 'Hamburg'],
      ['80331', 'München'],
      ['60329', 'Frankfurt'],
      ['40211', 'Düsseldorf'],
      ['70190', 'Stuttgart'],
      ['44137', 'Dortmund'],
      ['45143', 'Essen'],
    ];
    for (const [postal, expectedCity] of cases) {
      const result = resolveCanonicalCity(postal, null, expectedCity);
      expect(result?.config.canonical, `Postal ${postal} should map to ${expectedCity}`).toBe(expectedCity);
    }
  });

  it('correctly identifies all 9 cities in CITY_CONFIGS', () => {
    const canonicals = CITY_CONFIGS.map((c) => c.canonical);
    expect(canonicals).toContain('Köln');
    expect(canonicals).toContain('Berlin');
    expect(canonicals).toContain('Hamburg');
    expect(canonicals).toContain('München');
    expect(canonicals).toContain('Frankfurt');
    expect(canonicals).toContain('Düsseldorf');
    expect(canonicals).toContain('Stuttgart');
    expect(canonicals).toContain('Dortmund');
    expect(canonicals).toContain('Essen');
    expect(CITY_CONFIGS.length).toBeGreaterThanOrEqual(9);
  });
});

// ─── 4. City Route Generation ─────────────────────────────────────────────────

describe('Phase 2A — City Route Generation', () => {
  it('generates correct German city URLs', () => {
    expect(getCityUrl('de', 'Köln')).toBe('/de/moscheen/koeln');
    expect(getCityUrl('de', 'Berlin')).toBe('/de/moscheen/berlin');
    expect(getCityUrl('de', 'München')).toBe('/de/moscheen/muenchen');
    expect(getCityUrl('de', 'Düsseldorf')).toBe('/de/moscheen/duesseldorf');
  });

  it('generates correct English city URLs', () => {
    expect(getCityUrl('en', 'Köln')).toBe('/en/mosques/cologne');
    expect(getCityUrl('en', 'München')).toBe('/en/mosques/munich');
    expect(getCityUrl('en', 'Berlin')).toBe('/en/mosques/berlin');
  });

  it('generates correct Arabic city URLs (Latin slug)', () => {
    expect(getCityUrl('ar', 'Köln')).toBe('/ar/mosques/koeln');
    expect(getCityUrl('ar', 'München')).toBe('/ar/mosques/muenchen');
  });

  it('generates correct mosque detail URLs for all locales', () => {
    expect(getMosqueUrl('de', 'Köln', 'fatih-moschee')).toBe('/de/moschee/koeln/fatih-moschee');
    expect(getMosqueUrl('en', 'Köln', 'fatih-moschee')).toBe('/en/mosque/cologne/fatih-moschee');
    expect(getMosqueUrl('ar', 'Köln', 'fatih-moschee')).toBe('/ar/mosque/koeln/fatih-moschee');
    expect(getMosqueUrl('de', 'Berlin', 'al-nur-moschee')).toBe('/de/moschee/berlin/al-nur-moschee');
    expect(getMosqueUrl('en', 'Berlin', 'al-nur-moschee')).toBe('/en/mosque/berlin/al-nur-moschee');
  });
});

// ─── 5. normalizeCitySlug ─────────────────────────────────────────────────────

describe('Phase 2A — normalizeCitySlug', () => {
  it('normalizes Cologne variants to koeln', () => {
    expect(normalizeCitySlug('cologne')).toBe('koeln');
    expect(normalizeCitySlug('Cologne')).toBe('koeln');
    expect(normalizeCitySlug('koeln')).toBe('koeln');
  });

  it('normalizes Munich variants to muenchen', () => {
    expect(normalizeCitySlug('munich')).toBe('muenchen');
    expect(normalizeCitySlug('muenchen')).toBe('muenchen');
  });

  it('normalizes Düsseldorf variants', () => {
    expect(normalizeCitySlug('duesseldorf')).toBe('duesseldorf');
  });

  it('normalizes Berlin correctly', () => {
    expect(normalizeCitySlug('berlin')).toBe('berlin');
    expect(normalizeCitySlug('Berlin')).toBe('berlin');
  });
});

// ─── 6. getCityRouteSlug ──────────────────────────────────────────────────────

describe('Phase 2A — getCityRouteSlug', () => {
  it('returns Latin slug for de/ar locales', () => {
    expect(getCityRouteSlug('München', 'de')).toBe('muenchen');
    expect(getCityRouteSlug('München', 'ar')).toBe('muenchen');
    expect(getCityRouteSlug('Köln', 'de')).toBe('koeln');
  });

  it('returns English slug for en locale', () => {
    expect(getCityRouteSlug('München', 'en')).toBe('munich');
    expect(getCityRouteSlug('Köln', 'en')).toBe('cologne');
    expect(getCityRouteSlug('Berlin', 'en')).toBe('berlin');
  });
});

// ─── 7. Classification: new Phase 2A category types ──────────────────────────

describe('Phase 2A — Classification', () => {
  it('rejects Funeral Home without mosque indicator', () => {
    const res = classifyRecord({
      title: 'Islamische Bestattungen Berlin',
      categoryName: 'Funeral home',
    });
    expect(res.dataStatus).toBe('REJECTED');
  });

  it('rejects Charity without mosque indicator', () => {
    const res = classifyRecord({
      title: 'Islamic Relief Hamburg',
      categoryName: 'Charity',
    });
    expect(res.dataStatus).toBe('REJECTED');
  });

  it('publishes mosque with "islamisch" in name', () => {
    const res = classifyRecord({
      title: 'Islamisches Zentrum Hamburg e.V.',
      categoryName: 'Mosque',
      reviewsCount: 15,
      phone: '+49123456789',
    });
    expect(res.dataStatus).toBe('PUBLISHED');
  });

  it('publishes AMJ Bait-style mosque names', () => {
    const res = classifyRecord({
      title: 'Baitus Sabuh AMJ Deutschland',
      categoryName: 'Mosque',
      reviewsCount: 5,
    });
    expect(res.dataStatus).toBe('PUBLISHED');
  });
});

// ─── 8. Published / Review / Rejected separation ──────────────────────────────

describe('Phase 2A — Data Status Separation', () => {
  it('pipeline produces correct status split for clean dataset', () => {
    const records = [
      // Should publish
      { placeId: 'A1', title: 'Fatih Moschee Berlin', categoryName: 'Mosque', address: 'Str 1, 10115 Berlin, Germany', postalCode: '10115', location: { lat: 52.5, lng: 13.4 }, reviewsCount: 20, phone: '+49111' },
      // Should review: thin record
      { placeId: 'A2', title: 'Moschee', categoryName: 'Mosque', address: 'Str 2, 10115 Berlin, Germany', postalCode: '10115', location: { lat: 52.5, lng: 13.4 }, reviewsCount: 0 },
      // Should reject: spam
      { placeId: 'A3', title: 'Test Fake Mosque', categoryName: 'Mosque', address: 'Str 3, 10115 Berlin, Germany', postalCode: '10115', location: { lat: 52.5, lng: 13.4 } },
    ];

    const result = runPipeline(records, 'Berlin');
    const published = result.allEntities.filter((e) => e.dataStatus === 'PUBLISHED');
    const reviewed = result.allEntities.filter((e) => e.dataStatus === 'REVIEWED');
    const rejected = result.allEntities.filter((e) => e.dataStatus === 'REJECTED');

    expect(published.length).toBeGreaterThanOrEqual(1);
    expect(reviewed.length).toBeGreaterThanOrEqual(1);
    expect(rejected.length).toBeGreaterThanOrEqual(1);
  });

  it('cross-city anomaly is held in REVIEW not PUBLISHED', () => {
    // Kornwestheim postal (70806) in Stuttgart dataset → cross-city anomaly
    const records = [
      {
        placeId: 'KW001',
        title: 'DITIB Ayasofya Moschee Kornwestheim',
        categoryName: 'Mosque',
        address: 'Sigelstraße 44, 70806 Kornwestheim-Stammheim, Germany',
        postalCode: '70806',
        location: { lat: 48.86, lng: 9.18 },
        reviewsCount: 50,
        phone: '+49111',
      },
    ];
    const result = runPipeline(records, 'Stuttgart');
    // Either cross-city (flagged REVIEWED) or unknown-city (REVIEWED)
    // It must NOT be PUBLISHED since it's not a Stuttgart postal code
    expect(result.publishedEntities.length).toBe(0);
    expect(result.allEntities[0].dataStatus).toBe('REVIEWED');
  });
});

// ─── 9. No duplicate canonical URLs in sitemap ────────────────────────────────

describe('Phase 2A — No Duplicate Canonical URLs', () => {
  it('getCityUrl produces unique URLs across all locales and cities', () => {
    const locales = ['de', 'en', 'ar'] as const;
    const urls: string[] = [];
    for (const locale of locales) {
      for (const config of CITY_CONFIGS) {
        const url = getCityUrl(locale, config.canonical);
        expect(urls).not.toContain(url); // must be unique
        urls.push(url);
      }
    }
    expect(urls.length).toBe(CITY_CONFIGS.length * 3); // 9 cities × 3 locales = 27
  });

  it('getMosqueUrl for same mosque in different cities produces different URLs', () => {
    const url1 = getMosqueUrl('de', 'Köln', 'fatih-moschee');
    const url2 = getMosqueUrl('de', 'Berlin', 'fatih-moschee');
    expect(url1).not.toBe(url2);
  });
});
