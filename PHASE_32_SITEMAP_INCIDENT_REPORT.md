# PHASE 32 — Production Sitemap Incident Investigation Report

**Investigation Date:** November 5, 2026  
**Environment:** Production (`https://moscheeindernaehe.de`)  
**Scope:** Strictly Read-Only Investigation of Production Sitemap Behavior  
**Status:** Completed  

---

## 1. Executive Summary & Classification

### Incident Overview
On November 5, 2026, an incident was reported stating that `https://moscheeindernaehe.de/de/sitemap.xml` displays the site's German custom 404 page instead of an XML document.

A forensic investigation was conducted across live production HTTP endpoints, the Next.js routing architecture, data reconciliation pipelines, and repository search console records.

### Incident Classification
**Primary Classification:**  
**`A. Only /de/sitemap.xml is invalid; root sitemap works.`**

- The canonical, intended sitemap is located at `https://moscheeindernaehe.de/sitemap.xml`. It returns **HTTP 200 OK**, `Content-Type: application/xml`, and delivers an intact, valid `<urlset>` containing **1,869 indexable URLs**.
- `https://moscheeindernaehe.de/de/sitemap.xml` is **not** an implemented sitemap route in Next.js. In Next.js App Router, locale routing is handled under `src/app/[locale]/...`. Because there is no nested sitemap route under `[locale]`, requesting `/{locale}/sitemap.xml` correctly invokes Next.js 404 routing (`src/app/not-found.tsx`), returning an **HTTP 404 Not Found** status with the custom German 404 HTML template.
- The `robots.txt` file correctly points to the working root sitemap: `Sitemap: https://moscheeindernaehe.de/sitemap.xml`.
- There is **no soft-404** (the 404 page returns an explicit HTTP 404 status code, not 200).
- The root sitemap contains 100% of published entities across all 3 supported locales (`de`, `en`, `ar`) with zero dead links, zero duplicate URLs, zero redirects, and zero admin URLs.

---

## 2. Production Endpoints Inspection

Each endpoint was queried on production (`moscheeindernaehe.de`) via live HTTP requests.

| Endpoint | HTTP Status | Content-Type | Redirect Chain | Valid XML? | Content Type / Payload | Accidental 404 on 200? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`/sitemap.xml`** | **200 OK** | `application/xml` | Direct (0 hops) | **Yes** | Valid XML `<urlset>` containing **1,869** canonical `<url>` entries | **No** (Genuine XML feed) |
| **`/de/sitemap.xml`** | **404 Not Found** | `text/html; charset=utf-8` | Direct (0 hops) | **No** | Next.js custom German 404 page HTML (`<html lang="de">`) | **No** (Status is true HTTP 404) |
| **`/en/sitemap.xml`** | **404 Not Found** | `text/html; charset=utf-8` | Direct (0 hops) | **No** | Next.js custom German 404 page HTML | **No** (Status is true HTTP 404) |
| **`/ar/sitemap.xml`** | **404 Not Found** | `text/html; charset=utf-8` | Direct (0 hops) | **No** | Next.js custom German 404 page HTML | **No** (Status is true HTTP 404) |
| **`/robots.txt`** | **200 OK** | `text/plain` | Direct (0 hops) | N/A | Plain text crawler instructions with Sitemap directive | **No** |

### Raw Header & Response Samples

#### 1. `https://moscheeindernaehe.de/sitemap.xml`
```http
HTTP/1.1 200 OK
Cache-Control: public, max-age=0, must-revalidate
Content-Type: application/xml
Date: Thu, 05 Nov 2026 08:57:35 GMT
Server: railway-hikari
vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch
x-nextjs-cache: HIT

<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>https://moscheeindernaehe.de/de</loc>
<lastmod>2026-10-29T21:02:40.137Z</lastmod>
<changefreq>daily</changefreq>
<priority>1</priority>
</url>
...
```

#### 2. `https://moscheeindernaehe.de/de/sitemap.xml`
```http
HTTP/1.1 404 Not Found
Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
Content-Type: text/html; charset=utf-8
Date: Thu, 05 Nov 2026 08:59:27 GMT
Server: railway-hikari
x-powered-by: Next.js

<!DOCTYPE html><html lang="de"><head><meta charSet="utf-8"/><meta name="robots" content="noindex"/>...
<span class="text-xs font-bold uppercase tracking-widest text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">404 • Seite nicht gefunden</span>
<h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-4 mb-2">Diese Seite existiert leider nicht</h1>
```

---

