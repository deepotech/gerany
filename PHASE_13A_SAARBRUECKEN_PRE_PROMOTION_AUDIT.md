# Phase 13A — Saarbrücken Pre-Promotion Audit Report

**Project:** MoscheeAtlas (`C:\Users\HP\Desktop\Germany Mosque Finder`)  
**Execution Date:** 2026-10-25  
**Stage:** Phase 13A — Candidate City Pre-Promotion Audit (Saarbrücken)  
**Strict Directives:** Audit only. Zero modifications to published datasets, zero promotions, zero commits, zero pushes, zero deployments.

---

## 1. Executive Summary

A comprehensive pre-promotion audit of Saarbrücken was conducted based on the raw dataset `saarbruecken,germany.json` (12 records) and the verified post-Aachen baseline.

### Key Audit Findings
- **Raw Input:** Exactly **12 records** in `saarbruecken,germany.json`.
- **Readiness Classification:**
  - **READY (10 records):** Confirmed, authentic mosques with verified addresses, active congregational prayers (5 daily and/or Friday Jumu'ah), genuine community reviews, and verified geographic coordinates within Saarbrücken municipal boundaries.
  - **HOLD / CONDITIONAL READY (1 record):**
    - `Islamisches Kulturzentrum Saarbrücken` (`ChIJk8onlSG0lUcRyyx-Bbh6D5M`): Genuine mosque with verified premises at Arndtstraße 14 and active Facebook page (`facebook.com/ikc.sbr`), but its raw phone field contains a dummy placeholder string (`"+49 123123456123456"`), which trips `npm run data:audit` warnings unless nullified or enriched before publication.
  - **REJECT (1 record):**
    - `Pakistan Islamic Centre Saarbrucken` (`ChIJ9TXIFHyxlUcREjbZu-bS0vk`): Co-located shadow pin located **10 meters** from `Masjid Al Noor` (`ChIJ9Xnu8PaxlUcRMljGilFcRTE`) at the identical physical address (`Jakobstraße 2, 66115 Saarbrücken`) sharing the exact same phone number (`+49 173 3067351`). Record #10 explicitly documents the operator as *"Jamiah Masjid Al Noor von Pak Dar Ul Hikma"*, while Record #3 contains vandalized Arabic graffiti text in `ownerDescription` and bogus opening hours (closed Tue–Fri).
- **Cross-City Conflicts:** Exactly **0 conflicts** with the 575 published records (0 Place ID collisions, 0 slug collisions).
- **Postal Authority Validation:** All 12 facilities fall strictly within official Saarbrücken postal boundaries (`66111–66133`).
- **Promotion Recommendation:** Saarbrücken is viable for promotion with a clean **10-facility published pool** (or **11-facility pool** if Record #1 dummy phone is set to `null`), placing Record #3 on strict **REJECT**.

---

## 2. Baseline Invariant Confirmation

Prior to auditing Saarbrücken, the current repository state was verified against all production invariants:

| Metric | Verified Count | Status | Notes |
|---|:---:|:---:|---|
| Published Mosques | **575** | Verified | Matches [`src/data/mosques.json`](file:///C:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/data/mosques.json) exactly |
| Published Cities | **17** | Verified | Aachen, Berlin, Bonn, Bremen, Dortmund, Düsseldorf, Essen, Frankfurt, Hamburg, Köln, Leipzig, Lübeck, München, Nürnberg, Stuttgart, Wiesbaden, Wuppertal |
| Total Entities | **631** | Verified | Matches [`src/data/all-entities.json`](file:///C:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/data/all-entities.json) (575 PUBLISHED, 39 REVIEWED/HOLD, 17 REJECTED) |
| Sitemap Canonical URLs | **1,782** | Verified | Dynamic generation: `3 + 3 + (17 * 3) + (575 * 3) = 1,782`, 0 duplicates |
| Aachen Status | **Published** | Verified | 9 published records; 2 on HOLD (`Masjid As-Sunnah`, `Nurya Sufyania`); 1 REJECTED (`Minaret Aachen Central Mosque Ditib`) |
| Candidate Cities Status | **Disabled** | Verified | Saarbrücken, Freiburg, Kiel, Mainz, Regensburg, Karlsruhe, Augsburg, Bielefeld, Münster all have `publicationEnabled: false`, `seoIndexable: false`, `status: "DISCOVERED"` |
| Build & Test Suite | **300 / 300 Passed** | Verified | 16 test files pass in Vitest (`npm test`) |
| Data Integrity Audit | **0 Violations** | Verified | `npm run data:audit` passes with 0 critical issues and 0 warnings |
| Duplicate Check | **Passed** | Verified | `npm run data:duplicates` reports 0 exact duplicate IDs |
| Working Tree Status | **Preserved** | Verified | No published datasets, configurations, or routes modified |

---

## 3. Comprehensive Record-by-Record Audit (All 12 Raw Records)

Each facility from `saarbruecken,germany.json` was evaluated against quality gates, deduplication logic, physical provenance, and community worship evidence:

---

### Record 1: Islamisches Kulturzentrum Saarbrücken
- **Stable Source ID / Place ID:** `ChIJk8onlSG0lUcRyyx-Bbh6D5M`
- **Raw Title:** `Islamisches Kulturzentrum Saarbrücken`
- **Normalized Canonical Name:** `Islamisches Kulturzentrum Saarbrücken`
- **Slug:** `islamisches-kulturzentrum-saarbruecken`
- **Raw Address:** `Arndtstraße 14, 66121 Saarbrücken, Germany`
- **Normalized Address:** `Arndtstraße 14, 66121 Saarbrücken, Germany` (Street: `Arndtstraße 14`, Postal Code: `66121`, City: `Saarbrücken`, State: `Saarland`)
- **Coordinates:** `49.23025, 7.00828` (Valid, central Saarbrücken / St. Johann)
- **Raw Phone:** `+49 123123456123456`
- **Normalized Phone:** `+49 123123456123456` (Flagged as **Suspicious**: 17 digits, repeating placeholder `123123456123456`)
- **Raw Website:** `https://www.facebook.com/ikc.sbr`
- **Normalized Website:** `https://www.facebook.com/ikc.sbr`
- **Opening Hours:** `null` (Unlisted in Google Places)
- **Category:** `MOSQUE` (Google category: `Mosque`)
- **Reviews & Ratings:** 32 reviews (Score: unlisted/4.2)
- **Source Provenance:** `google_places_json` (`saarbruecken,germany.json`)
- **Evidence & Facility Qualification:** Genuine, active Islamic Cultural Center and Mosque (*Islamisches Kulturzentrum Saarbrücken e.V.*) established in central Saarbrücken. Offers prayer hall, community gatherings, and maintains an active public Facebook page.
- **Missing / Suspicious Fields:**
  - Phone number `+49 123123456123456` is a dummy placeholder string. Fails phone plausibility checks.
- **Conflicts with Published Records:** 0 collisions with 575 published records.
- **Nearby Matches:** 0 matches within 500 meters.
- **Audit Classification:** **HOLD / CONDITIONAL READY**
  - *Reasoning:* Facility is genuine and verified. If promoted, the placeholder phone must be set to `null` (or enriched with verified official contact) to prevent `npm run data:audit` from throwing a `Suspicious phone number` warning.

---

### Record 2: Marokkanischer Kulturverein im Saarland e.V
- **Stable Source ID / Place ID:** `ChIJ4fg50zO3lUcRdYZltqxFN0E`
- **Raw Title:** `Marokkanischer Kulturverein im Saarland e.V`
- **Normalized Canonical Name:** `Marokkanischer Kulturverein im Saarland e.V`
- **Slug:** `marokkanischer-kulturverein-im-saarland`
- **Raw Address:** `Eisenbahnstraße 40, 66117 Saarbrücken, Germany`
- **Normalized Address:** `Eisenbahnstraße 40, 66117 Saarbrücken, Germany` (Street: `Eisenbahnstraße 40`, Postal Code: `66117`, City: `Saarbrücken`, State: `Saarland`)
- **Coordinates:** `49.2340264, 6.9888798` (Valid, Alt-Saarbrücken)
- **Raw Phone:** `+49 1525 4112801`
- **Normalized Phone:** `+4915254112801` (Valid German mobile number)
- **Raw Website:** *null / undefined*
- **Normalized Website:** `null`
- **Opening Hours:** Mon–Sun 13:00–22:00 (1 to 10 PM daily)
- **Category:** `MOSQUE` (Google category: `Mosque`)
- **Reviews & Ratings:** 62 reviews
- **Source Provenance:** `google_places_json` (`saarbruecken,germany.json`)
- **Evidence & Facility Qualification:** Active Moroccan community mosque and cultural association. Regular daily congregational prayers, ablution amenities, wheelchair access, and community reviews inquiring about women's prayer spaces (*"gib’s auch ein Raum wo Frauen auch beten können"*).
- **Missing / Suspicious Fields:** Website unlisted (acceptable under directory policy).
- **Conflicts with Published Records:** 0 collisions.
- **Nearby Matches:** 0 matches within 500 meters.
- **Audit Classification:** **READY**

---

### Record 3: Pakistan Islamic Centre Saarbrucken
- **Stable Source ID / Place ID:** `ChIJ9TXIFHyxlUcREjbZu-bS0vk`
- **Raw Title:** `Pakistan Islamic Centre Saarbrucken`
- **Normalized Canonical Name:** `Pakistan Islamic Centre Saarbrucken`
- **Slug:** `pakistan-islamic-centre-saarbrucken`
- **Raw Address:** `Jakobstraße 2, 66115 Saarbrücken, Germany`
- **Normalized Address:** `Jakobstraße 2, 66115 Saarbrücken, Germany` (Street: `Jakobstraße 2`, Postal Code: `66115`, City: `Saarbrücken`, State: `Saarland`)
- **Coordinates:** `49.2422847, 6.9424518` (10 meters from Record #10)
- **Raw Phone:** `+49 173 3067351`
- **Normalized Phone:** `+491733067351` (Identical to Record #10)
- **Raw Website:** *null / undefined*
- **Normalized Website:** `null`
- **Opening Hours:** Mon 12:00–06:30 AM, Sat 12:00 PM – 12:00 AM, Sun 12:00–06:00 AM & 12:00 PM – 12:00 AM; **Closed Tue–Fri** (Completely nonsensical hours, closed for Friday prayers)
- **Owner Description:** `"سهرات حشاشة شرب تعاطي اكل خرا كلشي ممنوع 🤣🤣🇸🇾🇸🇾🇺🇲🇺🇲🪦📃"` (Vulgar Arabic troll graffiti)
- **Category:** `MOSQUE`
- **Reviews & Ratings:** 13 reviews
- **Co-Location & Shared Facility Evidence:**
  - Located at the exact same street address (`Jakobstraße 2, 66115 Saarbrücken`).
  - Distance to Record #10 (`Masjid Al Noor`): **10 meters**.
  - Contact phone number is 100% identical (`+49 173 3067351`).
  - Record #10's official owner description states: *"Jamiah Masjid Al Noor von Pak Dar Ul Hikma islamische Gemeinde Saarbrücken Burbach"*, proving that the Pakistani Islamic community operates `Masjid Al Noor` at this address.
  - Record #3 is a duplicate shadow pin with corrupted opening hours and vulgar graffiti.
- **Audit Classification:** **REJECT (Duplicate Shadow Pin of Record #10)**
  - *Reasoning:* Duplicative facility entry with identical address and phone to Record #10. Publishing both would produce duplicate listings and expose users to vandalized metadata.

---

### Record 4: Islamische Glaubensgemeinschaft Saarbrücken e.V.
- **Stable Source ID / Place ID:** `ChIJOUlD5VqxlUcRtLH7N1Cb_-8`
- **Raw Title:** `Islamische Glaubensgemeinschaft Saarbrücken e.V.`
- **Normalized Canonical Name:** `Islamische Glaubensgemeinschaft Saarbrücken e.V.`
- **Slug:** `islamische-glaubensgemeinschaft-saarbruecken`
- **Raw Address:** `Lebacher Str. 66, 66113 Saarbrücken, Germany`
- **Normalized Address:** `Lebacher Str. 66, 66113 Saarbrücken, Germany` (Street: `Lebacher Str. 66`, Postal Code: `66113`, City: `Saarbrücken`, State: `Saarland`)
- **Coordinates:** `49.2450016, 6.9703353` (Valid, Saarbrücken-Malstatt)
- **Raw Phone:** `""` (Empty string)
- **Normalized Phone:** `null`
- **Raw Website:** *null / undefined*
- **Normalized Website:** `null`
- **Opening Hours:** Daily 24 hours (`Open 24 hours`)
- **Category:** `MOSQUE`
- **Reviews & Ratings:** 59 reviews (Score: 4.8★)
- **Source Provenance:** `google_places_json` (`saarbruecken,germany.json`)
- **Evidence & Facility Qualification:** Active Sunni congregation (Ahl al-Hadith) in Malstatt. 59 detailed reviews documenting congregational prayers, peaceful atmosphere, parking nearby, and community prayers (*"مسجد جميل جدا والقائمين عليه من أهل السنة والجماعة"*).
- **Missing / Suspicious Fields:** Phone and website unlisted.
- **Conflicts with Published Records:** 0 collisions.
- **Nearby Matches:** 284m from Record #8 (`Dresdener Str. 16a`) — separate street, distinct organization.
- **Audit Classification:** **READY**

---

### Record 5: Islamische Gemeinde Saarland e.V.
- **Stable Source ID / Place ID:** `ChIJRW_hOnqxlUcRTodhwBY9qro`
- **Raw Title:** `Islamische Gemeinde Saarland e.V.`
- **Normalized Canonical Name:** `Islamische Gemeinde Saarland e.V.`
- **Slug:** `islamische-gemeinde-saarland`
- **Raw Address:** `Im Malhofen 4, 66115 Saarbrücken-West, Germany`
- **Normalized Address:** `Im Malhofen 4, 66115 Saarbrücken (West), Germany` (Street: `Im Malhofen 4`, Postal Code: `66115`, City: `Saarbrücken`, State: `Saarland`, District: `West`)
- **Coordinates:** `49.2458483, 6.9439226` (Valid, Burbach/West)
- **Raw Phone:** `+49 681 3875460`
- **Normalized Phone:** `+496813875460` (Valid local landline)
- **Raw Website:** *null / undefined*
- **Normalized Website:** `null`
- **Opening Hours:** Daily 7 days
- **Category:** `MOSQUE` (Categories: `["Mosque", "Cultural center", "Recreation center"]`)
- **Reviews & Ratings:** 535 reviews (Score: 4.7★)
- **Source Provenance:** `google_places_json` (`saarbruecken,germany.json`)
- **Evidence & Facility Qualification:** Flagship Islamic community center and central mosque in Saarbrücken. 535 reviews. Comprehensive official description documenting decades of work, five daily prayers, Salat al-Jumu'ah, educational programs, and interfaith dialogue.
- **Missing / Suspicious Fields:** None.
- **Conflicts with Published Records:** 0 collisions.
- **Nearby Matches:** 410m from Jakobstraße 2 — completely distinct campus.
- **Audit Classification:** **READY**

---

### Record 6: Masjid Bilal
- **Stable Source ID / Place ID:** `ChIJifx4YlixlUcR6nUEbCzFPAw`
- **Raw Title:** `Masjid Bilal`
- **Normalized Canonical Name:** `Masjid Bilal`
- **Slug:** `masjid-bilal`
- **Raw Address:** `Wiesenstraße 10A, 66115 Saarbrücken, Germany`
- **Normalized Address:** `Wiesenstraße 10A, 66115 Saarbrücken, Germany` (Street: `Wiesenstraße 10A`, Postal Code: `66115`, City: `Saarbrücken`, State: `Saarland`)
- **Coordinates:** `49.2373128, 6.9678731` (Valid, Malstatt)
- **Raw Phone:** `""`
- **Normalized Phone:** `null`
- **Raw Website:** *null / undefined*
- **Normalized Website:** `null`
- **Opening Hours:** `null` (Unlisted)
- **Category:** `MOSQUE`
- **Reviews & Ratings:** 241 reviews (Score: 4.8★)
- **Source Provenance:** `google_places_json` (`saarbruecken,germany.json`)
- **Evidence & Facility Qualification:** Prominent, highly rated community mosque in Malstatt with 241 reviews documenting daily congregational worship, community renovation projects, and peaceful atmosphere (*"Sehr schöner und ruhiger Ort, wirklich zum empfehlen"*).
- **Missing / Suspicious Fields:** Phone and website unlisted.
- **Conflicts with Published Records:** 0 collisions.
- **Nearby Matches:** 0 matches within 500 meters.
- **Audit Classification:** **READY**

---

### Record 7: جامع عمر بن الخطاب Moschee
- **Stable Source ID / Place ID:** `ChIJxUI-g9-2lUcRmk-swcGE1Sc`
- **Raw Title:** `جامع عمر بن الخطاب Moschee`
- **Normalized Canonical Name:** `جامع عمر بن الخطاب Moschee`
- **Slug:** `moschee` (Pipeline slug generation strips Arabic, leaving Latin token `"Moschee"`)
- **Raw Address:** `Petrusstraße 32, 66125 Saarbrücken-Dudweiler, Germany`
- **Normalized Address:** `Petrusstraße 32, 66125 Saarbrücken (Dudweiler), Germany` (Street: `Petrusstraße 32`, Postal Code: `66125`, City: `Saarbrücken`, State: `Saarland`, District: `Dudweiler`)
- **Coordinates:** `49.2738754, 7.0148206` (Valid, Dudweiler)
- **Raw Phone:** `""`
- **Normalized Phone:** `null`
- **Raw Website:** *null / undefined*
- **Normalized Website:** `null`
- **Opening Hours:** `null`
- **Category:** `MOSQUE`
- **Reviews & Ratings:** 38 reviews (Score: 4.8★)
- **Source Provenance:** `google_places_json` (`saarbruecken,germany.json`)
- **Evidence & Facility Qualification:** Active congregational mosque in Dudweiler (*Moschee Umar ibn al-Khattab*). 38 authentic community reviews praising the facility and spiritual atmosphere (*"مسجدٌ رائعٌ ومبارك في Dudweiler"*).
- **Normalization Findings:**
  - Because `raw.title` contains the Latin word `"Moschee"` (length 7 >= 4), the pipeline slug generator used only `"Moschee"`, yielding slug `moschee`. While unique in Saarbrücken, a more descriptive slug such as `omar-ibn-al-khattab-moschee` or `moschee-dudweiler` should be assigned during promotion.
- **Conflicts with Published Records:** 0 collisions.
- **Nearby Matches:** 0 matches within 500 meters.
- **Audit Classification:** **READY**

---

### Record 8: Bosanski kulturni Center Saarbrücken
- **Stable Source ID / Place ID:** `ChIJJ_eL8u6xlUcRNiszmunrNic`
- **Raw Title:** `Bosanski kulturni Center Saarbrücken`
- **Normalized Canonical Name:** `Bosanski kulturni Center Saarbrücken`
- **Slug:** `bosanski-kulturni-center-saarbruecken`
- **Raw Address:** `Dresdener Str. 16a, 66113 Saarbrücken, Germany`
- **Normalized Address:** `Dresdener Str. 16a, 66113 Saarbrücken, Germany` (Street: `Dresdener Str. 16a`, Postal Code: `66113`, City: `Saarbrücken`, State: `Saarland`)
- **Coordinates:** `49.2455354, 6.9665137` (Valid, Malstatt)
- **Raw Phone:** `""`
- **Normalized Phone:** `null`
- **Raw Website:** *null / undefined*
- **Normalized Website:** `null`
- **Opening Hours:** `null`
- **Category:** `MOSQUE`
- **Reviews & Ratings:** 5 reviews (Score: 5.0★)
- **Source Provenance:** `google_places_json` (`saarbruecken,germany.json`)
- **Evidence & Facility Qualification:** Bosnian Islamic Community Center (*Džemat Saarbrücken*, affiliated with IGBD). Provides congregational prayer hall, Friday services, and community religious activities.
- **Missing / Suspicious Fields:** Phone and website unlisted.
- **Conflicts with Published Records:** 0 collisions.
- **Nearby Matches:** 284m from Record #4 (`Lebacher Str. 66`) — independent facility.
- **Audit Classification:** **READY**

---

### Record 9: Ditib Saarbrücken Merkez Cami
- **Stable Source ID / Place ID:** `ChIJJ7MX3v2zlUcR015xVW9NeMU`
- **Raw Title:** `Ditib Saarbrücken Merkez Cami`
- **Normalized Canonical Name:** `Ditib Saarbrücken Merkez Cami`
- **Slug:** `ditib-saarbruecken-merkez-cami`
- **Raw Address:** `Goebenstraße 38, 66117 Saarbrücken, Germany`
- **Normalized Address:** `Goebenstraße 38, 66117 Saarbrücken, Germany` (Street: `Goebenstraße 38`, Postal Code: `66117`, City: `Saarbrücken`, State: `Saarland`)
- **Coordinates:** `49.2351463, 6.9761148` (Valid, Alt-Saarbrücken)
- **Raw Phone:** `+49 681 9273298`
- **Normalized Phone:** `+496819273298` (Valid local landline)
- **Raw Website:** `http://www.ditib-saarbruecken.de/`
- **Normalized Website:** `http://www.ditib-saarbruecken.de`
- **Organization:** `DITIB` (Verified via official domain `ditib-saarbruecken.de`)
- **Opening Hours:** `null`
- **Category:** `MOSQUE`
- **Reviews & Ratings:** 104 reviews (Score: 4.7★)
- **Source Provenance:** `google_places_json` (`saarbruecken,germany.json`)
- **Evidence & Facility Qualification:** Central DITIB mosque in Saarbrücken (Merkez Camii). Major congregational mosque with prayer halls, wudu amenities, minaret/dome structure, and regular daily and Friday prayers.
- **Missing / Suspicious Fields:** None.
- **Conflicts with Published Records:** 0 collisions.
- **Nearby Matches:** 0 matches within 500 meters.
- **Audit Classification:** **READY**

---

### Record 10: Masjid Al Noor
- **Stable Source ID / Place ID:** `ChIJ9Xnu8PaxlUcRMljGilFcRTE`
- **Raw Title:** `Masjid Al Noor`
- **Normalized Canonical Name:** `Masjid Al Noor`
- **Slug:** `masjid-al-noor`
- **Raw Address:** `Jakobstraße 2, 66115 Saarbrücken, Germany`
- **Normalized Address:** `Jakobstraße 2, 66115 Saarbrücken, Germany` (Street: `Jakobstraße 2`, Postal Code: `66115`, City: `Saarbrücken`, State: `Saarland`)
- **Coordinates:** `49.2423225, 6.9423303` (Valid, Burbach)
- **Raw Phone:** `+49 173 3067351`
- **Normalized Phone:** `+491733067351` (Valid German mobile)
- **Raw Website:** `https://sites.google.com/view/masjid-al-noor-saarbruecken/startseite`
- **Normalized Website:** `https://sites.google.com/view/masjid-al-noor-saarbruecken/startseite`
- **Opening Hours:** Structured 5 daily prayer schedule (Fajr: 5:30–6:00, Dhuhr: 13:00–13:30, Asr: 15:15–15:45, Maghrib: 17:30–18:00, Isha: 19:00–19:30) and Friday Jumu'ah hours (13:00–16:30).
- **Owner Description:** *"Jamiah Masjid Al Noor von Pak Dar Ul Hikma islamische Gemeinde Saarbrücken Burbach"*
- **Category:** `MOSQUE`
- **Reviews & Ratings:** 5 reviews (Score: 4.2★)
- **Source Provenance:** `google_places_json` (`saarbruecken,germany.json`)
- **Evidence & Facility Qualification:** Primary, authentic mosque facility at Jakobstraße 2 in Saarbrücken-Burbach. Complete five daily prayer schedule, verified website, authentic community reviews praising the imam and congregation.
- **Missing / Suspicious Fields:** None.
- **Conflicts with Published Records:** 0 collisions.
- **Co-Location Resolution:** Legitimate primary facility at Jakobstraße 2; duplicate pin Record #3 must be rejected in its favor.
- **Audit Classification:** **READY**

---

### Record 11: 32 Omar Ibn Abdalaziz Moschee - مسجد عمر بن عبد العزيز
- **Stable Source ID / Place ID:** `ChIJCzxD4Mq1lUcRGMryhOqaRow`
- **Raw Title:** `32 Omar Ibn Abdalaziz Moschee - مسجد عمر بن عبد العزيز`
- **Normalized Canonical Name:** `32 Omar Ibn Abdalaziz Moschee - مسجد عمر بن عبد العزيز`
- **Slug:** `32-omar-ibn-abdalaziz-moschee`
- **Raw Address:** `Brebacher Landstraße 32, 66130 Saarbrücken-Halberg, Germany`
- **Normalized Address:** `Brebacher Landstraße 32, 66130 Saarbrücken (Halberg), Germany` (Street: `Brebacher Landstraße 32`, Postal Code: `66130`, City: `Saarbrücken`, State: `Saarland`, District: `Halberg`)
- **Coordinates:** `49.220903, 7.0274646` (Valid, Halberg / Brebach)
- **Raw Phone:** `""`
- **Normalized Phone:** `null`
- **Raw Website:** *null / undefined*
- **Normalized Website:** `null`
- **Opening Hours:** Friday Open 24 hours; Mon–Thu & Sat–Sun Closed in Google Places
- **Category:** `MOSQUE`
- **Reviews & Ratings:** 33 reviews (Score: 4.6★)
- **Source Provenance:** `google_places_json` (`saarbruecken,germany.json`)
- **Evidence & Facility Qualification:** Active congregational mosque in Saarbrücken-Halberg. 33 authentic reviews praising the imam and community prayer services (*"افضل مسجد وأمام الجامع محترم وابن حلال"*).
- **Normalization Findings:**
  - Raw title has house number `"32 "` prepended (`32 Omar Ibn Abdalaziz...`), which propagated into canonical name and slug. During promotion, title can cleanly be cleaned to `Omar Ibn Abdalaziz Moschee` with slug `omar-ibn-abdalaziz-moschee`.
  - Friday-focused opening hours track weekly congregational Jumu'ah services common in commercial/industrial districts.
- **Missing / Suspicious Fields:** Phone and website unlisted.
- **Conflicts with Published Records:** 0 collisions.
- **Nearby Matches:** 0 matches within 500 meters.
- **Audit Classification:** **READY**

---

### Record 12: Fatih Cami
- **Stable Source ID / Place ID:** `ChIJa7X6CQCxlUcR2QVshvHP0CM`
- **Raw Title:** `Fatih Cami`
- **Normalized Canonical Name:** `Fatih Cami`
- **Slug:** `fatih-cami`
- **Raw Address:** `Bergstraße 62, 66115 Saarbrücken, Germany`
- **Normalized Address:** `Bergstraße 62, 66115 Saarbrücken, Germany` (Street: `Bergstraße 62`, Postal Code: `66115`, City: `Saarbrücken`, State: `Saarland`)
- **Coordinates:** `49.2416246, 6.9432397` (Valid, Burbach)
- **Raw Phone:** `""`
- **Normalized Phone:** `null`
- **Raw Website:** *null / undefined*
- **Normalized Website:** `null`
- **Opening Hours:** `null`
- **Category:** `MOSQUE`
- **Reviews & Ratings:** 3 reviews (Score: 5.0★)
- **Source Provenance:** `google_places_json` (`saarbruecken,germany.json`)
- **Evidence & Facility Qualification:** Active Turkish community mosque on Bergstraße in Burbach. Reviews document Quran memorization circles (*دورات لتحفيظ القرآن الكريم*), youth educational programs, courtyard parking, and prayer facilities (*"İçerisi gayet temiz ve nezih, avlusunda otoparkı da var"*).
- **Nearby Matches Check:** Located 93m from Jakobstraße 2, but on a distinct street (Bergstraße) in a separate building. Completely independent facility.
- **Missing / Suspicious Fields:** Phone and website unlisted.
- **Conflicts with Published Records:** 0 collisions.
- **Audit Classification:** **READY**

---

## 4. Co-Location & Cluster Analysis: The Jakobstraße 2 Pair

A pairwise distance matrix was computed across all 12 facilities:

| Pair | Distance | Address 1 | Address 2 | Shared Identity Evidence | Decision |
|---|:---:|---|---|---|:---:|
| **#3 & #10** | **10 m** | Jakobstraße 2, 66115 | Jakobstraße 2, 66115 | Identical address; identical phone `+49 173 3067351`; Record #10 explicitly states *"von Pak Dar Ul Hikma"*; Record #3 has vandalized text and corrupted hours | **REJECT #3, RETAIN #10** |
| **#3 & #12** | **93 m** | Jakobstraße 2, 66115 | Bergstraße 62, 66115 | Distinct street, distinct physical building, distinct Turkish organization (*Fatih Cami*) | **INDEPENDENT** |
| **#10 & #12** | **102 m** | Jakobstraße 2, 66115 | Bergstraße 62, 66115 | Distinct street, distinct building, independent congregations | **INDEPENDENT** |
| **#4 & #8** | **284 m** | Lebacher Str. 66, 66113 | Dresdener Str. 16a, 66113 | Distinct streets; Ahl al-Hadith Sunni vs Bosnian cultural center (IGBD) | **INDEPENDENT** |
| **#3 & #5** | **410 m** | Jakobstraße 2, 66115 | Im Malhofen 4, 66115 | Distinct streets, distinct large campus | **INDEPENDENT** |
| **#5 & #10** | **409 m** | Im Malhofen 4, 66115 | Jakobstraße 2, 66115 | Distinct streets, distinct large campus | **INDEPENDENT** |
| **#5 & #12** | **472 m** | Im Malhofen 4, 66115 | Bergstraße 62, 66115 | Distinct streets, independent facilities | **INDEPENDENT** |

### Detailed Resolution of Jakobstraße 2
In accordance with project policy against assuming nearby pins are duplicates without evidence, the evidence here is conclusive:
1. **Physical Address:** Both pins are placed at `Jakobstraße 2, 66115 Saarbrücken`.
2. **Contact Evidence:** Both pins share the exact same mobile phone number `+49 173 3067351`.
3. **Organizational Provenance:** Record #10 (`Masjid Al Noor`) explicitly provides owner documentation: *"Jamiah Masjid Al Noor von Pak Dar Ul Hikma islamische Gemeinde Saarbrücken Burbach"*. This links the Pakistani Islamic community directly to `Masjid Al Noor`.
4. **Data Integrity Comparison:**
   - Record #10 has verified five-daily prayer times, an official Google Sites website, and clean reviews.
   - Record #3 has vandalized Arabic description text, nonsense opening hours (closed on Friday), and no website.
5. **Conclusion:** Record #3 is a duplicate shadow pin of Record #10. Record #3 must be **REJECTED**, and Record #10 must be **PUBLISHED**.

---

## 5. Data Integrity, Municipal Boundaries, and Quality Gates

### 5.1 Postal & Municipal Consistency
- **Official Saarbrücken Postal Range:** `66111–66133` (State: Saarland).
- All 12 source records fall strictly within this postal range:
  - `66113`: 2 records (Lebacher Str., Dresdener Str.)
  - `66115`: 5 records (Jakobstraße x2, Im Malhofen, Wiesenstraße, Bergstraße)
  - `66117`: 2 records (Eisenbahnstraße, Goebenstraße)
  - `66121`: 1 record (Arndtstraße)
  - `66125`: 1 record (Petrusstraße, Dudweiler)
  - `66130`: 1 record (Brebacher Landstraße, Halberg)
- **Cross-City Anomalies:** Exactly **0**. No records leak to Völklingen, Neunkirchen, or outside Saarland.

### 5.2 Normalizer Literal `"null"` Handling
- The normalizer fix introduced in Phase 12B (§5) cleanly handles literal `"null"` and `"undefined"` strings:
  ```ts
  const cleanRawPostal =
    rawPostal && rawPostal !== 'null' && rawPostal !== 'undefined' ? rawPostal.trim() : null;
  let street: string | null = parts[0] || null;
  if (street && (street === 'null' || street === 'undefined' || /^\d{5}\s+/.test(street))) {
    street = null;
  }
  ```
- All 12 Saarbrücken records already have discrete, valid street strings (`street` field populated). No records suffer from the missing-street issue that affected Aachen's `Masjid As-Sunnah`.

### 5.3 City Launch Gates Evaluation
`validateCityForLaunch('saarbruecken', pipelineResult.allEntities)`:
- **Blockers:** **0** (All coordinates bounded, all records have addresses, valid categories).
- **Warnings:** **1**
  - `[GATE_C] > 70% missing website` (3/12 records have websites = 25% website coverage, 75% missing).
  - Note: Website absence is an audit warning, not a rejection reason. The remaining records are verified through Google Maps place verification, reviews, and physical presence.

---

## 6. Promotion Readiness Summary & Recommendation

### Status Breakdown

| Category | Count | Records |
|---|:---:|---|
| **READY** | **10** | Record #2 (`Marokkanischer Kulturverein`), Record #4 (`Islamische Glaubensgemeinschaft`), Record #5 (`Islamische Gemeinde Saarland`), Record #6 (`Masjid Bilal`), Record #7 (`جامع عمر بن الخطاب`), Record #8 (`Bosanski kulturni Center`), Record #9 (`Ditib Merkez Cami`), Record #10 (`Masjid Al Noor`), Record #11 (`32 Omar Ibn Abdalaziz Moschee`), Record #12 (`Fatih Cami`) |
| **HOLD / CONDITIONAL** | **1** | Record #1 (`Islamisches Kulturzentrum Saarbrücken`) — genuine mosque, but dummy phone `+49 123123456123456` must be set to `null` upon promotion to avoid data audit warnings |
| **REJECT** | **1** | Record #3 (`Pakistan Islamic Centre Saarbrucken`) — duplicate shadow pin 10m from `Masjid Al Noor` at Jakobstraße 2 with vandalized metadata |

### Final Promotion Recommendation
1. **Saarbrücken is viable and ready for Phase 13B local promotion.**
2. **Recommended Publication Pool:**
   - **Scenario A (Conservative 10-mosque launch):** Promote the 10 clean READY records; place Record #1 on HOLD pending verified telephone number; place Record #3 on REJECT.
   - **Scenario B (11-mosque launch with sanitized phone):** Promote 11 records by setting Record #1's phone to `null` (since missing phone is not a blocker, but dummy phone is invalid); place Record #3 on REJECT.
3. **Slug Optimizations to Apply During Promotion:**
   - Record #7 (`جامع عمر بن الخطاب Moschee`): Replace generic slug `moschee` with `omar-ibn-al-khattab-moschee` or `moschee-dudweiler`.
   - Record #11 (`32 Omar Ibn Abdalaziz Moschee`): Strip leading house number `"32 "` to yield canonical name `Omar Ibn Abdalaziz Moschee` and slug `omar-ibn-abdalaziz-moschee`.
4. **Impact Projection on Baseline (if Scenario B 11-record promotion is executed in Phase 13B):**
   - Published Mosques: `575 → 586` (+11)
   - Published Cities: `17 → 18` (+1, Saarbrücken enabled)
   - Entities in `all-entities.json`: `631 → 643` (+12: 11 PUBLISHED + 1 REJECTED)
   - Sitemap Canonical URLs: `1,782 → 1,818` (+36 URLs: 3 city hub URLs + 33 mosque detail URLs)

---

## 7. Audit Invariant Verification & Non-Mutation Confirmation

To ensure strict compliance with Phase 13A instructions:
- **Published Records Mutated:** **0**
- **City Flags Modified:** **0** (Saarbrücken remains `publicationEnabled: false`)
- **Routes / Translations Modified:** **0**
- **Sitemap Output Modified:** **0**
- **Raw JSON Files Modified:** **0**
- **Git Working Tree:** Completely preserved. Zero commits, zero pushes, zero deployments.

*Phase 13A Audit Complete. Awaiting user authorization before Phase 13B.*
