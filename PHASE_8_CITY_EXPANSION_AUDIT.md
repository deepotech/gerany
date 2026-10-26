# MoscheeAtlas — Phase 8 City Expansion Audit
## Evidence-Based City Expansion & Production Quality Assessment

**Production Domain:** `https://moscheeindernaehe.de`  
**Evaluation Date:** 2026-10-25T10:28:30Z  
**Phase:** 8A (Audit and Evidence-Based Assessment Only — Zero Promotions Applied)  
**Status:** COMPLETE — READY FOR OPERATOR REVIEW

---

## 1. Executive Summary

Phase 8A conducts a rigorous, evidence-based audit of candidate cities for the MoscheeAtlas directory under strict adherence to established architectural standards:
1. **Accuracy > Record Count**: No city is promoted without satisfying all quality gates.
2. **Preserve Established Pipeline**: `RAW → NORMALIZE → DEDUPLICATE → CLASSIFY → QUALITY CHECK → REVIEW → CITY GATES → READY_FOR_LAUNCH → Explicit Promotion → PUBLISHED`.
3. **No Synthetic Data**: Unknown facility attributes remain `null`; no prayer times, ratings, or reviewer identities are fabricated.
4. **Verification Semantics**: 100% of published records retain `UNVERIFIED` status unless supported by documented audit proof.
5. **SEO & Indexing Integrity**: Exclusively eligible, published cities appear in `sitemap.xml` and navigational links. Unpublished cities return 404/noindex.
6. **No Action Without Approval**: This audit evaluates evidence only. No cities have been published, no gates have been weakened, and no production data has been modified.

---

## 2. Current Factual Baseline

### 2.1 Repository & Git Status
- **Branch:** `main` (up to date with `origin/main`).
- **Code Changes:** Zero code changes or configurations altered during this audit.
- **Production Host:** `https://moscheeindernaehe.de` (configured as canonical origin in `src/lib/config.ts`).

### 2.2 Published Cities & Record Breakdown
A total of **542 mosques** across **14 cities** are currently published in `src/data/mosques.json` (from a total pool of **594 entities** in `src/data/all-entities.json`):

| City | State | Published Records | Pool Entities | Lifecycle Status | SEO Indexable | Route Slug (DE/AR) | Route Slug (EN) |
|---|---|---|---|---|---|---|---|
| **Berlin** | Berlin | 104 | 110 | `PUBLISHED` | Yes | `berlin` | `berlin` |
| **Hamburg** | Hamburg | 65 | 70 | `PUBLISHED` | Yes | `hamburg` | `hamburg` |
| **München** | Bayern | 54 | 57 | `PUBLISHED` | Yes | `muenchen` | `munich` |
| **Dortmund** | Nordrhein-Westfalen | 50 | 51 | `PUBLISHED` | Yes | `dortmund` | `dortmund` |
| **Frankfurt** | Hessen | 50 | 57 | `PUBLISHED` | Yes | `frankfurt` | `frankfurt` |
| **Köln** | Nordrhein-Westfalen | 39 | 50 | `PUBLISHED` | Yes | `koeln` | `cologne` |
| **Bremen** | Bremen | 37 | 40 | `PUBLISHED` | Yes | `bremen` | `bremen` |
| **Düsseldorf** | Nordrhein-Westfalen | 27 | 30 | `PUBLISHED` | Yes | `duesseldorf` | `duesseldorf` |
| **Stuttgart** | Baden-Württemberg | 27 | 32 | `PUBLISHED` | Yes | `stuttgart` | `stuttgart` |
| **Essen** | Nordrhein-Westfalen | 27 | 29 | `PUBLISHED` | Yes | `essen` | `essen` |
| **Wuppertal** | Nordrhein-Westfalen | 24 | 28 | `PUBLISHED` | Yes | `wuppertal` | `wuppertal` |
| **Nürnberg** | Bayern | 18 | 19 | `PUBLISHED` | Yes | `nuernberg` | `nuremberg` |
| **Bonn** | Nordrhein-Westfalen | 14 | 15 | `PUBLISHED` | Yes | `bonn` | `bonn` |
| **Leipzig** | Sachsen | 6 | 6 | `PUBLISHED` | Yes | `leipzig` | `leipzig` |
| **Total** | | **542** | **594** | | | | |

### 2.3 Existing Raw Datasets Inspected
The repository contains 5 raw JSON datasets in the root directory for non-published candidate cities (total 128 raw records):
- `Hannover, Germany.json`: 28 raw records
- `Duisburg, Germany.json`: 61 raw records
- `Bochum, Germany.json`: 13 raw records
- `Mannheim, Germany.json`: 23 raw records
- `Dresden, Germany.json`: 3 raw records

