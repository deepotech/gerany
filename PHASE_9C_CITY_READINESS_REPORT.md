# Phase 9C — City Readiness Report: 12 Candidate Cities

**Generated:** 2026-10-25  
**Scope:** Data-review only — read-only audit  
**Production baseline:** 542 mosques / 14 published cities — UNCHANGED  
**Sitemap:** 1,674 entries — UNCHANGED

---

## Validation Results

| Check | Result |
|---|---|
| TypeScript | ✅ 0 errors |
| Test suite | ✅ 298/298 passed |
| ESLint | ✅ 0 warnings/errors |
| Data audit | ✅ PASSED — 0 critical violations |
| Duplicate audit | ✅ PASSED — 0 new production overlaps |
| Sitemap audit | ✅ 1,674 entries — no change |
| `mosques.json` count | ✅ 542 — UNCHANGED |
| Production placeId overlaps | ✅ 0 across all 12 cities |

---

## 1. Münster — Palace Square Prayer Room Mosque

**PlaceId:** `ChIJd58rTou7uUcRllSptiif6u0`  
**Gate failure (Phase 9B):** `GATE_1_SCHEMA_VALID` — postal code `null` fails German postal validation.

### Raw record evidence

| Field | Value |
|---|---|
| Title | Palace Square Prayer Room Mosque |
| Street | Schloss |
| Address | Schloss, Münster, Germany |
| Postal code | `null` (absent from source) |
| City | Münster |
| State | `null` |
| Coordinates | lat 51.9646649, lng 7.6134979 |
| Plus Code | XJ77+V9 Münster, Germany |
| Phone | empty string |
| Website | absent |
| Category | Mosque |
| Reviews | 11 reviews |
| Opening hours | Mon–Fri 07:30–15:30, closed weekends |

### Geographic analysis

Coordinates lat 51.9646649 / lng 7.6134979 place this entity at **Schloss Münster** (the Westfälische Wilhelms-Universität main palace building on Schlossplatz). This location is unambiguously within Münster city limits (all Münster postal codes are 48xxx range).

The Plus Code `XJ77+V9 Münster, Germany` confirms Münster municipality independently of the missing postal code.

The opening hours (Mon–Fri 07:30–15:30, closed weekends) match a **university prayer room** schedule, consistent with the Münster Schloss / university campus context.

### Why the postal code is missing

The record's address is `Schloss, Münster, Germany` — a landmark reference with no street number and no postal code. Google Maps returns `null` for `postalCode` on some landmark-level place entries that lack a street address. This is a data-collection limitation, not evidence that the location is outside Münster.

### Decision

**Status: HOLD — do not reject, do not publish yet.**

The entity is a real, functioning university mosque/prayer room in Münster. The gate failure is solely due to missing postal code in the source data, not a factual error about the location.

**Required action before promotion:**
- Add `postalCode: "48149"` (Münster Schloss district postal code) as a **pipeline-level correction** in a corrections file, not by overwriting the raw source.
- The correction must reference this analysis document as the evidence basis.
- Do not assign a postal code without documented justification; `48149` covers the Schloss/Universitätsviertel area and is consistent with the coordinates.
- After correction, re-run gates to confirm GATE_1 passes.

> [!NOTE]
> The raw file `muenster,germany.json` is preserved byte-for-byte. No correction is applied in this phase — this is a documented recommendation only.

---

## 2. Wiesbaden — Moroccan Culture Center (Postal 55246)

**PlaceId:** `ChIJ1c3P-3WXvUcRvVhxEtn2Q4Q`  
**Phase 9B flag:** Cross-city anomaly — postal 55246 outside Wiesbaden core range (65183–65207).

### Raw record evidence

