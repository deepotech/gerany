# Phase 10A — Final Wiesbaden Pre-Publication Audit Report

**Audit Date:** 2026-10-25  
**Stage:** Phase 10A — Final Read-Only Pre-Publication Audit  
**Status:** Strictly Read-Only (No promotion, no publication, no deployment applied)  
**Production Baseline Status:** 542 published mosques across 14 cities (**UNCHANGED**)  
**Sitemap Total URLs:** 1,674 verified URLs (**UNCHANGED**)  

---

## 1. Actual Baseline Verification

Before evaluating candidate data, the current repository state and production environment were verified directly against code and data files:

| Metric | Verified Value | Evidence Source |
|:---|:---:|:---|
| **Published Mosque Records** | **542** | `src/data/mosques.json` (exact JSON array length) |
| **Published Cities Count** | **14** | `Berlin, Bonn, Bremen, Dortmund, Düsseldorf, Essen, Frankfurt, Hamburg, Köln, Leipzig, München, Nürnberg, Stuttgart, Wuppertal` |
| **All-Entities Store Count** | **594** | `src/data/all-entities.json` (542 published + 52 candidate/staging entities) |
| **Wiesbaden in All-Entities** | **0** | `src/data/all-entities.json` (zero records currently staged) |
| **Wiesbaden Registry Status** | `DISCOVERED` | `src/pipeline/city-registry.ts` (`CANDIDATE_CITIES_BATCH2`) |
| **Wiesbaden Publication Enabled** | `false` | `city-registry.ts` (`publicationEnabled: false`, `seoIndexable: false`) |
| **Wiesbaden in Registry Overrides**| `null` | `src/data/city-registry-overrides.json` (no override entry exists) |
| **Actual Sitemap URL Count** | **1,674** | Generated via `scripts/audit-sitemap.ts` (100% valid HTTPS URLs) |

### Sitemap URL Breakdown (Current: 1,674 URLs)
- **Homepages (3 URLs):** `/de`, `/en`, `/ar`
- **Search Hub Pages (3 URLs):** `/de/moscheen`, `/en/mosques`, `/ar/mosques`
- **City Collection Pages (42 URLs):** 14 published cities × 3 locales (`de`, `en`, `ar`)
- **Mosque Detail Pages (1,626 URLs):** 542 published mosques × 3 locales (`de`, `en`, `ar`)
- **Total:** $3 + 3 + 42 + 1,626 = 1,674$ URLs.

### Current Git Status & Uncommitted Changes
```text
 M reports/audit/production-audit-events.jsonl (test run artifact)
 M src/pipeline/city-config.ts                 (55246 Mainz-Kostheim postal range addition)
 M src/pipeline/city-registry.ts               (Batch 1 & 2 candidate definitions)
 M src/pipeline/classify.ts                    (NON_MOSQUE_BUSINESS_PATTERNS classifier rule)
 M src/pipeline/runner.ts                      (Phone enrichments loader)
 M src/pipeline/translations.ts                (Batch 1 & 2 Arabic city names)
?? PHASE_10A_WIESBADEN_PREPUBLICATION_AUDIT.md
?? PHASE_9D_EVIDENCE_AND_READINESS_REPORT.md
?? PHASE10A_AUDIT_DATA.json
?? scripts/phase10a-audit.ts
?? scripts/phase10a-postal-test.ts
?? (Raw candidate json datasets and phase audit reports)
```

---

## 2. Comprehensive Review of All 18 Wiesbaden Candidate Records

Every candidate record in [`wiesbaden,germany.json`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/wiesbaden,germany.json) was evaluated individually against direct evidence, coordinates/address agreement, contact availability, collision status, and operational legitimacy.

### Record 1: Ayasofya Cami, Medrese-i Nuriye
- **Place ID:** `ChIJo73-4caXvUcR-JkPLVdR0SI`
- **Address:** Schmalweg 36, 55252 Wiesbaden-Mainz-Kastel
- **Postal Code:** `55252` | **Coordinates:** `50.0157765, 8.2896818`
- **Address/Coord Agreement:** Verified. Schmalweg in Mainz-Kastel matches coordinates.
- **Classification & Gate Status:** `MOSQUE` / `PUBLISHED` (dry-run). Category: `Mosque`.
- **Contact:** Phone: `+49 174 6530755` | Website: `null`.
- **Operational Evidence:** 5 reviews, regular opening hours logged 7 days/week (5:00 AM – 11:00 PM). Established local Turkish community mosque and medrese in Mainz-Kastel.
- **Collisions/Duplicates:** None.
- **Recommendation:** **READY**

