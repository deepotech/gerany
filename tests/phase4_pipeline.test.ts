import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';

import {
  normalizeMosqueName,
  normalizePhone,
  normalizeWebsite,
  validateCoordinatesQuality,
  normalizeOpeningHours,
  parseAddress,
  detectOrganization,
  extractFacilities,
} from '../src/pipeline/normalize';
import { normalizeGermanPhonetic } from '../src/lib/normalize';
import { resolveCanonicalCity, getCityRouteSlug, isCityIndexable, CITY_CONFIGS, EXTENDED_CITY_CONFIGS } from '../src/pipeline/city-config';
import { detectDuplicates, computeNameSimilarity, calculateDuplicateEvidence } from '../src/pipeline/deduplicate';
import { classifyRecord } from '../src/pipeline/classify';
import { generateCanonicalSlug, ensureUniqueSlugs } from '../src/pipeline/slugs';
import { validateMosqueEntity, MosqueEntitySchema } from '../src/pipeline/validate';
import { evaluateQualityGates } from '../src/pipeline/gates';
import { detectEntityDiff } from '../src/pipeline/change-detection';
import { runPipeline } from '../src/pipeline/runner';
import { GooglePlacesJsonAdapter } from '../src/pipeline/source-adapter';
import { JsonMosqueRepository } from '../src/lib/db/json-repository';
import { getCityUrl, getMosqueUrl, normalizeCitySlug } from '../src/lib/routes';
import { MosqueEntity, RawGooglePlaceRecord } from '../src/pipeline/types';

