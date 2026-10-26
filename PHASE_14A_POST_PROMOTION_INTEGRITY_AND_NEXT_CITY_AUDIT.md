# PHASE 14A — Post-Promotion Integrity Audit & Next-City Selection Report

**Project:** MoscheeAtlas  
**Domain:** `https://moscheeindernaehe.de`  
**Execution Date:** 2026-10-25  
**Audit Scope:** Production state post-Saarbrücken (Phase 13B), public/indexable data integrity, and candidate city selection audit.

---

## 1. Executive Summary & Verified Baseline

Following the Phase 13B promotion of Saarbrücken, a comprehensive post-promotion integrity audit was conducted across the codebase, datasets, sitemap, routing tables, and candidate city sources.

### Invariant Baseline Verification (Derived from Files & Output)

| Metric | Pre-Saarbrücken (Phase 13A) | Post-Saarbrücken (Phase 13B Actual) | Verification Command / Source | Status |
|---|---|---|---|---|
| **Published Mosques** | 575 | **586** (+11) | `src/data/mosques.json` | ✅ Verified |
| **All Entities** | 631 | **643** (+12) | `src/data/all-entities.json` | ✅ Verified |
| **Entity Status Breakdown** | 575 PUB / 50 REV / 6 REJ | **586 PUB / 50 REV / 7 REJ** | Status grouping on `all-entities.json` | ✅ Verified |
| **Published Live Cities** | 17 | **18** (+1) | `getPublishedCityConfigs()` & overrides | ✅ Verified |
| **Sitemap Canonical URLs** | 1,782 | **1,818** (+36) | `scripts/audit-sitemap.ts` | ✅ Verified |
| **Next.js Static Pages** | 1,798 | **1,834** (+36) | `npm run build` | ✅ Verified |
| **Vitest Test Suite** | 300 / 300 passed | **300 / 300 passed** (16 test files) | `npm test` | ✅ Verified |
| **TypeScript Typecheck** | Exit 0 | **Exit 0 (0 errors)** | `npx tsc --noEmit` | ✅ Verified |
| **ESLint Quality Check** | Exit 0 | **Exit 0 (0 warnings, 0 errors)** | `npm run lint` | ✅ Verified |
| **Production Data Audit** | 100% valid | **100% valid, 0 critical issues** | `npm run data:audit` | ✅ Verified |
| **Exact Duplicate Place IDs**| 0 | **0** | `npm run data:duplicates` | ✅ Verified |

---

## 2. Saarbrücken Promotion Verification

All 12 Saarbrücken records from `saarbruecken,germany.json` were audited in Phase 13A and processed in Phase 13B:

### The 11 Promoted Records (Published)
1. `ChIJk8onlSG0lUcRyyx-Bbh6D5M` — **Islamisches Kulturzentrum Saarbrücken** (Phone safely sanitized to `null`; raw provenance `+49 123123456123456` preserved in `rawValues.phone`)
2. `ChIJ4fg50zO3lUcRdYZltqxFN0E` — **Marokkanischer Kulturverein im Saarland e.V.**
3. `ChIJOUlD5VqxlUcRtLH7N1Cb_-8` — **Islamische Glaubensgemeinschaft Saarbrücken e.V.**
4. `ChIJRW_hOnqxlUcRTodhwBY9qro` — **Islamische Gemeinde Saarland e.V.**
5. `ChIJifx4YlixlUcR6nUEbCzFPAw` — **Masjid Bilal**
6. `ChIJxUI-g9-2lUcRmk-swcGE1Sc` — **جامع عمر بن الخطاب Moschee**
7. `ChIJJ_eL8u6xlUcRNiszmunrNic` — **Bosanski kulturni Center Saarbrücken**
8. `ChIJJ7MX3v2zlUcR015xVW9NeMU` — **Ditib Saarbrücken Merkez Cami**
9. `ChIJ9Xnu8PaxlUcRMljGilFcRTE` — **Masjid Al Noor**
10. `ChIJCzxD4Mq1lUcRGMryhOqaRow` — **32 Omar Ibn Abdalaziz Moschee**
11. `ChIJa7X6CQCxlUcR2QVshvHP0CM` — **Fatih Cami**

### The Excluded Record (REJECTED)
- `ChIJ9TXIFHyxlUcREjbZu-bS0vk` — **Pakistan Islamic Centre Saarbrucken**
  - **Status:** `REJECTED` in `all-entities.json`.
  - **Rejection Reason:** Co-located duplicate shadow pin 10m from Masjid Al Noor (`ChIJ9Xnu8PaxlUcRMljGilFcRTE`) at Jakobstraße 2 sharing identical phone `+49 173 3067351`; contains corrupted hours and vandalized description.
  - **Integrity Check:** Zero occurrences in `mosques.json`, zero occurrences in sitemap, zero occurrences in public static pages.

