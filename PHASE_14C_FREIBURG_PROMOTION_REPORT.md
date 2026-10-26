# PHASE 14C — Controlled Freiburg im Breisgau Promotion Report

**Project:** MoscheeAtlas  
**Domain:** `https://moscheeindernaehe.de`  
**Execution Date:** 2026-10-25  
**Candidate Dataset:** `freiburg,germany.json` (10 raw records)  
**Status:** LOCAL PROMOTION COMPLETED (No commit, no push, no deployment)

---

## 1. Executive Summary & Before / After Verification

Freiburg im Breisgau was promoted locally following the rigorous forensic triage established in Phase 14B. Exactly 8 verified congregational facilities were promoted to the production dataset, while the 2 ambiguous/thin records (`Villingen` and `Freiburg-Herdern Mosque`) were strictly quarantined on HOLD in `all-entities.json`.

### Verified Invariant Baseline Comparison

| Metric | Pre-Promotion Baseline (Phase 14B) | Post-Promotion Actual (Phase 14C) | Change | Verification Source |
|---|---|---|---|---|
| **Published Mosques** | 586 | **594** | **+8** | `src/data/mosques.json` |
| **All Entities** | 643 (586 PUB / 50 REV / 7 REJ) | **653** (594 PUB / 52 REV / 7 REJ) | **+10** | `src/data/all-entities.json` |
| **Published Live Cities** | 18 | **19** | **+1** (Freiburg) | `getPublishedCityConfigs()` |
| **Canonical Sitemap URLs** | 1,818 | **1,845** | **+27** | `scripts/phase14c-verify-sitemap.ts` |
| **Next.js Static Pages** | 1,834 | **1,861** | **+27** | `npm run build` |
| **Vitest Test Suite** | 300 / 300 passed | **300 / 300 passed** | 0 failures | `npm test` (16 test files) |
| **TypeScript Typecheck** | Exit 0 | **Exit 0 (0 errors)** | Clean | `npx tsc --noEmit` |
| **ESLint Quality Check** | Exit 0 | **Exit 0 (0 warnings, 0 errors)** | Clean | `npm run lint` |
| **Production Data Audit** | 100% valid | **100% valid (0 critical issues)** | Clean | `npm run data:audit` |
| **Duplicate Place IDs** | 0 | **0 exact duplicates** | Clean | `npm run data:duplicates` |
| **HTTP Smoke Tests** | 14 passed | **14 / 14 passed (100%)** | Clean | `scripts/phase14c-probe-http.ts` |

---

## 2. Exactly 8 Promoted Facilities

The 8 promoted facilities were passed through the canonical pipeline sequence:
`RAW → NORMALIZED → DEDUP → CLASSIFY → QUALITY → REVIEW → PUBLISH`