### 2.4 Duplicate-Detection & Quality Gate Architecture
The quality pipeline implements multi-layered safeguards (`src/pipeline/`):
- **Deduplication (`deduplicate.ts`)**:
  - PlaceId exact match: merges records with identical Google Place IDs.
  - Co-Location Rule: distinguishes distinct communities sharing the same civic address/building from duplicate data.
  - Fuzzy proximity detection: flags records with similar names within tight geographical radii for human review.
- **City Launch Gates (`city-gates.ts`)**:
  - `GATE_A`: Canonical name, slug, valid German state in registry.
  - `GATE_B`: Coordinates bounded inside Germany (Lat 47.0–55.5, Lng 5.5–15.5); requires > 80% valid coords.
  - `GATE_C`: Contact completeness (soft warning if > 50% missing phone or > 70% missing website; hard blocker if 0 addresses).
  - `GATE_D`: Religious classification (hard blocker if `category === 'OTHER'`; warning if > 10% non-mosque categories).
  - `GATE_E`: Zero placeId duplicates among publishable records.
  - `GATE_F`: Minimum publishable record threshold (`CITY_MIN_PUBLISHED_RECORDS = 5`).
  - `GATE_G`: Address completeness >= 50% and at least 1 contact signal.
  - `GATE_H`: URL-safe slug and valid German canonical name.
  - `GATE_I`: Complete localized routing slugs (DE, EN, AR).
  - `GATE_J`: Search aliases configured.

### 2.5 Sitemap, SEO & Multilingual State
- **Sitemap (`src/app/sitemap.ts`)**: Generates 1,674 canonical URLs:
  - 3 localized Homepages (`/de`, `/en`, `/ar`)
  - 3 localized Search Hubs (`/de/moscheen`, `/en/mosques`, `/ar/mosques`)
  - 42 City Collection Pages (14 published cities × 3 locales)
  - 1,626 Mosque Detail Pages (542 mosques × 3 locales)
- **Unpublished Cities**: Excluded from `sitemap.xml`, return 404 / `noindex` headers.
- **Canonical Domain**: Fixed to `https://moscheeindernaehe.de`.
- **Localization**: English (`en`), German (`de`), and Arabic (`ar` with RTL layout support) fully maintained.
- **Internal Linking**: Nearby mosques algorithm uses Haversine distance with geographic bounds checks.

---

## 3. Reassessment of Previously Blocked Cities

All 5 previously blocked cities were re-evaluated through the active pipeline runner (`runPipeline(..., { includeExtendedCities: true })`) and city launch gate validator (`validateCityForLaunch`):

### 3.1 Hannover (`Hannover, Germany.json`)
- **Raw Records:** 28
- **Unique Records After Deduplication:** 28
- **Publishable Entities:** 24 (4 records held in `REVIEWED` status due to generic titles or incomplete metadata)
- **Completeness Metrics:**
  - Coordinates: 28/28 (100.0% valid within Germany)
  - Civic Address: 28/28 (100.0%)
  - Phone: 13/28 (46.4%) → **Missing Phone: 53.6%**
  - Website: 12/28 (42.9%)
- **Categories:** MOSQUE (25), ISLAMIC_CENTER (2), COMMUNITY_CENTER (1), OTHER (0)
- **Gate Evaluation:**
  - Status: `NOT_READY`
  - Blockers: **None (0)**
  - Warnings: `[GATE_C] > 50% missing phone` (53.6% missing vs 50.0% threshold)
- **Root Cause & Workload:** Hannover is blocked solely by a soft completeness warning. Only **2 additional verified phone numbers** (reaching 15/28 = 53.6% phone coverage) are required to clear `GATE_C`, or an operator manual review decision to waive the warning.
- **Decision:** **RECOMMENDED FOR FIRST BATCH** (contingent upon targeted phone enrichment or operator waiver).

### 3.2 Duisburg (`Duisburg, Germany.json`)
- **Raw Records:** 61
- **Unique Records After Deduplication:** 61
- **Publishable Entities:** 58 (3 records held in `REVIEWED` status)
- **Completeness Metrics:**
  - Coordinates: 61/61 (100.0% valid within Germany)
  - Civic Address: 61/61 (100.0%)
  - Phone: 30/61 (49.2%) → **Missing Phone: 50.8%**
  - Website: 31/61 (50.8%)