---

### Record 2: Süleymaniye-Moschee
- **Place ID:** `ChIJp1fuPXW-vUcRXsDzPMHQJKQ`
- **Address:** Dotzheimer Str. 24-26, 65185 Wiesbaden
- **Postal Code:** `65185` | **Coordinates:** `50.0781153, 8.2336498`
- **Address/Coord Agreement:** Verified. Central Wiesbaden Dotzheimer Straße.
- **Classification & Gate Status:** `MOSQUE` / `PUBLISHED` (dry-run). Category: `Mosque`.
- **Contact:** Phone: `+49 611 376333` | Website: `null`.
- **Operational Evidence:** 39 reviews (4.8 stars). Longstanding VIKZ Süleymaniye community mosque.
- **Collisions/Duplicates:** None.
- **Recommendation:** **READY**

---

### Record 3: Wiesbaden Central Mosque (DITIB Zentralmoschee)
- **Place ID:** `ChIJsZ_fkxa-vUcRbK4Lad3tmW8`
- **Address:** Holzstraße 36, 65197 Wiesbaden
- **Postal Code:** `65197` | **Coordinates:** `50.0722729, 8.2120954`
- **Address/Coord Agreement:** Verified. Holzstraße central location.
- **Classification & Gate Status:** `MOSQUE` / `PUBLISHED` (dry-run). Category: `Mosque`.
- **Contact:** Phone: `+49 611 9410492` | Website: `http://www.ditib-wiesbaden.de/`.
- **Operational Evidence:** 139 reviews, active official website, 7-day opening hours. Primary DITIB central community facility in Wiesbaden.
- **Collisions/Duplicates:** None (slug disambiguated from Biebrich Central Mosque).
- **Recommendation:** **READY**

---

### Record 4: Masjid as Sunnah
- **Place ID:** `ChIJRWTYPAC9vUcRbrQsUHPyB7A`
- **Address:** Egerstraße 2, 65205 Erbenheim (Wiesbaden)
- **Postal Code:** `65205` | **Coordinates:** `50.0547884, 8.2984099`
- **Address/Coord Agreement:** Verified. Egerstraße in Wiesbaden-Erbenheim.
- **Classification & Gate Status:** `MOSQUE` / `PUBLISHED` (dry-run). Category: `Mosque`.
- **Contact:** Phone: `null` | Website: `https://www.masjid-as-sunnah.de/`.
- **Operational Evidence:** 48 reviews, active official domain with prayer schedule and community programs, 7-day opening hours.
- **Collisions/Duplicates:** None.
- **Recommendation:** **READY**

---

### Record 5: Marokkanischer Kulturverein e.V. Badr Moschee
- **Place ID:** `ChIJw9OO_Y2VvUcRh1m-vh9dgDE`
- **Address:** Stielstraße 19, 65201 Schierstein (Wiesbaden)
- **Postal Code:** `65201` | **Coordinates:** `50.0492283, 8.1945415`
- **Address/Coord Agreement:** Verified. Stielstraße commercial/community building in Schierstein.
- **Classification & Gate Status:** `MOSQUE` / `PUBLISHED` (dry-run). Category: `Mosque`.
- **Contact:** Phone: `+49 611 598386` | Website: `http://www.masjid-badr.de/`.
- **Operational Evidence:** 77 reviews (4.7 stars), official website, official telephone, 7-day opening hours. Primary Moroccan community mosque (Badr Moschee) in Schierstein.
- **Collisions/Duplicates:** **Co-located with Record 18** (*"Moschee Schierstein"*, see detailed analysis below).
- **Recommendation:** **READY** (Primary authoritative record for Stielstraße 19).

---