## 3. Inspection of `robots.txt`

The live production `https://moscheeindernaehe.de/robots.txt` returns:
```txt
User-Agent: *
Allow: /
Disallow: /*/admin
Disallow: /admin
Disallow: /api/
Disallow: /*?*query=
Disallow: /*?*district=

Sitemap: https://moscheeindernaehe.de/sitemap.xml
```

### Verification Findings:
1. **Exact Sitemap Directive:** `Sitemap: https://moscheeindernaehe.de/sitemap.xml`
2. **Target URL Accessibility:** The target URL resolves with **HTTP 200 OK**.
3. **Payload Validity:** Returns a standard, fully parsable XML sitemap (`application/xml`).
4. **Consistency:** `robots.txt` does **not** reference `/de/sitemap.xml`, nor does it split sitemaps by language.

---

## 4. Next.js Implementation Analysis

### Route Architecture
The Next.js App Router codebase defines routes under `src/app/`:
```
src/app/
├── [locale]/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── moscheen/
│   ├── mosques/
│   ├── moschee/
│   ├── mosque/
│   ├── about/
│   ├── contact/
│   ├── impressum/
│   └── datenschutz/
├── layout.tsx
├── not-found.tsx
├── page.tsx          (redirects / -> /de)
├── robots.ts         (generates /robots.txt)
└── sitemap.ts        (generates /sitemap.xml)
```

### Key Architectural Findings:
1. **Single Canonical Sitemap:**
   `src/app/sitemap.ts` exports a default async function returning `MetadataRoute.Sitemap`. In Next.js App Router, this file automatically binds to `/sitemap.xml` at the domain root.
2. **No Locale-Prefixed Sitemap Routes:**
   There is no `src/app/[locale]/sitemap.ts` or `src/app/[locale]/sitemap.xml/route.ts`. 
   When a crawler or user requests `/de/sitemap.xml`:
   - Next.js assigns `params.locale = 'de'`.
   - Next.js looks for a matching segment `sitemap.xml` inside `src/app/[locale]/`.
   - None exists.
   - Next.js invokes `src/app/not-found.tsx`.
   - The response is emitted as HTTP 404 with the custom German 404 template.
3. **Locale Middleware:**
   - There is **no `middleware.ts`** or `src/middleware.ts` in the project.
   - Root routing is handled directly in `src/app/page.tsx` via `redirect('/de')`.
   - Static routes at the root (`/sitemap.xml`, `/robots.txt`) are not subject to any redirect or rewrite rules.
4. **Redirects Configuration:**
   - In `next.config.mjs`, redirects are loaded from `src/data/redirects.json` (4,073 rules).
   - An exact scan of all 4,073 redirect rules confirms **0 rules** intercepting `/sitemap.xml` or `/de/sitemap.xml`.

---

## 5. Validation of Sitemap Contents

A forensic check was run against the live production XML feed and compared directly with local database state and `scripts/audit-sitemap.ts`.

### URL Inventory Reconciliation
```
Total URLs in Production /sitemap.xml: 1,869
Total URLs generated locally by sitemap.ts: 1,869
Exact Parity: 100% (0 URL differences between local and production)
```

### Breakdown by Page Category:
1. **Homepages (3 URLs):**
   - `https://moscheeindernaehe.de/de` (priority 1.0, daily)
   - `https://moscheeindernaehe.de/en` (priority 1.0, daily)
   - `https://moscheeindernaehe.de/ar` (priority 1.0, daily)
2. **Search Hub Pages (3 URLs):**
   - `https://moscheeindernaehe.de/de/moscheen` (priority 0.9, daily)
   - `https://moscheeindernaehe.de/en/mosques` (priority 0.9, daily)
   - `https://moscheeindernaehe.de/ar/mosques` (priority 0.9, daily)
3. **City Collection Pages (60 URLs):**
   - Exactly **20 published cities** $\times$ **3 locales** (`de`, `en`, `ar`) = 60 URLs (priority 0.9, daily).
   - All 20 cities match `getPublishedCityConfigs()` and have $\ge 1$ published mosque in `src/data/mosques.json`.
   - Cities represented: Berlin, Dortmund, Düsseldorf, Frankfurt, Hamburg, Köln, München, Nürnberg, Essen, Bremen, Hannover, Duisburg, Bochum, Dresden, Karlsruhe, Kiel, Freiburg, Lübeck, Saarbrücken, Münster.
   - Candidate / unpromoted cities: **0** in sitemap.