- **Categories:** MOSQUE (58), COMMUNITY_CENTER (1), ISLAMIC_CENTER (2), OTHER (0)
- **Gate Evaluation:**
  - Status: `NOT_READY`
  - Blockers: **None (0)**
  - Warnings: `[GATE_C] > 50% missing phone` (50.8% missing vs 50.0% threshold)
- **Root Cause & Workload:** Duisburg is a major Islamic hub in Germany with 58 clean publishable records. It missed the threshold by merely **0.8%**! Enriching **1 single phone number** (reaching 31/61 = 50.8% phone coverage) will immediately graduate Duisburg to `READY_FOR_LAUNCH`.
- **Decision:** **TOP CANDIDATE FOR FIRST BATCH** (highest impact, minimal review workload of 1 phone enrichment).

### 3.3 Bochum (`Bochum, Germany.json`)
- **Raw Records:** 13
- **Unique Records After Deduplication:** 13
- **Publishable Entities:** 10 (3 records held in `REVIEWED` status)
- **Completeness Metrics:**
  - Coordinates: 13/13 (100.0%)
  - Civic Address: 13/13 (100.0%)
  - Phone: 8/13 (61.5%)
  - Website: 4/13 (30.8%)
- **Categories:** MOSQUE (10), ISLAMIC_CENTER (2), OTHER (1: *"Darul Arqam - Quran-Haus Bochum"*)
- **Gate Evaluation:**
  - Status: `BLOCKED` (Hard Blocker)
  - Blockers: `[GATE_D] Found 1 non-Islamic entity (OTHER category) in publishable records`
  - Warnings: `[GATE_D] > 10% are non-mosque categories (15%)`
- **Root Cause & Workload:**
  - Entity *"Darul Arqam - Quran-Haus Bochum"* has `category: 'OTHER'` and `dataStatus: 'REVIEWED'`. Because `validateCityForLaunch` inspects all non-rejected records in the city pool, an entity categorized as `OTHER` triggers an immediate hard blocker under `GATE_D`.
  - In reality, "Darul Arqam" is an Islamic Quran learning and cultural institution, but it lacked an automated Islamic classification rule.
  - **Workload:** Requires either:
    1. Reclassifying "Darul Arqam" as `ISLAMIC_CENTER` or `COMMUNITY_CENTER` via documented review rule; or
    2. Explicitly setting its status to `REJECTED` if determined not to be an open prayer facility.
- **Decision:** **HELD IN REVIEW** (secondary batch pending category resolution).

### 3.4 Mannheim (`Mannheim, Germany.json`)
- **Raw Records:** 23
- **Unique Records After Deduplication:** 23
- **Publishable Entities:** 21 (2 records held in `REVIEWED` status)
- **Completeness Metrics:**
  - Coordinates: 23/23 (100.0%)
  - Civic Address: 23/23 (100.0%)
  - Phone: 9/23 (39.1%) → **Missing Phone: 60.9%**
  - Website: 12/23 (52.2%)
- **Categories:** MOSQUE (21), ISLAMIC_CENTER (2), OTHER (0)
- **Gate Evaluation:**
  - Status: `NOT_READY`
  - Blockers: **None (0)**
  - Warnings: `[GATE_C] > 50% missing phone` (60.9% missing vs 50.0% threshold)
- **Root Cause & Workload:** Phone coverage is 39.1%. Needs **3 phone additions** (reaching 12/23 = 52.2%) to clear `GATE_C`.
- **Decision:** **HELD IN REVIEW** (secondary batch pending phone enrichment).

### 3.5 Dresden (`Dresden, Germany.json`)
- **Raw Records:** 3
- **Unique Records After Deduplication:** 3
- **Publishable Entities:** 3 (MOSQUE: 2, ISLAMIC_CENTER: 1)
- **Completeness Metrics:**
  - Coordinates: 3/3 (100.0%)
  - Civic Address: 3/3 (100.0%)
  - Phone: 3/3 (100.0%)
  - Website: 2/3 (66.7%)
- **Gate Evaluation:**
  - Status: `BLOCKED` (Hard Blocker)
  - Blockers: `[GATE_F] 3 publishable records (minimum required: 5)`
  - Warnings: **None (0)**
- **Root Cause & Workload:** Dresden fails the fundamental programmatic SEO quality gate `GATE_F`: it possesses only 3 records, whereas the platform standard enforces a minimum of 5 records to prevent thin landing pages.
- **Decision:** **BLOCKED** (cannot be launched without sourcing at least 2 additional verified mosque records).

---

## 4. Evaluation of Proposed Research Candidates

