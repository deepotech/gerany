# PHASE 3A — SEARCH & MAP INTERACTION SPECIFICATION
**Project:** MoscheeAtlas.de  
**Date:** 2026-09-29  
**Status:** IMPLEMENTED & VERIFIED

---

## 1. Unified Search Architecture

The search system is dual-layered to serve both search engine crawlers and interactive client-side users:
- **Server-Side (`src/lib/db/json-repository.ts`):** Powers static collection generation and query param filtering for crawlers and initial SSR.
- **Client-Side (`src/components/SearchClient.tsx`):** Powers instant live search, instant facet filtering, and bidirectional map interaction with zero roundtrips.

Both layers utilize the shared phonetic normalization algorithm: `src/lib/normalize.ts`.

---

## 2. Normalization & Query Matching

### Normalization Logic (`normalizeGermanPhonetic`)
1. Converts to lowercase and decomposes unicode diacritics (`NFD`).
2. Maps German umlauts and transliterations:
   - `ö` / `oe` → `o`
   - `ü` / `ue` → `u`
   - `ä` / `ae` → `a`
   - `ß` → `ss`
3. Strips punctuation and collapses redundant whitespace.

### Query Intent Routing
| Query Pattern | Example | Handling | Target Result |
|---|---|---|---|
| **City Name** | "Berlin", "Koeln", "Munchen" | Normalized city match | All published mosques in that city |
| **Postal Code** | "10115", "50667" | Substring match on `m.postalCode` | Mosques located within that postal code area |
| **Mosque Name** | "DITIB", "Fatih", "Zentralmoschee" | Title / Organization matching | Specific mosque records |
| **Combined** | "Moschee Berlin", "DITIB Köln" | Multi-token match: all tokens must match record attributes | Filtered list matching both city and keyword |
| **Street / District** | "Venloer", "Mitte" | Address and district matching | Localized prayer locations |

---

## 3. Map & List Synchronization

### Synchronization State Flow
```
User Search / Filters
        ↓
filteredMosques (useMemo)
        ↓
    ┌───┴────────────────────────┐
    ↓                            ↓
Mosque List (Cards)       Map Markers (Leaflet)
    │                            │
    │ hover / click              │ click marker
    └───> activeMarkerId <───────┘
            (Highlighted)
```

1. **Card Hover:** Hovering over a `MosqueCard` dispatches `activeMarkerId`, enlarging and accentuating the corresponding Leaflet pin.
2. **Marker Click:** Clicking a pin activates the mosque popup with localized "Details" and "Route" buttons.
3. **Dynamic Viewport Bounds:** `map.fitBounds(bounds)` automatically re-centers the map around the current active result set.
4. **Initial Center:** Uses first result coordinate or Germany geographic center `[51.1657, 10.4515]`, eliminating the former hardcoded Köln default.

---

## 4. Mobile UX & Responsive Breakpoints

- **Mobile Viewport Switcher:** On screens `< 1024px` (`lg:` breakpoint), a tab bar offers instantaneous switching between:
  - `[ Liste (Count) ]`: Scrollable mosque cards with touch-friendly navigation.
  - `[ Karte ]`: Full-width map viewport for geographic exploration.
- **Accessibility:** Added `role="tablist"`, `role="tab"`, and `aria-selected` attributes to ensure compatibility with screen readers.
- **Geolocation CTA:** "Moscheen in meiner Nähe" requests HTML5 Geolocation only upon explicit user touch, displaying a clear loading indicator and error recovery state if denied.
