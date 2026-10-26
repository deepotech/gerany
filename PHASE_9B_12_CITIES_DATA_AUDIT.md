# Phase 9B — 12-City Data Audit Report

**Generated:** 2026-10-25  
**Pipeline mode:** Dry-run only — no production data modified  
**Production baseline:** 542 mosques across 14 published cities (UNCHANGED)  
**Sitemap:** Not modified (new cities have `seoIndexable: false`, `publicationEnabled: false`)

---

## Safety Confirmations

| Check | Result |
|---|---|
| `src/data/mosques.json` record count | **542 — UNCHANGED** |
| New cities added to public `CITY_CONFIGS` | **NO** |
| New cities in sitemap | **NO** |
| New cities in `generateStaticParams()` | **NO** |
| TypeScript errors | **0** |
| Test suite | **298/298 passed** |
| Production placeId overlaps across all 12 cities | **0** |
| Inter-dataset placeId duplicates | **0** |

---

## Infrastructure Changes (Pipeline Only)

### `src/pipeline/city-config.ts` — EXTENDED_CITY_CONFIGS additions

7 new cities added to `EXTENDED_CITY_CONFIGS` (pipeline processing only, never public):

| City | Slug | Postal Range | State | Note |
|---|---|---|---|---|
| Mainz | `mainz` | 55116–55131 | Rheinland-Pfalz | ⚠️ Postal 55252 (Mainz-Kastel/Kostheim) → Wiesbaden admin boundary |
| Wiesbaden | `wiesbaden` | 65183–65207 + 55252 | Hessen | postalRanges includes 55252 Wiesbaden-administered districts |
| Kiel | `kiel` | 24103–24159 | Schleswig-Holstein | |
| Lübeck | `luebeck` | 23552–23570 | Schleswig-Holstein | |
| Saarbrücken | `saarbruecken` | 66111–66133 | Saarland | Borders France — coords monitored |
| Freiburg im Breisgau | `freiburg` | 79098–79117 | Baden-Württemberg | |
| Regensburg | `regensburg` | 93047–93059 | Bayern | |

### `src/pipeline/city-registry.ts` — CANDIDATE_CITIES_BATCH2

All 7 cities registered as `status: 'DISCOVERED'`, `publicationEnabled: false`, `seoIndexable: false`.  
The `loadRegistry(includeAllCandidates: true)` now includes `CANDIDATE_CITIES_BATCH2`.

---

## Raw File Inventory

| City | File | Size | Raw Records | JSON Valid |
|---|---|---|---|---|
| Bielefeld | `bielefeld,germany.json` | 172.2 KB | 21 | ✅ |
| Münster | `muenster,germany.json` | 82.0 KB | 8 | ✅ |
| Karlsruhe | `karlsruhe,germany.json` | 111.0 KB | 13 | ✅ |
| Augsburg | `augsburg,germany.json` | 198.4 KB | 20 | ✅ |
| Aachen | `aachen,germany.json` | 101.7 KB | 12 | ✅ |
| Mainz | `mainz,germany.json` | 119.0 KB | 16 | ✅ |
| Wiesbaden | `wiesbaden,germany.json` | 146.5 KB | 18 | ✅ |
| Kiel | `kiel,germany.json` | 57.4 KB | 12 | ✅ |
| Lübeck | `luebeck,germany.json` | 66.7 KB | 7 | ✅ |
| Saarbrücken | `saarbruecken,germany.json` | 112.7 KB | 12 | ✅ |
| Freiburg im Breisgau | `freiburg,germany.json` | 77.5 KB | 10 | ✅ |
| Regensburg | `regensburg,germany.json` | 101.4 KB | 11 | ✅ |
| **TOTAL** | | | **160** | **12/12** |

> [!IMPORTANT]
> All 12 raw files are preserved byte-for-byte. The pipeline runs in dry-run mode and does NOT overwrite source files.

---

## Pipeline Results Per City

### Bielefeld

