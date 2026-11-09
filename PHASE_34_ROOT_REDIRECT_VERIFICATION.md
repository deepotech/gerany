# PHASE 34 — Root Redirect Protocol Verification & Fix Preparation Report

**Investigation Date:** November 5, 2026  
**Project:** MoscheeAtlas  
**Domain:** `https://moscheeindernaehe.de`  
**Execution Mode:** Strictly READ-ONLY (No code changes, commits, pushes, or deployments)  
**Status:** Verification Complete & Minimal Fix Prepared  

---

## Part 1 — Verification of Actual Production HTTP Responses

Real HTTP `GET` requests (not `HEAD` alone) were executed against production (`https://moscheeindernaehe.de`) across all key endpoints, first without following redirects, then following redirects separately.

### 1.1 Endpoint Response Matrix

| Endpoint | Method | HTTP Status | `Location` Header | Content-Type | Payload Nature | Following Redirect Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`/`** | GET | **`307 Temporary Redirect`** | **ABSENT (None)** | `text/html; charset=utf-8` | HTML + RSC Flight digest + 404 error template | **Stalls** (Cannot redirect; HTTP client receives 307 with 404 body) |
| **`/de`** | GET | **`200 OK`** | N/A | `text/html; charset=utf-8` | Prerendered German Homepage HTML | Direct (200 OK) |
| **`/de/`** | GET | **`308 Permanent Redirect`** | `/de` | Text / Redirect Header | Trailing-slash normalizer | Follows to `/de` (200 OK) |
| **`/en/`** | GET | **`308 Permanent Redirect`** | `/en` | Text / Redirect Header | Trailing-slash normalizer | Follows to `/en` (200 OK) |
| **`/ar/`** | GET | **`308 Permanent Redirect`** | `/ar` | Text / Redirect Header | Trailing-slash normalizer | Follows to `/ar` (200 OK) |

---

### 1.2 Deep Inspection of Root Request (`GET /`)

#### 1. Raw Status Line & Headers
```http
HTTP/1.1 307 Temporary Redirect
Cache-Control: s-maxage=31536000, stale-while-revalidate
content-security-policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://*.googletagmanager.com https://pagead2.googlesyndication.com https://*.pagead2.googlesyndication.com https://adservice.google.com https://fundingchoicesmessages.google.com https://*.googlesyndication.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:; frame-src 'self' https://googleads.g.doubleclick.net https://fundingchoicesmessages.google.com https://*.doubleclick.net https://tpc.googlesyndication.com https://*.googlesyndication.com;
Content-Type: text/html; charset=utf-8
Date: Thu, 05 Nov 2026 09:16:17 GMT
etag: "5tftpp5vai6ks"
permissions-policy: camera=(), microphone=(), geolocation=(self)
referrer-policy: strict-origin-when-cross-origin
Server: railway-hikari
strict-transport-security: max-age=63072000; includeSubDomains; preload
vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Accept-Encoding
x-content-type-options: nosniff
x-dns-prefetch-control: on
x-frame-options: SAMEORIGIN
x-nextjs-cache: HIT
x-powered-by: Next.js
x-railway-request-id: _zG933-OTXC-ydbQ8Hk9cQ
Transfer-Encoding: chunked
x-hikari-trace: cdg1.8vsn
x-railway-edge: cdg1
Connection: keep-alive
```

#### 2. Location Header Assessment
- **Status:** **ABSOLUTELY ABSENT**.
- Neither `Location: /de`, `Location: /de/`, nor any absolute URI is emitted by the server.

#### 3. Response Body Analysis
The response body is an HTML document (`<!DOCTYPE html><html id="__next_error__">...`) with two distinct embedded components:
1. **Next.js Flight / RSC Hydration Stream:**
   ```html
   <script>self.__next_f.push([1,"4:E{\"digest\":\"NEXT_REDIRECT;replace;/de;307;\"}\n"])</script>
   ```
   This payload instructs the client-side Next.js JavaScript router to perform a client-side navigation (`replace('/de')`).
2. **Server-Rendered 404 HTML Component:**
   Because `redirect('/de')` threw before returning page JSX, Next.js rendered its default fallback error boundary, which uses `src/app/not-found.tsx`:
   - `<span class="text-xs font-bold uppercase tracking-widest text-brand-700 ...">404 • Seite nicht gefunden</span>`
   - `<h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 ...">Diese Seite existiert leider nicht</h1>`
   - `<p class="text-sm text-slate-600 ...">Die angeforderte Adresse wurde möglicherweise verschoben oder existiert nicht mehr. Nutze unsere Suche, um eine Moschee in deiner Nähe zu finden.</p>`

---

### 1.3 Follow-Redirect Behavior Comparison