### Record 6: Wiesbaden Central Mosque (Omar Moschee Biebrich)
- **Place ID:** `ChIJd-yqKx2WvUcRUnMVfd0Eu5Y`
- **Address:** Henkellstraße 12, 65187 Biebrich (Wiesbaden)
- **Postal Code:** `65187` | **Coordinates:** `50.0531042, 8.2412386`
- **Address/Coord Agreement:** Verified. Henkellstraße in Wiesbaden-Biebrich.
- **Classification & Gate Status:** `MOSQUE` / `PUBLISHED` (dry-run). Category: `Mosque, Club`.
- **Contact:** Phone: `+49 611 608390` | Website: `https://omar-moschee.de/`.
- **Operational Evidence:** 211 reviews (4.7 stars), established Omar Mosque with daily prayers and community services.
- **Collisions/Duplicates:** Deterministic slug `wiesbaden-central-mosque-2` assigned to avoid collision with Holzstraße Central Mosque.
- **Recommendation:** **READY**

---

### Record 7: Moroccan Culture Center (Islamischer Kulturverein Kostheim)
- **Place ID:** `ChIJ1c3P-3WXvUcRvVhxEtn2Q4Q`
- **Address:** Anton-Hehn-Straße 2, 55246 Wiesbaden-Mainz-Kostheim
- **Postal Code:** `55246` | **Coordinates:** `50.010048, 8.3001535`
- **Address/Coord Agreement:** Verified. Anton-Hehn-Straße in Wiesbaden-Mainz-Kostheim.
- **Classification & Gate Status:** `MOSQUE` / `PUBLISHED` (dry-run). Category: `Mosque`.
- **Contact:** Phone: `+49 6134 298592` | Website: `http://ikv-kostheim.de/`.
- **Operational Evidence:** 110 reviews, active website `ikv-kostheim.de`, active telephone. Verified congregational mosque and cultural center in Kostheim.
- **Collisions/Duplicates:** None. Cross-city flag resolved by postal configuration.
- **Recommendation:** **READY**

---

### Record 8: Mubarak Moschee
- **Place ID:** `ChIJ31MSbj6-vUcRwd_rBbyWemI`
- **Address:** Sommerstraße 13, 65197 Wiesbaden
- **Postal Code:** `65197` | **Coordinates:** `50.07427, 8.2059539`
- **Address/Coord Agreement:** Verified. Sommerstraße in Wiesbaden.
- **Classification & Gate Status:** `MOSQUE` / `PUBLISHED` (dry-run). Category: `Mosque`.
- **Contact:** Phone: `+49 611 72448724` | Website: `http://www.mubarak-moschee.de/`.
- **Operational Evidence:** 155 reviews (4.8 stars), purpose-built Ahmadiyya mosque with minarets and active community website.
- **Collisions/Duplicates:** None.
- **Recommendation:** **READY**

---

### Record 9: Tauhid Moschee
- **Place ID:** `ChIJr4MVCKm_vUcRGWv7cazSMHE`
- **Address:** Fischbacher Str. 3, 65197 Wiesbaden
- **Postal Code:** `65197` | **Coordinates:** `50.0758118, 8.2101013`
- **Address/Coord Agreement:** Verified. Fischbacher Straße in Wiesbaden.
- **Classification & Gate Status:** `MOSQUE` / `PUBLISHED` (dry-run). Category: `Mosque`.
- **Contact:** Phone: `+49 611 7244077` | Website: `null`.
- **Operational Evidence:** 36 reviews, 7-day regular opening hours, verified local telephone.
- **Collisions/Duplicates:** None.
- **Recommendation:** **READY**

---

### Record 10: Deutsch Somalischer e.V. - Masjid Abubakar
- **Place ID:** `ChIJscDlq3W-vUcR2x2oNNhis_E`
- **Address:** Hellmundstraße 11, 65183 Wiesbaden
- **Postal Code:** `65183` | **Coordinates:** `50.0798093, 8.2332287`
- **Address/Coord Agreement:** Verified. Hellmundstraße in central Wiesbaden.
- **Classification & Gate Status:** `MOSQUE` / `PUBLISHED` (dry-run). Category: `Mosque`.
- **Contact:** Phone: `+49 611 45031007` | Website: `https://www.masjid-abubakar.de/`.
- **Operational Evidence:** 31 reviews, official community domain `masjid-abubakar.de`, regular 7-day prayer hours.
- **Collisions/Duplicates:** None.
- **Recommendation:** **READY**

---

