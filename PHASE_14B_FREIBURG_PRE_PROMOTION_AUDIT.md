# PHASE 14B — Freiburg im Breisgau Pre-Promotion Audit & Manual Triage

**Project:** MoscheeAtlas  
**Domain:** `https://moscheeindernaehe.de`  
**Execution Date:** 2026-10-25  
**Candidate Dataset:** `freiburg,germany.json` (10 raw records)  
**Status:** AUDIT ONLY (No records promoted, no city enabled, no git commits, no deployment)

---

## 1. Verified Baseline Invariants

Before analyzing the candidate dataset, the physical repository state was verified directly from files and test runner output:

| Metric | Current Invariant Value | Source of Truth | Status |
|---|---|---|---|
| **Published Mosques** | **586** | `src/data/mosques.json` | ✅ Verified |
| **Published Cities** | **18** live cities | `getPublishedCityConfigs()` | ✅ Verified |
| **All Entities** | **643** (586 PUB / 50 REV / 7 REJ) | `src/data/all-entities.json` | ✅ Verified |
| **Canonical Sitemap URLs**| **1,818** | `scripts/audit-sitemap.ts` | ✅ Verified |
| **Vitest Test Suite** | **300 / 300 passed** (16 files) | `npm test` | ✅ Verified |
| **TypeScript Compilation**| **Exit 0 (0 errors)** | `npx tsc --noEmit` | ✅ Verified |
| **ESLint Quality Check** | **0 errors, 0 warnings** | `npm run lint` | ✅ Verified |
| **Production Data Audit** | **100% valid, 0 critical issues** | `npm run data:audit` | ✅ Verified |
| **Freiburg in Mosques Store**| **0 records** | `src/data/mosques.json` | ✅ Isolated |
| **Freiburg in Entities Store**| **0 records** | `src/data/all-entities.json` | ✅ Isolated |
| **Freiburg City Registry**| `status: "DISCOVERED"`, `pubEnabled: false`, `seoIndexable: false` | `src/pipeline/city-registry.ts` | ✅ Disabled |

---

## 2. Comprehensive 10-Record Audit Table

Every record in `freiburg,germany.json` was evaluated individually through the full 9-stage pipeline and manual evidence inspection:

| # | Raw Name | Google Place ID | Normalized Address | Postal & District | Coords (Lat, Lng) | Phone / Web | Reviews & Rating | Primary Evidence & Facility Profile | Pipeline Status | Triage Decision |
|---|---|---|---|---|---|---|---|---|---|---|
| **1** | Villingen | `ChIJiciOGQAbkUcRq_EXWX5w5og` | Bötzinger Str. 31, 79111 Freiburg im Breisgau | 79111 (St. Georgen) | 47.9854444, 7.7868889 | None / None | 0 revs (None) | Name matches distant town (Villingen-Schwenningen, 60km away). Industrial address with 0 reviews and no online presence. | REVIEWED | **HOLD** |
| **2** | IGBD-Gemeinde Freiburg e.V. | `ChIJs__ka7obkUcRU7p2lKdioIA` | Wiechertstraße 2A, 79114 Freiburg im Breisgau | 79114 (Betzenhausen) | 48.0098916, 7.8115288 | None / None | 2 revs (5.0★) | Official Bosnian community mosque (Islamische Gemeinschaft der Bosniaken in Deutschland). Reviews confirm regular Juma Friday prayer. | PUBLISHED | **READY** |
| **3** | Afghan mosque | `ChIJX-_7m4AbkUcRBAYD-TMFgrc` | Liebigstraße 19, 79108 Freiburg im Breisgau | 79108 (Brühl) | 48.0182801, 7.8456291 | None / None | 3 revs (5.0★) | Active local prayer space serving the Freiburg Afghan community in commercial/industrial area Nord. | PUBLISHED | **READY** |
| **4** | Kulturzentrum für Bildung und Integration e.V | `ChIJxU0hg4YckUcReUmvimKL5r8` | Habsburgerstraße 79, 79104 Freiburg im Breisgau (Nord) | 79104 (Nord) | 48.0058896, 7.8555174 | `+497613839999` / None | 15 revs (4.6★) | Dual-category Education Center & Mosque. Reviews confirm congregational prayers and mosque community events ("in der Moschee"). Open 24/7. | PUBLISHED | **READY** |
| **5** | Freiburg-Herdern Mosque | `ChIJKwI2woYckUcRd9ll41_0lBs` | Habsburgerstraße 56a, 79104 Freiburg im Breisgau (Nord) | 79104 (Nord) | 48.0074155, 7.8545597 | None / None | 12 revs (5.0★) | Co-located 15m from Ibad ur Rahman Moschee. Suspected geographical alias pin for Ibad ur Rahman without distinct organizational backing. | PUBLISHED | **HOLD** |
| **6** | Freiburg DITIB Mevlana Moschee e.V. | `ChIJVSJzPAockUcR8zEaSARBeGo` | Rufacher Str. 11, 79110 Freiburg im Breisgau | 79110 (Stühlinger) | 48.012529, 7.8252995 | `+4976148977148` / `ditibfreiburg.de` | 71 revs (4.7★) | Major central DITIB congregation in Freiburg. Established facilities, full contact details, verified operational website. | PUBLISHED | **READY** |
| **7** | Mosque Freiburg | `ChIJ0bXTKD4bkUcR6PlvVTCSmbI` | Rufacher Str. 5, 79110 Freiburg im Breisgau (West) | 79110 (West) | 48.01191, 7.82409 | `+4976159513138` / `bbfverein.de` | 187 revs (4.8★) | Bündnis Bildung Freiburg e.V. (BBF). Located 100m from DITIB Mevlana; distinct institution, active prayer hall, verified website. | PUBLISHED | **READY** |
| **8** | Freiburg Islamic Centre | `ChIJd8c-yXwbkUcRoSi6TKBrAHs` | Hugstetter Str. 36, 79106 Freiburg im Breisgau (West) | 79106 (Stühlinger) | 48.0020861, 7.841709 | `+49761273131` / `izfr.de/Hauptseite` | 352 revs (4.9★) | Islamisches Zentrum Freiburg e.V. (IZFR). Largest mosque center in Freiburg, established prayer hall, daily & Friday prayers, full hours (7 AM–9 PM). | PUBLISHED | **READY** |
| **9** | Qendra Islame Shqiptare Vizion e.V. Freiburg | `ChIJP7gfAAAbkUcR8t1TZft-NqI` | Merdinger Weg 9, 79111 Freiburg im Breisgau | 79111 (St. Georgen) | 47.993746, 7.790008 | `+4917661074008` / `xhamia-vizion.de` | 16 revs (4.7★) | Albanian Islamic Center (Xhamia Vizion). Reviews specifically confirm active Friday congregational prayers with resident Imam (Hoxha). | PUBLISHED | **READY** |
| **10** | Ibad ur Rahman Moschee | `ChIJ-xg0xIYckUcRO6tsryi7_Tc` | Habsburgerstraße 56A, 79104 Freiburg im Breisgau (Nord) | 79104 (Nord) | 48.0073323, 7.854725 | `+497612171372` / None | 137 revs (4.6★) | Registered association (Islamischer Verein Ibad-ur-Rahman e.V.). 137 reviews, active congregational prayer schedules, Eid prayers. | PUBLISHED | **READY** |

---

## 3. Forensic Investigation: Habsburgerstraße 56a

Two records share the exact address `Habsburgerstraße 56a`:

```
Record A: Freiburg-Herdern Mosque (ChIJKwI2woYckUcRd9ll41_0lBs)
  - Coordinates: 48.0074155, 7.8545597
  - Address: Habsburgerstraße 56a, 79104 Freiburg im Breisgau-Nord
  - Phone: None | Website: None
  - Reviews: 12 (star-only ratings, 0 text reviews)

Record B: Ibad ur Rahman Moschee (ChIJ-xg0xIYckUcRO6tsryi7_Tc)
  - Coordinates: 48.0073323, 7.854725
  - Address: Habsburgerstraße 56A, 79104 Freiburg im Breisgau-Nord
  - Phone: +49 761 2171372 | Website: None
  - Reviews: 137 (4.6★, rich text reviews describing Eid and daily prayers)
```

### Forensic Comparison & Analysis:
1. **Physical Proximity:** The two coordinate points are separated by **15 meters**, pointing to the same building plot at Habsburgerstraße 56a.
2. **Context & Identity:** Herdern is the Freiburg district immediately adjacent to northern Habsburgerstraße. "Freiburg-Herdern Mosque" is a generic English descriptive name used by local students and visitors. "Ibad ur Rahman Moschee" is the official registered Islamic association (*Islamischer Verein Ibad-ur-Rahman e.V.*) that maintains the premises.
3. **Plurality vs Alias:** There is no public record of two independent congregations operating concurrently at Habsburgerstraße 56a. All evidence demonstrates that `Freiburg-Herdern Mosque` is a secondary/shadow Google Maps pin for `Ibad ur Rahman Moschee`.
4. **Conservative Triage Recommendation:**
   - Under conservative policy, records should not be prematurely rejected without absolute proof.
   - **Promote:** `Ibad ur Rahman Moschee` (`ChIJ-xg0xIYckUcRO6tsryi7_Tc`) as **READY** (137 reviews, verified local phone `+49 761 2171372`, authentic community activity).
   - **Quarantine:** Place `Freiburg-Herdern Mosque` (`ChIJKwI2woYckUcRd9ll41_0lBs`) on **HOLD** in `all-entities.json`. It will remain excluded from published listings, sitemap, and search pages until either confirmed as an independent room or merged as an alias.