| # | Facility Name | Canonical German Slug | Google Place ID | Normalized Address | Phone | Website | Review Volume |
|---|---|---|---|---|---|---|---|
| **1** | IGBD-Gemeinde Freiburg e.V. | `igbd-gemeinde-freiburg` | `ChIJs__ka7obkUcRU7p2lKdioIA` | Wiechertstraße 2A, 79114 Freiburg | `null` | `null` | 2 revs (5.0★) |
| **2** | Afghan mosque | `afghan-mosque` | `ChIJX-_7m4AbkUcRBAYD-TMFgrc` | Liebigstraße 19, 79108 Freiburg | `null` | `null` | 3 revs (5.0★) |
| **3** | Kulturzentrum für Bildung und Integration e.V | `kulturzentrum-fuer-bildung-und-integration` | `ChIJxU0hg4YckUcReUmvimKL5r8` | Habsburgerstraße 79, 79104 Freiburg (Nord) | `+497613839999` | `null` | 15 revs (4.6★) |
| **4** | Freiburg DITIB Mevlana Moschee e.V. | `freiburg-ditib-mevlana-moschee` | `ChIJVSJzPAockUcR8zEaSARBeGo` | Rufacher Str. 11, 79110 Freiburg | `+4976148977148` | `http://www.ditibfreiburg.de` | 71 revs (4.7★) |
| **5** | Mosque Freiburg | `mosque-freiburg` | `ChIJ0bXTKD4bkUcR6PlvVTCSmbI` | Rufacher Str. 5, 79110 Freiburg (West) | `+4976159513138` | `https://bbfverein.de` | 187 revs (4.8★) |
| **6** | Freiburg Islamic Centre | `freiburg-islamic-centre` | `ChIJd8c-yXwbkUcRoSi6TKBrAHs` | Hugstetter Str. 36, 79106 Freiburg (West) | `+49761273131` | `https://www.izfr.de/Hauptseite` | 352 revs (4.9★) |
| **7** | Qendra Islame Shqiptare Vizion e.V. Freiburg | `qendra-islame-shqiptare-vizion-freiburg` | `ChIJP7gfAAAbkUcR8t1TZft-NqI` | Merdinger Weg 9, 79111 Freiburg | `+4917661074008` | `http://xhamia-vizion.de` | 16 revs (4.7★) |
| **8** | Ibad ur Rahman Moschee | `ibad-ur-rahman-moschee` | `ChIJ-xg0xIYckUcRO6tsryi7_Tc` | Habsburgerstraße 56A, 79104 Freiburg (Nord) | `+497612171372` | `null` | 137 revs (4.6★) |

---

## 3. Mandatory Quarantine of Both HOLD Records

In accordance with Phase 14B triage, the two ambiguous/thin records were kept strictly quarantined in `src/data/all-entities.json` with status `REVIEWED`:

1. **`ChIJiciOGQAbkUcRq_EXWX5w5og` — Villingen**
   - **Reason:** `Thin record: Zero reviews, no phone, no website, and no opening hours; held in review queue to avoid thin page indexing`
   - **Quarantine Check:** 0 occurrences in `mosques.json`, 0 occurrences in sitemap, HTTP route `/de/moschee/freiburg/villingen` returns **404 Not Found**.
2. **`ChIJKwI2woYckUcRd9ll41_0lBs` — Freiburg-Herdern Mosque**
   - **Reason:** `Suspected co-located shadow pin at Habsburgerstraße 56a; 15m from Ibad ur Rahman Moschee without independent phone/website; held in review queue`
   - **Quarantine Check:** 0 occurrences in `mosques.json`, 0 occurrences in sitemap, HTTP route `/de/moschee/freiburg/freiburg-herdern-mosque` returns **404 Not Found**.

---

## 4. City Configuration, Routing & SEO Integration

1. **City Registry Overrides (`src/data/city-registry-overrides.json`):**
   ```json
   "freiburg": {
     "status": "PUBLISHED",
     "publicationEnabled": true,
     "seoIndexable": true,
     "launchedAt": "2026-10-25T20:47:18.995Z"
   }
   ```
2. **City Config (`src/pipeline/city-config.ts`):**
   - Added to `CITY_CONFIGS`:
     ```ts
     {
       canonical: 'Freiburg im Breisgau',
       slug: 'freiburg',
       englishSlug: 'freiburg',
       state: 'Baden-Württemberg',
       postalMin: 79098,
       postalMax: 79117,
       aliases: ['freiburg', 'Freiburg', 'Freiburg im Breisgau'],
     }
     ```
3. **Arabic Metadata (`src/app/[locale]/mosques/[city]/page.tsx`):**
   - Added `'Freiburg im Breisgau': 'فرايبورغ إم برايسغاو'` to `ARABIC_CITY_NAMES`.
4. **Canonical & Alternate Parity:**
   - German collection: `/de/moscheen/freiburg`
   - English collection: `/en/mosques/freiburg`
   - Arabic collection: `/ar/mosques/freiburg` (`dir="rtl"`)
   - All detail routes generate valid `<link rel="canonical">` and `hreflang` alternates.
