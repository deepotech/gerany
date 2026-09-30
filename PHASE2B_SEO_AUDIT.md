# Phase 2B — Production SEO, Indexability & Architecture Audit Report

**Date:** 2026-09-29  
**Platform:** MoscheeAtlas.de  
**Framework:** Next.js 14 App Router (SSG, strict TypeScript, Tailwind CSS)  
**Total Indexable Static Routes:** 1,362 canonical URLs  
**Status:** AUDIT COMPLETE — STAGE A COMPREHENSIVE FINDINGS

---

## 1. Executive Summary

A comprehensive 20-point production audit of MoscheeAtlas.de was performed post-Phase 2A multi-city ingestion. The directory covers 9 major German cities with 443 published mosques pre-rendered as 1,362 canonical static pages across German (`de`), English (`en`), and Arabic (`ar`).

The core architecture is solid:
- 100% clean Next.js 14 static site generation with zero runtime DB lag.
- Strict multilingual route separation preventing duplicate cross-locale URLs.
- Zero fake data, zero thin pages indexed, and zero admin pages leaked into the sitemap.
- Several high-priority issues were identified in frontend link wiring (hardcoded Cologne pilot assumptions in detail view, home hero, header, and footer) and domain configuration (`germany-mosque-finder.de` vs `moscheeatlas.de`).

---

## 2. Current Architecture

- **Web Framework:** Next.js 14.2.35 (App Router, Static Site Generation / SSG).
- **Runtime & Deployment:** Node.js standalone static export compatible.
- **Data Persistence:** File-backed JSON repository (`src/lib/db/json-repository.ts`) with typed Prisma schema specifications (`prisma/schema.prisma`).
- **Internationalization:** Path-based locale routing (`/[locale]/...`) supporting `de`, `en`, and `ar` with native RTL layout support in Arabic.
- **Styling:** Tailwind CSS with Lucide React iconography.
- **Client Mapping:** Leaflet dynamic client wrapper (`MapContainer.tsx` / `LeafletProvider.tsx`) with CartoDB/OSM tiles.

---

## 3. Route Inventory

| Page Type | German (`de`) Route | English (`en`) Route | Arabic (`ar`) Route | Static Page Count |
| :--- | :--- | :--- | :--- | :--- |
| **Homepage** | `/de` | `/en` | `/ar` | 3 |
| **Search Directory** | `/de/moscheen` | `/en/mosques` | `/ar/mosques` | 3 |
| **City Collection Pages** | `/de/moscheen/[city]` (9) | `/en/mosques/[englishCity]` (9) | `/ar/mosques/[city]` (9) | 27 |
| **Mosque Detail Pages** | `/de/moschee/[city]/[slug]` (443) | `/en/mosque/[englishCity]/[slug]` (443) | `/ar/mosque/[city]/[slug]` (443) | 1,329 |
| **Admin Portal** | `/de/admin` (noindex) | `/en/admin` (noindex) | `/ar/admin` (noindex) | 3 (non-indexable) |
| **Root & System** | `/` (root redirect), `/_not-found`, `/robots.txt`, `/sitemap.xml` | — | — | 7 |
| **TOTAL BUILD ROUTES** | — | — | — | **1,372** |

---

## 4. Indexable Page Types & Metadata Rules

| Page Type | Canonical Format | Robots Meta | Sitemap Inclusion | Structured Data |
| :--- | :--- | :--- | :--- | :--- |
| **Homepage** | `https://moscheeatlas.de/{locale}` | `index, follow` | YES (Priority 1.0) | `WebSite` |
| **Directory Search** | `https://moscheeatlas.de/{locale}/{moscheen\|mosques}` | `index, follow` | YES (Priority 0.9) | `CollectionPage`, `BreadcrumbList` |
| **City Collection** | `https://moscheeatlas.de/{locale}/{path}/{city}` | `index, follow` | YES (Priority 0.9) | `CollectionPage`, `BreadcrumbList` |
| **Mosque Detail** | `https://moscheeatlas.de/{locale}/{path}/{city}/{slug}` | `index, follow` | YES (Priority 0.8) | `Mosque` (Schema.org), `BreadcrumbList` |
| **Admin Portal** | None | `noindex, nofollow` | **NO (STRICTLY EXCLUDED)** | None |