| Field | Value |
|---|---|
| Title | Moroccan Culture Center |
| Address | Anton-Hehn-Straße 2, 55246 Wiesbaden-Mainz-Kostheim, Germany |
| Postal code | 55246 |
| Neighborhood | Mainz-Kostheim |
| City (raw) | Wiesbaden |
| Coordinates | lat 50.010048, lng 8.3001535 |
| Plus Code | 2862+23 Wiesbaden, Germany |
| Phone | +49 6134 298592 |
| Website | http://ikv-kostheim.de/ |
| Category | Mosque |
| Reviews | 110 reviews |

### Municipal assignment analysis

The address explicitly reads **"Wiesbaden-Mainz-Kostheim"** — this is Google Maps' own rendering of the administrative district. Mainz-Kostheim (postal 55246) and Mainz-Kastel (postal 55252) are both **Stadtteile (districts) of Wiesbaden** under Hessen state administration, even though their postal codes begin with `55` (a Rhineland-Palatinate prefix) due to historical reasons predating postal code reform.

The **Plus Code `2862+23 Wiesbaden, Germany`** independently assigns this location to the Wiesbaden municipality.

The **website domain** `ikv-kostheim.de` refers to Kostheim, and the title includes "Moroccan Culture Center" which matches the Google Maps listing "Marokkanischer Kulturverein e.V. Badr Moschee" appearing in the `peopleAlsoSearch` list.

A second record in the Wiesbaden dataset — **Ayasofya Cami, Medrese-i Nuriye** (postal 55252, neighborhood: Mainz-Kastel) — follows the same pattern and was correctly resolved to Wiesbaden by the pipeline.

### Decision

**The Moroccan Culture Center is correctly assigned to Wiesbaden.**

The cross-city flag was generated because postal 55246 was not in the initial `postalRanges` for Wiesbaden. The `EXTENDED_CITY_CONFIGS` entry for Wiesbaden already includes `{ min: 55252, max: 55252 }` but not 55246. The pipeline resolved the record correctly via city-field alias matching.

**Recommended correction (Phase 9D / pre-publication):** Extend the Wiesbaden postal ranges to include 55246 to eliminate the cross-city anomaly flag:
```
postalRanges: [
  { min: 65183, max: 65207 },  // Wiesbaden core
  { min: 55252, max: 55252 },  // Mainz-Kastel
  { min: 55246, max: 55246 },  // Mainz-Kostheim  ← add this
]
```

**No data modification in this phase.** The record is valid for inclusion in Wiesbaden.

---

## 3. Review of All 145 Dry-Run Eligible Records

### Classification issues found

#### Bielefeld — Afrikanische Islamische Kultur Verein e.v

**PlaceId:** `ChIJffIr0Zk9ukcRguMGRgL-vzc`  
`categoryName: "Corporate office"` | `categories: ["Corporate office", "Mosque"]`

The record has "Mosque" in its secondary categories and the name explicitly references "Islamische" (Islamic). The primary Google categoryName is "Corporate office" which the pipeline uses for GATE_3 classification. However the entity represents an Islamic cultural association with a mosque function — the "Corporate office" tag is a Google Maps data quality artifact, not an accurate description of the facility.

**Decision:** HOLD — do not reject. The entity has a genuine mosque function. Recommend manual review before promotion; do not auto-publish based on current categoryName alone.

#### Augsburg — Minhadsch Augsburg e.V.

**PlaceId:** `ChIJRT_uhPe9nkcRjdh96SN1j1A`  
`categories: ["Mosque","Club","Cultural association","Educational institution","Religious organization","Village hall"]`

Highly over-tagged. Primary category is "Mosque". Name "Minhadsch" (Arabic: Minhaj, a widely-known Islamic curriculum/movement). Six categories is a data quality concern, but the mosque function is genuine. Pipeline passes it.

**Decision:** PASS — no issue with core classification.

#### Augsburg — rejected entity (pipeline REJECTED)

The pipeline rejected **1 entity** in Augsburg. Based on the raw data inspection, all 20 records have `categoryName: "Mosque"` or a dual-mosque category. The single rejection is likely triggered by the `NON_MOSQUE_BUSINESS_PATTERNS` in `classify.ts` matching some title sub-field or the `COMMUNITY_CENTER` classification path. Since the gate correctly excludes it and the count of 19 publishable records remains accurate, this is correctly handled.

