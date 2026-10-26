# Phase 14F — Münster Controlled Promotion Report

**Project:** MoscheeAtlas  
**Directory:** `C:\Users\HP\Desktop\Germany Mosque Finder`  
**Domain:** `https://moscheeindernaehe.de`  
**Execution Date:** 2026-10-26  
**Status:** **PROMOTION COMPLETE — ALL VALIDATION CHECKS PASSED**

---

## 1. Executive Summary

Phase 14F executed the controlled, local promotion of Münster into the production MoscheeAtlas dataset. Exactly the **7 approved records** from Phase 14E passed all stages of the canonical pipeline (Normalization, Deduplication, Classification, Quality Gates, Review, and Publish) with zero gate weakening and zero synthetic data fabrication. Exactly **1 record** (`ChIJd58rTou7uUcRllSptiif6u0` — Palace Square Prayer Room Mosque) remains strictly on **HOLD** (`REVIEWED`) in quarantine due to missing postal code and student/faculty prayer room scope.

Münster is now enabled as the **20th published city** on `https://moscheeindernaehe.de`. All 1,869 sitemap URLs, 1,885 static pages, 300 automated regression tests, TypeScript types, ESLint rules, data audit gates, and 17 live local HTTP smoke probes passed with exit code 0.

Raw source JSON files (`muenster,germany.json`) remain byte-for-byte untouched. No commits, pushes, or deployments were performed.

---

## 2. Before / After Dataset & System Metrics

| Metric | Baseline (Phase 14E / Preflight) | Final (Phase 14F Post-Promotion) | Delta | Verification Command / Source |
|---|:---:|:---:|:---:|---|
| **Published Mosques** | 594 | **601** | +7 | `src/data/mosques.json` |
| **All Entities** | 653 | **661** | +8 | `src/data/all-entities.json` |
| — *PUBLISHED Entities* | 594 | **601** | +7 | `all-entities.json (dataStatus: "PUBLISHED")` |
| — *REVIEWED Entities (HOLD)* | 52 | **53** | +1 | `all-entities.json (dataStatus: "REVIEWED")` |
| — *REJECTED Entities* | 7 | **7** | 0 | `all-entities.json (dataStatus: "REJECTED")` |
| **Published Cities** | 19 | **20** | +1 | `src/data/city-registry-overrides.json` & `city-config.ts` |
| **Sitemap Canonical URLs** | 1,845 | **1,869** | +24 | `scripts/audit-sitemap.ts` (0 dupes, 0 invalid) |
| — *Homepage URLs* | 3 | 3 | 0 | `/de`, `/en`, `/ar` |
| — *Search Hub URLs* | 3 | 3 | 0 | `/de/moscheen`, `/en/mosques`, `/ar/mosques` |
| — *City Hub URLs* | 57 (19 × 3) | **60** (20 × 3) | +3 | `/de/moscheen/muenster`, `/en/mosques/muenster`, `/ar/mosques/muenster` |
| — *Detail Page URLs* | 1,782 (594 × 3) | **1,803** (601 × 3) | +21 | 7 new mosques × 3 locales |
| **Static Build Pages** | 1,861 | **1,885** | +24 | `next build` static export |
| **Automated Test Suite** | 300 / 300 | **300 / 300** | 0 failures | `vitest run` (16 test files) |
| **TypeScript Diagnostics** | 0 errors | **0 errors** | 0 | `tsc --noEmit` |
| **ESLint Warnings/Errors** | 0 | **0** | 0 | `next lint` |
| **Data Quality Violations** | 0 | **0** | 0 | `tsx scripts/data-audit.ts` |
| **Duplicate Violations** | 0 | **0** | 0 | `tsx scripts/data-duplicates.ts` |
| **HTTP Smoke Probes** | — | **17 / 17 passed** | 100% | `scripts/phase14f-probe-http.ts` |

---

## 3. Record-by-Record Promotion Manifest & Pipeline Decisions

All 8 Münster raw records were processed strictly through `runPipeline(rawRecords, 'Münster')`.

