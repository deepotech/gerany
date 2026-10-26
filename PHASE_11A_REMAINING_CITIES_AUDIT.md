# Phase 11A — Remaining 11 Candidate Cities Re-Audit Report

**Execution Date:** 2026-10-25  
**Stage:** Phase 11A — Candidate City Re-Audit & Evidence-Based Readiness Ranking  
**Production Baseline:** **559 published mosques across 15 cities (STRICTLY PRESERVED)**  
**Sitemap State:** **1,728 valid URLs (STRICTLY PRESERVED)**  
**Candidate Scope:** 11 unpromoted cities (`luebeck`, `saarbruecken`, `aachen`, `freiburg`, `kiel`, `mainz`, `regensburg`, `karlsruhe`, `augsburg`, `bielefeld`, `muenster`)  
**Publication Action:** **NONE (AUDIT ONLY — Zero cities promoted or deployed)**  

---

## 1. Executive Summary & Baseline Preservation

Following the local promotion of Wiesbaden (Phase 10B) and its full release readiness validation (Phase 10C), Phase 11A re-audits all 11 remaining candidate cities in the Germany-wide dataset.

### 1.1 Invariant Protection Status
- **Published Mosques:** Exactly **559 records** in [`src/data/mosques.json`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/data/mosques.json) (**0 added, 0 modified, 0 deleted**).
- **All Entities (Audit Store):** Exactly **612 records** in [`src/data/all-entities.json`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/data/all-entities.json) (559 `PUBLISHED`, 37 `REVIEWED`, 16 `REJECTED`).
- **Published Cities:** Exactly **15 cities** (Köln, Berlin, Hamburg, München, Frankfurt, Düsseldorf, Stuttgart, Dortmund, Essen, Wuppertal, Bonn, Bremen, Nürnberg, Leipzig, Wiesbaden).
- **Sitemap Canonical URLs:** Exactly **1,728 entries** (100% valid, 0 duplicate, 0 leaks).
- **Candidate City Registry Status:** All 11 candidate cities remain strictly configured with:
  - `status: "DISCOVERED"`
  - `publicationEnabled: false`
  - `seoIndexable: false`
- **Raw Datasets:** All 11 raw source JSON files (`<city>,germany.json`) remain byte-preserved without mutation.

---

## 2. Per-City Audit Summary Table

The 11 candidate cities were audited through the 9-stage pipeline in dry-run mode with extended candidate city resolution enabled:

| # | Candidate City | Source File | Raw Records | Norm Records | Pipeline Eligible (Pub) | Review / Hold | Rejected | Phone Cov (%) | Web Cov (%) | Cross-City Anomalies | Prod Overlaps | Co-Located Pins (<30m) |
|:---:|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **Lübeck** | `luebeck,germany.json` | 7 | 7 | **7** (100%) | 0 | 0 | 71% (5/7) | 86% (6/7) | 0 | 0 | 0 |
| 2 | **Aachen** | `aachen,germany.json` | 12 | 12 | **12** (100%) | 0 | 0 | 50% (6/12) | 58% (7/12) | 0 | 0 | 0 |
| 3 | **Saarbrücken** | `saarbruecken,germany.json` | 12 | 12 | **12** (100%) | 0 | 0 | 50% (6/12) | 25% (3/12) | 0 | 0 | 1 |
| 4 | **Freiburg im Breisgau** | `freiburg,germany.json` | 10 | 10 | **9** (90%) | 1 | 0 | 60% (6/10) | 40% (4/10) | 0 | 0 | 1 |
| 5 | **Karlsruhe** | `karlsruhe,germany.json` | 13 | 13 | **12** (92%) | 1 | 0 | 54% (7/13) | 69% (9/13) | 0 | 0 | 2 |
| 6 | **Münster** | `muenster,germany.json` | 8 | 8 | **7** (88%) | 1 | 0 | 38% (3/8) | 75% (6/8) | 0 | 0 | 0 |
| 7 | **Mainz** | `mainz,germany.json` | 16 | 16 | **14** (88%)* | 2 | 0 | 63% (10/16) | 50% (8/16) | 0 | 0 | 6 |
| 8 | **Bielefeld** | `bielefeld,germany.json` | 21 | 21 | **19** (90%) | 2 | 0 | 62% (13/21) | 57% (12/21) | 0 | 0 | 3 |
| 9 | **Augsburg** | `augsburg,germany.json` | 20 | 20 | **18** (90%) | 1 | 1 | 60% (12/20) | 55% (11/20) | 0 | 0 | 2 |
| 10 | **Regensburg** | `regensburg,germany.json` | 11 | 11 | **10** (91%) | 0 | 1 | 36% (4/11) | 55% (6/11) | 0 | 0 | 1 |
| 11 | **Kiel** | `kiel,germany.json` | 12 | 12 | **8** (67%) | 4 | 0 | 42% (5/12) | 33% (4/12) | 0 | 0 | 2 |
| **TOTAL** | **11 Cities** | — | **142** | **142** | **128** (90.1%) | **12** | **2** | **53.5%** | **53.5%** | **0** | **0** | **18** |

