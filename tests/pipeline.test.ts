import { describe, it, expect } from 'vitest';
import { parseAddress, extractFacilities, calculateRating } from '../src/pipeline/normalize';
import { classifyRecord } from '../src/pipeline/classify';
import { detectDuplicates, haversineDistanceMeters } from '../src/pipeline/deduplicate';
import { generateCanonicalSlug, ensureUniqueSlugs, transliterateArabic } from '../src/pipeline/slugs';
import { generateTranslations } from '../src/pipeline/translations';
import { validateMosqueEntity } from '../src/pipeline/validate';
import { JsonMosqueRepository } from '../src/lib/db/json-repository';

describe('1. Data Normalization', () => {
  it('correctly parses German addresses with district in Köln', () => {
    const addr1 = parseAddress('Eichhornstraße 4, 50735 Nippes, Germany', '50735', 'Köln');
    expect(addr1.city).toBe('Köln');
    expect(addr1.district).toBe('Nippes');
    expect(addr1.postalCode).toBe('50735');
    expect(addr1.street).toBe('Eichhornstraße 4');

    const addr2 = parseAddress('Vorsterstraße 41, 51103 Köln-Kalk, Germany', '51103', 'Köln');
    expect(addr2.city).toBe('Köln');
    expect(addr2.district).toBe('Kalk');
    expect(addr2.postalCode).toBe('51103');

    const addr3 = parseAddress('Kartäuserwall 59, 50677 Köln, Germany', '50677', 'Köln');
    expect(addr3.district).toBe('Innenstadt');
  });

  it('extracts facilities from additionalInfo correctly', () => {
    const raw = {
      additionalInfo: {
        Amenities: [{ Restroom: true }],
        Accessibility: [{ 'Wheelchair accessible entrance': true }],
        Parking: [{ 'Free parking lot': true }],
      },
    };
    const facilities = extractFacilities(raw);
    expect(facilities.restroom).toBe(true);
    expect(facilities.wheelchairAccessible).toBe(true);
    expect(facilities.parking).toBe(true);
    expect(facilities.womenArea).toBe(null);
  });

  it('calculates weighted rating correctly from review distribution', () => {
    const raw = {
      reviewsCount: 6,
      reviewsDistribution: { oneStar: 0, twoStar: 0, threeStar: 0, fourStar: 1, fiveStar: 5 },
    };
    const res = calculateRating(raw);
    expect(res.rating).toBe(4.8);
    expect(res.reviewCount).toBe(6);
  });
});

describe('2. Classification Logic', () => {
  it('correctly classifies genuine Mosques as PUBLISHED', () => {
    const res = classifyRecord({
      title: 'Köln Moschee - Majlis Ansarullah',
      categoryName: 'Mosque',
    });
    expect(res.category).toBe('MOSQUE');
    expect(res.dataStatus).toBe('PUBLISHED');
  });

  it('rejects spam or prank entries', () => {
    const res = classifyRecord({
      title: 'Pastel-ghost-Moschee',
      categoryName: 'Mosque',
    });
    expect(res.dataStatus).toBe('REJECTED');
  });

  it('rejects non-religious social clubs', () => {
    const res = classifyRecord({
      title: 'Deutsch - Türkischer Kulturverein e.V.',
      categoryName: 'Club',
    });
    expect(res.dataStatus).toBe('REJECTED');
  });

  it('flags administrative headquarters for REVIEW', () => {
    const res = classifyRecord({
      title: 'VIKZ Neue Verbandszentrale',
      categoryName: 'Mosque',
    });
    expect(res.category).toBe('RELIGIOUS_ORGANIZATION');
    expect(res.dataStatus).toBe('REVIEWED');
  });
});

describe('3. Deduplication & Co-location', () => {
  it('calculates haversine distance correctly', () => {
    // 50.9375, 6.9603 (Köln center) to 50.9375, 6.9613 (~70m apart)
    const dist = haversineDistanceMeters(50.9375, 6.9603, 50.9375, 6.9613);
    expect(dist).toBeGreaterThan(60);
    expect(dist).toBeLessThan(80);
  });

  it('flags co-located organizations at same address without merging blindly', () => {
    const records = [
      {
        placeId: 'p1',
        title: 'Masjid Hamza Moschee',
        address: 'Bergisch Gladbacher Str. 4, 51065 Mülheim, Germany',
        location: { lat: 50.9630447, lng: 7.0073234 },
      },
      {
        placeId: 'p2',
        title: 'Kulturzentrum Köln e.V.',
        address: 'Bergisch Gladbacher Str. 4, 51065 Mülheim, Germany',
        location: { lat: 50.9630447, lng: 7.0073234 },
      },
    ];

    const { uniqueRecords, duplicateCandidates } = detectDuplicates(records);
    expect(uniqueRecords.length).toBe(2); // Preserved both!
    expect(duplicateCandidates.length).toBe(1);
    expect(duplicateCandidates[0].actionTaken).toBe('FLAGGED_CO_LOCATED');
  });
});

describe('4. Slug Generation & Arabic Strategy', () => {
  it('generates clean URL slugs with umlaut transliteration', () => {
    const slug = generateCanonicalSlug('DITIB - Eyüp-Sultan-Moschee Köln');
    expect(slug).toBe('ditib-eyuep-sultan-moschee-koeln');
  });

  it('handles bilingual Arabic/German titles cleanly', () => {
    const slug = generateCanonicalSlug('مسجد التوحيد كولن Al Tauhid Moschee köln');
    expect(slug).toBe('al-tauhid-moschee-koeln');
  });

  it('disambiguates identical titles with districts', () => {
    const slugs = ensureUniqueSlugs([
      { title: 'DITIB Moschee', district: 'Kalk' },
      { title: 'DITIB Moschee', district: 'Nippes' },
    ]);
    expect(slugs[0]).toBe('ditib-moschee');
    expect(slugs[1]).toBe('ditib-moschee-nippes');
  });
});

describe('5. Mosque Repository & Search', () => {
  const repo = new JsonMosqueRepository();

  it('returns all published mosques from all cities', async () => {
    const published = await repo.getAllPublished();
    // Phase 2A: all 9 cities ingested — expect ≥38 (was Köln pilot)
    expect(published.length).toBeGreaterThanOrEqual(38);
  });

  it('filters by district', async () => {
    const kalkMosques = await repo.getAllPublished({ district: 'Kalk' });
    expect(kalkMosques.length).toBeGreaterThan(0);
    kalkMosques.forEach((m) => expect(m.district).toBe('Kalk'));
  });

  it('filters by search query', async () => {
    const results = await repo.getAllPublished({ query: 'Fatih' });
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((m) => m.canonicalName.includes('Fatih'))).toBe(true);
  });

  it('retrieves mosque by slug', async () => {
    const all = await repo.getAllPublished();
    const first = all[0];
    const found = await repo.getBySlug(first.slug);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(first.id);
  });

  it('calculates nearby mosques sorted by distance', async () => {
    const nearby = await repo.getNearby(50.9407, 7.0000, 3);
    expect(nearby.length).toBe(3);
    expect(nearby[0].distanceKm).toBeLessThanOrEqual(nearby[1].distanceKm ?? 999);
  });
});