---

## 5. Canonical URL Audit

- **Audit Result:** PASSED WITH WARNING (Domain hardcoded).
- Canonical URLs are normalized, self-referencing, clean, and contain zero query parameters or session IDs.
- **Finding:** Canonical paths were generated relative to `metadataBase`, which currently defaults to `https://germany-mosque-finder.de`. In accordance with production specifications, domain configuration must support `https://moscheeatlas.de` via centralized environment configuration (`NEXT_PUBLIC_SITE_URL`).

---

## 6. Hreflang Audit

- **Audit Result:** PASSED.
- All 1,362 indexable pages produce full bidirectional `hreflang` alternate clusters:
  - `de` $\leftrightarrow$ `en` $\leftrightarrow$ `ar` $\leftrightarrow$ `x-default` (`de`).
- City parameter slugs are properly translated in alternates:
  - German: `/de/moscheen/koeln`
  - English: `/en/mosques/cologne`
  - Arabic: `/ar/mosques/koeln`
- Cross-locale invalid routes (e.g. `/de/mosques`, `/en/moscheen`) return immediate `404 Not Found`, eliminating duplicate indexation hazards.

---

## 7. Sitemap Audit

- **Audit Result:** PASSED (Verified by `scripts/audit-sitemap.ts`).
- Exactly **1,362 canonical URLs** generated in `sitemap.xml`.
- **Zero duplicates**, zero 404 targets, zero query parameters, zero localhost URLs.
- Zero `REVIEWED` or `REJECTED` entities in the sitemap.
- Zero `/admin` URLs present in the sitemap.

---

## 8. Robots.txt Audit

- **Audit Result:** PASSED.
- Disallows `/admin`, `/*/admin`, `/api/`, and parameter variations (`/*?*query=`, `/*?*district=`).
- References valid `sitemap.xml`.

---

## 9. JSON-LD Structured Data Audit

- **Audit Result:** PASSED.
- Output uses valid Schema.org `@type: "Mosque"`, `PostalAddress`, `GeoCoordinates`, and `BreadcrumbList`.
- **Data Integrity:** Only factual fields are serialized:
  - Phone is included only if `mosque.phone` exists.
  - Website is serialized under `sameAs` only if present.
  - `aggregateRating` is included only when authentic Google rating and positive reviewCount exist.
  - No synthetic review comments or fake star ratings are created.

---

## 10. City Page Quality Audit

- All 9 cities feature dedicated collection pages with active interactive search, district filter dropdowns, and OpenStreetMap pins.
- **Identified Deficiency:** City page meta descriptions in German, English, and Arabic contained the claims "verifizierte Moscheen" and "verified mosques". These are updated to truthful wording ("erfasste Moscheen" / "listed mosques").

---

## 11. Mosque Detail Page Content Audit

- Sample audits performed across 45 representative listings (5 from each city).
- Detail pages render full addresses, direct Google navigation action, telephone call links (when present), verified websites, and nearby community links.
- **Critical Finding (P0):** `MosqueDetailView.tsx` hardcoded `citySlug = 'cologne' / 'koeln'`, causing breadcrumbs and nearby mosque links on Berlin, Hamburg, München, Frankfurt, Dortmund, Essen, Düsseldorf, and Stuttgart pages to link back to Köln! This generated broken links and must be fixed.

---

## 12. Thin Content & Programmatic SEO Audit

- 438/443 (98.87%) of published mosques classify as **SAFE** with rich multi-field metadata.
- 5/443 (1.13%) classify as **WATCH** (valid physical entities with reviews but no direct phone/website).
- 0/443 are THIN or BLOCK.

---

## 13. Internal Linking & Crawl Hierarchy

- **Crawl Flow:**
  - Homepage $\rightarrow$ City Pages $\rightarrow$ Mosque Detail Pages
  - Detail Page $\rightarrow$ City Collection $\rightarrow$ Nearby Mosques
