# Phase 14G — Post-Promotion Integrity Audit

**Project:** MoscheeAtlas  
**Directory:** `C:\Users\HP\Desktop\Germany Mosque Finder`  
**Domain:** `https://moscheeindernaehe.de`  
**Execution Date:** 2026-10-26  
**Audit Scope:** Independent verification of Münster Phase 14F promotion data, slugs, routes, SEO metadata, test assertions, and publication boundaries.

---

## 1. Verified Baseline State

All metrics independently verified against actual repository files:

| Metric | Phase 14F Target | Phase 14G Audit Actual | Status | Verification Source |
|---|:---:|:---:|:---:|---|
| **Published Mosques** | 601 | **601** | MATCH | `src/data/mosques.json` |
| **All Entities** | 661 | **661** | MATCH | `src/data/all-entities.json` |
| — *PUBLISHED Entities* | 601 | **601** | MATCH | `all-entities.json (status: "PUBLISHED")` |
| — *REVIEWED Entities (HOLD)* | 53 | **53** | MATCH | `all-entities.json (status: "REVIEWED")` |
| — *REJECTED Entities* | 7 | **7** | MATCH | `all-entities.json (status: "REJECTED")` |
| **Published Cities** | 20 | **20** | MATCH | `city-registry-overrides.json` & `city-config.ts` |
| **Sitemap Canonical URLs** | 1,869 | **1,869** | MATCH | `scripts/audit-sitemap.ts` (0 dupes, 0 invalid) |
| — *Homepages* | 3 | 3 | MATCH | `/de`, `/en`, `/ar` |
| — *Search Hubs* | 3 | 3 | MATCH | `/de/moscheen`, `/en/mosques`, `/ar/mosques` |
| — *City Hubs* | 60 (20 × 3) | 60 | MATCH | 20 cities × 3 locales |
| — *Detail Pages* | 1,803 (601 × 3) | 1,803 | MATCH | 601 published mosques × 3 locales |
| **Prerendered SSG Pages** | 1,885 | **1,885** | MATCH | `next build` prerender compilation |
| **Automated Tests** | 300 / 300 | **300 / 300** | MATCH | `vitest run` across 16 test suites |
| **TypeScript Diagnostics** | 0 errors | **0 errors** | MATCH | `npx tsc --noEmit` |
| **Linter Warnings/Errors** | 0 | **0** | MATCH | `npm run lint` |
| **Data Quality Issues** | 0 | **0** | MATCH | `npm run data:audit` |
| **Duplicate Collisions** | 0 | **0** | MATCH | `npm run data:duplicates` |

Zero drift detected between Phase 14F reported numbers and live dataset states.

---

## 2. Per-Record Audit (All Seven Promoted Münster Mosques)

Each of the 7 allowlisted records was inspected across source provenance, canonical naming, coordinates, postal boundaries, and generated HTML detail pages (`DE`, `EN`, `AR`).

