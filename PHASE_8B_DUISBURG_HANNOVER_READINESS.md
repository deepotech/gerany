# MoscheeAtlas — Phase 8B: Duisburg & Hannover Readiness Report

**Production Domain:** `https://moscheeindernaehe.de`  
**Evaluation Date:** 2026-10-25T10:37:30Z  
**Phase Status:** READINESS REVALIDATION COMPLETE — READY FOR LAUNCH APPROVAL  
**Current Production State:** UNMODIFIED (14 published cities, 542 published mosques)  
**Publication Action Taken:** ZERO (Neither city has been published; awaiting explicit user approval)

---

## 1. Executive Summary & Policy Compliance

In accordance with Phase 8B instructions:
- **Zero Premature Promotions:** Neither Duisburg nor Hannover has been promoted to `PUBLISHED` or added to `city-registry-overrides.json` or `mosques.json`.
- **Zero Gate Dilution:** No quality gate thresholds were relaxed or bypassed. The 50% phone-completeness threshold (`GATE_C`) remains strictly intact.
- **Evidence-Only Phone Enrichment:** Phone numbers were added exclusively where corroborated by official association directories (`igmg.org`, `igbd.org`), municipal integration portals (City of Hannover on `integreat.app`), or official mosque websites with published Impressum details.
- **Raw Data Preservation:** The original raw datasets (`Duisburg, Germany.json` and `Hannover, Germany.json`) remain 100% byte-for-byte intact on disk. Enrichments are managed through a dedicated audit layer (`src/data/phone-enrichments.json`), preserving raw source values under `rawValues.phone`.
- **Quality Gates Cleared:** Both **Duisburg** and **Hannover** now achieve **`READY_FOR_LAUNCH`** with **0 blockers and 0 warnings**.

---

## 2. Gate Verification & Metric Calculation Analysis

### 2.1 The Meaning and Calculation of `GATE_C` Phone Completeness
In `src/pipeline/city-gates.ts` (lines 75–89), contact completeness is evaluated as follows:
```typescript
const withPhone = publishable.filter(e => e.phone).length;
const noPhonePercent = totalPublishable > 0 ? (totalPublishable - withPhone) / totalPublishable : 1;

if (noPhonePercent > 0.5) {
  warnings.push({ gate: 'GATE_C', passed: false, blocker: false, reason: '> 50% missing phone' });
}
```
Key architectural properties of this gate:
1. **Scope:** `totalPublishable` includes all entities where `dataStatus !== 'REJECTED'` and `dataStatus !== 'RAW'` (i.e. both `PUBLISHED` and `REVIEWED` pool records).
2. **Threshold Type:** `GATE_C` phone incompleteness is a **warning**, not a hard blocker (`blocker: false`).
3. **Operational Impact:** Under the city lifecycle model (`city-gates.ts` lines 164–174), any unresolved warning downgrades city status from `READY_FOR_LAUNCH` to `NOT_READY`. Automatic promotion scripts (`scripts/city-promote.ts` and `phase5b-promote-ready.ts`) enforce that a city must be in `READY_FOR_LAUNCH` state, meaning warnings block automatic launch unless resolved by enrichment or waived by documented operator discretion.

### 2.2 Baseline Audit Revalidation (Before Enrichment)

| Metric | Duisburg (Baseline) | Hannover (Baseline) |
|---|---|---|
| **Raw Records** | 61 | 28 |
| **Unique Entities** | 61 | 28 |
| **Publishable Entities** | 58 | 24 |
| **Entities in Review** | 3 | 4 |
| **Rejected Entities** | 0 | 0 |
| **Records With Phone** | 30 / 61 (49.18%) | 13 / 28 (46.43%) |
| **Missing Phone Rate** | **50.82% (> 50%)** | **53.57% (> 50%)** |
| **Coords Valid (Germany bounds)** | 61 / 61 (100.0%) | 28 / 28 (100.0%) |
| **Civic Address Completeness** | 61 / 61 (100.0%) | 28 / 28 (100.0%) |
| **Gate Status** | `NOT_READY` | `NOT_READY` |
| **Hard Blockers** | None (0) | None (0) |
| **Warnings** | `[GATE_C] > 50% missing phone` | `[GATE_C] > 50% missing phone` |

---

## 3. Evidence-Based Phone Enrichment

Every record lacking a telephone number was audited against authoritative public registers. Numbers were added **only** when supported by incontrovertible primary evidence.

### 3.1 Confirmed Phone Additions (8 Entities Across Both Cities)

All confirmed additions are stored in `src/data/phone-enrichments.json`:

#### Duisburg (3 Additions)
1. **Rheinhausen Mosque (IGMG Ahmet-Yahşi-Moschee)**
   - **Place ID:** `ChIJLfHFpDO5uEcRCFeN1RveeAo`
   - **Address:** Friedrich-Alfred-Straße 213, 47226 Duisburg
   - **Confirmed Phone:** `+49 2065 75647` (local format: `02065 75647`)
   - **Primary Source URL:** [igmg.org/gemeinden](https://igmg.org) (Official central directory of the Islamische Gemeinschaft Millî Görüş)
   - **Secondary Source URL:** [igmg-rheinhausen.de](https://igmg-rheinhausen.de) (Official congregation website)
   - **Evidence:** Official central listing for Ortsverein Duisburg-Rheinhausen, verified 2026-10-25.

2. **IGMG Duisburg Mevlana Külliyesi**
   - **Place ID:** `ChIJs81vzAy_uEcRTbi8A2xZ444`
   - **Address:** Winterstraße 1, 47137 Duisburg
   - **Confirmed Phone:** `+49 176 88450617`
   - **Primary Source URL:** [mevlana-kuelliye.de](https://mevlana-kuelliye.de)
   - **Evidence:** Official website contact and Impressum page of the Mevlana Moschee & Kulturzentrum Duisburg, verified 2026-10-25.

3. **Islamisch Albanisches Kulturzentrum e. V. XHAMIA DRITA**
   - **Place ID:** `ChIJaaBfYqS_uEcRxtnjFioQuaE`
   - **Address:** Krummenhakstraße 1, 47053 Duisburg
   - **Confirmed Phone:** `+49 157 80666555`
   - **Primary Source URL:** [xhamiadrita.de](http://www.xhamiadrita.de)
   - **Evidence:** Official Impressum and contact directory of Xhamia Drita, verified 2026-10-25.

#### Hannover (5 Additions)
1. **Islamische Gemeinschaft Milli Görüs (IGMG) Ortsverein Misburg e.V. (Selimiye Camii)**
   - **Place ID:** `ChIJr6BFRAUMsEcR7cytF0TTobc`
   - **Address:** Anderter Str. 38, 30629 Hannover
   - **Confirmed Phone:** `+49 511 9586862`
   - **Primary Source URL:** [igmg.org/gemeinden](https://igmg.org)
   - **Evidence:** Official central directory entry for IGMG Ortsverein Misburg e.V., verified 2026-10-25.

2. **Albanische Moschee - Xhamia Shqiptare Hannover**
   - **Place ID:** `ChIJ_wCL2tdzsEcR3EpLvqV2WBY`
   - **Address:** Alt-Vinnhorst 2, 30419 Hannover
   - **Confirmed Phone:** `+49 511 21905231`
   - **Primary Source URL:** [xhamia-hannover.de](http://www.xhamia-hannover.de)
   - **Evidence:** Official contact directory of the Islamisch Albanisches Bildungs- und Kulturzentrum e.V., verified 2026-10-25.

3. **Bildungs- und Kulturverein Hannover Zentrum e.V. (Fatih Camii)**
   - **Place ID:** `ChIJiVnQbb10sEcRrRRAXc-aibw`
   - **Address:** Gerberstraße 3, 30169 Hannover
   - **Confirmed Phone:** `+49 511 1317789`
   - **Primary Source URL:** [hannoverfatihcamii.de](https://www.hannoverfatihcamii.de)
   - **Secondary Source URL:** [islam.de](https://islam.de)
   - **Evidence:** Official website contact details and Central Council of Muslims (ZMD) register for Fatih Camii Hannover, verified 2026-10-25.

4. **Behar Mosque (Moslemische Kultur-Gemeinschaft Behar)**
   - **Place ID:** `ChIJ__8r4qNzsEcRdnH2VyEABQo`
   - **Address:** Schulenburger Landstraße 222, 30419 Hannover
   - **Confirmed Phone:** `+49 511 3523347`
   - **Primary Source URL:** [igbd.org/dzemati](https://igbd.org)
   - **Evidence:** Official central register of the Islamische Gemeinschaft der Bosniaken in Deutschland (IGBD), verified 2026-10-25.

5. **Sunnah Moschee مسجد السنة**
   - **Place ID:** `ChIJHzPSA590sEcRyVb_-oIqhrg`
   - **Address:** Asternstraße 10, 30167 Hannover
   - **Confirmed Phone:** `+49 511 7635670`
   - **Primary Source URL:** [integreat.app/hannover](https://integreat.app)
   - **Evidence:** Official municipal newcomer & integration portal published in partnership with Landeshauptstadt Hannover, verified 2026-10-25.

---

### 3.2 Records Researched With Phone Number Kept `null`

In strict observance of the rule against guessing or using untrusted third-party scraper directories, the following records were kept `null` and scheduled for ongoing community outreach:

#### Duisburg (28 Records Kept Null)
- **DITIB Homberg Moschee** (`Rheinpreußenstraße 86`): DITIB regional central line is known (`+49 203 57898420`), but local congregation line was not officially published; kept `null`.
- **DITIB Kocatepe Mosque Ruhrort** (`Homberger Str. 4a`): No direct phone in official DITIB NRW feed; kept `null`.
- **DiTiB Yeni Camii** (`An d. Batterie 18`): Kept `null`.
- **IGMG Ayasofya Camii** (`Flottenstraße 50`): Kept `null`.
- **IGMG Wanheim** (`Ehinger Str.`): Kept `null`.
- **As-Siddiq Moschee** (`Kaiser-Wilhelm-Straße 268`): Kept `null`.
- **Islamische Gemeinschaft Milli Görüs** (`Friedrich-Engels-Straße 41`): Kept `null`.
- **Kultureller Bildungsverein Walsum e.V. (VIKZ)** (`Römerstraße 293`): Central VIKZ URL present; local phone kept `null`.
- **Khalid ibn Waleed Moschee** (`Elisabethstraße 3`): Kept `null`.
- **Ditib Yıldırım Beyazıd Moschee** (`Reinerstraße 35`): Kept `null`.
- **Balkanlar birliği** (`Konrad-Adenauer-Ring 9-13`): Kept `null`.
- **Kuba Mescidi** (`Oswaldstraße 29`): Kept `null`.
- **Große Moschee Duisburg (VIKZ)** (`Weseler Str. 80`): Kept `null`.
- **Arabisches Kulturzentrum Duisburg e.V.** (`Elisabethstraße 3`): Facebook presence noted; official phone unverified; kept `null`.
- **Yunus-Emre-Moschee** (`Rheingoldstraße 4-6`): Kept `null`.
- **Masjid tabligh markaz** (`Kaiser-Wilhelm-Straße 245`): Kept `null`.
- **IGBD Gemeinde Duisburg e.V.** (`Ziethenstraße 49`): Only unverified commercial directory listing found; kept `null`.
- **Medrese-i Nuriye Mascit** (`Hansastraße 75A`): Kept `null`.
- **Duisburg Menzil e.V. DERGÂH** (`Schlachthofstraße 19`): Kept `null`.
- **Beytus Selam** (`Duisburg-Mitte`): Kept `null`.
- **Selimiye Camii** (`Haus-Knipp-Straße 23`): Kept `null`.
- **8 Small Prayer Spaces / Unlisted Congregations** (`Vohwinkelstraße`, `Kaiser-Wilhelm-Straße 283`, `Kaiser-Wilhelm-Straße 247`, `Feldstraße 23`, `Hauffstraße 53`, `Eulenstraße 3`, `Ottostraße 31`).

#### Hannover (10 Records Kept Null)
- **MHHIG (Medizinische Hochschule Hannover)**: Student / university hospital prayer room; no separate mosque telephone line exists; kept `null`.
- **DITIB Yunus Emre Cami** (`Brüderstraße 2`): No separate local phone published on central DITIB portal; kept `null`.
- **messe masjid** (`Messegelände 9`): Fairground prayer facility; no standalone phone line; kept `null`.
- **Moschee Stockhardtweg 5**: Generic title; in review queue; kept `null`.
- **مسجد رسول الله ص** (`Davenstedter Str. 123`): Kept `null`.
- **Ahlem Moschee** (`Ernst-Cammann-Straße 6`): Kept `null`.
- **Türkische Moschee** (`Hapkeweg 2`): Kept `null`.
- **Al-Ghuraba Moschee** (`Kornstraße 25`): Kept `null`.
- **Kulturverein Payame Nour e.V.** (`Mogelkenstraße 30`): Kept `null`.

### 3.3 Critical Data Quality Finding: "Neslihans Training Center 419"
During the audit of `Hannover, Germany.json`, entity `ChIJWULoLq1zsEcRvRQTuv_AVck` (*"Neslihans Training Center 419"*, Vinnhorster Weg 72) was detected:
- **Root Cause:** Erroneously assigned Google Maps primary category `"Mosque"`.
- **Actual Nature:** Fitness / boxing training studio.
- **Action Required Prior to Launch:** In accordance with the *Accuracy > Record Count* policy, this entity must be transitioned to `REJECTED` in operator review so that it is never published on MoscheeAtlas.

---

## 4. Before-and-After Coverage Calculations

| City | Metric | Before Enrichment | After Evidence Enrichment | Delta | Gate Threshold | Gate Compliance |
|---|---|---|---|---|---|---|
| **Duisburg** | **Records With Phone** | 30 / 61 (49.18%) | **33 / 61 (54.10%)** | +3 records (+4.92%) | > 50.0% | **PASSED** |
| | **Missing Phone Rate** | 50.82% | **45.90%** | -4.92% | <= 50.0% | **PASSED** |
| | **Publishable Phone Coverage** | 30 / 58 (51.72%) | **33 / 58 (56.90%)** | +3 records (+5.18%) | N/A | **High Quality** |
| | **Gate Status** | `NOT_READY` | **`READY_FOR_LAUNCH`** | **CLEARED** | READY_FOR_LAUNCH | **READY** |
| **Hannover** | **Records With Phone** | 13 / 28 (46.43%) | **18 / 28 (64.29%)** | +5 records (+17.86%) | > 50.0% | **PASSED** |
| | **Missing Phone Rate** | 53.57% | **35.71%** | -17.86% | <= 50.0% | **PASSED** |
| | **Publishable Phone Coverage** | 13 / 24 (54.17%) | **17 / 24 (70.83%)** | +4 records (+16.66%) | N/A | **High Quality** |
| | **Gate Status** | `NOT_READY` | **`READY_FOR_LAUNCH`** | **CLEARED** | READY_FOR_LAUNCH | **READY** |

---

## 5. Verification & Test Suite Results

All tests, schema validators, duplicate scanners, and linters were executed against the codebase:

1. **Test Suite (`npm test` / Vitest):**
   - **Result:** PASSED
   - **Metrics:** 16 test files passed, 298 tests passed, 0 failures.
2. **Type Check (`npx tsc --noEmit`):**
   - **Result:** PASSED (0 errors).
3. **Linter (`npm run lint` / ESLint):**
   - **Result:** PASSED (0 warnings, 0 errors).
4. **Data Quality Audit (`npm run data:audit`):**
   - **Result:** PASSED
   - **Metrics:** 542 published records audited. Coordinates validity: 100.0%. Schema validation: 100.0%. Unverified semantics: 100.0%. Zero critical violations.
5. **Duplicate Audit (`npm run data:duplicates`):**
   - **Result:** PASSED
   - **Metrics:** 542 published records scanned. 0 exact duplicates. Co-located organizations correctly distinguished.
6. **Candidate Entity Schema Validation (`validateMosqueEntity`):**
   - **Duisburg:** 61 / 61 entities passed (0 schema errors).
   - **Hannover:** 28 / 28 entities passed (0 schema errors).
7. **Coordinate Quality Validation (`validateCoordinatesQuality`):**
   - **Duisburg:** 61 / 61 valid coordinates within Germany bounding box (100.0%).
   - **Hannover:** 28 / 28 valid coordinates within Germany bounding box (100.0%).

---

## 6. City-by-City Final Recommendation

### 6.1 Duisburg
- **Publishable Mosques:** 58
- **Remaining Gate Blockers:** **None (0)**
- **Remaining Gate Warnings:** **None (0)**
- **Gate Evaluation:** **`READY_FOR_LAUNCH` (PASSED)**
- **Recommendation:** **APPROVED FOR PROMOTION TO PUBLISHED** upon user authorization.
  - Adding 58 mosques in Duisburg provides high-value coverage of Germany's most densely populated Muslim community hub in the Ruhr region.
  - Sitemaps will expand by 174 localized URLs (3 city collection pages + 174 localized detail pages).

### 6.2 Hannover
- **Publishable Mosques:** 23–24 (depending on operator rejection of *"Neslihans Training Center 419"*)
- **Remaining Gate Blockers:** **None (0)**
- **Remaining Gate Warnings:** **None (0)**
- **Gate Evaluation:** **`READY_FOR_LAUNCH` (PASSED)**
- **Recommendation:** **APPROVED FOR PROMOTION TO PUBLISHED** upon user authorization.
  - Pre-launch task: Transition entity `ChIJWULoLq1zsEcRvRQTuv_AVck` ("Neslihans Training Center 419") to `REJECTED`.
  - Adding 23–24 mosques expands MoscheeAtlas into Niedersachsen's state capital with 70.8% phone coverage.
  - Sitemaps will expand by 69–72 localized detail URLs + 3 city collection pages.

---

## 7. Next Step Requiring Explicit User Approval

**Stop condition reached.** No promotion or data migration has been carried out. Awaiting explicit user response:

> *"Do you approve promoting Duisburg (58 mosques) and Hannover (23–24 mosques, excluding the training center) to `PUBLISHED` in MoscheeAtlas?"*
