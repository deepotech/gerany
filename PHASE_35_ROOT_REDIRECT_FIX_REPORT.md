# PHASE 35 — Root HTTP Redirect Fix Report

**Date:** 2026-11-05  
**Branch:** `main` (not committed — owner must review and commit separately)  
**Status:** ✅ COMPLETE — Local implementation, validation, and live HTTP verification passed  
**Phase 36 correction:** Report updated to fix erroneous "4,073 redirect rules" claim; actual count is **454**. Live HTTP probe added.

---

## 1. Problem Statement

`GET /` on `https://moscheeindernaehe.de` returned:
- HTTP **307 Temporary Redirect**
- **Missing `Location` header**
- Body: Next.js error HTML containing the German 404 page

**Root cause (Phase 34 confirmed):**  
`src/app/page.tsx` called `redirect('/de')` from a Next.js Server Component. During `next build` SSG prerendering, this produced `.next/server/app/index.meta` with `{"status":307,"headers":{"x-next-cache-tags":"..."}}` — **no `location` key**. The production server therefore emitted HTTP 307 with zero `Location:` header. Standard HTTP clients (Googlebot, AdSense crawlers, curl) cannot follow a redirect without a `Location` header.

---

## 2. Fix Applied

### 2a. `next.config.mjs` — Root redirect added as first rule

**Before:**
```javascript
async redirects() {
  return redirectsList.map((r) => ({
    source: r.source,
    destination: r.destination,
    permanent: r.permanent ?? true,
  }));
},
```

**After:**
```javascript
async redirects() {
  return [
    {
      source: '/',
      destination: '/de',
      permanent: false,
    },
    ...redirectsList.map((r) => ({
      source: r.source,
      destination: r.destination,
      permanent: r.permanent ?? true,
    })),
  ];
},
```

**Effect:** Next.js now handles `GET /` at the router layer — before the App Router is consulted — emitting a proper HTTP 307 with `Location: /de`. The 454 existing redirect rules are preserved and follow the new entry.

### 2b. `src/app/page.tsx` — Broken SSG redirect removed

**Before:**
```tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/de');
}
```

**After:**
```tsx
// Root redirect is handled by next.config.mjs redirects().
// This page component is preserved as a fallback but should never be rendered
// in normal traffic. The next.config.mjs redirect fires before the App Router.
export default function RootPage() {
  return null;
}
```

**Effect:** The SSG prerender no longer generates an RSC redirect digest. `index.meta` no longer contains a broken `status: 307` without `location`. The `next.config.mjs` redirect intercepts the request before the App Router, so this component is never reached.

---

## 3. New Test File

**`tests/phase35_root_redirect.test.ts`** — 15 tests covering:

| # | Test |
|---|------|
| 1 | `next.config.mjs` contains root redirect entry (`source: '/'`, `destination: '/de'`) |
| 2 | Root redirect appears **before** `...redirectsList` spread (fires first) |
| 3 | `permanent: false` → HTTP 307, not 301 |
| 4 | `redirects.json` contains exactly **454** rules (invariant preserved) |
| 5 | Destination `/de` is **not** a source in `redirects.json` (no loop) |
| 6 | Source `/` is **not** already in `redirects.json` (no conflict) |
| 7 | All 454 existing rules have non-empty source and destination |
| 8 | `page.tsx` does **not** import `redirect` from `next/navigation` |
| 9 | `page.tsx` does **not** call `redirect()` |
| 10 | `page.tsx` exports a default function (`RootPage`) |
| 11 | `src/app/sitemap.ts` still exists |
| 12 | `sitemap.ts` does not reference `/de/sitemap.xml` |
| 13 | `robots.ts` references canonical `sitemap.xml` (no locale prefix) |
| 14 | `public/ads.txt` exists |
| 15 | `ads.txt` contains `google.com` publisher line |

---

## 4. Validation Results

### 4.1 Full Test Suite
```
Test Files  23 passed (23)
Tests       379 passed (379)   ← was 364; +15 new Phase 35 tests
Duration    ~4s
```
**Result: ✅ All 379 tests pass. Zero failures.**

> **Note:** `reports/audit/production-audit-events.jsonl` is auto-modified by the test suite (pre-existing side-effect of `audit-log.ts`). It was restored via `git checkout -- reports/audit/production-audit-events.jsonl` after the test run.

### 4.2 TypeScript
```
npx tsc --noEmit
```
**Result: ✅ 0 errors, 0 warnings.**

### 4.3 ESLint
```
npx next lint
✔ No ESLint warnings or errors
```
**Result: ✅ Clean.**

### 4.4 Production Build
```
npx next build
✓ Compiled successfully
✓ Generating static pages (1891/1891)
```

**Route table (relevant entries):**
```
○ /                      154 B    87.9 kB   ← Static (no RSC redirect)
○ /robots.txt            0 B      0 B
○ /sitemap.xml           0 B      0 B
● /[locale]              3.83 kB  105 kB    (de, en, ar)
● /[locale]/moschee/[city]/[slug]           (601 mosques × de)
● /[locale]/mosque/[city]/[slug]            (601 mosques × en + ar)
```

**Result: ✅ Build succeeded. Exit code 0.**

### 4.5 Build Artifact Verification

**`.next/server/app/index.meta` (before fix):**
```json
{"status": 307, "headers": {"x-next-cache-tags": "..."}}
```
*(No `location` key — the broken state)*

**`.next/server/app/index.meta` (after fix):**
```json
{"headers": {"x-next-cache-tags": "_N_T_/layout,_N_T_/page,_N_T_/"}}
```
*(No redirect digest — correct. The redirect is handled by the router layer, not SSG.)*

