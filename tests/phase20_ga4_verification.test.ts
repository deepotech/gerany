import { describe, it, expect } from 'vitest';
import nextConfig from '../next.config.mjs';
import { JsonMosqueRepository } from '../src/lib/db/json-repository';
import sitemap from '../src/app/sitemap';
import fs from 'fs';
import path from 'path';

describe('Phase 20 — GA4 Diagnostic & Verification Suite', () => {
  const repo = new JsonMosqueRepository();

  describe('1. Content-Security-Policy & Analytics Whitelisting', () => {
    it('allows https://www.googletagmanager.com in Content-Security-Policy script-src', async () => {
      const headersConfig = await nextConfig.headers!();
      const headers = headersConfig[0].headers;
      const cspHeader = headers.find((h: any) => h.key === 'Content-Security-Policy');

      expect(cspHeader).toBeDefined();
      const cspValue = cspHeader!.value;

      // Ensure script-src contains googletagmanager.com
      const scriptSrcMatch = cspValue.match(/script-src\s+([^;]+)/);
      expect(scriptSrcMatch).not.toBeNull();
      const scriptSrc = scriptSrcMatch![1];
      expect(scriptSrc).toContain('https://www.googletagmanager.com');
    });

    it('allows connect-src and img-src for analytics beacons and telemetry', async () => {
      const headersConfig = await nextConfig.headers!();
      const headers = headersConfig[0].headers;
      const cspHeader = headers.find((h: any) => h.key === 'Content-Security-Policy');
      const cspValue = cspHeader!.value;

      const connectSrcMatch = cspValue.match(/connect-src\s+([^;]+)/);
      expect(connectSrcMatch).not.toBeNull();
      expect(connectSrcMatch![1]).toContain('https:');

      const imgSrcMatch = cspValue.match(/img-src\s+([^;]+)/);
      expect(imgSrcMatch).not.toBeNull();
      expect(imgSrcMatch![1]).toContain('https:');
    });
  });

  describe('2. GA4 Measurement ID Configuration & Integrity', () => {
    it('uses the verified GA4 Measurement ID format and fallback', () => {
      const cookieConsentPath = path.join(process.cwd(), 'src/components/CookieConsent.tsx');
      const content = fs.readFileSync(cookieConsentPath, 'utf8');

      // Must configure G-XRV9JC90FT
      expect(content).toContain('G-XRV9JC90FT');
      expect(content).toContain('process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID');

      // Measurement ID pattern test
      const gaIdPattern = /^G-[A-Z0-9]+$/;
      expect(gaIdPattern.test('G-XRV9JC90FT')).toBe(true);
    });

    it('ensures root layout does not contain duplicate GA script tags', () => {
      const rootLayoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
      const content = fs.readFileSync(rootLayoutPath, 'utf8');

      // No duplicate Script tags or gtag calls in root layout
      expect(content).not.toContain('googletagmanager.com');
      expect(content).not.toContain('G-XRV9JC90FT');
      expect(content).not.toContain('gtag(');
    });

    it('ensures analytics script is strictly gated behind consent acceptance', () => {
      const cookieConsentPath = path.join(process.cwd(), 'src/components/CookieConsent.tsx');
      const content = fs.readFileSync(cookieConsentPath, 'utf8');

      // Gated conditionally
      expect(content).toContain("consent === 'accepted'");
      expect(content).toContain('moschee_analytics_consent');
    });

    it('sets window ga-disable flag when consent is rejected or revoked', () => {
      const cookieConsentPath = path.join(process.cwd(), 'src/components/CookieConsent.tsx');
      const content = fs.readFileSync(cookieConsentPath, 'utf8');

      // In-session revocation support
      expect(content).toContain('ga-disable-');
    });
  });

  describe('3. Baseline Regression & SEO Invariance Check', () => {
    it('preserves exactly 601 published mosques', async () => {
      const published = await repo.getAllPublished();
      expect(published.length).toBe(601);
    });

    it('preserves exactly 20 cities', async () => {
      const cities = await repo.getCities();
      expect(cities.length).toBe(20);
    });

    it('preserves exactly 1,869 sitemap URLs', async () => {
      const entries = await sitemap();
      expect(entries.length).toBe(1869);
    });
  });
});
