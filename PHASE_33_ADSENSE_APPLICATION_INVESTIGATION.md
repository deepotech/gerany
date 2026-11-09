# PHASE 33 — AdSense Application & Root Domain Redirect Investigation Report

**Investigation Date:** November 5, 2026  
**Project:** MoscheeAtlas  
**Domain:** `https://moscheeindernaehe.de`  
**Scope:** Strictly Read-Only Investigation of Root Redirect, AdSense Readiness, and Application Completion  
**Status:** Completed  

---

## 1. Executive Summary

This investigation analyzed the production environment of MoscheeAtlas (`https://moscheeindernaehe.de`) following reports that:
1. Opening `/` redirects to `/de/`.
2. Google AdSense rejected the website application.
3. The site owner subsequently could not complete or resubmit the application in the AdSense console.
4. `/de/sitemap.xml` displays the custom German 404 page.

### Key Investigation Findings
1. **Root URL HTTP Anomaly (`/`):**
   When `https://moscheeindernaehe.de/` is requested via standard HTTP (as done by Googlebot, AdSense review crawlers, and curl), the server returns **`HTTP/1.1 307 Temporary Redirect` with NO `Location` header**.
   - Standard HTTP clients cannot follow this redirect.
   - The body returned with the 307 response contains Next.js error fallback HTML (`<html id="__next_error__">`) rendering the custom German 404 page (*"404 • Seite nicht gefunden / Diese Seite existiert leider nicht"*).
   - In desktop/mobile web browsers, JavaScript execution allows the Next.js client router to read a hydration script digest (`NEXT_REDIRECT;replace;/de;307;`) and navigate to `/de`. However, non-JS HTTP review crawlers perceive the root domain as an unredirected 307 error displaying a 404 page.
2. **AdSense Script is Disabled on Production:**
   In Phase 28, the AdSense loader snippet in `src/app/[locale]/layout.tsx` was placed behind a feature gate: `ENABLE_ADSENSE = process.env.NEXT_PUBLIC_ENABLE_ADSENSE === 'true'`. In the production Railway deployment, `NEXT_PUBLIC_ENABLE_ADSENSE` is not set to `true`. Consequently, **zero AdSense `<script>` tags are present in the HTML of production pages**. If AdSense attempted to verify site ownership via the AdSense code snippet, verification would fail immediately.
3. **`ads.txt` is Healthy and Accessible:**
   `https://moscheeindernaehe.de/ads.txt` returns **HTTP 200 OK** and contains the exact valid directive:
   `google.com, pub-6331163447795368, DIRECT, f08c47fec0942fa0`.
4. **AdSense Rejection Reason Cannot Be Established from the Repository:**
   No rejection emails, dashboard screenshots, or error logs from Google AdSense exist within the project repository. It is therefore impossible to confirm Google's official rejection category from local artifacts.
5. **Sitemap Cross-Check:**
   As confirmed in Phase 32, `/de/sitemap.xml` is not a valid endpoint and returns HTTP 404. The canonical root sitemap is `https://moscheeindernaehe.de/sitemap.xml`, which is 100% operational with 1,869 indexable URLs and declared in `robots.txt`.

---

## 2. Task 1 — Root URL Redirect Inspection

Production endpoints were probed using multiple HTTP methods, User-Agents, and headers.

### HTTP Response Matrix

| Endpoint | HTTP Status | `Location` Header | Redirect Type | Final Target | Canonical URL | hreflang Tags |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`/`** | **`307 Temporary Redirect`** | **None (Missing)** | 307 (SSR/SSG digest) | Stalls at `/` (HTTP)<br>`/de` (JS Browser) | None in `<head>` | None in `<head>` |
| **`/de/`** | `308 Permanent Redirect` | `/de` | 308 (Trailing slash) | `https://moscheeindernaehe.de/de` | `https://moscheeindernaehe.de/de` | `de`, `en`, `ar`, `x-default` |
| **`/en/`** | `308 Permanent Redirect` | `/en` | 308 (Trailing slash) | `https://moscheeindernaehe.de/en` | `https://moscheeindernaehe.de/en` | `de`, `en`, `ar`, `x-default` |
| **`/ar/`** | `308 Permanent Redirect` | `/ar` | 308 (Trailing slash) | `https://moscheeindernaehe.de/ar` | `https://moscheeindernaehe.de/ar` | `de`, `en`, `ar`, `x-default` |
| **`/de`** | `200 OK` | N/A | None (Direct) | `https://moscheeindernaehe.de/de` | `https://moscheeindernaehe.de/de` | `de`, `en`, `ar`, `x-default` |
| **`/en`** | `200 OK` | N/A | None (Direct) | `https://moscheeindernaehe.de/en` | `https://moscheeindernaehe.de/en` | `de`, `en`, `ar`, `x-default` |
| **`/ar`** | `200 OK` | N/A | None (Direct) | `https://moscheeindernaehe.de/ar` | `https://moscheeindernaehe.de/ar` | `de`, `en`, `ar`, `x-default` |

