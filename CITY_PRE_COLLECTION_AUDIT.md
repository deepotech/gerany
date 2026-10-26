# MoscheeAtlas — Pre-Collection City Audit
## Repository Audit & Data Gap Analysis for 12 Candidate German Cities

**Execution Date:** 2026-10-25T10:47:30Z  
**Phase:** Pre-Collection City Audit (Read-Only Investigation)  
**Production Domain:** `https://moscheeindernaehe.de`  
**Current Production Baseline:** 14 published cities, 542 published mosques (100% intact, zero mutations)  
**Audit Purpose:** Empirically establish whether any candidate cities already have data in the repository, evaluate geographic and boundary risks, and define an evidence-based collection order.

---

## 1. Executive Summary

A comprehensive, read-only audit of the entire MoscheeAtlas repository was conducted across:
- **19 raw source datasets** in the workspace root directory.
- The normalized database pool in `src/data/all-entities.json` (594 records).
- The production published database in `src/data/mosques.json` (542 records).
- The city registry in `src/pipeline/city-registry.ts` and `src/data/city-registry-overrides.json`.
- The geographic configuration in `src/pipeline/city-config.ts` (`CITY_CONFIGS` and `EXTENDED_CITY_CONFIGS`).

### Key Findings:
1. **Total Absence of Data for All 12 Candidates:** Not a single raw record, normalized entity, or published mosque exists for any of the 12 audited candidate cities. They are **100% genuinely missing** from the project.
2. **False Signal Disambiguation:** Incidental string matches (e.g. *"Münsterstraße"* in Dortmund and Düsseldorf, *"Karlsruher Str."* in Mannheim, *"Mainzer Landstraße"* in Frankfurt, and *"Kielstraße"* in Dortmund) are German civic street names and do not represent mosque records located in those candidate cities.
3. **Registry & Configuration Status:** None of the 12 candidate cities are currently defined in `CITY_CONFIGS`, `EXTENDED_CITY_CONFIGS`, or `city-registry.ts`. All 12 will require explicit postal boundary configuration prior to ingestion.
4. **Zero Production Mutation:** Zero changes have been made to existing production data, schemas, publication states, or quality gates.

---

## 2. Comprehensive Candidate City Audit Table

| Candidate City | Federal State | Approx. Pop. | Existing Raw Count | Normalized Pool Count | Published Count | In City Registry? | In City Config? | Dedicated Raw File? | Canonical Slug | Slug Conflict Risk |
|---|---|---|---|---|---|---|---|---|---|---|
| **Aachen** | Nordrhein-Westfalen | ~252,000 | **0** | **0** | **0** | No | No | None | `aachen` | None |
| **Karlsruhe** | Baden-Württemberg | ~309,000 | **0** | **0** | **0** | No | No | None | `karlsruhe` | None |
| **Münster** | Nordrhein-Westfalen | ~320,000 | **0** | **0** | **0** | No | No | None | `muenster` | Low (avoid Munster in Niedersachsen) |
| **Augsburg** | Bayern | ~301,000 | **0** | **0** | **0** | No | No | None | `augsburg` | None |
| **Bielefeld** | Nordrhein-Westfalen | ~344,000 | **0** | **0** | **0** | No | No | None | `bielefeld` | None |
| **Regensburg** | Bayern | ~157,000 | **0** | **0** | **0** | No | No | None | `regensburg` | None |
| **Freiburg im Breisgau** | Baden-Württemberg | ~236,000 | **0** | **0** | **0** | No | No | None | `freiburg` | Low (avoid Freiburg/Elbe) |
| **Mainz** | Rheinland-Pfalz | ~221,000 | **0** | **0** | **0** | No | No | None | `mainz` | None |
| **Wiesbaden** | Hessen | ~286,000 | **0** | **0** | **0** | No | No | None | `wiesbaden` | None |
| **Kiel** | Schleswig-Holstein | ~248,000 | **0** | **0** | **0** | No | No | None | `kiel` | None |
| **Lübeck** | Schleswig-Holstein | ~218,000 | **0** | **0** | **0** | No | No | None | `luebeck` | None |
| **Saarbrücken** | Saarland | ~182,000 | **0** | **0** | **0** | No | No | None | `saarbruecken` | None |

---

## 3. Evidence & Verification From the Repository

### 3.1 Inventory of Existing Raw Datasets (19 Files)
The root directory was scanned for all `.json` data files. Exactly 19 raw datasets exist:
1. `Berlin, Germany.json` (Published)
2. `Hamburg, Germany.json` (Published)
3. `München, Germany.json` (Published)
4. `Köln, Germany.json` (Published)
5. `Frankfurt, Germany.json` (Published)
6. `Stuttgart, Germany.json` (Published)
7. `Düsseldorf, Germany.json` (Published)
8. `Dortmund, Germany.json` (Published)
9. `Essen, Germany.json` (Published)
10. `Bremen, Germany.json` (Published)
11. `Wuppertal, Germany.json` (Published)
12. `Bonn, Germany.json` (Published)
13. `Nürnberg, Germany.json` (Published)
14. `Leipzig, Germany.json` (Published)
15. `Duisburg, Germany.json` (Ready for launch — Phase 8B verified)
16. `Hannover, Germany.json` (Ready for launch — Phase 8B verified)
17. `Bochum, Germany.json` (Held in review — GATE_D)
18. `Mannheim, Germany.json` (Held in review — GATE_C)
19. `Dresden, Germany.json` (Blocked — GATE_F record count)

