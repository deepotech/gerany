# Phase 2B — Germany-Wide Data Quality Report

**Date:** 2026-09-29  
**Target:** MoscheeAtlas.de (Germany Mosque Finder)  
**Baseline Verified:** 486 unique records across 9 cities (443 PUBLISHED, 39 REVIEWED, 4 REJECTED)

---

## 1. Executive Summary

This report establishes the verified empirical data baseline for MoscheeAtlas.de following the Phase 2A multi-city ingestion and Phase 2B production quality audit. 

Across 9 metropolitan hubs in Germany, **443 mosques** meet all strict criteria for public directory publication. All published entities possess valid German addresses, verified 5-digit postal codes, and geocoordinates strictly within the borders of Germany. Zero fake data, placeholder phone numbers, or synthetic opening hours have been inserted.

---

## 2. Baseline Status Breakdown

| Status Category | Count | % of Ingested | Description / System Action |
| :--- | :--- | :--- | :--- |
| **`PUBLISHED`** | **443** | **91.15%** | Verified physical mosque, active Islamic center, or established prayer room with confirmed public congregational utility. Indexable in sitemap. |
| **`REVIEWED`** | **39** | **8.02%** | Administrative association headquarters, cultural/integration clubs without confirmed daily prayers, cross-city boundary anomalies, or thin records held for manual editorial verification. Excluded from sitemap and indexing. |
| **`REJECTED`** | **4** | **0.82%** | Spam listings (e.g. `Pastel-ghost-Moschee`), purely secular clubs, funeral homes, or non-religious associations. Permanently blocked from publication. |
| **TOTAL UNIQUE** | **486** | **100.0%** | Deduped raw dataset inventory across all 9 metropolitan files. |

---

## 3. Per-City Completeness & Ingestion Matrix

| City | Raw / Total | Published | Reviewed | Rejected | Missing Phone | Missing Website | Missing Hours | Missing Image | Potential Duplicates |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Berlin** | 110 | **104** | 6 | 0 | 41 (39%) | 48 (46%) | 44 (42%) | 1 | 2 groups |
| **Hamburg** | 70 | **65** | 4 | 1 | 28 (43%) | 26 (40%) | 30 (46%) | 0 | 6 groups |
| **München** | 57 | **54** | 3 | 0 | 27 (50%) | 22 (41%) | 25 (46%) | 2 | 6 groups |
| **Frankfurt** | 57 | **50** | 6 | 1 | 17 (34%) | 18 (36%) | 23 (46%) | 0 | 3 groups |
| **Dortmund** | 51 | **50** | 1 | 0 | 29 (58%) | 30 (60%) | 31 (62%) | 0 | 1 groups |
| **Köln** | 50 | **39** | 9 | 2 | 19 (49%) | 18 (46%) | 26 (67%) | 1 | 1 groups |
| **Stuttgart** | 32 | **27** | 5 | 0 | 7 (26%) | 12 (44%) | 18 (67%) | 0 | 3 groups |
| **Düsseldorf** | 30 | **27** | 3 | 0 | 7 (26%) | 6 (22%) | 13 (48%) | 0 | 2 groups |
| **Essen** | 29 | **27** | 2 | 0 | 10 (37%) | 11 (41%) | 12 (44%) | 0 | 2 groups |
| **TOTAL** | **486** | **443** | **39** | **4** | **185 (41.8%)** | **191 (43.1%)** | **222 (50.1%)** | **4 (0.9%)** | **26 groups** |

---

## 4. Key Data Quality Findings

1. **Strict Geolocation Integrity:**
   - 100% (443/443) of published coordinates are numeric, non-zero, and fall strictly within the German national polygon ($\text{Lat } 47.0^\circ \text{--} 55.5^\circ\text{N}$, $\text{Lng } 5.5^\circ \text{--} 15.5^\circ\text{E}$).
   - Zero coordinate outliers detected (>45km from municipal centroids).

2. **Honest Missing Data Policy:**
   - Missing fields are strictly preserved as `null`.
   - 41.8% of published mosques lack direct phone numbers; the UI displays an informative "Anrufen" button only when phone data exists.
   - 50.1% lack structured Google opening hours; the UI displays a fallback notice ("Genaue Öffnungszeiten auf Anfrage bei der Gemeinde") rather than synthetic 24/7 schedules.
   - Jummah congregational prayers are noted transparently without guessing local khutbah times.

3. **Organizational Provenance:**
   - 37 published mosques feature structured association affiliations (`DITIB`, `IGMG`, `VIKZ`, `AMJ`, `ATIB`).
   - 100% of these 37 affiliations are backed by verifiable official website domains.
   - 406 mosques without domain proof retain `organization: null`, preventing unfounded sectarian or administrative categorization.

4. **Address Co-locations & Multiple Communities:**
   - 26 address clusters encompass 56 records. 18 represent legitimate co-located non-profit associations, auxiliary federations, or student prayer rooms sharing a physical community center.
   - 8 represent candidate duplicates (e.g. English vs German title aliases like *Dusseldorf Central Mosque* vs *Moschee Mosque Beyazit Camii*). All are preserved safely without destructive data loss.

---

## 5. Critical Issues & Remediation Plan

- **Issue 1 (P1): Verification Language Discrepancy.** UI templates currently display "verifizierte Moscheen" and "geprüfte Moscheen" despite initial dataset origins being public Google Maps places. Corrected to "erfasste Moscheen" / "gelistete Moscheen".
- **Issue 2 (P1): Hardcoded Cologne References in Frontend Components.** `MosqueDetailView.tsx`, `Header.tsx`, `Footer.tsx`, and `HomeHero.tsx` contained lingering Phase 1 Cologne pilot labels, badge prefixes (`Köln-{district}`), and disabled links for other cities. All updated to dynamically resolve the entity's actual city configuration.
