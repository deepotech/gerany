# Phase 14E — Münster Pre-Promotion Audit & Triage Report

**Project:** MoscheeAtlas  
**Directory:** `C:\Users\HP\Desktop\Germany Mosque Finder`  
**Domain:** `https://moscheeindernaehe.de`  
**Execution Date:** 2026-10-25  
**Phase Objective:** Conduct a rigorous, evidence-based pre-promotion audit of all 8 candidate records in `muenster,germany.json`, investigate the Palace Square Prayer Room record, and produce a verified promotion manifest.

---

## 1. Verified Baseline State

All figures independently derived from actual files in the repository:

| Metric | Verified Baseline | Verification Source |
|---|---|---|
| **Published Mosques** | **594** | `src/data/mosques.json` |
| **All Entities** | **653** | `src/data/all-entities.json` (594 PUB / 52 REV / 7 REJ) |
| **Published Cities** | **19** | 10 default + 9 in `city-registry-overrides.json` |
| **Sitemap URLs** | **1,845** | `scripts/audit-sitemap.ts` (0 duplicates, 0 invalid) |
| **Münster Raw Records** | **8** | `muenster,germany.json` |
| **Existing Münster Entities** | **0** | No Place IDs present in `mosques.json` or `all-entities.json` |
| **Münster Registry Status** | `DISCOVERED` | `src/pipeline/city-registry.ts` (`publicationEnabled: false`, `seoIndexable: false`) |
| **Current Test Suite** | **300 / 300 passed** | 16 test suites (`npm test`) |
| **Typecheck & Linter** | **0 errors, 0 warnings** | `npx tsc --noEmit` & `npm run lint` |

---

## 2. Record-by-Record Pre-Promotion Audit (All 8 Records)

Every candidate record was evaluated across all pipeline stages: Normalization, Deduplication, Classification, Quality Gates, and Review.

| # | Name | Google Place ID | Postal Code | Coordinates | Reviews | Hours | Pipeline Status | Recommendation |
|---|---|---|:---:|:---:|:---:|---|:---:|:---:|
| 1 | **Palace Square Prayer Room Mosque** | `ChIJd58rTou7uUcRllSptiif6u0` | *(null)* | 51.96466, 7.61350 | 11 | Mon–Fri 7:30–15:30, Sat/Sun Closed | REVIEWED | **HOLD** |
| 2 | **مسجد الرحمن / Arrahmanmoschee** | `ChIJn6ZhH4y6uUcRRdptFyWdN-I` | `48147` | 51.98109, 7.61483 | 158 | Daily 06:00–22:00 | PUBLISHABLE | **READY** |
| 3 | **Sultan Ahmet Camii (VIKZ)** | `ChIJqyE5Bte6uUcRFkRb8Ywf3NY` | `48155` | 51.95227, 7.63727 | 48 | Daily 10:00–22:00 | PUBLISHABLE | **READY** |
| 4 | **Munster Central Mosque (DITIB)** | `ChIJBc5hbdm6uUcRLyetOq73giI` | `48155` | 51.95767, 7.63721 | 239 | Unspecified | PUBLISHABLE | **READY** |
| 5 | **As-Salam Moschee** | `ChIJu8AMms-luUcRVFFEtFUSrZQ` | `48153` | 51.92627, 7.62863 | 80 | Daily 04:00–22:30 | PUBLISHABLE | **READY** |
| 6 | **Ar-Rahmah Moschee** | `ChIJN1qZ4Ly7uUcRx3dZUWMjP5Y` | `48157` | 51.99414, 7.66307 | 36 | Mawaqit timetable | PUBLISHABLE | **READY** |
| 7 | **Bošnjački Džemat Münster - BKZ** | `ChIJYypoZAWjuUcRRokLhDbZu5U` | `48167` | 51.92478, 7.72504 | 11 | Unspecified | PUBLISHABLE | **READY** |
| 8 | **Bait ul Momin Moschee مسجد** | `ChIJX0PIy1OkuUcR-N76U5wLMdQ` | `48165` | 51.89386, 7.63030 | 59 | Open 24 hours | PUBLISHABLE | **READY** |

---

## 3. Detailed Record Evaluations