### Phone Sanitization Verification
- Facility: `Islamisches Kulturzentrum Saarbrücken` (`ChIJk8onlSG0lUcRyyx-Bbh6D5M`)
- Normalized public phone: `null` (verified in both `mosques.json` and `all-entities.json`).
- Raw provenance: `rawValues.phone = "+49 123123456123456"` preserved.
- Regression test: `tests/phase4_pipeline.test.ts` asserts that `+49 123123456123456` produces `isValid: false` and `phone: null`.

---

## 3. Public-Data & Indexability Integrity Audit

A full forensic verification was executed to verify that no non-published or candidate data leaks into public indexable surfaces:

1. **Gate Exclusivity:**
   - Only records with `dataStatus === 'PUBLISHED'` exist in `src/data/mosques.json`.
   - All 50 `REVIEWED` and 7 `REJECTED` entities exist strictly in `src/data/all-entities.json` and cannot be accessed via repository methods (`getMosqueRepository().getMosques()`).
2. **Canonical and Sitemap Isolation:**
   - Total sitemap entries: **1,818**
     - Home URLs: 3 (`/de`, `/en`, `/ar`)
     - Hub URLs: 3 (`/de/moscheen`, `/en/mosques`, `/ar/mosques`)
     - City Collection URLs: 54 (18 live cities × 3 locales)
     - Detail URLs: 1,758 (586 published mosques × 3 locales)
     - Sum: $3 + 3 + 54 + 1,758 = 1,818$ URLs.
   - Non-indexable candidate cities: 0 candidate cities appear in sitemap or navigation.
3. **Geographic & Address Validation:**
   - 586 / 586 (100.0%) published mosques have valid latitude [47.0–55.5] and longitude [5.5–15.5].
   - 586 / 586 (100.0%) have non-empty street addresses and valid 5-digit German postal codes.
4. **Localization & RTL:**
   - Arabic translations are present for all 18 published cities across `translations.ts` and `src/app/[locale]/mosques/[city]/page.tsx`.
   - Arabic city slug routes generate proper `<html dir="rtl" lang="ar">` with hreflang alternate links to German and English counterparts.

---

## 4. Status Check: Duisburg & Hannover

An explicit verification was performed to resolve whether `Duisburg` and `Hannover` were previously promoted or remain unpromoted candidates:

- **Raw Files:** `Duisburg, Germany.json` (61 records) and `Hannover, Germany.json` (28 records) exist in the root folder.
- **Published Mosques (`mosques.json`):** Exactly 0 records for Duisburg; 0 records for Hannover.
- **All Entities Store (`all-entities.json`):** Exactly 0 entities for Duisburg; 0 entities for Hannover.
- **City Registry (`city-registry-overrides.json` & `city-registry.ts`):** Both are configured with `status: "REVIEW"`, `publicationEnabled: false`, `seoIndexable: false`.
- **Finding:** **Neither Duisburg nor Hannover has been promoted.** Both are unpromoted candidate datasets originating from the initial ingestion phase, requiring comprehensive data pipeline validation before any promotion.

---

## 5. Candidate Cities Audit & Evaluation

All 10 remaining unpublished candidate datasets were evaluated using the production pipeline (`runPipeline` with `includeExtendedCities: true` and `dryRun: true`):