### Detailed Analysis of Root Redirection (`/`)

#### 1. Why the `Location` Header is Missing
In `src/app/page.tsx`:
```tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  redirect('/de');
}
```
During the Next.js SSG build (`next build`), Next.js prerenders `src/app/page.tsx`. Invoking `redirect('/de')` inside a Server Component causes Next.js to record `"status": 307` in `.next/server/app/index.meta`, while writing RSC error digest markup into `.next/server/app/index.html`:
```html
<script>self.__next_f.push([1,"4:E{\"digest\":\"NEXT_REDIRECT;replace;/de;307;\"}\n"])</script>
```
When served by Next.js in production, this static response is sent with HTTP status code `307`, but **without an HTTP `Location:` header**. Furthermore, because `page.tsx` throws before rendering a page component, Next.js falls back to rendering `not-found.tsx` into the HTML body.

#### 2. Determinism & Dependency Check
- **Browser Language (`Accept-Language`):** Sending `Accept-Language: en-US,en;q=0.9` or `ar` has no effect. The response is identical (HTTP 307, ETag `"5tftpp5vai6ks"`).
- **Cookies:** Root behavior is completely independent of cookies.
- **Geolocation:** Tested from multiple IP contexts; root behavior is completely fixed.
- **Fixed Default Locale:** Root redirection is statically hardcoded to target `/de`.

#### 3. Crawler vs. Browser Consistency
- **RFC Compliance:** Per RFC 9110 § 15.4.8, an HTTP 307 response requires a `Location` header field containing a URI reference for the user agent to automatically redirect.
- **Automated HTTP Crawlers (Googlebot, Mediapartners-Google, curl):** Receive status 307 without a `Location` header, cannot navigate to `/de`, and see an HTML body stating *"404 • Seite nicht gefunden"*.
- **Interactive Browsers:** A browser downloads the JavaScript bundle, hydrates the Next.js runtime, executes the RSC redirect instruction, and navigates client-side to `/de`.

---

## 3. Task 2 — AdSense Readiness Audit

| Verification Item | Implementation / Location | Production Status | Assessment |
| :--- | :--- | :--- | :--- |
| **`ads.txt`** | `public/ads.txt` | **HTTP 200 OK** | **PASSED.** Contains `google.com, pub-6331163447795368, DIRECT, f08c47fec0942fa0`. |
| **AdSense Script Tag** | `src/app/[locale]/layout.tsx` | **OMITTED (Absent)** | **BLOCKED.** Gated by `ENABLE_ADSENSE = false`. 0 script tags on live site. |
| **Publisher ID** | `src/lib/config.ts` | Configured: `pub-6331163447795368` | Matches `ads.txt`. |
| **Privacy Policy** | `/de/datenschutz` | **HTTP 200 OK** | **PASSED.** Prerendered HTML, GDPR/TDDDG compliant. |
| **Impressum** | `/de/impressum` | **HTTP 200 OK** | **PASSED.** Prerendered HTML, full legal disclosures. |
| **About Page** | `/de/about` | **HTTP 200 OK** | **PASSED.** Prerendered HTML, editorial and project info. |
| **Contact Page** | `/de/contact` | **HTTP 200 OK** | **PASSED.** Prerendered HTML, direct feedback/contact options. |
| **Content Quality** | 601 Mosques in 20 Cities | **HTTP 200 OK** | **PASSED.** High-quality original directory data, 0 placeholder pages. |
| **Authentication Barrier** | Global | No login required | **PASSED.** 100% of directory content is publicly accessible. |
| **Root Landing Page** | `/` | Returns 307 (no Location) | **FAILED.** Does not serve standalone landing content or valid redirect. |
| **Certified CMP** | `CookieConsent.tsx` | Custom banner (analytics only) | **FAILED.** No Google-certified IAB TCF v2.2 CMP integrated. |

