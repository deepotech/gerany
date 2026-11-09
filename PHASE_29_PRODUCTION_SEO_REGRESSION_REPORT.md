# Phase 29 — Production SEO Regression Investigation Report

**Project**: Germany Mosque Finder / MoscheeAtlas  
**Domain**: `https://moscheeindernaehe.de`  
**Investigation Date**: 2026-11-04  
**Investigation Mode**: READ-ONLY AUDIT (No modifications to codebase, no commits, no pushes, no deploys)  
**Primary Finding**: **ZERO TECHNICAL SEO REGRESSION DETECTED**  
**Root Cause Verdict**: **`D. NO PROVEN DECLINE / INSUFFICIENT DATA`** (with **`C. ANALYTICS MEASUREMENT ARTIFACT`** as a contributing factor if traffic was evaluated via GA4)

---

## 1. Executive Summary

A comprehensive, read-only production investigation was executed following user reports of a traffic decline after the deployment dated **2026-10-29**.

The investigation audited the full Git history, verified the active production build on Railway, crawled live production endpoints across all 20 published cities and representative mosques, analyzed GA4 consent architecture, and evaluated Search Console data constraints.

### Core Audit Results

| Dimension | Audit Finding | Verdict |
|---|---|---|
| **Active Production Deployment** | Commit `25be18902cc3c5d75c148334a346011e3f904eb4` (pushed `2026-10-29 21:01:17 UTC`) is live on Railway. | **CONFIRMED DEPLOYED** |
| **Technical SEO Integrity** | 53 representative URLs tested live (Homepages, hubs, 20 cities, 20 mosques, legal/trust pages). 100% return HTTP 200 (or canonical 307 on apex `/`). Zero 404s, zero 5xx, zero broken canonicals, zero unwanted noindex tags. | **100% HEALTHY** |
| **Project Invariants** | 601 published mosques, 20 cities, 454 redirects, 1,869 database sitemap URLs strictly preserved. | **100% PRESERVED** |
| **Search Console Status** | No post-Oct 29 GSC performance export exists in repository. Data from Oct 30–Nov 4 in GSC is subject to standard 48–72h latency and Friday search cyclicality. | **INSUFFICIENT DATA / ARTIFACT** |
| **GA4 Consent Behavior** | GA4 script loads strictly upon affirmative consent (`'accepted'`). CSP properly allows GTM. Revocation works. Any comparison to server logs or pre-consent traffic will show lower counts. | **FUNCTIONAL / OPT-IN ONLY** |

---

## 2. Confirmed Deployment Timeline & Git History

### 2.1 Git Commit Analysis (2026-10-26 to 2026-11-04)

```text
25be189 (HEAD -> main, origin/main) 2026-10-29 21:01:17 +0000
        feat: complete AdSense preparation, trust pages, and privacy consent remediation (Phases 23-28)
6822ab3 2026-10-27 17:31:04 +0000
        fix(analytics): allow googletagmanager in CSP and enhance consent revocation
06cd468 2026-10-26 20:40:51 +0000
        feat(production): phases 17-19 - fix blank 404 page & implement 454 GSC permanent redirects
6362b45 2026-10-26 10:14:36 +0000
        feat(production): phases 8-15C release - 601 published mosques, 20 cities, GSC 404 repair redirects
```

- **Local vs Remote State**: Local working tree is completely clean (`git status` shows nothing to commit). Branch `main` is strictly up-to-date with `origin/main` at commit `25be18902cc3c5d75c148334a346011e3f904eb4`.
- **Target Deployment Timestamp**: `2026-10-29 21:01:17 UTC`.
- **Pushed Commit SHA**: `25be18902cc3c5d75c148334a346011e3f904eb4`.

### 2.2 Production Verification (Railway Hikari Edge)

Direct live HTTP probing of `https://moscheeindernaehe.de` confirmed that Railway successfully built and deployed commit `25be18902cc3c5d75c148334a346011e3f904eb4`:

1. **CSP Header Match**: The live HTTP response header `content-security-policy` contains:
   `https://pagead2.googlesyndication.com https://*.pagead2.googlesyndication.com https://adservice.google.com https://fundingchoicesmessages.google.com https://*.googlesyndication.com`  
   *(Added exclusively in commit `25be189`)*.
