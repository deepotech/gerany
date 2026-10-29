# MoscheeAtlas — Phase 26: AdSense Technical Integration & Pre-Deployment Report

**Project**: MoscheeAtlas (`https://moscheeindernaehe.de`)  
**Workspace**: `C:\Users\HP\Desktop\Germany Mosque Finder`  
**Execution Date**: 2026-10-29  
**Publisher Account**: `pub-6331163447795368` / `ca-pub-6331163447795368`  
**Status**: INTEGRATION VERIFIED & READY FOR DEPLOYMENT  

---

## 1. Executive Summary

Phase 26 successfully completed the technical integration of Google AdSense into the MoscheeAtlas codebase while strictly respecting project invariants, privacy disclosures, and security headers:

1. **`public/ads.txt` Deployed**:
   - Authorized Digital Sellers directive configured at domain root.
   - Exact entry: `google.com, pub-6331163447795368, DIRECT, f08c47fec0942fa0`.
2. **Content Security Policy (CSP) Updated**:
   - `next.config.mjs` safely permits Google AdSense script distribution and DoubleClick ad frames without relaxing general script or frame origin restrictions.
3. **Publisher Snippet Injected**:
   - Localized layout `<head>` (`src/app/[locale]/layout.tsx`) includes the asynchronous AdSense loader with genuine publisher ID `ca-pub-6331163447795368`.
4. **Zero Regressions & Full Verification**:
   - **350 automated tests pass** across 21 test suites (0 failures).
   - TypeScript (`tsc --noEmit`): **0 errors**.
   - ESLint (`next lint`): **0 warnings, 0 errors**.
   - Next.js Production Build (`next build`): **1,891 static pages (SSG) prerendered successfully**.
   - Invariants strictly preserved: **601 published mosques, 20 cities, 454 redirects, 1,869 sitemap URLs**.

---

## 2. File Modification Details

### 1. `public/ads.txt` (Created)
- **Path**: `public/ads.txt`
- **Content**:
  ```text
  google.com, pub-6331163447795368, DIRECT, f08c47fec0942fa0
  ```
- **Verification**: Next.js automatically maps this file to `https://moscheeindernaehe.de/ads.txt`.

### 2. `next.config.mjs` (Modified)
- **CSP Rule**:
  ```javascript
  {
    key: 'Content-Security-Policy',
    value:
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://*.googletagmanager.com https://pagead2.googlesyndication.com https://*.pagead2.googlesyndication.com https://*.google.com https://*.googlesyndication.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https:; frame-src 'self' https://googleads.g.doubleclick.net https://*.google.com https://*.doubleclick.net https://tpc.googlesyndication.com https://*.googlesyndication.com;",
  }
  ```

### 3. `src/app/[locale]/layout.tsx` (Modified)
- Injected `<head>` section inside `<html lang={locale} dir={isRtl ? 'rtl' : 'ltr'}>`:
  ```tsx
  <head>
    <script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6331163447795368"
      crossOrigin="anonymous"
    />
  </head>
  ```

### 4. `tests/phase26_adsense_integration.test.ts` (Created)
- 9 dedicated test assertions validating:
  - `ads.txt` existence and directive correctness.
  - CSP script and frame sources.
  - Layout script client ID and attributes.
  - Invariant preservation (601 mosques, 20 cities, 454 redirects).

---

## 3. Verification & Build Evidence

```text
> vitest run
 ✓ tests/phase26_adsense_integration.test.ts (9 tests)
 Test Files  21 passed (21)
      Tests  350 passed (350)

> next lint
✔ No ESLint warnings or errors

> tsc --noEmit
Exit code: 0

> next build
✓ Compiled successfully
✓ Generating static pages (1891/1891)
Finalizing page optimization ...
```

---

## 4. Next Steps for Site Owner

1. **Commit and Push to Git**:
   ```bash
   git add .
   git commit -m "feat(adsense): integrate ads.txt, AdSense loader, and CSP configuration (Phase 26)"
   git push origin main
   ```
2. **Deploy to Production Host (e.g. Vercel)**.
3. **Verify Live Endpoints**:
   - `curl -I https://moscheeindernaehe.de/ads.txt` (should return 200 OK with ads.txt line).
   - Check page source of `https://moscheeindernaehe.de/de` to confirm `<script async src="...ca-pub-6331163447795368"...>`.
4. **Google AdSense Dashboard**:
   - Go to AdSense > Sites > `moscheeindernaehe.de`.
   - Confirm site ownership verification.
   - Request review.
   - In "Privacy & messaging", activate the Google-certified GDPR message (TCF v2.2 CMP).