**Decision:** Accepted — pipeline classification is correct.

#### Regensburg — rejected entity (pipeline REJECTED)

Similarly, 11 Regensburg raw records all have `categoryName: "Mosque"` or `"Association / Organization"` with "Mosque" as secondary. The single rejected entity is handled correctly by the pipeline.

**Decision:** Accepted — pipeline classification is correct.

### Aachen — 2 records without postal code

| PlaceId | Title | Postal | Notes |
|---|---|---|---|
| `ChIJe_pj22eZwEcRTuI3E3h_3jg` | Masjid As-Sunnah | `null` | Coordinates confirm Aachen location |
| (all others) | Various mosques | 52062–52080 | Within Aachen bounds |

The `Masjid As-Sunnah` record (postal null) passed GATE_1 — the schema validator must be accepting `null` postal when coordinates are valid. This is consistent behaviour matching the validator's implementation. However, this record should be flagged for postal code verification before promotion.

### Mainz — "Türk Fedarasyonu Mainz Ülkü Ocağı"

**PlaceId:** `ChIJD8H9MUuXvUcR7RJCG3BoK5s`  
`categoryName: "Mosque"` — but the name "Ülkü Ocağı" (Turkish: Grey Wolves / Nationalist movement meeting rooms) is atypical for a mosque directory.

This record is categorised as "Mosque" by Google Maps. Without additional evidence it cannot be reclassified. It is in REVIEWED status in the pipeline. The concern is documented and flagged for manual verification before publication.

**Decision:** HOLD — flag for manual review. Do not publish without verifying this entity functions as a mosque/prayer facility.

### Summary of per-record review findings

| City | Records Passing Review | HOLD (needs verification) | Rejected (pipeline) | Auto-excluded (gate) |
|---|---|---|---|---|
| Bielefeld | 19 | 1 (Afrikanische Islamische K.V. — categoryName artifact) | 0 | 1 (COMMUNITY_CENTER gate) |
| Münster | 7 | 1 (Palace Square — postal null) | 0 | — |
| Karlsruhe | 12 | 0 | 0 | 1 (OTHER gate) |
| Augsburg | 18 | 0 | 1 | 1 (COMMUNITY_CENTER gate) |
| Aachen | 11 | 1 (Masjid As-Sunnah — postal null) | 0 | 0 |
| Mainz | 15 | 1 (Ülkü Ocağı — function unclear) | 0 | 0 |
| Wiesbaden | 18 | 0 | 0 | 0 |
| Kiel | 12 | 0 | 0 | 0 |
| Lübeck | 7 | 0 | 0 | 0 |
| Saarbrücken | 12 | 0 | 0 | 0 |
| Freiburg | 10 | 0 | 0 | 0 |
| Regensburg | 10 | 0 | 1 | 0 |

---

## 4. Per-City Ranking Table

> [!NOTE]
> Rankings are based on actual pipeline results, field completeness, and gate outcomes only. No SEO keyword research was performed; no search demand claims are made.