Five new candidate cities were submitted for research: **Aachen, Karlsruhe, Münster, Augsburg, Bielefeld**.

### 4.1 Factual Audit in Repository
A thorough codebase and filesystem inspection yielded the following factual findings:
- **Raw Datasets:** None. No raw JSON files exist for any of these five cities (`0` records available).
- **City Registry (`src/pipeline/city-registry.ts`):** `0` entries exist in `DEFAULT_REGISTRY` or `CANDIDATE_CITIES_5B`.
- **City Configuration (`src/pipeline/city-config.ts`):** `0` entries exist in `CITY_CONFIGS` or `EXTENDED_CITY_CONFIGS` (no postal code ranges, no aliases).
- **Gate Status:** If evaluated today, all 5 cities fail `GATE_A` (missing from registry), `GATE_F` (0 records < 5), `GATE_G` (no addresses), `GATE_H` (missing slug/canonical), and `GATE_I` (missing localized routes).

### 4.2 City Evidence & Potential Analysis (Non-Fabricated)

| Candidate City | Federal State | Population Rank (DE) | Local Islamic Context | Source Data in Repo | Gate Status | Verdict |
|---|---|---|---|---|---|---|
| **Aachen** | Nordrhein-Westfalen | ~250,000 | Historic student/academic Islamic community (Bilal-Moschee / IZA Aachen, DITIB, Yunus Emre) | None (0) | `BLOCKED` (GATE_A, F) | **Needs Data Collection** |
| **Karlsruhe** | Baden-Württemberg | ~310,000 | Major regional center; multiple DITIB and independent prayer facilities | None (0) | `BLOCKED` (GATE_A, F) | **Needs Data Collection** |
| **Münster** | Nordrhein-Westfalen | ~320,000 | Regional hub; several established community centers (DITIB, Bait-ul-Momin) | None (0) | `BLOCKED` (GATE_A, F) | **Needs Data Collection** |
| **Augsburg** | Bayern | ~300,000 | Third-largest city in Bavaria; significant Turkish, Bosnian, and Arab communities | None (0) | `BLOCKED` (GATE_A, F) | **Needs Data Collection** |
| **Bielefeld** | Nordrhein-Westfalen | ~340,000 | Ostwestfalen-Lippe hub; substantial community network | None (0) | `BLOCKED` (GATE_A, F) | **Needs Data Collection** |

*Note: In accordance with Phase 8A rules, no fabricated search volumes, estimated mosque counts, or fictitious quality scores have been assigned.*

---

## 5. Summary Matrix & Gate Status

| City | Raw Records | Unique Records | Publishable Records | Gate Status | Blocker Reasons | Warning Reasons | Recommended Action |
|---|---|---|---|---|---|---|---|
| **Duisburg** | 61 | 61 | 58 | `NOT_READY` | None | `GATE_C` (>50% missing phone: 50.8%) | **Batch 1 Candidate** (enrich 1 phone or waive warning) |
| **Hannover** | 28 | 28 | 24 | `NOT_READY` | None | `GATE_C` (>50% missing phone: 53.6%) | **Batch 1 Candidate** (enrich 2 phones or waive warning) |
| **Mannheim** | 23 | 23 | 21 | `NOT_READY` | None | `GATE_C` (>50% missing phone: 60.9%) | **Batch 2 Candidate** (enrich 3 phones) |
| **Bochum** | 13 | 13 | 10 | `BLOCKED` | `GATE_D` (1 non-Islamic entity "OTHER") | `GATE_D` (>10% non-mosque: 15%) | **Batch 2 Candidate** (resolve "Darul Arqam" classification) |
| **Dresden** | 3 | 3 | 3 | `BLOCKED` | `GATE_F` (3 records < 5 minimum) | None | **Blocked** (requires raw dataset expansion to >= 5) |
| **Aachen** | 0 | 0 | 0 | `BLOCKED` | `GATE_A`, `GATE_F`, `GATE_G`, `GATE_H` | N/A | **Unapproved** (data collection required) |
| **Karlsruhe** | 0 | 0 | 0 | `BLOCKED` | `GATE_A`, `GATE_F`, `GATE_G`, `GATE_H` | N/A | **Unapproved** (data collection required) |
| **Münster** | 0 | 0 | 0 | `BLOCKED` | `GATE_A`, `GATE_F`, `GATE_G`, `GATE_H` | N/A | **Unapproved** (data collection required) |
| **Augsburg** | 0 | 0 | 0 | `BLOCKED` | `GATE_A`, `GATE_F`, `GATE_G`, `GATE_H` | N/A | **Unapproved** (data collection required) |
| **Bielefeld** | 0 | 0 | 0 | `BLOCKED` | `GATE_A`, `GATE_F`, `GATE_G`, `GATE_H` | N/A | **Unapproved** (data collection required) |

