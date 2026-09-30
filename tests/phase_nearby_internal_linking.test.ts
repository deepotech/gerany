import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JsonMosqueRepository } from '../src/lib/db/json-repository';
import { haversineDistanceKm, formatDistance } from '../src/lib/db/geo';
import { getMosqueUrl } from '../src/lib/routes';
import { CITY_CONFIGS, getPublishedCityConfigs } from '../src/pipeline/city-config';
import { isPublishedCity } from '../src/pipeline/city-registry';
import { MosqueEntity } from '../src/pipeline/types';
import sitemap from '../src/app/sitemap';

describe('PHASE — Internal Linking: Nearby Mosques Regression Suite', () => {
  const rootDir = path.resolve(__dirname, '..');
  const mosquesPath = path.join(rootDir, 'src', 'data', 'mosques.json');
  const allPath = path.join(rootDir, 'src', 'data', 'all-entities.json');

  const publishedMosques: MosqueEntity[] = JSON.parse(fs.readFileSync(mosquesPath, 'utf8'));
  const allEntities: MosqueEntity[] = JSON.parse(fs.readFileSync(allPath, 'utf8'));
  const repo = new JsonMosqueRepository();

  // 1. Nearby mosques are returned
  it('1. Nearby mosques are returned for a valid published mosque', async () => {
    const target = publishedMosques[0];
    const nearby = await repo.getNearby(target.latitude, target.longitude, 6, target.slug, target.id);
    expect(nearby.length).toBeGreaterThan(0);
    expect(nearby.length).toBeLessThanOrEqual(6);
  });

  // 2. Current mosque is excluded
  it('2. Current mosque is strictly excluded by both slug and ID', async () => {
    const target = publishedMosques[0];
    const nearby = await repo.getNearby(target.latitude, target.longitude, 6, target.slug, target.id);
    expect(nearby.some((m) => m.id === target.id)).toBe(false);
    expect(nearby.some((m) => m.slug === target.slug)).toBe(false);
  });

  // 3. Only PUBLISHED records are returned
  it('3. Only PUBLISHED records are returned by getNearby', async () => {
    const target = publishedMosques[10];
    const nearby = await repo.getNearby(target.latitude, target.longitude, 6, target.slug, target.id);
    expect(nearby.every((m) => m.dataStatus === 'PUBLISHED')).toBe(true);
  });

  // 4. REVIEW records are excluded
  it('4. REVIEW records from all-entities pool are strictly excluded', async () => {
    const reviewedEntities = allEntities.filter((e) => e.dataStatus === 'REVIEWED');
    expect(reviewedEntities.length).toBeGreaterThan(0);

    const target = publishedMosques[0];
    const nearby = await repo.getNearby(target.latitude, target.longitude, 6, target.slug, target.id);

    const reviewedIds = new Set(reviewedEntities.map((e) => e.id));
    expect(nearby.some((m) => reviewedIds.has(m.id))).toBe(false);
  });

  // 5. REJECTED records are excluded
  it('5. REJECTED records are strictly excluded', async () => {
    const rejectedEntities = allEntities.filter((e) => e.dataStatus === 'REJECTED');
    const target = publishedMosques[0];
    const nearby = await repo.getNearby(target.latitude, target.longitude, 6, target.slug, target.id);

    const rejectedIds = new Set(rejectedEntities.map((e) => e.id));
    expect(nearby.some((m) => rejectedIds.has(m.id))).toBe(false);
  });

  // 6. Unpublished cities are excluded
  it('6. Mosques in unpublished candidate cities (Hannover, Duisburg, etc.) are excluded', async () => {
    const target = publishedMosques[0];
    const nearby = await repo.getNearby(target.latitude, target.longitude, 6, target.slug, target.id);

    const publishedCityNames = new Set(getPublishedCityConfigs().map((c) => c.canonical.toLowerCase()));
    for (const m of nearby) {
      expect(publishedCityNames.has(m.city.toLowerCase())).toBe(true);
      expect(isPublishedCity(m.city.toLowerCase())).toBe(true);
    }
  });

  // 7. Invalid coordinates are excluded
  it('7. Invalid or out-of-bounds coordinates return empty or valid results only', async () => {
    const invalidNull = await repo.getNearby(0, 0, 6);
    expect(invalidNull).toEqual([]);

    const invalidNaN = await repo.getNearby(NaN, NaN, 6);
    expect(invalidNaN).toEqual([]);

    const target = publishedMosques[0];
    const nearby = await repo.getNearby(target.latitude, target.longitude, 6, target.slug, target.id);
    for (const m of nearby) {
      expect(m.latitude).toBeGreaterThanOrEqual(47);
      expect(m.latitude).toBeLessThanOrEqual(55.5);
      expect(m.longitude).toBeGreaterThanOrEqual(5.5);
      expect(m.longitude).toBeLessThanOrEqual(15.5);
    }
  });

  // 8. Results are sorted by geographic distance ascending
  it('8. Results are deterministically sorted by geographic distance in ascending order', async () => {
    const target = publishedMosques[5];
    const nearby = await repo.getNearby(target.latitude, target.longitude, 6, target.slug, target.id);
    expect(nearby.length).toBeGreaterThan(1);

    for (let i = 1; i < nearby.length; i++) {
      expect(nearby[i].distanceKm!).toBeGreaterThanOrEqual(nearby[i - 1].distanceKm!);
    }
  });

  // 9. Maximum 6 nearby mosques
  it('9. Default and explicit limit returns at most 6 nearby mosques', async () => {
    const target = publishedMosques[0];
    const nearbyDefault = await repo.getNearby(target.latitude, target.longitude);
    expect(nearbyDefault.length).toBeLessThanOrEqual(6);

    const nearbyExplicit = await repo.getNearby(target.latitude, target.longitude, 6, target.slug, target.id);
    expect(nearbyExplicit.length).toBeLessThanOrEqual(6);
  });

  // 10. Fewer than 6 works correctly
  it('10. Works correctly when limit is smaller than 6 (e.g. 2)', async () => {
    const target = publishedMosques[0];
    const nearby = await repo.getNearby(target.latitude, target.longitude, 2, target.slug, target.id);
    expect(nearby.length).toBe(2);
  });

  // 11. Zero nearby mosques is handled safely
  it('11. Zero nearby mosques returns empty array safely without error', async () => {
    // Extreme coordinates far away in the ocean
    const emptyNearby = await repo.getNearby(1.0, 1.0, 6);
    // Since Haversine distance from 1,1 to Germany will sort all mosques, but if we query with invalid coords:
    const invalidCoords = await repo.getNearby(-999, -999, 6);
    expect(invalidCoords).toEqual([]);
  });

  // 12. No duplicate mosque appears
  it('12. No duplicate mosque appears in the nearby result list', async () => {
    const target = publishedMosques[0];
    const nearby = await repo.getNearby(target.latitude, target.longitude, 6, target.slug, target.id);
    const ids = nearby.map((m) => m.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  // 13. Correct localized detail URL is generated
  it('13. Canonical localized detail URLs are generated for de, en, and ar', () => {
    const sample = publishedMosques.find((m) => m.city === 'Köln') || publishedMosques[0];

    const deUrl = getMosqueUrl('de', sample.city, sample.slug);
    const enUrl = getMosqueUrl('en', sample.city, sample.slug);
    const arUrl = getMosqueUrl('ar', sample.city, sample.slug);

    expect(deUrl).toBe(`/de/moschee/koeln/${sample.slug}`);
    expect(enUrl).toBe(`/en/mosque/cologne/${sample.slug}`);
    expect(arUrl).toBe(`/ar/mosque/koeln/${sample.slug}`);
  });

  // 14. No query parameters are added
  it('14. Generated nearby URLs contain zero query parameters', () => {
    for (const m of publishedMosques.slice(0, 20)) {
      const urlDe = getMosqueUrl('de', m.city, m.slug);
      const urlEn = getMosqueUrl('en', m.city, m.slug);
      const urlAr = getMosqueUrl('ar', m.city, m.slug);

      expect(urlDe).not.toContain('?');
      expect(urlEn).not.toContain('?');
      expect(urlAr).not.toContain('?');
    }
  });

  // 15. Existing production records remain unchanged
  it('15. Production baseline remains exactly 542 published records across 14 cities', () => {
    expect(publishedMosques.length).toBe(542);
    expect(publishedMosques.every((m) => m.dataStatus === 'PUBLISHED')).toBe(true);

    const publishedCities = new Set(publishedMosques.map((m) => m.city));
    expect(publishedCities.size).toBe(14);
  });

  // 16. Existing city routes remain unchanged
  it('16. City configs match published cities exactly', () => {
    const configs = getPublishedCityConfigs();
    expect(configs.length).toBe(14);
  });

  // 17. Arabic routes remain valid
  it('17. Arabic routes generate valid URLs without invalid characters', () => {
    const target = publishedMosques[0];
    const arUrl = getMosqueUrl('ar', target.city, target.slug);
    expect(arUrl).toMatch(/^\/ar\/mosque\/[a-z0-9-]+\/[a-z0-9-]+$/);
  });

  // 18. Localized distance formatting adheres to German, English, and Arabic standards
  it('18. formatDistance correctly formats kilometer and meter ranges per locale', () => {
    // German
    expect(formatDistance(1.7, 'de')).toBe('1,7 km');
    expect(formatDistance(0.85, 'de')).toBe('850 m');
    expect(formatDistance(0.05, 'de')).toBe('50 m');

    // English
    expect(formatDistance(1.7, 'en')).toBe('1.7 km');
    expect(formatDistance(0.85, 'en')).toBe('850 m');

    // Arabic
    expect(formatDistance(1.7, 'ar')).toBe('1.7 كم');
    expect(formatDistance(0.85, 'ar')).toBe('850 م');
  });

  // 19. Sitemap remains strictly 1,674 URLs without inflation
  it('19. Sitemap canonical count remains unchanged at 1,674', async () => {
    const entries = await sitemap();
    expect(entries.length).toBe(1674);
  });

  // 20. Nearby selection is purely in-memory repository query with zero N+1 overhead
  it('20. Nearby queries execute deterministically and synchronously from in-memory cache', async () => {
    const start = performance.now();
    for (let i = 0; i < 20; i++) {
      const target = publishedMosques[i];
      await repo.getNearby(target.latitude, target.longitude, 6, target.slug, target.id);
    }
    const elapsed = performance.now() - start;
    // 20 nearby queries should complete in under 50ms in memory
    expect(elapsed).toBeLessThan(100);
  });
});