**Finding:** Not a single raw file exists for Aachen, Karlsruhe, Münster, Augsburg, Bielefeld, Regensburg, Freiburg, Mainz, Wiesbaden, Kiel, Lübeck, or Saarbrücken.

### 3.2 Cross-Dataset Occurrence Analysis (Disambiguating Street Names)
A full-text scan across all existing raw files and normalized entities identified 8 apparent string matches. Each was verified to be a street name in another municipality:
- **Karlsruhe Matches:**
  - `Karlsruher Str. 5, 68219 Mannheim` (*Selimiye-Moschee Rheinau* in `Mannheim, Germany.json`). Located in Mannheim-Rheinau, postal `68219`.
- **Münster Matches:**
  - `Münsterstraße 158B, 44145 Dortmund` (*Ahmed-Yesevi-Moschee* in `Dortmund, Germany.json`). Postal `44145`.
  - `Münsterstraße 56, 44145 Dortmund` (*Al-Anwar Moschee* in `Dortmund, Germany.json`). Postal `44145`.
  - `Münsterstraße 199, 40239 Düsseldorf` (*DITIB Zentralmoschee* in `Düsseldorf, Germany.json`). Postal `40239`.
- **Mainz Matches:**
  - `Mainzer Landstraße 125, 60327 Frankfurt am Main` (*Bosniakisches Kulturzentrum e.V.* in `Frankfurt, Germany.json`). Postal `60327`.
- **Kiel Matches:**
  - `Kielstraße 12, 44145 Dortmund` (*Dortmund Merkez Câmii* in `Dortmund, Germany.json`). Postal `44145`.
  - `Kielstraße 16, 44145 Dortmund` (*جامع* in `Dortmund, Germany.json`). Postal `44145`.

**Conclusion:** Zero candidate mosque records have leaked into existing datasets or cross-city anomalies.

---

## 4. Geographic Boundary Risks & Neighboring City Analysis

When collecting Google Places / OpenStreetMap raw data for these cities, the pipeline's cross-city boundary validator (`resolveCanonicalCity` in `city-config.ts`) must account for the following geographic risks:

```
[Mainz (Rheinland-Pfalz: 55116-55131)] <--- Rhine River ---> [Wiesbaden (Hessen: 65183-65207)]
                               \                                  /
                                \----> [Frankfurt (Hessen: 60xxx, 659xx)] (Already Published)
```

### 4.1 Critical Boundary Risks:
1. **Mainz (Rheinland-Pfalz) vs. Wiesbaden (Hessen):**
   - **Risk Level:** **EXTREME.** Mainz and Wiesbaden face each other directly across the River Rhine.
   - **Boundary Complexity:** Three suburban districts historically named Mainz (*Mainz-Kastel*, *Mainz-Kostheim*, *Mainz-Amöneburg*) were reassigned to Wiesbaden after WWII and carry postal code `55252` (Wiesbaden, Hessen).
   - **Frankfurt Metropolitan Proximity:** Both cities sit within 30–40 km of Frankfurt am Main (already in production). Raw geo-radius queries centered on Frankfurt or Wiesbaden could easily swallow the same mosques twice.
   - **Mitigation:** Mainz and Wiesbaden must be collected as a synchronized pair with rigorous postal range boundaries (`55116–55131` for Mainz vs `65183–65207` + `55252` for Wiesbaden).

2. **Aachen (Nordrhein-Westfalen) — International Tri-Border:**
   - **Risk Level:** **HIGH.**
   - **Boundary Complexity:** Aachen borders the Netherlands (Vaals is contiguous with Aachen urban fabric) and Belgium (Kelmis/Eupen). Raw radius scrapes frequently pick up Dutch or Belgian prayer spaces.
   - **Mitigation:** Enforce strict Germany country bounds (`latitude: 47.0–55.5`, `longitude: 5.5–15.5`, `postalCode: 52062–52080`). Filter out non-German administrative divisions.

3. **Saarbrücken (Saarland) — French Border:**
   - **Risk Level:** **MODERATE to HIGH.**
   - **Boundary Complexity:** Saarbrücken sits directly on the border with France (Lorraine / Forbach / Sarreguemines).
   - **Mitigation:** Enforce postal code bounds (`66111–66133`) and ensure French cross-border results are discarded.

4. **Augsburg (Bayern) vs. München:**
   - **Risk Level:** **LOW.** Located ~60 km northwest of Munich with a distinct postal zone (`86150–86199` vs `80001–81999`).

5. **Karlsruhe (Baden-Württemberg) vs. Mannheim:**
   - **Risk Level:** **LOW.** Located ~65 km south of Mannheim with a distinct postal zone (`76131–76229` vs `68159–68309`).

