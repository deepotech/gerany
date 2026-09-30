# PHASE 4 BASELINE DATA REPORT

**Project:** MoscheeAtlas.de  
**Domain:** https://moscheeatlas.de  
**Date:** 2026-09-30  
**Phase:** Phase 4 Baseline  
**Data Sources:** `src/data/mosques.json`, `src/data/all-entities.json`, `src/data/data-quality-report.json`, and raw root datasets  

---

## 1. Executive Summary

This report establishes the immutable quantitative baseline for the MoscheeAtlas.de dataset prior to Phase 4 pipeline changes and expansion. All metrics are computed directly from the authoritative repository files and verified against the Vitest test suite.

---

## 2. Core Entity Counts

| Metric | Baseline Value | Notes |
|---|---|---|
| **Total Raw Ingestion Records** | **486** | Sum across all 9 raw root city files |
| **Total Normalized Entities** | **486** | Total entities stored in `all-entities.json` |
| **PUBLISHED Entities** | **443** | Authoritative live records in `mosques.json` |
| **REVIEWED Entities** | **39** | Held in staging queue (cross-city / thin data / HQ) |
| **REJECTED Entities** | **4** | Definitively excluded (non-mosque categories, clubs) |
| **Zero-Coordinate Records** | **0** | 100% of published records possess valid coordinates |
| **Duplicate Candidates (Internal)** | **77** | Deduplication flags logged in quality report |
| **Cross-Dataset Place ID Duplicates** | **0** | Cleanly separated across city datasets |
| **Cross-City Anomalies** | **1** | Record with postal code conflicting with dataset city |

---

## 3. Geographic Distribution (Published Dataset)

### 3.1 By City (9 Active Metropolitan Cities)

| Rank | City (Canonical) | State (Bundesland) | Published Mosques | Percentage |
|---|---|---|---|---|
| 1 | Berlin | Berlin | 104 | 23.48% |
| 2 | Hamburg | Hamburg | 65 | 14.67% |
| 3 | München | Bayern | 54 | 12.19% |
| 4 | Dortmund | Nordrhein-Westfalen | 50 | 11.29% |
| 5 | Frankfurt | Hessen | 50 | 11.29% |
| 6 | Köln | Nordrhein-Westfalen | 39 | 8.80% |
| 7 | Stuttgart | Baden-Württemberg | 27 | 6.09% |
| 8 | Düsseldorf | Nordrhein-Westfalen | 27 | 6.09% |
| 9 | Essen | Nordrhein-Westfalen | 27 | 6.09% |
| **Total** | | | **443** | **100.00%** |

### 3.2 By Federal State (Bundesland)

| State (Bundesland) | Published Mosques | Represented Cities |
|---|---|---|
| Nordrhein-Westfalen (NRW) | 143 | Dortmund (50), Köln (39), Düsseldorf (27), Essen (27) |
| Berlin | 104 | Berlin (104) |
| Hamburg | 65 | Hamburg (65) |
| Bayern | 54 | München (54) |
| Hessen | 50 | Frankfurt (50) |
| Baden-Württemberg | 27 | Stuttgart (27) |
| **Total (6 States)** | **443** | **9 Cities** |

*(Note: 10 German federal states currently have 0 published mosques pending expansion.)*

---

## 4. Verification Semantics Breakdown

| Status Code | Published Count | Staging / Rejected Count | Total Entities | UI Badge |
|---|---|---|---|---|
| `UNVERIFIED` | **443** | 43 (39 Reviewed + 4 Rejected) | **486** | Neutral "Erfasst" (Grey) |
| `COMMUNITY_VERIFIED` | **0** | 0 | **0** | "Gemeinde-bestätigt" (Green) |
| `OFFICIALLY_VERIFIED` | **0** | 0 | **0** | "Offiziell verifiziert" (Green) |

**Verification Integrity Rule:** 100% of published records are `UNVERIFIED`. Zero mosques claim unearned community or official verification.

---

## 5. Completeness & Quality Scorecard (443 Published)

| Field / Attribute | Present Count | Missing Count | Coverage % | Semantic Handling |
|---|---|---|---|---|
| **Canonical Name** | 443 | 0 | 100.0% | Required |
| **Valid Coordinates** | 443 | 0 | 100.0% | Bounding box: lat 47.0–55.5, lng 5.5–15.5 |
| **Standard Address** | 443 | 0 | 100.0% | Formatted German street + postal + city |
| **Postal Code** | 443 | 0 | 100.0% | Valid 5-digit German postal code |
| **Phone Number** | 258 | 185 | 58.24% | Sanitized or null |
| **Official Website** | 252 | 191 | 56.88% | Validated URL or null |
| **Opening Hours** | 221 | 222 | 49.89% | Structured weekly array or null |
| **Rating / Reviews** | 443 | 0 | 100.0% | Aggregate numerical score + count |
| **Facilities: Restroom** | 429 (true) | 14 (null) | 96.84% | Unknown ≠ False |
| **Facilities: Wheelchair**| 234 (true) | 209 (null) | 52.82% | Unknown ≠ False |
| **Facilities: Parking** | 20 (true) | 423 (null) | 4.51% | Unknown ≠ False |
| **Facilities: Women Area**| 0 (true) | 443 (null) | 0.00% | Unknown ≠ False (strictly preserved) |
| **Facilities: Wudu** | 0 (true) | 443 (null) | 0.00% | Unknown ≠ False (strictly preserved) |

---

## 6. Category Breakdown across All Ingested Entities (486 Total)

| Category | All Entities | Published | Reviewed | Rejected |
|---|---|---|---|---|
| `MOSQUE` | 451 | 424 | 27 | 0 |
| `ISLAMIC_CENTER` | 24 | 19 | 5 | 0 |
| `COMMUNITY_CENTER` | 5 | 0 | 3 | 2 |
| `RELIGIOUS_ORGANIZATION` | 3 | 0 | 3 | 0 |
| `OTHER` | 3 | 0 | 1 | 2 |
| **Total** | **486** | **443** | **39** | **4** |

---

## 7. Raw Source Distribution across Root Files

| Raw Source File | Raw Count | Normalized Entities Generated | Source Identifier Key |
|---|---|---|---|
| `Berlin, Germany.json` | 110 | 110 | `google_maps_berlin` |
| `Hamburg, Germany.json` | 70 | 70 | `google_maps_hamburg` |
| `Frankfurt, Germany.json` | 57 | 57 | `google_maps_frankfurt` |
| `München, Germany.json` | 57 | 57 | `google_maps_m_nchen` |
| `Dortmund, Germany.json` | 51 | 51 | `google_maps_dortmund` |
| `Köln, Germany.json` | 50 | 50 | `google_maps_k_ln` |
| `Stuttgart, Germany.json` | 32 | 32 | `google_maps_stuttgart` |
| `Düsseldorf, Germany.json` | 30 | 30 | `google_maps_d_sseldorf` |
| `Essen, Germany.json` | 29 | 29 | `google_maps_essen` |
| **Total** | **486** | **486** | **9 Sources** |

---

## 8. Preservation Mandate for Phase 4

During Phase 4 pipeline implementation and controlled pilot expansion:
1. **The 443 published records must not be deleted, renamed, re-slugged, re-located, or have their verification status altered.**
2. **The 39 reviewed records must remain in review unless explicit resolution evidence is provided.**
3. **The 4 rejected records must remain rejected.**
4. **All 443 records must pass unchanged through regression tests.**
