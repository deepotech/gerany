import { describe, it, expect } from 'vitest';
import { ensureUniqueSlugs, generateCanonicalSlug } from '../src/pipeline/slugs';
import { JsonMosqueRepository } from '../src/lib/db/json-repository';
import { getMosqueUrl } from '../src/lib/routes';

describe('Phase 1.6 — City-Scoped Slug Uniqueness & Regression Tests', () => {
  const repo = new JsonMosqueRepository();

  it('allows identical slugs across different cities (same slug + different city = valid)', () => {
    const multiCityItems = [
      { title: 'Fatih Moschee', city: 'Köln' },
      { title: 'Fatih Moschee', city: 'Berlin' },
      { title: 'Fatih Moschee', city: 'Hamburg' },
      { title: 'Fatih Moschee', city: 'München' },
    ];

    const slugs = ensureUniqueSlugs(multiCityItems);

    expect(slugs).toEqual([
      'fatih-moschee',
      'fatih-moschee',
      'fatih-moschee',
      'fatih-moschee',
    ]);
  });

  it('detects and deterministically resolves collisions within the same city (same slug + same city = collision)', () => {
    const sameCityItems = [
      { title: 'Fatih Moschee', city: 'Köln', district: 'Nippes' },
      { title: 'Fatih Moschee', city: 'Köln', district: 'Kalk' },
      { title: 'Fatih Moschee', city: 'Köln', district: 'Mülheim' },
    ];

    const slugs = ensureUniqueSlugs(sameCityItems);

    expect(slugs[0]).toBe('fatih-moschee');
    expect(slugs[1]).toBe('fatih-moschee-kalk');
    expect(slugs[2]).toBe('fatih-moschee-muelheim');
  });

  it('correctly resolves mosque entity using both city and slug', async () => {
    // Test known published mosque in Köln
    const slug = 'igmg-fatih-moschee-nippes';

    const byKoeln = await repo.getByCityAndSlug('koeln', slug);
    expect(byKoeln).not.toBeNull();
    expect(byKoeln?.slug).toBe(slug);
    expect(byKoeln?.city).toBe('Köln');

    // Also supports English city alias "cologne"
    const byCologne = await repo.getByCityAndSlug('cologne', slug);
    expect(byCologne).not.toBeNull();
    expect(byCologne?.id).toBe(byKoeln?.id);

    // Also supports German umlaut "Köln"
    const byUmlaut = await repo.getByCityAndSlug('Köln', slug);
    expect(byUmlaut).not.toBeNull();
    expect(byUmlaut?.id).toBe(byKoeln?.id);
  });

  it('returns null (yielding 404) when querying with an invalid or mismatched city', async () => {
    const validSlug = 'igmg-fatih-moschee-nippes';

    // Same valid slug queried against the wrong city MUST return null
    const wrongCityBerlin = await repo.getByCityAndSlug('berlin', validSlug);
    expect(wrongCityBerlin).toBeNull();

    const wrongCityHamburg = await repo.getByCityAndSlug('hamburg', validSlug);
    expect(wrongCityHamburg).toBeNull();

    const wrongCityMunich = await repo.getByCityAndSlug('muenchen', validSlug);
    expect(wrongCityMunich).toBeNull();

    const invalidSlug = await repo.getByCityAndSlug('koeln', 'non-existent-mosque-slug');
    expect(invalidSlug).toBeNull();
  });

  it('ensures multilingual routes map to the same entity with consistent canonical URL structure', async () => {
    const published = await repo.getAllPublished();
    const sample = published.find((m) => m.city === 'Köln')!;

    const deUrl = getMosqueUrl('de', 'koeln', sample.slug);
    const enUrl = getMosqueUrl('en', 'cologne', sample.slug);
    const arUrl = getMosqueUrl('ar', 'koeln', sample.slug);

    expect(deUrl).toBe(`/de/moschee/koeln/${sample.slug}`);
    expect(enUrl).toBe(`/en/mosque/cologne/${sample.slug}`);
    expect(arUrl).toBe(`/ar/mosque/koeln/${sample.slug}`);

    // Verify entity resolution from each route's city parameter
    const fromDe = await repo.getByCityAndSlug('koeln', sample.slug);
    const fromEn = await repo.getByCityAndSlug('cologne', sample.slug);
    const fromAr = await repo.getByCityAndSlug('koeln', sample.slug);

    expect(fromDe?.id).toBe(sample.id);
    expect(fromEn?.id).toBe(sample.id);
    expect(fromAr?.id).toBe(sample.id);
  });
});