---

## 4. Task 3 — Identification of Actual Rejection Reason

An exhaustive scan of all workspace markdown reports, JSON audits, test fixtures, and scripts was conducted.

### Evidence Assessment
1. **Rejection Artifacts in Repository:**
   No email copies, support transcripts, AdSense notifications, or dashboard screenshots exist in the repository.
2. **Explicit Finding:**
   **The official Google AdSense rejection category and message CANNOT be established from the repository files.**
3. **Plausible Technical Triggers Based on Evidence:**
   While the exact reason from Google is not documented locally, two technical conditions are known to trigger immediate AdSense disapproval or failure during site reviews:
   - **Missing Verification Snippet:** Because `ENABLE_ADSENSE` is `false`, the `<script async src="https://pagead2.googlesyndication.com/..."></script>` snippet is absent from the production HTML. If the owner selected "AdSense code snippet" as the connection method, AdSense automated checks report: *"We couldn't verify your site"* or *"Code not found"*.
   - **Root URL Accessibility Failure:** AdSense requires the root domain (`moscheeindernaehe.de`). When AdSense review bots fetch `https://moscheeindernaehe.de/`, they receive an HTTP 307 without a `Location` header and read a body containing `"404 • Seite nicht gefunden"`. This frequently triggers rejection notices such as *"Site down or unavailable"*, *"Site not found"*, or *"Valueless or broken landing page"*.

---

## 5. Task 4 — Application Completion & Resubmission Problem

The user reported being unable to complete or resubmit the application after rejection.

### Probable Causes in Google AdSense Workflow:
1. **Root Domain URL Requirement:**
   Google AdSense only accepts naked or apex domains (e.g. `moscheeindernaehe.de`), not sub-paths (e.g. `moscheeindernaehe.de/de` or `moscheeindernaehe.de/de/`). If the user attempted to enter the redirect destination URL (`/de`), the AdSense interface rejects the input with an error such as *"Enter a valid URL"*.
2. **Verification State Lock:**
   In the AdSense *Sites* panel, if an automated verification check fails (because code is missing or root returns an error), the "Request review" button is disabled until the connection method is marked as fixed or until Google's re-crawl timer elapses.
3. **Pending Account Activation Tasks:**
   If account-level items (Publisher information, Tax information, Phone verification, or Payment address) are incomplete in the AdSense account, site review cannot proceed.
4. **Account Access Status:**
   The assistant has no live OAuth connection or API access to the user's Google AdSense account. Therefore, the exact console state is **unknown due to lack of account access**.