4. **Mosque Detail Pages (1,803 URLs):**
   - Exactly **601 published mosques** $\times$ **3 locales** (`de`, `en`, `ar`) = 1,803 URLs (priority 0.8, weekly).
   - German pattern: `/de/moschee/[citySlug]/[slug]`
   - English pattern: `/en/mosque/[englishCitySlug]/[slug]`
   - Arabic pattern: `/ar/mosque/[citySlug]/[slug]`

### Hygiene Verification:
- **Canonical Hostname:** 100% of URLs use `https://moscheeindernaehe.de`.
- **Malformed URLs:** 0 URLs contain invalid characters, stray digits, `undefined`, `null`, spaces, query strings, or hash fragments.
- **Redirect Overlap:** 0 sitemap URLs match any source path in `src/data/redirects.json`.
- **Admin URLs:** 0 URLs contain `/admin`.
- **Duplicate URLs:** 0 duplicates across the entire 1,869 entry set.
- **Indexability:** All 1,869 URLs are public, canonical, and indexable.

---

## 6. Google Search Console Investigation

### Local Repository Inspection:
- Existing GSC exports in `reports/gsc/drilldown-2026-10-26/` and `batch2/` were analyzed. They reflect GSC 404 URL drilldowns from earlier migration cleanup phases (`Tableau.csv`, `Métadonnées.csv`). No sitemap status export exists in the repository.
- Historical documentation in `DOMAIN_MIGRATION_NOTES.md` and `PHASE_16_PRE_DEPLOYMENT_READINESS.md` establishes that the instructed GSC submission URL was:
  `https://moscheeindernaehe.de/sitemap.xml`
- **Notice on Account Access:** The agent does not have a live connection or API credentials to the user's Google Search Console account.

### Incident Root Cause Hypothesis in GSC:
If a user or webmaster manually typed or submitted `https://moscheeindernaehe.de/de/sitemap.xml` (or relative path `de/sitemap.xml`) into Google Search Console:
- GSC would fetch `https://moscheeindernaehe.de/de/sitemap.xml`.
- GSC would encounter an HTTP 404 Not Found response delivering HTML content.
- GSC would flag an error such as *"Sitemap could not be read"*, *"Couldn't fetch"*, or *"Sitemap is HTML"*.

---

## 7. Search Engine Crawling & Indexing Impact

### Crawling Impact Analysis:
1. **Googlebot Automated Discovery:**
   - Googlebot crawls `https://moscheeindernaehe.de/robots.txt` first.
   - `robots.txt` points directly to `https://moscheeindernaehe.de/sitemap.xml`.
   - Googlebot successfully downloads and parses `https://moscheeindernaehe.de/sitemap.xml` (HTTP 200, valid XML).
   - Googlebot receives all 1,869 indexable URLs for the site across all three languages.
   - **Conclusion:** Automated search engine discovery via `robots.txt` is fully intact and has experienced **no impairment**.
2. **If `/de/sitemap.xml` was submitted in GSC:**
   - That individual submission item in GSC will report failure.
   - If `https://moscheeindernaehe.de/sitemap.xml` was **also** submitted (or discovered via `robots.txt`), Google indexes pages normally.
   - If `/de/sitemap.xml` was the **only** sitemap submitted in GSC, Google may show an alert in GSC UI, though Google still uses `robots.txt` discovery and internal site links.

### Evidence Still Needed from User:
To achieve 100% confirmation regarding GSC state, the user should check the Google Search Console **Sitemaps** dashboard (`Indexing > Sitemaps`):
1. Is `sitemap.xml` submitted, and does it show status **"Success"** with ~1,869 discovered URLs?
2. Is there a stale or accidental submission for `de/sitemap.xml` showing **"Couldn't fetch"** or **"Has errors"**? (If present, it can be deleted in GSC).

### Non-Breaking Remediation Options for a Future Phase (Informational):
While strictly no changes are made in this phase, future options include:
- In `next.config.mjs`, add 301 redirects from `/:locale(de|en|ar)/sitemap.xml` to `/sitemap.xml`.
- Or continue relying on the standard root `/sitemap.xml` which is already canonical and compliant with Google specifications.

---

## 8. Compliance Confirmation & Git Status

- **Read-Only Rule:** Maintained strictly. No code files, configuration files, or database entries were modified, committed, pushed, or deployed.
- Only this investigation report (`PHASE_32_SITEMAP_INCIDENT_REPORT.md`) was written to the repository.

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

nothing added to commit but untracked files present (use "git add" to track)
```