- **Deficiencies Identified:**
  - `HomeHero.tsx` and `Footer.tsx` marked 8 out of 9 cities as `live: false` ("In Vorbereitung"), suppressing direct homepage links to Berlin, Hamburg, München, etc.
  - `Header.tsx` and `Footer.tsx` contained direct sitewide links to `/${locale}/admin`. Public admin links should be removed from primary navigation to preserve crawl budget and prevent bot indexing interest.

---

## 14. Multilingual Audit

- Full tripartite language parity across German (`de`), English (`en`), and Arabic (`ar`).
- Arabic pages correctly set `dir="rtl"` in HTML container and utilize appropriate Arabic script labels.

---

## 15. Search Audit

- Fast in-memory search with phonetic German umlaut normalization (`normalizeGermanPhonetic` handling `ä/ae`, `ö/oe`, `ü/ue`, `ß/ss`).
- Tested with "Muenchen" $\leftrightarrow$ "München", "Koln" $\leftrightarrow$ "Köln", "Dusseldorf" $\leftrightarrow$ "Düsseldorf".
- Excludes all `REVIEWED` and `REJECTED` entities from search results.

---

## 16. Map Audit

- Abstracted Leaflet map provider handles 100% of published coordinates without runtime coordinate crashes.
- Marker popups provide direct localized links to mosque detail pages.

---

## 17. Performance Audit

- 1,372 static pages pre-render in ~18 seconds during `next build`.
- Shared First Load JS across all routes: **87.7 kB**, well within green Google Core Web Vitals thresholds.

---

## 18. Security Audit

- Security headers active: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.
- Zero API keys, database connection strings, or server secrets leaked to client bundles.

---

## 19. Recommendations

1. **Centralize Site URL Configuration:** Introduce `src/lib/config.ts` reading `process.env.NEXT_PUBLIC_SITE_URL || 'https://moscheeatlas.de'` to eliminate hardcoded legacy domain strings.
2. **Dynamic City Resolution in MosqueDetailView:** Replace hardcoded `citySlug = 'koeln'` with dynamic lookup from `mosque.city`.
3. **Activate All 9 Cities in HomeHero & Footer:** Set `live: true` with actual mosque counts for all 9 cities, restoring complete internal crawl linking.
4. **Remove Sitewide Admin Navigation:** Remove visible `/${locale}/admin` links from `Header.tsx` and `Footer.tsx`.
5. **Update Verification Copy:** Replace "verifiziert" with "erfasst" across layout, city pages, and badges.

---

## 20. Priority Matrix

| Priority | Issue | Location | Resolution Action |
| :--- | :--- | :--- | :--- |
| **P0** | Hardcoded Köln in `MosqueDetailView.tsx` causing broken breadcrumbs & nearby links for other 8 cities | `src/components/MosqueDetailView.tsx` | Resolve `cityConfig` dynamically from `mosque.city`. |
| **P0** | Orphaned city pages due to `live: false` in `HomeHero.tsx` & `Footer.tsx` | `HomeHero.tsx`, `Footer.tsx` | Mark all 9 cities live with verified counts and active links. |
| **P1** | Hardcoded legacy domain `https://germany-mosque-finder.de` | Layout, sitemap, robots, schema, pages | Centralize to `https://moscheeatlas.de` via site config. |
| **P1** | Crawl pollution: Public header/footer links to `/admin` | `Header.tsx`, `Footer.tsx` | Remove public admin links from main layout. |
| **P1** | Country search hub titled "Köln Pilot" | `moscheen/page.tsx`, `mosques/page.tsx` | Generalize title to Germany-wide directory. |
| **P1** | Truth-in-data: "Verifizierte" claims in UI copy | Layout, city pages, detail view | Update copy to "erfasste Moscheen" / "listed mosques". |
| **P2** | Remote Google User Content image hotlinking | `next.config.mjs`, detail view | Plan Phase 3 image caching proxy. |
| **P2** | Sponsoring body dual-listings at shared addresses | 8 duplicate candidate groups | Plan Phase 3 alias/parent linking. |
