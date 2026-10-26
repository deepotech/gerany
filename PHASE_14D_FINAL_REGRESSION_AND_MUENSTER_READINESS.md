# Phase 14D — Final Regression Verification & Münster Readiness Assessment

**Project:** MoscheeAtlas  
**Working Directory:** `C:\Users\HP\Desktop\Germany Mosque Finder`  
**Domain:** `https://moscheeindernaehe.de`  
**Execution Date:** 2026-10-25  
**Phase Objective:** Perform read-only regression verification following Phase 14C (Freiburg promotion), probe all HTTP routes against local production, execute Münster dry-run pipeline, and assess readiness for Phase 14E pre-promotion audit.

---

## 1. Verified Baseline State

All figures independently derived from actual files in the repository:

| Metric | Verified Value | Verification Method / Source File |
|---|---|---|
| **Published Mosques** | **594** | `src/data/mosques.json` (exact array length) |
| **All Entities** | **653** | `src/data/all-entities.json` (594 PUB / 52 REV / 7 REJ) |
| **Published Cities** | **19** | 10 default + 9 overrides in `city-registry-overrides.json` |
| **Sitemap URLs** | **1,845** | `scripts/audit-sitemap.ts` & `scripts/phase14c-verify-sitemap.ts` |
| **Sitemap Duplicates** | **0** | Verified unique |
| **Sitemap Invalid URLs** | **0** | Validated against URL regex and route patterns |
| **Freiburg Published** | **8** | Exact Place IDs 1–8 listed below |
| **Freiburg HOLD Quarantined** | **2** | `ChIJiciOGQAbkUcRq_EXWX5w5og` & `ChIJKwI2woYckUcRd9ll41_0lBs` absent from public output |
| **Remaining Candidates** | **9** | Kiel, Münster, Karlsruhe, Augsburg, Bielefeld, Mainz, Regensburg + 2 others — all disabled/non-indexable |

### Exact 8 Published Freiburg Records
1. `ChIJs__ka7obkUcRU7p2lKdioIA` — IGBD-Gemeinde Freiburg e.V.
2. `ChIJX-_7m4AbkUcRBAYD-TMFgrc` — Afghan mosque
3. `ChIJxU0hg4YckUcReUmvimKL5r8` — Kulturzentrum für Bildung und Integration e.V.
4. `ChIJVSJzPAockUcR8zEaSARBeGo` — Freiburg DITIB Mevlana Moschee e.V.
5. `ChIJ0bXTKD4bkUcR6PlvVTCSmbI` — Mosque Freiburg
6. `ChIJd8c-yXwbkUcRoSi6TKBrAHs` — Freiburg Islamic Centre
7. `ChIJP7gfAAAbkUcR8t1TZft-NqI` — Qendra Islame Shqiptare Vizion e.V. Freiburg
8. `ChIJ-xg0xIYckUcRO6tsryi7_Tc` — Ibad ur Rahman Moschee

### Quarantined Freiburg Records (Both Confirmed Excluded)
- `ChIJiciOGQAbkUcRq_EXWX5w5og` — Villingen (out-of-market prayer space, 50+ km away)
- `ChIJKwI2woYckUcRd9ll41_0lBs` — Freiburg-Herdern Mosque (unverified co-located shadow pin at Habsburgerstraße 56a)

---

## 2. Validation Command Sequence & Exit Codes

All 8 canonical verification commands executed sequentially with zero regressions:

| Step | Command | Exit Code | Detailed Result |
|---|---|:---:|---|
| **1** | `npm test` | **0** | **300 / 300 tests passed** across 16 test suites |
| **2** | `npx tsc --noEmit` | **0** | **0 TypeScript compilation errors** |
| **3** | `npm run lint` | **0** | **0 ESLint warnings or errors** |
| **4** | `npm run data:audit` | **0** | **594 / 594 (100.0%) valid records**, 0 critical issues |
| **5** | `npm run data:duplicates` | **0** | **0 exact duplicate Place IDs** |
| **6a** | `npx tsx scripts/audit-sitemap.ts` | **0** | **1,845 entries**, 0 duplicates, 0 invalid URLs |
| **6b** | `npx tsx scripts/phase14c-verify-sitemap.ts` | **0** | Confirmed: 594 mosques, 19 cities, 1,845 URLs, 0 HOLD leaks |
| **7** | `npx tsx scripts/phase14d-city-route-audit.ts` | **0** | All 9 remaining candidate cities non-indexable, HOLD records unreachable |
| **8** | `npm run build` | **0** | Next.js production build succeeded, **1,861 static pages prerendered** |

