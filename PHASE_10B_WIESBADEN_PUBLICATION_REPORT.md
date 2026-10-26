# Phase 10B — Wiesbaden Publication Report (17 Approved Records)

**Execution Date:** 2026-10-25  
**Stage:** Phase 10B — Controlled Local Publication (No Live Deployment)  
**Publication Status:** Wiesbaden **PUBLISHED** locally  
**Target Scope:** Wiesbaden ONLY (17 approved records; Record 18 held on HOLD)  

---

## 1. Executive Summary & Production Transformation

In accordance with explicit authorization under Phase 10B, Wiesbaden has been promoted locally as the 15th published city in MoscheeAtlas:

| Metric | Before Promotion (Baseline) | After Promotion (Phase 10B) | Delta | Evidence / Target File |
|:---|:---:|:---:|:---:|:---|
| **Published Mosques** | **542** | **559** | **+17** | `src/data/mosques.json` |
| **All Entities (Staging)** | **594** | **612** | **+18** | `src/data/all-entities.json` |
| **Published Cities** | **14** | **15** | **+1** | `Wiesbaden` added to published pool |
| **Sitemap Valid URLs** | **1,674** | **1,728** | **+54** | Generated via `scripts/audit-sitemap.ts` |
| **Wiesbaden Registry Status** | `DISCOVERED` | `PUBLISHED` | Promoted | `src/data/city-registry-overrides.json` |
| **Wiesbaden `publicationEnabled`** | `false` | `true` | Enabled | `city-registry.ts` override |
| **Wiesbaden `seoIndexable`** | `false` | `true` | Enabled | `city-registry.ts` override |
| **Excluded Duplicate Record** | N/A | **HOLD (Staging only)** | 1 record | `all-entities.json` only |

---

## 2. Exact Record IDs Promoted (17 Approved Facilities)

All 17 approved records were promoted from `wiesbaden,germany.json` into [`src/data/mosques.json`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/data/mosques.json) with `dataStatus: "PUBLISHED"`. All 542 existing records were preserved byte-for-byte.

