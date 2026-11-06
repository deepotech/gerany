# PHASE 38 — Dual Sitemap Support Report (`/sitemap.xml` & `/de/sitemap.xml`)

**Execution Date:** November 6, 2026  
**Environment:** MoscheeAtlas (`https://moscheeindernaehe.de`)  
**Scope:** Phase 38 — Support Both Root and German Sitemap URLs  
**Verdict:** **`READY FOR OWNER REVIEW`**

---

## 1. Executive Summary

In Phase 38, both sitemap endpoints:
1. `https://moscheeindernaehe.de/sitemap.xml` (Canonical root sitemap)
2. `https://moscheeindernaehe.de/de/sitemap.xml` (German sitemap previously submitted to Google Search Console)

have been verified and configured to return **HTTP 200 OK** directly (zero redirect hops), with `Content-Type: application/xml`, serving the identical dataset of **1,869 canonical URLs**.

This was achieved without duplicating data sources, without modifying any mosque or city records, without affecting any of the 454 existing redirects in `redirects.json`, and without altering `robots.txt` (which correctly continues to reference the root canonical sitemap).

---

## 2. Files Inspected

- `src/app/sitemap.ts` — Existing Next.js App Router metadata route handler generating 1,869 canonical sitemap entries.
- `src/app/robots.ts` — Robots configuration declaring canonical root sitemap `https://moscheeindernaehe.de/sitemap.xml`.
- `next.config.mjs` — Next.js configuration containing root redirect (`/` -> `/de`), security headers, and 454 production redirects.
- `src/data/redirects.json` — 454 redirect mappings (verified none target sitemap routes).
- `src/app/[locale]/layout.tsx` — Dynamic locale layout router.
- `src/app/not-found.tsx` — Custom German 404 handler previously served on `/de/sitemap.xml`.
- `tests/phase35_root_redirect.test.ts` — Existing invariants for root redirects, sitemap presence, and robots.txt.
- `PHASE_32_SITEMAP_INCIDENT_REPORT.md` — Historical incident report detailing root sitemap vs GSC submission.

---

## 3. Files Changed & Added

### Modified
- `next.config.mjs` — Added Next.js internal `rewrites()` rule mapping `/de/sitemap.xml` -> `/sitemap.xml`.

### Added
- `tests/phase38_dual_sitemap.test.ts` — 11 automated test assertions verifying dual sitemap availability, URL count, schema validity, exclusion of unpublished entities, robots reference, and redirect rule preservation.

### No Unrelated Files Modified
- `src/app/sitemap.ts` — **Unchanged**
- `src/app/robots.ts` — **Unchanged**
- `src/data/redirects.json` — **Unchanged** (all 454 rules intact)
- All data records (`src/data/mosques.json`, `src/data/cities.json`, etc.) — **Unchanged**

---

## 4. Implementation Approach

### Next.js Internal Rewrite Architecture
Next.js App Router provides native URL rewriting via `next.config.mjs`:
```javascript
  async rewrites() {
    return [
      {
        source: '/de/sitemap.xml',
        destination: '/sitemap.xml',
      },
    ];
  },
```

### Key Architectural Advantages
1. **Single Source of Truth**: The existing `src/app/sitemap.ts` remains the sole generator for sitemap data. There is no duplicate generator or separate sitemap file.
2. **HTTP 200 OK Direct Response**: Internal rewriting occurs on the server side prior to response delivery. No HTTP 301/302 redirects are sent to clients or Googlebot. Both URLs return HTTP 200 OK directly.
3. **Identical XML Payload & Headers**: Because `/de/sitemap.xml` is resolved to `/sitemap.xml`, the XML output, byte count, `Content-Type: application/xml`, cache headers, and timestamp metadata are 100% identical.
4. **Bypasses Dynamic Locale Catch-All**: The rewrite matches `/de/sitemap.xml` directly before Next.js evaluates the dynamic `src/app/[locale]/` folder, completely eliminating the former 404 response.
5. **No Route or Pipeline Interference**: Preserves all 454 redirects in `redirects.json`, all canonical tags, hreflang links, and robots rules.

