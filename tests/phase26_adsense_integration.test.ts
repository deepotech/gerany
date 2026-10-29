import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { JsonMosqueRepository } from '../src/lib/db/json-repository';

describe('Phase 26 — AdSense Technical Integration & Pre-Deployment Verification', () => {
  const repo = new JsonMosqueRepository();

  describe('1. ads.txt Integration', () => {
    it('public/ads.txt exists at repository root', () => {
      const adsTxtPath = path.join(process.cwd(), 'public', 'ads.txt');
      expect(fs.existsSync(adsTxtPath)).toBe(true);
    });

    it('public/ads.txt contains verified publisher directive and certification', () => {
      const adsTxtPath = path.join(process.cwd(), 'public', 'ads.txt');
      const content = fs.readFileSync(adsTxtPath, 'utf8').trim();
      expect(content).toBe('google.com, pub-6331163447795368, DIRECT, f08c47fec0942fa0');
    });
  });

  describe('2. Content Security Policy (CSP) AdSense Permissions', () => {
    const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
    const content = fs.readFileSync(nextConfigPath, 'utf8');

    it('allows pagead2.googlesyndication.com in script-src', () => {
      expect(content).toContain('https://pagead2.googlesyndication.com');
      expect(content).toContain('https://*.googlesyndication.com');
    });

    it('allows AdSense and DoubleClick iframe sources in frame-src', () => {
      expect(content).toContain('https://googleads.g.doubleclick.net');
      expect(content).toContain('https://tpc.googlesyndication.com');
      expect(content).toContain('https://*.doubleclick.net');
    });
  });

  describe('3. AdSense Verification Script in Locale Layout', () => {
    const layoutPath = path.join(process.cwd(), 'src', 'app', '[locale]', 'layout.tsx');
    const content = fs.readFileSync(layoutPath, 'utf8');

    it('includes AdSense snippet referencing ADSENSE_PUBLISHER_ID', () => {
      expect(content).toContain('ADSENSE_PUBLISHER_ID');
      expect(content).toContain('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js');
    });

    it('contains async and crossOrigin attributes', () => {
      expect(content).toContain('async');
      expect(content).toContain('crossOrigin="anonymous"');
    });
  });

  describe('4. Invariant Preservation', () => {
    it('strictly preserves 601 published mosques', async () => {
      const mosques = await repo.getAllPublished();
      expect(mosques.length).toBe(601);
    });

    it('strictly preserves 20 published cities', async () => {
      const cities = await repo.getCities();
      expect(cities.length).toBe(20);
    });

    it('strictly preserves 454 GSC repair redirects', () => {
      const redirectsPath = path.join(process.cwd(), 'src', 'data', 'redirects.json');
      const redirects = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
      expect(redirects.length).toBe(454);
    });
  });
});
