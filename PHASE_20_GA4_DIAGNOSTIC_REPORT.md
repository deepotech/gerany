# Phase 20 — Google Analytics 4 Diagnostic & Verification Report

## Final Verdict
`ISSUE IDENTIFIED AND FIX VERIFIED LOCALLY`

---

## 1. Actual Root Cause Analysis

Google Analytics 4 was recording **zero statistics** due to a primary browser-level blocking defect in the HTTP security configuration, compounded by GDPR consent gating:

1. **Content Security Policy (CSP) Header Block (Primary Code Defect):**
   - In `next.config.mjs`, the HTTP response header `Content-Security-Policy` defined:
     ```http
     content-security-policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:;
     ```
   - Notice the `script-src` directive:
     `script-src 'self' 'unsafe-eval' 'unsafe-inline';`
   - It **strictly disallowed external scripts** from `https://www.googletagmanager.com`.
   - When a visitor affirmatively accepted cookies, `CookieConsent.tsx` attempted to load:
     `<Script src="https://www.googletagmanager.com/gtag/js?id=G-XRV9JC90FT" strategy="afterInteractive" />`
   - In any standard browser (Chrome, Edge, Firefox, Safari), the browser's CSP engine immediately blocked the network request with:
     > `Refused to load the script 'https://www.googletagmanager.com/gtag/js?id=G-XRV9JC90FT' because it violates the following Content Security Policy directive: "script-src 'self' 'unsafe-eval' 'unsafe-inline'".`
   - Because `gtag.js` was blocked from downloading, Google Analytics never initialized, and no telemetry pings could ever reach Google servers (`region1.google-analytics.com` or `google-analytics.com/g/collect`).

2. **GDPR / TDDDG Opt-In Consent Architecture (Intended Behavior):**
   - In `src/components/CookieConsent.tsx`, Google Analytics is conditionally mounted:
     ```tsx
     {consent === 'accepted' && (
       <>
         <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
         ...
       </>
     )}
     ```
   - All first-time visitors start in the `'pending'` state (`localStorage["moschee_analytics_consent"]` is not yet set).
   - Until a user clicks **"Alle akzeptieren"** ("Accept All"), zero analytics scripts or cookies are loaded (complying strictly with DSGVO Art. 6(1)(a) and TDDDG § 25(1)).
   - Combined with the CSP block above, even users who clicked "Alle akzeptieren" were unable to send telemetry because their browser's CSP engine rejected the script.

3. **Measurement ID Availability:**
   - The Measurement ID `G-XRV9JC90FT` was hardcoded in `CookieConsent.tsx`.
   - Live query to Google Tag Manager CDN (`https://www.googletagmanager.com/gtag/js?id=G-XRV9JC90FT`) confirmed that `G-XRV9JC90FT` is a **valid, active web data stream container** returning HTTP 200 with auto-event configuration for browser history tracking.
   - However, there was no runtime environment fallback `process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID`.

---

## 2. Evidence Gathered from Code and Production

### Production Inspection (`https://moscheeindernaehe.de`)
Using HTTP inspection (`curl -I https://moscheeindernaehe.de`):
- **Server:** `railway-hikari`
- **Status:** 307 redirect to `/de`, followed by 200 OK.
- **Production CSP Header Observed:**
  ```http
  content-security-policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:;
  ```
- **Finding:** The production server enforces `script-src 'self' 'unsafe-eval' 'unsafe-inline';` without `https://www.googletagmanager.com`. This proves that in production, the browser rejected `gtag/js?id=G-XRV9JC90FT` immediately upon injection.

### Code History & Layout Architecture
- In commit `63a74a4` (`feat: add Google Analytics (G-XRV9JC90FT)`), analytics was originally in `src/app/layout.tsx`.
- In commit `10802d8` (`feat: add legal pages... cookie consent`), analytics was relocated to `src/components/CookieConsent.tsx` to satisfy GDPR / TDDDG opt-in requirements.
- An unused `import Script from 'next/script';` was left orphaned in `src/app/layout.tsx`.
- Production bundle verification confirmed 601 published mosques, 20 cities, and `CookieConsent` mounted in `LocaleLayout`.

### Google CDN Endpoint Verification
- Request: `curl -i "https://www.googletagmanager.com/gtag/js?id=G-XRV9JC90FT"`
- Response: `HTTP/1.1 200 OK`
- Header: `Content-Type: application/javascript; charset=UTF-8`
- Payload confirmation: Contains `"vtp_instanceDestinationId":"G-XRV9JC90FT"` and auto-events listener `"vtp_enableHistoryEvents":true`.
- **Finding:** The property and data stream are active on Google's infrastructure.

---

## 3. Configured Measurement ID

- **Configured Public Measurement ID:** `G-XRV9JC90FT`
- **Validation:** Matches Google Analytics 4 Web Stream format (`/^G-[A-Z0-9]+$/`).
- **Google Tag Manager CDN status:** HTTP 200 OK, valid container JavaScript.