### Exact Information the Site Owner Must Check in AdSense:
The owner should log in to [Google AdSense](https://www.google.com/adsense) and inspect the following specific screens:
1. **Sites > `moscheeindernaehe.de`:**
   - What is the exact status pill? (e.g., *Needs attention*, *Getting ready*, *Requires review*).
   - Click on the site name to expand details: What exact rejection text or policy violation is cited? (e.g., *"Site down or unavailable"*, *"Low value content"*, *"Site not found"*, *"We couldn't find the code"*).
   - Under "Connect your site", which verification method is selected? (*AdSense code snippet*, *Ads.txt snippet*, or *Meta tag*).
2. **Account > Settings > Account Information:**
   - Is the publisher ID confirmed as `pub-6331163447795368`?
3. **Payments > Verification Check:**
   - Are identity and phone number verification marked as completed?
4. **Privacy & Messaging:**
   - Is a Google-certified GDPR message created and published?

---

## 6. Task 5 — Sitemap Cross-Check

Findings from `PHASE_32_SITEMAP_INCIDENT_REPORT.md` were cross-checked:
1. **Endpoint Validity:**
   - `https://moscheeindernaehe.de/de/sitemap.xml` is **invalid** (returns HTTP 404). It is not an implemented route.
   - `https://moscheeindernaehe.de/sitemap.xml` is the **canonical sitemap**. It returns HTTP 200 OK, valid XML, and contains all 1,869 indexable URLs.
2. **Robots.txt Declaration:**
   `https://moscheeindernaehe.de/robots.txt` correctly declares:
   `Sitemap: https://moscheeindernaehe.de/sitemap.xml`
3. **Relevance to AdSense:**
   Google AdSense reviews do not rely on `/de/sitemap.xml`. If the owner submitted `/de/sitemap.xml` in an application or webmaster tool, that submission would fail. All external systems should point exclusively to `https://moscheeindernaehe.de/sitemap.xml`.

---

## 7. Recommended Solutions (Informational — NOT Implemented)

To resolve the technical issues in a subsequent phase, the following actions are recommended:

### Recommendation 1: Fix Root Redirection via Next.js Configuration
Instead of using `redirect('/de')` inside `src/app/page.tsx` (which generates a 307 without a `Location` header during SSG), configure the root redirect directly in `next.config.mjs`:
```javascript
// in next.config.mjs
async redirects() {
  return [
    {
      source: '/',
      destination: '/de',
      permanent: false, // Emits a genuine HTTP 307 with Location: /de header
    },
    ...redirectsList.map((r) => ({
      source: r.source,
      destination: r.destination,
      permanent: r.permanent ?? true,
    })),
  ];
}
```
*Benefits:* Emits a valid HTTP `Location: /de` header on all HTTP requests to `/`, allowing crawlers, bots, and curl to automatically follow the redirect without needing client-side JavaScript.

### Recommendation 2: Use `ads.txt` as Primary Verification Method in AdSense
Rather than injecting the full AdSense ad script before review, the site owner should select **"Ads.txt snippet"** as the site verification method inside the Google AdSense dashboard.
- `https://moscheeindernaehe.de/ads.txt` is already live, returns HTTP 200 OK, and contains the owner's exact publisher ID.
- This satisfies Google site ownership verification without firing third-party advertising scripts prior to user consent.

### Recommendation 3: Add Locale Sitemap Redirects
In `next.config.mjs`, add convenience redirects for locale-prefixed sitemap requests:
```javascript
{
  source: '/:locale(de|en|ar)/sitemap.xml',
  destination: '/sitemap.xml',
  permanent: true,
}
```
*Benefits:* Prevents 404 errors if crawlers or third-party audit tools append locale prefixes to `sitemap.xml`.

---

## 8. Should AdSense Remain Disabled?

### Verdict: **YES, ADSENSE MUST REMAIN DISABLED AT THIS TIME.**

AdSense script loading (`ENABLE_ADSENSE`) should remain `false` for the following reasons:
1. **Legal & Regulatory Blocker (GDPR / § 25 TDDDG):**
   The current cookie banner in `src/components/CookieConsent.tsx` is an analytics-only banner. It does not integrate with IAB Europe's Transparency and Consent Framework (TCF v2.2) and does not expose the `__tcfapi` interface required by Google for EU/EEA traffic since January 16, 2024.
2. **Preventing Regulatory Liability:**
   If `ENABLE_ADSENSE` were enabled without a certified CMP, `pagead2.googlesyndication.com` would execute unconditionally on page load for all German visitors, violating user privacy disclosures and risking immediate policy suspension from Google.
3. **Safe Path to Approval:**
   The site owner can verify ownership via `ads.txt` without activating ad script rendering. Once AdSense approves the domain, a certified CMP (such as Google's built-in Privacy & Messaging tool or an approved vendor) can be configured before enabling `NEXT_PUBLIC_ENABLE_ADSENSE=true`.

---

## 9. Compliance Confirmation & Git Status

- **Read-Only Rule:** Maintained strictly. No code, configuration, or environment settings were modified.
- No AdSense applications were submitted or resubmitted.
- No changes committed, pushed, or deployed.
- Only this investigation report (`PHASE_33_ADSENSE_APPLICATION_INVESTIGATION.md`) was written to the workspace.

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

nothing added to commit but untracked files present (use "git add" to track)
```