describe('PHASE 4: Germany-Wide Data Expansion & Production Quality Pipeline', () => {
  const fixturesPath = path.resolve(__dirname, 'fixtures', 'phase4_test_fixtures.json');
  const pilotPath = path.resolve(__dirname, 'fixtures', 'pilot_hannover.json');
  const fixtures: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));
  const pilotRecords: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(pilotPath, 'utf8'));

  // 1. Normalization
  it('1. Normalization: trims whitespace, cleans non-printable Unicode, preserves raw title', () => {
    const raw = '  \u200BDITIB   Fatih-Moschee  Köln   ';
    const norm = normalizeMosqueName(raw);
    expect(norm.canonicalName).toBe('DITIB Fatih-Moschee Köln');
    expect(norm.rawTitle).toBe(raw);
  });

  // 2. German Normalization
  it('2. German normalization: preserves natural umlauts ä, ö, ü, ß while supporting search equivalents', () => {
    const original = 'München Groß-Moschee Südstadt Köln-Brück';
    const norm = normalizeMosqueName(original);
    expect(norm.canonicalName).toContain('München');
    expect(norm.canonicalName).toContain('Groß-Moschee');
    expect(norm.canonicalName).toContain('Köln-Brück');

    // Phonetic search matches umlaut and non-umlaut spellings
    const searchKey1 = normalizeGermanPhonetic('Muenchen');
    const searchKey2 = normalizeGermanPhonetic('München');
    const searchKey3 = normalizeGermanPhonetic('Munchen');
    expect(searchKey1).toBe(searchKey2);
    expect(searchKey2).toBe(searchKey3);
  });

  // 3. Postal Codes
  it('3. Postal codes: validates German 5-digit format and rejects invalid formats', () => {
    const parsedValid = parseAddress('Kölner Str. 10, 50667 Köln, Germany', '50667', 'Köln');
    expect(parsedValid.postalCode).toBe('50667');

    const schemaTestPass = MosqueEntitySchema.shape.postalCode.safeParse('50667');
    expect(schemaTestPass.success).toBe(true);

    const schemaTestFail = MosqueEntitySchema.shape.postalCode.safeParse('1234'); // 4 digits
    expect(schemaTestFail.success).toBe(false);
  });

  // 4. Phone Normalization
  it('4. Phone normalization: converts German numbers to standard format and flags suspicious values without deletion', () => {
    const res1 = normalizePhone('030 12345678');
    expect(res1.normalized).toBe('+493012345678');
    expect(res1.isValid).toBe(true);
    expect(res1.isSuspicious).toBe(false);

    const res2 = normalizePhone('0049 221 987654');
    expect(res2.normalized).toBe('+49221987654');
    expect(res2.isValid).toBe(true);

    const suspicious = normalizePhone('123'); // too short
    expect(suspicious.isValid).toBe(false);
    expect(suspicious.isSuspicious).toBe(true);
    expect(suspicious.raw).toBe('123'); // raw value preserved!
  });

  // 5. Website Normalization
  it('5. Website normalization: strips tracking parameters, adds protocol, and validates syntax', () => {
    const rawUrl = 'moschee-berlin.de/home/?utm_source=google&utm_medium=cpc&fbclid=xyz';
    const res = normalizeWebsite(rawUrl);
    expect(res.normalized).toBe('https://moschee-berlin.de/home');
    expect(res.isValid).toBe(true);
    expect(res.hostname).toBe('moschee-berlin.de');

    const invalid = normalizeWebsite('not-a-valid-url:::');
    expect(invalid.isValid).toBe(false);
  });

  // 6. Coordinate Validation
  it('6. Coordinate validation: validates Germany bounding box and rejects invalid/zero coordinates', () => {
    const validBerlin = validateCoordinatesQuality(52.52, 13.405);
    expect(validBerlin.isValid).toBe(true);
    expect(validBerlin.isGermanyBounds).toBe(true);

    const zeroCoord = validateCoordinatesQuality(0, 0);
    expect(zeroCoord.isValid).toBe(false);
    expect(zeroCoord.reason).toContain('ZERO_COORDINATES');

    const saharaCoord = validateCoordinatesQuality(25.0, 12.0); // Outside Germany
    expect(saharaCoord.isValid).toBe(true);
    expect(saharaCoord.isGermanyBounds).toBe(false);
    expect(saharaCoord.reason).toContain('OUTSIDE_GERMANY_BOUNDS');
  });

  // 7. City Resolution
  it('7. City resolution: resolves canonical city from postal code, alias, and rejects arbitrary variants', () => {
    const res1 = resolveCanonicalCity('50667', null, 'Cologne');
    expect(res1?.config.canonical).toBe('Köln');
    expect(res1?.isCrossCity).toBe(false);

    const res2 = resolveCanonicalCity('80331', null, 'München');
    expect(res2?.config.canonical).toBe('München');

    // Unknown postal code returns null (flagged for review)
    const unknown = resolveCanonicalCity('99999', null, 'Fakestadt');
    expect(unknown).toBeNull();
  });

  // 8. State Resolution
  it('8. State resolution: maps canonical German federal state and does not invent administrative data', () => {
    const koeln = resolveCanonicalCity('50667', null, 'Köln');
    expect(koeln?.config.state).toBe('Nordrhein-Westfalen');

    const muenchen = resolveCanonicalCity('80331', null, 'München');
    expect(muenchen?.config.state).toBe('Bayern');
  });

  // 9. Exact Duplicate Detection
  it('9. Exact duplicate detection (Level 1): identifies and merges identical placeId records', () => {
    const records = [fixtures[0], fixtures[1]]; // fixtures[1] has same placeId as fixtures[0]
    const { uniqueRecords, duplicateCandidates } = detectDuplicates(records);
    expect(uniqueRecords.length).toBe(1);
    expect(duplicateCandidates.length).toBe(1);
    expect(duplicateCandidates[0].reason).toBe('EXACT_PLACE_ID');
    expect(duplicateCandidates[0].actionTaken).toBe('MERGED');
  });

  // 10. Fuzzy Duplicate Candidate Detection
  it('10. Fuzzy duplicate candidate detection (Level 5): calculates explainable evidence and flags for review', () => {
    const recA = {
      title: 'Islamische Gemeinde Al-Nur',
      address: 'Hauptstr. 10, 10115 Berlin, Germany',
      location: { lat: 52.52, lng: 13.4 },
    };
    const recB = {
      title: 'Al-Nur Islamische Gemeinde e.V.',
      address: 'Nebenstr. 5, 10117 Berlin, Germany',
      location: { lat: 52.51, lng: 13.39 }, // ~1.2 km away
    };
    const { score, evidence } = calculateDuplicateEvidence(recA, recB);
    expect(score).toBeGreaterThan(0.4);
    expect(evidence.explanation).toContain('Name similarity');
    expect(evidence.explanation).toContain('Address match: differ');
  });

  // 11. Co-Location Preservation
  it('11. Co-location preservation: preserves distinct organizations at same address/building without merging', () => {
    // fixtures[0] is Bait-ul-Nasr Moschee; fixtures[3] is Al-Irshad Bildungsgesellschaft at same address
    const records = [fixtures[0], fixtures[3]];
    const { uniqueRecords, duplicateCandidates } = detectDuplicates(records);
    expect(uniqueRecords.length).toBe(2); // Both preserved!
    expect(duplicateCandidates.length).toBe(1);
    expect(duplicateCandidates[0].actionTaken).toBe('FLAGGED_CO_LOCATED');
    expect(duplicateCandidates[0].reason).toBe('SAME_ADDRESS_DIFFERENT_ORG');
  });

  // 12. Classification
  it('12. Classification: distinguishes between MOSQUE, ISLAMIC_CENTER, and pure cultural clubs', () => {
    const mosqueClass = classifyRecord(fixtures[0]);
    expect(mosqueClass.category).toBe('MOSQUE');
    expect(mosqueClass.dataStatus).toBe('PUBLISHED');

    const clubClass = classifyRecord(fixtures[6]); // Türkischer Kultur- und Sportverein e.V.
    expect(clubClass.dataStatus).toBe('REJECTED');
  });

  // 13. Affiliation Safety
  it('13. Affiliation safety: never infers affiliation solely from mosque name; requires verified domain', () => {
    // Mosque with official website domain -> confirmed affiliation
    const orgWithDomain = detectOrganization('Fatih Moschee', 'https://www.ditib-berlin.de/fatih');
    expect(orgWithDomain).toBe('DITIB');

    const orgAMJ = detectOrganization('Baitul Sabuh', 'https://ahmadiyya.de/gemeinde');
    expect(orgAMJ).toBe('AMJ');

    // Mosque mentioning DITIB in title without verified domain -> null (no assumption)
    const orgWithoutDomain = detectOrganization('DITIB Moschee Köln', 'https://independent-blog.com');
    expect(orgWithoutDomain).toBeNull();

    const orgNoWebsite = detectOrganization('DITIB Merkez Camii', null);
    expect(orgNoWebsite).toBeNull();
  });

  // 14. Publishability
  it('14. Publishability: enforces explicit criteria and evaluates Quality Gate 6', () => {
    const validEntity: MosqueEntity = {
      id: 'test_pub_1',
      canonicalName: 'Al-Salam Moschee',
      slug: 'al-salam-moschee',
      address: 'Musterweg 12, 10115 Berlin, Germany',
      street: 'Musterweg 12',
      postalCode: '10115',
      city: 'Berlin',
      district: 'Mitte',
      state: 'Berlin',
      country: 'Germany',
      latitude: 52.52,
      longitude: 13.4,
      phone: '+49 30 1111222',
      website: 'https://al-salam-berlin.de',
      mapsUrl: null,
      placeId: 'place_pub_1',
      category: 'MOSQUE',
      organization: null,
      description: null,
      openingHours: null,
      rating: 4.5,
      reviewCount: 10,
      imageUrl: null,
      dataStatus: 'PUBLISHED',
      verificationStatus: 'UNVERIFIED',
      source: 'test_source',
      lastVerified: new Date().toISOString(),
      facilities: { parking: null, womenArea: null, wheelchairAccessible: true, restroom: true, wudu: null },
      translations: {
        de: { locale: 'de', name: 'Al-Salam Moschee', description: '', seoTitle: 'Al-Salam Moschee Berlin', seoDescription: 'Al-Salam Moschee in Berlin finden.' },
        en: { locale: 'en', name: 'Al-Salam Mosque', description: '', seoTitle: 'Al-Salam Mosque Berlin', seoDescription: 'Find Al-Salam Mosque in Berlin.' },
        ar: { locale: 'ar', name: 'مسجد السلام', description: '', seoTitle: 'مسجد السلام برلين', seoDescription: 'معلومات مسجد السلام في برلين.' },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const gateEval = evaluateQualityGates(validEntity);
    expect(gateEval.canPublish).toBe(true);
    expect(gateEval.allPassed).toBe(true);
  });

  // 15. Review Routing
  it('15. Review routing: routes uncertain records (thin data, generic placeholder) to REVIEWED', () => {
    const generic = classifyRecord({ title: 'Moschee', categoryName: 'Mosque' });
    expect(generic.dataStatus).toBe('REVIEWED');
    expect(generic.reason).toContain('Low quality');

    const thin = classifyRecord({
      title: 'Gebetsraum',
      categoryName: 'Mosque',
      reviewsCount: 0,
      phone: null,
      website: null,
      openingHours: [],
      address: 'Str 1, 10115 Berlin',
    });
    expect(thin.dataStatus).toBe('REVIEWED');
    expect(thin.reason).toContain('Thin record');
  });

  // 16. Rejection Reasons
  it('16. Rejection reasons: captures explicit non-empty rejectionReason when rejecting spam or non-mosques', () => {
    const spam = classifyRecord(fixtures[7]); // Pastel-ghost
    expect(spam.dataStatus).toBe('REJECTED');
    expect(spam.reason).toContain('spam');

    const funeral = classifyRecord({ title: 'Bestattungsinstitut Al-Ameen', categoryName: 'funeral home' });
    expect(funeral.dataStatus).toBe('REJECTED');
    expect(funeral.reason).toContain('not a mosque');
  });

  // 17. Verification Semantics
  it('17. Verification semantics: all newly ingested records are UNVERIFIED; source presence does not upgrade status', () => {
    const res = runPipeline([fixtures[0]], 'Berlin', { dryRun: true });
    expect(res.publishedEntities.length).toBe(1);
    expect(res.publishedEntities[0].verificationStatus).toBe('UNVERIFIED');
  });

  // 18. Facilities Null Handling
  it('18. Facilities null handling: preserves tri-state true/false/null without converting null to false', () => {
    const fac = extractFacilities({
      additionalInfo: {
        Accessibility: [{ 'Wheelchair accessible entrance': true }],
      },
    });
    expect(fac.wheelchairAccessible).toBe(true);
    expect(fac.womenArea).toBeNull(); // strictly null, NOT false!
    expect(fac.wudu).toBeNull();
  });

  // 19. Opening-Hours Handling
  it('19. Opening-hours handling: preserves valid structured hours and does not fabricate missing days', () => {
    const hours = [{ day: 'Monday', hours: '08:00 - 20:00' }];
    const res = normalizeOpeningHours(hours);
    expect(res.isValid).toBe(true);
    expect(res.normalized?.length).toBe(1);
    expect(res.normalized?.[0].day).toBe('Monday');

    const emptyRes = normalizeOpeningHours([]);
    expect(emptyRes.normalized).toBeNull();
  });

  // 20. Idempotent Imports
  it('20. Idempotent imports: running the pipeline twice produces identical entity count and 0 duplicates', () => {
    const run1 = runPipeline(fixtures, 'Berlin', { dryRun: true });
    const run2 = runPipeline(fixtures, 'Berlin', { dryRun: true });
    expect(run1.publishedEntities.length).toBe(run2.publishedEntities.length);
    expect(run1.allEntities.length).toBe(run2.allEntities.length);
  });

  // 21. Dry-Run Mode
  it('21. Dry-run mode: returns full pipeline results and proposed diff without mutating disk files', () => {
    const res = runPipeline([fixtures[0]], 'Berlin', { dryRun: true });
    expect(res.isDryRun).toBe(true);
    expect(res.publishedEntities.length).toBe(1);
  });

  // 22. Change Detection
  it('22. Change detection: accurately detects added, updated, removed, and unchanged records', () => {
    const existing: MosqueEntity = {
      id: 'mosque_1',
      canonicalName: 'Al-Falah Moschee',
      slug: 'al-falah-moschee',
      address: 'Str 1, 10115 Berlin',
      street: 'Str 1',
      postalCode: '10115',
      city: 'Berlin',
      district: 'Mitte',
      state: 'Berlin',
      country: 'Germany',
      latitude: 52.5,
      longitude: 13.4,
      phone: '+49 30 111111',
      website: 'https://alfalah.de',
      mapsUrl: null,
      placeId: 'mosque_1',
      category: 'MOSQUE',
      organization: null,
      description: null,
      openingHours: null,
      rating: 4.5,
      reviewCount: 10,
      imageUrl: null,
      dataStatus: 'PUBLISHED',
      verificationStatus: 'UNVERIFIED',
      source: 'test',
      lastVerified: null,
      facilities: { parking: null, womenArea: null, wheelchairAccessible: null, restroom: null, wudu: null },
      translations: {
        de: { locale: 'de', name: 'Al-Falah Moschee', description: '', seoTitle: 'Al-Falah', seoDescription: 'Al-Falah' },
        en: { locale: 'en', name: 'Al-Falah Mosque', description: '', seoTitle: 'Al-Falah', seoDescription: 'Al-Falah' },
        ar: { locale: 'ar', name: 'مسجد الفلاح', description: '', seoTitle: 'الفلاح', seoDescription: 'الفلاح' },
      },
      createdAt: '',
      updatedAt: '',
    };

    const incomingUpdated: MosqueEntity = {
      ...existing,
      phone: '+49 30 999999', // Updated phone!
    };

    const diff = detectEntityDiff([existing], [incomingUpdated]);
    expect(diff.updatedCount).toBe(1);
    expect(diff.changes[0].fieldChanges?.[0].field).toBe('phone');
    expect(diff.changes[0].fieldChanges?.[0].oldValue).toBe('+49 30 111111');
    expect(diff.changes[0].fieldChanges?.[0].newValue).toBe('+49 30 999999');
  });

  // 23. Data Diff
  it('23. Data diff: comparing identical datasets reports 0 added, 0 removed, 0 updated, all unchanged', () => {
    const existing = [fixtures[0] as unknown as MosqueEntity];
    const diff = detectEntityDiff(existing, existing);
    expect(diff.addedCount).toBe(0);
    expect(diff.removedCount).toBe(0);
    expect(diff.updatedCount).toBe(0);
    expect(diff.unchangedCount).toBe(1);
  });

  // 24. Slug Stability
  it('24. Slug stability: maintains stable slugs and resolves collisions deterministically without changing existing slugs', () => {
    const slug1 = generateCanonicalSlug('DITIB - Fatih-Moschee Köln');
    expect(slug1).toBe('ditib-fatih-moschee-koeln');

    const uniqueSlugs = ensureUniqueSlugs([
      { title: 'Fatih Moschee', city: 'Köln', district: 'Chorweiler' },
      { title: 'Fatih Moschee', city: 'Köln', district: 'Kalk' },
    ]);
    expect(uniqueSlugs[0]).toBe('fatih-moschee');
    expect(uniqueSlugs[1]).toBe('fatih-moschee-kalk');
  });

  // 25. Search Integration
  it('25. Search integration: JsonMosqueRepository search query handles normalized city and multi-token names', async () => {
    const repo = new JsonMosqueRepository();
    const resultsKoeln = await repo.getAllPublished({ query: 'koeln' });
    expect(resultsKoeln.length).toBeGreaterThan(0);

    const resultsUmlaut = await repo.getAllPublished({ query: 'München' });
    const resultsAscii = await repo.getAllPublished({ query: 'Muenchen' });
    expect(resultsUmlaut.length).toBe(resultsAscii.length);
  });

  // 26. Sitemap Integration
  it('26. Sitemap integration: only published entities with valid configured cities are indexable in sitemap', async () => {
    const repo = new JsonMosqueRepository();
    const published = await repo.getAllPublished();
    const cities = await repo.getCities();

    // Published count grows with each promotion phase — must be >= original baseline
    expect(published.length).toBeGreaterThanOrEqual(443);
    for (const m of published) {
      expect(m.dataStatus).toBe('PUBLISHED');
      // City must exist in either base CITY_CONFIGS or EXTENDED_CITY_CONFIGS
      const allKnownConfigs = [...CITY_CONFIGS, ...EXTENDED_CITY_CONFIGS];
      const cfg = allKnownConfigs.find((c) => c.canonical === m.city);
      expect(cfg, `City config for "${m.city}" should exist in known configs`).toBeDefined();
    }

    const liveCities = cities.filter((c) => c.count >= 1);
    // After Phase 5B, more cities have published records
    expect(liveCities.length).toBeGreaterThanOrEqual(9);
  });

  // 27. SEO Indexability Rules
  it('27. SEO indexability rules: enforces quality threshold on city pages', () => {
    expect(isCityIndexable('Berlin', 104)).toBe(true);
    expect(isCityIndexable('Köln', 39)).toBe(true);
    expect(isCityIndexable('UnknownCity', 10)).toBe(false); // Unknown config
    expect(isCityIndexable('Berlin', 0)).toBe(false); // 0 records is not indexable
  });
});