*\*Note on Mainz:* Pipeline dry-run marks 14 as eligible, but following project guidelines, *Türk Fedarasyonu Mainz Ülkü Ocağı* is held on editorial HOLD, leaving 13 eligible publishable facilities.

---

## 3. Resolution of Known Issues & Exception Evidence

### 3.1 Mainz: Türk Fedarasyonu Mainz Ülkü Ocağı (`ChIJD8H9MUuXvUcR7RJCG3BoK5s`)
- **Raw Title:** `"Türk Fedarasyonu Mainz Ülkü Ocağı"`
- **Address:** `Mombacher Str. 71, 55122 Mainz, Germany`
- **Google Maps Category:** `"Mosque"` | Reviews: 37
- **Evidence Assessment:**
  - The premises at Mombacher Str. 71 contain dedicated ablution and prayer facilities (mescid) co-located with *Eyüp Sultan Camii*.
  - However, the umbrella title denotes an *Ülkü Ocağı* (political/cultural association clubhouse premises).
  - Directory policy requires non-sectarian listings to maintain clear separation between independent congregational mosques and political association venues.
- **Decision:** **HOLD (Retain on HOLD)**. The facility must not be published as an independent public mosque listing without explicit editorial clearance.

### 3.2 Bielefeld: Afrikanische Islamische Kultur Verein e.V. (`ChIJffIr0Zk9ukcRguMGRgL-vzc`)
- **Raw Title:** `"Afrikanische Islamische Kultur Verein e.v"`
- **Address:** `Schildescher Str. 69, 33611 Bielefeld, Germany`
- **Google Maps Categories:** `["Corporate office", "Mosque"]` | Primary: `"Corporate office"`
- **Evidence Assessment:**
  - Phone: `+49 521 98920199` | Website: `http://www.aikv.de/de/`
  - Hours: Open 24 hours | Reviews: 9
  - User reviews explicitly document congregational Friday prayer and community iftars (*"Alhamdulillah. Eine sehr schöne Gemeinschaft... zu iftar auch immer leckeres hausgemachtes Essen"*).
  - The `"Corporate office"` category in Google Maps was an administrative misclassification; secondary category is `"Mosque"` and name includes `"Islamische"`.
- **Decision:** **ACCEPT (Retain ACCEPT recommendation)**. Validated as an active congregational mosque and community worship center.

### 3.3 Aachen: Masjid As-Sunnah (`ChIJe_pj22eZwEcRTuI3E3h_3jg`)
- **Raw Title:** `"Masjid As-Sunnah"`
- **Raw Address:** `"52070 Aachen, Germany"` (Street: `null`, raw postalCode: `null`)
- **Coordinates:** `lat: 50.7772529, lng: 6.0971805` | Phone: `+49 1520 8701517` | Reviews: 74
- **Evidence Assessment:**
  - The address string directly contains the official German postal code `52070`.
  - Postal code `52070` falls directly within Aachen's municipal boundary (`52062–52080`).
  - Active congregation verified by extensive community reviews documenting Friday prayers (*"صليت به الجمعة الماضية"*).
- **Decision:** **ACCEPT**. Postal code is authentic and resolves cleanly without boundary conflicts.