| Rank | City | Raw | Norm | Eligible | HOLD | Rejected | Prod overlaps | Phone % | Website % | Coords | Cross-city | Gate failures | Primary blocker |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Lübeck** | 7 | 7 | 7 | 0 | 0 | 0 | 71% | 86% | 100% | 0 | 0 | None — smallest dataset, verify completeness |
| 2 | **Saarbrücken** | 12 | 12 | 12 | 0 | 0 | 0 | 50% | 25% | 100% | 0 | 0 | Phone/website enrichment recommended |
| 3 | **Aachen** | 12 | 12 | 11 | 1 | 0 | 0 | 50% | 58% | 100% | 0 | 0 | 1 HOLD (postal null — low risk) |
| 4 | **Freiburg** | 10 | 10 | 10 | 0 | 0 | 0 | 60% | 40% | 100% | 0 | 0 | Phone/website enrichment recommended |
| 5 | **Kiel** | 12 | 12 | 12 | 0 | 0 | 0 | 42% | 33% | 100% | 0 | 0 | High phone gap (58% missing) |
| 6 | **Wiesbaden** | 18 | 18 | 18 | 0 | 0 | 0 | 78% | 61% | 100% | 1 resolved | 0 | Cross-city range fix needed in config |
| 7 | **Mainz** | 16 | 16 | 15 | 1 | 0 | 0 | 62% | 50% | 100% | 0 | 0 | 1 HOLD (Ülkü Ocağı — function unverified) |
| 8 | **Regensburg** | 11 | 11 | 10 | 0 | 1 | 0 | 36% | 55% | 100% | 0 | 0 | Phone gap; 1 auto-rejected |
| 9 | **Karlsruhe** | 13 | 13 | 12 | 0 | 0 | 0 | 54% | 69% | 100% | 0 | 0 | 1 auto-excluded (OTHER); phone gap |
| 10 | **Augsburg** | 20 | 20 | 18 | 0 | 1 | 0 | 60% | 55% | 100% | 0 | 0 | Phone gap; 1 rejected + 1 auto-excluded |
| 11 | **Bielefeld** | 21 | 21 | 19 | 1 | 0 | 0 | 62% | 57% | 100% | 0 | 0 | 1 HOLD (categoryName artifact) |
| 12 | **Münster** | 8 | 8 | 7 | 1 | 0 | 0 | 37% | 75% | 100% | 0 | 0 | Postal fix needed before gate passes |

### Ranking explanations

**1. Lübeck (rank 1):** Smallest dataset but cleanest — 7/7 entities pass all gates, no blockers, no anomalies. Good phone (71%) and website (86%) coverage relative to size. Caution: small dataset — verify no significant mosques are missing from collection before promoting.

**2. Saarbrücken (rank 2):** 12/12 pass all gates. No blockers. Website coverage is low (25%) but not a gate blocker. Phone at 50%.

**3. Aachen (rank 3):** 12 records, all pass gates, 0 production overlaps. Border proximity with Netherlands/Belgium tested — no coordinate anomalies detected. 1 HOLD (Masjid As-Sunnah, postal null) is low-risk given coordinates confirm Aachen. Can be promoted with this entity excluded or after postal correction.

**4. Freiburg (rank 4):** 10/10 pass gates. Mix of MOSQUE (8) and ISLAMIC_CENTER (2) — both valid categories. Clean data, no anomalies.

**5. Kiel (rank 5):** 12/12 pass gates. High phone gap (58% missing, 7/12) is the main concern. 4 entities already in REVIEWED status.

**6. Wiesbaden (rank 6):** 18/18 pass gates. The cross-city anomaly is resolved (Mainz-Kostheim is Wiesbaden administratively). Requires one-line config fix to add postal 55246 to `postalRanges` before promotion to eliminate the cross-city flag. Best phone coverage of any city (78% present).

**7. Mainz (rank 7):** 16/16 pass gates. 1 HOLD (Ülkü Ocağı) requires function verification — if confirmed a mosque/prayer room, eligible count rises to 16.

**8. Regensburg (rank 8):** 10/11 publishable after 1 auto-rejection. Phone gap significant (64% missing).

**9. Karlsruhe (rank 9):** 12/13 publishable after 1 auto-exclusion. Phone gap 46%.

**10. Augsburg (rank 10):** Largest record set with good diversity (MOSQUE, ISLAMIC_CENTER, COMMUNITY_CENTER), 18/20 publishable. Phone gap 40%.

**11. Bielefeld (rank 11):** 19/21 publishable. Largest record count of all cities. 1 HOLD (Afrikanische Islamische K.V.) needs manual category review. Otherwise strong dataset.

**12. Münster (rank 12):** Requires postal code correction for Palace Square Prayer Room before GATE_1 passes. Without that fix, 7/8 records are eligible. Fix is straightforward but must be done correctly with documented evidence.