| Metric | Value |
|---|---|
| Raw → Normalized | 21 → 21 |
| PUBLISHED (dry-run) | 19 |
| REVIEWED | 2 |
| REJECTED | 0 |
| Categories | MOSQUE: 20, COMMUNITY_CENTER: 1 |
| Missing phone | 8/21 (38%) |
| Missing website | 9/21 (43%) |
| Missing coordinates | 0 |
| Out-of-bounds coords | 0 |
| Cross-city anomalies | 0 |
| Gate PASSING / FAILING | 20 / 1 |
| Gate failures | GATE_3_CLASSIFICATION_VALID (1), GATE_6_PUBLISHABILITY_PASSED (1) |

**Notes:**  
- 1 entity classified as `COMMUNITY_CENTER` fails GATE_3 (not an accepted mosque/prayer facility category). This entity is correctly excluded from publishable count.  
- Phone coverage gap is significant (38%) — phone enrichment recommended before publication.

---

### Münster

| Metric | Value |
|---|---|
| Raw → Normalized | 8 → 8 |
| PUBLISHED (dry-run) | 7 |
| REVIEWED | 1 |
| REJECTED | 0 |
| Categories | MOSQUE: 8 |
| Missing phone | 5/8 (63%) |
| Missing website | 2/8 (25%) |
| Missing coordinates | 0 |
| Out-of-bounds coords | 0 |
| Cross-city anomalies | 0 |
| Gate PASSING / FAILING | 7 / 1 |
| Gate failures | GATE_1_SCHEMA_VALID (1), GATE_6_PUBLISHABILITY_PASSED (1) |

**Notes:**  
- 1 entity (PlaceId `ChIJd58rTou7uUcRllSptiif6u0`) has an invalid postal code failing GATE_1 schema validation (`postalCode: Invalid — must be valid German postal code`). Requires manual correction before inclusion.  
- Phone coverage very low (63% missing) — phone enrichment required before promotion.

---

### Karlsruhe

| Metric | Value |
|---|---|
| Raw → Normalized | 13 → 13 |
| PUBLISHED (dry-run) | 12 |
| REVIEWED | 1 |
| REJECTED | 0 |
| Categories | MOSQUE: 12, OTHER: 1 |
| Missing phone | 6/13 (46%) |
| Missing website | 4/13 (31%) |
| Missing coordinates | 0 |
| Out-of-bounds coords | 0 |
| Cross-city anomalies | 0 |
| Gate PASSING / FAILING | 12 / 1 |
| Gate failures | GATE_3_CLASSIFICATION_VALID (1), GATE_6_PUBLISHABILITY_PASSED (1) |

**Notes:**  
- 1 entity classified `OTHER` fails GATE_3. Correctly excluded.  
- Phone coverage gap (46%) — enrichment recommended.

---

### Augsburg

| Metric | Value |
|---|---|
| Raw → Normalized | 20 → 20 |
| PUBLISHED (dry-run) | 18 |
| REVIEWED | 1 |
| REJECTED | 1 |
| Categories | MOSQUE: 15, ISLAMIC_CENTER: 3, COMMUNITY_CENTER: 2 |
| Missing phone | 8/20 (40%) |
| Missing website | 9/20 (45%) |
| Missing coordinates | 0 |
| Out-of-bounds coords | 0 |
| Cross-city anomalies | 0 |
| Gate PASSING / FAILING | 18 / 2 |
| Gate failures | GATE_3_CLASSIFICATION_VALID (1), GATE_6_PUBLISHABILITY_PASSED (1), REJECTED_BY_CLASSIFY (1) |

**Notes:**  
- 1 entity rejected by classifier (`NON_MOSQUE_BUSINESS_PATTERNS`).  
- 1 entity with `COMMUNITY_CENTER` category fails GATE_3 — correctly excluded.  
- Both `ISLAMIC_CENTER` (3) and `MOSQUE` (15) categories pass GATE_3.  
- Phone coverage gap (40%) — enrichment recommended.

---

### Aachen

| Metric | Value |
|---|---|
| Raw → Normalized | 12 → 12 |
| PUBLISHED (dry-run) | 12 |
| REVIEWED | 0 |
| REJECTED | 0 |
| Categories | MOSQUE: 12 |
| Missing phone | 6/12 (50%) |
| Missing website | 5/12 (42%) |
| Missing coordinates | 0 |
| Out-of-bounds coords | 0 |
| Cross-city anomalies | 0 |
| Gate PASSING / FAILING | **12 / 0** ✅ |