### Record 1: Palace Square Prayer Room Mosque (HOLD)
- **Place ID:** `ChIJd58rTou7uUcRllSptiif6u0`
- **Raw Address:** `Schloss, Münster, Germany`
- **Normalized Address:** `Schloss, Münster, Germany`
- **Postal Code:** `null`
- **Coordinates:** `51.9646649, 7.6134979` (Situated in the central building of the Fürstbischöfliches Schloss Münster)
- **Phone:** None
- **Website:** None
- **Operating Hours:** Monday–Friday 07:30 to 15:30; Saturday & Sunday Closed.
- **Reviews:** 11 reviews (Rating: 4.3; 9 5-star, 2 1-star; no written commentary).
- **Evidence Analysis:** The coordinates and operating hours strictly match the administrative and lecture facility of the University of Münster (WWU Münster). The restricted weekday hours (ending at 3:30 PM) and weekend closure demonstrate that this is a quiet room / prayer room (*Raum der Stille*) for university students and staff, not an independent community congregational mosque hosting daily prayers and Friday congregational services for the general public.
- **Schema & Quality Gate Evaluation:** The record fails schema validation on `postalCode: Must be a valid German postal code (5 digits, 01000–99999)`.
- **Policy Enforcement:** Postal codes must never be guessed, fabricated, or replaced with a generic city-center code.
- **Recommendation:** **HOLD** (quarantine in `REVIEWED` status). Exclude from public dataset and sitemaps.

---

### Record 2: مسجد الرحمن / Arrahmanmoschee (READY)
- **Place ID:** `ChIJn6ZhH4y6uUcRRdptFyWdN-I`
- **Raw Address:** `Meßkamp 15, 48147 Münster, Germany`
- **Normalized Address:** `Meßkamp 15, 48147 Münster, Germany`
- **Postal Code:** `48147` (Münster-Nord / Coerde)
- **Coordinates:** `51.9810921, 7.6148267` (Inside Münster)
- **Phone:** `+49 1590 1361733` (Sanitizes to `+4915901361733`)
- **Website:** `https://www.facebook.com/p/Arrahmanmoschee-M%C3%BCnster-100080658873179/`
- **Operating Hours:** Daily 06:00 to 22:00
- **Reviews:** 158 reviews (Rating: 4.7). Reviews praise the well-kept prayer hall, welcoming atmosphere, and regular congregational prayers.
- **Evidence Analysis:** Active Sunni congregational mosque serving the northern communities of Münster.
- **Pipeline Stage Results:** Passed Normalization, Classification (MOSQUE), Quality Gates, and Deduplication.
- **Recommendation:** **READY** for promotion.

---

### Record 3: Sultan Ahmet Camii ( Verband Islamischer Kulturzentren e.V. - VIKZ ) (READY)
- **Place ID:** `ChIJqyE5Bte6uUcRFkRb8Ywf3NY`
- **Raw Address:** `Bernhard-Ernst-Straße 7, 48155 Münster, Germany`
- **Normalized Address:** `Bernhard-Ernst-Straße 7, 48155 Münster, Germany`
- **Postal Code:** `48155` (Münster Hansaviertel)
- **Coordinates:** `51.9522741, 7.6372732` (Inside Münster)
- **Phone:** `+49 251 664258` (Sanitizes to `+49251664258`)
- **Website:** `http://www.vikz.de/` (Canonical VIKZ federation portal)
- **Operating Hours:** Daily 10:00 to 22:00
- **Reviews:** 48 reviews (Rating: 4.8). Multiple reviews explicitly confirm Friday Jumu'ah services, hospitality, and daily prayers.
- **Evidence Analysis:** Established community mosque affiliated with VIKZ.
- **Pipeline Stage Results:** Passed Normalization, Classification (MOSQUE), Quality Gates, and Deduplication (600m from DITIB).
- **Recommendation:** **READY** for promotion.

---

