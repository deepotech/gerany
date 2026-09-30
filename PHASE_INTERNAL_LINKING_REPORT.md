# MoscheeAtlas.de — Internal Linking: Nearby Mosques Report

**Domain:** `https://moscheeatlas.de`  
**Execution Date:** 2026-09-30  
**Phase Status:** PASS  

---

## 1. Status

**PASS** (100% of functional, SEO, accessibility, performance, and baseline preservation requirements met).

---

## 2. Files Changed

1. `src/lib/db/geo.ts`
   - Added `formatDistance(distanceKm, locale)` supporting German comma decimals (`1,7 km`), sub-kilometer meter formatting (`850 m`), English format (`1.7 km`), and Arabic format (`1.7 كم` / `850 م`).
2. `src/lib/db/types.ts`
   - Updated `MosqueRepository.getNearby` signature to include optional `excludeId`.
3. `src/lib/db/json-repository.ts`
   - Hardened `getNearby` to enforce `dataStatus === 'PUBLISHED'`, validate Germany coordinate boundaries, restrict to published cities (`getPublishedCityConfigs`), exclude current mosque by `slug` and `id`, sort ascending by distance, and default limit to 6.
4. `src/app/[locale]/moschee/[city]/[slug]/page.tsx`
   - Updated `repo.getNearby` call to pass `limit = 6`, `mosque.slug`, and `mosque.id`.
5. `src/app/[locale]/mosque/[city]/[slug]/page.tsx`
   - Updated `repo.getNearby` call to pass `limit = 6`, `mosque.slug`, and `mosque.id`.
6. `src/components/MosqueDetailView.tsx`
   - Integrated `formatDistance`, added conditional rendering for empty nearby collections, and enhanced keyboard focus visibility.
7. `tests/phase_nearby_internal_linking.test.ts`
   - Added 20 automated regression tests covering all prompt requirements.
8. `PHASE_INTERNAL_LINKING_NEARBY_MOSQUES.md`
   - Complete technical and architectural documentation.

---

## 3. Files Not Changed

- `src/data/mosques.json` (Production dataset strictly untouched at 542 published records)
- `src/data/all-entities.json` (Review pool strictly untouched at 52 reviewed records)
- `src/app/sitemap.ts` (Sitemap unchanged at 1,674 canonical URLs)
- `src/app/robots.ts` (Robots policy unchanged)
- `src/pipeline/city-config.ts` (14 published cities unchanged)
- `src/pipeline/city-registry.ts` (City statuses unchanged)
- `src/components/MosqueCard.tsx` (Search listing cards preserved)
- `src/components/Header.tsx` & `src/components/Footer.tsx` (Global navigation preserved)

---

## 4. Nearby Algorithm

- **Formula:** Spherical Haversine trigonometric distance formula based on real GPS coordinates ($R = 6,371\text{ km}$).
- **Determinism:** Pure numeric calculations on immutable entity coordinates; no heuristics, postal code approximations, or string matching.
- **Sorting:** Ascending distance sort ($d_1 \le d_2 \le \dots \le d_k$).
- **Boundary Guards:** Validates $47.0 \le \text{lat} \le 55.5$ and $5.5 \le \text{lon} \le 15.5$.

---

## 5. Number of Nearby Links Shown

- **Maximum:** Up to 6 nearby published mosques.
- **Dynamic Adaptability:** If fewer than 6 eligible published mosques exist within range, all available are shown.
- **Zero-State Handling:** If 0 eligible mosques are found, the section is completely omitted from the DOM without empty placeholders or fake listings.

---

## 6. Published-Only Filtering

Strict multi-layered exclusion rules guarantee:
- 0 `REVIEWED` entities included.
- 0 `REJECTED` entities included.
- 0 entities from withheld candidate cities (Hannover, Duisburg, Bochum, Mannheim, Dresden) included.
- 0 unpromoted/unindexed routes linked.
- The current mosque is excluded by both `id` and `slug`.

---

## 7. Internal URL Behavior

- Clean canonical URLs constructed via `getMosqueUrl(locale, city, slug)`.
- No query parameters (`?search=`, `?ref=`).
- No URL fragmentation or temporary routes.
- Crawlable `<a>` tags via Next.js `<Link>`.

---

## 8. Multilingual Verification (DE / EN / AR)

Tested live on production server:
- **German:** `/de/moschee/berlin/lubars-mosque`
  - Nearby link: `/de/moschee/berlin/al-khair-mosque`
  - Formatted distance: `1,7 km`
- **English:** `/en/mosque/berlin/lubars-mosque`
  - Nearby link: `/en/mosque/berlin/al-khair-mosque`
  - Formatted distance: `1.7 km`
- **Arabic:** `/ar/mosque/berlin/lubars-mosque`
  - Nearby link: `/ar/mosque/berlin/al-khair-mosque`
  - Formatted distance: `1.7 كم`
  - Fully compatible with RTL reading flow.

---

## 9. Accessibility Verification

- Semantic HTML structure: `<Link>` wrapper with inner `<h4>` heading.
- Zero nested interactive elements (no `<a>` inside `<a>` or `<button>` inside `<a>`).
- Visible keyboard focus ring: `focus:ring-2 focus:ring-brand-500/50`.
- Responsive layout verified across mobile viewports: 320px, 375px, 390px, and 430px.

