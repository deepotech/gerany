# Phase 12B — Aachen Promotion Report

**Date:** 2026-10-25  
**Project:** MoscheeAtlas — Germany-wide mosque directory  
**Scope:** Controlled local promotion of Aachen. No commit, push, or deployment performed.

---

## 1. Baseline Before Promotion

| Metric | Before | After |
|---|---|---|
| Published mosque records | 566 | 575 |
| Published cities | 16 | 17 |
| Entities in `all-entities.json` | 619 | 631 |
| Sitemap URLs | 1,752 | 1,782 |

---

## 2. Records Promoted (9 READY → PUBLISHED)

| # | Place ID | Canonical Name | Address | Postal |
|---|---|---|---|---|
| 1 | `ChIJh0sx7YKZwEcRW41xfWOKZDY` | Islamic Center Bilal Mosque | Professor-Pirlet-Straße 20 | 52074 |
| 2 | `ChIJVUW0AF6ZwEcR5YU6bdKp1xY` | Al-Imam-Malik Moschee | Ottostraße 89 | 52070 |
| 3 | `ChIJPcI5cWeZwEcRkg9lcWgr2lM` | IGMG Eyüp Sultan Moschee Aachen | Adalbertsteinweg 26 | 52070 |
| 4 | `ChIJHZuj5VKZwEcRDqgK7_FORTc` | Aachen Central Mosque | Stolberger Str. 209 | 52068 |
| 5 | `ChIJ15iI1CqfwEcRK8T5wcgZL_c` | Islamisch Albanisches Kulturzentrum | Eisenbahnweg 28 | 52068 |
| 6 | `ChIJF-P2ijeZwEcRj7EtsqZJyB8` | Mansoor Moschee | Feldstraße 47 | 52070 |
| 7 | `ChIJa0TNSgCfwEcR2e2wy49fFJg` | Markaz Imam al Mahdi (ajf.) | Von-Coels-Straße 167 | 52080 |
| 8 | `ChIJY3OyekGfwEcRuwgyz7Sl1ww` | IGBD Bosnische Moschee Aachen | Josefstraße 158 | 52080 |
| 9 | `ChIJxwf5-f2bwEcRT7c3YOFRW0M` | Verband der Islamischen Kulturzentren e.V. (Moschee/Cami) | Robert-Koch-Straße 28 | 52066 |

All 9 records sourced from `aachen,germany.json`. Status in `all-entities.json`: `PUBLISHED`.

---

## 3. Non-Promoted Records (3)

### 3a. HOLD — Masjid As-Sunnah
- **Place ID:** `ChIJe_pj22eZwEcRTuI3E3h_3jg`
- **Reason:** Raw source fields `street` and `postalCode` contain the literal string `"null"` — no discrete street address is available. The normalizer was fixed to handle this cleanly (see §5), but the record remains HOLD until its street address can be positively identified. A postal-code-only address (`52070 Aachen, Germany`) is not sufficient for publication.
- **Route:** `/de/moschee/aachen/masjid-as-sunnah` → **404** ✅

### 3b. HOLD — Nurya Sufyania (A. T. E. D. C)
- **Place ID:** `ChIJlVXteACZwEcRnYHTboYQHY4`
- **Reason:** Sufi zawiya open Sunday only (11:00–16:00), 0 reviews, no congregational prayer evidence. Does not meet the mosque/Islamic prayer facility threshold.

