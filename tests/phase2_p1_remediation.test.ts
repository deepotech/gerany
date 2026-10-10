import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isAuthenticatedAdmin } from '../src/lib/auth';
import { getImpressumUrl, getDatenschutzUrl } from '../src/lib/routes';
import { getDictionary, LOCALES } from '../src/lib/i18n';
import generateImpressumStaticParams from '../src/app/[locale]/impressum/page';
import generateDatenschutzStaticParams from '../src/app/[locale]/datenschutz/page';

import { vi } from 'vitest';

let mockHeadersMap = new Map<string, string>();
vi.mock('next/headers', () => ({
  headers: () => ({
    get: (key: string) => mockHeadersMap.get(key.toLowerCase()) || null,
  }),
}));

describe('Phase 2 P0/P1 Remediation Suite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.ADMIN_SECRET;
    delete process.env.ADMIN_TOKEN;
    mockHeadersMap.clear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('P0: Admin Access Fail-Closed Security', () => {
    it('fails closed when no admin secrets are configured', () => {
      mockHeadersMap.set('authorization', 'Bearer secret-123');
      expect(isAuthenticatedAdmin()).toBe(false);

      mockHeadersMap.set('x-admin-key', 'secret-123');
      expect(isAuthenticatedAdmin()).toBe(false);
    });

    it('authenticates successfully with valid Bearer token in Authorization header', () => {
      process.env.ADMIN_SECRET = 'super-secret-admin-key-2026';
      mockHeadersMap.set('authorization', 'Bearer super-secret-admin-key-2026');
      expect(isAuthenticatedAdmin()).toBe(true);
    });

    it('authenticates successfully with valid X-Admin-Key header', () => {
      process.env.ADMIN_SECRET = 'super-secret-admin-key-2026';
      mockHeadersMap.set('x-admin-key', 'super-secret-admin-key-2026');
      expect(isAuthenticatedAdmin()).toBe(true);
    });

    it('authenticates successfully with valid ADMIN_TOKEN fallback in headers', () => {
      process.env.ADMIN_TOKEN = 'token-secret-fallback';
      mockHeadersMap.set('x-admin-key', 'token-secret-fallback');
      expect(isAuthenticatedAdmin()).toBe(true);
    });

    it('rejects invalid header token when secret is configured', () => {
      process.env.ADMIN_SECRET = 'correct-secret';
      mockHeadersMap.set('authorization', 'Bearer wrong-secret');
      expect(isAuthenticatedAdmin()).toBe(false);

      mockHeadersMap.set('x-admin-key', 'another-wrong-secret');
      expect(isAuthenticatedAdmin()).toBe(false);
    });

    it('rejects requests with missing headers', () => {
      process.env.ADMIN_SECRET = 'correct-secret';
      expect(isAuthenticatedAdmin()).toBe(false);
    });
  });

  describe('P1.5: German Legal Pages Routing and Internationalization', () => {
    it('provides localized route helpers for Impressum and Datenschutz', () => {
      expect(getImpressumUrl('de')).toBe('/de/impressum');
      expect(getImpressumUrl('en')).toBe('/en/impressum');
      expect(getImpressumUrl('ar')).toBe('/ar/impressum');

      expect(getDatenschutzUrl('de')).toBe('/de/datenschutz');
      expect(getDatenschutzUrl('en')).toBe('/en/datenschutz');
      expect(getDatenschutzUrl('ar')).toBe('/ar/datenschutz');
    });

    it('contains localized common dictionary keys for all locales', () => {
      for (const locale of LOCALES) {
        const dict = getDictionary(locale);
        expect(dict.common.impressum).toBeDefined();
        expect(dict.common.impressum.length).toBeGreaterThan(0);
        expect(dict.common.datenschutz).toBeDefined();
        expect(dict.common.datenschutz.length).toBeGreaterThan(0);
      }
    });

    it('has correct translations in de, en, ar', () => {
      const deDict = getDictionary('de');
      expect(deDict.common.impressum).toBe('Impressum');
      expect(deDict.common.datenschutz).toBe('Datenschutz');

      const enDict = getDictionary('en');
      expect(enDict.common.impressum).toBe('Legal Notice / Imprint');
      expect(enDict.common.datenschutz).toBe('Privacy Policy');
      expect(enDict.common.cookieSettings).toBe('Cookie Settings');

      const arDict = getDictionary('ar');
      expect(arDict.common.impressum).toBe('إشعار قانوني');
      expect(arDict.common.datenschutz).toBe('سياسة الخصوصية');
      expect(arDict.common.cookieSettings).toBe('إعدادات ملفات تعريف الارتباط');
    });

    it('requires cookieSettings dictionary key across all supported locales', () => {
      for (const locale of LOCALES) {
        const dict = getDictionary(locale);
        expect(dict.common.cookieSettings).toBeDefined();
        expect(dict.common.cookieSettings.length).toBeGreaterThan(0);
      }
    });
  });
});