| City | Raw Count | Dup Place IDs | Pipeline READY | Pipeline HOLD | Pipeline REJECT | Same-Address Groups | Missing Phone / Web / Hours | Primary Findings & Review Queue Notes |
|---|---|---|---|---|---|---|---|---|
| **Freiburg im Breisgau** | 10 | 0 | **9** | **1** | 0 | 1 pair (Habsburgerstr. 56a) | 4 / 6 / 7 | High quality. 1 thin record held (`Villingen`, 0 reviews). Co-located pair at Habsburgerstraße 56a requires duplicate verification. |
| **Münster** | 8 | 0 | **7** | **1** | 0 | 0 groups | 5 / 2 / 3 | Exceptionally clean. 0 address collisions. 1 record held (Palace Square Prayer Room, missing postal code on university campus). |
| **Kiel** | 12 | 0 | **8** | **4** | 0 | 0 groups | 7 / 8 / 10 | Solid community mosques. Exactly 4 zero-review thin records cleanly held by quality gates (`Mettenhofer`, `Sandkrug`, etc.). |
| **Regensburg** | 11 | 0 | **10** | 0 | **1** | 1 pair (Friedenstr. 14A) | 7 / 5 / 8 | 1 REJECT (association without prayer indicator). 1 same-address pair at Friedenstr. 14A (`Pakistanisch-Deutsches Kulturzentrum` vs `مسجد بلال`). |
| **Karlsruhe** | 13 | 0 | **12** | **1** | 0 | 1 pair (Greschbachstr. 3A) | 6 / 4 / 7 | Strong review counts. 1 HOLD (`Deutschsprachiger Muslimkreis`, unclear classification). 1 pair at Greschbachstraße 3A. |
| **Augsburg** | 20 | 0 | **18** | **1** | **1** | 0 groups | 8 / 9 / 11 | 1 REJECT (cultural club without prayer facility). 1 HOLD (association). Several cultural association premises need review. |
| **Bielefeld** | 21 | 0 | **19** | **2** | 0 | 3 pairs | 8 / 9 / 10 | High complexity: 3 same-address pairs (Windelsbleicher Str., Ernst-Rein-Str., Schillerstr.). Includes corporate-tagged African community mosque. |
| **Mainz** | 16 | 0 | **14** | **2** | 0 | 3 pairs | 6 / 8 / 9 | High complexity: 3 same-address pairs. Contains `Türk Federasyonu Mainz Ülkü Ocağı` (cultural/political clubhouse requiring HOLD). |
| **Hannover** | 28 | 0 | **23** | **4** | **1** | 2 pairs | 10 / 16 / 14 | 2 same-address pairs. 1 REJECT (commercial non-mosque sports facility). 4 HOLD (associations and thin records). |
| **Duisburg** | 61 | 0 | **58** | **3** | 0 | 4 pairs | 29 / 30 / 39 | High volume. 4 same-address pairs (Dieselstr., Ostackerweg, Winterstr., Elisabethstr.). Needs dedicated multi-stage triage. |

---

## 6. Top 3 Next-City Recommendations & Ranking

Using the five selection criteria:
1. Strength of evidence for active congregational mosques / public prayer facilities
2. Address and coordinate reliability
3. Duplicate and conflict risk
4. Number of records safely passing the production pipeline
5. Readiness of city configuration, translations, routes, and tests

### 🥇 Rank 1: Freiburg im Breisgau (`freiburg,germany.json`)
- **Total Records:** 10 raw records.
- **Pipeline Outcome:** 9 READY, 1 HOLD, 0 REJECT.
- **Strengths:** 
  - Major established congregational institutions with high community review volume:
    - *Freiburg Islamic Centre* (`ChIJd8c-yXwbkUcRoSi6TKBrAHs`): 352 reviews, rating 4.9.
    - *Mosque Freiburg (BBF)* (`ChIJ0bXTKD4bkUcR6PlvVTCSmbI`): 187 reviews, rating 4.8.
    - *Ibad ur Rahman Moschee* (`ChIJ-xg0xIYckUcRO6tsryi7_Tc`): 137 reviews, rating 4.6.
    - *Freiburg DITIB Mevlana Moschee e.V.* (`ChIJVSJzPAockUcR8zEaSARBeGo`): 71 reviews, rating 4.7.
  - Coordinate validity: 100% within Baden-Württemberg boundaries.
  - Automatic filtering: The generic/thin pin "Villingen" (`ChIJiciOGQAbkUcRq_EXWX5w5og`, 0 reviews, no phone, no web) is cleanly quarantined in the `REVIEWED` queue.
- **Triage Items for Promotion:**
  - Audit the pair at Habsburgerstraße 56a: *Freiburg-Herdern Mosque* (`ChIJKwI2woYckUcRd9ll41_0lBs`, 12 reviews) vs *Ibad ur Rahman Moschee* (`ChIJ-xg0xIYckUcRO6tsryi7_Tc`, 137 reviews). Determine if this is a shadow duplicate or co-located prayer room.
- **Configuration Readiness:**
  - Already defined in `EXTENDED_CITY_CONFIGS` (slug: `freiburg`, canonical: `Freiburg im Breisgau`, postal codes 79098–79117).
  - Arabic name `فرايبورغ إم برايسغاو` already defined in `translations.ts`.

---