### 3c. REJECT — Minaret Aachen Central Mosque Ditib (Yunus Emre Moschee Aachen)
- **Place ID:** `ChIJXWdURwCZwEcRDgwXf7lfYgY`
- **Reason:** Architectural pin 37 m from Aachen Central Mosque (record #4, same complex). Duplicate entry — would create a false second mosque listing for the same facility.
- **Route:** `/de/moschee/aachen/minaret-aachen-central-mosque-ditib-yunus-emre-moschee-aachen` → **404** ✅

---

## 4. Files Changed

### Data Files
| File | Change |
|---|---|
| `src/data/mosques.json` | 566 → 575 records (9 Aachen records appended) |
| `src/data/all-entities.json` | 619 → 631 records (9 PUBLISHED + 2 HOLD + 1 REJECTED) |
| `src/data/city-registry-overrides.json` | Aachen entry added: `status: "PUBLISHED"`, `publicationEnabled: true`, `seoIndexable: true` |

### Pipeline / Configuration
| File | Change |
|---|---|
| `src/pipeline/city-config.ts` | Aachen moved from `EXTENDED_CITY_CONFIGS` into `CITY_CONFIGS` (published pool) |
| `src/pipeline/normalize.ts` | Normalizer fix — see §5 |
| `src/app/[locale]/mosques/[city]/page.tsx` | `'Aachen': 'آخن'` added to `ARABIC_CITY_NAMES` map |
| `src/pipeline/translations.ts` | `'Aachen': 'آخن'` already present (added in prior phase) |

### Test Baselines Updated
| File | Updated To |
|---|---|
| `tests/domain-migration.test.ts` | 575 mosques / 17 cities / 1,782 sitemap URLs |
| `tests/phase5b.test.ts` | 575 mosques / 17 cities / 1,782 sitemap URLs |
| `tests/phase6.test.ts` | 575 mosques / 17 cities / 1,782 sitemap URLs |
| `tests/phase7.test.ts` | 575 mosques / 631 entities |
| `tests/phase_nearby_internal_linking.test.ts` | 575 mosques / 17 cities / 1,782 sitemap URLs |
| `tests/pipeline.test.ts` | +2 regression tests for null-address normalization (now 19 tests) |

---

## 5. Normalizer Fix — `src/pipeline/normalize.ts`

**Problem:** The raw Aachen record for Masjid As-Sunnah stores the literal strings `"null"` in its `postalCode` and `street` fields. The original normalizer treated these as real values, producing a malformed address: `"52070 Aachen, 52070 Aachen (Germany), Germany"`.

**Fix applied (minimal, safe, generic):**

1. **Strips literal `"null"` / `"undefined"` from `postalCode`** — any record with `postalCode: "null"` now has `postalCode: null` after normalization.
2. **Suppresses streets that start with a 5-digit postal code** — prevents a bare postal-code string from being used as the street line (e.g., `"52070 Aachen"` is not a valid street name).
3. **Excludes `"Germany"` / `"Deutschland"` from district classification** — prevents the country name from appearing as a district in formatted addresses.
4. **Falls back to clean `formattedAddress`** when the street is null after stripping, producing `"52070 Aachen, Germany"` instead of the broken form.

**Regression tests added to `tests/pipeline.test.ts`:**
- `'safely normalizes address when street and postal fields contain literal "null" strings'`
- `'does not classify Germany or Deutschland as a district name'`

The fix affects only records with the stated malformed raw fields. All 300 existing tests continued to pass after the change.

---

## 6. Quality Gates — All Passed ✅

| Gate | Result |
|---|---|
| `npm test` (16 files, 300 tests) | ✅ Exit 0, 100% pass |
| `npx tsc --noEmit` | ✅ Exit 0, no type errors |
| `npm run lint` | ✅ Exit 0, no lint warnings |
| `npm run data:audit` | ✅ 575 mosques, 100% valid coords/schema, 0 warnings |
| `npm run data:duplicates` | ✅ 0 exact duplicates, 0 regressions |
| Production build (`npm run build`) | ✅ Exit 0, 1,798 static pages generated |

---

## 7. Route Smoke Tests — All 11 Passed ✅

| Route | Expected | Result |
|---|---|---|
| `/de/moscheen/aachen` | 200 OK | ✅ |
| `/en/mosques/aachen` | 200 OK | ✅ |
| `/ar/mosques/aachen` | 200 OK | ✅ |
| `/de/moschee/aachen/islamic-center-bilal-mosque` | 200 OK | ✅ |
| `/de/moschee/aachen/aachen-central-mosque` | 200 OK | ✅ |
| `/ar/mosque/aachen/al-imam-malik-moschee` | 200 OK | ✅ |
| `/de/moschee/aachen/masjid-as-sunnah` | 404 (HOLD) | ✅ |
| `/de/moschee/aachen/minaret-aachen-central-mosque-ditib-yunus-emre-moschee-aachen` | 404 (REJECTED) | ✅ |
| `/de/moscheen/luebeck` | 200 OK (Lübeck intact) | ✅ |
| `/de/moscheen/mainz` | 404 (unpublished) | ✅ |
| `/en/mosques/bielefeld` | 404 (unpublished) | ✅ |

---

## 8. Sitemap

- **1,782 URLs** (formula: `3 + 3 + (17 × 3) + (575 × 3)`)
- Aachen city pages: 3 (de / en / ar)
- Aachen detail pages: 27 (9 mosques × 3 locales)
- Duplicate URLs: 0

---

## 9. Remaining Candidate Cities (All Unpublished)

Saarbrücken, Freiburg im Breisgau, Kiel, Mainz, Regensburg, Karlsruhe, Augsburg, Bielefeld, Münster.

All 9 cities remain disabled. Their routes return 404. No data from these cities appears in `mosques.json`, `all-entities.json`, or the sitemap.

---

## 10. Git Status

All changes are in the working tree. **No commits, no pushes, no deployment performed.**

18 tracked files modified. Untracked files include raw source JSON files, audit reports, and helper scripts — all preserved unchanged.

---

## 11. Arabic City Name

Aachen is listed as **آخن** in all Arabic-locale city pages, navigation, and structured data, consistent with the project's existing translation conventions.
