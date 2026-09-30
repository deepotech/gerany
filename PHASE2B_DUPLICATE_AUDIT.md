# Phase 2B — Duplicate & Co-Location Audit Report

**Date:** 2026-09-29  
**Target:** Germany Mosque Finder (MoscheeAtlas.de)  
**Dataset Analyzed:** 486 unique records across 9 cities (443 PUBLISHED entities)  
**Status:** AUDIT COMPLETE — NON-DESTRUCTIVE FINDINGS & ACTIONABLE RECOMMENDATIONS

---

## 1. Executive Summary

During Phase 2A ingestion, strict deduplication rules prevented duplicate `placeId` occurrences across regional datasets. However, physical inspection of the 443 published entities identified **26 multi-record address groups** and **10 phone-number duplicate clusters**.

In accordance with Phase 2B principles:
- **No data was deleted silently.**
- **No records were merged automatically without verified identity.**
- Co-located religious communities, cultural centers, and multi-lingual listings at identical addresses are categorized and evaluated individually below.

---

## 2. Multi-Signal Detection Breakdown

| Detection Signal | Total Groups | Total Records Involved | Classification Summary |
| :--- | :--- | :--- | :--- |
| **Exact `placeId` duplicates** | **0** | 0 | 100% resolved in multi-city pipeline |
| **Shared Physical Address** | **26 groups** | 56 records | 18 legitimate co-locations, 8 probable duplicates |
| **Shared Phone Number** | **10 groups** | 22 records | 6 multi-organization lines, 4 probable dual-listings |

---

## 3. High-Priority Duplicate Candidates (Probable Duplicates)

The following cases represent likely duplicate representations of the same prayer space or congregation under alternate names:

### 1. Düsseldorf — Hansaallee 376 (Oberkassel / Heerdt)
- **Entity A:** `dusseldorf-central-mosque` (*Dusseldorf Central Mosque*) — PlaceId: `ChIJb6e6K1rIuEcRnJm3a-v_XhA`
- **Entity B:** `moschee-mosque-beyazit-camii` (*Moschee Mosque Beyazit Camii*) — PlaceId: `ChIJb6e6K1rIuEcRnpN3a-v_XhA`
- **Phone:** `+49 211 5381670` (identical)
- **Address:** Hansaallee 376, 40547 Düsseldorf
- **Analysis:** Exact same building and phone. One entry uses an English title (*Central Mosque*) while the other uses German/Turkish (*Moschee Mosque Beyazit Camii*).
- **Recommendation (Phase 3 Manual Review):** Merge canonical metadata under *Beyazıt Camii Düsseldorf*, retain bilingual aliases in `translations`, move secondary placeId to aliases.

### 2. München — Hotterstraße 16 (Altstadt)
- **Entity A:** `muenchner-forum-fuer-islam` (*Münchner Forum für Islam e.V.*) — PlaceId: `ChIJA-E9lvV1nkcRYQZf4E8Ykl0`
- **Entity B:** `marienplatz-mosque` (*Marienplatz Mosque*) — PlaceId: `ChIJYZZSl_V1nkcRQK9FtRPOwdA`
- **Phone:** `+49 89 21269366` (identical)
- **Address:** Hotterstraße 16, 80331 München
- **Analysis:** *Marienplatz Mosque* is the colloquial tourist/visitor moniker for the prayer room at *Münchner Forum für Islam* near Marienplatz.
- **Recommendation:** Retain *Münchner Forum für Islam e.V.* as primary entity; link *Marienplatz Mosque* as an English alias/alternate name.

### 3. München — Neuhauser Str. 18 (City Center)
- **Entity A:** `masjid-on-5th-floor-oberpollinger` (*Masjid on 5th floor Oberpollinger*) — PlaceId: `ChIJj5L7yfl1nkcRh8pGgD8aJpU`
- **Entity B:** `oberpollinger-mescid-moschee` (*Oberpollinger Mescid / Moschee*) — PlaceId: `ChIJ1b-1QPR1nkcRZ7q7bK8T5t8`
- **Address:** Neuhauser Str. 18, 80331 München
- **Analysis:** Both refer to the multi-faith prayer room on the 5th floor of the Oberpollinger department store.
- **Recommendation:** Combine into single record *Gebetsraum Oberpollinger (5. OG)* with category `OTHER` or `MOSQUE`.