---

## 6. Recommended First Expansion Batch & Strategy

### 6.1 Recommended Proposed Batch: Duisburg & Hannover
To maintain absolute compliance with production safety rules while making measurable, high-value progress:
1. **Primary Target: Duisburg (58 mosques)**
   - High local Muslim community presence.
   - 100% valid coordinates and civic addresses.
   - Zero hard blockers.
   - Workload: Add 1 documented public phone number to bring phone coverage to 50.8% and transition `NOT_READY → READY_FOR_LAUNCH`.
2. **Secondary Target: Hannover (24 mosques)**
   - State capital of Niedersachsen.
   - 100% valid coordinates and civic addresses.
   - Zero hard blockers.
   - Workload: Add 2 documented public phone numbers to reach 53.6% phone coverage and transition `NOT_READY → READY_FOR_LAUNCH`.

### 6.2 Secondary Batch (Post-Batch 1): Bochum & Mannheim
- **Bochum (10 mosques):** Classify or reject *"Darul Arqam - Quran-Haus Bochum"* to clear `GATE_D`.
- **Mannheim (21 mosques):** Source 3 telephone numbers to satisfy `GATE_C`.

### 6.3 Required Data Collection: Research Candidates
For **Aachen, Karlsruhe, Münster, Augsburg, Bielefeld**, the immediate next step is data collection:
1. Acquire raw, authentic Google Maps / OpenStreetMap candidate exports (`<City>, Germany.json`).
2. Register canonical metadata and postal ranges in `src/pipeline/city-config.ts` and `src/pipeline/city-registry.ts`.
3. Ingest raw records through `runPipeline(..., { dryRun: true, includeExtendedCities: true })`.
4. Review duplicate detection and cross-city anomalies.

---

## 7. Verification & Quality Gates Executed

All existing verification tools, linters, compilers, and test suites were executed without modification to verify the healthy state of the repository:

1. **Test Suite (`npm test` / Vitest):**
   - **Result:** PASSED
   - **Metrics:** 16 test files passed, 298 tests passed, 0 failures.
2. **Type Check (`npx tsc --noEmit`):**
   - **Result:** PASSED (0 errors).
3. **Linter (`npm run lint` / Next.js ESLint):**
   - **Result:** PASSED (0 warnings, 0 errors).
4. **Data Quality Audit (`npm run data:audit`):**
   - **Result:** PASSED
   - **Metrics:** 542 published records audited. Coordinates validity: 100.0%. Schema validation: 100.0%. Unverified semantics: 100.0%. Zero critical violations.
5. **Duplicate Audit (`npm run data:duplicates`):**
   - **Result:** PASSED
   - **Metrics:** 542 published records scanned. 0 exact duplicates. Co-located organizations correctly distinguished.
6. **Sitemap Audit (`npx tsx scripts/audit-sitemap.ts`):**
   - **Result:** PASSED
   - **Metrics:** 1,674 canonical URLs. 0 duplicate URLs, 0 admin URLs, 0 non-HTTPS URLs.
7. **Production Build (`npm run build`):**
   - **Result:** PASSED (Compiled cleanly; 1,690 static pages generated).

---

## 8. Changes Made

- **Code Modifications:** None (`0`).
- **Data Modifications:** None (`0`).
- **City Promotions:** None (`0`).
- **Quality Gates Weakened:** None (`0`).
- **Artifacts Created:**
  - `PHASE_8_CITY_EXPANSION_AUDIT.md` (this report).

---

## 9. Next Steps Requiring User / Operator Approval

In accordance with Phase 8 instructions, no city promotion or data migration has been executed. The following decisions are submitted for operator approval:

1. **Approval of First Batch:** Authorize the promotion pipeline for **Duisburg** and **Hannover**, subject to phone enrichment (1 number for Duisburg, 2 for Hannover) or operator approval to waive the soft `GATE_C` warning.
2. **Review of Bochum Blocker:** Authorize reclassification of *"Darul Arqam - Quran-Haus Bochum"* under `ISLAMIC_CENTER` / `COMMUNITY_CENTER` or exclude from publication.
3. **Data Acquisition Mandate:** Approve collection of verified raw datasets for the 5 research candidates (**Aachen, Karlsruhe, Münster, Augsburg, Bielefeld**).