---

## 4. Forensic Investigation: The Villingen Record

```
Record: Villingen (ChIJiciOGQAbkUcRq_EXWX5w5og)
  - Raw Title: "Villingen"
  - Address: Bötzinger Str. 31, 79111 Freiburg im Breisgau, Germany
  - Coordinates: 47.9854444, 7.7868889
  - Category: ["Mosque"]
  - Phone: None | Website: None | Opening Hours: None
  - Reviews: 0 reviews (rating undefined)
  - Description: None
```

### Forensic Findings:
1. **Geographic Inconsistency:** "Villingen" is the name of an entirely separate city (Villingen-Schwenningen in the Black Forest, approximately 60 km east of Freiburg).
2. **Physical Site:** Bötzinger Str. 31 is an industrial/commercial zone in southwest Freiburg (St. Georgen / Haid). No Islamic community association or mosque signage is registered at this address under the name "Villingen".
3. **Data Quality Profile:** The record has 0 reviews, no phone, no website, and no opening hours.
4. **Pipeline Gate Evaluation:** The pipeline automated quality gates correctly flagged this record:
   `"Thin record: Zero reviews, no phone, no website, and no opening hours; held in review queue to avoid thin page indexing"`.
5. **Triage Recommendation:**
   - Place this record on **HOLD** (status: `REVIEWED`) in `all-entities.json`.
   - Do **NOT** publish this record. It remains quarantined and excluded from public outputs.

---

## 5. Audit of the Other Seven Records

1. **IGBD-Gemeinde Freiburg e.V. (`ChIJs__ka7obkUcRU7p2lKdioIA`):**
   - Address: Wiechertstraße 2A, 79114 Freiburg.
   - Evidence: Verified member organization of the Islamic Community of Bosniaks in Germany (IGBD). Reviews explicitly mention regular Friday prayers (Juma). Clean address, distinct coordinates. **READY**.
2. **Afghan mosque (`ChIJX-_7m4AbkUcRBAYD-TMFgrc`):**
   - Address: Liebigstraße 19, 79108 Freiburg.
   - Evidence: Community-maintained prayer facility in industrial North. Coordinates verified inside Freiburg municipal boundary. 3 positive reviews. **READY**.
3. **Kulturzentrum für Bildung und Integration e.V (`ChIJxU0hg4YckUcReUmvimKL5r8`):**
   - Address: Habsburgerstraße 79, 79104 Freiburg.
   - Evidence: Located at #79 (approx. 200m north of #56a). Verified landline `+49 761 3839999`. 15 reviews confirming active mosque operations ("in der Moschee"). **READY**.
4. **Freiburg DITIB Mevlana Moschee e.V. (`ChIJVSJzPAockUcR8zEaSARBeGo`):**
   - Address: Rufacher Str. 11, 79110 Freiburg.
   - Evidence: Major institutional mosque. Verified phone `+49 761 48977148` and active domain `http://www.ditibfreiburg.de`. 71 reviews. **READY**.
5. **Mosque Freiburg / BBF e.V. (`ChIJ0bXTKD4bkUcR6PlvVTCSmbI`):**
   - Address: Rufacher Str. 5, 79110 Freiburg.
   - Evidence: Bündnis Bildung Freiburg e.V., situated at #5 (adjacent to DITIB at #11). Distinct entrance, distinct verified website `https://bbfverein.de`, distinct phone `+49 761 59513138`, 187 reviews. **READY**.
6. **Freiburg Islamic Centre (`ChIJd8c-yXwbkUcRoSi6TKBrAHs`):**
   - Address: Hugstetter Str. 36, 79106 Freiburg.
   - Evidence: Central institution of Islamisches Zentrum Freiburg e.V. (IZFR). 352 reviews (4.9★), verified website `https://www.izfr.de/Hauptseite`, full opening hours, prominent congregational mosque. **READY**.
