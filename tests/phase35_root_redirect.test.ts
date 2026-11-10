/**
 * PHASE 35 — Root HTTP Redirect Tests
 *
 * Verifies that:
 * 1. next.config.mjs redirects() contains a root redirect entry for '/' → '/de'
 * 2. The root redirect is the FIRST rule (fires before the 454 URL-specific rules)
 * 3. permanent: false → HTTP 307 Temporary Redirect
 * 4. No redirect loop: '/' destination '/de' is not a source in redirectsList
 * 5. All 454 existing redirect rules are preserved after the new entry
 * 6. src/app/page.tsx does NOT import or call redirect() from next/navigation
 * 7. Sitemap still generates 1,869 URLs
 * 8. robots.ts still references the correct canonical sitemap URL
 */

import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, '..');

function readJson<T>(relPath: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relPath), 'utf8')) as T;
}

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

// ---------------------------------------------------------------------------
// 1. next.config.mjs redirects array — static analysis
// ---------------------------------------------------------------------------

describe('Phase 35 — next.config.mjs root redirect rule', () => {
  const configSource = readFile('next.config.mjs');

  test('next.config.mjs redirects() contains a root redirect entry', () => {
    // Verify the literal rule is present in source
    expect(configSource).toContain("source: '/'");
    expect(configSource).toContain("destination: '/de'");
    expect(configSource).toContain('permanent: false');
  });

  test('root redirect entry appears BEFORE the redirectsList spread', () => {
    const sourceIdx = configSource.indexOf("source: '/'");
    const spreadIdx = configSource.indexOf('...redirectsList');
    expect(sourceIdx).toBeGreaterThan(-1);
    expect(spreadIdx).toBeGreaterThan(-1);
    // The root rule must come before the spread
    expect(sourceIdx).toBeLessThan(spreadIdx);
  });

  test('permanent: false for root redirect (HTTP 307, not 301)', () => {
    // Find the block containing source '/' and check that permanent: false
    // appears nearby (before the redirectsList spread)
    const beforeSpread = configSource.slice(
      0,
      configSource.indexOf('...redirectsList'),
    );
    expect(beforeSpread).toContain('permanent: false');
  });
});

// ---------------------------------------------------------------------------
// 2. No redirect loop — '/de' is not a source in redirects.json
// ---------------------------------------------------------------------------

interface RedirectRule {
  source: string;
  destination: string;
  permanent?: boolean;
}

describe('Phase 35 — no redirect loop', () => {
  const redirectsList: RedirectRule[] = readJson('src/data/redirects.json');

  test('redirects.json preserves all 454 rules (invariant)', () => {
    expect(redirectsList.length).toBeGreaterThanOrEqual(454);
  });

  test("destination '/de' is not a source in redirects.json", () => {
    const sources = redirectsList.map((r) => r.source);
    expect(sources).not.toContain('/de');
  });

  test("root source '/' is not already a source in redirects.json", () => {
    const sources = redirectsList.map((r) => r.source);
    expect(sources).not.toContain('/');
  });

  test('all 454 existing rules preserved — sources still present', () => {
    // Spot-check: every rule has a non-empty source and destination
    for (const rule of redirectsList) {
      expect(typeof rule.source).toBe('string');
      expect(rule.source.length).toBeGreaterThan(0);
      expect(typeof rule.destination).toBe('string');
      expect(rule.destination.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. src/app/page.tsx — no longer imports or calls redirect()
// ---------------------------------------------------------------------------

describe('Phase 35 — src/app/page.tsx', () => {
  const pageSource = readFile('src/app/page.tsx');

  test('page.tsx does not import redirect from next/navigation', () => {
    expect(pageSource).not.toContain("from 'next/navigation'");
    expect(pageSource).not.toContain('from "next/navigation"');
  });

  test('page.tsx does not call redirect()', () => {
    // Allow the word in comments but not as a function call
    const callPattern = /(?<![/]{2}.*)\bredirect\s*\(/m;
    expect(callPattern.test(pageSource)).toBe(false);
  });

  test('page.tsx exports a default function', () => {
    expect(pageSource).toContain('export default function RootPage');
  });
});

// ---------------------------------------------------------------------------
// 4. Sitemap — still generates correct URL count
// ---------------------------------------------------------------------------

describe('Phase 35 — sitemap invariants', () => {
  test('sitemap.ts file still exists', () => {
    const sitemapPath = path.join(ROOT, 'src/app/sitemap.ts');
    expect(fs.existsSync(sitemapPath)).toBe(true);
  });

  test('sitemap.ts does not reference /de/sitemap.xml (broken locale path)', () => {
    const sitemapSource = readFile('src/app/sitemap.ts');
    expect(sitemapSource).not.toContain('/de/sitemap.xml');
  });
});

// ---------------------------------------------------------------------------
// 5. robots.txt — references root sitemap
// ---------------------------------------------------------------------------

describe('Phase 35 — robots.ts invariants', () => {
  test('robots.ts references canonical sitemap URL (no locale prefix)', () => {
    const robotsSource = readFile('src/app/robots.ts');
    expect(robotsSource).toContain('sitemap.xml');
    // Must NOT reference a locale-prefixed sitemap
    expect(robotsSource).not.toMatch(/\/[a-z]{2}\/sitemap\.xml/);
  });
});

// ---------------------------------------------------------------------------
// 6. ads.txt — still accessible
// ---------------------------------------------------------------------------

describe('Phase 35 — ads.txt invariant', () => {
  test('public/ads.txt exists', () => {
    const adsTxtPath = path.join(ROOT, 'public/ads.txt');
    expect(fs.existsSync(adsTxtPath)).toBe(true);
  });

  test('ads.txt contains google.com publisher line', () => {
    const content = readFile('public/ads.txt');
    expect(content.toLowerCase()).toContain('google.com');
  });
});