**Result: ✅ Root route no longer pre-renders an RSC redirect digest.**

### 4.6 Live Local Production Server HTTP Probe (Phase 36 — verified)

A local `next start` production server was started on port 3099 from the final build. All endpoints were probed with `curl.exe` (Windows system curl, `C:\WINDOWS\system32\curl.exe`) with redirects disabled (`--max-redirs 0`) to capture raw HTTP responses.

**`GET /` — no redirect follow:**
```
HTTP/1.1 307 Temporary Redirect
location: /de
Date: Thu, 05 Nov 2026 09:36:31 GMT
Connection: keep-alive
Transfer-Encoding: chunked
```
✅ Status: 307. `location: /de` header present. Body: `"/de\n"` (3 bytes) — no HTML, no 404 page.

**`GET /` — following redirect to final destination:**
```
FinalStatus: 200   FinalURL: http://localhost:3099/de
```
✅ Single hop. No loop. Final status 200.

**`GET /de` (no trailing slash):**
```
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Content-Length: 80430
x-nextjs-cache: HIT
```
✅ 200 OK — homepage loads directly.

**`GET /de/` (trailing slash):**  
Status: 308 — trailing-slash normalizer (pre-existing behavior, not introduced by this fix).

**`GET /en/`:** Status 308 (trailing-slash normalizer — expected).

**`GET /sitemap.xml`:** Status 200, `Content-Type: application/xml` ✅

**`GET /robots.txt`:** Status 200 ✅

**Body check `GET /` (no follow):**  
Body = `"/de\n"` (3 chars). Does NOT contain `"Diese Seite existiert leider nicht"` or `__next_error__`. ✅

---



## 5. Invariants Verified

| Invariant | Value | Status |
|-----------|-------|--------|
| Published mosques | 601 | ✅ Unchanged |
| Published cities | 20 | ✅ Unchanged |
| Redirect rules (`redirects.json`) | 454 | ✅ Unchanged |
| Sitemap URLs | 1,869 | ✅ Unchanged (sitemap.ts not modified) |
| `ads.txt` | Present, contains `google.com` | ✅ Unchanged |
| AdSense default state | Disabled (`ENABLE_ADSENSE = false`) | ✅ Unchanged |
| Cookie consent behavior | Unchanged | ✅ Not modified |
| GA4 behavior | Unchanged | ✅ Not modified |
| `robots.txt` Sitemap directive | `https://moscheeindernaehe.de/sitemap.xml` | ✅ Unchanged |
| Canonical URLs | Unchanged | ✅ Not modified |
| hreflang tags | Unchanged | ✅ Not modified |
| `/de/`, `/en/`, `/ar/` routes | 1891 static pages built | ✅ All present |

---

## 6. Changed Files Summary

```
modified:   next.config.mjs         (+12 lines, -5 lines)
modified:   src/app/page.tsx        (+4 lines, -3 lines)
new file:   tests/phase35_root_redirect.test.ts   (170 lines, 15 tests)
```

**Files NOT modified:** All routes, middleware (none exists), sitemap, robots, ads.txt, redirects.json, all locale pages, all mosque pages, all city pages, consent scripts, GA4 scripts, AdSense config, canonical/hreflang generation.

---

## 7. Git Status

```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
    modified:   next.config.mjs
    modified:   src/app/page.tsx

Untracked files:
    PHASE_29_PRODUCTION_SEO_REGRESSION_REPORT.md
    PHASE_30_REAL_TRAFFIC_INVESTIGATION.md
    PHASE_31_TRAFFIC_DECLINE_VERIFICATION.md
    PHASE_32_SITEMAP_INCIDENT_REPORT.md
    PHASE_33_ADSENSE_APPLICATION_INVESTIGATION.md
    PHASE_34_ROOT_REDIRECT_VERIFICATION.md
    tests/phase35_root_redirect.test.ts
    PHASE_35_ROOT_REDIRECT_FIX_REPORT.md
```

**No commit was made. No push was made. No deployment was made.**

---

## 8. Expected Production Behavior After Deployment

| Request | Before Fix | After Fix |
|---------|-----------|-----------|
| `GET /` | HTTP 307, **no Location**, 404 HTML body | HTTP 307, **Location: /de**, empty body |
| Follow redirect | ❌ Client cannot follow (no Location) | ✅ Reaches `/de` → HTTP 200 |
| Googlebot `GET /` | ❌ Cannot crawl, sees 404 HTML | ✅ Follows to `/de`, indexes homepage |
| AdSense crawler `GET /` | ❌ Sees 404 page, rejects site | ✅ Follows to `/de`, evaluates content |
| `GET /de/`, `/en/`, `/ar/` | ✅ Working | ✅ Unchanged |
| `GET /sitemap.xml` | ✅ 1,869 URLs | ✅ Unchanged |
| `GET /robots.txt` | ✅ Correct | ✅ Unchanged |

---

## 9. Owner Action Required

1. **Review** the two changed files: `next.config.mjs` and `src/app/page.tsx`
2. **Commit** when satisfied:
   ```bash
   git add next.config.mjs src/app/page.tsx tests/phase35_root_redirect.test.ts
   git commit -m "fix: root redirect via next.config.mjs — emit HTTP 307 with Location header"
   ```
3. **Deploy** to Railway (triggers automatic redeploy from `main`)
4. **Verify production** after deploy:
   ```bash
   curl -I https://moscheeindernaehe.de/
   # Expected: HTTP/2 307, location: /de
   ```
5. **Resubmit AdSense** application once root redirect is confirmed working in production