*(Note on Step 8: Initial execution encountered a transient Windows sandbox filesystem lock on `mkdir .next/types/app`; resolved on identical clean rerun without code changes).*

---

## 3. HTTP Route Smoke Tests (Local Production Server)

Command: `powershell -ExecutionPolicy Bypass -File scripts/phase14c-run-and-probe.ps1`  
Port: `3012`  
Exit Code: **0**

| Test | Route | Expected | Result | Status |
|---|---|---|---|:---:|
| 1 | `/de/moscheen/freiburg` | 200 OK, Freiburg hub content | 200 OK | ✅ PASSED |
| 2 | `/en/mosques/freiburg` | 200 OK, English Freiburg hub | 200 OK | ✅ PASSED |
| 3 | `/ar/mosques/freiburg` | 200 OK, Arabic Freiburg hub | 200 OK | ✅ PASSED |
| 4 | `/de/moschee/freiburg/freiburg-islamic-centre` | 200 OK, German detail page | 200 OK | ✅ PASSED |
| 5 | `/en/mosque/freiburg/freiburg-islamic-centre` | 200 OK, English detail page | 200 OK | ✅ PASSED |
| 6 | `/ar/mosque/freiburg/freiburg-islamic-centre` | 200 OK, Arabic detail page | 200 OK | ✅ PASSED |
| 7 | `/de/moschee/freiburg/ibad-ur-rahman-moschee` | 200 OK, detail page | 200 OK | ✅ PASSED |
| 8 | `/de/moschee/freiburg/mosque-freiburg` | 200 OK, detail page | 200 OK | ✅ PASSED |
| 9 | `/de/moschee/freiburg/freiburg-ditib-mevlana-moschee` | 200 OK, detail page | 200 OK | ✅ PASSED |
| 10 | `/de/moschee/freiburg/villingen` | 404 Not Found (quarantined HOLD record) | 404 | ✅ PASSED |
| 11 | `/de/moschee/freiburg/freiburg-herdern-mosque` | 404 Not Found (quarantined HOLD record) | 404 | ✅ PASSED |
| 12 | `/de/moscheen/kiel` | Disabled candidate (non-indexable / 404 fallback) | Protected | ✅ PASSED |
| 13 | `/de/moscheen/muenster` | Disabled candidate (non-indexable / 404 fallback) | Protected | ✅ PASSED |
| 14 | `/de/moscheen/karlsruhe` | Disabled candidate (non-indexable / 404 fallback) | Protected | ✅ PASSED |

**Result:** 14 / 14 HTTP route smoke tests PASSED.

---

## 4. Münster Dry-Run Pipeline Audit

Source dataset: `muenster,germany.json`  
Total raw records: **8**  
Pipeline execution script: `scripts/phase14d-muenster-dryrun.ts`

### Dry-Run Summary
- **READY for promotion:** 7 records
- **HOLD (quarantined):** 1 record
- **REJECT:** 0 records
- **Conflict with published data:** 0 records

### Detailed Record Triage

#### A. READY Records (7)
1. **`ChIJn6ZhH4y6uUcRRdptFyWdN-I`** — مسجد الرحمن / Arrahmanmoschee
   - Address: Meßkamp 15, 48147 Münster, Germany
   - Postal Code: `48147` (Valid)
   - Coordinates: `51.9810921, 7.6148267` (Valid)
   - Phone: `+49 1590 1361733`
   - Evaluation: Active congregational mosque.