### Record 11: Islamische Gemeinde Wiesbaden - مسجد السلام (Masjid as-Salam)
- **Place ID:** `ChIJ2Y_SWHW-vUcRvKN0ysXoQOY`
- **Address:** Rheinstraße 75, 65185 Wiesbaden
- **Postal Code:** `65185` | **Coordinates:** `50.0779079, 8.2352517`
- **Address/Coord Agreement:** Verified. Prominent central Rheinstraße facility.
- **Classification & Gate Status:** `MOSQUE` / `PUBLISHED` (dry-run). Category: `Mosque`.
- **Contact:** Phone: `+49 611 88025577` | Website: `https://igw-hessen.de/`.
- **Operational Evidence:** 95 reviews, official state association website (`igw-hessen.de`), 7-day regular opening hours.
- **Collisions/Duplicates:** None (across from Bosnian center at Rheinstraße 64).
- **Recommendation:** **READY**

---

### Record 12: IGMG Wiesbaden e. V. Mescidi Aksa Moschee
- **Place ID:** `ChIJq0M65gG-vUcRiy2wjVHQHYE`
- **Address:** Kärntner Str. 3, 65187 Biebrich (Wiesbaden)
- **Postal Code:** `65187` | **Coordinates:** `50.0575945, 8.2239018`
- **Address/Coord Agreement:** Verified. Kärntner Straße in Biebrich.
- **Classification & Gate Status:** `MOSQUE` / `PUBLISHED` (dry-run). Category: `Mosque`.
- **Contact:** Phone: `+49 611 39738` | Website: `https://ajanda.igmg.org/place/mescid-i-aksa-camii-13/`.
- **Operational Evidence:** 60 reviews, official IGMG registry listing with confirmed prayer facilities.
- **Collisions/Duplicates:** None.
- **Recommendation:** **READY**

---

### Record 13: Vahdet-Moschee
- **Place ID:** `ChIJv955JAq_vUcRpPic5HU-Ts8`
- **Address:** Helenenstraße 26, 65183 Wiesbaden
- **Postal Code:** `65183` | **Coordinates:** `50.0823809, 8.2343753`
- **Address/Coord Agreement:** Verified. Helenenstraße in Wiesbaden-Westend.
- **Classification & Gate Status:** `MOSQUE` / `PUBLISHED` (dry-run). Category: `Mosque`.
- **Contact:** Phone: `+49 31184 3829` (raw Google artifact) | Website: `null`.
- **Operational Evidence:** 27 reviews (4.7 stars), multiple explicit worship comments (*"Ich finde es super zum Beten"*).
- **Data Quality Note:** The raw telephone number (`+49 31184 3829`) contains an anomalous area code (`031184` does not exist in the German dial plan; Wiesbaden is `0611`). It is retained as a raw value per preservation rules, but flagged for phone verification.
- **Collisions/Duplicates:** None.
- **Recommendation:** **READY** (Facility is genuine; phone requires review).

---

### Record 14: Islam Info Service Wiesbaden e.V.
- **Place ID:** `ChIJQREh3XW-vUcRo7eJv-BM0eU`
- **Address:** Bertramstraße 9, 65183 Wiesbaden
- **Postal Code:** `65183` | **Coordinates:** `50.0797981, 8.2333943`
- **Address/Coord Agreement:** Verified. Bertramstraße in central Wiesbaden.
- **Classification & Gate Status:** `MOSQUE` / `PUBLISHED` (dry-run). Category: `Mosque`.
- **Contact:** Phone: `+49 176 76477777` | Website: `http://www.iis-wiesbaden.de/`.
- **Operational Evidence:** 34 reviews, active website `iis-wiesbaden.de`, mobile contact. Operates regular congregational prayers and community education.
- **Collisions/Duplicates:** None.
- **Recommendation:** **READY**

---

### Record 15: Darul-Taqwa Moschee
- **Place ID:** `ChIJCSjf3HW-vUcR0HjEWRGVzE0`
- **Address:** Helenenstraße 9, 65183 Westend (Wiesbaden)
- **Postal Code:** `65183` | **Coordinates:** `50.0814353, 8.2347635`
- **Address/Coord Agreement:** Verified. Helenenstraße 9, 105 meters south of Vahdet-Moschee (Helenenstraße 26).
- **Classification & Gate Status:** `MOSQUE` / `PUBLISHED` (dry-run). Category: `Mosque`.
- **Contact:** Phone: `null` | Website: `null`.
- **Operational Evidence:** 38 reviews (4.8 stars) from congregants confirming active prayer facility.
- **Collisions/Duplicates:** None. Distinct from Vahdet-Moschee down the street.
- **Recommendation:** **READY**