| # | Google Place ID | Canonical Name | Address | Postal | Category | Verified Contact |
|:---:|:---|:---|:---|:---:|:---:|:---|
| 1 | `ChIJo73-4caXvUcR-JkPLVdR0SI` | Ayasofya Cami, Medrese-i Nuriye | Schmalweg 36, 55252 Wiesbaden | 55252 | `MOSQUE` | Tel: `+49 174 6530755` |
| 2 | `ChIJp1fuPXW-vUcRXsDzPMHQJKQ` | Süleymaniye-Moschee | Dotzheimer Str. 24-26, 65185 Wiesbaden | 65185 | `MOSQUE` | Tel: `+49 611 376333` |
| 3 | `ChIJsZ_fkxa-vUcRbK4Lad3tmW8` | Wiesbaden Central Mosque | Holzstraße 36, 65197 Wiesbaden | 65197 | `MOSQUE` | Tel: `+49 611 9410492`<br>Web: `ditib-wiesbaden.de` |
| 4 | `ChIJRWTYPAC9vUcRbrQsUHPyB7A` | Masjid as Sunnah | Egerstraße 2, 65205 Wiesbaden | 65205 | `MOSQUE` | Web: `masjid-as-sunnah.de` |
| 5 | `ChIJw9OO_Y2VvUcRh1m-vh9dgDE` | Marokkanischer Kulturverein e.V. Badr Moschee | Stielstraße 19, 65201 Wiesbaden | 65201 | `MOSQUE` | Tel: `+49 611 598386`<br>Web: `masjid-badr.de` |
| 6 | `ChIJd-yqKx2WvUcRUnMVfd0Eu5Y` | Wiesbaden Central Mosque (Omar Moschee) | Henkellstraße 12, 65187 Wiesbaden | 65187 | `MOSQUE` | Tel: `+49 611 608390`<br>Web: `omar-moschee.de` |
| 7 | `ChIJ1c3P-3WXvUcRvVhxEtn2Q4Q` | Moroccan Culture Center | Anton-Hehn-Straße 2, 55246 Wiesbaden | 55246 | `MOSQUE` | Tel: `+49 6134 298592`<br>Web: `ikv-kostheim.de` |
| 8 | `ChIJ31MSbj6-vUcRwd_rBbyWemI` | Mubarak Moschee | Sommerstraße 13, 65197 Wiesbaden | 65197 | `MOSQUE` | Tel: `+49 611 72448724`<br>Web: `mubarak-moschee.de` |
| 9 | `ChIJr4MVCKm_vUcRGWv7cazSMHE` | Tauhid Moschee | Fischbacher Str. 3, 65197 Wiesbaden | 65197 | `MOSQUE` | Tel: `+49 611 7244077` |
| 10 | `ChIJscDlq3W-vUcR2x2oNNhis_E` | Deutsch Somalischer e.V. - Masjid Abubakar | Hellmundstraße 11, 65183 Wiesbaden | 65183 | `MOSQUE` | Tel: `+49 611 45031007`<br>Web: `masjid-abubakar.de` |
| 11 | `ChIJ2Y_SWHW-vUcRvKN0ysXoQOY` | Islamische Gemeinde Wiesbaden - مسجد السلام | Rheinstraße 75, 65185 Wiesbaden | 65185 | `MOSQUE` | Tel: `+49 611 88025577`<br>Web: `igw-hessen.de` |
| 12 | `ChIJq0M65gG-vUcRiy2wjVHQHYE` | IGMG Wiesbaden e. V. Mescidi Aksa Moschee | Kärntner Str. 3, 65187 Wiesbaden | 65187 | `MOSQUE` | Tel: `+49 611 39738`<br>Web: `ajanda.igmg.org/...` |
| 13 | `ChIJv955JAq_vUcRpPic5HU-Ts8` | Vahdet-Moschee | Helenenstraße 26, 65183 Wiesbaden | 65183 | `MOSQUE` | **Phone omitted** (`phone: null`) |
| 14 | `ChIJQREh3XW-vUcRo7eJv-BM0eU` | Islam Info Service Wiesbaden e.V. | Bertramstraße 9, 65183 Wiesbaden | 65183 | `MOSQUE` | Tel: `+49 176 76477777`<br>Web: `iis-wiesbaden.de` |
| 15 | `ChIJCSjf3HW-vUcR0HjEWRGVzE0` | Darul-Taqwa Moschee | Helenenstraße 9, 65183 Wiesbaden | 65183 | `MOSQUE` | Valid address & coords |
| 16 | `ChIJaZvb-t-9vUcR88n2ahxjABA` | Islamische Gemeinschaft der Bosniaken Wiesbaden e.V. | Rheinstraße 64, 65185 Wiesbaden | 65185 | `MOSQUE` | Tel: `+49 1516 4605559` |
| 17 | `ChIJWYTrj76XvUcRj1EpuYOLVzE` | Afghanisch islamischer Kulturverein Wiesbaden | Erich-Ollenhauer-Straße 4, 65203 Wiesbaden | 65203 | `MOSQUE` | Web: `afgkv.de` |

---

## 3. Explicit Exclusion & Data Sanitization Rules

### 3.1 Moschee Schierstein Excluded on HOLD (Stable ID Exclusion)
- **Place ID:** `ChIJOYKxBgCVvUcR0ZVvoTpmab0`
- **Canonical Name:** `"Moschee Schierstein"`
- **Address:** `Stielstraße 19, 65201 Wiesbaden`
- **Status Applied:** Staged in `src/data/all-entities.json` with `dataStatus: "REVIEWED"` and `reviewReason: "HOLD: Suspected duplicate pin of Badr Moschee at Stielstraße 19; excluded from publication."`.
- **Public Output Verification:**
  - `src/data/mosques.json`: **ABSENT** (`mosques.some(m => m.placeId === 'ChIJOYKxBgCVvUcR0ZVvoTpmab0') === false`).
  - Sitemap: **ABSENT** (0 occurrences in `1,728` URLs).
  - Public Route Resolution: Returns `null` via `repo.getByCityAndSlug('wiesbaden', 'moschee-schierstein')`.