---

## 5. Actual Sitemap URL Count & Data Source

- **Total Sitemap URL Count:** **1,869** canonical URLs
- **Breakdown:**
  - Homepages (3 locales: `/de`, `/en`, `/ar`): **3**
  - Search Hubs (3 locales: `/de/moscheen`, `/en/mosques`, `/ar/mosques`): **3**
  - City Collection Hubs (20 published cities × 3 locales): **60**
  - Mosque Detail Pages (601 published mosques × 3 locales): **1,803**
  - **Total:** `3 + 3 + 60 + 1,803 = 1,869`
- **Data Integrity:**
  - Duplicate URLs in sitemap: **0**
  - Admin URLs in sitemap: **0**
  - Unpublished cities (e.g. Bochum, Dresden) in sitemap: **0**
  - Non-published mosques (REVIEW / REJECTED) in sitemap: **0**

---

## 6. Real HTTP Live Validation

Local production server was started on `127.0.0.1:3010` via `next start` and live HTTP GET requests were performed against `/sitemap.xml`, `/de/sitemap.xml`, and `/robots.txt`.

### A. Request: `GET /sitemap.xml`
- **HTTP Status:** `200 OK`
- **Content-Type:** `application/xml`
- **Body Length:** 372,441 bytes
- **Response Headers:**
  ```http
  HTTP/1.1 200 OK
  cache-control: public, max-age=0, must-revalidate
  content-type: application/xml
  content-security-policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://*.googletagmanager.com https://pagead2.googlesyndication.com https://*.pagead2.googlesyndication.com https://adservice.google.com https://fundingchoicesmessages.google.com https://*.googlesyndication.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:; frame-src 'self' https://googleads.g.doubleclick.net https://fundingchoicesmessages.google.com https://*.doubleclick.net https://tpc.googlesyndication.com https://*.googlesyndication.com;
  permissions-policy: camera=(), microphone=(), geolocation=(self)
  referrer-policy: strict-origin-when-cross-origin
  strict-transport-security: max-age=63072000; includeSubDomains; preload
  vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch
  x-content-type-options: nosniff
  x-dns-prefetch-control: on
  x-frame-options: SAMEORIGIN
  x-nextjs-cache: HIT
  ```

### B. Request: `GET /de/sitemap.xml`
- **HTTP Status:** `200 OK`
- **Content-Type:** `application/xml`
- **Body Length:** 372,441 bytes
- **Response Headers:**
  ```http
  HTTP/1.1 200 OK
  cache-control: public, max-age=0, must-revalidate
  content-type: application/xml
  content-security-policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://*.googletagmanager.com https://pagead2.googlesyndication.com https://*.pagead2.googlesyndication.com https://adservice.google.com https://fundingchoicesmessages.google.com https://*.googlesyndication.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:; frame-src 'self' https://googleads.g.doubleclick.net https://fundingchoicesmessages.google.com https://*.doubleclick.net https://tpc.googlesyndication.com https://*.googlesyndication.com;
  permissions-policy: camera=(), microphone=(), geolocation=(self)
  referrer-policy: strict-origin-when-cross-origin
  strict-transport-security: max-age=63072000; includeSubDomains; preload
  vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch
  x-content-type-options: nosniff
  x-dns-prefetch-control: on
  x-frame-options: SAMEORIGIN
  x-nextjs-cache: HIT
  ```

### C. Request: `GET /robots.txt`
- **HTTP Status:** `200 OK`
- **Content-Type:** `text/plain`
- **Body Content:**
  ```text
  User-Agent: *
  Allow: /
  Disallow: /*/admin
  Disallow: /admin
  Disallow: /api/
  Disallow: /*?*query=
  Disallow: /*?*district=

  Sitemap: https://moscheeindernaehe.de/sitemap.xml
  ```

