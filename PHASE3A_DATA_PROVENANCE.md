# PHASE 3A — DATA PROVENANCE & THIRD-PARTY INTEGRATION AUDIT
**Project:** MoscheeAtlas.de  
**Date:** 2026-09-29  
**Status:** AUDITED & COMPLIANT

---

## 1. Overview of Third-Party Fields

MoscheeAtlas.de utilizes factual public geographic data to help Muslims in Germany locate prayer facilities. This audit reviews all fields derived from third-party sources (e.g., Google Maps, OpenStreetMap) against provenance, copyright, and privacy guidelines.

---

## 2. Field-by-Field Provenance Audit

| Field | Source | Current Usage | Provenance Review & Action Taken |
|---|---|---|---|
| `canonicalName` | Public records / OSM / Maps | Displayed as primary title | Factual identifier. Preserved and normalized. |
| `latitude`, `longitude` | Geocoding / Public data | Map pins, distance calculations | Factual geographic coordinates. Validated to be within Germany bounds. |
| `address`, `postalCode`, `city` | Official postal directories | Display, search matching | Factual standard German addresses. |
| `rating` | Google Maps aggregate | Star display in cards & detail view | Aggregated numerical score (e.g. 4.6). Compliant factual aggregation. |
| `reviewCount` | Google Maps aggregate | Shown alongside rating | Numerical count only. Localized with `dict.common.reviews`. |
| `reviewText` | Google Reviews | **NOT STORED / NOT DISPLAYED** | **Strictly excluded.** No third-party user reviews, reviewer names, or review texts are scraped or published. |
| `placeId` | Google Place ID | Internal linkage only | **Removed from public UI.** Previously rendered as "Google Place ID: ... Pilot ID". Now kept solely for internal deduplication. |
| `mapsUrl` | Google Maps URL | "Route berechnen" external link | Standard external navigation hyperlink. |
| `imageUrl` | Third-party image URLs | Optional og:image metadata | Kept minimal. Self-hosted fallbacks and Next.js optimization recommended for Phase 3B. |

---

## 3. Map Tile Attribution

- Leaflet map tiles are sourced from **OpenStreetMap** (`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`).
- Attribution string is rendered on the map canvas:
  `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`.
- Leaflet map utilizes dynamic client-side rendering with SSR disabled to prevent server-side DOM errors.

---

## 4. Open Items for Continuous Review

1. **Direct Image Assets:** Where `imageUrl` links to external CDN domains, future phases should cache or host verified community-provided photos locally to prevent broken hotlinks.
2. **Review Aggregation:** Numerical review scores and counts are kept strictly attribution-compliant and non-speculative.