| # | Google Place ID | Canonical Name | Address & Postal Code | Contact / Hours | Category | Pipeline Status | Action & Justification |
|---|---|---|---|---|:---:|:---:|---|
| 1 | `ChIJn6ZhH4y6uUcRRdptFyWdN-I` | مسجد الرحمن / Arrahmanmoschee | Meßkamp 15, 48147 Münster | Phone: `+4915901361733`<br>Web: Facebook<br>Hours: Daily 06:00–22:00 | `MOSQUE` | `PUBLISHED` | **PROMOTED**. Active Sunni congregational mosque serving Münster-Nord / Coerde. 158 Google reviews (4.7★). Zero collisions. |
| 2 | `ChIJqyE5Bte6uUcRFkRb8Ywf3NY` | Sultan Ahmet Camii ( Verband Islamischer Kulturzentren e.V. - VIKZ ) | Bernhard-Ernst-Straße 7, 48155 Münster | Phone: `+49251664258`<br>Web: `http://www.vikz.de`<br>Hours: Daily 10:00–22:00 | `MOSQUE` | `PUBLISHED` | **PROMOTED**. Established VIKZ mosque in Münster Hansaviertel. 48 reviews (4.8★). 600m from DITIB (independent pin). |
| 3 | `ChIJBc5hbdm6uUcRLyetOq73giI` | Munster Central Mosque | Bremer Platz 42, 48155 Münster | Phone: `+49251665810`<br>Web: `http://www.ditib-muenster.de`<br>Hours: Continuous | `MOSQUE` | `PUBLISHED` | **PROMOTED**. Central Münster DITIB congregational mosque near Hauptbahnhof. 239 reviews (4.6★). |
| 4 | `ChIJu8AMms-luUcRVFFEtFUSrZQ` | As-Salam Moschee | Hammer Str. 352, 48153 Münster | Phone: `null`<br>Web: Facebook group<br>Hours: Daily 04:00–22:30 | `MOSQUE` | `PUBLISHED` | **PROMOTED**. Active congregational mosque in Münster Berg Fidel. 80 reviews (4.6★). Authentic missing phone left null. |
| 5 | `ChIJN1qZ4Ly7uUcRx3dZUWMjP5Y` | Ar-Rahmah Moschee | Königsberger Str. 260, 48157 Münster (Ost) | Phone: `null`<br>Web: Mawaqit timetable<br>Hours: Live prayer schedule | `MOSQUE` | `PUBLISHED` | **PROMOTED**. Active congregational mosque in Münster-Ost with verified real-time prayer schedule. 36 reviews (4.7★). Distinct slug from record #1. |
| 6 | `ChIJYypoZAWjuUcRRokLhDbZu5U` | Bošnjački Džemat Münster - BKZ | Münsterstraße 52B, 48167 Münster | Phone: `null`<br>Web: `null`<br>Hours: `null` | `MOSQUE` | `PUBLISHED` | **PROMOTED**. Bosnian Islamic community center (BKZ / IGBD) in Münster-Wolbeck. 11 reviews (5.0★). Genuine nulls preserved. |
| 7 | `ChIJX0PIy1OkuUcR-N76U5wLMdQ` | Bait ul Momin Moschee مسجد | Hansestraße 61, 48165 Münster | Phone: `null`<br>Web: `http://www.ahmadiyya.de`<br>Hours: Open 24 hours | `MOSQUE` | `PUBLISHED` | **PROMOTED**. Purpose-built mosque in Münster-Hiltrup. 59 reviews (4.3★). Hiltrup correctly mapped to Münster municipality. |
| 8 | `ChIJd58rTou7uUcRllSptiif6u0` | Palace Square Prayer Room Mosque | Schloss, Münster | Phone: `null`<br>Web: `null`<br>Hours: Mon–Fri 07:30–15:30 | `MOSQUE` | `REVIEWED` | **RETAINED ON HOLD**. University student/staff quiet room (*Raum der Stille*) at Fürstbischöfliches Schloss with restricted weekday hours. Missing postal code. Excluded from published dataset, sitemap, routes, and internal links. |

---

## 4. Quarantined HOLD Record Protection Verification

The record `ChIJd58rTou7uUcRllSptiif6u0` (Palace Square Prayer Room Mosque) was rigorously audited against leakage:
- **`src/data/mosques.json`**: Absent (not in published mosques).
- **`src/data/all-entities.json`**: Stored with status `"REVIEWED"` and `reviewReason: "Administrative university prayer room at Fürstbischöfliches Schloss with restricted weekday hours; missing postal code; held in review queue to prevent thin page indexing"`.
- **Database Repository**: `repo.getByCityAndSlug('muenster', 'palace-square-prayer-room-mosque')` returns `null`.
- **HTTP Smoke Probe**: `GET /de/moschee/muenster/palace-square-prayer-room-mosque` returns **HTTP 404 Not Found**.
- **City Collection Filtering**: `forbiddenTexts` check confirms zero mention of "Palace Square Prayer Room Mosque" on `/de/moscheen/muenster`, `/en/mosques/muenster`, and `/ar/mosques/muenster`.
- **Sitemap Exclusion**: Zero occurrences in `sitemap.xml` / `scripts/audit-sitemap.ts`.