### 🥈 Rank 2: Münster (`muenster,germany.json`)
- **Total Records:** 8 raw records.
- **Pipeline Outcome:** 7 READY, 1 HOLD, 0 REJECT.
- **Strengths:**
  - Zero same-address duplicate groups across the entire city dataset.
  - Strong, distinct congregational mosques across different districts:
    - *Munster Central Mosque (DITIB)* (`ChIJBc5hbdm6uUcRLyetOq73giI`): 239 reviews, rating 4.6.
    - *مسجد الرحمن / Arrahmanmoschee* (`ChIJn6ZhH4y6uUcRRdptFyWdN-I`): 158 reviews, rating 4.7.
    - *As-Salam Moschee* (`ChIJu8AMms-luUcRVFFEtFUSrZQ`): 80 reviews, rating 4.6.
    - *Bait ul Momin Moschee* (`ChIJX0PIy1OkuUcR-N76U5wLMdQ`): 59 reviews, rating 4.3.
    - *Sultan Ahmet Camii (VIKZ)* (`ChIJqyE5Bte6uUcRFkRb8Ywf3NY`): 48 reviews, rating 4.8.
    - *Ar-Rahmah Moschee* (`ChIJN1qZ4Ly7uUcRx3dZUWMjP5Y`): 36 reviews, rating 4.7.
    - *Bošnjački Džemat Münster* (`ChIJYypoZAWjuUcRRokLhDbZu5U`): 11 reviews, rating 5.0.
  - Exactly 1 record held: *Palace Square Prayer Room Mosque* (`ChIJd58rTou7uUcRllSptiif6u0`), which fails schema validation due to a missing postal code (`Schloss, Münster`).
- **Configuration Readiness:**
  - Defined in `EXTENDED_CITY_CONFIGS` (slug: `muenster`, canonical: `Münster`, postal codes 48143–48167).
  - Arabic name `مونستر` already defined in `translations.ts`.

---

### 🥉 Rank 3: Kiel (`kiel,germany.json`)
- **Total Records:** 12 raw records.
- **Pipeline Outcome:** 8 READY, 4 HOLD, 0 REJECT.
- **Strengths:**
  - 8 solid, distinct community prayer facilities (Mevlana-Moschee 113 reviews, Al-Djîlâniyy 85 reviews, Abn Taymiyyah 68 reviews, Habib Moschee 65 reviews, Zentrum Moschee 60 reviews, etc.).
  - Exactly 4 zero-review, thin records are safely quarantined in the review queue by pipeline quality gates (`Mettenhofer Moschee`, `Mettenhof moschee`, `Salahaddin Mosque Kiel`, `مسجد`).
  - Zero duplicate Place IDs; no ambiguous address collisions among the 8 ready records.
- **Configuration Readiness:**
  - Defined in `EXTENDED_CITY_CONFIGS` (slug: `kiel`, canonical: `Kiel`, postal codes 24103–24159).
  - Arabic name `كيل` already defined in `translations.ts`.

---

## 7. Blockers and Unresolved Risks

1. **Habsburgerstraße 56a Co-location (Freiburg):**
   - *Freiburg-Herdern Mosque* (`ChIJKwI2woYckUcRd9ll41_0lBs`) and *Ibad ur Rahman Moschee* (`ChIJ-xg0xIYckUcRO6tsryi7_Tc`) share the exact street address `Habsburgerstraße 56a`. A pre-promotion audit must verify whether these are two distinct associations sharing space or duplicate Google Place pins for the same mosque.
2. **Rufacher Straße Co-location / Proximity (Freiburg):**
   - *Rufacher Str. 11* (DITIB Mevlana Moschee) and *Rufacher Str. 5* (Mosque Freiburg / BBF) are adjacent buildings. Pipeline correctly treats them as distinct entities; audit must ensure coordinates and names remain unconflicted.
3. **Candidate Cities Remaining Disabled:**
   - All 10 candidate cities must remain with `publicationEnabled: false` and `seoIndexable: false` until their specific promotion phase.

---

## 8. Exact Recommended Next Phase

**Recommended Step:**
Proceed to **Phase 14B — Freiburg im Breisgau Pre-Promotion Audit & Triage**.

In Phase 14B:
1. Perform forensic record-level audit of all 10 Freiburg records.
2. Resolve the Habsburgerstraße 56a pair (`ChIJKwI2woYckUcRd9ll41_0lBs` vs `ChIJ-xg0xIYckUcRO6tsryi7_Tc`).
3. Confirm the exclusion of the thin `Villingen` record (`ChIJiciOGQAbkUcRq_EXWX5w5og`).
4. Validate phone numbers and website reachability.
5. Create `PHASE_14B_FREIBURG_PRE_PROMOTION_AUDIT.md`.

---

**Audit only: no additional records promoted, no city enabled, no commit, no push, and no deployment.**