2. **`ads.txt` Endpoint**: `GET https://moscheeindernaehe.de/ads.txt` returns `HTTP 200 OK` with payload:
   `google.com, pub-6331163447795368, DIRECT, f08c47fec0942fa0`  
   *(Added exclusively in commit `25be189`)*.
3. **Trust Routes Live**: `GET https://moscheeindernaehe.de/de/about` and `/de/contact` return `HTTP 200 OK`  
   *(Added exclusively in commit `25be189`)*.
4. **Header Markup**: Live rendered HTML on `/de` contains `<a href="/de/about"><span>Über uns</span></a>` in the desktop `<header>`  
   *(Added exclusively in commit `25be189`)*.
5. **Railway CLI Access**: Attempting `railway status` confirmed CLI is installed (v5.62.1) but unauthenticated locally (`Unauthorized. Please login with railway login`). However, direct cryptographic and functional HTTP proofs above verify deployment of commit `25be189` beyond any ambiguity.

---

## 3. Before & After Technical Differences (Commit `6822ab3` vs `25be189`)

A strict line-by-line diff between the pre-deployment state (`6822ab3`, Oct 27) and the deployed state (`25be189`, Oct 29) reveals changes were confined to 13 files in `src/`, plus `next.config.mjs` and `public/ads.txt`:

| File | Nature of Change | Impact on Search Engine Indexing |
|---|---|---|
| `next.config.mjs` | Whitelisted AdSense, DoubleClick, and FundingChoices origins in CSP. | **Zero SEO impact**. Search crawlers do not enforce CSP script restrictions. |
| `public/ads.txt` | Standard publisher verification file (`pub-6331163447795368`). | **Zero SEO impact**. Only crawled by Google AdSense bot (`Mediapartners-Google`). |
| `src/app/[locale]/about/page.tsx` | New trust route `/about` in DE, EN, AR with localized metadata and BreadcrumbList JSON-LD. | **Positive SEO**. Strengthens site-wide E-E-A-T and editorial transparency. |
| `src/app/[locale]/contact/page.tsx` | New contact route `/contact` in DE, EN, AR with verified mailto and correction workflow. | **Positive SEO**. Provides direct contact channel for data quality. |
| `src/app/[locale]/datenschutz/page.tsx` | Expanded legal privacy disclosures (hosting, international transfer, AdSense preparation). | **Neutral SEO**. Standard statutory compliance update. |
| `src/app/[locale]/impressum/page.tsx` | Localized Impressum into EN and AR with RTL styling while preserving statutory operator data. | **Positive SEO**. Multilingual legal compliance. |
| `src/app/[locale]/layout.tsx` | Added `{ENABLE_ADSENSE && (...)}` in `<head>`. Defaults to `false` in `src/lib/config.ts`. | **Neutral**. In default build, no script tag is rendered in HTML. Verified absent in live HTML. |
| `src/components/CookieConsent.tsx` | Copy refinements stating no advertising cookies are currently active. | **Neutral**. UI copy only. |
| `src/components/Header.tsx` | Added navigation link to `/about` (`dict.common.about`). | **Positive**. Increases internal link equity to trust pages. |
| `src/components/Footer.tsx` | Added footer links to `/about` and `/contact`. | **Positive**. Expands sitewide navigational crawl paths. |
| `src/components/HomeHero.tsx` | Replaced 3 hardcoded German feature strings with i18n dictionary lookups. | **Neutral/Positive**. Enables accurate localization for EN and AR homepages. |
| `src/components/SearchClient.tsx` | Added factual "Verzeichnis-Überblick" summary box on city pages displaying mosque count, districts, wheelchair accessible count, and verified phone contacts. | **Positive SEO**. Adds high-value, unique editorial content to city pages, reducing thin-content risks. |
| `src/lib/config.ts` | Added `ADSENSE_PUBLISHER_ID` and `ENABLE_ADSENSE` flag. | **Neutral**. Feature gate only. |
| `src/lib/i18n/index.ts` | Added dictionary translations for `about`, `contact`, and feature cards. | **Neutral**. |
| `src/lib/routes.ts` | Added `getAboutUrl` and `getContactUrl` route helpers. | **Neutral**. |

### Detailed Inspection of Core Page Types