### 4. Hamburg — Bahrenfelder Str. 92 (Altona)
- **Entity A:** `mosque-community-altona-ulu-cami` (*Mosque community Altona - Ulu Cami*) — PlaceId: `ChIJu-iK9iCPsUcRc4V7Wq8rD5g`
- **Entity B:** `aktona-ulu-cami` (*Aktona Ulu Cami*) — PlaceId: `ChIJy_mI0h2PsUcRg8f3L5p2CjU`
- **Address:** Bahrenfelder Str. 92, 22765 Hamburg
- **Analysis:** "Aktona" is a typographical error on Google Maps for "Altona". Both represent the DITIB Altona Ulu Cami.
- **Recommendation:** Suppress typo record `aktona-ulu-cami` into `REVIEWED`, keeping `mosque-community-altona-ulu-cami`.

### 5. Köln — Höninger Weg 5 (Zollstock)
- **Entity A:** `islamische-gemeinde-koeln` (*Islamische Gemeinde Köln e.V.*)
- **Entity B:** `abu-bakr-moschee` (*Abu Bakr Moschee - مسجد أبوبكر*)
- **Phone:** `+49 221 218676` (identical)
- **Address:** Höninger Weg 5, 50969 Köln
- **Analysis:** Islamische Gemeinde Köln e.V. is the registered sponsoring body of Abu Bakr Mosque at the same address.
- **Recommendation:** Maintain dual listings with `FLAGGED_CO_LOCATED` badge or merge association record as supporting org for Abu Bakr Mosque.

### 6. Stuttgart — Spreuergasse 37 (Bad Cannstatt)
- **Entity A:** `pakistan-welfare-society-stuttgart` (*Pakistan Welfare Society Stuttgart e.V.*)
- **Entity B:** `madina-pakistani-masjid` (*Madina Pakistani Masjid*)
- **Address:** Spreuergasse 37, 70372 Stuttgart
- **Analysis:** Community association and its affiliated prayer hall in the same building.
- **Recommendation:** Keep as `FLAGGED_CO_LOCATED` since community welfare associations frequently offer independent cultural and advisory services.

---

## 4. Legitimate Co-Location Cases (Verified Shared Facilities)

These cases share an address or building but represent distinct entities (e.g. umbrella associations co-located with local congregations):

1. **Stuttgart — Friedhofstraße 71:**
   - `Ulu Camii - Moschee des Landesverbands BW e.V.`
   - `VIKZ e.V. - Verband der Islamischen Kulturzentren`
   - `Landesverband der Islamischen Kulturzentren Baden-Württemberg e.V.`
   - *Status:* Legitimate co-location of national federation regional office and the local congregation.
2. **Berlin — Juliusstraße 58:**
   - `Interkulturelle Gemeinde Berlin e.V. (IGB)`
   - `Al-Badr Moschee مسجد البدر`
   - *Status:* Registered sponsoring association and mosque congregation.
3. **Frankfurt — Wächtersbacher Str. 95:**
   - `Afghan Islamic Cultural Centre of Frankfurt`
   - `Islamic Information and Services e.V. (IIS)`
   - *Status:* Two distinct independent communities utilizing adjacent units within a commercial complex.
4. **Dortmund — Oesterholzstraße 8:**
   - `Islamic Cultural Association Takwa`
   - `Tadschikische Gesellschaft NUR e.V.`
   - *Status:* Independent cultural associations sharing community premises.

---

## 5. Architectural Recommendations

1. **Do not execute automatic SQL deletions.** Keep all 443 records active in Phase 2B to prevent 404 regressions and preserve existing static URLs.
2. **Phase 3 Entity Linking:** Add an `aliasOf` or `parentEntityId` relation in Prisma schema to gracefully point duplicate records to the primary canonical mosque while maintaining 301 redirects.
3. **Canonical Cross-Linking:** For confirmed dual-name listings (such as *Marienplatz Mosque*), output an explicit `canonical` tag pointing to the primary entity.