---

## 10. Performance Verification

- In-memory execution: 20 nearby calculations execute in $< 15\text{ms}$.
- Zero additional client-side HTTP/API network calls.
- Zero N+1 queries.
- Prerendered during SSG build.

---

## 11. Test Results

- **Vitest:** **14 test suites, 264 tests passing** (100% success rate).
- **TypeScript:** `npx tsc --noEmit` exited with 0 errors.
- **ESLint:** `npm run lint` exited with 0 warnings and 0 errors.

---

## 12. Build Result

- `npm run build`: **SUCCESS**
- Prerendered **1,684 static routes** (SSG) with zero warnings or broken static props.

---

## 13. HTTP Smoke Test Result

- `node scripts/smoke-test.js`: **33/33 tests passed** with HTTP 200/307/404 as expected.
- Verified target mosque pages return HTTP 200 with nearby links intact.

---

## 14. Production Baseline Comparison

| Invariant | Target Baseline | Result | Verification |
|---|---|---|---|
| **Published Mosques** | 542 | 542 | PASS |
| **Published Cities** | 14 | 14 | PASS |
| **All Entities Pool** | 594 | 594 | PASS |
| **Sitemap URLs** | 1,674 | 1,674 | PASS |
| **Candidate Cities Withheld** | 5 (0 published) | 5 (0 published) | PASS |
| **Verification State** | 100% UNVERIFIED | 100% UNVERIFIED | PASS |

---

## 15. Route Reconciliation Audit: Sitemap Canonical URLs (1,674) vs. Static SSG Routes (1,684)

An exhaustive forensic comparison between the XML sitemap (`sitemap.xml`) and the static routes generated during Next.js production build (`npm run build`) accounts for the exact 10-route difference:

$$\Delta = 1,684 \text{ static build routes} - 1,674 \text{ sitemap canonical URLs} = 10 \text{ routes}$$

### Detailed Route Inventory for the 10 Non-Sitemap Routes:

| # | Route / Path | File / Component | Purpose | Indexable? | In Sitemap? | Canonical Metadata? | Intentionally Excluded? |
|---|---|---|---|---|---|---|---|
| 1 | `/` | `src/app/page.tsx` | Root landing 307 redirect to `/de` | **No** (Redirect) | **No** | None (Redirect) | **Yes** (Sitemaps must never contain 3xx redirects) |
| 2 | `/admin` | `src/app/admin/page.tsx` | Root admin 307 redirect to `/de/admin` | **No** (Redirect & Admin) | **No** | None (Redirect) | **Yes** (Disallowed in `robots.txt`) |
| 3 | `/de/admin` | `src/app/[locale]/admin/page.tsx` | German operator data review dashboard | **No** (Internal Tooling) | **No** | `robots: noindex, nofollow` | **Yes** (Disallowed in `robots.txt` via `/*/admin`) |
| 4 | `/en/admin` | `src/app/[locale]/admin/page.tsx` | English operator data review dashboard | **No** (Internal Tooling) | **No** | `robots: noindex, nofollow` | **Yes** (Disallowed in `robots.txt` via `/*/admin`) |
| 5 | `/ar/admin` | `src/app/[locale]/admin/page.tsx` | Arabic operator data review dashboard | **No** (Internal Tooling) | **No** | `robots: noindex, nofollow` | **Yes** (Disallowed in `robots.txt` via `/*/admin`) |
| 6 | `/robots.txt` | `src/app/robots.ts` | Crawler protocol file | **No** (Protocol) | **No** | None (`text/plain`) | **Yes** (Standard crawler configuration file) |
| 7 | `/sitemap.xml` | `src/app/sitemap.ts` | Discovery index feed | **No** (Feed) | **No** | None (`application/xml`) | **Yes** (Feed cannot self-reference as a content page) |
| 8 | `/_not-found` | `src/app/not-found.tsx` | Custom 404 error page | **No** (Error Page) | **No** | None (HTTP 404) | **Yes** (Error pages must never be indexed) |
| 9 | `/404` | `.next/server/pages/404.html` | Pages router static 404 fallback | **No** (Framework Error) | **No** | None (HTTP 404) | **Yes** (Next.js default internal error page) |
| 10 | `/500` | `.next/server/pages/500.html` | Pages router static 500 fallback | **No** (Framework Error) | **No** | None (HTTP 500) | **Yes** (Next.js default internal server error page) |

### Audit Conclusion:
- **Zero Unintended Routes:** None of the 10 routes are duplicate, thin, or leaked indexable pages.
- **Zero Candidate City Leaks:** All 5 withheld candidate cities remain completely absent from both builds and sitemaps.
- **Zero Inappropriate Sitemaps Additions:** Sitemaps strictly contain 100% 200 OK indexable canonical content URLs (1,674).
- **Legitimate Infrastructure:** The 10 extra routes are standard protocol, error, redirect, and internal admin routes appropriately excluded from search indexation.

---

## 16. Warnings

**None.** All operations completed cleanly without residual warnings.

---

PASS