**Notes:**  
- All 12 entities pass all quality gates.  
- No cross-city anomalies detected despite border proximity with Netherlands/Belgium — coordinate validation working correctly.  
- Phone gap (50%) — enrichment recommended before promotion.

---

### Mainz

| Metric | Value |
|---|---|
| Raw → Normalized | 16 → 16 |
| PUBLISHED (dry-run) | 14 |
| REVIEWED | 2 |
| REJECTED | 0 |
| Categories | MOSQUE: 16 |
| Missing phone | 6/16 (38%) |
| Missing website | 8/16 (50%) |
| Missing coordinates | 0 |
| Out-of-bounds coords | 0 |
| Cross-city anomalies | 0 |
| Gate PASSING / FAILING | **16 / 0** ✅ |

**Notes:**  
- All 16 entities pass all quality gates.  
- No cross-city boundary violations detected (the Mainz/Wiesbaden Rhine-border risk was correctly handled by postal-range configuration).  
- Phone gap (38%) — enrichment recommended.

---

### Wiesbaden

| Metric | Value |
|---|---|
| Raw → Normalized | 18 → 18 |
| PUBLISHED (dry-run) | 17 |
| REVIEWED | 1 |
| REJECTED | 0 |
| Categories | MOSQUE: 17, ISLAMIC_CENTER: 1 |
| Missing phone | 4/18 (22%) |
| Missing website | 7/18 (39%) |
| Missing coordinates | 0 |
| Out-of-bounds coords | 0 |
| Cross-city anomalies | **1** ⚠️ |
| Gate PASSING / FAILING | **18 / 0** ✅ |

**Cross-city anomaly detail:**

| Entity | Address | Notes |
|---|---|---|
| Moroccan Culture Center | Anton-Hehn-Straße 2, 55246 Wiesbaden-Mainz-Kostheim, Germany | Postal 55246 is outside configured Wiesbaden range (65183–65207); pipeline resolved to Wiesbaden via city-field match. Flagged for manual geographic verification. |

> [!WARNING]
> The "Moroccan Culture Center" entity has postal code 55246 (Mainz-Kostheim district, which is administratively part of Wiesbaden). The pipeline correctly resolves it to Wiesbaden via alias matching, but the cross-city flag should be reviewed before publication to confirm this is genuinely a Wiesbaden-administered location.

---

### Kiel

| Metric | Value |
|---|---|
| Raw → Normalized | 12 → 12 |
| PUBLISHED (dry-run) | 8 |
| REVIEWED | 4 |
| REJECTED | 0 |
| Categories | MOSQUE: 12 |
| Missing phone | 7/12 (58%) |
| Missing website | 8/12 (67%) |
| Missing coordinates | 0 |
| Out-of-bounds coords | 0 |
| Cross-city anomalies | 0 |
| Gate PASSING / FAILING | **12 / 0** ✅ |

**Notes:**  
- All 12 entities pass all quality gates.  
- High phone and website coverage gaps — enrichment strongly recommended before promotion.  
- 4 entities in REVIEWED status (previously manually reviewed).

---

### Lübeck

| Metric | Value |
|---|---|
| Raw → Normalized | 7 → 7 |
| PUBLISHED (dry-run) | 7 |
| REVIEWED | 0 |
| REJECTED | 0 |
| Categories | MOSQUE: 6, ISLAMIC_CENTER: 1 |
| Missing phone | 2/7 (29%) |
| Missing website | 1/7 (14%) |
| Missing coordinates | 0 |
| Out-of-bounds coords | 0 |
| Cross-city anomalies | 0 |
| Gate PASSING / FAILING | **7 / 0** ✅ |

**Notes:**  
- All 7 entities pass all quality gates.  
- Lowest raw count of all 12 cities — verify dataset completeness before promotion.

---

### Saarbrücken