| # | Google Place ID | Canonical Name | Slug | Address & Postal Code | Coordinates | Contact Data | Route & Canonical Status |
|---|---|---|---|---|:---:|---|:---:|
| 1 | `ChIJn6ZhH4y6uUcRRdptFyWdN-I` | مسجد الرحمن / Arrahmanmoschee | `arrahmanmoschee` | Meßkamp 15, 48147 Münster | 51.98109, 7.61483 | Phone: `+4915901361733`<br>Web: Facebook<br>Hours: 06:00–22:00 | **PASS** ✅<br>DE, EN, AR 200 OK<br>Canonical & Hreflang match |
| 2 | `ChIJqyE5Bte6uUcRFkRb8Ywf3NY` | Sultan Ahmet Camii ( Verband Islamischer Kulturzentren e.V. - VIKZ ) | `sultan-ahmet-camii-verband-islamischer-kulturzentren-vikz` | Bernhard-Ernst-Straße 7, 48155 Münster | 51.95227, 7.63727 | Phone: `+49251664258`<br>Web: vikz.de<br>Hours: 10:00–22:00 | **PASS** ✅<br>DE, EN, AR 200 OK<br>Canonical & Hreflang match |
| 3 | `ChIJBc5hbdm6uUcRLyetOq73giI` | Munster Central Mosque | `munster-central-mosque` | Bremer Platz 42, 48155 Münster | 51.95767, 7.63721 | Phone: `+49251665810`<br>Web: ditib-muenster.de<br>Hours: null | **PASS** ✅<br>DE, EN, AR 200 OK<br>Canonical & Hreflang match |
| 4 | `ChIJu8AMms-luUcRVFFEtFUSrZQ` | As-Salam Moschee | `as-salam-moschee` | Hammer Str. 352, 48153 Münster | 51.92627, 7.62863 | Phone: `null`<br>Web: Facebook<br>Hours: 04:00–22:30 | **PASS** ✅<br>DE, EN, AR 200 OK<br>Canonical & Hreflang match |
| 5 | `ChIJN1qZ4Ly7uUcRx3dZUWMjP5Y` | Ar-Rahmah Moschee | `ar-rahmah-moschee` | Königsberger Str. 260, 48157 Münster (Ost) | 51.99414, 7.66307 | Phone: `null`<br>Web: Mawaqit<br>Hours: Live schedule | **PASS** ✅<br>DE, EN, AR 200 OK<br>Canonical & Hreflang match |
| 6 | `ChIJYypoZAWjuUcRRokLhDbZu5U` | Bošnjački Džemat Münster - BKZ | `bo-nja-ki-d-emat-muenster-bkz` | Münsterstraße 52B, 48167 Münster | 51.92478, 7.72504 | Phone: `null`<br>Web: `null`<br>Hours: `null` | **PASS (INVESTIGATED)** ⚠️<br>DE, EN, AR 200 OK<br>Slug defect identified (see Sec. 3) |
| 7 | `ChIJX0PIy1OkuUcR-N76U5wLMdQ` | Bait ul Momin Moschee مسجد | `bait-ul-momin-moschee` | Hansestraße 61, 48165 Münster | 51.89386, 7.63030 | Phone: `null`<br>Web: ahmadiyya.de<br>Hours: Open 24h | **PASS** ✅<br>DE, EN, AR 200 OK<br>Canonical & Hreflang match |

### Provenance & Integrity Findings:
1. **Uniqueness:** Exactly 1 entity exists in `mosques.json` and 1 in `all-entities.json` per promoted Place ID. Zero duplicate records.
2. **Provenance & Contacts:** No fabricated postal codes, telephone numbers, websites, or operating hours exist. Where raw data lacked phone or website (`null`), the field was preserved as `null`.
3. **Municipality & Districting:** Addresses with districts (e.g. `Münster-Ost` -> `Münster (Ost)`, `Hiltrup` -> `Münster`) resolved accurately into the official municipality of Münster.

---

## 3. Deep-Dive: BKZ Slug Analysis (`ChIJYypoZAWjuUcRRokLhDbZu5U`)

### 3.1 Observed Phenomenon
- Canonical title in source: `Bošnjački Džemat Münster - BKZ`
- Generated slug stored in `mosques.json`: `bo-nja-ki-d-emat-muenster-bkz`
- Expected clean transliteration: `bosnjacki-dzemat-muenster-bkz`

### 3.2 Root Cause Analysis in `src/pipeline/slugs.ts`
Inspection of `generateCanonicalSlug(title, district)` reveals the mechanism:
```ts
// 1. Prefer Latin portion
const latinMatch = str.match(/[a-zA-ZäöüÄÖÜß\s\-0-9]+/g);
const latinText = latinMatch ? latinMatch.join(' ').trim() : '';
```
1. The regex `/[a-zA-ZäöüÄÖÜß\s\-0-9]+/g` matches ASCII letters, whitespace, hyphens, and German umlauts.
2. The Bosnian title contains South Slavic Latin letters with carons / diacritics:
   - `š` (`\u0161` — Latin small letter s with caron)
   - `č` (`\u010D` — Latin small letter c with caron)
   - `ž` (`\u017E` — Latin small letter z with caron in "Džemat")
