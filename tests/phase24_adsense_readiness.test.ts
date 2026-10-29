import { describe, it, expect } from 'vitest';
import { getAboutUrl, getContactUrl, getHomeUrl, getSearchUrl, getCityUrl, getMosqueUrl } from '../src/lib/routes';
import { dictionaries, LOCALES } from '../src/lib/i18n';
import { JsonMosqueRepository } from '../src/lib/db/json-repository';
import sitemap from '../src/app/sitemap';
import robots from '../src/app/robots';
import fs from 'fs';
import path from 'path';

describe('Phase 24 — AdSense Readiness & Trust Remediation', () => {
  const repo = new JsonMosqueRepository();

  describe('1. Multilingual Route Helpers for Trust Pages', () => {
    it('generates exact localized About routes', () => {
      expect(getAboutUrl('de')).toBe('/de/about');
      expect(getAboutUrl('en')).toBe('/en/about');
      expect(getAboutUrl('ar')).toBe('/ar/about');
    });

    it('generates exact localized Contact routes', () => {
      expect(getContactUrl('de')).toBe('/de/contact');
      expect(getContactUrl('en')).toBe('/en/contact');
      expect(getContactUrl('ar')).toBe('/ar/contact');
    });
  });

  describe('2. Localization Completeness', () => {
    it('contains non-empty common trust keys across all locales', () => {
      for (const loc of LOCALES) {
        const dict = dictionaries[loc];
        expect(dict.common.about).toBeDefined();
        expect(dict.common.about.trim().length).toBeGreaterThan(0);
        expect(dict.common.contact).toBeDefined();
        expect(dict.common.contact.trim().length).toBeGreaterThan(0);
      }
    });

    it('contains localized feature card strings across all locales', () => {
      for (const loc of LOCALES) {
        const dict = dictionaries[loc];
        expect(dict.home.featureStructuredTitle.trim().length).toBeGreaterThan(0);
        expect(dict.home.featureStructuredDesc.trim().length).toBeGreaterThan(0);
        expect(dict.home.featureSearchTitle.trim().length).toBeGreaterThan(0);
        expect(dict.home.featureSearchDesc.trim().length).toBeGreaterThan(0);
        expect(dict.home.featureFacilitiesTitle.trim().length).toBeGreaterThan(0);
        expect(dict.home.featureFacilitiesDesc.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe('3. Privacy & Consent Safeguards', () => {
    it('CookieConsent does not claim "Es werden keine Daten an Werbenetzwerke weitergegeben"', () => {
      const consentPath = path.resolve(process.cwd(), 'src/components/CookieConsent.tsx');
      const content = fs.readFileSync(consentPath, 'utf8');
      expect(content).not.toContain('Es werden keine Daten an Werbenetzwerke weitergegeben');
      expect(content).not.toContain('No data is shared with advertising networks');
      expect(content).toContain('Derzeit werden keine Werbe-Cookies gesetzt');
    });

    it('Privacy policy contains transparent future advertising information without premature claims', () => {
      const datenschutzPath = path.resolve(process.cwd(), 'src/app/[locale]/datenschutz/page.tsx');
      const content = fs.readFileSync(datenschutzPath, 'utf8');
      expect(content).toContain('Information Regarding Online Advertising');
      expect(content).toContain('Hinweis zu Online-Werbung');
      expect(content).toContain('Google-certified Consent Management Platform');
      expect(content).toContain('adssettings.google.com');
    });
  });

  describe('4. Standalone Trust Pages Presence', () => {
    it('About page exists and contains 7-stage pipeline explanation', () => {
      const aboutPath = path.resolve(process.cwd(), 'src/app/[locale]/about/page.tsx');
      expect(fs.existsSync(aboutPath)).toBe(true);
      const content = fs.readFileSync(aboutPath, 'utf8');
      expect(content).toContain('7-Stage Data Verification Pipeline');
      expect(content).toContain('DEDUPLICATION');
      expect(content).toContain('generateStaticParams');
    });

    it('Contact page exists and provides real operator details', () => {
      const contactPath = path.resolve(process.cwd(), 'src/app/[locale]/contact/page.tsx');
      expect(fs.existsSync(contactPath)).toBe(true);
      const content = fs.readFileSync(contactPath, 'utf8');
      expect(content).toContain('dounia.elmarradi@gmail.com');
      expect(content).toContain('Dounia Elmarradi');
      expect(content).toContain('generateStaticParams');
    });
  });

  describe('5. City Pages Real Data Value', () => {
    it('SearchClient contains factual city overview with dynamic stats', () => {
      const searchClientPath = path.resolve(process.cwd(), 'src/components/SearchClient.tsx');
      const content = fs.readFileSync(searchClientPath, 'utf8');
      expect(content).toContain('wheelchairCount');
      expect(content).toContain('Directory Overview');
      expect(content).toContain('Verzeichnis-Überblick');
    });
  });

  describe('6. AdSense Non-Proliferation Safeguards', () => {
    it('no live adsbygoogle scripts or fake publisher IDs exist', () => {
      const nextConfigPath = path.resolve(process.cwd(), 'next.config.mjs');
      const configContent = fs.readFileSync(nextConfigPath, 'utf8');
      expect(configContent).not.toContain('pub-');

      const consentPath = path.resolve(process.cwd(), 'src/components/CookieConsent.tsx');
      const consentContent = fs.readFileSync(consentPath, 'utf8');
      expect(consentContent).not.toContain('adsbygoogle');
      expect(consentContent).not.toContain('pagead2');
    });
  });

  describe('7. Baseline Preservation Invariants', () => {
    it('strictly preserves 601 published mosques', async () => {
      const mosques = await repo.getAllPublished();
      expect(mosques.length).toBe(601);
    });

    it('strictly preserves 20 published cities', async () => {
      const cities = await repo.getCities();
      const live = cities.filter((c) => c.count >= 1);
      expect(live.length).toBe(20);
    });

    it('strictly preserves 1,869 sitemap URLs baseline', async () => {
      const entries = await sitemap();
      expect(entries.length).toBe(1869);
    });

    it('strictly preserves 454 redirect mappings', () => {
      const redirectsPath = path.resolve(process.cwd(), 'src/data/redirects.json');
      const redirects = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
      expect(redirects.length).toBe(454);
    });

    it('robots.txt allows Google crawlers without restriction', () => {
      const r = robots();
      expect(r.rules).toBeDefined();
      const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
      const disallows = rules.flatMap((rule) => (Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow]));
      expect(disallows).not.toContain('/');
    });
  });
});
