# Phase 6 — Scalable SEO Architecture & Indexation Safeguards

**Domain:** `https://moscheeatlas.de`  
**Target:** 14 Published Cities, 542 Mosques, 1,674 Canonical URLs  

---

## 1. Indexation Rules & Safeguards

The MoscheeAtlas.de architecture strictly enforces that indexation is a consequence of operator approval and data quality, not data existence.

### Allowed in Sitemap & Search Engine Index:
- ✅ **Homepages:** `/de`, `/en`, `/ar` (Priority 1.0)
- ✅ **Search Hubs:** `/de/moscheen`, `/en/mosques`, `/ar/mosques` (Priority 0.9)
- ✅ **City Collection Pages:** Exactly 14 published cities with >= 1 published mosque (Priority 0.9)
- ✅ **Mosque Detail Pages:** Exactly 542 approved published mosques (Priority 0.8)

### Explicitly Excluded from Indexation:
- ❌ **Unpromoted Candidate Cities:** (Hannover, Duisburg, Bochum, Mannheim, Dresden) -> `notFound()` / 404 with `noindex, nofollow`.
- ❌ **Review Queue Records:** `dataStatus: 'REVIEWED'` -> never appear in sitemap or public URLs.
- ❌ **Rejected Records:** `dataStatus: 'REJECTED'` -> zero public exposure.
- ❌ **Admin & Internal Operations Routes:** Blocked via `robots.txt` (`Disallow: /*/admin`).
- ❌ **Query Parameter URLs:** Public search handles client state without emitting indexable query URLs.

---

## 2. Multilingual Parity & Hreflang Alignment

All 542 published records and 14 published cities emit exact 3-way language alternates:
- **German (Default):** `/de/moschee/:city/:slug`
- **English:** `/en/mosque/:city/:slug`
- **Arabic:** `/ar/mosque/:city/:slug`

Every canonical tag points strictly to the corresponding localized route with matching `hreflang` link headers.
