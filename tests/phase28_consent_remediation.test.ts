import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { ENABLE_ADSENSE, ADSENSE_PUBLISHER_ID } from '../src/lib/config';
import { JsonMosqueRepository } from '../src/lib/db/json-repository';
import sitemap from '../src/app/sitemap';

describe('Phase 28 — AdSense Consent & Privacy Remediation', () => {
  const repo = new JsonMosqueRepository();

  describe('1. Safe Interim Feature Gate', () => {
    it('ENABLE_ADSENSE is strictly disabled (false) by default', () => {
      expect(ENABLE_ADSENSE).toBe(false);
    });

    it('ADSENSE_PUBLISHER_ID holds the genuine verified publisher ID', () => {
      expect(ADSENSE_PUBLISHER_ID).toBe('ca-pub-6331163447795368');
    });

    it('layout.tsx gates the AdSense script tag on ENABLE_ADSENSE', () => {
      const layoutPath = path.join(process.cwd(), 'src', 'app', '[locale]', 'layout.tsx');
      const content = fs.readFileSync(layoutPath, 'utf8');
      expect(content).toContain('{ENABLE_ADSENSE && (');
      expect(content).toContain('ADSENSE_PUBLISHER_ID');
    });
  });

  describe('2. Content Security Policy (CSP) Hardening', () => {
    const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
    const content = fs.readFileSync(nextConfigPath, 'utf8');

    it('does NOT contain the broad https://*.google.com wildcard in CSP', () => {
      expect(content).not.toContain('https://*.google.com');
    });

    it('explicitly allows justified Google & CMP subdomains in script-src', () => {
      expect(content).toContain('https://adservice.google.com');
      expect(content).toContain('https://fundingchoicesmessages.google.com');
      expect(content).toContain('https://www.googletagmanager.com');
      expect(content).toContain('https://pagead2.googlesyndication.com');
    });

    it('explicitly allows justified iframe origins in frame-src', () => {
      expect(content).toContain('https://googleads.g.doubleclick.net');
      expect(content).toContain('https://fundingchoicesmessages.google.com');
      expect(content).toContain('https://*.doubleclick.net');
      expect(content).toContain('https://tpc.googlesyndication.com');
    });
  });

  describe('3. GA4 Opt-In and Privacy Truthfulness', () => {
    const cookieConsentPath = path.join(process.cwd(), 'src', 'components', 'CookieConsent.tsx');
    const content = fs.readFileSync(cookieConsentPath, 'utf8');

    it('gates GA4 execution strictly on affirmative consent (consent === "accepted")', () => {
      expect(content).toContain("consent === 'accepted'");
      expect(content).toContain('googletagmanager.com/gtag/js');
    });

    it('disables GA4 tracking on user rejection', () => {
      expect(content).toContain('ga-disable-');
    });

    it('contains truthful privacy text reflecting that no ad cookies are active', () => {
      expect(content).toContain('Derzeit werden keine Werbe-Cookies gesetzt.');
      expect(content).toContain('No advertising cookies are currently set.');
      expect(content).toContain('لا يتم حالياً تفعيل أي ملفات تعريف ارتباط إعلانية.');
    });
  });

  describe('4. ads.txt and Project Invariants', () => {
    it('public/ads.txt remains intact with verified credentials', () => {
      const adsTxtPath = path.join(process.cwd(), 'public', 'ads.txt');
      expect(fs.existsSync(adsTxtPath)).toBe(true);
      const text = fs.readFileSync(adsTxtPath, 'utf8').trim();
      expect(text).toBe('google.com, pub-6331163447795368, DIRECT, f08c47fec0942fa0');
    });

    it('strictly preserves 601 published mosques', async () => {
      const mosques = await repo.getAllPublished();
      expect(mosques.length).toBe(601);
    });

    it('strictly preserves 20 published cities', async () => {
      const cities = await repo.getCities();
      expect(cities.length).toBe(20);
    });

    it('strictly preserves 454 GSC repair 301 redirects', () => {
      const redirectsPath = path.join(process.cwd(), 'src', 'data', 'redirects.json');
      const redirects = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
      expect(redirects.length).toBe(454);
    });

    it('strictly preserves 1,869 database sitemap URLs', async () => {
      const entries = await sitemap();
      expect(entries.length).toBe(1869);
    });
  });
});
