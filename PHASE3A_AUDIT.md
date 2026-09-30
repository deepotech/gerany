# PHASE 3A AUDIT — MoscheeAtlas.de
## Search + Map + Mobile UX + Data Trust Hardening
**Date:** 2026-09-29  
**Baseline:** Phase 2B Complete — 443 published, 9 cities, 101 tests, 1,372 pages

---

## 1. ACTUAL DATA COUNTS (Authoritative)

Source: `src/data/mosques.json` (dataStatus === 'PUBLISHED')

| City | Actual Count |
|---|---|
| Berlin | 104 |
| Hamburg | 65 |
| München | 54 |
| Dortmund | 50 |
| Frankfurt | 50 |
| Köln | 39 |
| Stuttgart | 27 |
| Düsseldorf | 27 |
| Essen | 27 |
| **TOTAL** | **443** |

All entities: 443 PUBLISHED + 39 REVIEWED + 4 REJECTED = **486 total**

### Count Discrepancy Analysis

**Phase 2A reported:** Berlin 111, Hamburg 64, München 50, Frankfurt 46, Dortmund 43, Köln 38, Stuttgart 34, Düsseldorf 30, Essen 27

**Phase 2B fixed to:** Berlin 104, Hamburg 65, München 54, Frankfurt 50, Dortmund 50, Köln 39, Stuttgart 27, Düsseldorf 27, Essen 27

**Cause:** Phase 2A report reflected ingestion pipeline output before deduplication pass. Current `mosques.json` reflects post-deduplication published set. The counts in Phase 2A were approximate pipeline outputs, not final published records.

**Current UI (`HomeHero.tsx`):** Still uses hardcoded static `POPULAR_CITIES` array with counts `[104, 65, 54, 50, 50, 39, 27, 27, 27]`. These match the actual data currently, but are NOT derived from the repository. → **P0: Must be made data-driven.**

---

## 2. CITY COUNT SOURCE AUDIT

### Where counts appear in UI:

| Component | Source | Status |
|---|---|---|
| `HomeHero.tsx` POPULAR_CITIES | **Hardcoded** `count: 104` etc | ❌ P0 |
| `HomeHero.tsx` pilotBadge | `totalMosques` from `repo.getAllPublished()` | ✅ PASS |
| `Footer.tsx` POPULAR_CITIES | No counts shown (only city names) | ✅ PASS |
| City page title | `${mosques.length}` from `repo.getByCity()` | ✅ PASS |
| City page metadata description | `${mosques.length}` from `repo.getByCity()` | ✅ PASS |
| `SearchClient.tsx` result count | `filteredMosques.length` (live-derived) | ✅ PASS |
| `repo.getCities()` | Derived from `mosques` array at runtime | ✅ PASS |

**P0 Fix Required:** `HomeHero.tsx` hardcoded `POPULAR_CITIES` counts must be removed and derived from `repo.getCities()` at page render time (server component).

---

## 3. SEARCH SYSTEM AUDIT

### Current Implementation

**Server-side:** `JsonMosqueRepository.getAllPublished(filters?)` with:
- Text search: `normalizeGermanPhonetic()` — handles ö→o, ü→u, ä→a, ue/ae/oe back-normalization
- City filter: phonetic-normalized
- District filter: phonetic-normalized
- Postal code: exact match
- Facilities: boolean true-only filters
- Open now: `isOpenNow()` from geo.ts

**Client-side:** `SearchClient.tsx` — pure client-side filtering on `initialMosques` (all published):
- Text: `.toLowerCase().includes(q)` — simple substring, NOT using `normalizeGermanPhonetic`
- District: exact case-insensitive match
- Facilities: `=== true` (correct — unknown != false)
- Open now: `isOpenNow()` 

### Search Normalization Issues (P1)

| Test Case | Client `SearchClient.tsx` | Server `json-repository.ts` |
|---|---|---|
| "Berlin" | ✅ | ✅ |
| "Köln" | ✅ (substring) | ✅ |
| "Koeln" | ❌ FAIL — no umlaut normalization | ✅ phonetic |
| "Koln" | ❌ FAIL | ✅ phonetic |
| "München" | ✅ (substring) | ✅ |
| "Munchen" | ❌ FAIL | ✅ phonetic |
| "Muenchen" | ❌ FAIL | ✅ phonetic |
| "Duesseldorf" | ❌ FAIL | ✅ phonetic |
| "DITIB" | ✅ | ✅ |
| "10115" (postal) | ✅ (`postalCode.includes(q)`) | ✅ |