### 3.4 Münster: Palace Square Prayer Room (`ChIJd58rTou7uUcRllSptiif6u0`)
- **Raw Title:** `"Palace Square Prayer Room Mosque"`
- **Raw Address:** `"Schloss, Münster, Germany"` (Postal Code: `null`)
- **Coordinates:** `lat: 51.9646649, lng: 7.6134979` | Hours: Weekdays 7:30 AM – 3:30 PM
- **Evidence Assessment:**
  - The entity represents a student/staff campus prayer room located inside the Prince Bishop's Castle (*Fürstbischöfliches Schloss Münster*), the main administrative building of the University of Münster (Schlossplatz 2).
  - Operating hours strictly track university administration building access (closed weekends).
  - Raw record lacks an authoritative street address and postal code, failing Zod schema validation (`Must be a valid German postal code`).
  - Imputing postal code `48149` based on coordinates would violate the prohibition against manual fact fabrication.
- **Decision:** **HOLD (Retain on HOLD)**. The remaining 7 Münster mosque entities pass all pipeline gates cleanly.

### 3.5 Wiesbaden / Mainz Postal Boundary & Municipal Partition Check (`55246` & `55252`)
- **Audit Objective:** Ensure no cross-city boundary regressions exist following the Phase 10B inclusion of Mainz-Kostheim (`55246`) and Mainz-Kastel (`55252`) into Wiesbaden.
- **Results:**
  - `mainz,germany.json`: **0 records** with `55246` or `55252`. All Mainz records fall strictly in the range `55116` to `55129`.
  - `wiesbaden,germany.json`: Exactly 2 records in `55252` and `55246` (Ayasofya Cami at Schmalweg 36, 55252 and Moroccan Culture Center at Anton-Hehn-Str. 2, 55246).
  - **Cross-City Anomalies:** Exactly **0 anomalies** between Mainz and Wiesbaden.

---

## 4. Co-Location & Cluster Analysis

An automated distance audit detected 18 pairs of co-located facilities (<30m apart) across the 11 candidate datasets:

1. **Lübeck (0 pairs):** Completely clean single-occupancy facilities.
2. **Aachen (0 pairs):** Completely clean single-occupancy facilities.
3. **Münster (0 pairs):** All 8 records are distinct geographic locations.
4. **Saarbrücken (1 pair):**
   - `Jakobstraße 2, 66115 Saarbrücken` (10m): *"Pakistan Islamic Centre Saarbrucken"* and *"Masjid Al Noor"*. Require check for co-located congregation vs duplicate pin.
5. **Freiburg (1 pair):**
   - `Habsburgerstraße 56a, 79104 Freiburg` (15m): *"Freiburg-Herdern Mosque"* and *"Ibad ur Rahman Moschee"*. Co-located prayer halls in same complex.
6. **Kiel (2 pairs):**
   - `Jütlandring 143/143B, 24109 Kiel` (20m): *"Mettenhofer Moschee"* and *"Mettenhof moschee"* (suspected duplicate pin; both held in thin-record review queue).
   - `Eichkamp 1/5, 24116 Kiel` (16m): *"Abn Temeh"* and *"Islamischer Verein Kiel e.V."*.
7. **Mainz (6 pairs):**
   - Highest co-location rate in candidate pool (Haifa-Allee 34, Mombacher Str. 71, Friedrich-Koenig-Str. 17A, Bilhildisstr. 2/4). Requires deduplication review prior to any Mainz promotion.
8. **Regensburg (1 pair):**
   - `Friedenstraße 14A, 93053 Regensburg` (9m): *"Pakistanisch-Deutsches Kulturzentrum"* and *"مسجد بلال"*.
9. **Karlsruhe (2 pairs):**
   - `Greschbachstraße 3A, 76229 Karlsruhe` (0m): *"Serhendi Karlsruhe"* and *"Al-Kawthar e.V."*.
   - `Käppelestr. 3 / Gerwigstr. 69, 76131 Karlsruhe` (21m): DITIB Zentral Moschee and DITIB Association pin.
10. **Augsburg (2 pairs):**
    - `Fuchswinkel 3` (10m): Islamic Association Augsburg vs Masjid As-Salam.
    - `Augsburger Str. 11 / Pfarrer-Anton-Schwab-Weg` (11m): Ikiza e.V. vs Augsburg Masjid.