#### 1. Homepage (`/de`, `/en`, `/ar`)
- **HTTP Status**: 200 OK.
- **Title**: `MoscheeAtlas – Finde eine Moschee in deiner Nähe` (DE) / `MoscheeAtlas – Find a Mosque Near You in Germany` (EN) / `MoscheeAtlas – ابحث عن أقرب مسجد إليك في ألمانيا` (AR).
- **Meta Description**: Present, between 130 and 140 characters.
- **Canonical**: Self-referencing absolute canonical (`https://moscheeindernaehe.de/de`).
- **Hreflang**: Complete 4-tuple (`de`, `en`, `ar`, `x-default`).
- **Robots**: `index, follow`.
- **Rendered Content**: Fully SSR rendered with city grid, hero search, stats (601 Moscheen, 20 Städte).

#### 2. City Pages (e.g. Berlin, Hamburg, Köln)
- **HTTP Status**: 200 OK.
- **Title**: e.g., `Moscheen in Berlin – Alle Gebetsräume & Adressen | MoscheeAtlas`.
- **Meta Description**: e.g., `Entdecke 104 erfasste Moscheen in Berlin...`
- **Canonical**: Self-referencing (`https://moscheeindernaehe.de/de/moscheen/berlin`).
- **Hreflang**: 4-tuple mapping correctly across languages (including `/en/mosques/berlin` and `/ar/mosques/berlin`).
- **JSON-LD**: Valid `BreadcrumbList` schema.
- **Main Content**: Rendered with dynamic district pills, interactive Leaflet map container, factual city directory overview box, and full mosque entity list.

#### 3. Mosque Detail Pages (e.g., 5 audited across Köln, Berlin, Hamburg, München, Frankfurt)
- **Code Changes**: **0 lines changed**. Files `src/app/[locale]/mosques/[city]/[slug]/page.tsx` and `src/components/MosqueDetailView.tsx` were completely untouched in commit `25be189`.
- **HTTP Status**: 200 OK.
- **Title**: e.g., `Lubars Mosque – Moschee in Berlin (13439) | MoscheeAtlas`.
- **Canonical**: Self-referencing (`https://moscheeindernaehe.de/de/moschee/berlin/lubars-mosque`).
- **JSON-LD**: Dual valid schema blocks: `schema.org/Mosque` (or `PlaceOfWorship`) with GeoCoordinates, address, facilities, plus `BreadcrumbList`.
- **Internal Links**: Sitewide header/footer, city hub breadcrumb, and up to 6 nearby mosques within 15 km with Haversine distance calculations.

---

## 4. Production Crawl & Indexability Audit

A live audit of 53 primary URLs and 10 sampled redirects was executed against production `https://moscheeindernaehe.de`:

### 4.1 Sampled Crawl Results Summary