### Record 4: Munster Central Mosque (DITIB Münster) (READY)
- **Place ID:** `ChIJBc5hbdm6uUcRLyetOq73giI`
- **Raw Address:** `Bremer Platz 42, 48155 Münster, Germany`
- **Normalized Address:** `Bremer Platz 42, 48155 Münster, Germany`
- **Postal Code:** `48155` (Münster Innenstadt / Hauptbahnhof area)
- **Coordinates:** `51.9576663, 7.6372066` (Inside Münster)
- **Phone:** `+49 251 665810` (Sanitizes to `+49251665810`)
- **Website:** `http://www.ditib-muenster.de/`
- **Operating Hours:** Empty in raw dataset; reviews verify continuous daily congregational worship.
- **Reviews:** 239 reviews (Rating: 4.6). Detailed reviews in German, Turkish, Arabic, and English describe a 3-story active central mosque with wheelchair accessibility and nearby parking.
- **Evidence Analysis:** The primary central mosque of Münster, operated by DITIB.
- **Pipeline Stage Results:** Passed Normalization, Classification (MOSQUE), Quality Gates, and Deduplication.
- **Recommendation:** **READY** for promotion.

---

### Record 5: As-Salam Moschee (READY)
- **Place ID:** `ChIJu8AMms-luUcRVFFEtFUSrZQ`
- **Raw Address:** `Hammer Str. 352, 48153 Münster, Germany`
- **Normalized Address:** `Hammer Str. 352, 48153 Münster, Germany`
- **Postal Code:** `48153` (Münster Berg Fidel / Süd)
- **Coordinates:** `51.9262716, 7.6286266` (Inside Münster)
- **Phone:** None listed in raw dataset
- **Website:** `https://de-de.facebook.com/groups/1490344880987754/photos/`
- **Operating Hours:** Daily 04:00 to 22:30 (covers Fajr through Isha prayers)
- **Reviews:** 80 reviews (Rating: 4.6). Reviews highlight warm hospitality, community programs, and regular prayers.
- **Evidence Analysis:** Active congregational mosque in the southern district of Münster.
- **Pipeline Stage Results:** Passed Normalization, Classification (MOSQUE), Quality Gates, and Deduplication.
- **Recommendation:** **READY** for promotion.

---

### Record 6: Ar-Rahmah Moschee (READY)
- **Place ID:** `ChIJN1qZ4Ly7uUcRx3dZUWMjP5Y`
- **Raw Address:** `Königsberger Str. 260, 48157 Münster-Ost, Germany`
- **Normalized Address:** `Königsberger Str. 260, 48157 Münster (Ost), Germany`
- **Postal Code:** `48157` (Münster-Ost / Coerde-Gelmer)
- **Coordinates:** `51.9941396, 7.6630676` (Inside Münster)
- **Phone:** None listed in raw dataset
- **Website:** `https://mawaqit.net/de/m/arahmah-muenster` (Active Mawaqit timetable platform)
- **Operating Hours:** Governed by Mawaqit live prayer integration.
- **Reviews:** 36 reviews (Rating: 4.7). Reviews document community-wide Eid prayers (including Eid 2026 organized by volunteers) and regular Friday services.
- **Evidence Analysis:** Active congregational mosque with verified real-time prayer schedule.
- **Pipeline Stage Results:** Passed Normalization (district resolved to Ost), Classification (MOSQUE), Quality Gates, and Deduplication.
- **Recommendation:** **READY** for promotion.

---

### Record 7: Bošnjački Džemat Münster - BKZ (READY)
- **Place ID:** `ChIJYypoZAWjuUcRRokLhDbZu5U`
- **Raw Address:** `Münsterstraße 52B, 48167 Münster, Germany`
- **Normalized Address:** `Münsterstraße 52B, 48167 Münster, Germany`
- **Postal Code:** `48167` (Münster-Wolbeck)
- **Coordinates:** `51.9247794, 7.7250407` (Inside Münster)
- **Phone:** None listed in raw dataset
- **Website:** None listed in raw dataset
- **Operating Hours:** Not specified in raw dataset
- **Reviews:** 11 reviews (Rating: 5.0).
- **Evidence Analysis:** Bosnian Islamic community center and prayer hall (BKZ = *Bosnisch-Kulturnes Zentrum* / Džemat Münster), affiliated with the Islamic Community of Bosniaks in Germany (IGBD).
- **Pipeline Stage Results:** Passed Normalization, Classification (MOSQUE), Quality Gates, and Deduplication (>6.6 km from nearest other candidate pin).
- **Recommendation:** **READY** for promotion.

---