---

## 5. City Configuration & Localization Changes

1. **`src/pipeline/city-config.ts`**:
   - Added Münster to active `CITY_CONFIGS`:
     ```ts
     {
       canonical: 'Münster',
       slug: 'muenster',
       englishSlug: 'muenster',
       state: 'Nordrhein-Westfalen',
       postalMin: 48143,
       postalMax: 48167,
       aliases: ['muenster', 'münster', 'Münster', 'Muenster'],
     },
     ```
   - Maintained in `EXTENDED_CITY_CONFIGS` for backwards compatibility.

2. **`src/data/city-registry-overrides.json`**:
   - Activated Münster lifecycle status:
     ```json
     "muenster": {
       "status": "PUBLISHED",
       "publicationEnabled": true,
       "seoIndexable": true,
       "launchedAt": "2026-10-26T08:56:22.569Z"
     }
     ```

3. **Arabic & Localization Mapping**:
   - `src/app/[locale]/mosques/[city]/page.tsx`: Added `'Münster': 'مونستر'` to `ARABIC_CITY_NAMES`.
   - `src/components/MosqueDetailView.tsx`: Added `'Münster': 'مونستر'` to `ARABIC_CITY_NAMES`.
   - `src/pipeline/translations.ts`: Existing mapping `'Münster': 'مونستر'` verified.

---

## 6. Route, Build, and Smoke Test Verification

### 6.1 Production Build (`npm run build`)
- Successfully compiled Next.js application without warnings or errors.
- Generated all **1,885 static SSG pages**:
  - 3 homepages (`/de`, `/en`, `/ar`)
  - 3 search hub pages (`/de/moscheen`, `/en/mosques`, `/ar/mosques`)
  - 60 city hub pages (20 cities × 3 locales)
  - 1,803 mosque detail pages (601 mosques × 3 locales)
  - Legal & admin pages (`/impressum`, `/datenschutz`, `/admin`)

### 6.2 HTTP Smoke Probes (`scripts/phase14f-probe-http.ts`)
Run against live Next.js production server on port 3012:
- `[Test 1/17] /de/moscheen/muenster` -> **200 OK** (Title: Münster, Canonical: `https://moscheeindernaehe.de/de/moscheen/muenster`, Mosques listed, Hold excluded)
- `[Test 2/17] /en/mosques/muenster` -> **200 OK** (Title: Muenster, Canonical: `https://moscheeindernaehe.de/en/mosques/muenster`, Hold excluded)
- `[Test 3/17] /ar/mosques/muenster` -> **200 OK** (`dir="rtl"`, Title: مونستر, Canonical: `https://moscheeindernaehe.de/ar/mosques/muenster`)
- `[Test 4/17] /de/moschee/muenster/arrahmanmoschee` -> **200 OK** (Address: Meßkamp 15, PLZ: 48147, JSON-LD Schema: Valid)
- `[Test 5/17] /en/mosque/muenster/arrahmanmoschee` -> **200 OK** (Title: ArrahmanMosque, Canonical: `https://moscheeindernaehe.de/en/mosque/muenster/arrahmanmoschee`)
- `[Test 6/17] /ar/mosque/muenster/arrahmanmoschee` -> **200 OK** (`dir="rtl"`, JSON-LD Schema: Valid)
- `[Test 7/17] /de/moschee/muenster/munster-central-mosque` -> **200 OK** (Bremer Platz 42, PLZ: 48155, DITIB)
- `[Test 8/17] /de/moschee/muenster/sultan-ahmet-camii-verband-islamischer-kulturzentren-vikz` -> **200 OK** (Bernhard-Ernst-Straße 7, PLZ: 48155)
- `[Test 9/17] /de/moschee/muenster/as-salam-moschee` -> **200 OK** (Hammer Str. 352, PLZ: 48153)
- `[Test 10/17] /de/moschee/muenster/ar-rahmah-moschee` -> **200 OK** (Königsberger Str. 260, PLZ: 48157)
- `[Test 11/17] /de/moschee/muenster/bo-nja-ki-d-emat-muenster-bkz` -> **200 OK** (Münsterstraße 52B, PLZ: 48167)
- `[Test 12/17] /de/moschee/muenster/bait-ul-momin-moschee` -> **200 OK** (Hansestraße 61, PLZ: 48165)
- `[Test 13/17] /de/moschee/muenster/palace-square-prayer-room-mosque` -> **404 Not Found** ✅
- `[Test 14/17] /de/moscheen/kiel` -> **404 Not Found** ✅
- `[Test 15/17] /de/moscheen/regensburg` -> **404 Not Found** ✅
- `[Test 16/17] /de/moscheen/karlsruhe` -> **404 Not Found** ✅
- `[Test 17/17] /de/moscheen/bielefeld` -> **404 Not Found** ✅

