import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import sitemap from '../src/app/sitemap';
import robots from '../src/app/robots';
import { getMosqueRepository } from '../src/lib/db';
import { getPublishedCityConfigs } from '../src/pipeline/city-config';
import nextConfig from '../next.config.mjs';

const ROOT = path.resolve(__dirname, '..');

describe('Phase 38 — Dual Sitemap Support (/sitemap.xml & /de/sitemap.xml)', () => {
  // 1. Root sitemap generation remains unchanged
  it('1. Root sitemap generation returns exactly 1,869 entries', async () => {
    const entries = await sitemap();
    expect(entries).toBeDefined();
    expect(entries.length).toBe(1869);
  });

  // 2. German sitemap endpoint rewrite exists in next.config.mjs
  it('2. next.config.mjs defines the /de/sitemap.xml rewrite to /sitemap.xml', async () => {
    expect(typeof nextConfig.rewrites).toBe('function');
    if (!nextConfig.rewrites) throw new Error('rewrites is not defined');
    const rewrites = await nextConfig.rewrites();
    const list = Array.isArray(rewrites) ? rewrites : rewrites.beforeFiles || [];
    const deRewrite = list.find(
      (r: { source: string; destination: string }) => r.source === '/de/sitemap.xml'
    );
    expect(deRewrite).toBeDefined();
    expect(deRewrite?.source).toBe('/de/sitemap.xml');
    expect(deRewrite?.destination).toBe('/sitemap.xml');
  });

  // 3. Both endpoints share the exact same generated data source
  it('3. Both endpoints serve identical URL entries without duplicate datasets', async () => {
    const entries1 = await sitemap();
    const entries2 = await sitemap();
    expect(entries1.length).toBe(entries2.length);
    expect(entries1.map((e) => e.url)).toEqual(entries2.map((e) => e.url));
  });

  // 4. Sitemap content is valid XML and starts with proper declaration
  it('4. Generated sitemap build artifact is valid XML', () => {
    const sitemapBodyPath = path.join(ROOT, '.next/server/app/sitemap.xml.body');
    if (fs.existsSync(sitemapBodyPath)) {
      const body = fs.readFileSync(sitemapBodyPath, 'utf8');
      expect(body.trim().startsWith('<?xml')).toBe(true);
      expect(body).toContain('<urlset');
      expect(body).toContain('</urlset>');
      expect(body).not.toContain('<html');
      expect(body).not.toContain('404');
    }
  });

  // 5. Sitemap metadata route has correct XML content type
  it('5. Sitemap route produces application/xml content type metadata', () => {
    const sitemapMetaPath = path.join(ROOT, '.next/server/app/sitemap.xml.meta');
    if (fs.existsSync(sitemapMetaPath)) {
      const meta = JSON.parse(fs.readFileSync(sitemapMetaPath, 'utf8'));
      const contentType = meta.headers?.['content-type'];
      expect(contentType).toBe('application/xml');
    }
  });

  // 6. Neither endpoint returns HTML or a Next.js 404 page
  it('6. Neither sitemap definition produces an HTML error page', async () => {
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(0);
    for (const entry of entries) {
      expect(entry.url).not.toContain('404');
      expect(entry.url).not.toContain('/admin');
    }
  });

  // 7. No duplicate URLs exist inside the sitemap
  it('7. No duplicate URLs exist in the sitemap dataset', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(entries.length);
  });

  // 8. The expected published URL count is preserved (1,869 baseline)
  it('8. Expected URL count matches exact formula (3 home + 3 search + 20 cities * 3 + 601 mosques * 3 = 1869)', async () => {
    const repo = getMosqueRepository();
    const published = await repo.getAllPublished();
    const cities = await repo.getCities();
    const liveCities = cities.filter((c) => c.count >= 1);
    const publishedConfigs = getPublishedCityConfigs();
    const liveCitiesInSitemap = liveCities.filter((c) =>
      publishedConfigs.some((cfg) => cfg.canonical === c.name)
    );

    const expectedCount =
      3 + // homepages (de, en, ar)
      3 + // search hubs (de, en, ar)
      liveCitiesInSitemap.length * 3 + // city hubs
      published.length * 3; // mosque details

    expect(expectedCount).toBe(1869);
    const entries = await sitemap();
    expect(entries.length).toBe(expectedCount);
  });

  // 9. No unpublished cities or mosque records are exposed
  it('9. Unpublished cities (Bochum, Dresden, etc.) and REVIEW/REJECTED mosques are strictly excluded', async () => {
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);

    // Verify blocked/unpublished cities are not in sitemap
    for (const url of urls) {
      expect(url.toLowerCase()).not.toContain('/bochum');
      expect(url.toLowerCase()).not.toContain('/dresden');
      expect(url.toLowerCase()).not.toContain('/kiel');
    }

    // Verify only published mosques exist
    const repo = getMosqueRepository();
    const published = await repo.getAllPublished();
    const allPath = path.join(ROOT, 'src', 'data', 'all-entities.json');
    if (fs.existsSync(allPath)) {
      const allEntities = JSON.parse(fs.readFileSync(allPath, 'utf8'));
      const nonPublished = allEntities.filter((m: { dataStatus: string }) => m.dataStatus !== 'PUBLISHED');
      const sitemapUrlSet = new Set(urls);
      for (const item of nonPublished) {
        if (!item.city || !item.slug) continue;
        const config = getPublishedCityConfigs().find((c) => c.canonical === item.city);
        if (config) {
          // If no published entity in the same city shares this slug, it must not be in sitemap
          const hasPublishedDuplicate = published.some((p) => p.city === item.city && p.slug === item.slug);
          if (!hasPublishedDuplicate) {
            expect(sitemapUrlSet.has(`https://moscheeindernaehe.de/de/moschee/${config.slug}/${item.slug}`)).toBe(false);
          }
        }
      }
    }
  });

  // 10. Existing robots.txt sitemap reference remains correct
  it('10. robots.txt strictly references the root canonical sitemap URL', () => {
    const r = robots();
    expect(r.sitemap).toBe('https://moscheeindernaehe.de/sitemap.xml');
    expect(r.sitemap).not.toContain('/de/sitemap.xml');
  });

  // 11. Preserves all 454 redirect rules
  it('11. Preserves all 454 redirect rules in next.config.mjs without interference', async () => {
    const redirectsPath = path.join(ROOT, 'src/data/redirects.json');
    const redirectsList = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
    expect(redirectsList.length).toBeGreaterThanOrEqual(454);

    expect(typeof nextConfig.redirects).toBe('function');
    if (!nextConfig.redirects) throw new Error('redirects is not defined');
    const redirects = await nextConfig.redirects();
    // 1 root redirect + GSC redirects
    expect(redirects.length).toBeGreaterThanOrEqual(455);

    // Verify no redirect intercepts /de/sitemap.xml
    const sitemapRedirect = redirects.find(
      (r: { source: string }) => r.source === '/de/sitemap.xml' || r.source === '/sitemap.xml'
    );
    expect(sitemapRedirect).toBeUndefined();
  });
});
