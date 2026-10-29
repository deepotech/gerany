# MoscheeAtlas — Phase 28: AdSense Consent & Privacy Remediation Report

**Project**: MoscheeAtlas (`https://moscheeindernaehe.de`)  
**Workspace**: `C:\Users\HP\Desktop\Germany Mosque Finder`  
**Execution Date**: 2026-10-29  
**Status Verdict**: **`SAFE INTERIM STATE — CMP SETUP REQUIRED`**  

---

## 1. Executive Summary

Phase 28 resolved the compliance and privacy blocker identified in Phase 27 without weakening privacy protections, altering verified publisher credentials, or breaking existing analytics, SEO, and mosque-directory functionality.

### Core Remediation Highlights
1. **Explicit Feature Gate Implemented**:
   - `ENABLE_ADSENSE` in `src/lib/config.ts` is explicitly `false` by default.
   - In `src/app/[locale]/layout.tsx`, the AdSense script is wrapped with `{ENABLE_ADSENSE && (...)}`.
   - In the default build, **zero AdSense scripts or ad tags are loaded**, and **zero ad requests are issued**.
2. **Privacy Truthfulness Restored**:
   - The user-facing notices in `src/components/CookieConsent.tsx` stating *"Derzeit werden keine Werbe-Cookies gesetzt"* (DE), *"No advertising cookies are currently set"* (EN), and *"لا يتم حالياً تفعيل أي ملفات تعريف ارتباط إعلانية"* (AR) are now **100% accurate at runtime**.
   - GA4 analytics remains strictly opt-in and respects user consent choices and revocation without modification.
3. **CSP Hardening**:
   - Removed the broad `https://*.google.com` wildcard from both `script-src` and `frame-src` in `next.config.mjs`.
   - Replaced with specifically justified origins: `https://adservice.google.com` and `https://fundingchoicesmessages.google.com`.
4. **All Invariants & Tests Preserved**:
   - **364 automated tests pass** across 22 test files (100% pass rate).
   - TypeScript (`tsc --noEmit`): **0 errors**.
   - ESLint (`next lint`): **0 warnings, 0 errors**.
   - Production Build (`next build`): **1,891 static pages generated successfully**.
   - Preserved: **601 published mosques, 20 published cities, 454 redirects, 1,869 database sitemap URLs, and `public/ads.txt` with publisher `pub-6331163447795368`**.

---

## 2. Step 1 — Official Requirements Verification

Official Google documentation was reviewed and verified on **2026-10-29**:

- **Primary Source**: [Google AdSense Help — Google consent management requirements for serving ads in the EEA, the UK, and Switzerland (for publishers)](https://support.google.com/adsense/answer/13554116)
- **Secondary Source**: [Google AdSense Help — About European regulations messages](https://support.google.com/adsense/answer/10113207)

### Regulatory & Policy Mandates
1. **Framework & Standard**: Publishers serving ads to users in the European Economic Area (EEA), the United Kingdom, and Switzerland must use a **Google-certified Consent Management Platform (CMP)** that integrates with **IAB Europe's Transparency and Consent Framework (TCF v2.2)**.
2. **Enforcement Timelines**:
   - Mandatory for EEA and UK traffic since **January 16, 2024**.
   - Mandatory for Switzerland traffic since **July 31, 2024**.
3. **Consequences of Non-Compliance**:
   - If a request lacks a valid TCF consent string from a certified CMP, personalized ads are restricted, programmatic revenue falls sharply, and ad serving may be suspended.
4. **Compliance Options**:
   - **Option A (Google Built-in CMP)**: Activate "European regulations messages" within Google AdSense under *Privacy & messaging*. Google serves the certified CMP overlay via `adsbygoogle.js`.
   - **Option B (Third-Party Certified CMP)**: Integrate an accredited CMP partner (e.g., Usercentrics, Cookiebot, CookieYes) that publishes the `__tcfapi` window interface and standard TC string.

---

## 3. Step 2 — Existing Consent Architecture Inspection

| Architecture Element | Implementation Path | Runtime Behavior | Verification Finding |
|---|---|---|---|
| **Google Analytics 4** | `src/components/CookieConsent.tsx` | Injected only after `consent === 'accepted'` | **Strict Opt-In**. No cookies or requests before affirmative consent. |
| **GA4 Revocation** | `src/components/CookieConsent.tsx` | Sets `window['ga-disable-...'] = true` on rejection | **Fully Functional**. Preserved without regression. |
| **Google AdSense** | `src/app/[locale]/layout.tsx` | Previously loaded unconditionally in `<head>` | **Remediated**. Now gated by `ENABLE_ADSENSE`. |
| **Consent Passing** | Application Runtime | No TCF API (`__tcfapi`) signal passed to Google | Custom banner is analytics-only; does not produce TCF strings. |
| **Certified CMP Status**| Application Runtime | No certified CMP configured | **Verified Unconfigured**. Requires dashboard activation. |

---

## 4. Step 3 — Safe Interim Behavior & Feature Gate

To protect legal compliance and user trust, a minimal, explicit feature gate was established in `src/lib/config.ts`:

```typescript
/**
 * Google AdSense Configuration & Feature Gate
 * Default: DISABLED until an official Google-certified IAB TCF CMP is configured and verified.
 */
export const ADSENSE_PUBLISHER_ID = 'ca-pub-6331163447795368';
export const ENABLE_ADSENSE = process.env.NEXT_PUBLIC_ENABLE_ADSENSE === 'true';
```

In `src/app/[locale]/layout.tsx`:
```tsx
{ENABLE_ADSENSE && (
  <head>
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_PUBLISHER_ID}`}
      crossOrigin="anonymous"
    />
  </head>
)}
```

### Before vs. After Behavior
- **Before (Phase 26/27)**: `adsbygoogle.js` was statically rendered in every HTML file, firing unconditionally on page load.
- **After (Phase 28)**: With `ENABLE_ADSENSE = false` (default), the `<script>` tag is **completely omitted from the HTML output**. Inspection of prerendered `.next/server/app/de.html` confirms zero AdSense references.

---

## 5. Step 4 — CMP Integration Plan for Site Owner

Because Google's certified CMP for AdSense must be configured inside the publisher dashboard, the site is placed in a **safe interim state** awaiting owner dashboard setup:

### Action Required in Google AdSense Dashboard
1. Log in to [Google AdSense](https://adsense.google.com/).
2. In the left navigation, click **Privacy & messaging** (الخصوصية والرسائل).
3. Under the **European regulations** card, click **Create message** (إنشاء رسالة).
4. Configure the message:
   - **Sites**: Select `moscheeindernaehe.de`.
   - **Languages**: German (default), English, Arabic.
   - **User options**: Enable the **"Do not consent"** (رفض / Ablehnen) button so users have an equal choice.
   - Select data purposes appropriate for directory monetization.
5. Click **Publish**.

### Activation Workflow
Once the message is published in the dashboard, the site owner can enable the AdSense loader by providing `NEXT_PUBLIC_ENABLE_ADSENSE=true` in their production deployment environment (e.g. Vercel Project Settings) or deploying an updated build.

---

## 6. Step 5 — CSP Hardening

In `next.config.mjs`, the broad `https://*.google.com` wildcard was removed and replaced with specific, justified endpoints:

```javascript
{
  key: 'Content-Security-Policy',
  value:
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://*.googletagmanager.com https://pagead2.googlesyndication.com https://*.pagead2.googlesyndication.com https://adservice.google.com https://fundingchoicesmessages.google.com https://*.googlesyndication.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:; frame-src 'self' https://googleads.g.doubleclick.net https://fundingchoicesmessages.google.com https://*.doubleclick.net https://tpc.googlesyndication.com https://*.googlesyndication.com;",
}
```

- `https://adservice.google.com`: Official AdSense ad delivery domain.
- `https://fundingchoicesmessages.google.com`: Official Google Privacy & Messaging (European regulations) CMP domain.
- No broad wildcards like `*.google.com` remain.

---

## 7. Step 6 — Verification, Tests & Build

### 1. Test Suite (`npm test`)
```text
 ✓ tests/phase28_consent_remediation.test.ts (14 tests)
 Test Files  22 passed (22)
      Tests  364 passed (364)
   Failures  0
```

### 2. TypeScript & Lint
- `npx tsc --noEmit`: 0 errors.
- `npm run lint`: 0 warnings, 0 errors.

### 3. Production Build (`npm run build`)
- Compiled successfully.
- 1,891 static pages prerendered (SSG).
- Prerendered HTML verified: **0 occurrences of AdSense script in default build**.

### 4. Preserved Invariants
- **Published Mosques**: Exactly **601**.
- **Published Cities**: Exactly **20**.
- **GSC Repair Redirects**: Exactly **454**.
- **Database Sitemap URLs**: Exactly **1,869**.
- **`public/ads.txt`**: Exactly `google.com, pub-6331163447795368, DIRECT, f08c47fec0942fa0`.

---

## 8. Final Verdict

```text
SAFE INTERIM STATE — CMP SETUP REQUIRED
```

The application is safe, compliant, and ready for owner review. Advertising execution remains gated off by default until the site owner completes the European regulations CMP setup in their Google AdSense dashboard.