---

## 7. Command Execution & Exit Codes Summary

| Step | Command | Exit Code | Outcome |
|---|---|:---:|---|
| Preflight Baseline Verification | `node -e "..."` | `0` | Verified 594 mosques, 653 entities, 19 cities |
| Preflight Sitemap Audit | `npx tsx scripts/audit-sitemap.ts` | `0` | Verified 1,845 sitemap entries |
| Controlled Ingestion Script | `npx tsx scripts/publish-muenster.ts` | `0` | Ingested 7 published, 1 reviewed, updated registry override |
| Data Quality Audit | `npm run data:audit` | `0` | 601/601 valid coordinates & schema; 0 issues |
| Duplicate Collision Audit | `npm run data:duplicates` | `0` | 0 exact duplicates; 0 new conflicts |
| Sitemap Post-Promotion Audit | `npx tsx scripts/audit-sitemap.ts` | `0` | 1,869 valid unique URLs (0 dupes, 0 invalid) |
| City Route & Boundary Audit | `npx tsx scripts/phase14f-city-route-audit.ts` | `0` | All 7 slugs verified; bounds verified; hold quarantined |
| Automated Test Suite | `npm test` | `0` | 16/16 test files passed, 300/300 tests passed |
| TypeScript Diagnostics | `npx tsc --noEmit` | `0` | 0 errors |
| Code Quality Linter | `npm run lint` | `0` | 0 warnings or errors |
| Production Build | `npm run build` | `0` | 1,885 static pages prerendered successfully |
| Local HTTP Smoke Tests | `powershell -ExecutionPolicy Bypass -File scripts/phase14f-run-and-probe.ps1` | `0` | 17/17 routes passed (200 OK + 404 exclusions + RTL) |

---

## 8. Changed Files & Working Tree Status

### Modified Files:
- `reports/audit/production-audit-events.jsonl` (Appended Phase 14F controlled promotion audit event)
- `src/app/[locale]/mosques/[city]/page.tsx` (Added `'Münster': 'مونستر'` to `ARABIC_CITY_NAMES`)
- `src/components/MosqueDetailView.tsx` (Added Münster and published cities to `ARABIC_CITY_NAMES`)
- `src/data/all-entities.json` (653 -> 661 entities: 7 PUBLISHED, 1 REVIEWED)
- `src/data/city-registry-overrides.json` (Added `muenster` with `PUBLISHED` status)
- `src/data/mosques.json` (594 -> 601 records: 7 Münster mosques added)
- `src/pipeline/city-config.ts` (Added Münster to `CITY_CONFIGS`)
- `tests/domain-migration.test.ts` (Updated baseline invariants to 601 records, 20 cities, 1,869 sitemap URLs)
- `tests/phase5b.test.ts` (Updated baseline invariants to 601 records, 20 cities, 1,869 sitemap URLs)
- `tests/phase6.test.ts` (Updated baseline invariants to 601 records, 20 cities, 1,869 sitemap URLs)
- `tests/phase7.test.ts` (Updated baseline invariants to 601 records, 661 entities)
- `tests/phase_nearby_internal_linking.test.ts` (Updated baseline invariants to 601 records, 20 cities, 1,869 sitemap URLs)

### New Verification Scripts:
- `scripts/publish-muenster.ts` (Idempotent canonical promotion script)
- `scripts/phase14f-city-route-audit.ts` (Deep route, boundary, and quarantine audit)
- `scripts/phase14f-probe-http.ts` (17 HTTP live smoke probes)
- `scripts/phase14f-run-and-probe.ps1` (Automated server runner and probe harness)

---

## 9. Final Phase 14F Certification

- **Is Münster now locally indexable?**  
  **YES**. Münster is fully configured in `CITY_CONFIGS` and `city-registry-overrides.json`, correctly prerenders across German (`/de/moscheen/muenster`), English (`/en/mosques/muenster`), and Arabic (`/ar/mosques/muenster`), emits canonical links, includes 7 valid mosque detail routes with schema JSON-LD, and generates 24 indexable URLs in the canonical sitemap.

- **Did all validation checks pass?**  
  **YES**. 100% of pipeline quality gates, regression suites, typechecks, linters, sitemap audits, boundary audits, production builds, and live HTTP smoke probes passed without error.