**P1:** `SearchClient.tsx` uses raw `toLowerCase().includes()` — not phonetically normalized. Users typing "Koeln" or "Muenchen" get zero results. Must apply `normalizeGermanPhonetic` in client-side filter too.

### Search UX Issues

- ✅ Clear/X button exists when query non-empty
- ✅ Search icon present
- ✅ Enter submits (form submit is handled via `onChange` live filter — no `onKeyDown` Enter submission needed since it's instant)
- ✅ Mobile-friendly input
- ✅ Empty state with reset button
- ✅ Result count shown
- ❌ **P1:** No `aria-label` on search input beyond `placeholder`
- ❌ **P1:** Filter buttons have no `aria-pressed` state
- ❌ **P1:** "Filter zurücksetzen" is DE-only hardcoded (not i18n-ized)
- ❌ **P2:** District `<select>` is only populated for city pages, empty for search hub (by design after Phase 2B fix)

---

## 4. MAP / LIST INTERACTION AUDIT

### Current State

**Architecture:** Leaflet (v1.9.4), dynamically imported (SSR disabled), pure imperative DOM manipulation via `useRef`. No React-Leaflet.

**Marker flow:**
```
filteredMosques → mapMarkers (useMemo) → MapContainer → LeafletProvider → L.marker[]
```

**Card ↔ Marker sync:**
- Card `onMouseEnter` → `setActiveMarkerId(mosque.id)`
- Marker `onClick` → `onMarkerSelect(m)` → `setActiveMarkerId(m.id)`
- `activeMarkerId` passed to LeafletProvider → markers recreated to change icon size/color

**Issues identified:**

| Issue | Priority |
|---|---|
| **Markers fully recreated on every `filteredMosques` change** — `useEffect` deps include `[markers, activeMarkerId, ...]`, so any hover triggers full marker redraw | P1 |
| **Map default center hardcoded to Köln** `[50.9375, 6.9603]` in `LeafletProvider.tsx` line 9 | P1 |
| **No marker clustering** — Berlin with 104 markers renders all individually at city zoom | P1 |
| **No `leaflet.markercluster` package** installed | P1 |
| **`activeMarkerId` change triggers full marker recreation** — should only update active marker style | P1 |
| **`fitBounds` recalculated on every filter change** — map re-zooms on every keystroke | P2 |
| **Map scrollWheelZoom disabled** — good for UX but no touch gesture control for mobile | P2 |
| **Popup contains hardcoded "Details" / "Route" text** — not i18n-ized | P2 |
| **Rating shown in popup from Google** — provenance concern | P1 |

---

## 5. DATA TRUST AUDIT — CRITICAL FINDINGS

### Verification Status Distribution (ALL 443 published)

```
COMMUNITY_VERIFIED: 443 (100%)
UNVERIFIED:         0
OFFICIALLY_VERIFIED: 0
```

**Every single published mosque has `verificationStatus: "COMMUNITY_VERIFIED"` — but there is zero evidence of actual community verification.**

This was assigned by the pipeline normalization process, NOT through actual contact with mosque communities.

### Current UI Display (`MosqueDetailView.tsx` L145-150)

```tsx
<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
{mosque.verificationStatus === 'OFFICIALLY_VERIFIED'
  ? dict.common.verified          // "Verifiziert"
  : dict.common.communityVerified} // "Gemeinde-verifiziert"
```

**PROBLEM: Every mosque shows "Gemeinde-verifiziert" badge** — because all are `COMMUNITY_VERIFIED`. This is misleading — no mosque has actually been verified by the community.

**P0 Fix:** Remove the always-shown verification badge. The badge should only appear when genuinely verified. Replace with a neutral "Erfasst" / "Listed" status.

### Google Ratings Display

```tsx
({mosque.reviewCount} Rezensionen auf Google Maps)
```

**Found in `MosqueDetailView.tsx` L184.** Displaying Google review counts with attribution. This is factual attribution, not review text copying — acceptable, but should be minimal.

- **439 of 443** mosques have ratings (from Google Maps scrape)
- No review text is shown — only numerical rating + count ✅
- Attribution "auf Google Maps" is present ✅

**P1:** The `placeId` display on line 356: `Google Place ID: {mosque.placeId || 'Pilot ID'}` is an internal debug field — should be removed from public UI.

### Facilities Trust Audit

| Facility | true | false | null/unknown |
|---|---|---|---|
| womenArea | 0 | 0 | **443 (100%)** |
| parking | 20 | 0 | 423 |
| wudu | 0 | 0 | **443 (100%)** |
| wheelchairAccessible | 234 | 0 | 209 |
| restroom | 429 | 0 | 14 |

**Findings:**

1. `womenArea` is **null for 100% of records** — yet `MosqueDetailView.tsx` always shows the facility card with text "Vor Ort erfragen" when false/null. This is acceptable neutral messaging.
2. `wudu` is **null for 100% of records** — not shown in UI (correct — only shown when `=== true`)
3. `wheelchair` shows 234 as `true` — this comes from Google Maps "wheelchair accessible entrance" attribute. Provenance concern: may not reflect actual full accessibility.
4. `restroom` shows 429 as `true` — suspicious high coverage (97%). Likely from Google Maps "has restroom" attribute. May not be accurate.
5. `false` count is **0 for all facilities** — the pipeline maps `null`/`undefined` → `null`, never → `false`. ✅ CORRECT: unknown ≠ false.

**P0 Fix for detail page:** The `MosqueDetailView` facility section shows:
- `{mosque.facilities.womenArea ? 'Verfügbar' : 'Vor Ort erfragen'}` — shows "Vor Ort erfragen" for null. ACCEPTABLE but should say "Keine Angabe".
- `{mosque.facilities.wheelchairAccessible ? 'Barrierefreier Zugang' : 'Nicht bestätigt'}` — "Nicht bestätigt" is shown when null. This is CLOSE to "unknown ≠ false" but "Nicht bestätigt" implies false. → **Should be "Keine Angabe"**.
- `{mosque.facilities.parking ? 'Parkmöglichkeiten vorhanden' : 'Straßenparkplätze'}` — "Straßenparkplätze" implies negative/alternative when null. → **Should be "Keine Angabe"**.

### Prayer Times

```tsx
<span className="block mt-1 font-semibold">
  Freitagsgebet (Jummah): In der Regel zwischen 13:00 und 14:30 Uhr je nach Winter-/Sommerzeit.
</span>
```

**P1 VIOLATION:** This is a **hardcoded invented prayer time** — "In der Regel zwischen 13:00 und 14:30 Uhr" displayed universally for ALL mosques. This directly violates the project's data integrity rules. Must be **removed immediately**.

### HomeHero Trust Section

`HomeHero.tsx` line 265: `<h4>Geprüfte Ausstattung</h4>` — this is the trust section heading in the footer-like banner. "Geprüfte" (checked/verified) Ausstattung is misleading given that facilities are largely unknown. 

**P1 Fix:** Change to "Ausstattungsangaben" or "Einrichtungsmerkmale".

### i18n `communityVerified` strings

- DE: `"Gemeinde-verifiziert"` — misleading
- EN: `"Community Verified"` — misleading
- AR: `"معتمد مجتمعياً"` — misleading

All should be replaced with `"Erfasst"` / `"Listed"` / `"مُدرج"` or removed entirely.

---

## 6. MOBILE UX AUDIT

### Current Structure

- ✅ Mobile/list toggle exists (`mobileTab: 'list' | 'map'`)
- ✅ Map hidden on mobile when in list mode
- ✅ Touch-friendly buttons (py-2.5 = 40px+)
- ❌ **P1:** Map default zoom level and center are hardcoded to Köln — Berlin mosques will show centered on Köln
- ❌ **P2:** Map on mobile is 400px fixed height — usable but not maximized
- ❌ **P2:** No swipe-to-switch map/list behavior
- ✅ No horizontal overflow detected in code

### Responsive Breakpoints Used

- `sm:` = 640px (Tailwind default)
- `md:` = 768px
- `lg:` = 1024px

Grid: `grid-cols-1 lg:grid-cols-12` — collapses to single column on mobile ✅

---

## 7. ACCESSIBILITY AUDIT

| Element | Issue | Priority |
|---|---|---|
| Search input | No `aria-label` (only placeholder) | P1 |
| Filter buttons | No `aria-pressed` attribute | P1 |
| Mobile tab switcher | No `role="tablist"` / `aria-selected` | P2 |
| Map container | No `aria-label` describing map content | P2 |
| Map markers | Not keyboard navigable (Leaflet limitation) | P3 |
| Card hover states | Mouse-only `onMouseEnter/Leave` for sync | P2 |
| "Filter zurücksetzen" | Hardcoded DE string, not i18n | P1 |
| MosqueCard `<article>` | Good semantic HTML ✅ | — |
| Breadcrumbs | `<nav>` element ✅ | — |

---

## 8. CURRENT TESTS AUDIT

| Test File | Tests | Coverage |
|---|---|---|
| `phase1_5_audit.test.ts` | 18 | Sitemap, data integrity, SEO safety |
| `phase1_6_slug_fix.test.ts` | 5 | Slug uniqueness |
| `phase2a_multi_city.test.ts` | 32 | Pipeline, dedup, city isolation |
| `phase2b_seo.test.ts` | 20 | SEO regression |
| `seo-and-routes.test.ts` | 9 | Routes, JSON-LD, sitemap |
| `pipeline.test.ts` | 17 | Pipeline steps |
| **TOTAL** | **101** | — |

**Missing tests:**
- Search normalization (Koeln/Munchen/Muenchen)
- City count consistency (repo vs UI)
- Facility trust semantics (unknown ≠ false)
- Verification badge correctness
- `getNearby` excludes current mosque

---

## 9. STATIC ANALYSIS — HARDCODED STRINGS FOUND

| File | Line | Issue |
|---|---|---|
| `HomeHero.tsx` | 15-25 | **P0:** Hardcoded `count: [104,65,54,50,50,39,27,27,27]` in POPULAR_CITIES |
| `LeafletProvider.tsx` | 9 | **P1:** Hardcoded Köln center `[50.9375, 6.9603]` |
| `MosqueDetailView.tsx` | 145-150 | **P0:** Always-shown "Gemeinde-verifiziert" badge |
| `MosqueDetailView.tsx` | 184 | **P1:** "Rezensionen auf Google Maps" (provenance) |
| `MosqueDetailView.tsx` | 258 | **P1:** "Nicht bestätigt" for null wheelchair (unknown ≠ false) |
| `MosqueDetailView.tsx` | 270 | **P1:** "Straßenparkplätze" for null parking (unknown ≠ false) |
| `MosqueDetailView.tsx` | 299-302 | **P0:** Hardcoded invented Jummah times "13:00-14:30 Uhr" |
| `MosqueDetailView.tsx` | 356 | **P1:** "Google Place ID: ... Pilot ID" debug string |
| `HomeHero.tsx` | 265 | **P1:** "Geprüfte Ausstattung" heading — misleading |
| `i18n/index.ts` | 90 | **P0:** `communityVerified: 'Gemeinde-verifiziert'` — misleading |
| `SearchClient.tsx` | 89-97 | **P1:** No `normalizeGermanPhonetic` in client search |
| `SearchClient.tsx` | 306,351 | **P1:** "Filter zurücksetzen" hardcoded DE |

---

## 10. PERFORMANCE AUDIT

| Area | Finding |
|---|---|
| Leaflet loading | Dynamic import ✅ SSR disabled ✅ |
| Marker recreation | Full redraw on any `activeMarkerId` change ❌ |
| Initial data | Full 443 mosque JSON passed to client ⚠️ |
| `useMemo` usage | filteredMosques + mapMarkers memoized ✅ |
| Map `fitBounds` | Recalculates on every filter change ⚠️ |
| Client bundle | Leaflet ~142KB gzipped is expected |
| No clustering | 104 markers in Berlin = noisy at city zoom ❌ |

---

## PRIORITY MATRIX

### P0 — Blocker (Must Fix Before Anything Else)

1. **Hardcoded mosque counts** in `HomeHero.tsx` POPULAR_CITIES → derive from `repo.getCities()`
2. **Always-shown "Gemeinde-verifiziert" badge** in `MosqueDetailView.tsx` → replace with "Erfasst"
3. **Hardcoded invented Jummah prayer time** in `MosqueDetailView.tsx` → remove entirely
4. **`communityVerified` i18n string** "Gemeinde-verifiziert" — replace in DE/EN/AR

### P1 — Important (Implement in Phase 3A)

5. **Map default center hardcoded Köln** → compute from marker bounds or city center
6. **Client-side search not phonetically normalized** → add `normalizeGermanPhonetic` to `SearchClient.tsx`
7. **Facility nulls shown as specific negative text** ("Nicht bestätigt", "Straßenparkplätze") → "Keine Angabe"
8. **Google Place ID "Pilot ID" debug string** → remove from public UI
9. **"Geprüfte Ausstattung" misleading heading** in HomeHero → change wording
10. **Missing `aria-label`/`aria-pressed`** on search + filters
11. **"Filter zurücksetzen" hardcoded DE** → i18n
12. **Marker recreation on activeMarkerId change** → optimize
13. **Freitagsgebet hardcoded time notice** → already covered in P0 item 3

### P2 — Nice To Have (Polish, lower risk)

14. No marker clustering (would require `leaflet.markercluster` installation)
15. Popup "Details"/"Route" text i18n
16. `aria-selected` on mobile tab switcher
17. Map keyboard accessibility
18. `fitBounds` optimisation (debounce or stabilize)
