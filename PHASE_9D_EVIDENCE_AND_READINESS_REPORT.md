# Phase 9D — Evidence-Based Fixes and First-City Publication Readiness Report

**Generated:** 2026-10-25  
**Stage:** Phase 9D — Audit & Repair (No Publication Authorized)  
**Production Baseline Status:** 542 published records across 14 cities (**UNCHANGED**)  
**Sitemap Index Status:** 1,674 verified URLs (**UNCHANGED**)  

---

## 1. Executive Summary & Production Preservation

In accordance with strict project constraints, Phase 9D was executed with read-only preservation of production records and raw data sources:
- **No production modification:** [`src/data/mosques.json`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/data/mosques.json) remains at exactly 542 records.
- **No premature publication:** No candidate city was marked `PUBLISHED` or had its routes/pages exposed.
- **Sitemap unchanged:** Verified via [`scripts/audit-sitemap.ts`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/scripts/audit-sitemap.ts) at exactly 1,674 URLs.
- **Raw source byte preservation:** All 12 raw JSON datasets (`<city>,germany.json`) remain unaltered.

---

## 2. Münster: Palace Square Prayer Room (`ChIJd58rTou7uUcRllSptiif6u0`)

### 2.1 Raw Provenance & Evidence
- **Place ID:** `ChIJd58rTou7uUcRllSptiif6u0`
- **Raw Title:** `"Palace Square Prayer Room Mosque"`
- **Raw Address:** `"Schloss, Münster, Germany"`
- **Raw Street:** `"Schloss"`
- **Raw Postal Code:** `null`
- **Raw Coordinates:** `lat: 51.9646649, lng: 7.6134979`
- **Plus Code:** `"XJ77+V9 Münster, Germany"`
- **Opening Hours:** `Mon–Fri 7:30 AM – 3:30 PM; Sat–Sun Closed`
- **Reviews:** 11 reviews, 0 review text objects present in payload.
- **Phone / Web:** `phone: ""` (empty string), `website: undefined`

### 2.2 Venue & Postal Code Investigation
- Coordinates map to the Prince Bishop's Castle (*Fürstbischöfliches Schloss Münster*), the main administrative building and lecture complex of the University of Münster (Universität Münster, Schlossplatz 2).
- The operating hours strictly track administrative university building opening hours.
- While the university community and students recognize prayer facilities on campus, the Google Place entity lacks an official street number and has no authoritative postal code in its raw provenance.
- Assigning `48149` (the general postal code for the Schlossplatz/university district) based on coordinates alone would violate project policy against unevidenced manual fact fabrication.

### 2.3 Decision
- **Decision:** `HOLD`
- **Reason:** Missing official postal code in raw record. Coordinates confirm the geographic position within Münster, but without authoritative registry evidence of an independent congregational mosque entity and a verified postal address, the record must not be published.
- **Impact on Münster:** Münster has 7 clean, passing mosque entities and 1 entity on `HOLD`.

---

## 3. Wiesbaden / Mainz-Kostheim Postal Range Resolution (`55246`)

### 3.1 Municipal Analysis & Overlap Risk
- **Issue:** Record `ChIJ1c3P-3WXvUcRvVhxEtn2Q4Q` (*"Moroccan Culture Center"*, Anton-Hehn-Straße 2, 55246 Wiesbaden-Mainz-Kostheim) previously triggered a cross-city anomaly flag because `55246` was absent from Wiesbaden's `postalRanges`.
- **Administrative Fact:** In 1945, the Allied military administrations divided the former city of Mainz along the Rhine. The right-bank districts (*Rechtsrheinische Stadtteile*)—Mainz-Kastel (`55252`), Mainz-Kostheim (`55246`), and Mainz-Amöneburg—were incorporated into the city of Wiesbaden in the state of Hesse (*Land Hessen*). Although they retained postal codes beginning with `55` (historically associated with Mainz/Rhineland-Palatinate), they are legally and administratively districts of the state capital Wiesbaden (*Landeshauptstadt Wiesbaden*).
- **Cross-City Overlap Check:**
  - Mainz dataset (`mainz,germany.json`) contains zero records with postal codes `55246` or `55252`.
  - All Mainz records fall strictly in the range `55116` to `55129`.
  - There is zero overlap risk between Mainz and Wiesbaden by recognizing `55246` as Wiesbaden.