---

## 7. XML Equality Verification

| Check | Root `/sitemap.xml` | German `/de/sitemap.xml` | Match Status |
| :--- | :--- | :--- | :--- |
| **HTTP Status Code** | 200 OK | 200 OK | **Identical** |
| **Content-Type** | `application/xml` | `application/xml` | **Identical** |
| **XML Declaration** | `<?xml version="1.0" encoding="UTF-8"?>` | `<?xml version="1.0" encoding="UTF-8"?>` | **Identical** |
| **Root Tag** | `<urlset xmlns="...">` | `<urlset xmlns="...">` | **Identical** |
| **Total `<loc>` entries**| 1,869 | 1,869 | **Identical** |
| **Exact Byte Count** | 372,441 bytes | 372,441 bytes | **Identical** |
| **Byte-for-byte Equality**| `true` | `true` | **100% Strict Match** |

---

## 8. Automated Test Results

- **Test Suite:** Vitest v2.1.9
- **Total Test Files:** 24 passed (24)
- **Total Tests:** 390 passed (390)
- **New Tests Added (`tests/phase38_dual_sitemap.test.ts`):** 11 tests
  1. Root sitemap generation returns exactly 1,869 entries.
  2. `next.config.mjs` defines the `/de/sitemap.xml` rewrite to `/sitemap.xml`.
  3. Both endpoints serve identical URL entries without duplicate datasets.
  4. Generated sitemap build artifact is valid XML.
  5. Sitemap route produces `application/xml` content type metadata.
  6. Neither sitemap definition produces an HTML error page.
  7. No duplicate URLs exist in the sitemap dataset.
  8. Expected URL count matches exact formula (`3 + 3 + 20*3 + 601*3 = 1869`).
  9. Unpublished cities (Bochum, Dresden, etc.) and REVIEW/REJECTED mosques are strictly excluded.
  10. `robots.txt` strictly references the root canonical sitemap URL.
  11. Preserves all 454 redirect rules in `next.config.mjs` without interference.

---

## 9. TypeScript, ESLint & Production Build

- **ESLint (`npm run lint`):** `✔ No ESLint warnings or errors`
- **TypeScript (`npx tsc --noEmit`):** Exit code 0, 0 type errors.
- **Production Build (`npm run build`):**
  - Compiled successfully
  - Prerendered static pages: 1,891 / 1,891 pages generated
  - Static sitemap route generated: `○ /sitemap.xml (0 B)`
  - Static robots route generated: `○ /robots.txt (0 B)`

---

## 10. Git Status and Diff Summary

### `git status`
```text
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  modified:   next.config.mjs

Untracked files:
  tests/phase38_dual_sitemap.test.ts
  PHASE_38_DUAL_SITEMAP_REPORT.md
```

### `git diff next.config.mjs`
```diff
--- a/next.config.mjs
+++ b/next.config.mjs
@@ -14,6 +14,14 @@ if (fs.existsSync(redirectsPath)) {
 /** @type {import('next').NextConfig} */
 const nextConfig = {
   reactStrictMode: true,
+  async rewrites() {
+    return [
+      {
+        source: '/de/sitemap.xml',
+        destination: '/sitemap.xml',
+      },
+    ];
+  },
   async redirects() {
     return [
       {
```

---

## 11. Remaining Risks or Limitations

- **Google Search Console**: Both `https://moscheeindernaehe.de/sitemap.xml` and `https://moscheeindernaehe.de/de/sitemap.xml` now return HTTP 200 with identical XML feeds. Googlebot can fetch either without receiving a 404 or redirect.
- **Zero Risk of Drift**: Because `/de/sitemap.xml` is an internal rewrite pointing to `/sitemap.xml`, it is impossible for the two sitemap URLs to diverge or fall out of sync.

---

## 12. Final Verdict

**`READY FOR OWNER REVIEW`**