7. **Qendra Islame Shqiptare Vizion e.V. Freiburg (`ChIJP7gfAAAbkUcR8t1TZft-NqI`):**
   - Address: Merdinger Weg 9, 79111 Freiburg.
   - Evidence: Albanian Islamic cultural and prayer center. Verified mobile phone `+49 176 61074008`, website `http://xhamia-vizion.de`, detailed text reviews praising the Friday sermon and Imam. **READY**.

---

## 6. Summary of Audit Triage Totals

- **Total Source Records:** 10
- **READY for Promotion:** **8 records**
- **HOLD in Review Queue:** **2 records**
  - `ChIJiciOGQAbkUcRq_EXWX5w5og` (Villingen) — Thin record, no reviews/phone/web, generic pin.
  - `ChIJKwI2woYckUcRd9ll41_0lBs` (Freiburg-Herdern Mosque) — Suspected co-located shadow pin at Habsburgerstr. 56a.
- **REJECTED:** **0 records** (both uncertain records held conservatively in quarantine).

---

## 7. Proposed Promotion Manifest (8 Approved Facilities)

When approved for controlled promotion in Phase 14C, promote exactly these 8 facilities:

1. `ChIJd8c-yXwbkUcRoSi6TKBrAHs` — **Freiburg Islamic Centre** (Hugstetter Str. 36)
2. `ChIJ0bXTKD4bkUcR6PlvVTCSmbI` — **Mosque Freiburg** (Rufacher Str. 5)
3. `ChIJ-xg0xIYckUcRO6tsryi7_Tc` — **Ibad ur Rahman Moschee** (Habsburgerstraße 56A)
4. `ChIJVSJzPAockUcR8zEaSARBeGo` — **Freiburg DITIB Mevlana Moschee e.V.** (Rufacher Str. 11)
5. `ChIJP7gfAAAbkUcR8t1TZft-NqI` — **Qendra Islame Shqiptare Vizion e.V. Freiburg** (Merdinger Weg 9)
6. `ChIJxU0hg4YckUcReUmvimKL5r8` — **Kulturzentrum für Bildung und Integration e.V** (Habsburgerstraße 79)
7. `ChIJs__ka7obkUcRU7p2lKdioIA` — **IGBD-Gemeinde Freiburg e.V.** (Wiechertstraße 2A)
8. `ChIJX-_7m4AbkUcRBAYD-TMFgrc` — **Afghan mosque** (Liebigstraße 19)

### Expected Totals Post-Promotion (Phase 14C):
- Published Mosques: $586 + 8 = \mathbf{594}$
- Published Cities: $18 + 1 = \mathbf{19}$
- Total Entities: $643 + 10 = \mathbf{653}$ (594 PUB / 52 REV / 7 REJ)
- Sitemap URLs: $1,818 + 27 = \mathbf{1,845}$ (3 home + 3 hub + 57 city collections + 1,782 detail pages)

---

## 8. Blockers & Unresolved Questions

1. **City Registry Configuration:**
   - Freiburg is currently registered with `status: "DISCOVERED"`, `publicationEnabled: false`, and `seoIndexable: false`.
   - Before publication, an override entry must be added to `city-registry-overrides.json` with `status: "PUBLISHED"`, `publicationEnabled: true`, `seoIndexable: true`.
2. **Arabic Translation in Page Metadata:**
   - Arabic translation `'Freiburg im Breisgau': 'فرايبورغ إم برايسغاو'` already exists in `src/pipeline/translations.ts`.
   - It must also be added to `ARABIC_CITY_NAMES` in `src/app/[locale]/mosques/[city]/page.tsx` during promotion.
3. **Extended City Config Promotion:**
   - Freiburg config must be moved or verified in `CITY_CONFIGS` in `src/pipeline/city-config.ts`.

---

## 9. Recommended Next Phase

Proceed to **Phase 14C — Controlled Freiburg im Breisgau Promotion**:
1. Execute promotion script to import exactly the 8 approved READY records into `src/data/mosques.json` and all 10 records into `src/data/all-entities.json`.
2. Keep the 2 HOLD records strictly quarantined.
3. Enable Freiburg in city configuration and registry overrides.
4. Update regression tests for baseline counts ($594$ mosques, $19$ cities, $653$ entities, $1,845$ sitemap URLs).
5. Run full validation (test suite, TypeScript, ESLint, sitemap audit, build).

---

**Audit only: no records promoted, Freiburg remains non-indexable, raw data unchanged, no commit, no push, and no deployment.**