2. **`ChIJqyE5Bte6uUcRFkRb8Ywf3NY`** — Sultan Ahmet Camii (VIKZ)
   - Address: Bernhard-Ernst-Straße 7, 48155 Münster, Germany
   - Postal Code: `48155` (Valid)
   - Coordinates: `51.9522741, 7.6372732` (Valid)
   - Phone: `+49 251 664258`
   - Evaluation: Established VIKZ community mosque.

3. **`ChIJBc5hbdm6uUcRLyetOq73giI`** — Munster Central Mosque (DITIB)
   - Address: Bremer Platz 42, 48155 Münster, Germany
   - Postal Code: `48155` (Valid)
   - Coordinates: `51.9576663, 7.6372066` (Valid)
   - Phone: `+49 251 665810`
   - Evaluation: Central Münster community mosque.

4. **`ChIJu8AMms-luUcRVFFEtFUSrZQ`** — As-Salam Moschee
   - Address: Hammer Str. 352, 48153 Münster, Germany
   - Postal Code: `48153` (Valid)
   - Coordinates: `51.9262716, 7.6286266` (Valid)
   - Phone: None listed
   - Evaluation: Verified local prayer facility.

5. **`ChIJN1qZ4Ly7uUcRx3dZUWMjP5Y`** — Ar-Rahmah Moschee
   - Address: Königsberger Str. 260, 48157 Münster-Ost, Germany
   - Postal Code: `48157` (Valid)
   - Coordinates: `51.9941396, 7.6630676` (Valid)
   - Phone: None listed
   - Evaluation: Active congregational mosque with Mawaqit presence.

6. **`ChIJYypoZAWjuUcRRokLhDbZu5U`** — Bošnjački Džemat Münster - BKZ
   - Address: Münsterstraße 52B, 48167 Münster, Germany
   - Postal Code: `48167` (Valid)
   - Coordinates: `51.9247794, 7.7250407` (Valid)
   - Phone: None listed
   - Evaluation: Bosnian Islamic community center.

7. **`ChIJX0PIy1OkuUcR-N76U5wLMdQ`** — Bait ul Momin Moschee مسجد
   - Address: Hansestraße 61, 48165 Hiltrup, Germany
   - Postal Code: `48165` (Valid)
   - Coordinates: `51.8938567, 7.6302976` (Valid)
   - Phone: None listed
   - Evaluation: Community prayer facility in Münster-Hiltrup.

#### B. HOLD Quarantined Record (1)
- **`ChIJd58rTou7uUcRllSptiif6u0`** — Palace Square Prayer Room Mosque
  - Address: `Schloss, Münster, Germany`
  - Postal Code: `null` / Missing
  - Coordinates: `51.9646649, 7.6134979`
  - Reason for HOLD: Fails schema validation (`postalCode: Invalid or missing (got: null). Must be a valid German 5-digit postal code`).
  - **Policy Rule:** Under no circumstances should a postal code be guessed or fabricated. This record must remain strictly quarantined on HOLD during any future promotion.

---

## 5. Münster Infrastructure Readiness for Phase 14E

- **City Registry (`src/pipeline/city-registry.ts`):**  
  Entry exists (`id: 'muenster'`, canonical: `Münster`, slug: `muenster`, `nameAr: 'مونستر'`).  
  Current flags: `status: 'DISCOVERED'`, `publicationEnabled: false`, `seoIndexable: false` (securely non-public).
- **Extended City Config (`src/pipeline/city-config.ts`):**  
  Present in `EXTENDED_CITY_CONFIGS` with postal code range `48143`–`48167`.
- **Deduplication:** Zero co-located or duplicate pairs identified among the 8 raw records.
- **Threshold Check:** 7 READY records comfortably exceed the 5-record city launch requirement (`minPublishedRecords: 5`).

---

## 6. Git Working-Tree Confirmation

- Clean check against Git: No commits, pushes, or deployments were performed during Phase 14D.
- All untracked verification scripts and raw data files remain intact.

---

## 7. Mandatory Phase Statement

> **No records promoted, no city enabled, no commit, no push, and no deployment during this phase.**  
> The repository is verified fully stable and ready to proceed to **Phase 14E — Münster Pre-Promotion Audit**.