11. **Bielefeld (3 pairs):**
    - `Windelsbleicher Str. 100`: IGMG vs Hicret-Moschee.
    - `Ernst-Rein-Straße 32`: Bielefeld Merkez Cami vs Muslim Gemeinde e.V.
    - `Schillerstraße 91`: Mizgefta Şêyh Saîd Moschee vs "Camii" (thin record on HOLD).

---

## 5. Candidate City Evidence-Based Readiness Ranking

Cities are ranked strictly by publication safety, data completeness, zero boundary anomalies, absence of unresolved blockers, and low co-location risk:

### Tier 1 — Immediate Publication Readiness (Zero Unresolved Blockers, 100% Gate Pass)

#### Rank 1: **Lübeck** (Safest Next City)
- **Eligible Mosques:** **7 / 7 (100% pass rate)**
- **Blockers & Holds:** **0 HOLD, 0 REJECT, 0 anomalies, 0 co-located pairs**
- **Data Richness:** **71% phone coverage** (5/7) and **86% website coverage** (6/7) — highest of any remaining candidate.
- **Boundary & Geo:** Coordinates and postal codes (`23552–23570`) are 100% verified.
- **Verdict:** **EXCELLENT / READY FOR PROMOTION**

#### Rank 2: **Aachen**
- **Eligible Mosques:** **12 / 12 (100% pass rate)**
- **Blockers & Holds:** **0 HOLD, 0 REJECT, 0 anomalies, 0 co-located pairs**
- **Data Richness:** 50% phone coverage, 58% website coverage.
- **Boundary & Geo:** `Masjid As-Sunnah` verified at `52070 Aachen`; zero boundary anomalies.
- **Verdict:** **EXCELLENT / READY FOR PROMOTION**

#### Rank 3: **Saarbrücken**
- **Eligible Mosques:** **12 / 12 (100% pass rate)**
- **Blockers & Holds:** 0 pipeline HOLD, 0 REJECT, 0 anomalies.
- **Minor Review Item:** 1 co-located address at Jakobstraße 2 (*Pakistan Islamic Centre* vs *Masjid Al Noor*).
- **Data Richness:** 50% phone coverage, 25% website coverage.
- **Verdict:** **HIGH READINESS**

---

### Tier 2 — Near-Ready / Minor Review Queues (1 Minor Filter / HOLD)

#### Rank 4: **Freiburg im Breisgau**
- **Eligible Mosques:** **9 / 10 (90%)**
- **Review Items:** 1 thin record held in review (*"Villingen"* at Bötzinger Str. 31); 1 co-located pair on Habsburgerstraße.
- **Data Richness:** 60% phone, 40% website.
- **Verdict:** **NEAR READY**

#### Rank 5: **Karlsruhe**
- **Eligible Mosques:** **12 / 13 (92%)**
- **Review Items:** 1 record held in review (*Deutschsprachiger Muslimkreis Karlsruhe e.V.* — unclear classification); 2 co-located pairs.
- **Data Richness:** 54% phone, 69% website.
- **Verdict:** **NEAR READY**

#### Rank 6: **Münster**
- **Eligible Mosques:** **7 / 8 (88%)**
- **Review Items:** 1 record held on HOLD (*Palace Square Prayer Room* — campus prayer room lacking postal code); 0 co-located pairs.
- **Data Richness:** 38% phone, 75% website.
- **Verdict:** **NEAR READY (Clean 7-record launch once Palace Square excluded on HOLD)**

#### Rank 7: **Mainz**
- **Eligible Mosques:** **13 / 16 (81%)**
- **Review Items:** 1 editorial HOLD (*Türk Fedarasyonu Mainz Ülkü Ocağı*); 2 pipeline REVIEW records (*Moschee*, *türkische masged*); 6 co-located pin pairs requiring deduplication.
- **Data Richness:** 63% phone, 50% website.
- **Verdict:** **MODERATE READINESS (Deduplication pass required)**