### Record 8: Bait ul Momin Moschee مسجد (READY)
- **Place ID:** `ChIJX0PIy1OkuUcR-N76U5wLMdQ`
- **Raw Address:** `Hansestraße 61, 48165 Hiltrup, Germany`
- **Normalized Address:** `Hansestraße 61, 48165 Münster, Germany` (Hiltrup resolved cleanly into Münster)
- **Postal Code:** `48165` (Münster-Hiltrup)
- **Coordinates:** `51.8938567, 7.6302976` (Inside Münster)
- **Phone:** None listed in raw dataset
- **Website:** `http://www.ahmadiyya.de/`
- **Operating Hours:** Open 24 hours
- **Reviews:** 59 reviews (Rating: 4.3). Reviews verify welcoming community and ongoing congregational presence.
- **Evidence Analysis:** Purpose-built Bait-ul-Momin mosque serving Münster-Hiltrup.
- **Pipeline Stage Results:** Passed Normalization, Classification (MOSQUE), Quality Gates, and Deduplication.
- **Recommendation:** **READY** for promotion.

---

## 4. Deduplication & Cross-City Conflict Audit

1. **Exact Duplicate Place IDs:**
   - Evaluated against `src/data/mosques.json` (594 records): **0 collisions**.
   - Evaluated against `src/data/all-entities.json` (653 records): **0 collisions**.
2. **Co-located Addresses:**
   - Zero candidate pairs share a building or street address.
   - Nearest pair: VIKZ Sultan Ahmet Camii (`Bernhard-Ernst-Straße 7`) and DITIB Central Mosque (`Bremer Platz 42`) are separated by **600 meters** and represent distinct major national federations.
   - All other candidate pairs are between 1.8 km and 11.4 km apart.
3. **Administrative Boundaries:**
   - All 8 records are confirmed to fall strictly within the municipal territory of the City of Münster (North Rhine-Westphalia).
   - Localities such as Hiltrup, Wolbeck, and Coerde are official Stadtbezirke of Münster.

---

## 5. Summary of Audit Totals

- **Total Candidates Audited:** 8
- **READY for Promotion:** **7**
- **HOLD (Quarantined):** **1** (`ChIJd58rTou7uUcRllSptiif6u0` — Palace Square Prayer Room Mosque)
- **REJECT:** **0**

---

## 6. Exact Promotion Manifest for Phase 14F

When authorized to promote Münster in Phase 14F, exactly these **7 Place IDs** are approved for publication:

```json
[
  "ChIJn6ZhH4y6uUcRRdptFyWdN-I",
  "ChIJqyE5Bte6uUcRFkRb8Ywf3NY",
  "ChIJBc5hbdm6uUcRLyetOq73giI",
  "ChIJu8AMms-luUcRVFFEtFUSrZQ",
  "ChIJN1qZ4Ly7uUcRx3dZUWMjP5Y",
  "ChIJYypoZAWjuUcRRokLhDbZu5U",
  "ChIJX0PIy1OkuUcR-N76U5wLMdQ"
]
```

### Quarantined Entity (Must NOT be Published):
```json
[
  "ChIJd58rTou7uUcRllSptiif6u0"
]
```
*(Reason: University prayer room; missing postal code; retained as REVIEWED in `all-entities.json`)*

---

## 7. Required Actions for Phase 14F (Promotion Phase)

1. **Registry & Config Updates:**
   - In `src/pipeline/city-config.ts`: Move Münster from `EXTENDED_CITY_CONFIGS` to `CITY_CONFIGS` (or make accessible to runtime lookup).
   - In `src/data/city-registry-overrides.json`: Add `"muenster": { "status": "PUBLISHED", "publicationEnabled": true, "seoIndexable": true, "launchedAt": "<ISO-timestamp>" }`.
   - In `src/app/[locale]/mosques/[city]/page.tsx` & `src/components/MosqueDetailView.tsx`: Add `'Münster': 'مونستر'` to `ARABIC_CITY_NAMES`.
2. **Data Ingestion:**
   - Ingest the 7 approved records into `src/data/mosques.json` (raising total to **601**).
   - Ingest all 8 records (7 `PUBLISHED`, 1 `REVIEWED`) into `src/data/all-entities.json` (raising total to **661**).
3. **Validation & Verification:**
   - Run full regression suites (`npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run data:audit`, `npm run data:duplicates`).
   - Run Next.js production build (`npm run build`) and HTTP route smoke tests.

---

Pre-promotion audit only: no records promoted, Münster remains non-indexable, raw source data unchanged, no commit, no push, and no deployment.