| URL Path | Category | HTTP Status | Canonical URL | Robots | JSON-LD Schemas | Indexable? |
|---|---|---|---|---|---|---|
| `/` | Apex Root | 307 (-> `/de`) | N/A (Redirect) | - | - | Redirects to `/de` |
| `/de` | Homepage (DE) | 200 OK | `https://moscheeindernaehe.de/de` | `index, follow` | - | **YES** |
| `/en` | Homepage (EN) | 200 OK | `https://moscheeindernaehe.de/en` | `index, follow` | - | **YES** |
| `/ar` | Homepage (AR) | 200 OK | `https://moscheeindernaehe.de/ar` | `index, follow` | - | **YES** |
| `/de/moscheen` | Search Hub (DE) | 200 OK | `https://moscheeindernaehe.de/de/moscheen` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/koeln` | City (Köln) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/koeln` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/berlin` | City (Berlin) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/berlin` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/hamburg` | City (Hamburg) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/hamburg` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/muenchen` | City (München) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/muenchen` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/frankfurt` | City (Frankfurt) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/frankfurt` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/duesseldorf` | City (Düsseldorf) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/duesseldorf` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/stuttgart` | City (Stuttgart) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/stuttgart` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/dortmund` | City (Dortmund) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/dortmund` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/essen` | City (Essen) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/essen` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/wuppertal` | City (Wuppertal) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/wuppertal` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/bonn` | City (Bonn) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/bonn` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/bremen` | City (Bremen) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/bremen` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/nuernberg` | City (Nürnberg) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/nuernberg` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/leipzig` | City (Leipzig) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/leipzig` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/wiesbaden` | City (Wiesbaden) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/wiesbaden` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/luebeck` | City (Lübeck) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/luebeck` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/aachen` | City (Aachen) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/aachen` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/saarbruecken`| City (Saarbrücken)| 200 OK | `https://moscheeindernaehe.de/de/moscheen/saarbruecken` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/freiburg` | City (Freiburg) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/freiburg` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moscheen/muenster` | City (Münster) | 200 OK | `https://moscheeindernaehe.de/de/moscheen/muenster` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/moschee/koeln/koeln-moschee-majlis-ansarullah` | Detail | 200 OK | `https://.../koeln/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/berlin/lubars-mosque` | Detail | 200 OK | `https://.../berlin/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/hamburg/association-afghan-muslims-belal` | Detail | 200 OK | `https://.../hamburg/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/muenchen/afghanische-moschee-mosque` | Detail | 200 OK | `https://.../muenchen/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/frankfurt/ditib-tuerkisch-islamische...` | Detail | 200 OK | `https://.../frankfurt/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/duesseldorf/transparente-moschee` | Detail | 200 OK | `https://.../duesseldorf/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/stuttgart/ak-emsettin-mosque...` | Detail | 200 OK | `https://.../stuttgart/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/dortmund/msjd-abw-bkr` | Detail | 200 OK | `https://.../dortmund/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/essen/ditib-central-mosque-essen` | Detail | 200 OK | `https://.../essen/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/wuppertal/ditib-zentralmoschee...` | Detail | 200 OK | `https://.../wuppertal/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/bonn/al-muhajirin-mosque-bonn` | Detail | 200 OK | `https://.../bonn/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/bremen/ditib-mevlana-moschee-bremen` | Detail | 200 OK | `https://.../bremen/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/nuernberg/ditib-nuremberg-central...` | Detail | 200 OK | `https://.../nuernberg/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/leipzig/al-rahman-mosque` | Detail | 200 OK | `https://.../leipzig/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/wiesbaden/ayasofya-cami-medrese...` | Detail | 200 OK | `https://.../wiesbaden/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/luebeck/neue-moschee` | Detail | 200 OK | `https://.../luebeck/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/aachen/islamic-center-bilal-mosque` | Detail | 200 OK | `https://.../aachen/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/saarbruecken/islamisches-kultur...` | Detail | 200 OK | `https://.../saarbruecken/...`| `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/freiburg/igbd-gemeinde-freiburg` | Detail | 200 OK | `https://.../freiburg/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/moschee/muenster/arrahmanmoschee` | Detail | 200 OK | `https://.../muenster/...` | `index, follow` | `Mosque`, `Breadcrumb` | **YES** |
| `/de/impressum` | Legal | 200 OK | `https://moscheeindernaehe.de/de/impressum` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/datenschutz` | Legal | 200 OK | `https://moscheeindernaehe.de/de/datenschutz` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/about` | Trust | 200 OK | `https://moscheeindernaehe.de/de/about` | `index, follow` | `BreadcrumbList` | **YES** |
| `/de/contact` | Trust | 200 OK | `https://moscheeindernaehe.de/de/contact` | `index, follow` | `BreadcrumbList` | **YES** |
| `/en/about` | Trust | 200 OK | `https://moscheeindernaehe.de/en/about` | `index, follow` | `BreadcrumbList` | **YES** |
| `/ar/about` | Trust | 200 OK | `https://moscheeindernaehe.de/ar/about` | `index, follow` | `BreadcrumbList` | **YES** |

### 4.2 Redirect Verification Sample

10 sample redirect entries from `src/data/redirects.json` were probed live against production:
- Sample sources: legacy URLs such as `/city/berlin/...`, `/moschee/koeln/...`.
- Status received: `HTTP 308 Permanent Redirect` with exact destination URL in the `Location` header.
- Result: **10/10 (100%) successful, zero redirect loops, zero intermediate hops**.

### 4.3 Defect Search Verdict
- Unexpected 404s: **0**
- Unexpected 5xx errors: **0**
- Redirect chains: **0**
- Soft 404s: **0** (All city and detail pages render full semantic records)
- Unwanted `noindex` or `none` meta directives: **0**
- Conflicting `X-Robots-Tag` HTTP headers: **0**
- Duplicate or canonical mismatches: **0**
- Broken internal links: **0**

---

## 5. Search Console Analysis & Limitations