---

### Record 16: Islamische Gemeinschaft der Bosniaken Wiesbaden e.V.
- **Place ID:** `ChIJaZvb-t-9vUcR88n2ahxjABA`
- **Address:** Rheinstraße 64, 65185 Wiesbaden
- **Postal Code:** `65185` | **Coordinates:** `50.0772616, 8.2361425`
- **Address/Coord Agreement:** Verified. Rheinstraße 64 (Bosnian Džemat Wiesbaden).
- **Classification & Gate Status:** `MOSQUE` / `PUBLISHED` (dry-run). Category: `Mosque`.
- **Contact:** Phone: `+49 1516 4605559` | Website: `null`.
- **Operational Evidence:** 62 reviews (4.9 stars), confirmed Bosnian community mosque.
- **Collisions/Duplicates:** None. Across the avenue from Rheinstraße 75 (70m distance; independent organizations).
- **Recommendation:** **READY**

---

### Record 17: Afghanisch islamischer Kulturverein Wiesbaden
- **Place ID:** `ChIJWYTrj76XvUcRj1EpuYOLVzE`
- **Address:** Erich-Ollenhauer-Straße 4, 65203 Biebrich (Wiesbaden)
- **Postal Code:** `65203` | **Coordinates:** `50.0504358, 8.2328912`
- **Address/Coord Agreement:** Verified. Erich-Ollenhauer-Straße in Biebrich.
- **Classification & Gate Status:** `MOSQUE` / `PUBLISHED` (dry-run). Category: `Mosque, Club`.
- **Contact:** Phone: `null` | Website: `https://afgkv.de/`.
- **Operational Evidence:** 25 reviews, official community domain `afgkv.de` confirming prayer rooms and community gatherings.
- **Collisions/Duplicates:** None.
- **Recommendation:** **READY**

---

### Record 18: Moschee Schierstein (Suspected Duplicate of Record 5)
- **Place ID:** `ChIJOYKxBgCVvUcR0ZVvoTpmab0`
- **Address:** Stielstraße 19, 65201 Schierstein (Wiesbaden)
- **Postal Code:** `65201` | **Coordinates:** `50.0492535, 8.1945839`
- **Address/Coord Agreement:** Coordinates match Stielstraße 19 exactly.
- **Classification & Gate Status:** `MOSQUE` / `PUBLISHED` (dry-run). Category: `Mosque`.
- **Contact:** Phone: `null` | Website: `null`.
- **Operational Evidence:** Only 2 reviews (generic 4 and 5 stars with no text), no opening hours, no telephone, no website.
- **Duplicate Analysis:**
  - **Identical street address:** Both Record 5 and Record 18 are at `Stielstraße 19, 65201 Schierstein`.
  - **Physical distance:** **4.1 meters** apart!
  - **Provenance:** In Google Maps, under Record 18's raw `peopleAlsoSearch` field, the first entry is *Marokkanischer Kulturverein e.V. Badr Moschee* (Record 5).
  - Record 5 is the verified, established mosque at this address with 77 reviews, official phone `+49 611 598386`, and official website `http://www.masjid-badr.de/`.
  - Automated deduplication did not merge them automatically because the tokenized title "moschee schierstein" has 0 token overlap with "marokkanischer badr" (name similarity score = 0).
  - Publishing both records would create two separate mosque listings at the exact same physical address 4 meters apart on the public site.
- **Recommendation:** **HOLD** (Flagged as redundant duplicate pin of Record 5; do not publish alongside Record 5 without physical evidence of a second independent congregation).

---

## 3. Verification of Wiesbaden Postal Configuration (`55246` & `55252`)