#### Rank 8: **Bielefeld**
- **Eligible Mosques:** **19 / 21 (90%)**
- **Review Items:** 1 community center in review, 1 thin record (*Camii*); 3 co-located pairs. *Afrikanische Islamische Kultur Verein* confirmed ACCEPT.
- **Data Richness:** 62% phone, 57% website.
- **Verdict:** **MODERATE READINESS**

#### Rank 9: **Augsburg**
- **Eligible Mosques:** **18 / 20 (90%)**
- **Review Items:** 1 REJECTED (Albanian cultural club), 1 REVIEWED (community center); 2 co-located pairs.
- **Data Richness:** 60% phone, 55% website.
- **Verdict:** **MODERATE READINESS**

---

### Tier 3 — Secondary Batch (High Contact Gaps / Multiple Review Records)

#### Rank 10: **Regensburg**
- **Eligible Mosques:** **10 / 11 (91%)**
- **Review Items:** 1 REJECTED (association/org without mosque indicator); highest missing phone rate (only 36% phone coverage).
- **Verdict:** **SECONDARY BATCH**

#### Rank 11: **Kiel**
- **Eligible Mosques:** **8 / 12 (67%)**
- **Review Items:** 4 records held in review (33% of dataset flagged as thin records); 2 co-located duplicate pins; low contact coverage (42% phone, 33% website).
- **Verdict:** **SECONDARY BATCH**

---

## 6. Recommended Next City & Next Action

### Primary Recommendation: **Lübeck (Phase 11B Candidate)**
**Lübeck** is the safest, highest-integrity candidate for the next controlled promotion:
1. **100% Gate Pass:** All 7 facilities pass classification, geocoding, and quality gates with zero defects.
2. **Zero Blockers:** 0 HOLD records, 0 REJECTED records, 0 cross-city anomalies, and 0 co-located duplicate pairs.
3. **High Contact Completeness:** 71% phone number coverage and 86% website coverage.
4. **Isolated Geography:** Independent urban municipality in Schleswig-Holstein with zero border overlap risks.
5. **Controlled Scope:** At 7 records, it allows precise end-to-end verification and testing with minimal regression exposure.

### Exact Next Action (When Authorized)
- Execute **Phase 11B — Lübeck Promotion**:
  1. Add `'luebeck'` to `src/data/city-registry-overrides.json` with `status: "PUBLISHED"`, `publicationEnabled: true`, `seoIndexable: true`.
  2. Append the 7 verified Lübeck records from `luebeck,germany.json` into `src/data/mosques.json` (increasing count from 559 → 566).
  3. Append the 7 records to `src/data/all-entities.json` (612 → 619).
  4. Add `'Lübeck': 'لوبيك'` to `ARABIC_CITY_NAMES` in `src/app/[locale]/mosques/[city]/page.tsx`.
  5. Update test suite baselines to 566 records, 16 cities, 1,750 sitemap URLs.
  6. Run full verification suite (`npm test`, `next lint`, `next build`, sitemap audit).

---

## 7. Verification Results & Invariant Confirmation

All quality verification scripts were executed against the working tree:

- **Vitest Test Suite (`npm test`):** **16 passed (16 test files, 298 tests passing, 0 failing)**
- **ESLint & Static Typing (`npm run lint`):** **0 errors, 0 warnings**
- **Production Data Audit (`npm run data:audit`):**
  - Audited 559 published mosques across 15 cities.
  - Zero critical data integrity violations.
- **Duplicate & Boundary Audit (`npm run data:duplicates`):**
  - Zero exact duplicate IDs.
  - Zero new production collisions.
- **Sitemap & Registry Verification (`scripts/phase10c-local-validation.ts`):**
  - Production Mosques: Exactly 559
  - Published Cities: Exactly 15
  - Sitemap URLs: Exactly 1,728
  - Candidate Cities: All 11 remain unpublished and non-indexable (`publicationEnabled: false`)
  - Excluded Records: Moschee Schierstein remains absent from public output.

---

> [!IMPORTANT]
> **STOP POINT REACHED:** In compliance with Phase 11A instructions, no candidate cities were published or promoted. The 559-record production baseline, 15 published cities, sitemap output, and working tree remain preserved. Awaiting user direction before proceeding.
