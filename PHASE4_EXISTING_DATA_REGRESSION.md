# PHASE 4 EXISTING DATA REGRESSION REPORT

**Project:** MoscheeAtlas.de  
**Domain:** https://moscheeatlas.de  
**Date:** 2026-09-30  
**Phase:** Phase 4 Pipeline Validation  
**Regression Status:** PASS (100% Data Preservation Verified)  

---

## 1. Executive Summary

A critical mandate of Phase 4 is: **Existing published data must be protected.** The new 9-stage pipeline and 5-level deduplication engine must ingest the existing raw records without corrupting, deleting, mutating, or altering any published entity.

This regression report documents the execution of the Phase 4 pipeline against the full historical production dataset (486 raw records across 9 German metropolitan cities).

---

## 2. Before vs. After Quantitative Comparison

| Metric | Phase 3B Baseline | Phase 4 Pipeline Dry-Run | Delta | Status |
|---|---|---|---|---|
| **Total Raw Ingested** | 486 | 486 | 0 | EXACT MATCH |
| **Total Normalized Entities** | 486 | 486 | 0 | EXACT MATCH |
| **PUBLISHED Mosques** | **443** | **443** | **0** | EXACT MATCH |
| **REVIEWED Queue** | **39** | **39** | **0** | EXACT MATCH |
| **REJECTED Entities** | **4** | **4** | **0** | EXACT MATCH |
| **Active Cities** | 9 | 9 | 0 | EXACT MATCH |
| **Cross-City Anomalies** | 1 | 1 | 0 | EXACT MATCH |
| **Duplicate Candidates** | 77 | 77 | 0 | EXACT MATCH |

---

## 3. Per-City Published Mosque Count Verification

| City | State | Baseline Count | Phase 4 Pipeline Count | Discrepancy |
|---|---|---|---|---|
| **Berlin** | Berlin | 104 | 104 | 0 |
| **Hamburg** | Hamburg | 65 | 65 | 0 |
| **München** | Bayern | 54 | 54 | 0 |
| **Dortmund** | Nordrhein-Westfalen | 50 | 50 | 0 |
| **Frankfurt** | Hessen | 50 | 50 | 0 |
| **Köln** | Nordrhein-Westfalen | 39 | 39 | 0 |
| **Stuttgart** | Baden-Württemberg | 27 | 27 | 0 |
| **Düsseldorf** | Nordrhein-Westfalen | 27 | 27 | 0 |
| **Essen** | Nordrhein-Westfalen | 27 | 27 | 0 |
| **Total** | | **443** | **443** | **0** |

---

## 4. Preservation Criteria Verification

### 4.1 No Accidental Record Deletion
- All 443 previously published mosques are present in the pipeline output.
- All 486 normalized records are accounted for across Published (443), Reviewed (39), and Rejected (4).

### 4.2 No Accidental City Changes
- Every entity retains its exact canonical German city (`Berlin`, `Hamburg`, `München`, `Frankfurt`, `Dortmund`, `Köln`, `Stuttgart`, `Düsseldorf`, `Essen`).
- Zero records were reassigned to a different city.

### 4.3 No Accidental Slug Changes
- Slugs remain 100% stable.
- `@@unique([city, slug])` constraints are satisfied across all 443 records.
- Zero URL routes or hreflang alternate URLs are altered.

### 4.4 No Accidental Verification Upgrades
- `UNVERIFIED`: 443 records (100.0%).
- `COMMUNITY_VERIFIED`: 0 records.
- `OFFICIALLY_VERIFIED`: 0 records.
- Trust semantics preserved: no source presence has triggered an automated badge upgrade.

### 4.5 No Accidental Classification Changes
- All 424 `MOSQUE` categories and 19 `ISLAMIC_CENTER` categories among published records remain unchanged.
- Pure cultural associations and non-prayer clubs remain in `REJECTED` or `REVIEWED`.

### 4.6 No Accidental Publication of Review Records
- All 39 reviewed records (thin data, generic names, administrative headquarters) remain held in the `REVIEWED` queue.
- Gate 6 and Gate 7 ensure no staging record leaks into the published dataset.

### 4.7 Co-Location Rule Preservation
- In Stuttgart, `Pakistan Welfare Society Stuttgart e.V.` and `Madina Pakistani Masjid` share an address and telephone number. The pipeline correctly identifies them as distinct co-located organizations and does NOT merge them.
- In München, `Masjid on 5th floor Oberpollinger` and `Oberpollinger Mescid` remain distinct co-located listings.
- In Dortmund, co-located Islamic associations and prayer halls remain preserved.

---

## 5. Conclusion

The Phase 4 data quality pipeline achieves **100% backward compatibility and data preservation** on the existing production dataset. The pipeline is safe to proceed to controlled pilot testing.