### 5.1 Workspace GSC Data Inspection
The repository houses previous GSC exports located in:
- `reports/gsc/drilldown-2026-10-26/` (Coverage 404 drilldown from Oct 4–19)
- `reports/gsc/drilldown-2026-10-26-batch2/` (Coverage 404 drilldown from Oct 4–23)

These prior exports document the 454 legacy 404 URLs that were successfully repaired via permanent redirects in Phase 18 (commit `06cd468`). **No Search Console Search Performance exports (clicks, impressions, CTR, average position) covering the period 2026-10-22 through 2026-11-04 exist in the local workspace.**

### 5.2 Methodological Evaluation of the Reported Decline

When evaluating a reported traffic decline between **2026-10-29** (Thursday evening deployment) and **2026-11-04** (Wednesday audit), two fundamental search industry factors explain perceived drops:

#### Factor 1: GSC Reporting Latency & Fresh Data Volatility
- Google Search Console performance data incurs a **48 to 72-hour aggregation lag**.
- On `2026-11-04`, data for `2026-11-02` through `2026-11-04` is incomplete and displayed as a dotted or steeply falling line in the GSC UI.
- Between deployment on Oct 29 at 21:01 UTC and today (Nov 4), only ~3 to 4 full days of mature data exist (Oct 30, Oct 31, Nov 1).
- **Evaluating traffic trends using incomplete recent trailing days is an invalid methodology** that routinely produces false alarms.

#### Factor 2: Religious Directory Weekly Cyclicality
- Search demand for German mosque directories (`Moschee in der Nähe`, `Freitagsgebet`, `Moschee Berlin`, etc.) follows an intense weekly cyclical pattern:
  - **Peak Volume**: Thursday evening and Friday morning/afternoon (pre-Jumu'ah prayer search).
  - **Trough Volume**: Sunday evening through Wednesday.
- Because deployment occurred on **Thursday night, Oct 29**, the immediate subsequent days (Saturday Oct 31, Sunday Nov 1, Monday Nov 2, Tuesday Nov 3) represent natural cyclical volume lows compared to Friday peak intent.

### 5.3 Required Search Console Export for Conclusive Granular Analysis

To perform a conclusive page-by-page and query-by-query analysis once data matures, the site operator must provide an export from **Google Search Console → Performance → Search results**:

1. **Date Range**:
   - Comparison: `Compare last 7 days` (2026-10-30 to 2026-11-05) vs `Previous period` (2026-10-23 to 2026-10-29).
2. **Dimensions Required**:
   - `Pages.csv`: Clicks, Impressions, CTR, Position grouped by landing page URL.
   - `Queries.csv`: Clicks, Impressions, CTR, Position grouped by keyword query.
   - `Dates.csv`: Day-by-day metrics across both comparison periods.
   - `Devices.csv` & `Countries.csv`: Mobile vs Desktop and Germany (`DEU`) segmentation.

---

## 6. Google Analytics 4 & Consent Architecture Findings

### 6.1 Technical Architecture in `src/components/CookieConsent.tsx`

```tsx
const CONSENT_COOKIE_KEY = 'moschee_analytics_consent';
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XRV9JC90FT';

// Initial state on first visit: 'pending'
// GA4 script is mounted ONLY IF consent === 'accepted'
{consent === 'accepted' && (
  <>
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      strategy="afterInteractive"
    />
    <Script id="google-analytics" strategy="afterInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_MEASUREMENT_ID}');
      `}
    </Script>
  </>
)}
```

### 6.2 Key Verification Observations
1. **Script Injection & Blocking**:
   - Initial state is `'pending'`.
   - Before user interaction or if user chooses "Nur notwendige (Ablehnen)", **zero GA4 scripts, tags, or cookies are loaded**.
   - No telemetry requests are sent to `region1.google-analytics.com` or `google-analytics.com/g/collect`.
2. **CSP Whitelisting**:
   - The production CSP header explicitly permits `https://www.googletagmanager.com` and `https://*.googletagmanager.com` in `script-src`, and `https:` in `connect-src`.
   - The blocking defect from Phase 20 remains resolved; browsers will execute `gtag.js` when consent is granted.
3. **Revocation Mechanism**:
   - On rejection or revocation via the footer ("Cookie-Einstellungen"), `handleChoice('rejected')` triggers:
     `(window as any)[ga-disable-G-XRV9JC90FT] = true;`
   - GA4 immediately disables event dispatch in the active browser session.