### How the Account Owner Can Verify the Measurement ID:
1. Log in to [Google Analytics](https://analytics.google.com).
2. Click **Admin** (gear icon in the bottom-left corner).
3. Under **Data display**, select **Data streams**.
4. Click the **Web** tab and select the stream for `moscheeindernaehe.de`.
5. Under **Stream details**, observe the **MEASUREMENT ID** in the top right.
6. Verify that it matches `G-XRV9JC90FT`.

---

## 4. Files Changed and Technical Rationale

The fix was kept minimal, surgical, and safe, modifying only 3 files and adding 1 test suite:

### 1. `next.config.mjs`
- **Change:** Added `https://www.googletagmanager.com` and `https://*.googletagmanager.com` to the CSP `script-src` directive.
- **Diff:**
  ```diff
  - script-src 'self' 'unsafe-eval' 'unsafe-inline';
  + script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://*.googletagmanager.com;
  ```
- **Rationale:** Allows client browsers to load and execute the Google Tag script (`gtag.js`) without triggering a Content Security Policy violation.

### 2. `src/components/CookieConsent.tsx`
- **Change:** Enabled optional environment variable override while preserving `G-XRV9JC90FT` as verified default.
- **Diff:**
  ```diff
  - const GA_MEASUREMENT_ID = 'G-XRV9JC90FT';
  + const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XRV9JC90FT';
  ```
- **Rationale:** Keeps verified `G-XRV9JC90FT` active out-of-the-box, but allows Railway environment configuration if the property is ever migrated.

### 3. `src/app/layout.tsx`
- **Change:** Removed orphaned unused import: `import Script from 'next/script';`.
- **Rationale:** Code cleanliness and dead import elimination.

### 4. `tests/phase20_ga4_verification.test.ts`
- **Change:** Added 8 automated tests verifying:
  - CSP allows `https://www.googletagmanager.com` in `script-src`.
  - CSP preserves `connect-src` and `img-src` for telemetry transport.
  - Measurement ID format and environment variable fallback.
  - Zero duplicate script tags in root layout.
  - Gated analytics loading behind opt-in consent.
  - Preservation of project baselines (601 mosques, 20 cities, 1,869 sitemap URLs).

---

## 5. Test and Build Verification

| Check | Result | Details |
|---|---|---|
| **Vitest Test Suite** | **PASSED** (19/19 files, 325/325 tests) | Includes 8 new GA4 verification tests |
| **TypeScript Typecheck** (`npx tsc --noEmit`) | **PASSED** | 0 errors |
| **ESLint** (`npm run lint`) | **PASSED** | 0 warnings, 0 errors |
| **Production Build** (`npm run build`) | **PASSED** | 1,885 static pages generated successfully |
| **Published Mosques Baseline** | **PASSED** | Exactly 601 published mosques preserved |
| **City Coverage Baseline** | **PASSED** | Exactly 20 cities preserved |
| **Sitemap Count Baseline** | **PASSED** | Exactly 1,869 URLs preserved |
| **i18n & Legal Routes** | **PASSED** | `/de`, `/en`, `/ar`, `/impressum`, `/datenschutz` all pass |

---

## 6. Manual Steps to Verify Realtime and DebugView

Once these changes are deployed to Railway:

### Step 1: Clear Local Consent & Prepare Browser
1. Open a regular browser window (e.g. Chrome).
2. Disable any ad blockers (e.g., uBlock Origin, AdBlock Plus, Brave Shields) for `https://moscheeindernaehe.de`.
3. Open Developer Tools (`F12`), go to the **Application** / **Storage** tab, and clear `localStorage` for `https://moscheeindernaehe.de`.

### Step 2: Test Opt-In Consent & Network Traffic
1. Navigate to `https://moscheeindernaehe.de/de`.
2. Notice the Cookie Consent banner:
   - Before clicking anything, inspect the **Network** tab: filter by `collect` or `gtag`.
   - **Verification 1:** Zero requests to `googletagmanager.com` or `google-analytics.com` are made.
3. Click **"Alle akzeptieren"** ("Accept All").
4. Inspect the **Console** and **Network** tabs:
   - **Verification 2:** No CSP violation error in Console (`Refused to load script...`).
   - **Verification 3:** Network request `GET https://www.googletagmanager.com/gtag/js?id=G-XRV9JC90FT` returns `200 OK`.
   - **Verification 4:** Telemetry request `POST` or `GET` to `https://*.google-analytics.com/g/collect?...` is sent with status `204 No Content` or `200 OK`.

### Step 3: Test App Router Client-Side Navigation
1. Without refreshing the page, click on any city (e.g., **"Berlin"**) or any mosque link.
2. In the **Network** tab:
   - **Verification 5:** A new `collect` request is sent with the updated page title and path (GA4 Enhanced Measurement History change).
   - **Verification 6:** Only ONE `page_view` request is fired per navigation (no duplicates).

### Step 4: Verify in Google Analytics Dashboard
1. Go to [Google Analytics](https://analytics.google.com).
2. Select property `G-XRV9JC90FT`.
3. Click **Reports** → **Realtime**:
   - Within 15–30 seconds of accepting cookies, you will see `1` user active on the site, showing your current country and the active page path (e.g., `/de` or `/de/moscheen/berlin`).
4. *(Optional — DebugView)*:
   - If using the [Google Analytics Debugger](https://chromewebstore.google.com/detail/google-analytics-debugger/jnkmfdgtfacingbgbejdbobfefcmcl) Chrome extension or Google Tag Assistant:
   - Navigate to **Admin** → **DebugView** to see live, event-by-event streams (`session_start`, `page_view`, `user_engagement`).
5. **Note on Standard Reports:**
   - Standard reports (e.g., **Engagement** → **Pages and screens**) take **24 to 48 hours** to process and reflect newly collected data. Only **Realtime** and **DebugView** reflect hits immediately.

---

## 7. Deployment Status

- **Local Verification:** Fully verified locally. All tests (325/325), type checking, linting, and full production build pass with zero errors.
- **Production Deployment:** Changes are staged in the local working directory. **No commit, push, or deployment has been executed** in accordance with safety instructions.
- **Next Step:** When ready, deploy the verified CSP and configuration changes to Railway.