| Metric | Value |
|---|---|
| Raw → Normalized | 12 → 12 |
| PUBLISHED (dry-run) | 12 |
| REVIEWED | 0 |
| REJECTED | 0 |
| Categories | MOSQUE: 11, ISLAMIC_CENTER: 1 |
| Missing phone | 6/12 (50%) |
| Missing website | 9/12 (75%) |
| Missing coordinates | 0 |
| Out-of-bounds coords | 0 |
| Cross-city anomalies | 0 |
| Gate PASSING / FAILING | **12 / 0** ✅ |

**Notes:**  
- All 12 entities pass all quality gates.  
- No cross-city anomalies despite French border proximity.  
- Website coverage very low (75% missing) — enrichment recommended.

---

### Freiburg im Breisgau

| Metric | Value |
|---|---|
| Raw → Normalized | 10 → 10 |
| PUBLISHED (dry-run) | 9 |
| REVIEWED | 1 |
| REJECTED | 0 |
| Categories | MOSQUE: 8, ISLAMIC_CENTER: 2 |
| Missing phone | 4/10 (40%) |
| Missing website | 6/10 (60%) |
| Missing coordinates | 0 |
| Out-of-bounds coords | 0 |
| Cross-city anomalies | 0 |
| Gate PASSING / FAILING | **10 / 0** ✅ |

**Notes:**  
- All 10 entities pass all quality gates.

---

### Regensburg

| Metric | Value |
|---|---|
| Raw → Normalized | 11 → 11 |
| PUBLISHED (dry-run) | 10 |
| REVIEWED | 0 |
| REJECTED | 1 |
| Categories | MOSQUE: 9, ISLAMIC_CENTER: 1, OTHER: 1 |
| Missing phone | 7/11 (64%) |
| Missing website | 5/11 (45%) |
| Missing coordinates | 0 |
| Out-of-bounds coords | 0 |
| Cross-city anomalies | 0 |
| Gate PASSING / FAILING | 10 / 1 |
| Gate failures | REJECTED_BY_CLASSIFY (1) |

**Notes:**  
- 1 entity rejected by classifier (`NON_MOSQUE_BUSINESS_PATTERNS` or `OTHER` category).  
- Phone coverage low (64% missing) — enrichment recommended.

---

## Aggregate Summary

| Metric | Value |
|---|---|
| Total raw records | **160** |
| Total normalized | **160** (0 parse failures) |
| Total PUBLISHED (dry-run) | **145** |
| Total REVIEWED | **13** |
| Total REJECTED | **2** |
| Total missing phone | 69 / 160 (43%) |
| Total missing website | 73 / 160 (46%) |
| Total missing coordinates | **0** |
| Out-of-bounds coordinates | **0** |
| Cross-city anomalies | **1** (Wiesbaden — Mainz-Kostheim border case) |
| Production placeId overlaps | **0** |
| Intra-dataset placeId duplicates | **0** |
| Inter-dataset placeId duplicates | **0** |
| Gate PASSING entities | **154** |
| Gate FAILING entities | **6** |

---

## Issues Requiring Resolution Before Promotion

### Hard blockers (must fix before promotion)

| # | City | Issue | PlaceId / Detail |
|---|---|---|---|
| 1 | Münster | Invalid postal code — fails GATE_1 schema validation | `ChIJd58rTou7uUcRllSptiif6u0` — postal code unrecognised by German postal validation |
| 2 | Bielefeld | 1 entity `COMMUNITY_CENTER` — fails GATE_3 | Will be excluded from publishable set automatically |
| 3 | Karlsruhe | 1 entity `OTHER` category — fails GATE_3 | Will be excluded automatically |
| 4 | Augsburg | 1 rejected by classifier + 1 `COMMUNITY_CENTER` fails GATE_3 | Both excluded automatically |
| 5 | Regensburg | 1 entity rejected by classifier | Excluded automatically |

> [!NOTE]
> Items 2–5 are **automatically handled** — the pipeline already rejects/excludes them. Item 1 (Münster postal code) needs a manual data fix or confirmed exclusion.

### Warnings (recommended before promotion)