### 3.2 Vahdet-Moschee Phone Sanitization
- **Place ID:** `ChIJv955JAq_vUcRpPic5HU-Ts8`
- **Canonical Name:** `"Vahdet-Moschee"`
- **Action Applied:** The raw Google Maps phone number (`+49 31184 3829`), which contained a non-existent German area code (`031184`), was omitted by setting `phone: null`.
- **Verification:** `mosques.find(m => m.placeId === 'ChIJv955JAq_vUcRpPic5HU-Ts8').phone === null`. All other fields (address, reviews, coordinates, translations) were preserved.

---

## 4. Files Modified and Rationale

| File | Changes Made | Rationale |
|:---|:---|:---|
| [`src/pipeline/city-config.ts`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/pipeline/city-config.ts) | Added `Wiesbaden` to `CITY_CONFIGS` array with postal ranges `{65183..65207, 55246, 55252}` | Required for `getPublishedCityConfigs()`, static param generation, sitemap indexing, and search routing |
| [`src/data/city-registry-overrides.json`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/data/city-registry-overrides.json) | Added `"wiesbaden": { "status": "PUBLISHED", "publicationEnabled": true, "seoIndexable": true }` | Core registry source of truth for city lifecycle status |
| [`src/data/mosques.json`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/data/mosques.json) | Appended 17 approved Wiesbaden records (length: 542 → 559) | Production database of published mosques |
| [`src/data/all-entities.json`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/data/all-entities.json) | Appended 18 Wiesbaden records (17 PUBLISHED + 1 REVIEWED on HOLD; length: 594 → 612) | Complete multi-status entity audit store |
| [`src/pipeline/translations.ts`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/pipeline/translations.ts) | Added `'Wiesbaden': 'فيسبادن'` to `CITY_ARABIC` | Generates authentic Arabic entity translations |
| [`src/app/[locale]/mosques/[city]/page.tsx`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/app/[locale]/mosques/[city]/page.tsx) | Added `'Wiesbaden': 'فيسبادن'` to `ARABIC_CITY_NAMES` | Renders localized Arabic title: `مساجد فيسبادن` |
| `tests/domain-migration.test.ts` | Updated baseline assertions to 559 records, 15 cities, 1,728 sitemap URLs | Protects against regressions on new published baseline |
| `tests/phase5b.test.ts` | Updated baseline assertions to 559 records, 15 cities, 1,728 sitemap URLs | Protects against regressions on new published baseline |
| `tests/phase6.test.ts` | Updated baseline assertions to 559 records, 15 cities, 1,728 sitemap URLs | Protects against regressions on new published baseline |
| `tests/phase7.test.ts` | Updated baseline assertions to 559 records, 612 all-entities | Protects against regressions on new published baseline |
| `tests/phase_nearby_internal_linking.test.ts` | Updated baseline assertions to 559 records, 15 cities, 1,728 sitemap URLs | Protects against regressions on new published baseline |

---

## 5. Public Routes & Sitemap Verification

### 5.1 Route Calculations
- **City Collection Routes Added (3 URLs):**
  - German: `https://moscheeindernaehe.de/de/moscheen/wiesbaden`
  - English: `https://moscheeindernaehe.de/en/mosques/wiesbaden`
  - Arabic: `https://moscheeindernaehe.de/ar/mosques/wiesbaden`
- **Mosque Detail Routes Added (51 URLs):**
  - 17 approved mosques × 3 locales (`de`, `en`, `ar`)
  - Example German: `https://moscheeindernaehe.de/de/moschee/wiesbaden/marokkanischer-kulturverein-badr-moschee`
  - Example English: `https://moscheeindernaehe.de/en/mosque/wiesbaden/marokkanischer-kulturverein-badr-moschee`
  - Example Arabic: `https://moscheeindernaehe.de/ar/mosque/wiesbaden/marokkanischer-kulturverein-badr-moschee`

