# PHASE 4 DATA SOURCES, PROVENANCE & RIGHTS INVENTORY

**Project:** MoscheeAtlas.de  
**Domain:** https://moscheeatlas.de  
**Date:** 2026-09-30  
**Phase:** Phase 4  
**Policy Status:** STRICT COMPLIANCE & ATTRIBUTION ENFORCED  

---

## 1. Guiding Legal & Trust Principles

MoscheeAtlas.de operates under a factual public directory model for Islamic places of worship in Germany. Data provenance and intellectual property boundaries are enforced by these foundational principles:

1. **Factual Geodata is Non-Copyrightable; Creative Content is Protected:** Names, physical addresses, postal codes, and geographic coordinates are factual public directory records. Third-party creative expression (user review text, user photos, reviewer names, subjective editorial summaries) must **never** be copied or stored.
2. **Attribution is Mandatory:** All external base maps and datasets must clearly display legally required attributions (e.g. OpenStreetMap contributors).
3. **No Hotlinking of Unauthorized Assets:** External image assets are never hotlinked directly from unverified scrapers.
4. **Conservative Sourcing:** Public accessibility does not equate to unrestricted republication rights. If licensing is uncertain, the source is flagged as `REQUIRING_REVIEW`.

---

## 2. Provenance & Rights Matrix

| Source / Provider | Data Elements Ingested | Access Method | License / Terms of Service | Allowed Usage | Restrictions & Prohibitions | Attribution Requirement | Storage & Republication Status |
|---|---|---|---|---|---|---|---|
| **OpenStreetMap (OSM) / Overpass** | Mosque nodes/ways, geometry, address, name tags | Overpass API / Public Planet dumps | Open Database License (ODbL) 1.0 | Factual extraction, geographic lookup, search indexing | Must attribute OSM; derivative databases must share-alike under ODbL | `© OpenStreetMap contributors` on map viewports | **ALLOWED** with attribution |
| **Google Maps / Places (Historical Pilot)** | Entity names, coordinates, structured addresses, aggregated numerical rating, review counts | Static JSON export (Phases 1–3B) | Google Maps Platform Terms of Service / Public Web | Local verification, address validation, navigation deep links | **PROHIBITED:** Storing/displaying user review texts, reviewer names, user photos, or reverse geocoding caching beyond terms | Link to Google Maps directions (`mapsUrl`); placeId kept internal | **RESTRICTED:** Factual contact/location permitted; Place IDs kept internal; Review text strictly excluded |
| **Official German Islamic Federations (DITIB, IGMG, VIKZ, ATIB, AMJ, etc.)** | Official mosque registry listings, federation affiliations, verified addresses | Official public organizational directories / web impressum | Public organization directories | Official federation affiliation confirmation | Factual verification only; do not scrape editorial publications | None legally required for factual directory listing | **ALLOWED** for verification & affiliation confirmation |
| **Federal Agency for Cartography and Geodesy (BKG) / Open Data Germany** | German administrative boundaries, postal code centroids, state allocations | WFS / Open Data Germany portals | GeoNutzV / Data licence Germany – attribution (dl-de/by-2-0) | Administrative mapping, postal validation, state assignment | None for non-commercial/commercial factual data | Factual administrative data | **ALLOWED** |
| **Community Self-Reporting / Direct Outreach** | Contact details, prayer schedules, facility confirmations | Direct submission via operator verification | Voluntary explicit consent by congregation administration | Publication on MoscheeAtlas.de directory | Restricted to confirmed administrative details | None | **ALLOWED** (Enables `COMMUNITY_VERIFIED` status) |

---

## 3. Strict Field-Level Compliance Rules

### 3.1 Third-Party User Reviews & Ratings
- **Review Text:** **STRICTLY EXCLUDED.** The pipeline does not store, process, or render text from third-party reviews.
- **Reviewer Identifiers:** **STRICTLY EXCLUDED.** No names, handles, or avatars of third-party reviewers are ingested.
- **Aggregate Rating:** Only the numerical aggregate score (e.g. `4.6`) and review count (`42`) are retained as factual metadata.
- **Attribution in UI:** Numerical reviews are presented neutrally with localized label `Bewertungen` / `Reviews` / `تقييم`.

### 3.2 Place IDs & External Identifiers
- **Internal Only:** Google Place IDs (`placeId`) and OSM node IDs are utilized exclusively for deduplication and pipeline idempotency.
- **Hidden from Public UI:** Place IDs are not displayed on public cards, detail pages, or search results.

### 3.3 External Images & Photos
- Scraped third-party photos with indeterminate copyright must not be hosted or hotlinked.
- Image URLs are strictly validated and only rendered if verified or fallback to neutral SVG/vector illustrations.

### 3.4 Disputed or Unclear Sources
Any dataset or file where the license or rights terms cannot be definitively confirmed under ODbL, dl-de/by-2-0, or public factual directory rights is marked:
```json
{
  "sourceStatus": "REQUIRING_REVIEW",
  "canPublish": false
}
```
Such records will remain in the `REVIEWED` staging queue and cannot advance to `PUBLISHED`.