| # | City | Issue |
|---|---|---|
| W1 | All 12 cities | Phone coverage gap: 43% of entities missing phone (69/160) |
| W2 | Kiel, Saarbrücken | Website coverage below 35% — low discoverability |
| W3 | Wiesbaden | 1 cross-city anomaly (Moroccan Culture Center at postal 55246) — verify Wiesbaden administrative assignment |
| W4 | Lübeck | Only 7 raw records — verify dataset completeness |
| W5 | Münster | Phone coverage 63% missing — highest gap |

---

## Effective Publishable Counts (After Exclusions)

| City | Dry-run Publishable | Notes |
|---|---|---|
| Bielefeld | **19** | 1 COMMUNITY_CENTER excluded |
| Münster | **7** | 1 invalid postal entity excluded |
| Karlsruhe | **12** | 1 OTHER excluded |
| Augsburg | **18** | 1 rejected + 1 COMMUNITY_CENTER excluded |
| Aachen | **12** | — |
| Mainz | **14** | 2 in REVIEWED status (need manual sign-off) |
| Wiesbaden | **17** | 1 REVIEWED; 1 cross-city anomaly needs verification |
| Kiel | **8** | 4 in REVIEWED status |
| Lübeck | **7** | — |
| Saarbrücken | **12** | — |
| Freiburg im Breisgau | **9** | 1 in REVIEWED status |
| Regensburg | **10** | 1 rejected by classifier |
| **TOTAL** | **145** | — |

If all 12 cities were promoted: **542 + 145 = 687 published mosques** across **26 cities**.

---

## Recommended Promotion Order

Based on clean gate results and data completeness:

| Priority | City | Publishable | Gate Issues | Phone Gap | Recommendation |
|---|---|---|---|---|---|
| 1 | **Aachen** | 12 | 0 | 50% | ✅ Ready after phone enrichment attempt |
| 2 | **Lübeck** | 7 | 0 | 29% | ✅ Ready — verify dataset completeness |
| 3 | **Saarbrücken** | 12 | 0 | 50% | ✅ Ready after phone enrichment attempt |
| 4 | **Mainz** | 14 | 0 | 38% | ✅ Ready — 2 REVIEWED need sign-off |
| 5 | **Freiburg im Breisgau** | 9 | 0 | 40% | ✅ Ready after phone enrichment attempt |
| 6 | **Wiesbaden** | 17 | 0 | 22% | ⚠️ Cross-city anomaly needs geographic verification |
| 7 | **Kiel** | 8 | 0 | 58% | ⚠️ High phone gap — enrichment first |
| 8 | **Regensburg** | 10 | Auto-excluded | 64% | ⚠️ Phone gap — enrichment first |
| 9 | **Bielefeld** | 19 | Auto-excluded | 38% | ✅ Good count — phone enrichment recommended |
| 10 | **Augsburg** | 18 | Auto-excluded | 40% | ✅ Good count — phone enrichment recommended |
| 11 | **Karlsruhe** | 12 | Auto-excluded | 46% | ✅ Ready after phone enrichment attempt |
| 12 | **Münster** | 7 | **Postal fix needed** | 63% | 🔴 Fix postal code of `ChIJd58rTou7uUcRllSptiif6u0` first |

---

## Next Steps

1. **Do not promote any city yet** — this report is the gate between REVIEW and approval.
2. **Münster postal fix**: Investigate `ChIJd58rTou7uUcRllSptiif6u0` — correct its postal code or confirm exclusion.
3. **Wiesbaden cross-city anomaly**: Confirm that "Moroccan Culture Center" at postal 55246 (Mainz-Kostheim) is administratively Wiesbaden and should appear on the Wiesbaden city page.
4. **Phone enrichment**: Attempt trustworthy phone enrichment for the 69 entities missing phone numbers, following the established evidence-based enrichment protocol (`src/data/phone-enrichments.json`).
5. **Duisburg + Hannover**: Still at `READY_FOR_LAUNCH` — awaiting user approval from Phase 8B.1 (separate from Phase 9B).
6. **Request user approval** per city when ready to promote.

---

*Report generated by `scripts/phase9b-audit.ts`. Machine-readable results: `PHASE9B_AUDIT_RESULTS.json`.*