### 5.2 Actual Sitemap Verification (Generated Output)
Executed directly via `scripts/audit-sitemap.ts`:
- **Total Sitemap URLs:** **1,728** (calculated dynamically from code; $1,674 + 54 = 1,728$).
- **Unique URLs:** **1,728** (0 duplicates).
- **Invalid URLs:** **0** (0 non-HTTPS, 0 admin, 0 query parameters).
- **Exact Wiesbaden URL Count:** **54** ($3 \text{ city} + 51 \text{ detail}$).
- **Validation Status:** `Sitemap validation PASSED!`.

### 5.3 Canonical, Hreflang & Schema Parity
Verified programmatically via [`scripts/phase10b-seo-check.ts`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/scripts/phase10b-seo-check.ts):
- Every Wiesbaden mosque detail page generates valid JSON-LD (`@type: Mosque`) with canonical HTTPS `@id` and localized breadcrumbs.
- Hreflang tags correctly cross-link `de`, `en`, `ar`, and `x-default`.
- Arabic RTL directionality renders the official Arabic city name: **فيسبادن**.

---

## 6. Comprehensive Verification & Regression Suite Results

All quality, regression, and audit checks were executed against the updated codebase:

| Verification Suite | Target Requirement | Actual Result | Status |
|:---|:---|:---:|:---:|
| **Vitest Test Suite** | 16 test files / 298 tests passing | **298 / 298 passed** (2.83s) | ✅ PASS |
| **TypeScript Compilation** | `npx tsc --noEmit` | **0 errors** | ✅ PASS |
| **ESLint Quality Check** | `npm run lint` | **0 errors / 0 warnings** | ✅ PASS |
| **Data Quality Audit** | `npm run data:audit` (559 published records) | **0 critical violations** (100% coords valid) | ✅ PASS |
| **Duplicate / Collision Audit**| `npm run data:duplicates` | **0 new collisions** | ✅ PASS |
| **City Boundary Regression** | `npx tsx scripts/phase10a-postal-test.ts` | **12 / 12 passed** (55246 & 55252 intact) | ✅ PASS |
| **Route & Repository Check** | `npx tsx scripts/phase10b-verify-routes.ts` | **All assertions passed** | ✅ PASS |
| **SEO & Sitemap Coverage** | `npx tsx scripts/phase10b-seo-check.ts` | **All 54 URLs verified** | ✅ PASS |
| **Sitemap Integrity Audit** | `npx tsx scripts/audit-sitemap.ts` | **1,728 URLs verified** | ✅ PASS |

---

## 7. Safety Invariants & Confirmation

- **Total Published Record Count:** Exactly **559** (542 baseline + 17 Wiesbaden).
- **Total Published City Count:** Exactly **15** (14 baseline + 1 Wiesbaden).
- **Excluded Record:** `ChIJOYKxBgCVvUcR0ZVvoTpmab0` (*Moschee Schierstein*) is 100% absent from `src/data/mosques.json`, routes, search, and sitemap. It remains strictly on `HOLD` in `src/data/all-entities.json`.
- **Candidate Cities Isolation:** All 11 other candidate cities (Mainz, Aachen, Bielefeld, Kiel, Lübeck, Freiburg, Regensburg, Saarbrücken, Augsburg, Karlsruhe, Münster) remain strictly `DISCOVERED` with 0 records in `src/data/mosques.json` and 0 public routes.
- **Duisburg & Hannover:** Retain their existing `READY_FOR_LAUNCH` state; neither was promoted.

---

> [!IMPORTANT]
> **STOP CONDITION REACHED:** Phase 10B local promotion and verification are complete. All 17 approved records are published locally, verified across tests and sitemaps. Zero live-server deployments have been made. Awaiting explicit user instruction before any deployment action.
