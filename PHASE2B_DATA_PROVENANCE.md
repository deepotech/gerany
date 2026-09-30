# Phase 2B — Data Provenance, Licensing & Third-Party Integrity Report

**Date:** 2026-09-29  
**Target:** MoscheeAtlas.de (Germany Mosque Finder)  
**Scope:** Third-Party Data Usage, Intellectual Property, Licensing Safety & Verification Honesty

---

## 1. Executive Summary

MoscheeAtlas.de utilizes initial baseline data extracted from publicly indexed Google Maps Places API records to bootstrap the Germany-wide mosque directory. 

A core requirement of Phase 2B is establishing transparent data provenance boundaries, auditing third-party assets, preventing copyright/terms-of-service violations, and ensuring the website does not mislead visitors regarding data verification.

---

## 2. Inventory of Third-Party Data Elements

| Field | Source Origin | Current Site Behavior | Provenance / Legal Risk Assessment |
| :--- | :--- | :--- | :--- |
| **`canonicalName`** | Google Maps `title` | Displayed as primary title | **LOW:** Factual identification of public institutions. |
| **`address` & `postalCode`** | Google Maps `address` | Standardized & normalized | **LOW:** Factual public geographic addresses. |
| **`latitude` & `longitude`** | Google Maps `location` | Displayed on OpenStreetMap via Leaflet | **LOW:** Factual coordinates. Map tiles are served via OpenStreetMap/CartoDB (free/open tile policy). |
| **`rating` & `reviewCount`** | Google Maps Places summary | Displayed as numerical aggregate | **LOW-MEDIUM:** Factual summary statistics credited directly to Google Maps ("auf Google Maps"). |
| **Review Texts & Comments** | Google Maps reviews | **NOT SCRAPED / NOT STORED** | **SAFE:** Zero third-party review text is stored or displayed anywhere on the site. |
| **`imageUrl`** | Google user content (`lh3.googleusercontent.com`) | Hotlinked via Next.js remote images | **MEDIUM-HIGH:** Remote image URLs may expire, change access tokens, or be subject to hotlinking restrictions. |
| **`openingHours`** | Google Maps structured hours | Displayed in weekly table | **LOW:** Factual community hours. |
| **`website` & `phone`** | Public listings | Direct link & tel: action | **SAFE:** Direct links to official community websites. |

---

## 3. UI Verification Language & Transparency Audit

### Critical Finding (P1): Over-promising "Verifiziert" / "Geprüft"
In several locations in the Phase 1/Phase 2A codebase, UI copy used terms implying official independent verification:
- `src/app/layout.tsx`: *"Lokaler Suchdienst und Verzeichnis für geprüfte Moscheen in Deutschland..."*
- `src/app/[locale]/moscheen/[city]/page.tsx`: *"Entdecke {mosques.length} verifizierte Moscheen in {city}..."*
- `src/app/[locale]/mosques/[city]/page.tsx`: *"Find {mosques.length} verified mosques and Islamic prayer centers..."*
- `src/components/MosqueDetailView.tsx`: Badge stating *"Gemeinschaftlich bestätigt"* or *"Verifiziert"*.

### Truth in Data
The actual database records have:
```json
"source": "google_maps_pilot",
"verificationStatus": "COMMUNITY_VERIFIED" | "UNVERIFIED"
```
These records originate from public map indexing and algorithmic normalization, **not** on-site physical inspection or official government certification.

### Mandatory Correction (Implemented in Stage B):
Replace misleading terms with factual, honest language:
- German: *"Verzeichnis erfasster Moscheen"* instead of *"geprüfte Moscheen"*
- English: *"Directory of listed mosques"* instead of *"verified mosques"*
- Arabic: *"دليل المساجد والمصليات المسجلة"* instead of *"مساجد معتمدة"*

---

## 4. Image Hosting & Google Photo Hotlinking Risk

### Current State
`src/data/mosques.json` contains 439 entities with `imageUrl` strings pointing to `https://lh3.googleusercontent.com/...`.
These are configured in `next.config.mjs`:
```javascript
remotePatterns: [
  { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
]
```

### Risks
1. **URL Expiration:** Google User Content CDN tokens can rotate or expire without notice, resulting in broken image icons.
2. **Bandwidth / Terms:** Relying on hotlinked CDN images for long-term production traffic is fragile.

### Architectural Recommendation (Phase 3 Roadmap):
1. Implement a headless caching proxy or CDN asset pipeline (e.g. Cloudflare R2 / AWS S3) to mirror and store approved mosque images locally.
2. For missing images, display high-quality SVG vector architectural illustrations tailored to Islamic community buildings.

---

## 5. Map Provider & Tile Licensing

- The map implementation in `src/components/map/LeafletProvider.tsx` utilizes:
  - **Tile Layer:** OpenStreetMap / CartoDB Voyager tiles.
  - **Attribution:** Includes required OpenStreetMap contributors copyright notice.
  - **Provider Abstraction:** `MapContainer.tsx` wraps `LeafletProvider.tsx` cleanly through TypeScript interface `MapProviderProps`, allowing seamless drop-in replacement with Mapbox, MapLibre, or Google Maps Vector SDK in future phases without touching page components.