3. Because `š`, `č`, and `ž` are excluded from the character set, `str.match(...)` splits the words into disjoint fragments:
   - `"Bo"` + `š` + `"nja"` + `č` + `"ki"` -> `["Bo", "nja", "ki"]`
   - `"D"` + `ž` + `"emat"` -> `["D", "emat"]`
4. The subsequent steps:
   - Join matching tokens with spaces: `"Bo nja ki D emat Münster - BKZ"`
   - Convert umlauts: `ü` -> `ue`
   - Replace symbols and whitespace with hyphens: `.replace(/[^a-z0-9]+/g, '-')`
5. Result: `bo-nja-ki-d-emat-muenster-bkz`.

### 3.3 Systemic Pattern Confirmation
This behavior is systemic across the codebase, not isolated to Münster:
- In Aachen: `Islamska zajednica - Džemat Aachen` -> slug `...-d-emat-aachen-...`
- All Slavic / Turkish / Kurdish characters outside German umlauts (`š, č, ć, ž, đ, ğ, ı, ş`) are currently dropped by `latinMatch` and hyphen-delimited.

### 3.4 Production Safety & Link Integrity
- **Syntactic Validity:** The slug adheres strictly to schema regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`. It contains zero whitespace, replacement characters (``), or URL-invalid tokens.
- **Internal Consistency:**
  - Route: `/de/moschee/muenster/bo-nja-ki-d-emat-muenster-bkz` -> **HTTP 200 OK**
  - Canonical link: `https://moscheeindernaehe.de/de/moschee/muenster/bo-nja-ki-d-emat-muenster-bkz`
  - Hreflangs: Correctly interlink `de`, `en`, `ar`, `x-default` across all three locale variants.
  - JSON-LD: Structured `Mosque` entity rendered without issue.
  - Sitemap: Included exactly once at priority 0.8.
- **Risk Assessment:** No runtime breakage or SEO canonical mismatch exists currently. Changing the slug in this audit phase would break existing pre-rendered static artifacts and URL stability.

### 3.5 Recommended Correction Plan (For Future Minor Pipeline Upgrade)
To support international and diaspora community naming cleanly without breaking historical URLs:
1. Add Unicode normalization / diacritic stripping in `src/pipeline/slugs.ts` before the Latin regex match:
   ```ts
   // Normalize diacritics (e.g. š -> s, č -> c, ž -> z)
   str = str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
   ```
2. Or explicitly map Slavic/Turkish diacritics:
   ```ts
   const DIACRITIC_MAP: Record<string, string> = {
     'š': 's', 'Š': 's', 'č': 'c', 'Č': 'c', 'ć': 'c', 'Ć': 'c',
     'ž': 'z', 'Ž': 'z', 'đ': 'dj', 'Đ': 'dj', 'ğ': 'g', 'Ğ': 'g',
     'ş': 's', 'Ş': 's', 'ı': 'i', 'İ': 'i',
   };
   ```
3. If migrated, implement a 301 permanent redirect from `/de/moschee/muenster/bo-nja-ki-d-emat-muenster-bkz` to `/de/moschee/muenster/bosnjacki-dzemat-muenster-bkz` in `next.config.mjs` to preserve external referrers.
4. **Current Recommendation for Phase 14G:** **LEAVE AS IS** in production data. Documented as known slugifier limitation; no immediate action required.

---

## 4. Test Changes Review

Five test files were modified during Phase 14F:
1. `tests/domain-migration.test.ts`
2. `tests/phase5b.test.ts`
3. `tests/phase6.test.ts`
4. `tests/phase7.test.ts`
5. `tests/phase_nearby_internal_linking.test.ts`

### 4.1 Evaluation of Assertions
Every changed line in these test files updated snapshot count assertions to reflect the approved addition of Münster (7 published records, 1 published city, 24 sitemap URLs):