### 3.2 Code Configuration Changes
In [`src/pipeline/city-config.ts`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/pipeline/city-config.ts#L313-L325), `Wiesbaden` configuration was updated to explicitly recognize `55246`:

```typescript
  {
    canonical: 'Wiesbaden',
    slug: 'wiesbaden',
    englishSlug: 'wiesbaden',
    state: 'Hessen',
    postalMin: 65183,
    postalMax: 65207,
    postalRanges: [
      { min: 65183, max: 65207 },
      { min: 55246, max: 55246 }, // Mainz-Kostheim: official Wiesbaden Stadtteil (Hessen)
      { min: 55252, max: 55252 }, // Mainz-Kastel/Amöneburg: official Wiesbaden Stadtteil (Hessen)
    ],
    aliases: ['wiesbaden', 'Wiesbaden'],
  },
```

### 3.3 Verification
- Rerun of `scripts/phase9b-audit.ts`: Cross-city anomalies in Wiesbaden dropped from **1 to 0**.
- Total cross-city anomalies across all 12 candidate cities is now **0**.
- All 18 Wiesbaden records pass all quality gates with zero errors.

---

## 4. Audit & Decisions for Remaining Flagged Records

### 4.1 Mainz: Türk Fedarasyonu Mainz Ülkü Ocağı
- **Place ID:** `ChIJD8H9MUuXvUcR7RJCG3BoK5s`
- **File:** `mainz,germany.json`
- **Raw Title:** `"Türk Fedarasyonu Mainz Ülkü Ocağı"`
- **Address:** Mombacher Str. 71, 55122 Mainz
- **Raw Categories:** `["Mosque"]` | `categoryName: "Mosque"`
- **Evidence Inspected:**
  - User review quotes explicitly: *"Kadınlar için lavabo, abdesthane, mescid bulunmaktadır. Erkekler için de lavabo, abdesthane ve cami bulunmaktadır."* (Confirms dedicated ablution spaces and segregated prayer hall/mosque on premises).
  - However, the umbrella title denotes an *Ülkü Ocağı* (political/cultural association premises).
- **Decision:** `HOLD`
- **Reason:** Under the directory eligibility guidelines, non-sectarian religious worship listings must distinguish independent mosques from political clubhouse premises. The facility contains a mescid, but is primarily registered and branded as an association center. Retained in `REVIEWED` status pending explicit editorial confirmation.

### 4.2 Bielefeld: Afrikanische Islamische Kultur Verein e.v
- **Place ID:** `ChIJffIr0Zk9ukcRguMGRgL-vzc`
- **File:** `bielefeld,germany.json`
- **Raw Title:** `"Afrikanische Islamische Kultur Verein e.v"`
- **Address:** Schildescher Str. 69, 33611 Bielefeld
- **Raw Categories:** `["Corporate office", "Mosque"]` | `categoryName: "Corporate office"`
- **Evidence Inspected:**
  - Phone: `+49 521 98920199`, Website: `http://www.aikv.de/de/`, Opening hours: `Open 24 hours`.
  - Reviews reflect community prayer and communal iftar meals (*"Alhamdulillah... zu iftar auch immer leckeres hausgemachtes Essen"*).
  - The primary Google tag was mislabeled as `"Corporate office"`, but secondary tag is `"Mosque"` and name includes `"Islamische"`.
- **Decision:** `ACCEPT` (Mosque / Community Facility)
- **Reason:** Confirmed active Islamic association hosting regular congregational prayers and community worship.

### 4.3 Aachen: Masjid As-Sunnah
- **Place ID:** `ChIJe_pj22eZwEcRTuI3E3h_3jg`
- **File:** `aachen,germany.json`
- **Raw Title:** `"Masjid As-Sunnah"`
- **Raw Address:** `"52070 Aachen, Germany"`
- **Raw Postal Code:** `null`
- **Evidence Inspected:**
  - Street address string embeds the postal code `"52070"`, which is within Aachen's canonical range (`52062–52080`).
  - Active verified contact: `+49 1520 8701517`, 74 reviews.
  - Plus Code: `"Q3GW+WV Aachen, Germany"`.
- **Decision:** `ACCEPT`
- **Reason:** The postal code is explicitly present in the address text (`52070`) and verified within municipal boundaries. Gate evaluation passes cleanly.

### 4.4 Automated Pipeline Exclusions (Confirmed Valid)
- **Augsburg — `ChIJf5J_yDi9nkcR_Cmg86K7DRk`** (*Islam-Albanischer Kulturverein Augsburg e.V.*): Classified as `COMMUNITY_CENTER / REJECTED`. Correctly filtered out by club/kulturverein heuristic without confirmed daily prayer facilities.
- **Regensburg — `ChIJk40IWZvBn0cRhoFRfr1R13g`** (*Islamisch-Albanisches-Kulturzentrum*): Raw category `"Association / Organization"` without explicit mosque indicator in title. Correctly filtered as `OTHER / REJECTED`.
- **Bielefeld — `ChIJHXEoYHI9ukcRtgtTMCTGnNQ`**: Handled as `COMMUNITY_CENTER`.
- **Karlsruhe — `ChIJ9Z7bsVEGl0cRa-9nBVbDaSE`**: Handled as `OTHER / REVIEWED`.

---

## 5. Candidate City Readiness Ranking

Rankings are strictly evaluated against data completeness, zero boundary anomalies, gate passing rates, and absence of unresolved blockers:

| Rank | City | Raw | Norm | Confirmed Eligible | Gate Passing | Boundary Issues | Critical Blockers | Readiness Tier |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|:---|:---:|
| **1** | **Wiesbaden** | 18 | 18 | **18** | 18 / 18 (100%) | None (`55246` resolved) | None (Highest completeness: 78% phone, 61% web) | **READY FOR PUBLICATION** |
| **2** | **Lübeck** | 7 | 7 | **7** | 7 / 7 (100%) | None | None (Small dataset, 71% phone, 86% web) | **READY FOR PUBLICATION** |
| **3** | **Saarbrücken** | 12 | 12 | **12** | 12 / 12 (100%) | None | None (50% phone, 0 overlaps) | **READY FOR PUBLICATION** |
| **4** | **Aachen** | 12 | 12 | **12** | 12 / 12 (100%) | None | None (`52070` confirmed in string) | **READY FOR PUBLICATION** |
| **5** | **Freiburg** | 10 | 10 | **10** | 10 / 10 (100%) | None | None (60% phone, clean coordinates) | **READY FOR PUBLICATION** |
| **6** | **Mainz** | 16 | 16 | **15** | 15 / 16 (94%) | None | 1 HOLD (*Ülkü Ocağı* excluded from launch) | **NEAR READY** |
| **7** | **Bielefeld** | 21 | 21 | **19** | 20 / 21 (95%) | None | 1 HOLD (*Camii* thin record), 1 Community Center | **NEAR READY** |
| **8** | **Karlsruhe** | 13 | 13 | **12** | 12 / 13 (92%) | None | 1 non-mosque category excluded | **NEAR READY** |
| **9** | **Augsburg** | 20 | 20 | **18** | 18 / 20 (90%) | None | 1 REJECTED (club), 1 Community Center | **NEAR READY** |
| **10** | **Kiel** | 12 | 12 | **12** | 12 / 12 (100%) | None | High phone gap (58% missing), 4 thin records | **SECONDARY BATCH** |
| **11** | **Regensburg** | 11 | 11 | **10** | 10 / 11 (91%) | None | 1 REJECTED (org), 64% missing phones | **SECONDARY BATCH** |
| **12** | **Münster** | 8 | 8 | **7** | 7 / 8 (88%) | None | 1 HOLD (Palace Square missing postal code) | **BLOCKED ON DATA REPAIR** |

---

## 6. Verification and Regression Test Suite

All quality checks and regression tests completed cleanly:

- **Vitest Test Suite:** `16 passed (16 test files, 298 tests passed)`
- **TypeScript Compilation:** `0 errors` (`tsc --noEmit`)
- **ESLint:** `0 errors / 0 warnings`
- **Data Quality Audit (`npm run data:audit`):**
  - Audited 542 published mosques across 14 cities.
  - Zero critical data integrity violations.
- **Duplicate & Geographic Audit (`npm run data:duplicates`):**
  - Zero new cross-city duplicates or production collisions.
- **Sitemap Audit (`scripts/audit-sitemap.ts`):**
  - Total URLs: **1,674** (100% HTTPS, 0 duplicate, 0 invalid).
- **Production Baseline Verification:**
  - `src/data/mosques.json`: Exactly 542 records.
  - Published Cities (14): Berlin, Bonn, Bremen, Dortmund, Düsseldorf, Essen, Frankfurt, Hamburg, Köln, Leipzig, München, Nürnberg, Stuttgart, Wuppertal.

---

## 7. Recommended First-City Publication Candidate

### Recommendation: **Wiesbaden**
Following the evidence-based audit, **Wiesbaden** is the recommended candidate for the first new city promotion:
1. **18 verified, publishable facilities** with zero gate failures (100% pass rate).
2. **Boundary resolution complete:** Postal range `55246` (Mainz-Kostheim) verified and configured without conflict with Mainz.
3. **Data richness:** 78% phone number coverage and 61% website coverage (the highest of any candidate city).
4. **Zero overlaps or duplicates** with existing production mosques.

---

> [!IMPORTANT]
> **STOP POINT REACHED:** No city has been promoted. Production datasets, sitemaps, and publication registries remain unchanged. Awaiting explicit user instruction before initiating any promotion or publication workflow.