#### A. Standard HTTP Client (curl / Python / Automated Bot)
- **Without `-L`:** Client receives `HTTP 307 Temporary Redirect` with 404 body HTML.
- **With `-L` (Follow Redirects):**
  - Per RFC 9110 § 15.4.8, a client cannot follow a redirect without a `Location` header field.
  - The client stops immediately at the 307 response.
  - No second request is made. The client concludes the root URL is broken or serves a 404 error page.

#### B. JavaScript-Capable Browser (Chrome / Safari / Firefox)
- The browser downloads the initial HTML.
- The browser parses the script tags and bootstraps the Next.js client runtime (`main-app-*.js`).
- The runtime reads the stream digest `NEXT_REDIRECT;replace;/de;307;`.
- The Next.js client router invokes `window.history.replaceState` / client transition to `/de`.
- The user visually lands on `/de/` without realizing the initial HTTP response was invalid.

---

### 1.4 Diagnostic User-Agent Comparison

Requests to `GET /` were repeated using three distinct client profiles:

| Profile | Simulated User-Agent / Headers | HTTP Status | `Location` Header | Body Content |
| :--- | :--- | :--- | :--- | :--- |
| **Normal Browser** | `Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130.0.0.0 Safari/537.36`<br>`Accept: text/html,...`<br>`Accept-Language: de-DE,de;q=0.9` | `307 Temporary Redirect` | **None** | `NEXT_REDIRECT;replace;/de;307;` + 404 HTML |
| **Googlebot** *(Diagnostic)* | `Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)` | `307 Temporary Redirect` | **None** | `NEXT_REDIRECT;replace;/de;307;` + 404 HTML |
| **Mediapartners-Google** *(Diagnostic)* | `Mediapartners-Google` | `307 Temporary Redirect` | **None** | `NEXT_REDIRECT;replace;/de;307;` + 404 HTML |

*Finding:* The server behavior is 100% invariant across User-Agent and Accept-Language headers. The issue is purely protocol-level and server-side.

---

## Part 2 — Root Cause Analysis & Implementation Inspection

### 2.1 Code Inspection

#### File: `src/app/page.tsx`
```tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/de');
}
```

#### File: `next.config.mjs`
```javascript
import fs from 'fs';
import path from 'path';

const redirectsPath = path.join(process.cwd(), 'src/data/redirects.json');
let redirectsList = [];
if (fs.existsSync(redirectsPath)) {
  try {
    redirectsList = JSON.parse(fs.readFileSync(redirectsPath, 'utf8'));
  } catch (err) {
    console.error('Failed to parse redirects.json:', err);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return redirectsList.map((r) => ({
      source: r.source,
      destination: r.destination,
      permanent: r.permanent ?? true,
    }));
  },
  // ...
};
```

### 2.2 Mechanism of Failure

1. **Next.js SSG Prerendering of Root Page:**
   During `next build`, Next.js compiles `src/app/page.tsx` as a static route (`/`).
   When `RootPage()` executes during SSG:
   - `redirect('/de')` throws an internal Next.js `NEXT_REDIRECT` exception.
   - Next.js catches this exception and writes static build artifacts to `.next/server/app/`:
     - `index.html` (8,580 bytes): Contains client-side RSC script `NEXT_REDIRECT;replace;/de;307;` and renders the fallback 404 component.
     - `index.meta`:
       ```json
       {
         "status": 307,
         "headers": {
           "x-next-cache-tags": "_N_T_/layout,_N_T_/page,_N_T_/"
         }
       }
       ```
2. **Missing `Location` Header in `index.meta`:**
   In Next.js App Router static pre-rendering, `redirect()` in a Server Component does not write a `location` key into `index.meta`.
3. **Production Server Delivery:**
   When a production Node.js server (`next start` or standalone) receives `GET /`:
   - It serves the cached static file from `.next/server/app/index.html`.
   - It sets the HTTP status code from `index.meta` (`status: 307`).
   - It attaches the cached headers from `index.meta`.
   - Because `location` is absent in `index.meta`, **no `Location` header is sent over the wire**.
4. **Contrast with `next.config.mjs` Redirects:**
   In contrast, redirects declared in `next.config.mjs` (such as the 4,073 rules in `src/data/redirects.json`) are evaluated by the Next.js core routing engine before filesystem route matching. They emit RFC-compliant `Location: <destination>` headers and immediate 308/307 status codes (verified on production).

---

## Part 3 — Minimal Safe Fix Preparation

*(Design only — No code modifications were implemented during Phase 34).*

### 3.1 Recommended Minimal Fix

The smallest, safest change that guarantees `GET /` returns a valid HTTP redirect with a `Location: /de` header is to configure the root redirect at the Next.js routing engine level in `next.config.mjs`:

#### Modification in `next.config.mjs`:
```javascript
  async redirects() {
    return [
      {
        source: '/',
        destination: '/de',
        permanent: false, // Emits standard HTTP 307 with Location: /de header
      },
      ...redirectsList.map((r) => ({
        source: r.source,
        destination: r.destination,
        permanent: r.permanent ?? true,
      })),
    ];
  },
```