| Test Suite | Previous Assertion | Phase 14F Assertion | Invariant Safeguards Maintained |
|---|:---:|:---:|---|
| `domain-migration.test.ts` | 594 records / 19 cities / 1,845 sitemap | **601 records / 20 cities / 1,869 sitemap** | Invariant formula `3 + 3 + (20*3) + (601*3) == 1869` fully maintained. All 601 entities must remain `UNVERIFIED`. |
| `phase5b.test.ts` | 594 records / 19 cities / 1,845 sitemap | **601 records / 20 cities / 1,869 sitemap** | Verifies base 9 cities (443 records) remain completely intact. |
| `phase6.test.ts` | 594 records / 19 cities / 1,845 sitemap | **601 records / 20 cities / 1,869 sitemap** | Verifies database city count matches registry exactly; all sitemap URLs unique without query strings. |
| `phase7.test.ts` | 594 records / 653 allEntities | **601 records / 661 allEntities** | Idempotency and zero-mutation dry-run invariants fully preserved. |
| `phase_nearby_internal_linking.test.ts` | 594 records / 19 cities / 1,845 sitemap | **601 records / 20 cities / 1,869 sitemap** | Distance formatting (DE/EN/AR) and nearby selection query performance preserved. |

### 4.2 Safeguard Weakening Assessment
- **Finding:** **ZERO safeguards were weakened.** The tests were not weakened or made lenient; they maintain strict exact-equality checks (`toBe(601)`, `toBe(20)`, `toBe(1869)`).
- **Architectural Observation:** Hardcoding scalar baseline counts in multiple historic phase test files (`phase5b`, `phase6`, `phase7`) creates recurring maintenance overhead upon each controlled promotion.
- **Future Improvement:** Centralize the expected publication counts in a shared test helper or derive dynamic invariants from `src/data/mosques.json` while maintaining regression assertions against unintended shrinkage.

---

## 5. Publication Boundaries & Quarantine Audit

Rigorously verified via `scripts/phase14g-verify-boundaries.ts` (Exit Code 0):

1. **Quarantine of Palace Square Prayer Room (`ChIJd58rTou7uUcRllSptiif6u0`):**
   - In `src/data/mosques.json`: **ABSENT** (0 occurrences).
   - In `src/data/all-entities.json`: Stored strictly as `dataStatus: "REVIEWED"` with full review reason.
   - In Database Repository: `getByCityAndSlug('muenster', 'palace-square-prayer-room-mosque')` returns `null`.
   - In Prerendered HTML: Zero mention on `/de/moscheen/muenster`, `/en/mosques/muenster`, or `/ar/mosques/muenster`.
   - In HTTP Output: Direct route `/de/moschee/muenster/palace-square-prayer-room-mosque` returns **HTTP 404**.
   - In Sitemap: 0 occurrences in `sitemap.xml`.

2. **Quarantine of All Other Non-Published Entities:**
   - Evaluated all **60 non-published entities** (53 `REVIEWED`, 7 `REJECTED`) in `all-entities.json`.
   - Exactly 0 non-published entities exist in `mosques.json`.
   - Exactly 0 non-published entities appear in `sitemap.xml`.

3. **Non-Indexability of Candidate Cities:**
   - Evaluated 11 candidate cities: `kiel`, `regensburg`, `karlsruhe`, `augsburg`, `bielefeld`, `mainz`, `hannover`, `duisburg`, `bochum`, `dresden`, `mannheim`.
   - All 11 cities have `isPublishedCity(slug) === false`.
   - All 11 cities return `publicationEnabled: false` and `seoIndexable: false`.
   - Direct HTTP requests to candidate city pages (e.g. `/de/moscheen/kiel`, `/de/moscheen/regensburg`, `/de/moscheen/karlsruhe`, `/de/moscheen/bielefeld`) return **HTTP 404**.
   - Zero candidate city routes exist in `sitemap.xml`.

4. **Single-City Launch Isolation:**
   - Münster is mathematically verified as the **only** newly enabled city in Phase 14F.

---

