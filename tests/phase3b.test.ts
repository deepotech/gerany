import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getCityConfigBySlug } from '@/lib/routes';
import { CITY_CONFIGS } from '@/pipeline/city-config';
import { JsonMosqueRepository } from '@/lib/db/json-repository';

describe('Phase 3B — Production UX, Accessibility & Routing Regression Tests', () => {
  const repo = new JsonMosqueRepository();

  it('1. Language switcher route resolution works dynamically for all configured cities', () => {
    // Verify that every configured city can be resolved to its locale-specific slug
    for (const city of CITY_CONFIGS) {
      const config = getCityConfigBySlug(city.slug);
      expect(config).toBeDefined();
      expect(config?.canonical).toBe(city.canonical);

      // In German, slug should be the German slug
      const deSlug = config?.slug;
      expect(deSlug).toBe(city.slug);

      // In English, slug should be the englishSlug
      const enSlug = config?.englishSlug;
      expect(enSlug).toBe(city.englishSlug);
    }
  });

  it('2. Language switcher handles Munich, Cologne, and Berlin without hardcoding Cologne', () => {
    // Munich: muenchen (DE) -> munich (EN)
    const munichConfig = getCityConfigBySlug('muenchen');
    expect(munichConfig?.englishSlug).toBe('munich');

    // Berlin: berlin (DE) -> berlin (EN)
    const berlinConfig = getCityConfigBySlug('berlin');
    expect(berlinConfig?.englishSlug).toBe('berlin');

    // Cologne: koeln (DE) -> cologne (EN)
    const cologneConfig = getCityConfigBySlug('koeln');
    expect(cologneConfig?.englishSlug).toBe('cologne');
  });

  it('3. MosqueDetailView does not use ShieldCheck icon for Facilities heading', () => {
    const detailPath = path.resolve(process.cwd(), 'src/components/MosqueDetailView.tsx');
    const detailCode = fs.readFileSync(detailPath, 'utf8');

    // ShieldCheck must not be adjacent to facilities heading
    expect(detailCode).not.toMatch(/<ShieldCheck[^>]*\/>\s*<span>\{dict\.common\.facilities\}/);
    // Layers or other neutral icon should be used
    expect(detailCode).toContain('dict.common.facilities');
  });

  it('4. MosqueDetailView breadcrumbs localize Germany across locales', () => {
    const detailPath = path.resolve(process.cwd(), 'src/components/MosqueDetailView.tsx');
    const detailCode = fs.readFileSync(detailPath, 'utf8');

    // Must not hardcode name: 'Deutschland' without locale branching
    expect(detailCode).not.toContain("{ name: 'Deutschland', url: getHomeUrl(locale) }");
    expect(detailCode).toContain('countryName');
  });

  it('5. MosqueDetailView has aria-label on breadcrumbs navigation', () => {
    const detailPath = path.resolve(process.cwd(), 'src/components/MosqueDetailView.tsx');
    const detailCode = fs.readFileSync(detailPath, 'utf8');

    expect(detailCode).toContain('aria-label={breadcrumbAriaLabel}');
  });

  it('6. Header component supports dynamic cityCount and localized subtitle', () => {
    const headerPath = path.resolve(process.cwd(), 'src/components/Header.tsx');
    const headerCode = fs.readFileSync(headerPath, 'utf8');

    expect(headerCode).toContain('cityCount');
    expect(headerCode).toContain('aria-label={navAriaLabel}');
    expect(headerCode).not.toContain('9 Städte &bull; Deutschland');
  });

  it('7. SearchClient includes accessible restroom filter pill', () => {
    const searchClientPath = path.resolve(process.cwd(), 'src/components/SearchClient.tsx');
    const searchCode = fs.readFileSync(searchClientPath, 'utf8');

    expect(searchCode).toContain('filterRestroom');
    expect(searchCode).toContain('dict.common.restroom');
  });

  it('8. SearchClient mobile tabs are localized', () => {
    const searchClientPath = path.resolve(process.cwd(), 'src/components/SearchClient.tsx');
    const searchCode = fs.readFileSync(searchClientPath, 'utf8');

    expect(searchCode).toContain("locale === 'en' ? 'Map' : locale === 'ar' ? 'الخريطة' : 'Karte'");
    expect(searchCode).toContain("locale === 'en' ? 'List' : locale === 'ar' ? 'قائمة' : 'Liste'");
  });

  it('9. MapContainer loading element has role=status and accessible aria-label', () => {
    const mapContainerPath = path.resolve(process.cwd(), 'src/components/map/MapContainer.tsx');
    const mapCode = fs.readFileSync(mapContainerPath, 'utf8');

    expect(mapCode).toContain('role="status"');
    expect(mapCode).toContain('aria-label=');
  });

  it('10. MosqueCard article has accessible name via aria-labelledby', () => {
    const cardPath = path.resolve(process.cwd(), 'src/components/MosqueCard.tsx');
    const cardCode = fs.readFileSync(cardPath, 'utf8');

    expect(cardCode).toContain('aria-labelledby=');
    expect(cardCode).toContain('rtl:rotate-180');
  });

  it('11. Root not-found.tsx exists and provides user recovery navigation', () => {
    const notFoundPath = path.resolve(process.cwd(), 'src/app/not-found.tsx');
    expect(fs.existsSync(notFoundPath)).toBe(true);

    const notFoundCode = fs.readFileSync(notFoundPath, 'utf8');
    expect(notFoundCode).toContain('href="/de"');
    expect(notFoundCode).toContain('href="/de/moscheen"');
  });
});
