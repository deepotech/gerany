# Phase 15C — Final Production Redirect Readiness Check

**Project:** MoscheeAtlas  
**Domain:** `https://moscheeindernaehe.de`  
**Directory:** `C:\Users\HP\Desktop\Germany Mosque Finder`  
**Execution Date:** 2026-10-26 09:57–10:01 UTC  
**Scope:** Audit-only. No files modified, no commits, no deployment.

---

## 1. HTTP Status Code Discrepancy — Resolved

### 1.1 What `next.config.mjs` configures

[`next.config.mjs`](file:///C:/Users/HP/Desktop/Germany%20Mosque%20Finder/next.config.mjs) sets `permanent: true` for every redirect:

```js
async redirects() {
  return redirectsList.map((r) => ({
    source: r.source,
    destination: r.destination,
    permanent: r.permanent ?? true,  // all 74 entries have permanent: true
  }));
},
```

All 74 entries in [`src/data/redirects.json`](file:///C:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/data/redirects.json) carry `"permanent": true` (confirmed: `All permanent=true in redirects.json: true`).

### 1.2 What Next.js compiles `permanent: true` to

Next.js 14 compiles `permanent: true` to **HTTP 308** (Permanent Redirect) in its routes manifest, **not 301**. This is a deliberate Next.js design decision made in Next.js 13+: 308 is the method-preserving equivalent of 301. Both 308 and 301 mean "this URL has permanently moved"; the only difference is that 308 mandates that the request method is preserved on the redirect (POST stays POST), while 301 allows browsers to convert POST to GET. For all GET requests from browsers and Googlebot, they are functionally identical.

Confirmed by inspecting [`.next/routes-manifest.json`](file:///C:/Users/HP/Desktop/Germany%20Mosque%20Finder/.next/routes-manifest.json):

```
Total non-internal redirects in manifest: 74
All have statusCode: 308 (no 301 entries)
```

### 1.3 Why the Phase 15A probe script reported `301`

The probe script [`scripts/phase15a-probe-redirects.ts`](file:///C:/Users/HP/Desktop/Germany%20Mosque%20Finder/scripts/phase15a-probe-redirects.ts) accepts **both** 301 and 308 as success (line 59: `if (initial.status !== 301 && initial.status !== 308)`), but its output log template on line 97 **hardcodes** the string `"301"` regardless of the actual status received:

```ts
console.log(`301 -> ${normalizedLocation} (200 OK) ✅`);
```

This is a **display-only bug** in the probe script output. The actual HTTP status received from the server was **308** in all cases, as confirmed by the Phase 15C exact probe. No functional error existed — the test correctly validated both 301 and 308 as passing.

### 1.4 Phase 15C Exact Probe Results (live `next start` on port 3012)

The Phase 15C script ([`scripts/phase15c-exact-status-probe.ts`](file:///C:/Users/HP/Desktop/Germany%20Mosque%20Finder/scripts/phase15c-exact-status-probe.ts)) reported raw HTTP headers directly from the Node.js HTTP client against a live `next start` production server. Seven representative URLs were tested spanning all three locales and both suffix categories:

| Source URL | Actual Status | Location Header | Final Destination Status | Content-Type |
|---|:---:|---|:---:|---|
| `/de1` | **308** | `/de` | 200 OK | `text/html; charset=utf-8` |
| `/de/moschee/berlin/mehmed-zahid-kotku-sufi-lodge3` | **308** | `/de/moschee/berlin/mehmed-zahid-kotku-sufi-lodge` | 200 OK | `text/html; charset=utf-8` |
| `/de/moschee/koeln/ditib-el-aksa-moschee-meschenich4` | **308** | `/de/moschee/koeln/ditib-el-aksa-moschee-meschenich` | 200 OK | `text/html; charset=utf-8` |
| `/en/mosque/berlin/zeituna-mosque3` | **308** | `/en/mosque/berlin/zeituna-mosque` | 200 OK | `text/html; charset=utf-8` |
| `/en/mosque/bremen/bilal-habashi-moschee4` | **308** | `/en/mosque/bremen/bilal-habashi-moschee` | 200 OK | `text/html; charset=utf-8` |
| `/ar/mosque/muenchen/igmg-moschee-muenchen-moosach3` | **308** | `/ar/mosque/muenchen/igmg-moschee-muenchen-moosach` | 200 OK | `text/html; charset=utf-8` |
| `/ar/mosque/bremen/verband-der-islamischen-kulturzentren4` | **308** | `/ar/mosque/bremen/verband-der-islamischen-kulturzentren` | 200 OK | `text/html; charset=utf-8` |

**Each redirect also includes a `Refresh: 0;url=<dest>` fallback header** (standard Next.js behaviour for SSR redirect compatibility).

**Conclusion:** All redirects are correctly configured as permanent. The actual wire status is **HTTP 308 Permanent Redirect**. The "301" label in Phase 15A probe output was a cosmetic typo in the log format string only. Both 308 and 301 are treated identically by Google Search Console and all major browsers as permanent redirects.

---

## 2. Redirect Mapping Verification

### 2.1 Structural invariants (freshly run, 2026-10-26 09:59 UTC)

`npx tsx scripts/phase15b-audit-redirects.ts` — exit code **0**:

```
CSV URLs count:          74
Redirects in JSON:       74
Published Mosques:       601
All Entities:            661
Duplicate sources:       0
CSV paths missing in redirects: 0
Extra sources not in CSV:       0
Suffix breakdown: ending in 3 = 53, ending in 4 = 20, /de1 = 1, other = 0
Redirect chains count:   0
Redirect loops count:    0
Generic homepage fallbacks: 0
Failed items count:      0
ALL 74 REDIRECTS PASSED INTEGRITY VERIFICATION!
By locale: { de: 10, en: 53, ar: 11 }
```

### 2.2 Root-cause evidence for trailing-digit suffixes

The task requires that the Markdown-footnote root cause not be assumed without supporting evidence. Here is the direct evidence chain:

**Evidence 1 — Slugifier never emits bare trailing digits.**  
Inspecting [`src/pipeline/slugs.ts`](file:///C:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/pipeline/slugs.ts):
- `generateCanonicalSlug()` lowercases input and replaces non-`[a-z0-9]` characters with hyphens, then strips leading/trailing hyphens. A bare trailing digit can only appear if the original mosque name ends in a digit (e.g. a mosque named "Hidaje 4").
- `ensureUniqueSlugs()` resolves in-city collisions by appending `"-${count}"` (with a hyphen separator), never a bare digit.

**Evidence 2 — No published mosque slug ends in a bare digit.**  
`scripts/phase15c-slug-check.ts` confirmed: **0 mosques** in `src/data/mosques.json` have slugs ending in a bare trailing digit (without a hyphen before it). 6 mosques have hyphen-separated collision suffixes like `-2` or `-3`, all with an explicit hyphen separator that the slug generator enforces.

**Evidence 3 — No source slug (with digit appended) matches any canonical published slug.**  
None of the 74 source URLs (e.g. `zeituna-mosque3`) corresponds to a real published slug. All 74 stripped-digit destinations match verified canonical slugs. This confirms the digits are extraneous appendages, not part of any legitimate slug.

**Evidence 4 — The digit set is constrained (only `1`, `3`, `4`).**  
No GSC-reported URLs end in `0`, `2`, `5–9`, or letters. This is consistent with numeric reference/footnote markers (`[1]`, `[3]`, `[4]`) that appear immediately adjacent to URLs in citation formats and AI-generated content tables, where bracket stripping produces appended digits.

**Evidence 5 — Internal code generates zero such URLs.**  
The Phase 15B SSG verification confirmed all 74 destination `.html` files exist, and none of the prerendered pages or sitemap entries contains any trailing-digit variant. The defect is entirely external in origin.

**Conclusion:** The root cause evidence is internally consistent and logically complete. The digits are externally introduced URL corruptions, not a product of any internal slug generation, collision handling, or route configuration.

### 2.3 HOLD/REJECT, quarantine, and publication boundary check

`npx tsx scripts/phase14g-verify-boundaries.ts` — exit code **0**:

```
1. Palace Square in mosques.json:                   ABSENT ✅
2. Palace Square in all-entities.json:              status="REVIEWED" ✅
3. Palace Square repository lookup:                 NULL ✅
4. Palace Square in sitemap URLs:                   ABSENT ✅
5. Palace Square in generated Münster city pages:   ABSENT ✅
6. All 60 non-published entities:                   0 in mosques.json, 0 in sitemap ✅
7. All 11 candidate cities:                         UNPUBLISHED and NON-INDEXABLE ✅
8. Münster is the ONLY newly enabled city (Phase 14F) ✅
```

No redirect targets any HOLD/REJECT entity, unpublished city, or generic fallback.

---

## 3. Production SEO Verification

### 3.1 Sitemap

`npx tsx scripts/audit-sitemap.ts` — exit code **0**:

```
Total entries: 1,869 | Unique: 1,869 | Duplicates: 0 | Invalid: 0
```

### 3.2 SSG destination file coverage

`npx tsx scripts/phase15b-verify-ssg-destinations.ts` — exit code **0**:

```
Valid destination HTML files: 74 / 74   Missing: 0
```

All 74 destination pages carry correct `<link rel="canonical">` and tri-lingual `hreflang` (`de`, `en`, `ar`) alternates.

### 3.3 Published dataset metrics

| Metric | Current Value | Source |
|---|:---:|---|
| Published mosques | 601 | `src/data/mosques.json` |
| Total entities | 661 | `src/data/all-entities.json` |
| Published cities | 20 | `city-config.ts` / `city-registry-overrides.json` |
| Canonical sitemap URLs | 1,869 | `scripts/audit-sitemap.ts` |
| Prerendered static pages | 1,885 | `npm run build` (Phase 15B) |
| Configured permanent redirects | 74 | `src/data/redirects.json` |
| Quarantined records (REVIEWED/REJECTED) | 60 | `scripts/phase14g-verify-boundaries.ts` |

### 3.4 City route audit

`npx tsx scripts/phase14f-city-route-audit.ts` — exit code **0**:

```
Total published mosques: 601 (Expected: 601) ✅
Live cities: 20 (Expected: 20) ✅
Münster published mosques: 7 (Expected: 7) ✅
All 8 remaining candidate cities: UNPUBLISHED and NON-INDEXABLE ✅
All 601 published mosques: within Germany geographic bounds ✅
All 7 Münster mosques: valid postal codes 48143–48167 ✅
```

---

## 4. Repository and Regression Checks

### 4.1 Git status (`git status --short`)

The working tree has **20 modified tracked files** and **many untracked files** — all representing legitimate accumulated work across phases 8–15. No redirect-related source files have been modified in this phase (Phase 15C is audit-only). No commit, push, or deployment has occurred.

**Modified tracked files (all pre-existing from prior phases):**
- `next.config.mjs` (Phase 15A: redirect loading)
- `src/data/all-entities.json`, `src/data/mosques.json`, `src/data/city-registry-overrides.json` (Phase 14F: Münster promotion)
- Pipeline files: `city-config.ts`, `city-registry.ts`, `classify.ts`, `normalize.ts`, `runner.ts`, `translations.ts`
- Test files: `domain-migration.test.ts`, `phase4_pipeline.test.ts`, `phase5b.test.ts`, `phase6.test.ts`, `phase7.test.ts`, `phase_nearby_internal_linking.test.ts`, `pipeline.test.ts`
- `src/app/[locale]/mosques/[city]/page.tsx`, `src/components/MosqueDetailView.tsx`
- `reports/audit/production-audit-events.jsonl`

**New untracked files from this phase (audit artifacts only, not modifying application):**
- `scripts/phase15c-exact-status-probe.ts`
- `scripts/phase15c-run-exact-probe.ps1`
- `scripts/phase15c-slug-check.ts`
- `PHASE_15C_FINAL_PRODUCTION_REDIRECT_READINESS.md` (this file)

### 4.2 Automated checks (all run fresh on current working tree)

| Command | Exit Code | Result |
|---|:---:|---|
| `npm test` | `0` | **17/17 test suites, 308/308 tests passed** |
| `npx tsc --noEmit` | `0` | **0 TypeScript errors** |
| `npm run lint` | `0` | **0 ESLint warnings or errors** |
| `npm run data:audit` | `0` | 601/601 valid coords & schema; 0 critical issues |
| `npm run data:duplicates` | `0` | 0 exact duplicates; 1 probable (pre-existing, not redirect-related) |
| `npx tsx scripts/audit-sitemap.ts` | `0` | 1,869 unique valid URLs |
| `npx tsx scripts/phase14f-city-route-audit.ts` | `0` | All 20 cities and Münster routes verified |
| `npx tsx scripts/phase14g-verify-boundaries.ts` | `0` | All 60 quarantined records excluded |
| `npx tsx scripts/phase15b-audit-redirects.ts` | `0` | 74/74 redirect rules verified |
| `npx tsx scripts/phase15b-verify-ssg-destinations.ts` | `0` | 74/74 destination HTML files present & correct |
| `npx tsx scripts/phase15c-slug-check.ts` | `0` | 0 bare-digit slugs in mosques.json; 0 false mappings; 0 missing destinations |
| Live HTTP probe (`phase15c-run-exact-probe.ps1`) | `0` | 7/7 representative URLs → **HTTP 308 → HTTP 200 OK** |

> [!NOTE]
> `npm run build` (1,885 static pages) was confirmed clean during Phase 15B and the working tree has not been modified since. The build is current.

---

## 5. Open Items and Notes

### 5.1 Probe script cosmetic defect (non-blocking)

`scripts/phase15a-probe-redirects.ts` line 97 prints `"301 ->"` in its success log regardless of the actual status received (308). This is a **cosmetic display bug** in an audit/CI script only — it does not affect application behaviour, routing, or SEO. The test logic correctly accepts both 301 and 308. No correction is required for deployment; it can be addressed in a future housekeeping pass.

### 5.2 Probable duplicate in Bremen (pre-existing, non-blocking)

The duplicate audit flags `Masjid Al Sunnah Bremen` ↔ `Masjid sunnah Bremen` (phone match, 871m apart) as a probable unmerged duplicate. This is a pre-existing data quality candidate, predating Phase 15A, and is unrelated to any redirect mapping.

---

## 6. Final Verdict

All required checks passed on the live working tree as of **2026-10-26 ~10:01 UTC**:

- ✅ **Status code:** All 74 redirects emit **HTTP 308 Permanent Redirect** (correct Next.js 14 behaviour for `permanent: true`). The Phase 15A `"301"` label was a display-only typo in the probe script output, not a real 301.
- ✅ **Mapping accuracy:** 74/74 source-target pairs verified against `mosques.json`, `all-entities.json`, and SSG build output. Zero false targets, zero chains, zero loops.
- ✅ **Root cause evidence:** Pipeline and slug-generation source code confirms zero internal generators produce bare-trailing-digit slugs. No published slug ends in a bare digit. All 74 source slugs are extraneous-digit variants with no canonical counterpart.
- ✅ **Quarantine boundaries:** Palace Square Prayer Room and all 60 non-published entities remain strictly excluded.
- ✅ **Publication baseline unchanged:** 601 mosques, 20 cities, 1,869 sitemap URLs, 1,885 static pages.
- ✅ **All regression checks pass:** 308/308 tests, 0 TypeScript errors, 0 lint errors.

---

**`READY FOR DEPLOYMENT REVIEW`**