5. **Sitemap Breakdown ($1,845$ total URLs):**
   - Home pages: $3$ (`/de`, `/en`, `/ar`)
   - Hub pages: $3$ (`/de/moscheen`, `/en/mosques`, `/ar/mosques`)
   - City collection pages: $19 \times 3 = 57$
   - Facility detail pages: $594 \times 3 = 1,782$
   - **Total:** $3 + 3 + 57 + 1,782 = 1,845$ URLs.
   - Exact mathematical breakdown verified by `scripts/phase14c-verify-sitemap.ts`.

---

## 5. Test & Audit Execution Results

| Test / Audit Command | Scope | Result | Status |
|---|---|---|---|
| `npm test` | Complete Vitest test suite | 300 / 300 tests passed across 16 files | ✅ PASSED |
| `npx tsc --noEmit` | Strict TypeScript compilation | 0 type errors | ✅ PASSED |
| `npm run lint` | Next.js & ESLint rules | 0 errors, 0 warnings | ✅ PASSED |
| `npm run data:audit` | Data schema & coordinate validation | 594 / 594 (100%) valid coordinates and schema | ✅ PASSED |
| `npm run data:duplicates` | Exact Place ID duplication scan | 0 exact duplicate IDs | ✅ PASSED |
| `npx tsx scripts/phase14c-verify-sitemap.ts` | Sitemap integrity and leakage audit | 1,845 unique URLs, 0 duplicates, 0 leaks | ✅ PASSED |
| `npm run build` | Next.js production SSG build | 1,861 static pages prerendered with exit code 0 | ✅ PASSED |
| `scripts/phase14c-run-and-probe.ps1` | Live HTTP route smoke tests on port 3012 | 14 / 14 routes passed (including 404s for HOLD records) | ✅ PASSED |

---

## 6. Live Route Probe Results (14/14 Passed)

```
[Test 1/14]  /de/moscheen/freiburg ........................................ PASSED ✅
[Test 2/14]  /en/mosques/freiburg ......................................... PASSED ✅
[Test 3/14]  /ar/mosques/freiburg (RTL + Arabic Name) ..................... PASSED ✅
[Test 4/14]  /de/moschee/freiburg/freiburg-islamic-centre ................. PASSED ✅
[Test 5/14]  /en/mosque/freiburg/freiburg-islamic-centre .................. PASSED ✅
[Test 6/14]  /ar/mosque/freiburg/freiburg-islamic-centre .................. PASSED ✅
[Test 7/14]  /de/moschee/freiburg/ibad-ur-rahman-moschee .................. PASSED ✅
[Test 8/14]  /de/moschee/freiburg/mosque-freiburg ......................... PASSED ✅
[Test 9/14]  /de/moschee/freiburg/freiburg-ditib-mevlana-moschee .......... PASSED ✅
[Test 10/14] /de/moschee/freiburg/villingen (HOLD -> Expected 404) ........ PASSED ✅
[Test 11/14] /de/moschee/freiburg/freiburg-herdern-mosque (Expected 404) .. PASSED ✅
[Test 12/14] /de/moscheen/kiel (Unpromoted -> Expected 404) ............... PASSED ✅
[Test 13/14] /de/moscheen/muenster (Unpromoted -> Expected 404) ........... PASSED ✅
[Test 14/14] /de/moscheen/karlsruhe (Unpromoted -> Expected 404) ......... PASSED ✅
```

---

## 7. Git Working Tree State

The promotion was performed purely in the local working directory:
- **Modified Tracked Files:** 19 files (data stores, city configuration, translations, test suites, audit log).
- **Raw Datasets:** `freiburg,germany.json` and all other candidate source JSON files are **100% untouched**.
- **Git Commits:** Exactly **0** commits made.
- **Git Push / Deploy:** **None**.

---

Local promotion only: exactly 8 Freiburg records promoted if all gates passed; two HOLD records remain excluded; raw source data unchanged; no commit, no push, and no deployment.