### 3.1 Municipal Boundary Verification
- The administrative status of **Mainz-Kostheim** (`55246`) and **Mainz-Kastel** (`55252`) was confirmed:
  - Both districts are officially legally part of the Hessian state capital Wiesbaden (*Landeshauptstadt Wiesbaden*).
  - They were separated from Mainz in 1945 and incorporated into Hesse.
  - Adding `{ min: 55246, max: 55246 }` to Wiesbaden's `postalRanges` correctly models this administrative boundary.

### 3.2 Cross-City Collision & Regression Testing
A dedicated regression test script ([`scripts/phase10a-postal-test.ts`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/scripts/phase10a-postal-test.ts)) was executed to verify that `resolveCanonicalCity` operates correctly without regressions:

| Postal Code | Tested City Context | Expected Canonical | Resolved Canonical | Cross-City Flag | Result |
|:---:|:---|:---|:---|:---:|:---:|
| `65183` | Wiesbaden | Wiesbaden | Wiesbaden | `false` | ✅ PASS |
| `65197` | Wiesbaden | Wiesbaden | Wiesbaden | `false` | ✅ PASS |
| `65201` | Wiesbaden | Wiesbaden | Wiesbaden | `false` | ✅ PASS |
| `55246` | Wiesbaden | Wiesbaden | Wiesbaden | `false` | ✅ PASS |
| `55252` | Wiesbaden | Wiesbaden | Wiesbaden | `false` | ✅ PASS |
| `55116` | Mainz | Mainz | Mainz | `false` | ✅ PASS |
| `55122` | Mainz | Mainz | Mainz | `false` | ✅ PASS |
| `55129` | Mainz | Mainz | Mainz | `false` | ✅ PASS |
| `52070` | Aachen | Aachen | Aachen | `false` | ✅ PASS |
| `23552` | Lübeck | Lübeck | Lübeck | `false` | ✅ PASS |
| `66111` | Saarbrücken | Saarbrücken | Saarbrücken | `false` | ✅ PASS |
| `79098` | Freiburg im Breisgau | Freiburg im Breisgau | Freiburg im Breisgau | `false` | ✅ PASS |

**Result:** 12/12 test cases passed with zero errors. All Mainz core postal codes (`55116–55129`) resolve cleanly to Mainz. Zero cross-city anomalies exist across the entire 12-city candidate dataset.

---

## 4. Publication Impact Preview (Dry-Run Calculation)

Using the existing project architecture, the exact impact of publishing Wiesbaden was calculated for both publication scenarios:

### Scenario A: Full Ingestion (All 18 records published)
- **New published records:** $+18$ (Total: **560** mosques)
- **New published cities:** $+1$ (Total: **15** published cities)
- **City Collection URLs added:** $+3$
  - `/de/moscheen/wiesbaden`
  - `/en/mosques/wiesbaden`
  - `/ar/mosques/wiesbaden`
- **Mosque Detail URLs added:** $+54$ ($18 \text{ mosques} \times 3 \text{ locales}$)
- **Total Sitemap URLs added:** $+57$
- **New Expected Sitemap URL Count:** **1,731 URLs** ($1,674 + 57$)

### Scenario B: Clean Ingestion (17 unique records published; Record 18 held as duplicate)
- **New published records:** $+17$ (Total: **559** mosques)
- **New published cities:** $+1$ (Total: **15** published cities)
- **City Collection URLs added:** $+3$
- **Mosque Detail URLs added:** $+51$ ($17 \text{ mosques} \times 3 \text{ locales}$)
- **Total Sitemap URLs added:** $+54$
- **New Expected Sitemap URL Count:** **1,728 URLs** ($1,674 + 54$)

### 4.1 Canonical & Hreflang Structure Preview
For any published Wiesbaden mosque entity (e.g., `marokkanischer-kulturverein-badr-moschee`):
```html
<!-- German Page: https://moscheeindernaehe.de/de/moschee/wiesbaden/marokkanischer-kulturverein-badr-moschee -->
<link rel="canonical" href="https://moscheeindernaehe.de/de/moschee/wiesbaden/marokkanischer-kulturverein-badr-moschee" />
<link rel="alternate" hreflang="de" href="https://moscheeindernaehe.de/de/moschee/wiesbaden/marokkanischer-kulturverein-badr-moschee" />
<link rel="alternate" hreflang="en" href="https://moscheeindernaehe.de/en/mosque/wiesbaden/marokkanischer-kulturverein-badr-moschee" />
<link rel="alternate" hreflang="ar" href="https://moscheeindernaehe.de/ar/mosque/wiesbaden/marokkanischer-kulturverein-badr-moschee" />
<link rel="alternate" hreflang="x-default" href="https://moscheeindernaehe.de/de/moschee/wiesbaden/marokkanischer-kulturverein-badr-moschee" />
```