### 3.2 Evaluation: `permanent: false` (307) vs `permanent: true` (308)

| Option | HTTP Status Code | Behavior | Recommendation |
| :--- | :--- | :--- | :--- |
| **`permanent: false`** | **`307 Temporary Redirect`** | Preserves existing 307 status expected by existing tests and architecture, while adding the required `Location: /de` header. Does not permanently cache the redirect in client browsers. | **RECOMMENDED.** Matches current project semantics and Google multilingual guidelines for root redirects. |
| **`permanent: true`** | **`308 Permanent Redirect`** | Permanent redirect to `/de`. Matches how Next.js redirects trailing slashes (`/de/` -> `/de`). | Viable, but aggressive browser caching could complicate future language-selection enhancements. |

### 3.3 Product & SEO Invariant Preservation
- **Existing Localized Routes:** `/de`, `/en`, `/ar`, `/de/moscheen`, `/en/mosques`, `/ar/mosques` remain untouched.
- **Canonical URLs:** The canonical homepage remains `https://moscheeindernaehe.de/de` with `hreflang="x-default"`.
- **Sitemap:** `https://moscheeindernaehe.de/sitemap.xml` continues to list `/de`, `/en`, `/ar` (root `/` is not in sitemap).
- **Existing Redirect Rules:** All 4,073 rules in `src/data/redirects.json` remain appended and fully functional.
- **No Locale-Dependent Redirect:** The redirect remains strictly unconditional to `/de`, preserving 100% deterministic caching and crawler behavior.

---

## Part 4 — Verification Test Plan

When the fix is implemented in a future phase, the following automated and manual tests must be executed to prove complete resolution:

### Test Suite 1: Root Redirect Protocol Validation (`GET /`)
1. **Raw Status Line:** Assert `HTTP/1.1 307 Temporary Redirect` (or 308 if chosen).
2. **Location Header:** Assert `res.headers.get('location') === '/de'`.
3. **Absence of 404 Content:** Assert response body does **not** contain `"Diese Seite existiert leider nicht"` or `"404 • Seite nicht gefunden"`.
4. **Follow Redirect:** Assert following the redirect reaches `https://moscheeindernaehe.de/de` and receives `HTTP 200 OK`.

### Test Suite 2: Multi-Locale Route Preservation
1. Assert `GET /de` returns `HTTP 200 OK` (0 hops).
2. Assert `GET /en` returns `HTTP 200 OK` (0 hops).
3. Assert `GET /ar` returns `HTTP 200 OK` (0 hops).
4. Assert `GET /de/` returns `HTTP 308 Permanent Redirect` -> `location: /de`.
5. Assert `GET /en/` returns `HTTP 308 Permanent Redirect` -> `location: /en`.
6. Assert `GET /ar/` returns `HTTP 308 Permanent Redirect` -> `location: /ar`.

### Test Suite 3: Redirect Loop & Chain Prevention
1. Assert `/` redirects to `/de` in exactly **1 hop**.
2. Assert `/de` does **not** redirect back to `/` (status is 200 OK).
3. Assert no redirect loops occur across all 4,073 rules in `src/data/redirects.json`.

### Test Suite 4: SEO & Infrastructure Parity
1. **Sitemap Integrity:** Assert `/sitemap.xml` returns `HTTP 200 OK` and generates exactly 1,869 valid URLs.
2. **Robots.txt Integrity:** Assert `/robots.txt` returns `HTTP 200 OK` and references `https://moscheeindernaehe.de/sitemap.xml`.
3. **Canonical & Hreflang Tags:**
   - Assert canonical on `/de` is `https://moscheeindernaehe.de/de`.
   - Assert `x-default` alternate on `/de` is `https://moscheeindernaehe.de/de`.
   - Assert alternate links for `de`, `en`, and `ar` are preserved.

### Test Suite 5: Automated Regression Testing
- Execute `npm test` across all 22 test suites (ensure all 364 tests continue to pass).
- Execute `npx vitest run tests/seo-and-routes.test.ts`.

---

## Part 5 — Compliance Confirmation & Git Status

- **Read-Only Rule:** Strictly maintained. Zero source code, database, or configuration files were changed.
- No code committed, pushed, or deployed.
- Only this verification report (`PHASE_34_ROOT_REDIRECT_VERIFICATION.md`) was written to the workspace.

### `git status`
```
On branch main
Your branch is up to date with 'origin/main'.

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	PHASE_29_PRODUCTION_SEO_REGRESSION_REPORT.md
	PHASE_30_REAL_TRAFFIC_INVESTIGATION.md
	PHASE_31_TRAFFIC_DECLINE_VERIFICATION.md
	PHASE_32_SITEMAP_INCIDENT_REPORT.md
	PHASE_33_ADSENSE_APPLICATION_INVESTIGATION.md
	PHASE_34_ROOT_REDIRECT_VERIFICATION.md

nothing added to commit but untracked files present (use "git add" to track)
```
