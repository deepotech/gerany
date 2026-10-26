# Phase 12A — Aachen Pre-Promotion Audit Report

**Project:** MoscheeAtlas (`C:\Users\HP\Desktop\Germany Mosque Finder`)  
**Date:** 2026-10-25  
**Stage:** Phase 12A — Candidate City Pre-Promotion Audit (Aachen)  
**Strict Directives:** Audit only. Zero modifications to published datasets, zero promotions, zero commits, zero pushes, zero deployments.

---

## 1. Executive Summary

A comprehensive pre-promotion audit of Aachen was conducted based on the raw dataset `aachen,germany.json` (12 records) and the verified baseline established after the Lübeck promotion.

### Key Audit Findings
- **Raw Input:** Exactly **12 records** in `aachen,germany.json`.
- **Readiness Classification:**
  - **READY (9 records):** Genuine, verified mosques with full addresses, official contact/web presence, and no co-location conflicts.
  - **HOLD (2 records):**
    1. `Masjid As-Sunnah` (`ChIJe_pj22eZwEcRTuI3E3h_3jg`): Confirmed active mosque, but missing discrete street field leads to normalizer address distortion (`"52070 Aachen, 52070 Aachen (Germany), Germany"`).
    2. `Nurya Sufyania (A. T. E. D. C)` (`ChIJlVXteACZwEcRnYHTboYQHY4`): Sufi order association premises open only Sundays (11 AM – 4 PM) with 0 reviews; unverified general daily congregational prayer access.
  - **REJECT (1 record):**
    - `Minaret Aachen Central Mosque Ditib` (`ChIJXWdURwCZwEcRDgwXf7lfYgY`): Co-located duplicate architectural pin located **37 meters** from `Aachen Central Mosque` (`ChIJHZuj5VKZwEcRDqgK7_FORTc`) on the same building corner.
- **Cross-City Conflicts:** **0 conflicts** with the 566 published records (including Lübeck and Wiesbaden).
- **Postal Authority Validation:** All 12 facilities fall strictly within official Aachen postal boundaries (52062–52080).
- **Promotion Recommendation:** Aachen is viable for promotion with a clean **9-facility published pool**, placing 2 records on HOLD and 1 on REJECT.

---

## 2. Baseline Confirmation

Prior to auditing Aachen, the current repository state was confirmed:

| Metric | Verified Count | Status |
|---|:---:|---|
| Published Mosques | **566** | Matches [mosques.json](file:///C:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/data/mosques.json) exactly |
| Published Cities | **16** | Matches [src/pipeline/city-config.ts](file:///C:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/pipeline/city-config.ts) exactly |
| Total Entities | **619** | Matches [all-entities.json](file:///C:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/data/all-entities.json) exactly |
| Sitemap Canonical URLs | **1,752** | Verified dynamic generation, 0 duplicates |
| Candidate Cities Status | **Disabled** | All 11 candidate cities return 404 and `isPublishedCity = false` |
| Build Configuration | `cpus: 1` | Retained in `next.config.mjs` for NTFS build stability |
| Working Tree Status | Unmodified | No code or data files altered during this audit |

---

## 3. Comprehensive Record-by-Record Audit (All 12 Raw Records)

Each facility from `aachen,germany.json` was audited against quality gates, deduplication logic, and physical evidence:

### Record 1: Islamic Center Bilal Mosque
- **Place ID:** `ChIJh0sx7YKZwEcRW41xfWOKZDY`
- **Canonical Name:** Islamic Center Bilal Mosque
- **Address:** `Professor-Pirlet-Straße 20, 52074 Aachen, Germany`
- **Coordinates:** `50.7795913, 6.0715432`
- **Phone:** `+49 241 889060` (Normalized: `+49241889060`)
- **Website:** `https://www.izaachen.de/`
- **Opening Hours:** Mon–Fri 12:00–21:00, Sat–Sun 10:00–21:00
- **Evidence & Facility Type:** Historical, prominent congregational mosque and Islamic Center (Islamisches Zentrum Aachen) adjacent to RWTH Aachen University campus. Active daily prayers, Jumu'ah, and community services.
- **Co-Location / Duplicate Check:** 0 collisions within 500m.
- **Classification:** **READY**

### Record 2: Al-Imam-Malik Moschee مسجد الإمام مالك بمدينة آخن
- **Place ID:** `ChIJVUW0AF6ZwEcR5YU6bdKp1xY`
- **Canonical Name:** Al-Imam-Malik Moschee مسجد الإمام مالك بمدينة آخن
- **Address:** `Ottostraße 89, 52070 Aachen, Germany`
- **Coordinates:** `50.7748028, 6.0981131`
- **Phone:** `+49 1590 1225860` (Normalized: `+4915901225860`)
- **Website:** `http://www.imm-moschee.de/`
- **Opening Hours:** Open 24 hours
- **Evidence & Facility Type:** Active Moroccan/Arab community Sunni mosque. Daily congregational prayers, Friday prayers, Quran school.
- **Co-Location / Duplicate Check:** 96m from Eyüp Sultan Moschee (distinct independent organization on different street), 137m from Rudolfstraße.
- **Classification:** **READY**

### Record 3: IGMG Eyüp Sultan Moschee Aachen
- **Place ID:** `ChIJPcI5cWeZwEcRkg9lcWgr2lM`
- **Canonical Name:** IGMG Eyüp Sultan Moschee Aachen
- **Address:** `Adalbertsteinweg 26, 52070 Aachen, Germany`
- **Coordinates:** `50.7743404, 6.0992700`
- **Phone:** *null*
- **Website:** `https://www.igmg.org/`
- **Opening Hours:** Daily 04:30–23:40
- **Evidence & Facility Type:** Active IGMG community mosque located on Aachen's main eastern arterial road. Complete five daily prayers and community infrastructure.
- **Co-Location / Duplicate Check:** 96m from Ottostraße 89 (distinct address and independent umbrella organization).
- **Classification:** **READY**

### Record 4: Aachen Central Mosque
- **Place ID:** `ChIJHZuj5VKZwEcRDqgK7_FORTc`
- **Canonical Name:** Aachen Central Mosque (DITIB Yunus Emre Moschee)
- **Address:** `Stolberger Str. 209, 52068 Aachen, Germany`
- **Coordinates:** `50.7768078, 6.1216409`
- **Phone:** `+49 241 542692` (Normalized: `+49241542692`)
- **Website:** `http://www.yunusemre-aachen.de`
- **Opening Hours:** Daily 10:00–22:00
- **Reviews Count:** 612 reviews
- **Evidence & Facility Type:** Flagship DITIB mosque in Aachen with large purpose-built dome, separate prayer sections for men and women, full wudu facilities, and educational wings.
- **Co-Location / Duplicate Check:** Primary facility record for this complex.
- **Classification:** **READY**

### Record 5: Minaret Aachen Central Mosque Ditib - Yunus Emre Moschee Aachen
- **Place ID:** `ChIJXWdURwCZwEcRDgwXf7lfYgY`
- **Canonical Name:** Minaret Aachen Central Mosque Ditib - Yunus Emre Moschee Aachen
- **Address:** `Elsassstraße 131, 52068 Aachen, Germany`
- **Coordinates:** `50.7771281, 6.1215134`
- **Phone:** *null*
- **Website:** *null*
- **Reviews Count:** 9 reviews
- **Evidence & Facility Type:** **CRITICAL DUPLICATE FINDING**. The facility is situated at the corner of Stolberger Straße and Elsassstraße. Coordinates are exactly **37 meters** from Record 4 (`ChIJHZuj5VKZwEcRDqgK7_FORTc`). The title explicitly refers to the "Minaret" of the same DITIB Yunus Emre complex.
- **Co-Location / Duplicate Check:** Severe same-building duplicate pin. Publishing both would display the same mosque twice in Aachen.
- **Classification:** **REJECT** (Duplicate architectural feature pin of Record 4).

### Record 6: Islamisch Albanisches Kulturzentrum Xhamia Moschee Mosque Aachen
- **Place ID:** `ChIJ15iI1CqfwEcRK8T5wcgZL_c`
- **Canonical Name:** Islamisch Albanisches Kulturzentrum Xhamia Moschee Mosque Aachen
- **Address:** `Eisenbahnweg 28, 52068 Aachen, Germany`
- **Coordinates:** `50.7724557, 6.1258385`
- **Phone:** *null*
- **Website:** `https://www.facebook.com/xhamiaachen/`
- **Opening Hours:** Open 24 hours
- **Reviews Count:** 23 reviews
- **Evidence & Facility Type:** Active Albanian Islamic community mosque and cultural association. Five daily prayers, Jumua'h, community events.
- **Co-Location / Duplicate Check:** 0 collisions within 500m.
- **Classification:** **READY**

### Record 7: Mansoor Moschee
- **Place ID:** `ChIJF-P2ijeZwEcRj7EtsqZJyB8`
- **Canonical Name:** Mansoor Moschee
- **Address:** `Feldstraße 47, 52070 Aachen, Germany`
- **Coordinates:** `50.7910971, 6.1141011`
- **Phone:** `+49 1573 4296880` (Normalized: `+4915734296880`)
- **Website:** *null*
- **Opening Hours:** Not specified in raw data
- **Evidence & Facility Type:** Active purpose-built Ahmadiyya mosque in Aachen-Haaren. Dedicated prayer halls and minaret.
- **Co-Location / Duplicate Check:** 0 collisions within 500m.
- **Classification:** **READY**

### Record 8: Masjid As-Sunnah
- **Place ID:** `ChIJe_pj22eZwEcRTuI3E3h_3jg`
- **Canonical Name:** Masjid As-Sunnah
- **Raw Address:** `52070 Aachen, Germany`
- **Raw Street:** `null` (literal string "null")
- **Raw Postal Code:** `null` (literal string "null")
- **Coordinates:** `50.7772529, 6.0971805`
- **Phone:** `+49 1520 8701517` (Normalized: `+4915208701517`)
- **Reviews Count:** 74 reviews
- **Evidence & Facility Type:** Reviews unequivocally confirm active congregational prayer and community operations:
  - *"صليت به الجمعة الماضية مع الشيخ المغربي بارك الله في من قام على هدا المقام"* (Attended Friday prayer).
  - *"Mosque with room for women, just ask the Imam for a key and they'll open it for you"*.
- **Address Formatting Concern:** Because the discrete raw fields `street` and `postalCode` contain literal `"null"` strings, the pipeline's regex extractor recovers the postal code (`52070`) from the raw address string, but defaults the street name to `"52070 Aachen"`. Consequently, the pipeline formats the output address as:
  `"52070 Aachen, 52070 Aachen (Germany), Germany"`
  While the postal code (52070) is 100% valid within Aachen (52062–52080), the distorted street name degrades public presentation.
- **Classification:** **HOLD** (Genuine mosque, but held until clean address formatting or street verification is established).

### Record 9: Nurya Sufyania (A. T. E. D. C)
- **Place ID:** `ChIJlVXteACZwEcRnYHTboYQHY4`
- **Canonical Name:** Nurya Sufyania (A. T. E. D. C)
- **Address:** `Rudolfstraße 65-67, 52070 Aachen, Germany`
- **Coordinates:** `50.7758648, 6.0990872`
- **Phone:** *null*
- **Website:** *null*
- **Opening Hours:** Sunday only: 11:00 AM – 4:00 PM; Closed Monday through Saturday
- **Reviews Count:** 0 reviews
- **Evidence & Facility Type:** A.T.E.D.C. corresponds to "Association Tariqa El-Drissia Chadhilia". The premises operate as a private Sufi order meeting room / Zawiya open once weekly for 5 hours on Sundays. There is no evidence of open daily congregational prayers or general public mosque access.
- **Co-Location / Duplicate Check:** 137m from Ottostraße 89.
- **Classification:** **HOLD** (Insufficient evidence of open congregational mosque status; restricted single-day hours indicate private association premises).

### Record 10: Markaz Imam al Mahdi (ajf.)
- **Place ID:** `ChIJa0TNSgCfwEcR2e2wy49fFJg`
- **Canonical Name:** Markaz Imam al Mahdi (ajf.)
- **Address:** `Von-Coels-Straße 167, 52080 Aachen, Germany`
- **Coordinates:** `50.7780146, 6.1594657`
- **Phone:** *null*
- **Website:** *null*
- **Opening Hours:** Not specified in raw data
- **Reviews Count:** 8 reviews
- **Evidence & Facility Type:** Active Shia Islamic prayer and community center in Aachen-Eilendorf with children's programs and regular religious gatherings.
- **Co-Location / Duplicate Check:** 0 collisions within 500m.
- **Classification:** **READY**

### Record 11: IGBD - Gemeinde Aachen e.V. • Islamska zajednica - Džemat Aachen • Bosnische Moschee Aachen
- **Place ID:** `ChIJY3OyekGfwEcRuwgyz7Sl1ww`
- **Canonical Name:** IGBD - Gemeinde Aachen e.V. • Islamska zajednica - Džemat Aachen • Bosnische Moschee Aachen
- **Address:** `Josefstraße 158, 52080 Aachen, Germany`
- **Coordinates:** `50.7842749, 6.1543533`
- **Phone:** *null*
- **Website:** `https://www.facebook.com/IGBDAachen/`
- **Opening Hours:** Not specified in raw data
- **Evidence & Facility Type:** Official Bosnian Islamic community mosque affiliated with the Islamic Community of Bosniaks in Germany (IGBD). Regular daily prayers, Jumu'ah, religious education.
- **Co-Location / Duplicate Check:** 0 collisions within 500m.
- **Classification:** **READY**

### Record 12: Verband der Islamischen Kulturzentren e.V. (Moschee/Cami)
- **Place ID:** `ChIJxwf5-f2bwEcRT7c3YOFRW0M`
- **Canonical Name:** Verband der Islamischen Kulturzentren e.V. (Moschee/Cami)
- **Address:** `Robert-Koch-Straße 28, 52066 Aachen, Germany`
- **Coordinates:** `50.7685465, 6.1149333`
- **Phone:** `+49 241 962103` (Normalized: `+49241962103`)
- **Website:** `https://www.vikz.de/`
- **Opening Hours:** Not specified in raw data
- **Evidence & Facility Type:** Active VIKZ branch mosque and student cultural boarding center in Aachen. Daily prayers, Friday congregational prayers, and community boarding facilities.
- **Co-Location / Duplicate Check:** 0 collisions within 500m.
- **Classification:** **READY**

---

## 4. Deep-Dive: Known Issues Resolution

### 4.1 Masjid As-Sunnah (`ChIJe_pj22eZwEcRTuI3E3h_3jg`)
- **Raw Address Verification:** Confirmed that raw `address` is `"52070 Aachen, Germany"`. The postal code `52070` is explicitly present in the address string.
- **Schema & Normalizer Behavior:**
  - The raw record has discrete fields `"street": "null"` and `"postalCode": "null"`.
  - The pipeline regex correctly parses `52070` as the postal code.
  - However, because the street name is missing, `normalizeAddress()` in `src/pipeline/normalize.ts` uses the city/postal fallback as the street, outputting `"52070 Aachen, 52070 Aachen (Germany), Germany"`.
- **Integrity Rule:** We must **not** fabricate an address or street name. The raw record must remain untouched.
- **Resolution:** Place on **HOLD** until either:
  1. The normalizer is updated to handle postal-only fallback cleanly without duplicate string artifacts (e.g. `"52070 Aachen, Germany"` instead of repeating tokens), or
  2. The facility is reviewed with verified geocoding.

### 4.2 Minaret Aachen Central Mosque (`ChIJXWdURwCZwEcRDgwXf7lfYgY`)
- **Distance Analysis:** Exactly **37 meters** from `Aachen Central Mosque` (`ChIJHZuj5VKZwEcRDqgK7_FORTc`).
- **Identity:** Both pins represent the same physical mosque complex (DITIB Yunus Emre Moschee) situated at the corner of Stolberger Straße 209 and Elsassstraße 131.
- **Resolution:** Place on **REJECT** as a duplicate feature pin to prevent duplicate listing in public search results.

---

## 5. Summary Readiness Classification Table

| # | Place ID | Facility Name | Postal Code | Quality Classification | Justification |
|:---:|---|---|:---:|:---:|---|
| 1 | `ChIJh0sx7YKZwEcRW41xfWOKZDY` | Islamic Center Bilal Mosque | 52074 | **READY** | Established historical campus mosque; complete data |
| 2 | `ChIJVUW0AF6ZwEcR5YU6bdKp1xY` | Al-Imam-Malik Moschee | 52070 | **READY** | Active Moroccan Sunni mosque; verified web & phone |
| 3 | `ChIJPcI5cWeZwEcRkg9lcWgr2lM` | IGMG Eyüp Sultan Moschee Aachen | 52070 | **READY** | Active IGMG branch mosque; extensive opening hours |
| 4 | `ChIJHZuj5VKZwEcRDqgK7_FORTc` | Aachen Central Mosque | 52068 | **READY** | Primary DITIB Yunus Emre complex; 612 reviews |
| 5 | `ChIJXWdURwCZwEcRDgwXf7lfYgY` | Minaret Aachen Central Mosque Ditib | 52068 | **REJECT** | Co-located duplicate pin (37m from Record 4) |
| 6 | `ChIJ15iI1CqfwEcRK8T5wcgZL_c` | Islamisch Albanisches Kulturzentrum | 52068 | **READY** | Active Albanian community mosque; complete data |
| 7 | `ChIJF-P2ijeZwEcRj7EtsqZJyB8` | Mansoor Moschee | 52070 | **READY** | Active Ahmadiyya mosque; verified phone |
| 8 | `ChIJe_pj22eZwEcRTuI3E3h_3jg` | Masjid As-Sunnah | 52070 | **HOLD** | Active mosque, but street field is missing causing address distortion |
| 9 | `ChIJlVXteACZwEcRnYHTboYQHY4` | Nurya Sufyania (A. T. E. D. C) | 52070 | **HOLD** | Sufi order zawiya open only Sundays (5 hrs/week); 0 reviews |
| 10 | `ChIJa0TNSgCfwEcR2e2wy49fFJg` | Markaz Imam al Mahdi (ajf.) | 52080 | **READY** | Active Shia community center |
| 11 | `ChIJY3OyekGfwEcRuwgyz7Sl1ww` | IGBD Bosnische Moschee Aachen | 52080 | **READY** | Active Bosnian IGBD congregation |
| 12 | `ChIJxwf5-f2bwEcRT7c3YOFRW0M` | VIKZ Moschee/Cami Aachen | 52066 | **READY** | Active VIKZ branch mosque & student boarding center |

**Audit Totals:**  
- **READY for Promotion:** **9 records**  
- **HOLD:** **2 records**  
- **REJECT:** **1 record**  
- **Total Audited:** **12 records**

---

## 6. Pre-Promotion Impact Projection (For Phase 12B)

When Aachen is promoted in Phase 12B with the recommended 9 READY records:
- **Published Mosques:** 566 → **575** (+9 records).
- **Published Cities:** 16 → **17** (+Aachen).
- **All Entities:** 619 → **631** (+12 entities in `all-entities.json`: 9 PUBLISHED, 2 REVIEWED/HOLD, 1 REJECTED).
- **Sitemap Canonical URLs:**
  - Formula: $3 \text{ home} + 3 \text{ hub} + (17 \text{ cities} \times 3) + (575 \text{ mosques} \times 3) = 3 + 3 + 51 + 1,725 = \mathbf{1,782 \text{ URLs}}$.
  - Net increase from Phase 11B: $1,752 + 3 + 27 = \mathbf{1,782 \text{ URLs}}$ (+30 URLs).
- **Arabic City Name:** `آخن` (already verified in `src/pipeline/translations.ts`).

---

## 7. Quality Gate Validation

The standard data quality audit and duplicate checks were executed:
- `npm run data:audit`: **Exit Code 0** (566 published mosques, 100% valid coordinates, 0 warnings, 0 critical issues).
- `npm run data:duplicates`: **Exit Code 0** (0 exact duplicate IDs, 0 regressions).
- `phase11b-verify-sitemap.ts`: **Exit Code 0** (1,752 canonical URLs, 0 duplicates).
- **Public Output Invariance:** Zero published files, routes, translations, city flags, or sitemap entries were modified during this audit.

---

## 8. Conclusion & Recommendation

Aachen is thoroughly audited and ready for promotion in Phase 12B:
1. Promote **9 READY records** to `src/data/mosques.json`.
2. Place **2 HOLD records** in `src/data/all-entities.json` under `dataStatus: "REVIEWED"`.
3. Place **1 REJECT record** in `src/data/all-entities.json` under `dataStatus: "REJECTED"`.
4. Enable Aachen in city configurations and registry overrides.
5. Zero git commits, pushes, or deployments were performed in Phase 12A.