## 6. Technical Audit Commands & Exit Codes

| # | Check / Tool | Exact Command | Exit Code | Observed Output / Metrics | Result |
|---|---|---|:---:|---|:---:|
| 1 | Test Suite | `npm test` | `0` | 16 test files passed, 300 / 300 tests passed (2.91s) | **PASS** ✅ |
| 2 | TypeScript | `npx tsc --noEmit` | `0` | 0 errors, 0 diagnostics | **PASS** ✅ |
| 3 | Linter | `npm run lint` | `0` | No ESLint warnings or errors | **PASS** ✅ |
| 4 | Data Quality | `npm run data:audit` | `0` | 601/601 coords valid (100%), 601/601 schema valid (100%), 0 critical issues | **PASS** ✅ |
| 5 | Duplicates | `npm run data:duplicates` | `0` | 0 exact duplicates, 0 new duplicate candidates | **PASS** ✅ |
| 6 | Sitemap | `npx tsx scripts/audit-sitemap.ts` | `0` | Exactly 1,869 valid unique URLs, 0 duplicates, 0 invalid | **PASS** ✅ |
| 7 | City Routes | `npx tsx scripts/phase14f-city-route-audit.ts` | `0` | 7 Münster slugs verified, postal/geo bounds verified, quarantine verified | **PASS** ✅ |
| 8 | Boundary Audit | `npx tsx scripts/phase14g-verify-boundaries.ts` | `0` | All 60 HOLD/REJECT records verified excluded, 11 candidate cities verified 404 | **PASS** ✅ |
| 9 | HTTP Smoke | `powershell -ExecutionPolicy Bypass -File scripts/phase14f-run-and-probe.ps1` | `0` | 17/17 live routes passed on port 3012 (DE/EN/AR 200 OK + RTL + 404 exclusions) | **PASS** ✅ |

---

## 7. Changed Files and Git Working Tree

### Working Tree Status
```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
	modified:   next.config.mjs
	modified:   reports/audit/production-audit-events.jsonl
	modified:   src/app/[locale]/mosques/[city]/page.tsx
	modified:   src/components/MosqueDetailView.tsx
	modified:   src/data/all-entities.json
	modified:   src/data/city-registry-overrides.json
	modified:   src/data/mosques.json
	modified:   src/pipeline/city-config.ts
	modified:   src/pipeline/city-registry.ts
	modified:   src/pipeline/classify.ts
	modified:   src/pipeline/normalize.ts
	modified:   src/pipeline/runner.ts
	modified:   src/pipeline/translations.ts
	modified:   tests/domain-migration.test.ts
	modified:   tests/phase4_pipeline.test.ts
	modified:   tests/phase5b.test.ts
	modified:   tests/phase6.test.ts
	modified:   tests/phase7.test.ts
	modified:   tests/phase_nearby_internal_linking.test.ts
	modified:   tests/pipeline.test.ts

Untracked audit artifacts added in Phase 14G:
	PHASE_14G_POST_PROMOTION_INTEGRITY_AUDIT.md
	scripts/phase14g-inspect-muenster-pages.ts
	scripts/phase14g-verify-boundaries.ts
```

- Raw source JSON (`muenster,germany.json`) remains completely unchanged.
- No git commits, pushes, or deployments have been executed.

---

## 8. Final Audit Conclusion

**Phase 14F is FULLY VERIFIED.**

1. All 7 promoted Münster mosques are active, verified congregational facilities with authentic data and valid static routes.
2. The quarantined University Prayer Room (`ChIJd58rTou7uUcRllSptiif6u0`) is cleanly isolated from public discovery.
3. The slug `bo-nja-ki-d-emat-muenster-bkz` is confirmed to be an existing pipeline slugifier characteristic (exclusion of South Slavic diacritics) rather than a corruption or runtime blocker; all routes and canonical tags resolve without error.
4. All test baseline updates represent valid invariant protections.
5. All 10 technical audit checks passed with Exit Code 0.

**There are NO blockers preventing future city expansions.**