For the Wiesbaden City Collection Page:
```html
<!-- German City Hub: https://moscheeindernaehe.de/de/moscheen/wiesbaden -->
<link rel="canonical" href="https://moscheeindernaehe.de/de/moscheen/wiesbaden" />
<link rel="alternate" hreflang="de" href="https://moscheeindernaehe.de/de/moscheen/wiesbaden" />
<link rel="alternate" hreflang="en" href="https://moscheeindernaehe.de/en/mosques/wiesbaden" />
<link rel="alternate" hreflang="ar" href="https://moscheeindernaehe.de/ar/mosques/wiesbaden" />
<link rel="alternate" hreflang="x-default" href="https://moscheeindernaehe.de/de/moscheen/wiesbaden" />
```

### 4.2 Internal Links & Navigation Preview
- **City Directory & Selector:** Wiesbaden will appear alphabetically in the German, English, and Arabic city selectors (`Wiesbaden` / `Wiesbaden` / `فيسبادن`).
- **State Filtering:** Wiesbaden will be grouped under the state of Hesse (*Hessen*), alongside Frankfurt am Main.
- **Search Experience:** Search queries for "Wiesbaden", "Biebrich", "Schierstein", "Kastel", and "Kostheim" will return relevant local mosques.
- **Unpublished Cities Safety:** Routes to other candidate cities (`/de/moscheen/mainz`, `/de/moscheen/aachen`, etc.) remain `404 Not Found` because their registry status remains unpromoted and they have 0 published entities.

---

## 5. Required Verification and Regression Suite Results

All required verification suites were executed against the live workspace:

| Verification Check | Target / Rule | Result | Status |
|:---|:---|:---:|:---:|
| **Vitest Test Suite** | 16 test files / 298 unit & integration tests | **298 / 298 passed** (2.72s) | ✅ PASS |
| **TypeScript Typecheck** | `npx tsc --noEmit` | **0 errors** | ✅ PASS |
| **ESLint** | `npm run lint` | **0 errors / 0 warnings** | ✅ PASS |
| **Data Quality Audit** | `npm run data:audit` (542 published records) | **0 critical violations** | ✅ PASS |
| **Duplicate / Collision Audit** | `npm run data:duplicates` | **0 new collisions** | ✅ PASS |
| **Postal Boundary Tests** | `npx tsx scripts/phase10a-postal-test.ts` | **12 / 12 passed** | ✅ PASS |
| **Sitemap Audit** | `npx tsx scripts/audit-sitemap.ts` | **1,674 URLs verified** | ✅ PASS |
| **Production Dataset Count** | `src/data/mosques.json` unchanged | **542 records** | ✅ PASS |
| **Production Cities Count** | Exactly 14 published cities unchanged | **14 cities** | ✅ PASS |

---

## 6. Pre-Publication Summary & Decision Points

1. **Overall City Gate Assessment:**
   Wiesbaden satisfies all city launch gates (`GATE_A` through `GATE_J`) with **0 blockers and 0 warnings**. Status in automated runner is `READY_FOR_LAUNCH`.
2. **Editorial Decision on Record 18:**
   - **Recommendation:** Publish **17 records** (holding Record 18 as an unverified duplicate pin of Record 5 at Stielstraße 19).
   - This avoids displaying two duplicate mosque listings 4 meters apart at the same street address.
3. **Phone Number Quality Note:**
   - Record 13 (*Vahdet-Moschee*) has an invalid area code string (`+49 31184 3829`) from raw Google Maps data. The phone field can remain as-is or be cleared to `null` prior to publication.
4. **Safety Confirmation:**
   - **Zero production changes applied.** Production contains exactly 542 records across 14 cities.
   - Sitemap remains at exactly 1,674 entries.

---

> [!IMPORTANT]
> **STOP POINT REACHED:** Phase 10A audit is complete. No city has been promoted or published. Awaiting explicit user direction and authorization before any promotion steps are executed.