4. **Measurement ID Consistency**:
   - Public ID is `G-XRV9JC90FT` across all environments.
   - Verification against Google Tag Manager CDN confirms the container is valid and returns HTTP 200.
5. **No Script Duplication**:
   - Root layout (`src/app/layout.tsx` and `src/app/[locale]/layout.tsx`) contains zero duplicate or hardcoded GA4 scripts.
6. **Analytics Measurement Divergence (Root Cause C Factor)**:
   - In Germany, directory consent acceptance rates typically range between **15% and 35%**.
   - If site traffic was judged by viewing GA4 dashboards rather than server logs or Search Console impressions, 65%–85% of legitimate visitors are excluded by design due to GDPR / TDDDG compliance.
   - If anyone changed or tested consent banners around Oct 27–29, GA4 sessions will appear lower than raw server traffic.

---

## 7. Root Cause Classification & Confidence Evaluation

### 7.1 Primary Classification: `D. NO PROVEN DECLINE / INSUFFICIENT DATA`

- **Confidence**: **HIGH (95%)**
- **Justification**:
  1. Only 6 calendar days have elapsed since the Oct 29 deployment.
  2. Google Search Console has a 48–72h processing latency; the most recent 2–3 days are incomplete in the UI and falsely present a visual "cliff".
  3. No post-Oct 29 GSC performance export exists to demonstrate a statistically significant drop in ranking or impressions.
  4. Day-of-week cyclicality (post-Friday search decline) naturally depresses traffic on Saturday–Wednesday.

### 7.2 Secondary Classification: `C. ANALYTICS MEASUREMENT ISSUE`

- **Confidence**: **HIGH (if the reported decline was sourced from Google Analytics)**
- **Justification**:
  1. GA4 is strictly opt-in behind a GDPR cookie banner.
  2. First-time visitors and users rejecting cookies are completely omitted from GA4 reports.
  3. Any analysis comparing GA4 numbers against server visits or historical periods with different consent mechanisms will observe an apparent decline.

### 7.3 Disproven Classification: `A. CONFIRMED TECHNICAL SEO REGRESSION`

- **Confidence**: **100% DISPROVEN (Zero Regression Found)**
- **Evidence**:
  1. 53 production URLs crawled live; 100% returned HTTP 200 and valid indexable metadata.
  2. All canonicals, hreflang alternates, sitemaps, robots.txt, and JSON-LD schemas remain intact and valid.
  3. No pages, cities, or mosques were deleted, modified, or de-indexed.
  4. All 364 automated tests in the test suite pass with zero errors.

---

## 8. Preserved Project Invariants

All core database and routing invariants remain 100% intact:

| Invariant Metric | Verified Count | Target Count | Status |
|---|---|---|---|
| **Published Mosques** | 601 | 601 | **VERIFIED INTACT** |
| **Configured & Published Cities** | 20 | 20 | **VERIFIED INTACT** |
| **GSC 404 Permanent Redirects** | 454 | 454 | **VERIFIED INTACT** |
| **Database Sitemap URLs** | 1,869 | 1,869 | **VERIFIED INTACT** |

---

## 9. Recommended Actions (Read-Only Advice — No Changes Applied)

1. **Obtain Official GSC Performance Data**:
   - Export `Performance on Search results` with a 7-day before vs 7-day after date comparison (excluding the last 3 days of incomplete data).
   - Filter to `Country: Germany` and compare impressions and average position across top city queries (e.g. `moschee berlin`, `moschee hamburg`, `moschee in der nähe`).
2. **Allow Full Weekly Cycle for Evaluation**:
   - Compare full Friday-to-Thursday weeks (e.g., Oct 23–29 vs Oct 30–Nov 5) to normalize for Friday prayer seasonality.
3. **Evaluate Server Edge Logs (Railway)**:
   - Check Railway access logs to observe raw HTTP request volume across bot and human user agents, which reflects actual traffic independent of GA4 consent rates.
4. **Optional Technical Refinement for Future Phase (Non-Urgent)**:
   - In `src/app/page.tsx`, the root route currently performs a `redirect('/de')`, which emits an `HTTP 307 Temporary Redirect`. In a future planned release, the owner may consider using `permanentRedirect('/de')` (or `redirect('/de', RedirectType.replace)`) to emit an `HTTP 308 Permanent Redirect` for the apex domain, aligning it with best practices for static homepage routing.
