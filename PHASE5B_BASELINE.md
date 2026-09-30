# Phase 5B — Pre-Import Production Baseline

**Captured At:** 2026-09-30T10:22:16.189Z
**Target Environment:** Production Dataset (Pre-Phase 5B Import)

---

## 1. Core Production Metrics

| Metric | Baseline Value | Note |
|---|---|---|
| **Total Published Records** | **443** | `src/data/mosques.json` |
| **Total All Entities** | **486** | `src/data/all-entities.json` |
| **Published Cities** | **9** | Berlin, Dortmund, Düsseldorf, Essen, Frankfurt, Hamburg, Köln, München, Stuttgart |
| **Verification Semantics** | **100% UNVERIFIED** (443/443) | Zero false verification badges |
| **Estimated Sitemap URLs** | **1362** | 3 home + 3 search + 27 city + 1,329 detail = 1,362 |

---

## 2. Published Records by City

| City | State | Published Count |
|---|---|---|
| Berlin | Germany | 104 |
| Dortmund | Germany | 50 |
| Düsseldorf | Germany | 27 |
| Essen | Germany | 27 |
| Frankfurt | Germany | 50 |
| Hamburg | Germany | 65 |
| Köln | Germany | 39 |
| München | Germany | 54 |
| Stuttgart | Germany | 27 |

---

## 3. Data Statuses in Production

### `src/data/mosques.json` (Published)
- **PUBLISHED:** 443

### `src/data/all-entities.json` (Complete Pool)
- **PUBLISHED:** 443
- **REVIEWED:** 39
- **REJECTED:** 4

---

## 4. Categories Breakdown (Published)
- **MOSQUE:** 419
- **ISLAMIC_CENTER:** 24

---

## 5. Verification Protection Statement
All 443 existing published records must remain completely intact throughout Phase 5B.
No existing records may be deleted, renamed, re-slugged, or mutated without deterministic justification.