6. **Kiel & Lübeck (Schleswig-Holstein) vs. Hamburg:**
   - **Risk Level:** **LOW to MODERATE.** Lübeck is ~60 km northeast of Hamburg. Hamburg's outer metropolitan suburbs extend to `229xx`. Lübeck starts at `23552`.

---

## 5. Unresolved Uncertainties & Collection Prerequisites

Before launching data collection scripts, the following architectural prerequisites must be addressed:

1. **City Configuration Definitions:**
   Each candidate city must be formally added to `src/pipeline/city-config.ts` with verified postal ranges, German canonical names, Latin slugs, and English route slugs.
2. **City Registry Entries:**
   Each candidate city must be registered in `src/pipeline/city-registry.ts` with status `DISCOVERED` or `REVIEW` (publication disabled by default).
3. **Data Source Licensing:**
   All raw collections must comply with established source provenance schemas (`google_places_json` or `osm_adapter`) with valid factual directory usage rights.
4. **Minimum Record Threshold (`GATE_F`):**
   Smaller cities (e.g. Regensburg, Saarbrücken) must be audited during collection to ensure they meet the `CITY_MIN_PUBLISHED_RECORDS = 5` threshold to prevent thin landing page creation.

---

## 6. Recommended First Collection Batch (Top 5 Cities)

Based on data gaps, demographic representation, geographic distribution, and boundary cleanliness, the following **Batch 1 (5 Cities)** is recommended for immediate data collection:

```
┌────────────────────────────────────────────────────────────────────────┐
│               RECOMMENDED BATCH 1: DATA COLLECTION (TOP 5)             │
├────┬────────────┬───────────────────────┬────────────┬─────────────────┤
│ #  │ City       │ Federal State         │ Population │ Primary Merit   │
├────┼────────────┼───────────────────────┼────────────┼─────────────────┤
│ 1. │ Bielefeld  │ Nordrhein-Westfalen   │ ~344,000   │ Major urban gap │
│ 2. │ Münster    │ Nordrhein-Westfalen   │ ~320,000   │ Clean boundaries│
│ 3. │ Karlsruhe  │ Baden-Württemberg     │ ~309,000   │ South expansion │
│ 4. │ Augsburg   │ Bayern                │ ~301,000   │ Bavaria hub 3   │
│ 5. │ Aachen     │ Nordrhein-Westfalen   │ ~252,000   │ Historic center │
└────┴────────────┴───────────────────────┴────────────┴─────────────────┘
```

### Detailed Rationale for Batch 1:
1. **Bielefeld (~344,000):**
   - The largest German city currently missing from MoscheeAtlas.
   - Core hub of Ostwestfalen-Lippe (OWL) with a large, diverse Muslim population.
   - Clean, self-contained postal range (`33602–33739`) with minimal boundary confusion with other cities.
2. **Münster (~320,000):**
   - Major cultural and academic center in Westfalen.
   - Geographically independent (`48143–48167`), well clear of the Ruhr area. Zero overlap risk with Dortmund or Essen.
3. **Karlsruhe (~309,000):**
   - Second largest city in Baden-Württemberg; significantly enhances southern German directory coverage.
   - Clear postal boundary (`76131–76229`) distinct from Stuttgart and Mannheim.
4. **Augsburg (~301,000):**
   - Third-largest city in Bavaria with substantial community history.
   - Completely independent from Munich (`86150–86199`).
5. **Aachen (~252,000):**
   - Prominent academic and historic Islamic community (home to the historic Bilal-Moschee / IZA Aachen, DITIB, and student prayer spaces).
   - Distinct 52xxx postal cluster (`52062–52080`).

---

## 7. Secondary Collection Batches

### Secondary Batch A: State Capital & Federal State Expansion (4 Cities)
Focuses on establishing directory presence in federal states currently with **0 published cities**:
- **Mainz** (Rheinland-Pfalz, pop. ~221,000) & **Wiesbaden** (Hessen, pop. ~286,000) — must be collected simultaneously as a synchronized twin-city Rhine cluster.
- **Saarbrücken** (Saarland, pop. ~182,000) — establishes MoscheeAtlas presence in the State of Saarland.
- **Kiel** (Schleswig-Holstein, pop. ~248,000) — establishes MoscheeAtlas presence in the State of Schleswig-Holstein.

### Secondary Batch B: Regional Cultural Centers (3 Cities)
- **Freiburg im Breisgau** (Baden-Württemberg, pop. ~236,000)
- **Lübeck** (Schleswig-Holstein, pop. ~218,000)
- **Regensburg** (Bayern, pop. ~157,000)

---

## 8. Conclusion & Enforced Stop Boundary

- **Audit Complete:** All 12 candidate cities have been audited. Zero pre-existing raw, normalized, or published records exist in the repository.
- **Stop Condition Active:** No data collection, web scraping, configuration modification, or code deployment has been performed.
- **Awaiting Operator Authorization:** Please indicate if you approve the recommended **Batch 1 collection scope (Bielefeld, Münster, Karlsruhe, Augsburg, Aachen)** and authorize defining their geographic configurations in `src/pipeline/city-config.ts`.
