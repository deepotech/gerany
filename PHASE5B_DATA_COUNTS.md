# Phase 5B — Authoritative Production Data Counts

**Generated At:** 2026-09-30T10:56:07.002Z
**Baseline Reference:** `PHASE5B_BASELINE.json`

---

## 1. Top-Level Summary

| Metric | Pre-Import Baseline | Post-Phase 5B Production | Net Change | Status |
|---|---|---|---|---|
| **Published Records** | 443 | **542** | **+99** | Verified |
| **All Entities Pool** | 486 | **594** | **+108** | Verified |
| **Published Cities** | 9 | **14** | **+5** | Verified |
| **Unpromoted Candidate Cities** | 0 | **5** | +5 | Blocked / In Review |
| **Sitemap URLs** | 1362 | **1674** | **+312** | Canonical Indexable |
| **Verification Semantics** | 100% UNVERIFIED | **100% UNVERIFIED** | 0 upgraded | Preserved |

---

## 2. City-by-City Breakdown

| City | State | Baseline | Current Published | Change | Lifecycle Status |
|---|---|---|---|---|---|
| **Berlin** | Germany | 104 | **104** | 0 | PUBLISHED (Baseline) |
| **Bonn** | Germany | 0 | **14** | +14 | PUBLISHED (Phase 5B) |
| **Bremen** | Germany | 0 | **37** | +37 | PUBLISHED (Phase 5B) |
| **Dortmund** | Germany | 50 | **50** | 0 | PUBLISHED (Baseline) |
| **Düsseldorf** | Germany | 27 | **27** | 0 | PUBLISHED (Baseline) |
| **Essen** | Germany | 27 | **27** | 0 | PUBLISHED (Baseline) |
| **Frankfurt** | Germany | 50 | **50** | 0 | PUBLISHED (Baseline) |
| **Hamburg** | Germany | 65 | **65** | 0 | PUBLISHED (Baseline) |
| **Köln** | Germany | 39 | **39** | 0 | PUBLISHED (Baseline) |
| **Leipzig** | Germany | 0 | **6** | +6 | PUBLISHED (Phase 5B) |
| **München** | Germany | 54 | **54** | 0 | PUBLISHED (Baseline) |
| **Nürnberg** | Germany | 0 | **18** | +18 | PUBLISHED (Phase 5B) |
| **Stuttgart** | Germany | 27 | **27** | 0 | PUBLISHED (Baseline) |
| **Wuppertal** | Germany | 0 | **24** | +24 | PUBLISHED (Phase 5B) |

### Unpromoted Candidate Cities (Safely Held in Review Queue)

| Candidate City | State | Raw Records | Publishable Candidate | Production Status | Gate Reason |
|---|---|---|---|---|---|
| **Hannover** | Niedersachsen | 28 | 24 | REVIEW (0 Published) | GATE_C: > 50% missing phone numbers |
| **Duisburg** | Nordrhein-Westfalen | 61 | 58 | REVIEW (0 Published) | GATE_C: > 50% missing phone numbers |
| **Bochum** | Nordrhein-Westfalen | 13 | 10 | BLOCKED (0 Published) | GATE_D: Found non-Islamic entity in publishable records |
| **Mannheim** | Baden-Württemberg | 23 | 21 | REVIEW (0 Published) | GATE_C: > 50% missing phone numbers |
| **Dresden** | Sachsen | 3 | 3 | BLOCKED (0 Published) | GATE_F: 3 records < 5 minimum threshold |