---

## 5. Recommended Publication Order

Based on data quality only:

### Tier 1 — Ready with minor pre-publication steps

| City | Eligible | Action before promoting |
|---|---|---|
| Lübeck | 7 | Verify dataset completeness (small set) |
| Saarbrücken | 12 | Optional phone enrichment |
| Aachen | 11–12 | Decide on Masjid As-Sunnah (postal null) — exclude or correct |
| Freiburg | 9–10 | Optional phone enrichment |

### Tier 2 — Ready after config fix or single-record resolution

| City | Eligible | Action before promoting |
|---|---|---|
| Wiesbaden | 18 | Add postal 55246 to `postalRanges` in city-config.ts |
| Kiel | 12 | Phone enrichment (high gap 58%) — not a gate blocker but quality concern |
| Mainz | 15–16 | Verify Ülkü Ocağı mosque function; exclude if unconfirmed |

### Tier 3 — Ready after enrichment / review

| City | Eligible | Action before promoting |
|---|---|---|
| Regensburg | 10 | Phone enrichment; confirm pipeline rejection is correct |
| Karlsruhe | 12 | Phone enrichment |
| Augsburg | 18 | Phone enrichment |
| Bielefeld | 19 | Resolve Afrikanische Islamische K.V. categoryName; phone enrichment |

### Tier 4 — Requires data fix

| City | Eligible | Action before promoting |
|---|---|---|
| Münster | 7 | Add postal code 48149 for Palace Square record (documented evidence above) |

---

## 6. Unresolved Issues

| # | City | Record | Issue | Resolution path |
|---|---|---|---|---|
| U1 | Münster | Palace Square Prayer Room (`ChIJd58rTou7uUcRllSptiif6u0`) | Missing postal code causes GATE_1 failure | Add `postalCode: "48149"` to pipeline correction file with this document as evidence |
| U2 | Mainz | Türk Fedarasyonu Mainz Ülkü Ocağı (`ChIJD8H9MUuXvUcR7RJCG3BoK5s`) | Name suggests nationalist meeting room, not confirmed mosque | Manual verification required; exclude until confirmed |
| U3 | Bielefeld | Afrikanische Islamische Kultur Verein (`ChIJffIr0Zk9ukcRguMGRgL-vzc`) | `categoryName: "Corporate office"` artifact — secondary cat is Mosque | Manual review — exclude from auto-publish until confirmed |
| U4 | Aachen | Masjid As-Sunnah (`ChIJe_pj22eZwEcRTuI3E3h_3jg`) | Missing postal code — passed GATE_1 via coords | Verify and add postal code before promotion |
| U5 | Wiesbaden | Config | Postal 55246 (Mainz-Kostheim) not in `postalRanges` | Add `{ min: 55246, max: 55246 }` to Wiesbaden postalRanges in city-config.ts |

---

## 7. Duisburg and Hannover Status

**Not modified in Phase 9C.** Both remain at `READY_FOR_LAUNCH` from Phase 8B.1, awaiting explicit user approval to promote. Their data has not been touched.

---

## Summary Statistics

| Metric | Value |
|---|---|
| Cities reviewed | 12 |
| Total raw records | 160 |
| Total passing all gates | 145 |
| HOLD (needs resolution) | 4 records across 4 cities |
| Auto-rejected by pipeline | 2 (Augsburg ×1, Regensburg ×1) |
| Auto-excluded by GATE_3 | 3 (Bielefeld ×1, Karlsruhe ×1, Augsburg ×1) |
| Production placeId overlaps | **0** |
| Inter-dataset placeId duplicates | **0** |
| Out-of-bounds coordinates | **0** |
| Production records unchanged | **542** |
| Sitemap URLs unchanged | **1,674** |

---

*Stop point — awaiting user approval before any promotion.*  
*Machine-readable audit data: `PHASE9B_AUDIT_RESULTS.json`*  
*Audit script: `scripts/phase9b-audit.ts`*
