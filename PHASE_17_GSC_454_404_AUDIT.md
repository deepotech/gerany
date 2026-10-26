# Phase 17 — GSC 454 New 404 URLs: Comprehensive Audit, Mapping, and 404 Diagnosis Report

**Project:** MoscheeAtlas  
**Domain:** `https://moscheeindernaehe.de`  
**Directory:** `C:\Users\HP\Desktop\Germany Mosque Finder`  
**Execution Date:** 2026-10-26  
**Input GSC Export:** `media_1793041578519_96374df0.zip` (`Tableau.csv`, `Graphique.csv`, `Métadonnées.csv`)  
**Status:** **AUDIT COMPLETE — 100% EVIDENCE-BACKED & VERIFIED**  
**Recommendation:** **READY TO IMPLEMENT**

---

## 1. Executive Summary

Following a fresh Google Search Console "Page indexing" alert (*"De nouvelles raisons empêchent l'indexation de vos pages"*), Googlebot reported **454 URLs** returning HTTP 404 (*Introuvable*), crawled primarily on **2026-10-24**. 

Phase 17 conducted a strict, audit-only analysis of all 454 URLs, cross-referencing every URL against the canonical route registry, published mosque database (`src/data/mosques.json`), city configurations (`src/pipeline/city-config.ts`), existing redirects (`src/data/redirects.json`), and the production build artifacts (`.next/`). In addition, an independent root-cause forensic investigation of the user-reported blank 404 screen on `/de/moscheen/berlin2` was executed.

### Key Audit Findings:
1. **Source Integrity:** Exactly **454 unique source URLs** are present in the GSC export (zero duplicates).
2. **Trailing Digit Phenomenon:** Every single URL (454 / 454) represents an authentic, valid page corrupted by an extraneous trailing digit:
   - Trailing `1`: **2 URLs** (both are root locale landing pages: `/de1`, `/ar1`).
   - Trailing `2`: **11 URLs** (all 11 are city collection routes: `.../berlin2`, `.../muenchen2`, etc.).
   - Trailing `3`: **318 URLs** (all 318 are mosque detail routes).
   - Trailing `4`: **123 URLs** (all 123 are mosque detail routes).
3. **Canonical Verification:** Stripping exactly the single trailing digit and verifying the resulting path against canonical routing rules yields an **exact 100% match (454 of 454)**:
   - **441 Mosque Detail Pages:** Mapped with 100% precision to active, published entities in `src/data/mosques.json` matching both slug and city. All 441 exist as prerendered SSG HTML documents in `.next/server/app/`.
   - **11 City Collection Pages:** Mapped cleanly to canonical city index routes across 10 distinct published cities (Berlin, München, Hamburg, Nürnberg, Frankfurt, Bonn, Dortmund, Wuppertal, Stuttgart, Düsseldorf).
   - **2 Root Landing Pages:** Mapped cleanly to canonical root locales (`/de`, `/ar`).
4. **Existing Redirect Overlap & Conflict Check:**
   - **74 URLs** were previously identified and configured in `src/data/redirects.json` during Phase 15A.
   - **380 URLs** are newly reported in the 2026-10-24 crawl.
   - **Conflict Count: 0.** All 74 existing mappings perfectly align with the audited canonical destinations.
   - **Chain & Loop Count: 0.** Zero redirect chains, zero circular loops detected.
5. **Negative Control & Quarantine Boundaries:**
   - All 60 non-published entities (e.g., Münster Palace Square / `candidate_audit_results.json`) remain strictly excluded from proposed destinations.
6. **Diagnosis of Blank 404 Screen:**
   - Prerendered build analysis of `.next/server/app/_not-found.html` confirms that Next.js App Router root layout (`src/app/layout.tsx`) lacks opening `<html...>` and `<body...>` tags (which were placed exclusively inside `src/app/[locale]/layout.tsx`).
   - When a 404 route is requested, Next.js renders root `src/app/not-found.tsx` inside `src/app/layout.tsx`, emitting an invalid HTML document missing opening `<html>` and `<body>` elements.
   - In production, client-side React hydration on the document root throws a fatal DOM mismatch exception, causing React to abort or unmount the tree, rendering a completely blank white screen.

---

## 2. Statistical Breakdown of 454 GSC URLs

| Dimension | Category | Count | Percentage |
|---|---|:---:|:---:|
| **Total URLs** | Total in Export / Unique | 454 / 454 | 100.0% |
| **Locales** | English (`en`) | 161 | 35.5% |
| | Arabic (`ar`) | 161 | 35.5% |
| | German (`de`) | 132 | 29.0% |
| **Route Types** | Mosque Detail Pages | 441 | 97.1% |
| | City Collection Pages | 11 | 2.4% |
| | Root Locale Pages | 2 | 0.5% |
| **Trailing Digit** | Trailing `3` | 318 | 70.0% |
| | Trailing `4` | 123 | 27.1% |
| | Trailing `2` | 11 | 2.4% |
| | Trailing `1` | 2 | 0.5% |
| **Implementation Status** | Already in `redirects.json` (Phase 15A) | 74 | 16.3% |
| | Newly Identified (Needs Config) | 380 | 83.7% |
| **Audit Verification** | `VERIFIED_CANONICAL` | **454** | **100.0%** |
| | Conflicts / Ambiguities / Unresolved | **0** | **0.0%** |

---

## 3. Detailed Diagnosis: The Blank 404 Screen

### 3.1 Symptoms Reported
- A user navigating to `https://moscheeindernaehe.de/de/moscheen/berlin2` observed a completely blank, white viewport in Google Chrome.
- The tab title retained the raw URL without rendering the custom 404 UI.

### 3.2 Root Cause Forensic Evidence

#### 1. Next.js App Router Layout Architecture
Next.js App Router requires the root layout (`src/app/layout.tsx`) to define the top-level `<html>` and `<body>` tags.  
In the current codebase:
- `src/app/[locale]/layout.tsx` defines `<html lang={locale} dir={...}>` and `<body className="...">`.
- `src/app/layout.tsx` defines:
```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```
- `src/app/not-found.tsx` defines:
```tsx
export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16">
      ...
    </div>
  );
}
```

#### 2. Root-Level 404 Bubbling
When a route like `/de/moscheen/berlin2` is requested:
1. It matches the dynamic route `src/app/[locale]/moscheen/[city]/page.tsx`.
2. Inside `GermanCityCollectionPage`:
```tsx
const normalized = normalizeCitySlug(city);
const cityConfig = CITY_CONFIGS.find(...);
if (!cityConfig) notFound();
```
3. Because `berlin2` is not a valid city slug, `notFound()` is thrown.
4. Because there is no `src/app/[locale]/not-found.tsx`, the error bubbles to the root `src/app/not-found.tsx`.
5. Root `not-found.tsx` is wrapped **only by root `src/app/layout.tsx`**, bypassing `src/app/[locale]/layout.tsx`.

#### 3. Prerendered HTML Inspection (`.next/server/app/_not-found.html`)
Direct examination of the compiled production build artifact `.next/server/app/_not-found.html` confirms:
- **Index of `<html`:** `-1` (Tag does not exist)
- **Index of `<body`:** `-1` (Tag does not exist)
- **Index of `</body>`:** `16629` (Closing tag emitted)
- **Index of `</html>`:** `16636` (Closing tag emitted)

The server sends an amputated HTML fragment beginning with:
```html
<meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/css/07e4556b1bdb274e.css" data-precedence="next"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/chunks/webpack-2eaf9853deab54d3.js"/><script src="/_next/static/chunks/fd9d1056-86af8b28552becb8.js" async=""></script>...<div class="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16">
```

#### 4. Browser DOM Parser & React Hydration Failure
1. **Synthesized Browser DOM:** The browser parses the headless stream, automatically synthesizing implicit `<html>`, `<head>`, and `<body>` nodes to encapsulate the content.
2. **React Hydration Mismatch:** Next.js client runtime (`hydrateRoot(document, ...)`) attempts to reconcile the virtual DOM against `document`.
3. **Fatal Invariant:** React detects that the server component tree (`RootLayout`) returned no `<html>` or `<body>` elements.
4. **Uncaught Error:** React throws a fatal client-side hydration error. In production Next.js without a root error boundary, React unmounts or fails to paint the UI, leaving the user with an empty white viewport.

### 3.3 Prescribed Architectural Fix (For Implementation Phase)
Wrap `src/app/not-found.tsx` in valid `<html lang="de">` and `<body>` elements:
```tsx
export default function NotFound() {
  return (
    <html lang="de">
      <body className="min-h-screen flex flex-col bg-slate-50">
        <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16">
          {/* 404 content */}
        </div>
      </body>
    </html>
  );
}
```
This satisfies Next.js App Router document-level contract for root `not-found.tsx`, guarantees proper CSS loading, and prevents React hydration crashes.

---

## 4. Verification & Regression Metrics

| Check | Expected | Actual Result | Status |
|---|:---:|:---:|:---:|
| **Vitest Test Suite** | 308 tests pass | **308 / 308 passed** (17 test suites) | PASS ✅ |
| **TypeScript Typecheck** | 0 errors | **0 errors** (`npx tsc --noEmit`) | PASS ✅ |
| **ESLint Validation** | 0 errors/warnings | **0 warnings/errors** (`next lint`) | PASS ✅ |
| **Source URL Uniqueness** | 454 unique | **454 unique** (0 duplicates) | PASS ✅ |
| **Canonical Target Resolution** | 454 valid | **454 / 454 valid** (100%) | PASS ✅ |
| **Existing Redirect Conflicts** | 0 conflicts | **0 conflicts** with 74 existing rules | PASS ✅ |
| **Redirect Loop Detection** | 0 loops | **0 loops** | PASS ✅ |
| **Redirect Chain Detection** | 0 chains | **0 chains** | PASS ✅ |
| **Negative Control Quarantine** | 0 leaked | **0 / 60 non-published entities leaked** | PASS ✅ |
| **Published Mosque Place IDs** | 441 matches | **441 / 441 match published mosques** | PASS ✅ |
| **City Config Alignment** | 11 matches | **11 / 11 match active published cities** | PASS ✅ |

---

## 5. Complete Inventory of All 454 GSC 404 URLs

Below is the complete, exhaustive catalog of all 454 URLs from Google Search Console `Tableau.csv`, their crawl dates, trailing digit breakdown, matched authentic entity, and verified canonical destination.

| # | GSC Source URL | Crawl Date | Type | Digit | Matched Entity (Place ID / City) | Canonical Target Route | Status |
|---|---|:---:|:---:|:---:|---|---|:---:|
| 1 | `/de/moscheen/berlin2` | 2026-10-24 | city | `2` | Berlin | `/de/moscheen/berlin` | `NEW_301` ✅ |
| 2 | `/ar/mosque/muenchen/d-t-m-merkez-camii-muenih3` | 2026-10-24 | detail | `3` | DİTİM Merkez Camii Münih (ChIJBToV8zbfnUcRJ3Ws_rdcIes) | `/ar/mosque/muenchen/d-t-m-merkez-camii-muenih` | `NEW_301` ✅ |
| 3 | `/en/mosque/cologne/masjid-hamza-moschee4` | 2026-10-24 | detail | `4` | Masjid Hamza Moschee (ChIJc1-1uAYmv0cRHmlclDg6IQ4) | `/en/mosque/cologne/masjid-hamza-moschee` | `NEW_301` ✅ |
| 4 | `/de/moschee/duesseldorf/moschee-mosque-beyazit-camii3` | 2026-10-24 | detail | `3` | Moschee Mosque Beyazit Camii (ChIJ3WKWnWS3uEcRGTCj2YPZ4TA) | `/de/moschee/duesseldorf/moschee-mosque-beyazit-camii` | `NEW_301` ✅ |
| 5 | `/en/mosque/hamburg/rayyan-moschee3` | 2026-10-24 | detail | `3` | Rayyan Moschee (ChIJwxF-PQCNsUcR-UHeHZ3jq4I) | `/en/mosque/hamburg/rayyan-moschee` | `NEW_301` ✅ |
| 6 | `/ar/mosque/essen/igbd-gemeinde-essen4` | 2026-10-24 | detail | `4` | IGBD - Gemeinde Essen e.V. (ChIJEbT_k3LouEcRIZPUMEPiK-w) | `/ar/mosque/essen/igbd-gemeinde-essen` | `NEW_301` ✅ |
| 7 | `/ar/mosque/essen/essen-central-mosque4` | 2026-10-24 | detail | `4` | Essen Central Mosque (ChIJzxcluM_nuEcRxgWm2dG-sOs) | `/ar/mosque/essen/essen-central-mosque` | `NEW_301` ✅ |
| 8 | `/ar/mosque/hamburg/hamburg-merkez-camii3` | 2026-10-24 | detail | `3` | Hamburg merkez camii (ChIJb0B7N5-OsUcRbiJycThoWnE) | `/ar/mosque/hamburg/hamburg-merkez-camii` | `NEW_301` ✅ |
| 9 | `/en/mosque/nuremberg/al-madinah-darussalam3` | 2026-10-24 | detail | `3` | Al Madinah Darussalam (ChIJVU-WfwZXn0cRjo_C64Z7rgQ) | `/en/mosque/nuremberg/al-madinah-darussalam` | `NEW_301` ✅ |
| 10 | `/de/moschee/frankfurt/mam-mehdi-hueseyniye-camii3` | 2026-10-24 | detail | `3` | İmam Mehdi Hüseyniye Camii (ChIJrfDtKFwLvUcRyR38qu8JA_E) | `/de/moschee/frankfurt/mam-mehdi-hueseyniye-camii` | `NEW_301` ✅ |
| 11 | `/en/mosque/essen/igbd-gemeinde-essen4` | 2026-10-24 | detail | `4` | IGBD - Gemeinde Essen e.V. (ChIJEbT_k3LouEcRIZPUMEPiK-w) | `/en/mosque/essen/igbd-gemeinde-essen` | `NEW_301` ✅ |
| 12 | `/ar/mosque/nuernberg/aikf-al-rahama-moschee3` | 2026-10-24 | detail | `3` | AIKF e.V. Al Rahama Moschee (ChIJGRkjdxdXn0cRVg0xZt9d_3o) | `/ar/mosque/nuernberg/aikf-al-rahama-moschee` | `NEW_301` ✅ |
| 13 | `/de/moschee/leipzig/takva-moschee-camii-mosque3` | 2026-10-24 | detail | `3` | Takva Moschee Camii Mosque (ChIJQWDVKAD5pkcRZzJGnIIiy1Q) | `/de/moschee/leipzig/takva-moschee-camii-mosque` | `NEW_301` ✅ |
| 14 | `/de/moschee/hamburg/al-shafii-moschee4` | 2026-10-24 | detail | `4` | Al-Shafii Moschee (ChIJFz2yfgCPsUcR1065bBodYK8) | `/de/moschee/hamburg/al-shafii-moschee` | `NEW_301` ✅ |
| 15 | `/en/mosque/berlin/al-ummah-moschee3` | 2026-10-24 | detail | `3` | Al-Ummah Moschee (ChIJoVGAnBJPqEcRSupeU6wJDJg) | `/en/mosque/berlin/al-ummah-moschee` | `NEW_301` ✅ |
| 16 | `/ar/mosque/hamburg/assahaba-mosque4` | 2026-10-24 | detail | `4` | Assahaba Mosque (ChIJdc9Ttj-JsUcR-RNfCePBSEk) | `/ar/mosque/hamburg/assahaba-mosque` | `NEW_301` ✅ |
| 17 | `/en/mosque/leipzig/ditib-tuerkisch-islamische-gemeinde-zu-leipzig4` | 2026-10-24 | detail | `4` | DITIB-Türkisch islamische Gemeinde zu Leipzig e.V. (ChIJ-RAaZpj3pkcR9L8C7CeZMTg) | `/en/mosque/leipzig/ditib-tuerkisch-islamische-gemeinde-zu-leipzig` | `NEW_301` ✅ |
| 18 | `/en/mosque/stuttgart/landesverband-der-islamischen-kulturzentren-baden-wuerttemberg3` | 2026-10-24 | detail | `3` | Landesverband der Islamischen Kulturzentren Baden-Württemberg e. V. (ChIJxXuu4CDmC0ERBiGwqalYn50) | `/en/mosque/stuttgart/landesverband-der-islamischen-kulturzentren-baden-wuerttemberg` | `EXISTING_301` ✅ |
| 19 | `/en/mosque/munich/jamia-masjid-sufia-deutsch-pakistanischer-kulturverein-fuer-bildung-und-integration3` | 2026-10-24 | detail | `3` | Jamia Masjid Sufia Deutsch-Pakistanischer Kulturverein für Bildung und Integration e.V. (ChIJE4rULcF2nkcRfqyyCpWz0W0) | `/en/mosque/munich/jamia-masjid-sufia-deutsch-pakistanischer-kulturverein-fuer-bildung-und-integration` | `EXISTING_301` ✅ |
| 20 | `/ar/mosque/bremen/igmg-bremen-blumenthal4` | 2026-10-24 | detail | `4` | IGMG Bremen Blumenthal (ChIJNxADUXHTtkcRdKrnnBC-KWM) | `/ar/mosque/bremen/igmg-bremen-blumenthal` | `NEW_301` ✅ |
| 21 | `/ar/mosque/wuppertal/wuppertaler-integrations-und-bildunsgverein3` | 2026-10-24 | detail | `3` | Wuppertaler Integrations - und Bildunsgverein (ChIJxYF2n_nWuEcRQhY0h60aFq0) | `/ar/mosque/wuppertal/wuppertaler-integrations-und-bildunsgverein` | `NEW_301` ✅ |
| 22 | `/ar/mosque/muenchen/verein-der-zukunft3` | 2026-10-24 | detail | `3` | Verein der Zukunft (ChIJTXWDPKUKnkcRBmde08EnWkU) | `/ar/mosque/muenchen/verein-der-zukunft` | `NEW_301` ✅ |
| 23 | `/de/moschee/bremen/ditib-eyuep-sultan-bahce-moschee3` | 2026-10-24 | detail | `3` | DITIB Eyüp Sultan Bahce Moschee (ChIJw-vYTUbTtkcRFJBc1Ca2sH8) | `/de/moschee/bremen/ditib-eyuep-sultan-bahce-moschee` | `NEW_301` ✅ |
| 24 | `/ar/mosque/essen/ditib-landesverband-nordrhein-westfalen-regionalverband-essen4` | 2026-10-24 | detail | `4` | DITIB-Landesverband Nordrhein-Westfalen, Regionalverband Essen e.V. (ChIJWQjDGGDCuEcRnjaLL-oqmCc) | `/ar/mosque/essen/ditib-landesverband-nordrhein-westfalen-regionalverband-essen` | `NEW_301` ✅ |
| 25 | `/de/moschee/muenchen/aig-moschee-albanische-islamische-gemeinschaft-balkan4` | 2026-10-24 | detail | `4` | AIG Moschee – Albanische Islamische Gemeinschaft Balkan e.V. (ChIJs8LHBPt1nkcRCbW-bjW-eJg) | `/de/moschee/muenchen/aig-moschee-albanische-islamische-gemeinschaft-balkan` | `NEW_301` ✅ |
| 26 | `/ar/mosque/bonn/deutsch-bosniakisches-kulturzentrum-hajr3` | 2026-10-24 | detail | `3` | Deutsch Bosniakisches Kulturzentrum Hajr e. V. (ChIJE2mlN6bhvkcRPVvHkIJ_ppM) | `/ar/mosque/bonn/deutsch-bosniakisches-kulturzentrum-hajr` | `NEW_301` ✅ |
| 27 | `/ar/mosque/berlin/fatih-mosque3` | 2026-10-24 | detail | `3` | Fatih Mosque (ChIJGZMpgU1OqEcRpaiub8_5gLE) | `/ar/mosque/berlin/fatih-mosque` | `NEW_301` ✅ |
| 28 | `/en/mosque/berlin/kocatepe-mosque-ditib3` | 2026-10-24 | detail | `3` | Kocatepe Mosque - DITIB (ChIJ5ZT_U79WqEcRXJokqjb82O4) | `/en/mosque/berlin/kocatepe-mosque-ditib` | `NEW_301` ✅ |
| 29 | `/ar/mosque/hamburg/african-muslim-association3` | 2026-10-24 | detail | `3` | African Muslim Association e.V. (ChIJ2_ay8eiOsUcRBkAtAAWrLfE) | `/ar/mosque/hamburg/african-muslim-association` | `NEW_301` ✅ |
| 30 | `/de/moschee/hamburg/yeni-beyazit-moschee3` | 2026-10-24 | detail | `3` | Yeni Beyazit Moschee (ChIJm9x6bwCPsUcRIawDz8MZau8) | `/de/moschee/hamburg/yeni-beyazit-moschee` | `NEW_301` ✅ |
| 31 | `/de/moschee/essen/integration-und-bildungszentrum-essen4` | 2026-10-24 | detail | `4` | Integration und Bildungszentrum Essen e.V. (ChIJtzEekmXCuEcRjFHgBuY4X-Q) | `/de/moschee/essen/integration-und-bildungszentrum-essen` | `NEW_301` ✅ |
| 32 | `/ar/mosque/berlin/pakistanische-moschee3` | 2026-10-24 | detail | `3` | Pakistanische Moschee (ChIJeWHFMpxOqEcRSU6oTju9JGs) | `/ar/mosque/berlin/pakistanische-moschee` | `NEW_301` ✅ |
| 33 | `/ar/mosque/berlin/ayasofya-moschee3` | 2026-10-24 | detail | `3` | Ayasofya Moschee (ChIJdwQpf3RRqEcRkrM2HMOGxao) | `/ar/mosque/berlin/ayasofya-moschee` | `NEW_301` ✅ |
| 34 | `/de/moschee/muenchen/moschee-sufi-geylani4` | 2026-10-24 | detail | `4` | Moschee Sufi Geylani (ChIJv5yhYlx3nkcRZwFTL0OlToI) | `/de/moschee/muenchen/moschee-sufi-geylani` | `NEW_301` ✅ |
| 35 | `/ar/mosque/essen/abu-bakr-moschee4` | 2026-10-24 | detail | `4` | Abu Bakr Moschee (ChIJexjzDmjouEcR4hXnMR3Vbtk) | `/ar/mosque/essen/abu-bakr-moschee` | `NEW_301` ✅ |
| 36 | `/de/moschee/muenchen/jamia-masjid-sufia-deutsch-pakistanischer-kulturverein-fuer-bildung-und-integration3` | 2026-10-24 | detail | `3` | Jamia Masjid Sufia Deutsch-Pakistanischer Kulturverein für Bildung und Integration e.V. (ChIJE4rULcF2nkcRfqyyCpWz0W0) | `/de/moschee/muenchen/jamia-masjid-sufia-deutsch-pakistanischer-kulturverein-fuer-bildung-und-integration` | `NEW_301` ✅ |
| 37 | `/de/moschee/koeln/ditib-veysel-karani-moschee-koeln-chlodwigplatz4` | 2026-10-24 | detail | `4` | DITIB Veysel Karani Moschee Köln-Chlodwigplatz (ChIJwYM9xkckv0cRFQAzCh-KGh0) | `/de/moschee/koeln/ditib-veysel-karani-moschee-koeln-chlodwigplatz` | `NEW_301` ✅ |
| 38 | `/ar/mosque/wuppertal/al-nur-moschee4` | 2026-10-24 | detail | `4` | Al-Nur Moschee مسجد النور (ChIJnfSXbmnRuEcRhTrvN2UV8TQ) | `/ar/mosque/wuppertal/al-nur-moschee` | `NEW_301` ✅ |
| 39 | `/en/mosque/cologne/i-k-v-moschee4` | 2026-10-24 | detail | `4` | I.K.V Moschee (ChIJU_c70sslv0cRvdJhmmXT4yc) | `/en/mosque/cologne/i-k-v-moschee` | `NEW_301` ✅ |
| 40 | `/en/mosque/cologne/igmg-kuba-moschee4` | 2026-10-24 | detail | `4` | IGMG - Kuba Moschee (ChIJi-IanHcmv0cRiRH7hmgSQ4A) | `/en/mosque/cologne/igmg-kuba-moschee` | `NEW_301` ✅ |
| 41 | `/de/moschee/berlin/mimar-sinan-mosque3` | 2026-10-24 | detail | `3` | Mimar Sinan Mosque (ChIJ4e1f6pNPqEcR9YF6unerbUw) | `/de/moschee/berlin/mimar-sinan-mosque` | `NEW_301` ✅ |
| 42 | `/en/mosque/hamburg/kasri-sultan-dergah3` | 2026-10-24 | detail | `3` | Kasri Sultan Dergah e.V. (ChIJyWCebwCNsUcRPU_0fCBOqgs) | `/en/mosque/hamburg/kasri-sultan-dergah` | `NEW_301` ✅ |
| 43 | `/ar/mosque/muenchen/muenchner-forum-fuer-islam3` | 2026-10-24 | detail | `3` | Münchner Forum für Islam e.V. (ChIJA-E9lvV1nkcRYQZf4E8Ykl0) | `/ar/mosque/muenchen/muenchner-forum-fuer-islam` | `NEW_301` ✅ |
| 44 | `/de/moschee/frankfurt/bosniakisches-kulturzentrum3` | 2026-10-24 | detail | `3` | Bosniakisches Kulturzentrum e.V. (ChIJbZsGh_0LvUcR2Y5rhmoMfWI) | `/de/moschee/frankfurt/bosniakisches-kulturzentrum` | `NEW_301` ✅ |
| 45 | `/ar/mosque/hamburg/mevlana-mosque-hamburg-moschee3` | 2026-10-24 | detail | `3` | Mevlana Mosque Hamburg (Moschee) (ChIJW6EQuWuPsUcRXfjoZClL73g) | `/ar/mosque/hamburg/mevlana-mosque-hamburg-moschee` | `NEW_301` ✅ |
| 46 | `/en/mosque/munich/omar-moschee3` | 2026-10-24 | detail | `3` | Omar Moschee (ChIJr4f3kpfYnUcR_G6cU0IBFOo) | `/en/mosque/munich/omar-moschee` | `NEW_301` ✅ |
| 47 | `/de/moschee/berlin/ditib-rudow-moschee3` | 2026-10-24 | detail | `3` | DITIB Rudow Moschee (ChIJC9LIKQBHqEcRoZM_udP3Zqo) | `/de/moschee/berlin/ditib-rudow-moschee` | `NEW_301` ✅ |
| 48 | `/ar/mosque/muenchen/hasenberglhee3` | 2026-10-24 | detail | `3` | HasenberglHEE (ChIJ-xKXR7B2nkcRLf_29tBTEt4) | `/ar/mosque/muenchen/hasenberglhee` | `NEW_301` ✅ |
| 49 | `/de/moschee/berlin/yunus-emre-mosque-berlin3` | 2026-10-24 | detail | `3` | Yunus Emre Mosque Berlin (ChIJh3UStylSqEcRZ3tgsYMlGwA) | `/de/moschee/berlin/yunus-emre-mosque-berlin` | `NEW_301` ✅ |
| 50 | `/de/moschee/frankfurt/islamic-information-and-services-iis4` | 2026-10-24 | detail | `4` | Islamic Information and Services e.V. (IIS) (ChIJcb4x0FcJvUcR4oudg72Yq-A) | `/de/moschee/frankfurt/islamic-information-and-services-iis` | `NEW_301` ✅ |
| 51 | `/en/mosque/frankfurt/hassan-moschee3` | 2026-10-24 | detail | `3` | Hassan Moschee (ChIJRdUu3sCgvUcRzSPa7v9UCEQ) | `/en/mosque/frankfurt/hassan-moschee` | `NEW_301` ✅ |
| 52 | `/ar/mosque/berlin/orhan-gazi-moschee-d-t-b-berlin3` | 2026-10-24 | detail | `3` | Orhan Gazi Moschee – DİTİB Berlin (ChIJ___vHyxQqEcR9rgn8HdieWU) | `/ar/mosque/berlin/orhan-gazi-moschee-d-t-b-berlin` | `NEW_301` ✅ |
| 53 | `/en/mosque/munich/bulgarisch-muslimischer-kultur-und-sozialverein-osmanpazar3` | 2026-10-24 | detail | `3` | Bulgarisch-Muslimischer Kultur und Sozialverein e.V Osmanpazarı (ChIJt9jJagB3nkcRIqMiQ0PIxP0) | `/en/mosque/munich/bulgarisch-muslimischer-kultur-und-sozialverein-osmanpazar` | `NEW_301` ✅ |
| 54 | `/de/moschee/berlin/teiba3` | 2026-10-24 | detail | `3` | Teiba (ChIJm4baHjBWqEcRVWuD6FxXHwQ) | `/de/moschee/berlin/teiba` | `NEW_301` ✅ |
| 55 | `/ar/mosque/berlin/semerkand-moschee3` | 2026-10-24 | detail | `3` | Semerkand Moschee (ChIJK5nUx0tQqEcRMFVmd1kS69o) | `/ar/mosque/berlin/semerkand-moschee` | `NEW_301` ✅ |
| 56 | `/ar/mosque/dortmund/al-fath-moschee-camii3` | 2026-10-24 | detail | `3` | Al-Fath Moschee ( Camii.) (ChIJvXAmd_oZuUcROUFEvqStu2E) | `/ar/mosque/dortmund/al-fath-moschee-camii` | `NEW_301` ✅ |
| 57 | `/ar/mosque/dortmund/al-anwar-mochee3` | 2026-10-24 | detail | `3` | Al-Anwar Mochee (ChIJf2e8EPAZuUcRs9__nvbqRfU) | `/ar/mosque/dortmund/al-anwar-mochee` | `NEW_301` ✅ |
| 58 | `/de/moschee/dortmund/ali-moschee3` | 2026-10-24 | detail | `3` | Ali Moschee - مسجد علي (ChIJL-2ClPwZuUcRwt_c5wSgW4k) | `/de/moschee/dortmund/ali-moschee` | `NEW_301` ✅ |
| 59 | `/de/moschee/dortmund/mesjid-ikre3` | 2026-10-24 | detail | `3` | Mesjid Ikre (ChIJB5b3dwAZuUcRNGWN_8ZklQ4) | `/de/moschee/dortmund/mesjid-ikre` | `NEW_301` ✅ |
| 60 | `/ar/mosque/berlin/zeituna-mosque3` | 2026-10-24 | detail | `3` | Zeituna Mosque (ChIJ37rYLSpRqEcRSM420rZ-QW4) | `/ar/mosque/berlin/zeituna-mosque` | `NEW_301` ✅ |
| 61 | `/ar/mosque/berlin/omar-mosche3` | 2026-10-24 | detail | `3` | Omar Mosche - مسجد عُمر (ChIJPVluYjVOqEcRZ1IzmSCONbk) | `/ar/mosque/berlin/omar-mosche` | `NEW_301` ✅ |
| 62 | `/ar/mosque/wuppertal/wuppertal-central-mosque3` | 2026-10-24 | detail | `3` | Wuppertal Central Mosque (ChIJCQqnKNjXuEcRgXthIj6I1to) | `/ar/mosque/wuppertal/wuppertal-central-mosque` | `NEW_301` ✅ |
| 63 | `/en/mosque/frankfurt/bildungs-und-kulturverein-hoechst3` | 2026-10-24 | detail | `3` | Bildungs-und Kulturverein Höchst (ChIJ5XANfKOgvUcR07o5bXJyEK4) | `/en/mosque/frankfurt/bildungs-und-kulturverein-hoechst` | `NEW_301` ✅ |
| 64 | `/ar/mosque/wuppertal/msjd-altwhyd4` | 2026-10-24 | detail | `4` | مسجد التوحيد (ChIJOdm1KrnXuEcRbAVyUM0JeNk) | `/ar/mosque/wuppertal/msjd-altwhyd` | `NEW_301` ✅ |
| 65 | `/ar/mosque/wuppertal/abu-bakr-alsedek-moschee3` | 2026-10-24 | detail | `3` | Abu Bakr Alsedek Moschee (ChIJR8gr-t7XuEcRe540v7Ye994) | `/ar/mosque/wuppertal/abu-bakr-alsedek-moschee` | `NEW_301` ✅ |
| 66 | `/de/moschee/hamburg/islamische-gemeinde-eidelstedt3` | 2026-10-24 | detail | `3` | Islamische Gemeinde Eidelstedt e.v. (ChIJJQ3uc4qGsUcRTvz8LmUqVmg) | `/de/moschee/hamburg/islamische-gemeinde-eidelstedt` | `NEW_301` ✅ |
| 67 | `/de/moschee/muenchen/turkish-mosque-23` | 2026-10-24 | detail | `3` | Turkish mosque (ChIJcZH7sTDXnUcRPuF4gyxNdig) | `/de/moschee/muenchen/turkish-mosque-2` | `NEW_301` ✅ |
| 68 | `/de/moschee/wuppertal/wuppertal-d-t-b-barmen-fatih-camii3` | 2026-10-24 | detail | `3` | WUPPERTAL DİTİB BARMEN FATIH CAMii (ChIJt4xA31O4cUERw61UnJB9T_w) | `/de/moschee/wuppertal/wuppertal-d-t-b-barmen-fatih-camii` | `NEW_301` ✅ |
| 69 | `/en/mosque/leipzig/al-rahman-mosque3` | 2026-10-24 | detail | `3` | Al Rahman Mosque (ChIJK2clbxv4pkcRKerKRAyClBE) | `/en/mosque/leipzig/al-rahman-mosque` | `NEW_301` ✅ |
| 70 | `/ar/mosque/bremen/bangladesch-moschee4` | 2026-10-24 | detail | `4` | Bangladesch Moschee (ChIJf_pKHgDXsEcR1lNyuRZo9eg) | `/ar/mosque/bremen/bangladesch-moschee` | `NEW_301` ✅ |
| 71 | `/ar/mosque/frankfurt/ditib-tuerkisch-islamische-gemeinde-zu-frankfurt-bonames3` | 2026-10-24 | detail | `3` | DITIB - Türkisch Islamische Gemeinde zu Frankfurt-Bonames e.V. (ChIJ5ch7Hp8IvUcRS8sOHD20Yy8) | `/ar/mosque/frankfurt/ditib-tuerkisch-islamische-gemeinde-zu-frankfurt-bonames` | `NEW_301` ✅ |
| 72 | `/de/moschee/bonn/bonn-central-mosque3` | 2026-10-24 | detail | `3` | Bonn Central Mosque (ChIJoVbKqL3hvkcRj7lIFfiV_7k) | `/de/moschee/bonn/bonn-central-mosque` | `NEW_301` ✅ |
| 73 | `/en/mosque/nuremberg/msjd-nwrmbwrgh3` | 2026-10-24 | detail | `3` | مسجد نورمبورغ (ChIJkbrSbgBXn0cRgf_WxVNBNfI) | `/en/mosque/nuremberg/msjd-nwrmbwrgh` | `NEW_301` ✅ |
| 74 | `/de/moschee/bremen/masjid-ar-rahma-moschee3` | 2026-10-24 | detail | `3` | Masjid Ar-Rahma Moschee (ChIJtbk-fqQpsUcRmu4ZB85YcQw) | `/de/moschee/bremen/masjid-ar-rahma-moschee` | `NEW_301` ✅ |
| 75 | `/de/moschee/wuppertal/igmg-yunus-emre-moschee3` | 2026-10-24 | detail | `3` | IGMG Yunus Emre Moschee (ChIJqYwgWSLXuEcRomB6zUwUWps) | `/de/moschee/wuppertal/igmg-yunus-emre-moschee` | `NEW_301` ✅ |
| 76 | `/ar/mosque/frankfurt/islamischer-kulturverein-as-salam-moschee-frankfurt3` | 2026-10-24 | detail | `3` | Islamischer Kulturverein As-Salam Moschee Frankfurt (ChIJ6-hEef0JvUcRS-xxA9RmA1w) | `/ar/mosque/frankfurt/islamischer-kulturverein-as-salam-moschee-frankfurt` | `NEW_301` ✅ |
| 77 | `/ar/mosque/dortmund/ulu-cami3` | 2026-10-24 | detail | `3` | Ulu Cami (ChIJ12i3_aYQuUcRDRKw9jP9WBQ) | `/ar/mosque/dortmund/ulu-cami` | `NEW_301` ✅ |
| 78 | `/ar/mosque/stuttgart/zuffenhause-mosqu4` | 2026-10-24 | detail | `4` | Zuffenhause Mosqu, Мечеть,Мечит. (ChIJZ_DBZynpC0ERZmUZ5H_aE_c) | `/ar/mosque/stuttgart/zuffenhause-mosqu` | `NEW_301` ✅ |
| 79 | `/ar/mosque/dortmund/ditib-ayasofya-moschee-scharnhorst4` | 2026-10-24 | detail | `4` | DITIB Ayasofya Moschee Scharnhorst (ChIJXcAJrdsQuUcRX3c9x8oJ184) | `/ar/mosque/dortmund/ditib-ayasofya-moschee-scharnhorst` | `NEW_301` ✅ |
| 80 | `/ar/mosque/duesseldorf/masjid-omar3` | 2026-10-24 | detail | `3` | MASJID OMAR (ChIJCXlkWTfKuEcROMMraLCqjOY) | `/ar/mosque/duesseldorf/masjid-omar` | `NEW_301` ✅ |
| 81 | `/de/moschee/bremen/ditib-mevlana-moschee-bremen4` | 2026-10-24 | detail | `4` | DITIB Mevlana-Moschee Bremen (ChIJE3QeUwopsUcRiX3YAqsLR9s) | `/de/moschee/bremen/ditib-mevlana-moschee-bremen` | `NEW_301` ✅ |
| 82 | `/ar/mosque/dortmund/kocatepe-mosque-dortmund3` | 2026-10-24 | detail | `3` | Kocatepe Mosque Dortmund (ChIJIWWcXFIXuUcRcCyULPg2mco) | `/ar/mosque/dortmund/kocatepe-mosque-dortmund` | `NEW_301` ✅ |
| 83 | `/de/moschee/dortmund/msjd-amr-bn-alkhtab3` | 2026-10-24 | detail | `3` | مسجد عمر بن الخطاب (ChIJc23kQE0XuUcReqLqHlE2wE0) | `/de/moschee/dortmund/msjd-amr-bn-alkhtab` | `NEW_301` ✅ |
| 84 | `/ar/mosque/dortmund/vikz-camii-moschee3` | 2026-10-24 | detail | `3` | VIKZ Camii - Moschee - مسجد (ChIJoY-hKQAbuUcR3YwmNB7u01g) | `/ar/mosque/dortmund/vikz-camii-moschee` | `NEW_301` ✅ |
| 85 | `/ar/mosque/dortmund/assunaa-moschee3` | 2026-10-24 | detail | `3` | Assunaa Moschee (ChIJfWGtbo0WuUcRHzFs7AnD0O0) | `/ar/mosque/dortmund/assunaa-moschee` | `NEW_301` ✅ |
| 86 | `/ar/mosque/duesseldorf/moschee3` | 2026-10-24 | detail | `3` | Масджид Ал-Уадуд (ChIJMcEXtm_LuEcRVisN7XbQpAY) | `/ar/mosque/duesseldorf/moschee` | `NEW_301` ✅ |
| 87 | `/ar/mosque/dortmund/assahabah-mosque3` | 2026-10-24 | detail | `3` | Assahabah Mosque (ChIJ7yZg6iEZuUcRJ-dai9t0-Rk) | `/ar/mosque/dortmund/assahabah-mosque` | `NEW_301` ✅ |
| 88 | `/ar/mosque/duesseldorf/prayer-room-masjid4` | 2026-10-24 | detail | `4` | Prayer room (Masjid) (ChIJI3Q-TwC3uEcRF9-zo6lib2A) | `/ar/mosque/duesseldorf/prayer-room-masjid` | `NEW_301` ✅ |
| 89 | `/ar/mosque/duesseldorf/bosnian-islamic-cultural-center-of-dusseldorf3` | 2026-10-24 | detail | `3` | Bosnian Islamic Cultural Center of Dusseldorf (ChIJd_iFR2nKuEcRk0e6ljWSaak) | `/ar/mosque/duesseldorf/bosnian-islamic-cultural-center-of-dusseldorf` | `NEW_301` ✅ |
| 90 | `/ar/mosque/duesseldorf/moschee-mosque3` | 2026-10-24 | detail | `3` | Moschee Mosque (ChIJ8TU3MOXLuEcR0giAN_QqUxM) | `/ar/mosque/duesseldorf/moschee-mosque` | `NEW_301` ✅ |
| 91 | `/ar/mosque/dortmund/islamisches-zentrum3` | 2026-10-24 | detail | `3` | Islamisches Zentrum (ChIJjy2I_KYQuUcRx9CLiDbjvC0) | `/ar/mosque/dortmund/islamisches-zentrum` | `NEW_301` ✅ |
| 92 | `/ar/mosque/dortmund/mevlana-camii3` | 2026-10-24 | detail | `3` | Mevlana Camii (ChIJsZXBW4kbuUcR0_Wgm9IO2Wg) | `/ar/mosque/dortmund/mevlana-camii` | `NEW_301` ✅ |
| 93 | `/ar/mosque/dortmund/msjd-nwr-alhda3` | 2026-10-24 | detail | `3` | مسجد نور الهدى (ChIJQ756lbgRuUcRcZSzT98f9o8) | `/ar/mosque/dortmund/msjd-nwr-alhda` | `NEW_301` ✅ |
| 94 | `/ar/mosque/duesseldorf/masjid-assalam3` | 2026-10-24 | detail | `3` | Masjid Assalam (ChIJpYU-xZnMuEcRJRT6rYoDLOk) | `/ar/mosque/duesseldorf/masjid-assalam` | `NEW_301` ✅ |
| 95 | `/ar/mosque/dortmund/yunus-emre-moschee3` | 2026-10-24 | detail | `3` | Yunus-Emre-Moschee (ChIJTchDTo0buUcRPqCxKQBT07w) | `/ar/mosque/dortmund/yunus-emre-moschee` | `NEW_301` ✅ |
| 96 | `/ar/mosque/dortmund/igmg-ortsverein-derne4` | 2026-10-24 | detail | `4` | IGMG Ortsverein Derne e.V (ChIJU_0W7PgQuUcRCFb1fua9_i0) | `/ar/mosque/dortmund/igmg-ortsverein-derne` | `NEW_301` ✅ |
| 97 | `/ar/mosque/muenchen/afghani-mosque3` | 2026-10-24 | detail | `3` | Afghani mosque (ChIJq6ravibZnUcRSO-2mibl838) | `/ar/mosque/muenchen/afghani-mosque` | `NEW_301` ✅ |
| 98 | `/ar/mosque/dortmund/alsahaba-moschee3` | 2026-10-24 | detail | `3` | Alsahaba Moschee مسجد الصحابة (ChIJU_mHDAAbuUcRriotNIIGXGM) | `/ar/mosque/dortmund/alsahaba-moschee` | `NEW_301` ✅ |
| 99 | `/de/moschee/bremen/masjid-al-sunnah-bremen3` | 2026-10-24 | detail | `3` | Masjid Al Sunnah Bremen مسجد السنة بريمن (ChIJ0YH-ggjXsEcRUIRcKdAvm4E) | `/de/moschee/bremen/masjid-al-sunnah-bremen` | `NEW_301` ✅ |
| 100 | `/ar/mosque/duesseldorf/dituria3` | 2026-10-24 | detail | `3` | Dituria e.V. (ChIJnQmkn-jJuEcR5eSumbANWdU) | `/ar/mosque/duesseldorf/dituria` | `NEW_301` ✅ |
| 101 | `/ar/mosque/bonn/fatih-moschee4` | 2026-10-24 | detail | `4` | Fatih-Moschee (ChIJ9x65OmnkvkcRjtLltZy3iEw) | `/ar/mosque/bonn/fatih-moschee` | `NEW_301` ✅ |
| 102 | `/ar/mosque/duesseldorf/ditib-tuerkisch-islamische-gemeinde-zu-duesseldorf-eller3` | 2026-10-24 | detail | `3` | DITIB-Türkisch Islamische Gemeinde zu Düsseldorf-Eller e.V (ChIJwYq2iY7LuEcRJgpU4vQg88c) | `/ar/mosque/duesseldorf/ditib-tuerkisch-islamische-gemeinde-zu-duesseldorf-eller` | `NEW_301` ✅ |
| 103 | `/de/moschee/muenchen/islamische-gemeinschaft-fedzr-muenchen3` | 2026-10-24 | detail | `3` | Islamische Gemeinschaft Fedzr München (ChIJET1ACBjZnUcR2_zQ3Ir_FR4) | `/de/moschee/muenchen/islamische-gemeinschaft-fedzr-muenchen` | `NEW_301` ✅ |
| 104 | `/ar/mosque/essen/integration-und-bildungszentrum-essen4` | 2026-10-24 | detail | `4` | Integration und Bildungszentrum Essen e.V. (ChIJtzEekmXCuEcRjFHgBuY4X-Q) | `/ar/mosque/essen/integration-und-bildungszentrum-essen` | `NEW_301` ✅ |
| 105 | `/ar/mosque/duesseldorf/bayan-kulturzentrum-bkz3` | 2026-10-24 | detail | `3` | Bayan Kulturzentrum (BKZ) e.V. (ChIJs2_bVADLuEcR6JDTUNvZJh8) | `/ar/mosque/duesseldorf/bayan-kulturzentrum-bkz` | `NEW_301` ✅ |
| 106 | `/ar/mosque/muenchen/islamische-gemeinschaft-tevhid4` | 2026-10-24 | detail | `4` | Islamische Gemeinschaft Tevhid e.V. (ChIJw6OvoGl2nkcRXB7_bEpAWuI) | `/ar/mosque/muenchen/islamische-gemeinschaft-tevhid` | `NEW_301` ✅ |
| 107 | `/en/mosque/munich/turkish-mosque-23` | 2026-10-24 | detail | `3` | Turkish mosque (ChIJcZH7sTDXnUcRPuF4gyxNdig) | `/en/mosque/munich/turkish-mosque-2` | `NEW_301` ✅ |
| 108 | `/de/moschee/berlin/zeituna-mosque3` | 2026-10-24 | detail | `3` | Zeituna Mosque (ChIJ37rYLSpRqEcRSM420rZ-QW4) | `/de/moschee/berlin/zeituna-mosque` | `NEW_301` ✅ |
| 109 | `/de/moschee/hamburg/wandsbek-tuerkisch-islamischer-kulturverein4` | 2026-10-24 | detail | `4` | Wandsbek Türkisch-Islamischer Kulturverein e.V. (ChIJZ4VnnTWJsUcRqfdJXVDGm4A) | `/de/moschee/hamburg/wandsbek-tuerkisch-islamischer-kulturverein` | `NEW_301` ✅ |
| 110 | `/en/mosque/dortmund/islamisches-kulturzentrum-der-bosniaken-sand-ak3` | 2026-10-24 | detail | `3` | Islamisches Kulturzentrum der Bosniaken - Sandžak e. V. (ChIJbTF3lVUXuUcRNMGY-ddcNzg) | `/en/mosque/dortmund/islamisches-kulturzentrum-der-bosniaken-sand-ak` | `NEW_301` ✅ |
| 111 | `/de/moschee/bremen/hicret-moschee4` | 2026-10-24 | detail | `4` | Hicret Moschee (ChIJ8fl9FwDZsEcRnen9r9CT1ds) | `/de/moschee/bremen/hicret-moschee` | `NEW_301` ✅ |
| 112 | `/de/moschee/dortmund/msjd-nwr-alhda3` | 2026-10-24 | detail | `3` | مسجد نور الهدى (ChIJQ756lbgRuUcRcZSzT98f9o8) | `/de/moschee/dortmund/msjd-nwr-alhda` | `NEW_301` ✅ |
| 113 | `/en/mosque/hamburg/baitur-rasheed-mosque3` | 2026-10-24 | detail | `3` | Baitur Rasheed Mosque (ChIJ2wEPjh2HsUcRyhim0kg23EY) | `/en/mosque/hamburg/baitur-rasheed-mosque` | `NEW_301` ✅ |
| 114 | `/en/mosque/bremen/bangladesch-islamisches-zentrum3` | 2026-10-24 | detail | `3` | Bangladesch Islamisches Zentrum (ChIJB5vM2PLXsEcRTzeXCPuxPfM) | `/en/mosque/bremen/bangladesch-islamisches-zentrum` | `NEW_301` ✅ |
| 115 | `/en/mosque/dortmund/msjd-alamam-malk3` | 2026-10-24 | detail | `3` | مسجد الامام مالك (ChIJN0MCC_4ZuUcR3DWuzK6jgxk) | `/en/mosque/dortmund/msjd-alamam-malk` | `NEW_301` ✅ |
| 116 | `/ar/mosque/berlin/familienberatung-haus-der-weisheit3` | 2026-10-24 | detail | `3` | Familienberatung Haus der Weisheit دار الحكمة (ChIJXQ_BP59RqEcRYNlQ2yQu5pY) | `/ar/mosque/berlin/familienberatung-haus-der-weisheit` | `NEW_301` ✅ |
| 117 | `/en/mosque/frankfurt/yunus-emre-mosque3` | 2026-10-24 | detail | `3` | Yunus Emre Mosque (ChIJ_0Ww7DYKvUcRo0JkQvoyn_U) | `/en/mosque/frankfurt/yunus-emre-mosque` | `NEW_301` ✅ |
| 118 | `/en/mosque/wuppertal/igmg-yunus-emre-moschee3` | 2026-10-24 | detail | `3` | IGMG Yunus Emre Moschee (ChIJqYwgWSLXuEcRomB6zUwUWps) | `/en/mosque/wuppertal/igmg-yunus-emre-moschee` | `NEW_301` ✅ |
| 119 | `/de/moschee/duesseldorf/moschee3` | 2026-10-24 | detail | `3` | Масджид Ал-Уадуд (ChIJMcEXtm_LuEcRVisN7XbQpAY) | `/de/moschee/duesseldorf/moschee` | `NEW_301` ✅ |
| 120 | `/en/mosque/berlin/msjd-alfrqan3` | 2026-10-24 | detail | `3` | مسجد الفرقان (ChIJP1EhIMJPqEcRWczYOqjYbhw) | `/en/mosque/berlin/msjd-alfrqan` | `NEW_301` ✅ |
| 121 | `/en/mosque/berlin/fatih-mosque3` | 2026-10-24 | detail | `3` | Fatih Mosque (ChIJGZMpgU1OqEcRpaiub8_5gLE) | `/en/mosque/berlin/fatih-mosque` | `NEW_301` ✅ |
| 122 | `/ar/mosque/berlin/arresalah-mosque3` | 2026-10-24 | detail | `3` | Arresalah Mosque (ChIJmwWL6zBRqEcRY1S-KePN-64) | `/ar/mosque/berlin/arresalah-mosque` | `NEW_301` ✅ |
| 123 | `/en/mosque/dortmund/ali-moschee3` | 2026-10-24 | detail | `3` | Ali Moschee - مسجد علي (ChIJL-2ClPwZuUcRwt_c5wSgW4k) | `/en/mosque/dortmund/ali-moschee` | `NEW_301` ✅ |
| 124 | `/de/moschee/nuernberg/nuernberg-tuerk-oca3` | 2026-10-24 | detail | `3` | Nürnberg Türk Ocağı (ChIJwzbRnwRXn0cRI9l70Yj1sis) | `/de/moschee/nuernberg/nuernberg-tuerk-oca` | `NEW_301` ✅ |
| 125 | `/de/moschee/berlin/isa-beu-moschee-albanisch-islamisches-gemeinde-und-kulturzentrum4` | 2026-10-24 | detail | `4` | Isa Beu Moschee e.V. Albanisch-Islamisches Gemeinde- und Kulturzentrum (ChIJL6vGmW8jZUER0ahRRcPc_64) | `/de/moschee/berlin/isa-beu-moschee-albanisch-islamisches-gemeinde-und-kulturzentrum` | `NEW_301` ✅ |
| 126 | `/de/moschee/essen/moschee-al-taqua4` | 2026-10-24 | detail | `4` | Moschee Al Taqua (ChIJWbujxUzDuEcRSDxIx7SuHQ0) | `/de/moschee/essen/moschee-al-taqua` | `NEW_301` ✅ |
| 127 | `/en/mosque/dortmund/msjd-nwr-alhda3` | 2026-10-24 | detail | `3` | مسجد نور الهدى (ChIJQ756lbgRuUcRcZSzT98f9o8) | `/en/mosque/dortmund/msjd-nwr-alhda` | `NEW_301` ✅ |
| 128 | `/ar/mosque/berlin/aziziye-mosque4` | 2026-10-24 | detail | `4` | Aziziye Mosque (ChIJwTAYMo1FqEcRD_XFjcrnUdU) | `/ar/mosque/berlin/aziziye-mosque` | `NEW_301` ✅ |
| 129 | `/ar/mosque/berlin/afghan-mosque3` | 2026-10-24 | detail | `3` | Afghan Mosque (ChIJ62EGOABPqEcR0Kh9XalZJ3I) | `/ar/mosque/berlin/afghan-mosque` | `NEW_301` ✅ |
| 130 | `/en/mosque/frankfurt/hamidiye-mosque3` | 2026-10-24 | detail | `3` | Hamidiye Mosque (ChIJSWTRnaEOvUcRxC1ADmo9ajY) | `/en/mosque/frankfurt/hamidiye-mosque` | `NEW_301` ✅ |
| 131 | `/en/mosque/berlin/islamic-culture-u-education-center4` | 2026-10-24 | detail | `4` | Islamic culture u. education center (ChIJPfVUf6ZPqEcRBz2SIe9aGWA) | `/en/mosque/berlin/islamic-culture-u-education-center` | `NEW_301` ✅ |
| 132 | `/de/moschee/muenchen/balkan3` | 2026-10-24 | detail | `3` | Balkan e.V. (ChIJJ_2GAwB1nkcRWu8k17qTptA) | `/de/moschee/muenchen/balkan` | `NEW_301` ✅ |
| 133 | `/en/mosque/berlin/minhaj-ul-quran-international-moschee3` | 2026-10-24 | detail | `3` | Minhaj-ul-Quran International Moschee (ChIJH1fI9dZTqEcRaUUEgrxPNXs) | `/en/mosque/berlin/minhaj-ul-quran-international-moschee` | `NEW_301` ✅ |
| 134 | `/ar/mosque/frankfurt/mevlana-moschee-u-kulturverein4` | 2026-10-24 | detail | `4` | Mevlana Moschee u. Kulturverein e.V.. (ChIJEduKmbwLvUcRx1wrHxaQxhs) | `/ar/mosque/frankfurt/mevlana-moschee-u-kulturverein` | `NEW_301` ✅ |
| 135 | `/de/moschee/stuttgart/ak-emsettin-mosque-turkish-national-cultural-association-stuttgart3` | 2026-10-24 | detail | `3` | Akşemsettin Mosque – Turkish National Cultural Association Stuttgart (ChIJuYQW1hzFmUcRf_mm0qctoMA) | `/de/moschee/stuttgart/ak-emsettin-mosque-turkish-national-cultural-association-stuttgart` | `NEW_301` ✅ |
| 136 | `/de/moschee/berlin/ditib-kocasinan-tuerkisch-islamische-gemeinde-zu-reinickendorf4` | 2026-10-24 | detail | `4` | DITIB-Kocasinan Türkisch-Islamische Gemeinde zu Reinickendorf e. V. (ChIJVVVFYjRSqEcRDrclS95J3aU) | `/de/moschee/berlin/ditib-kocasinan-tuerkisch-islamische-gemeinde-zu-reinickendorf` | `NEW_301` ✅ |
| 137 | `/ar/mosque/berlin/bosniakisches-kulturzentrum-sabur3` | 2026-10-24 | detail | `3` | Bosniakisches Kulturzentrum Sabur e.V. (ChIJnxt5bdBRqEcRyR08u3IvV8I) | `/ar/mosque/berlin/bosniakisches-kulturzentrum-sabur` | `NEW_301` ✅ |
| 138 | `/en/mosque/bremen/bikz-bremen-walle-moschee-camii3` | 2026-10-24 | detail | `3` | BIKZ Bremen e. V. - Walle Moschee (Camii) (ChIJE5yqdi8psUcRGS9sVQX-ee8) | `/en/mosque/bremen/bikz-bremen-walle-moschee-camii` | `NEW_301` ✅ |
| 139 | `/de/moschee/nuernberg/bait-ur-rahman-mosque3` | 2026-10-24 | detail | `3` | Bait-ur-Rahman Mosque (ChIJ-0gi4g5Xn0cRT71CsvrRRX8) | `/de/moschee/nuernberg/bait-ur-rahman-mosque` | `NEW_301` ✅ |
| 140 | `/ar/mosques/muenchen2` | 2026-10-24 | city | `2` | München | `/ar/mosques/muenchen` | `NEW_301` ✅ |
| 141 | `/en/mosque/duesseldorf/moschee-mosque3` | 2026-10-24 | detail | `3` | Moschee Mosque (ChIJ8TU3MOXLuEcR0giAN_QqUxM) | `/en/mosque/duesseldorf/moschee-mosque` | `NEW_301` ✅ |
| 142 | `/en/mosques/hamburg2` | 2026-10-24 | city | `2` | Hamburg | `/en/mosques/hamburg` | `NEW_301` ✅ |
| 143 | `/ar/mosque/berlin/hasan-basri-moschee3` | 2026-10-24 | detail | `3` | Hasan Basri Moschee (ChIJv3kxTR1RqEcRosmmdjJ9JoQ) | `/ar/mosque/berlin/hasan-basri-moschee` | `NEW_301` ✅ |
| 144 | `/en/mosque/dortmund/massjid-ar-rahman4` | 2026-10-24 | detail | `4` | Massjid Ar 'Rahman (ChIJOepa9gAXuUcRLV9ePInYSz0) | `/en/mosque/dortmund/massjid-ar-rahman` | `NEW_301` ✅ |
| 145 | `/en/mosque/munich/ditib-tuerkische-islamische-gemeinde-zu-muenchen3` | 2026-10-24 | detail | `3` | DITIB - Türkische Islamische Gemeinde zu München e.V (ChIJrS3fOAbYnUcR0RVEjwgOieQ) | `/en/mosque/munich/ditib-tuerkische-islamische-gemeinde-zu-muenchen` | `NEW_301` ✅ |
| 146 | `/en/mosque/munich/gebetsraum-riem-arcaden3` | 2026-10-24 | detail | `3` | Gebetsraum Riem Arcaden (ChIJqfkRPQALnkcRTD2K61Ehmlo) | `/en/mosque/munich/gebetsraum-riem-arcaden` | `NEW_301` ✅ |
| 147 | `/en/mosque/cologne/moschee-nippes4` | 2026-10-24 | detail | `4` | Moschee Nippes (ChIJX023MXklv0cRznTaPkBpxOo) | `/en/mosque/cologne/moschee-nippes` | `NEW_301` ✅ |
| 148 | `/en/mosque/munich/verein-der-kulturen3` | 2026-10-24 | detail | `3` | Verein der Kulturen e.V. (ChIJIfakyYYLnkcR0QLO38SChdo) | `/en/mosque/munich/verein-der-kulturen` | `NEW_301` ✅ |
| 149 | `/en/mosque/dortmund/yunus-emre-moschee3` | 2026-10-24 | detail | `3` | Yunus-Emre-Moschee (ChIJTchDTo0buUcRPqCxKQBT07w) | `/en/mosque/dortmund/yunus-emre-moschee` | `NEW_301` ✅ |
| 150 | `/ar/mosque/essen/alfarouq-moschee3` | 2026-10-24 | detail | `3` | Alfarouq Moschee (ChIJfURbbqHCuEcRPa5ZIdHKuPU) | `/ar/mosque/essen/alfarouq-moschee` | `NEW_301` ✅ |
| 151 | `/ar/mosque/muenchen/masjid-on-5th-floor-oberpollinger3` | 2026-10-24 | detail | `3` | Masjid on 5th floor Oberpollinger (ChIJFec_6lN1nkcRUlidXpqiamI) | `/ar/mosque/muenchen/masjid-on-5th-floor-oberpollinger` | `NEW_301` ✅ |
| 152 | `/ar/mosque/muenchen/omar-moschee3` | 2026-10-24 | detail | `3` | Omar Moschee (ChIJr4f3kpfYnUcR_G6cU0IBFOo) | `/ar/mosque/muenchen/omar-moschee` | `NEW_301` ✅ |
| 153 | `/de/moschee/muenchen/moschee-vikz-muenchen4` | 2026-10-24 | detail | `4` | Moschee VIKZ München (ChIJjw6x3XzYnUcRUrUZzcPnl4c) | `/de/moschee/muenchen/moschee-vikz-muenchen` | `NEW_301` ✅ |
| 154 | `/ar/mosque/bremen/schura-islamische-religionsgemeinschaft-bremen4` | 2026-10-24 | detail | `4` | SCHURA - Islamische Religionsgemeinschaft Bremen e.V. (ChIJt30YfAwpsUcR3TxLwqPgbgQ) | `/ar/mosque/bremen/schura-islamische-religionsgemeinschaft-bremen` | `NEW_301` ✅ |
| 155 | `/en/mosque/cologne/awaisiah-moschee-dpvk4` | 2026-10-24 | detail | `4` | Awaisiah Moschee DPVK (ChIJTzOGOwAnv0cR1JTrEt9WFJw) | `/en/mosque/cologne/awaisiah-moschee-dpvk` | `NEW_301` ✅ |
| 156 | `/en/mosque/bonn/bonn-central-mosque3` | 2026-10-24 | detail | `3` | Bonn Central Mosque (ChIJoVbKqL3hvkcRj7lIFfiV_7k) | `/en/mosque/bonn/bonn-central-mosque` | `NEW_301` ✅ |
| 157 | `/ar1` | 2026-10-24 | home | `1` | Root Locale | `/ar` | `NEW_301` ✅ |
| 158 | `/en/mosque/frankfurt/ditib-eyuep-sultan-moschee-in-frankfurt-hoechst3` | 2026-10-23 | detail | `3` | DITIB Eyüp Sultan Moschee in Frankfurt-Höchst (ChIJp1pMXqSgvUcRB3HWz_foV1c) | `/en/mosque/frankfurt/ditib-eyuep-sultan-moschee-in-frankfurt-hoechst` | `NEW_301` ✅ |
| 159 | `/ar/mosque/dortmund/ditib-tuerkisch-islamische-gemeinde-zu-dortmund-hombruch3` | 2026-10-23 | detail | `3` | DITIB Türkisch Islamische Gemeinde zu Dortmund-Hombruch e.V. (ChIJAz51ydIZuUcRirdffxpAdgU) | `/ar/mosque/dortmund/ditib-tuerkisch-islamische-gemeinde-zu-dortmund-hombruch` | `NEW_301` ✅ |
| 160 | `/de/moschee/dortmund/albanischer-islamischer-kultuverein-furkan3` | 2026-10-23 | detail | `3` | Albanischer Islamischer Kultuverein Furkan (ChIJM-Aa0lMXuUcRe0dyJNZZ-ok) | `/de/moschee/dortmund/albanischer-islamischer-kultuverein-furkan` | `NEW_301` ✅ |
| 161 | `/de/moschee/hamburg/yeni-ayasofya-camii-islamische-gemeinde-wilhelmsburg3` | 2026-10-23 | detail | `3` | Yeni Ayasofya Camii islamische Gemeinde Wilhelmsburg (ChIJY5Dw_hqPsUcRbGtkrIRFTXs) | `/de/moschee/hamburg/yeni-ayasofya-camii-islamische-gemeinde-wilhelmsburg` | `NEW_301` ✅ |
| 162 | `/de/moschee/muenchen/omar-moschee3` | 2026-10-23 | detail | `3` | Omar Moschee (ChIJr4f3kpfYnUcR_G6cU0IBFOo) | `/de/moschee/muenchen/omar-moschee` | `NEW_301` ✅ |
| 163 | `/ar/mosque/koeln/ditib-cologne-chorweiler-mosque4` | 2026-10-23 | detail | `4` | DITIB Cologne Chorweiler Mosque (ChIJFSRehhguv0cRtzxcEpOoHJI) | `/ar/mosque/koeln/ditib-cologne-chorweiler-mosque` | `NEW_301` ✅ |
| 164 | `/de/moschee/dortmund/ditib-ayasofya-moschee-scharnhorst4` | 2026-10-23 | detail | `4` | DITIB Ayasofya Moschee Scharnhorst (ChIJXcAJrdsQuUcRX3c9x8oJ184) | `/de/moschee/dortmund/ditib-ayasofya-moschee-scharnhorst` | `NEW_301` ✅ |
| 165 | `/de/moschee/dortmund/ditib-yunus-emre-moschee-dortmund-boevinghausen4` | 2026-10-23 | detail | `4` | DITIB - Yunus Emre Moschee Dortmund-Bövinghausen (ChIJf64PQAsfuUcRx7J-jiw_o7k) | `/de/moschee/dortmund/ditib-yunus-emre-moschee-dortmund-boevinghausen` | `NEW_301` ✅ |
| 166 | `/ar/mosque/koeln/bangladeshi-mosque4` | 2026-10-23 | detail | `4` | Bangladeshi Mosque (ChIJP8hf4UY7v0cRDiehvlz989c) | `/ar/mosque/koeln/bangladeshi-mosque` | `NEW_301` ✅ |
| 167 | `/de/moschee/muenchen/silamski-centar3` | 2026-10-23 | detail | `3` | Silamski centar (ChIJ11jBfQDhnUcRjFGtYeJHIJ8) | `/de/moschee/muenchen/silamski-centar` | `NEW_301` ✅ |
| 168 | `/de/moschee/dortmund/hicret-kur-an-kurs3` | 2026-10-23 | detail | `3` | Hicret Kur'an kurs (ChIJMRtbdAAZuUcRD8bkM8xyJQg) | `/de/moschee/dortmund/hicret-kur-an-kurs` | `NEW_301` ✅ |
| 169 | `/de/moschee/dortmund/islamic-cultural-association-takwa3` | 2026-10-23 | detail | `3` | Islamic Cultural Association Takwa (ChIJy_EZW1AXuUcR09YdfdB4Zzw) | `/de/moschee/dortmund/islamic-cultural-association-takwa` | `NEW_301` ✅ |
| 170 | `/ar/mosque/duesseldorf/moschee-23` | 2026-10-23 | detail | `3` | Дуселдорф два намаза джумъа (ChIJ1W8N0DLLuEcR4hKVADfihcw) | `/ar/mosque/duesseldorf/moschee-2` | `NEW_301` ✅ |
| 171 | `/ar/mosque/essen/islamischer-foerderungsver-v-tuerk-arbeitnehmern-in-e-altenessen-und-umgebung4` | 2026-10-23 | detail | `4` | Islamischer Förderungsver. v. türk. Arbeitnehmern in E- Altenessen und Umgebung e.V. (ChIJU4C5x2TouEcRXRNehgcBp28) | `/ar/mosque/essen/islamischer-foerderungsver-v-tuerk-arbeitnehmern-in-e-altenessen-und-umgebung` | `NEW_301` ✅ |
| 172 | `/ar/mosque/dortmund/ditib-badullah-camii3` | 2026-10-23 | detail | `3` | Ditib İbadullah Camii (ChIJSR8vWgARuUcRyaDzge_5Ccw) | `/ar/mosque/dortmund/ditib-badullah-camii` | `NEW_301` ✅ |
| 173 | `/ar/mosque/bonn/msjd-almhsnyn4` | 2026-10-23 | detail | `4` | مسجد المحسنين (ChIJWf1pTjnhvkcRtP2Bo3rtmkM) | `/ar/mosque/bonn/msjd-almhsnyn` | `NEW_301` ✅ |
| 174 | `/de/moschee/berlin/omar-mosche3` | 2026-10-23 | detail | `3` | Omar Mosche - مسجد عُمر (ChIJPVluYjVOqEcRZ1IzmSCONbk) | `/de/moschee/berlin/omar-mosche` | `NEW_301` ✅ |
| 175 | `/en/mosque/berlin/omar-mosche3` | 2026-10-23 | detail | `3` | Omar Mosche - مسجد عُمر (ChIJPVluYjVOqEcRZ1IzmSCONbk) | `/en/mosque/berlin/omar-mosche` | `NEW_301` ✅ |
| 176 | `/en/mosque/hamburg/aktona-ulu-cami3` | 2026-10-23 | detail | `3` | Aktona Ulu Cami (ChIJMYzPDQCFsUcR-tlwvuIC9zM) | `/en/mosque/hamburg/aktona-ulu-cami` | `NEW_301` ✅ |
| 177 | `/ar/mosque/dortmund/tadschikische-gesellschaft-nur3` | 2026-10-23 | detail | `3` | Tadschikische Gesellschaft NUR e. V. (ChIJHVAIjngXuUcR4mkXZZ6etS0) | `/ar/mosque/dortmund/tadschikische-gesellschaft-nur` | `NEW_301` ✅ |
| 178 | `/de/moschee/bremen/medina-masjid-pak-a-l-e-m-bremen3` | 2026-10-23 | detail | `3` | Medina Masjid - Pak A.L.E.M (e.V) Bremen (ChIJzXVw8_spsUcR4x7Nw11VTeo) | `/de/moschee/bremen/medina-masjid-pak-a-l-e-m-bremen` | `NEW_301` ✅ |
| 179 | `/ar/mosque/duesseldorf/dusseldorf-central-mosque3` | 2026-10-23 | detail | `3` | Dusseldorf Central Mosque (ChIJUaAjF3S2uEcRHmPVFZ431Ws) | `/ar/mosque/duesseldorf/dusseldorf-central-mosque` | `NEW_301` ✅ |
| 180 | `/de/moschee/bremen/igmg-quba-moschee-hemelingen-kuba-camii3` | 2026-10-23 | detail | `3` | IGMG Quba Moschee Hemelingen / Kuba Camii (ChIJT6B2w4HYsEcRSPcN2nzPMj0) | `/de/moschee/bremen/igmg-quba-moschee-hemelingen-kuba-camii` | `NEW_301` ✅ |
| 181 | `/de/moschee/bonn/msjd-als-nah3` | 2026-10-23 | detail | `3` | مسجد السُّنة (ChIJM4JJfOfhvkcRiBeSu674jGI) | `/de/moschee/bonn/msjd-als-nah` | `NEW_301` ✅ |
| 182 | `/ar/mosque/muenchen/moschee-al-muhsinin-muenchen3` | 2026-10-23 | detail | `3` | Moschee Al-Muhsinin München (ChIJZZIYPaUKnkcRCVDKLaCztC4) | `/ar/mosque/muenchen/moschee-al-muhsinin-muenchen` | `NEW_301` ✅ |
| 183 | `/ar/mosque/muenchen/tuerkische-islamische-gemeinde-zu-allach-muenchen3` | 2026-10-23 | detail | `3` | Türkische Islamische Gemeinde e.V. zu Allach/München (ChIJja0opNV5nkcRYnKCJZ94804) | `/ar/mosque/muenchen/tuerkische-islamische-gemeinde-zu-allach-muenchen` | `NEW_301` ✅ |
| 184 | `/en/mosque/dortmund/hicret-kur-an-kurs3` | 2026-10-23 | detail | `3` | Hicret Kur'an kurs (ChIJMRtbdAAZuUcRD8bkM8xyJQg) | `/en/mosque/dortmund/hicret-kur-an-kurs` | `NEW_301` ✅ |
| 185 | `/ar/mosque/muenchen/turkish-mosque-23` | 2026-10-23 | detail | `3` | Turkish mosque (ChIJcZH7sTDXnUcRPuF4gyxNdig) | `/ar/mosque/muenchen/turkish-mosque-2` | `NEW_301` ✅ |
| 186 | `/en/mosque/stuttgart/islamic-centre-of-stuttgart4` | 2026-10-23 | detail | `4` | Islamic Centre of Stuttgart(الجامع العربي) (ChIJ23tZYhfFmUcResTm4j4mtOQ) | `/en/mosque/stuttgart/islamic-centre-of-stuttgart` | `NEW_301` ✅ |
| 187 | `/ar/mosque/dortmund/massjid-ar-rahman4` | 2026-10-23 | detail | `4` | Massjid Ar 'Rahman (ChIJOepa9gAXuUcRLV9ePInYSz0) | `/ar/mosque/dortmund/massjid-ar-rahman` | `NEW_301` ✅ |
| 188 | `/ar/mosque/berlin/mescid-i-aksa-mosque-ditib3` | 2026-10-23 | detail | `3` | Mescid-i Aksa Mosque - DITIB (ChIJ29BHWjpSqEcRGFih_b68NbY) | `/ar/mosque/berlin/mescid-i-aksa-mosque-ditib` | `NEW_301` ✅ |
| 189 | `/ar/mosque/hamburg/islamische-gemeinde-eidelstedt3` | 2026-10-23 | detail | `3` | Islamische Gemeinde Eidelstedt e.v. (ChIJJQ3uc4qGsUcRTvz8LmUqVmg) | `/ar/mosque/hamburg/islamische-gemeinde-eidelstedt` | `NEW_301` ✅ |
| 190 | `/de/moschee/wuppertal/al-taqwa-moschee3` | 2026-10-23 | detail | `3` | Al taqwa Moschee (ChIJ9cbY1PEpuUcRiScAthbS7uM) | `/de/moschee/wuppertal/al-taqwa-moschee` | `NEW_301` ✅ |
| 191 | `/de/moschee/berlin/al-nur-moschee4` | 2026-10-23 | detail | `4` | Al-Nur Moschee (ChIJgx41R2lPqEcRpB_Lx9CYK7o) | `/de/moschee/berlin/al-nur-moschee` | `NEW_301` ✅ |
| 192 | `/en/mosque/berlin/tevhid-moschee3` | 2026-10-23 | detail | `3` | Tevhid Moschee (ChIJK0k_DABTqEcRDhUr_phm_eI) | `/en/mosque/berlin/tevhid-moschee` | `NEW_301` ✅ |
| 193 | `/en/mosque/berlin/indonesische-weisheit-und-kultur-zentrum3` | 2026-10-23 | detail | `3` | Indonesische Weisheit und Kultur Zentrum (ChIJpURK451RqEcRu5cIUk2ABMk) | `/en/mosque/berlin/indonesische-weisheit-und-kultur-zentrum` | `NEW_301` ✅ |
| 194 | `/de/moschee/hamburg/neugraben-yildiz-camii3` | 2026-10-23 | detail | `3` | Neugraben Yildiz Camii (ChIJNQUeO-OasUcRIN7Y-MjAgMs) | `/de/moschee/hamburg/neugraben-yildiz-camii` | `NEW_301` ✅ |
| 195 | `/de/moschee/stuttgart/kuba-mosque-igmg3` | 2026-10-23 | detail | `3` | Kuba Mosque – IGMG (ChIJO8k50vDEmUcRHeT5BN_AiDM) | `/de/moschee/stuttgart/kuba-mosque-igmg` | `NEW_301` ✅ |
| 196 | `/de/moschee/duesseldorf/islamisches-zentrum-duesseldorf-23` | 2026-10-23 | detail | `3` | Islamisches Zentrum Düsseldorf (ChIJ2xTChy7KuEcR6D2kahIUJtA) | `/de/moschee/duesseldorf/islamisches-zentrum-duesseldorf-2` | `NEW_301` ✅ |
| 197 | `/de/moschee/berlin/ravza-mosque3` | 2026-10-23 | detail | `3` | Ravza Mosque (ChIJsYerbiNSqEcRXa9FMawr74k) | `/de/moschee/berlin/ravza-mosque` | `NEW_301` ✅ |
| 198 | `/en/mosque/berlin/bdmg-zentrum-hellersdorf3` | 2026-10-23 | detail | `3` | BDMG Zentrum Hellersdorf (ChIJm7awRwBLqEcRW-bSuFtXTlo) | `/en/mosque/berlin/bdmg-zentrum-hellersdorf` | `NEW_301` ✅ |
| 199 | `/en/mosques/nuremberg2` | 2026-10-23 | city | `2` | Nürnberg | `/en/mosques/nuremberg` | `NEW_301` ✅ |
| 200 | `/en/mosque/berlin/ibn-rushd-goethe-moschee3` | 2026-10-23 | detail | `3` | Ibn Rushd-Goethe Moschee (ChIJxTa9vwpRqEcR8kgDlFa0_xg) | `/en/mosque/berlin/ibn-rushd-goethe-moschee` | `NEW_301` ✅ |
| 201 | `/en/mosque/duesseldorf/fidan-mosque-holthausen4` | 2026-10-23 | detail | `4` | Fidan Mosque Holthausen (ChIJCYRdTmTLuEcRl5tV4K-GEzg) | `/en/mosque/duesseldorf/fidan-mosque-holthausen` | `NEW_301` ✅ |
| 202 | `/en/mosque/berlin/ditib-tegel-selimiye-moschee4` | 2026-10-23 | detail | `4` | DITIB Tegel Selimiye Moschee (ChIJy26KOG9UqEcRRt4Zfh7Qhg8) | `/en/mosque/berlin/ditib-tegel-selimiye-moschee` | `NEW_301` ✅ |
| 203 | `/ar/mosque/hamburg/al-huda-mosque3` | 2026-10-23 | detail | `3` | Al Huda mosque (ChIJDXIr7SmPsUcRy9Mhp5pvHTc) | `/ar/mosque/hamburg/al-huda-mosque` | `NEW_301` ✅ |
| 204 | `/en/mosques/frankfurt2` | 2026-10-23 | city | `2` | Frankfurt | `/en/mosques/frankfurt` | `NEW_301` ✅ |
| 205 | `/ar/mosque/hamburg/wandsbek-tuerkisch-islamischer-kulturverein4` | 2026-10-23 | detail | `4` | Wandsbek Türkisch-Islamischer Kulturverein e.V. (ChIJZ4VnnTWJsUcRqfdJXVDGm4A) | `/ar/mosque/hamburg/wandsbek-tuerkisch-islamischer-kulturverein` | `NEW_301` ✅ |
| 206 | `/ar/mosque/essen/msjd4` | 2026-10-23 | detail | `4` | مسجد (ChIJIeDGKwDDuEcRVbNTQAC3-f4) | `/ar/mosque/essen/msjd` | `NEW_301` ✅ |
| 207 | `/ar/mosque/hamburg/baitur-rasheed-mosque3` | 2026-10-23 | detail | `3` | Baitur Rasheed Mosque (ChIJ2wEPjh2HsUcRyhim0kg23EY) | `/ar/mosque/hamburg/baitur-rasheed-mosque` | `NEW_301` ✅ |
| 208 | `/de/moschee/hamburg/ditib-ali-pasha-mosque4` | 2026-10-23 | detail | `4` | DITIB Ali Pasha Mosque (ChIJ92iNmjWJsUcRu88nmQRZH3M) | `/de/moschee/hamburg/ditib-ali-pasha-mosque` | `NEW_301` ✅ |
| 209 | `/ar/mosque/nuernberg/nuernberg-tuerk-oca3` | 2026-10-23 | detail | `3` | Nürnberg Türk Ocağı (ChIJwzbRnwRXn0cRI9l70Yj1sis) | `/ar/mosque/nuernberg/nuernberg-tuerk-oca` | `NEW_301` ✅ |
| 210 | `/en/mosque/munich/ikre3` | 2026-10-23 | detail | `3` | IKRE e.V. (ChIJffch-id0nkcR3qu4PogW49g) | `/en/mosque/munich/ikre` | `NEW_301` ✅ |
| 211 | `/ar/mosque/hamburg/masjid-al-tawba3` | 2026-10-23 | detail | `3` | Masjid al Tawba (ChIJAQBwg-WOsUcRcVcBoUmFGiA) | `/ar/mosque/hamburg/masjid-al-tawba` | `NEW_301` ✅ |
| 212 | `/en/mosques/bonn2` | 2026-10-23 | city | `2` | Bonn | `/en/mosques/bonn` | `NEW_301` ✅ |
| 213 | `/ar/mosque/muenchen/vikz-gemeinde-muenchen-giesing4` | 2026-10-23 | detail | `4` | VIKZ-Gemeinde München-Giesing (ChIJPV6kxhLfnUcRv6BFDX4mqyE) | `/ar/mosque/muenchen/vikz-gemeinde-muenchen-giesing` | `NEW_301` ✅ |
| 214 | `/ar/mosques/dortmund2` | 2026-10-23 | city | `2` | Dortmund | `/ar/mosques/dortmund` | `NEW_301` ✅ |
| 215 | `/en/mosque/essen/islamischer-foerderungsver-v-tuerk-arbeitnehmern-in-e-altenessen-und-umgebung4` | 2026-10-23 | detail | `4` | Islamischer Förderungsver. v. türk. Arbeitnehmern in E- Altenessen und Umgebung e.V. (ChIJU4C5x2TouEcRXRNehgcBp28) | `/en/mosque/essen/islamischer-foerderungsver-v-tuerk-arbeitnehmern-in-e-altenessen-und-umgebung` | `NEW_301` ✅ |
| 216 | `/en/mosque/munich/muenchner-forum-fuer-islam3` | 2026-10-23 | detail | `3` | Münchner Forum für Islam e.V. (ChIJA-E9lvV1nkcRYQZf4E8Ykl0) | `/en/mosque/munich/muenchner-forum-fuer-islam` | `NEW_301` ✅ |
| 217 | `/en/mosque/cologne/zumunta-kulturverein4` | 2026-10-23 | detail | `4` | Zumunta Kulturverein E.V. (ChIJl4Hjnq4lv0cRVDYCdW5j-FM) | `/en/mosque/cologne/zumunta-kulturverein` | `NEW_301` ✅ |
| 218 | `/ar/mosque/berlin/al-nur-moschee4` | 2026-10-23 | detail | `4` | Al-Nur Moschee (ChIJgx41R2lPqEcRpB_Lx9CYK7o) | `/ar/mosque/berlin/al-nur-moschee` | `NEW_301` ✅ |
| 219 | `/en/mosque/stuttgart/al-umma-moschee3` | 2026-10-23 | detail | `3` | Al-Umma-Moschee (ChIJRQMoCE7bmUcRcLklv0nj5EY) | `/en/mosque/stuttgart/al-umma-moschee` | `NEW_301` ✅ |
| 220 | `/ar/mosque/muenchen/islamisches-kulturzentrum-hidaje4` | 2026-10-23 | detail | `4` | Islamisches Kulturzentrum Hidaje e.V. مسجد بوسني (ChIJmVRiyFh2nkcRkCoCe8p919I) | `/ar/mosque/muenchen/islamisches-kulturzentrum-hidaje` | `NEW_301` ✅ |
| 221 | `/de/moschee/wuppertal/dzemat-wuppertal-dzamija3` | 2026-10-23 | detail | `3` | Dzemat Wuppertal Dzamija (ChIJYXzmawDXuEcR_S14jTBl0Pc) | `/de/moschee/wuppertal/dzemat-wuppertal-dzamija` | `NEW_301` ✅ |
| 222 | `/de/moschee/frankfurt/attassamuh-mosque-tun3` | 2026-10-23 | detail | `3` | Attassamuh Mosque/TUN e.V. (ChIJV_x6HwAJvUcRXkodhcuodD0) | `/de/moschee/frankfurt/attassamuh-mosque-tun` | `NEW_301` ✅ |
| 223 | `/en/mosque/stuttgart/turkish-mosque3` | 2026-10-23 | detail | `3` | Turkish Mosque (ChIJyf4XgETFmUcRPwBVRwqX6u0) | `/en/mosque/stuttgart/turkish-mosque` | `NEW_301` ✅ |
| 224 | `/ar/mosque/hamburg/islamische-gemeinde-kirchdorf3` | 2026-10-23 | detail | `3` | Islamische Gemeinde Kirchdorf (ChIJSVgdIgCRsUcRDFZp4EDOkbA) | `/ar/mosque/hamburg/islamische-gemeinde-kirchdorf` | `NEW_301` ✅ |
| 225 | `/de/moschee/frankfurt/verein-der-hazrat-fatima-moschee3` | 2026-10-23 | detail | `3` | Verein der Hazrat-Fatima-Moschee (ChIJ260JFzYKvUcRE3Eme51L42A) | `/de/moschee/frankfurt/verein-der-hazrat-fatima-moschee` | `NEW_301` ✅ |
| 226 | `/de/moschee/hamburg/african-muslim-association3` | 2026-10-23 | detail | `3` | African Muslim Association e.V. (ChIJ2_ay8eiOsUcRBkAtAAWrLfE) | `/de/moschee/hamburg/african-muslim-association` | `NEW_301` ✅ |
| 227 | `/en/mosque/bremen/ditib-mevlana-moschee-bremen4` | 2026-10-23 | detail | `4` | DITIB Mevlana-Moschee Bremen (ChIJE3QeUwopsUcRiX3YAqsLR9s) | `/en/mosque/bremen/ditib-mevlana-moschee-bremen` | `NEW_301` ✅ |
| 228 | `/en/mosque/berlin/hasan-basri-moschee3` | 2026-10-23 | detail | `3` | Hasan Basri Moschee (ChIJv3kxTR1RqEcRosmmdjJ9JoQ) | `/en/mosque/berlin/hasan-basri-moschee` | `NEW_301` ✅ |
| 229 | `/de/moscheen/wuppertal2` | 2026-10-23 | city | `2` | Wuppertal | `/de/moscheen/wuppertal` | `NEW_301` ✅ |
| 230 | `/de/moschee/essen/ditib-steele-ulu-cami3` | 2026-10-23 | detail | `3` | DITIB Steele Ulu Cami (ChIJ_yL3CQnduEcR7Gk0vq_BFnc) | `/de/moschee/essen/ditib-steele-ulu-cami` | `NEW_301` ✅ |
| 231 | `/de/moschee/frankfurt/minhaj-ul-quran-int-frankfurt3` | 2026-10-23 | detail | `3` | Minhaj Ul Quran Int Frankfurt (ChIJz7vILwAPvUcRRol3h2LfwT8) | `/de/moschee/frankfurt/minhaj-ul-quran-int-frankfurt` | `NEW_301` ✅ |
| 232 | `/de/moschee/bremen/moschee-walle4` | 2026-10-23 | detail | `4` | Масджид Ахлулбейт (ChIJi9e3OVoosUcRJ4UuuDAcELw) | `/de/moschee/bremen/moschee-walle` | `NEW_301` ✅ |
| 233 | `/de/moschee/dortmund/vikz-camii-moschee3` | 2026-10-23 | detail | `3` | VIKZ Camii - Moschee - مسجد (ChIJoY-hKQAbuUcR3YwmNB7u01g) | `/de/moschee/dortmund/vikz-camii-moschee` | `NEW_301` ✅ |
| 234 | `/ar/mosque/duesseldorf/transparente-moschee3` | 2026-10-23 | detail | `3` | Transparente Moschee (مسجد المصطفى) (ChIJQXDUW8HLuEcROysb6GyV-Iw) | `/ar/mosque/duesseldorf/transparente-moschee` | `NEW_301` ✅ |
| 235 | `/de/moschee/hamburg/dehlev3` | 2026-10-23 | detail | `3` | DEHLEVİ e.V (ChIJGzVlFwCPsUcRddWiQSBRsT0) | `/de/moschee/hamburg/dehlev` | `NEW_301` ✅ |
| 236 | `/en/mosque/nuremberg/ditib-nuremberg-central-mosque3` | 2026-10-23 | detail | `3` | DITIB Nuremberg Central Mosque (ChIJYx8sehFXn0cRpbRvKpnVLLQ) | `/en/mosque/nuremberg/ditib-nuremberg-central-mosque` | `NEW_301` ✅ |
| 237 | `/ar/mosque/berlin/ditib-tegel-selimiye-moschee4` | 2026-10-23 | detail | `4` | DITIB Tegel Selimiye Moschee (ChIJy26KOG9UqEcRRt4Zfh7Qhg8) | `/ar/mosque/berlin/ditib-tegel-selimiye-moschee` | `NEW_301` ✅ |
| 238 | `/en/mosque/frankfurt/muslim-prayer-room-33` | 2026-10-23 | detail | `3` | Muslim Prayer Room (ChIJTae9DQB1vUcRvsSdsBKwCzA) | `/en/mosque/frankfurt/muslim-prayer-room-3` | `NEW_301` ✅ |
| 239 | `/ar/mosque/bremen/sulaimaniya-moschee4` | 2026-10-23 | detail | `4` | Sulaimaniya-Moschee (ChIJE384GfsnsUcR-JiLsM5X0JA) | `/ar/mosque/bremen/sulaimaniya-moschee` | `NEW_301` ✅ |
| 240 | `/en/mosque/hamburg/al-huda-mosque3` | 2026-10-23 | detail | `3` | Al Huda mosque (ChIJDXIr7SmPsUcRy9Mhp5pvHTc) | `/en/mosque/hamburg/al-huda-mosque` | `NEW_301` ✅ |
| 241 | `/de/moschee/berlin/imam-jafar-sadik-mosque3` | 2026-10-23 | detail | `3` | Imam Jafar Sadik Mosque e.V. . (ChIJWe-P-DlSqEcRCSi8MMG8MkQ) | `/de/moschee/berlin/imam-jafar-sadik-mosque` | `NEW_301` ✅ |
| 242 | `/de/moschee/dortmund/al-anwar-mochee3` | 2026-10-23 | detail | `3` | Al-Anwar Mochee (ChIJf2e8EPAZuUcRs9__nvbqRfU) | `/de/moschee/dortmund/al-anwar-mochee` | `NEW_301` ✅ |
| 243 | `/de/moschee/muenchen/verein-der-zukunft3` | 2026-10-23 | detail | `3` | Verein der Zukunft (ChIJTXWDPKUKnkcRBmde08EnWkU) | `/de/moschee/muenchen/verein-der-zukunft` | `NEW_301` ✅ |
| 244 | `/ar/mosques/hamburg2` | 2026-10-23 | city | `2` | Hamburg | `/ar/mosques/hamburg` | `NEW_301` ✅ |
| 245 | `/ar/mosque/dortmund/msjd-alamam-malk3` | 2026-10-23 | detail | `3` | مسجد الامام مالك (ChIJN0MCC_4ZuUcR3DWuzK6jgxk) | `/ar/mosque/dortmund/msjd-alamam-malk` | `NEW_301` ✅ |
| 246 | `/de/moschee/dortmund/islamisches-kulturzentrum-bedr-dortmund3` | 2026-10-23 | detail | `3` | Islamisches Kulturzentrum "Bedr" e.V. Dortmund (ChIJm4BQGP4ZuUcRMMRokGT9N1Q) | `/de/moschee/dortmund/islamisches-kulturzentrum-bedr-dortmund` | `NEW_301` ✅ |
| 247 | `/de/moschee/dortmund/dortmund-merkez-c-mii3` | 2026-10-23 | detail | `3` | Dortmund Merkez Câmii (ChIJCaNLrlUXuUcRmCIsrOHoDXg) | `/de/moschee/dortmund/dortmund-merkez-c-mii` | `NEW_301` ✅ |
| 248 | `/de/moschee/essen/alfarouq-moschee3` | 2026-10-23 | detail | `3` | Alfarouq Moschee (ChIJfURbbqHCuEcRPa5ZIdHKuPU) | `/de/moschee/essen/alfarouq-moschee` | `NEW_301` ✅ |
| 249 | `/ar/mosque/dortmund/kasri-arifan-dortmunder-verein-fuer-jugend-ethik-und-wissenschaftsfoerderung3` | 2026-10-23 | detail | `3` | Kasri Arifan-Dortmunder Verein für Jugend, Ethik und Wissenschaftsförderung e.V. (ChIJ-0_Il6cZuUcRs_5toENz6iQ) | `/ar/mosque/dortmund/kasri-arifan-dortmunder-verein-fuer-jugend-ethik-und-wissenschaftsfoerderung` | `NEW_301` ✅ |
| 250 | `/en/mosque/berlin/ayasofya-moschee3` | 2026-10-23 | detail | `3` | Ayasofya Moschee (ChIJdwQpf3RRqEcRkrM2HMOGxao) | `/en/mosque/berlin/ayasofya-moschee` | `NEW_301` ✅ |
| 251 | `/de/moschee/frankfurt/islamischer-verein-moschee-tarik-ben-ziad3` | 2026-10-23 | detail | `3` | Islamischer Verein Moschee Tarik ben Ziad e.V. (ChIJGfJlANMLvUcR0W8PdRbivwA) | `/de/moschee/frankfurt/islamischer-verein-moschee-tarik-ben-ziad` | `NEW_301` ✅ |
| 252 | `/de/moschee/berlin/gazi-osman-pasa-mosque4` | 2026-10-23 | detail | `4` | Gazi Osman Pasa Mosque e.V. (ChIJkZ-QaXVPqEcR3uw-g4xcmnI) | `/de/moschee/berlin/gazi-osman-pasa-mosque` | `NEW_301` ✅ |
| 253 | `/en/mosque/cologne/yunus-emre-moschee4` | 2026-10-23 | detail | `4` | Yunus-Emre-Moschee (ChIJTVScPhcnv0cRw0zyGAy8ytY) | `/en/mosque/cologne/yunus-emre-moschee` | `NEW_301` ✅ |
| 254 | `/en/mosque/hamburg/saidi-nursi-moschee3` | 2026-10-23 | detail | `3` | Saidi Nursi Moschee (ChIJs6msjDKOsUcRrsKC_sCwLQ0) | `/en/mosque/hamburg/saidi-nursi-moschee` | `NEW_301` ✅ |
| 255 | `/en/mosque/essen/msjd4` | 2026-10-23 | detail | `4` | مسجد (ChIJIeDGKwDDuEcRVbNTQAC3-f4) | `/en/mosque/essen/msjd` | `NEW_301` ✅ |
| 256 | `/de/moschee/bremen/fatih-mosque-bremen4` | 2026-10-23 | detail | `4` | Fatih Mosque Bremen (ChIJv3nwMgspsUcRPUhnImXONK8) | `/de/moschee/bremen/fatih-mosque-bremen` | `NEW_301` ✅ |
| 257 | `/de/moschee/essen/islamisches-zentrum-essen-sal-hud-d-n-moschee4` | 2026-10-23 | detail | `4` | Islamisches Zentrum Essen – Salâhud-Dîn-Moschee المركز الإسلامي الكبير في اسن مسجد السلطان صلاح الدين (ChIJfdSjR0HouEcRdghydW5qCi0) | `/de/moschee/essen/islamisches-zentrum-essen-sal-hud-d-n-moschee` | `NEW_301` ✅ |
| 258 | `/ar/mosque/duesseldorf/islamisches-zentrum-duesseldorf-23` | 2026-10-23 | detail | `3` | Islamisches Zentrum Düsseldorf (ChIJ2xTChy7KuEcR6D2kahIUJtA) | `/ar/mosque/duesseldorf/islamisches-zentrum-duesseldorf-2` | `NEW_301` ✅ |
| 259 | `/en/mosque/duesseldorf/moroccan-islamic-cultural-center-of-dusseldorf3` | 2026-10-23 | detail | `3` | Moroccan Islamic Cultural Center of Dusseldorf (ChIJ1ZuBWTfKuEcRCIMTsR64J9A) | `/en/mosque/duesseldorf/moroccan-islamic-cultural-center-of-dusseldorf` | `NEW_301` ✅ |
| 260 | `/en/mosque/berlin/imam-riza-moschee-und-solidaritaetsverein3` | 2026-10-23 | detail | `3` | Imam Riza Moschee und Solidaritätsverein e.V. (ChIJqbUumLtPqEcRXtDHFuTWaX4) | `/en/mosque/berlin/imam-riza-moschee-und-solidaritaetsverein` | `NEW_301` ✅ |
| 261 | `/ar/mosque/bremen/verband-der-islamischen-kulturzentren4` | 2026-10-22 | detail | `4` | Verband der Islamischen Kulturzentren (ChIJV61dx1YnsUcR_nZqwiYSvN4) | `/ar/mosque/bremen/verband-der-islamischen-kulturzentren` | `EXISTING_301` ✅ |
| 262 | `/en/mosque/berlin/al-ajurry-moschee3` | 2026-10-22 | detail | `3` | Al Ajurry Moschee (ChIJvR0p6V1XqEcR5p1LxsmJIh8) | `/en/mosque/berlin/al-ajurry-moschee` | `NEW_301` ✅ |
| 263 | `/ar/mosque/dortmund/darussalam-moschee3` | 2026-10-22 | detail | `3` | Darussalam Moschee (ChIJExWt0v4ZuUcR6vVuY0aLiro) | `/ar/mosque/dortmund/darussalam-moschee` | `NEW_301` ✅ |
| 264 | `/de/moschee/berlin/mevlana-moschee-berlin3` | 2026-10-22 | detail | `3` | Mevlana Moschee Berlin (ChIJ55kymDROqEcR0gdYVe0rWY4) | `/de/moschee/berlin/mevlana-moschee-berlin` | `NEW_301` ✅ |
| 265 | `/de/moschee/hamburg/alazhar-moschee3` | 2026-10-22 | detail | `3` | Alazhar Moschee (ChIJu_cXRZWOsUcR4lQ8XHFx62k) | `/de/moschee/hamburg/alazhar-moschee` | `NEW_301` ✅ |
| 266 | `/de/moschee/berlin/kocatepe-mosque-ditib3` | 2026-10-22 | detail | `3` | Kocatepe Mosque - DITIB (ChIJ5ZT_U79WqEcRXJokqjb82O4) | `/de/moschee/berlin/kocatepe-mosque-ditib` | `NEW_301` ✅ |
| 267 | `/en/mosque/berlin/yunus-emre-mosque-berlin3` | 2026-10-22 | detail | `3` | Yunus Emre Mosque Berlin (ChIJh3UStylSqEcRZ3tgsYMlGwA) | `/en/mosque/berlin/yunus-emre-mosque-berlin` | `NEW_301` ✅ |
| 268 | `/en/mosque/bremen/islamisches-kulturzentrum-bremen3` | 2026-10-22 | detail | `3` | Islamisches Kulturzentrum Bremen (ChIJw7asRQApsUcRsBsPP3tcGKA) | `/en/mosque/bremen/islamisches-kulturzentrum-bremen` | `NEW_301` ✅ |
| 269 | `/ar/mosque/koeln/bedr-verein-mascid4` | 2026-10-22 | detail | `4` | Bedr verein mascid (ChIJdfyGTXgnv0cRXfoV-FdOuOU) | `/ar/mosque/koeln/bedr-verein-mascid` | `NEW_301` ✅ |
| 270 | `/de/moschee/leipzig/imambaragah-leipzig-shia-community4` | 2026-10-22 | detail | `4` | Imambaragah Leipzig Shia Community (ChIJbRG_WAD5pkcRk--vPdppaks) | `/de/moschee/leipzig/imambaragah-leipzig-shia-community` | `NEW_301` ✅ |
| 271 | `/de/moschee/berlin/sultan-ahmet-mosque3` | 2026-10-22 | detail | `3` | Sultan Ahmet Mosque (ChIJAXh-b7hRqEcRPg9rTuy05Qc) | `/de/moschee/berlin/sultan-ahmet-mosque` | `NEW_301` ✅ |
| 272 | `/en/mosque/cologne/aliyyuel-murteza-mosque4` | 2026-10-22 | detail | `4` | Aliyyül Murteza Mosque (ChIJK0jyN4Elv0cR6gnzqSUmp2g) | `/en/mosque/cologne/aliyyuel-murteza-mosque` | `NEW_301` ✅ |
| 273 | `/ar/mosque/frankfurt/bait-ul-qayyum3` | 2026-10-22 | detail | `3` | Bait-ul-Qayyum (ChIJhy27ooAHvUcRsjWOJPguW-Y) | `/ar/mosque/frankfurt/bait-ul-qayyum` | `NEW_301` ✅ |
| 274 | `/en/mosque/berlin/aksemseddin-camii-ditib3` | 2026-10-22 | detail | `3` | Aksemseddin Camii DITIB (ChIJcRzfbyNSqEcRibqBXxBhgNM) | `/en/mosque/berlin/aksemseddin-camii-ditib` | `NEW_301` ✅ |
| 275 | `/en/mosques/stuttgart2` | 2026-10-22 | city | `2` | Stuttgart | `/en/mosques/stuttgart` | `NEW_301` ✅ |
| 276 | `/ar/mosque/berlin/islamic-culture-u-education-center4` | 2026-10-22 | detail | `4` | Islamic culture u. education center (ChIJPfVUf6ZPqEcRBz2SIe9aGWA) | `/ar/mosque/berlin/islamic-culture-u-education-center` | `NEW_301` ✅ |
| 277 | `/de/moschee/duesseldorf/ditib-tuerkisch-islamische-gemeinde-zu-duesseldorf-eller3` | 2026-10-22 | detail | `3` | DITIB-Türkisch Islamische Gemeinde zu Düsseldorf-Eller e.V (ChIJwYq2iY7LuEcRJgpU4vQg88c) | `/de/moschee/duesseldorf/ditib-tuerkisch-islamische-gemeinde-zu-duesseldorf-eller` | `NEW_301` ✅ |
| 278 | `/ar/mosque/bremen/bilal-habashi-moschee4` | 2026-10-22 | detail | `4` | Bilal-Habashi-Moschee (ChIJS2vuwPfXsEcRR8KO-d9ebDI) | `/ar/mosque/bremen/bilal-habashi-moschee` | `NEW_301` ✅ |
| 279 | `/en/mosque/cologne/taqiyyu-d-din-al-hilali-moschee4` | 2026-10-22 | detail | `4` | Taqiyyu d-Din al-Hilali Moschee (ChIJebiyQ38mv0cRZSd7mJVhorM) | `/en/mosque/cologne/taqiyyu-d-din-al-hilali-moschee` | `NEW_301` ✅ |
| 280 | `/en/mosque/stuttgart/vikz-verband-der-islamischen-kulturzentren3` | 2026-10-22 | detail | `3` | VIKZ e. V. - Verband der Islamischen Kulturzentren (ChIJFev-mCnbmUcRPy_3kup8FxM) | `/en/mosque/stuttgart/vikz-verband-der-islamischen-kulturzentren` | `NEW_301` ✅ |
| 281 | `/ar/mosque/hamburg/harburg-moschee-b-i-b-in-harburg3` | 2026-10-22 | detail | `3` | Harburg Moschee - B.I.B in Harburg e.V. (ChIJSXz_b7ORsUcR-AtCAZfI3To) | `/ar/mosque/hamburg/harburg-moschee-b-i-b-in-harburg` | `NEW_301` ✅ |
| 282 | `/en/mosque/bremen/bilal-habashi-moschee4` | 2026-10-22 | detail | `4` | Bilal-Habashi-Moschee (ChIJS2vuwPfXsEcRR8KO-d9ebDI) | `/en/mosque/bremen/bilal-habashi-moschee` | `EXISTING_301` ✅ |
| 283 | `/ar/mosque/muenchen/igmg-moschee-muenchen-moosach3` | 2026-10-22 | detail | `3` | IGMG Moschee München Moosach (ChIJHSL2hrB3nkcRvP09npHZMFk) | `/ar/mosque/muenchen/igmg-moschee-muenchen-moosach` | `EXISTING_301` ✅ |
| 284 | `/en/mosque/hamburg/kue-uek-stanbul-camii3` | 2026-10-22 | detail | `3` | Küçük İstanbul Camii (ChIJMyglE1yDsUcRfU7WCkStZjc) | `/en/mosque/hamburg/kue-uek-stanbul-camii` | `EXISTING_301` ✅ |
| 285 | `/en/mosque/hamburg/bosnian-islamic-cultural-center-hamburg3` | 2026-10-22 | detail | `3` | Bosnian Islamic Cultural Center Hamburg (ChIJV4QfRT-MsUcRhKSUhQey4JE) | `/en/mosque/hamburg/bosnian-islamic-cultural-center-hamburg` | `EXISTING_301` ✅ |
| 286 | `/ar/mosque/muenchen/imam-al-hadi-14-rivers-moschee4` | 2026-10-22 | detail | `4` | Imam Al Hadi - 14 Rivers Moschee (ChIJE0FCOAV1nkcRWcmZDrylsiU) | `/ar/mosque/muenchen/imam-al-hadi-14-rivers-moschee` | `EXISTING_301` ✅ |
| 287 | `/en/mosque/berlin/zeituna-mosque3` | 2026-10-22 | detail | `3` | Zeituna Mosque (ChIJ37rYLSpRqEcRSM420rZ-QW4) | `/en/mosque/berlin/zeituna-mosque` | `EXISTING_301` ✅ |
| 288 | `/en/mosque/nuremberg/hagia-sophia-moschee-b-i-n3` | 2026-10-22 | detail | `3` | Hagia-Sophia-Moschee - B.I.N. e.V. (ChIJjbrZiqtXn0cRhqAXUJwics4) | `/en/mosque/nuremberg/hagia-sophia-moschee-b-i-n` | `EXISTING_301` ✅ |
| 289 | `/de/moschee/berlin/masjid-as-salam3` | 2026-10-22 | detail | `3` | Masjid as-Salam (ChIJnZx9GQBRqEcRHk2DrrVKSFY) | `/de/moschee/berlin/masjid-as-salam` | `NEW_301` ✅ |
| 290 | `/de/moschee/essen/yavuz-sultan-selim-mosque4` | 2026-10-22 | detail | `4` | Yavuz Sultan Selim Mosque (ChIJzxCih4DduEcRc2zN3knIa_I) | `/de/moschee/essen/yavuz-sultan-selim-mosque` | `NEW_301` ✅ |
| 291 | `/en/mosque/hamburg/el-iman-moschee3` | 2026-10-22 | detail | `3` | El-Iman Moschee (ChIJcwkPu6WRsUcRpFjvH7dwDxk) | `/en/mosque/hamburg/el-iman-moschee` | `EXISTING_301` ✅ |
| 292 | `/en/mosque/hamburg/xhamia-m-rgimtari-hamburg3` | 2026-10-22 | detail | `3` | Xhamia Mërgimtari - Hamburg (ChIJE-52cO-PsUcRYezDO059Q5Y) | `/en/mosque/hamburg/xhamia-m-rgimtari-hamburg` | `EXISTING_301` ✅ |
| 293 | `/ar/mosque/dortmund/steinhammerstrasse-853` | 2026-10-22 | detail | `3` | Steinhammerstraße 85 (ChIJx7iCBYgZuUcRKtDhbv-GkUY) | `/ar/mosque/dortmund/steinhammerstrasse-85` | `NEW_301` ✅ |
| 294 | `/en/mosque/frankfurt/bait-ul-qayyum3` | 2026-10-22 | detail | `3` | Bait-ul-Qayyum (ChIJhy27ooAHvUcRsjWOJPguW-Y) | `/en/mosque/frankfurt/bait-ul-qayyum` | `NEW_301` ✅ |
| 295 | `/en/mosque/munich/islamische-gemeinschaft-tevhid4` | 2026-10-22 | detail | `4` | Islamische Gemeinschaft Tevhid e.V. (ChIJw6OvoGl2nkcRXB7_bEpAWuI) | `/en/mosque/munich/islamische-gemeinschaft-tevhid` | `NEW_301` ✅ |
| 296 | `/ar/mosque/bonn/bonn-central-mosque3` | 2026-10-22 | detail | `3` | Bonn Central Mosque (ChIJoVbKqL3hvkcRj7lIFfiV_7k) | `/ar/mosque/bonn/bonn-central-mosque` | `NEW_301` ✅ |
| 297 | `/en/mosque/hamburg/masjid-al-tawheed-verein-der-afghanischen-muslime-deutschland3` | 2026-10-22 | detail | `3` | Masjid Al-Tawheed - Verein der afghanischen Muslime-Deutschland e.V. (ChIJ9U7pgdWJsUcRc3xwTbUREL8) | `/en/mosque/hamburg/masjid-al-tawheed-verein-der-afghanischen-muslime-deutschland` | `NEW_301` ✅ |
| 298 | `/de/moschee/koeln/bangladeshi-mosque4` | 2026-10-22 | detail | `4` | Bangladeshi Mosque (ChIJP8hf4UY7v0cRDiehvlz989c) | `/de/moschee/koeln/bangladeshi-mosque` | `NEW_301` ✅ |
| 299 | `/en/mosque/dortmund/ditib-badullah-camii3` | 2026-10-22 | detail | `3` | Ditib İbadullah Camii (ChIJSR8vWgARuUcRyaDzge_5Ccw) | `/en/mosque/dortmund/ditib-badullah-camii` | `NEW_301` ✅ |
| 300 | `/ar/mosque/frankfurt/baitus-sabuh-amj-deutschland3` | 2026-10-22 | detail | `3` | Baitus Sabuh AMJ Deutschland (ChIJgSCLcCcGvUcRsFgPC_61IXE) | `/ar/mosque/frankfurt/baitus-sabuh-amj-deutschland` | `NEW_301` ✅ |
| 301 | `/ar/mosque/bremen/masjid-al-sunnah-bremen3` | 2026-10-22 | detail | `3` | Masjid Al Sunnah Bremen مسجد السنة بريمن (ChIJ0YH-ggjXsEcRUIRcKdAvm4E) | `/ar/mosque/bremen/masjid-al-sunnah-bremen` | `NEW_301` ✅ |
| 302 | `/ar/mosque/bremen/fatih-mosque-bremen4` | 2026-10-22 | detail | `4` | Fatih Mosque Bremen (ChIJv3nwMgspsUcRPUhnImXONK8) | `/ar/mosque/bremen/fatih-mosque-bremen` | `NEW_301` ✅ |
| 303 | `/en/mosque/berlin/mariendorf-ulu-moschee3` | 2026-10-22 | detail | `3` | Mariendorf Ulu Moschee (ChIJZyarEgBFqEcR-YviWBl6fkU) | `/en/mosque/berlin/mariendorf-ulu-moschee` | `EXISTING_301` ✅ |
| 304 | `/en/mosque/stuttgart/islamic-community-for-kosovo-albanians3` | 2026-10-22 | detail | `3` | Islamic Community for Kosovo-Albanians (ChIJHyRHt5_cmUcRZI6kMpFBJjA) | `/en/mosque/stuttgart/islamic-community-for-kosovo-albanians` | `EXISTING_301` ✅ |
| 305 | `/de/moschee/koeln/ditib-el-aksa-moschee-meschenich4` | 2026-10-22 | detail | `4` | DITIB El-Aksa Moschee Meschenich (ChIJBw_iwacjv0cROxntWJaJXNY) | `/de/moschee/koeln/ditib-el-aksa-moschee-meschenich` | `EXISTING_301` ✅ |
| 306 | `/en/mosque/wuppertal/islamisches-zentrum-ar-raschad3` | 2026-10-22 | detail | `3` | Islamisches Zentrum Ar-Raschad (ChIJMepGT2kouUcRW-X3hdLKBAg) | `/en/mosque/wuppertal/islamisches-zentrum-ar-raschad` | `EXISTING_301` ✅ |
| 307 | `/en/mosque/hamburg/muradiye-moschee-ditib-wilhelmsburg3` | 2026-10-22 | detail | `3` | Muradiye-Moschee DITIB Wilhelmsburg (ChIJsQKSDTWOsUcRfzFGHqIJCFw) | `/en/mosque/hamburg/muradiye-moschee-ditib-wilhelmsburg` | `EXISTING_301` ✅ |
| 308 | `/en/mosque/essen/integration-und-bildungszentrum-essen4` | 2026-10-22 | detail | `4` | Integration und Bildungszentrum Essen e.V. (ChIJtzEekmXCuEcRjFHgBuY4X-Q) | `/en/mosque/essen/integration-und-bildungszentrum-essen` | `EXISTING_301` ✅ |
| 309 | `/en/mosque/wuppertal/wuppertaler-integrations-und-bildunsgverein3` | 2026-10-22 | detail | `3` | Wuppertaler Integrations - und Bildunsgverein (ChIJxYF2n_nWuEcRQhY0h60aFq0) | `/en/mosque/wuppertal/wuppertaler-integrations-und-bildunsgverein` | `EXISTING_301` ✅ |
| 310 | `/en/mosque/cologne/abbes-alschakeri-gemeinde-moschee-gebetsraum4` | 2026-10-22 | detail | `4` | Abbes-Alschakeri-Gemeinde e.V. - Moschee/Gebetsraum (ChIJ3UeTw6Yvv0cRZAb60z7rEAw) | `/en/mosque/cologne/abbes-alschakeri-gemeinde-moschee-gebetsraum` | `EXISTING_301` ✅ |
| 311 | `/ar/mosque/muenchen/bulgarisch-muslimischer-kultur-und-sozialverein-osmanpazar3` | 2026-10-22 | detail | `3` | Bulgarisch-Muslimischer Kultur und Sozialverein e.V Osmanpazarı (ChIJt9jJagB3nkcRIqMiQ0PIxP0) | `/ar/mosque/muenchen/bulgarisch-muslimischer-kultur-und-sozialverein-osmanpazar` | `EXISTING_301` ✅ |
| 312 | `/ar/mosque/berlin/kulturzentrum-der-afghanen-in-berlin-afghanische-gemeinde-berlin4` | 2026-10-22 | detail | `4` | Kulturzentrum der Afghanen in Berlin e.V. - Afghanische Gemeinde Berlin (ChIJN33rT7RTqEcRsy61OQ6A8RE) | `/ar/mosque/berlin/kulturzentrum-der-afghanen-in-berlin-afghanische-gemeinde-berlin` | `EXISTING_301` ✅ |
| 313 | `/de/moschee/dortmund/ulu-cami3` | 2026-10-22 | detail | `3` | Ulu Cami (ChIJ12i3_aYQuUcRDRKw9jP9WBQ) | `/de/moschee/dortmund/ulu-cami` | `NEW_301` ✅ |
| 314 | `/de/moschee/duesseldorf/moroccan-islamic-cultural-center-of-dusseldorf3` | 2026-10-21 | detail | `3` | Moroccan Islamic Cultural Center of Dusseldorf (ChIJ1ZuBWTfKuEcRCIMTsR64J9A) | `/de/moschee/duesseldorf/moroccan-islamic-cultural-center-of-dusseldorf` | `EXISTING_301` ✅ |
| 315 | `/en/mosque/cologne/bosnische-islamische-kulturgemeinschaft-gazi-husrevbeg-koeln4` | 2026-10-21 | detail | `4` | Bosnische Islamische Kulturgemeinschaft Gazi-husrevbeg e.V. Köln (ChIJAZSXcjklv0cRH40k3QxP_nE) | `/en/mosque/cologne/bosnische-islamische-kulturgemeinschaft-gazi-husrevbeg-koeln` | `EXISTING_301` ✅ |
| 316 | `/en/mosque/stuttgart/ulu-camii-moschee-des-landesverbands-der-islamischen-kulturzentren-bw3` | 2026-10-21 | detail | `3` | Ulu Camii - Moschee des Landesverbands der islamischen Kulturzentren BW e.V. (ChIJFev-mCnbmUcRPRTTdyeORWk) | `/en/mosque/stuttgart/ulu-camii-moschee-des-landesverbands-der-islamischen-kulturzentren-bw` | `EXISTING_301` ✅ |
| 317 | `/en/mosque/stuttgart/kasri-arifan-dergah-stuttgart3` | 2026-10-21 | detail | `3` | Kasri Arifan Dergahı Stuttgart (ChIJLyRcj_bFmUcR0M4seTNxQ-8) | `/en/mosque/stuttgart/kasri-arifan-dergah-stuttgart` | `NEW_301` ✅ |
| 318 | `/en/mosque/berlin/iqraa-moschee-afghanen-islamisches-kulturzentrum3` | 2026-10-21 | detail | `3` | Iqraa Moschee – Afghanen Islamisches Kulturzentrum e. V. (ChIJSazQNQBTqEcR5l13624g-WU) | `/en/mosque/berlin/iqraa-moschee-afghanen-islamisches-kulturzentrum` | `EXISTING_301` ✅ |
| 319 | `/en/mosque/berlin/haci-bayram-mosque3` | 2026-10-21 | detail | `3` | Haci Bayram Mosque e.V. (ChIJu-HqeTBSqEcRZwr3sNjH0Ug) | `/en/mosque/berlin/haci-bayram-mosque` | `EXISTING_301` ✅ |
| 320 | `/en/mosque/hamburg/association-afghan-muslims-belal3` | 2026-10-21 | detail | `3` | Association Afghan Muslims Belal e. V. (ChIJA4S80vmLsUcR96C5FCg7py8) | `/en/mosque/hamburg/association-afghan-muslims-belal` | `EXISTING_301` ✅ |
| 321 | `/en/mosque/bremen/bangladesch-moschee4` | 2026-10-21 | detail | `4` | Bangladesch Moschee (ChIJf_pKHgDXsEcR1lNyuRZo9eg) | `/en/mosque/bremen/bangladesch-moschee` | `NEW_301` ✅ |
| 322 | `/de/moschee/dortmund/ditib-tuerkisch-islamische-gemeinde-zu-dortmund-hombruch3` | 2026-10-21 | detail | `3` | DITIB Türkisch Islamische Gemeinde zu Dortmund-Hombruch e.V. (ChIJAz51ydIZuUcRirdffxpAdgU) | `/de/moschee/dortmund/ditib-tuerkisch-islamische-gemeinde-zu-dortmund-hombruch` | `NEW_301` ✅ |
| 323 | `/ar/mosques/duesseldorf2` | 2026-10-21 | city | `2` | Düsseldorf | `/ar/mosques/duesseldorf` | `NEW_301` ✅ |
| 324 | `/ar/mosque/dortmund/islamic-cultural-association-takwa3` | 2026-10-21 | detail | `3` | Islamic Cultural Association Takwa (ChIJy_EZW1AXuUcR09YdfdB4Zzw) | `/ar/mosque/dortmund/islamic-cultural-association-takwa` | `NEW_301` ✅ |
| 325 | `/ar/mosque/dortmund/ditib-yunus-emre-moschee-dortmund-boevinghausen4` | 2026-10-21 | detail | `4` | DITIB - Yunus Emre Moschee Dortmund-Bövinghausen (ChIJf64PQAsfuUcRx7J-jiw_o7k) | `/ar/mosque/dortmund/ditib-yunus-emre-moschee-dortmund-boevinghausen` | `NEW_301` ✅ |
| 326 | `/ar/mosque/duesseldorf/ditib-zentralmoschee3` | 2026-10-21 | detail | `3` | DITIB - Zentralmoschee (ChIJsxxRd5nJuEcR2NixWP9ks8s) | `/ar/mosque/duesseldorf/ditib-zentralmoschee` | `NEW_301` ✅ |
| 327 | `/ar/mosque/duesseldorf/masjid3` | 2026-10-21 | detail | `3` | Masjid (ChIJe0WqRgDLuEcRkqegrgjzcDI) | `/ar/mosque/duesseldorf/masjid` | `NEW_301` ✅ |
| 328 | `/ar/mosque/dortmund/assalam-moschee-do-hoerde4` | 2026-10-21 | detail | `4` | Assalam Moschee Do-Hörde (ChIJXVdhXQAXuUcRPmmFWZQ7dqQ) | `/ar/mosque/dortmund/assalam-moschee-do-hoerde` | `NEW_301` ✅ |
| 329 | `/ar/mosque/dortmund/ditib-dortmund-central-mosque-hoerde4` | 2026-10-21 | detail | `4` | DITIB Dortmund Central Mosque-Hörde (ChIJUw_Y3asXuUcR0wnAuPm7ErM) | `/ar/mosque/dortmund/ditib-dortmund-central-mosque-hoerde` | `NEW_301` ✅ |
| 330 | `/ar/mosque/dortmund/ditib-selimiye-mosque-dortmund3` | 2026-10-21 | detail | `3` | DiTiB Selimiye Mosque Dortmund (ChIJpYu6cgsauUcRvoXo4bMdq28) | `/ar/mosque/dortmund/ditib-selimiye-mosque-dortmund` | `NEW_301` ✅ |
| 331 | `/ar/mosque/dortmund/hz-meryem-moschee3` | 2026-10-21 | detail | `3` | Hz. Meryem Moschee (ChIJQ_13DAAbuUcRjO_LA0HQ9ao) | `/ar/mosque/dortmund/hz-meryem-moschee` | `NEW_301` ✅ |
| 332 | `/ar/mosque/essen/ayasofya-camii-moschee4` | 2026-10-21 | detail | `4` | Ayasofya Camii / Moschee (ChIJtbCLa8LnuEcRFN9PEOcVg7c) | `/ar/mosque/essen/ayasofya-camii-moschee` | `NEW_301` ✅ |
| 333 | `/de/moschee/bremen/bangladesch-islamisches-zentrum3` | 2026-10-21 | detail | `3` | Bangladesch Islamisches Zentrum (ChIJB5vM2PLXsEcRTzeXCPuxPfM) | `/de/moschee/bremen/bangladesch-islamisches-zentrum` | `NEW_301` ✅ |
| 334 | `/de/moschee/bremen/daawa-moschee3` | 2026-10-21 | detail | `3` | Daawa Moschee (ChIJL0lleyMosUcRRuL7qBuyaWE) | `/de/moschee/bremen/daawa-moschee` | `NEW_301` ✅ |
| 335 | `/de/moschee/bremen/abu-bakr-moschee4` | 2026-10-21 | detail | `4` | Abu Bakr Moschee (ChIJt3dCktfXsEcRvPEvkv-BAfg) | `/de/moschee/bremen/abu-bakr-moschee` | `NEW_301` ✅ |
| 336 | `/de/moschee/bremen/auslaender-treff3` | 2026-10-21 | detail | `3` | Ausländer Treff (ChIJLwI4eY0tsUcRwE6YF8H2ruo) | `/de/moschee/bremen/auslaender-treff` | `NEW_301` ✅ |
| 337 | `/de/moschee/bremen/islamische-foederation-bremen4` | 2026-10-21 | detail | `4` | Islamische Föderation Bremen (ChIJ5QooZpgnsUcR-T4sLOnICQ8) | `/de/moschee/bremen/islamische-foederation-bremen` | `NEW_301` ✅ |
| 338 | `/ar/mosque/stuttgart/tunesischer-kultur-und-dialogverein3` | 2026-10-21 | detail | `3` | Tunesischer Kultur und Dialogverein e.V. (ChIJxY3xOgDbmUcRAX9yIy912zc) | `/ar/mosque/stuttgart/tunesischer-kultur-und-dialogverein` | `NEW_301` ✅ |
| 339 | `/ar/mosque/nuernberg/msjd-nwrmbwrgh3` | 2026-10-21 | detail | `3` | مسجد نورمبورغ (ChIJkbrSbgBXn0cRgf_WxVNBNfI) | `/ar/mosque/nuernberg/msjd-nwrmbwrgh` | `NEW_301` ✅ |
| 340 | `/ar/mosque/hamburg/association-afghan-muslims-belal3` | 2026-10-21 | detail | `3` | Association Afghan Muslims Belal e. V. (ChIJA4S80vmLsUcR96C5FCg7py8) | `/ar/mosque/hamburg/association-afghan-muslims-belal` | `NEW_301` ✅ |
| 341 | `/ar/mosque/bremen/ditib-mevlana-moschee-bremen4` | 2026-10-21 | detail | `4` | DITIB Mevlana-Moschee Bremen (ChIJE3QeUwopsUcRiX3YAqsLR9s) | `/ar/mosque/bremen/ditib-mevlana-moschee-bremen` | `NEW_301` ✅ |
| 342 | `/ar/mosque/bremen/islamisches-kulturzentrum-bremen3` | 2026-10-21 | detail | `3` | Islamisches Kulturzentrum Bremen (ChIJw7asRQApsUcRsBsPP3tcGKA) | `/ar/mosque/bremen/islamisches-kulturzentrum-bremen` | `NEW_301` ✅ |
| 343 | `/de/moschee/koeln/marokkanische-moschee4` | 2026-10-21 | detail | `4` | Marokkanische Moschee - مسجد المغربي (ChIJh0EXQn8mv0cRNDRpS2Li-HE) | `/de/moschee/koeln/marokkanische-moschee` | `NEW_301` ✅ |
| 344 | `/de/moschee/dortmund/tadschikische-gesellschaft-nur3` | 2026-10-21 | detail | `3` | Tadschikische Gesellschaft NUR e. V. (ChIJHVAIjngXuUcR4mkXZZ6etS0) | `/de/moschee/dortmund/tadschikische-gesellschaft-nur` | `NEW_301` ✅ |
| 345 | `/en/mosque/munich/balkan3` | 2026-10-21 | detail | `3` | Balkan e.V. (ChIJJ_2GAwB1nkcRWu8k17qTptA) | `/en/mosque/munich/balkan` | `NEW_301` ✅ |
| 346 | `/en/mosque/berlin/sueleymaniye-mosque3` | 2026-10-21 | detail | `3` | Süleymaniye Mosque (ChIJ2eAj7NlTqEcR1LoRq7ciX7E) | `/en/mosque/berlin/sueleymaniye-mosque` | `NEW_301` ✅ |
| 347 | `/en/mosque/berlin/gazi-osman-pasa-mosque4` | 2026-10-21 | detail | `4` | Gazi Osman Pasa Mosque e.V. (ChIJkZ-QaXVPqEcR3uw-g4xcmnI) | `/en/mosque/berlin/gazi-osman-pasa-mosque` | `NEW_301` ✅ |
| 348 | `/en/mosque/munich/imam-malik-mosque3` | 2026-10-21 | detail | `3` | Imam Malik mosque مسجد الإمام مالك (ChIJM2igPwDfnUcRm0jOpYT57v8) | `/en/mosque/munich/imam-malik-mosque` | `NEW_301` ✅ |
| 349 | `/ar/mosque/berlin/imam-jafar-sadik-mosque3` | 2026-10-21 | detail | `3` | Imam Jafar Sadik Mosque e.V. . (ChIJWe-P-DlSqEcRCSi8MMG8MkQ) | `/ar/mosque/berlin/imam-jafar-sadik-mosque` | `NEW_301` ✅ |
| 350 | `/en/mosque/berlin/mescid-i-aksa-mosque-ditib3` | 2026-10-21 | detail | `3` | Mescid-i Aksa Mosque - DITIB (ChIJ29BHWjpSqEcRGFih_b68NbY) | `/en/mosque/berlin/mescid-i-aksa-mosque-ditib` | `NEW_301` ✅ |
| 351 | `/en/mosque/berlin/ditib-rudow-moschee3` | 2026-10-21 | detail | `3` | DITIB Rudow Moschee (ChIJC9LIKQBHqEcRoZM_udP3Zqo) | `/en/mosque/berlin/ditib-rudow-moschee` | `NEW_301` ✅ |
| 352 | `/en/mosque/berlin/mariendorfer-moschee3` | 2026-10-21 | detail | `3` | Mariendorfer Moschee (ChIJCe5iFlBFqEcRxLANVK6R4H4) | `/en/mosque/berlin/mariendorfer-moschee` | `NEW_301` ✅ |
| 353 | `/en/mosque/berlin/markaz-al-qaim-al-irshad4` | 2026-10-21 | detail | `4` | Markaz Al-Qaim (Al-Irshad e.V.) (ChIJt125375PqEcRGkq9EArcg2w) | `/en/mosque/berlin/markaz-al-qaim-al-irshad` | `NEW_301` ✅ |
| 354 | `/en/mosque/berlin/heimat-moschee4` | 2026-10-21 | detail | `4` | Heimat Moschee (ChIJYX5FUG9FqEcRZypNri8_kwY) | `/en/mosque/berlin/heimat-moschee` | `NEW_301` ✅ |
| 355 | `/en/mosque/hamburg/vahdet-islamische-kultur3` | 2026-10-21 | detail | `3` | Vahdet Islamische Kultur e.V. (ChIJGeO8xueOsUcRF3BhmfYQyms) | `/en/mosque/hamburg/vahdet-islamische-kultur` | `NEW_301` ✅ |
| 356 | `/ar/mosque/berlin/bilvanis-dosteli-moschee3` | 2026-10-21 | detail | `3` | Bilvanis Dosteli e.V Moschee (ChIJ6WgRQwBPqEcReVNgdIEsdCk) | `/ar/mosque/berlin/bilvanis-dosteli-moschee` | `NEW_301` ✅ |
| 357 | `/en/mosque/bremen/islamisches-zentrum-bremen3` | 2026-10-21 | detail | `3` | Islamisches Zentrum Bremen (ChIJdYyL83ApsUcRCZrM_Z5_yKE) | `/en/mosque/bremen/islamisches-zentrum-bremen` | `NEW_301` ✅ |
| 358 | `/de/moschee/muenchen/muenchner-forum-fuer-islam3` | 2026-10-21 | detail | `3` | Münchner Forum für Islam e.V. (ChIJA-E9lvV1nkcRYQZf4E8Ykl0) | `/de/moschee/muenchen/muenchner-forum-fuer-islam` | `NEW_301` ✅ |
| 359 | `/en/mosque/munich/masjid-on-5th-floor-oberpollinger3` | 2026-10-21 | detail | `3` | Masjid on 5th floor Oberpollinger (ChIJFec_6lN1nkcRUlidXpqiamI) | `/en/mosque/munich/masjid-on-5th-floor-oberpollinger` | `NEW_301` ✅ |
| 360 | `/en/mosque/hamburg/islamische-gemeinde-jenfeld-kuba-moschee3` | 2026-10-21 | detail | `3` | Islamische Gemeinde Jenfeld e.V - Kuba Moschee (ChIJ1VGgBQCLsUcRu4YP1LIjaXw) | `/en/mosque/hamburg/islamische-gemeinde-jenfeld-kuba-moschee` | `NEW_301` ✅ |
| 361 | `/de/moschee/berlin/iid-moschee-gemeinschaft-der-mitte-gemeindezentrum-marienfelde-moschee3` | 2026-10-21 | detail | `3` | IID Moschee - Gemeinschaft der Mitte Gemeindezentrum Marienfelde Moschee (ChIJTW6gTABFqEcRh2hJ-4lPmL0) | `/de/moschee/berlin/iid-moschee-gemeinschaft-der-mitte-gemeindezentrum-marienfelde-moschee` | `NEW_301` ✅ |
| 362 | `/ar/mosque/hamburg/landesverband-slamische-religionsgemeinschaft-ditib-hamburg-und-schleswig-holstein3` | 2026-10-21 | detail | `3` | Landesverband İslamische Religionsgemeinschaft DITIB Hamburg und Schleswig-Holstein e.V. (ChIJR1pfSJ-OsUcRJKqtFg1oHPQ) | `/ar/mosque/hamburg/landesverband-slamische-religionsgemeinschaft-ditib-hamburg-und-schleswig-holstein` | `NEW_301` ✅ |
| 363 | `/de/moschee/berlin/kulturzentrum-der-afghanen-in-berlin-afghanische-gemeinde-berlin4` | 2026-10-21 | detail | `4` | Kulturzentrum der Afghanen in Berlin e.V. - Afghanische Gemeinde Berlin (ChIJN33rT7RTqEcRsy61OQ6A8RE) | `/de/moschee/berlin/kulturzentrum-der-afghanen-in-berlin-afghanische-gemeinde-berlin` | `NEW_301` ✅ |
| 364 | `/de/moschee/stuttgart/ulu-camii-moschee-des-landesverbands-der-islamischen-kulturzentren-bw3` | 2026-10-21 | detail | `3` | Ulu Camii - Moschee des Landesverbands der islamischen Kulturzentren BW e.V. (ChIJFev-mCnbmUcRPRTTdyeORWk) | `/de/moschee/stuttgart/ulu-camii-moschee-des-landesverbands-der-islamischen-kulturzentren-bw` | `NEW_301` ✅ |
| 365 | `/de/moschee/frankfurt/baitul-hamd-moschee-bangladesch-islamisches-zentrum3` | 2026-10-21 | detail | `3` | Baitul Hamd Moschee (Bangladesch Islamisches Zentrum) (ChIJkfxAlYMNvUcRZPBMtR90VYU) | `/de/moschee/frankfurt/baitul-hamd-moschee-bangladesch-islamisches-zentrum` | `NEW_301` ✅ |
| 366 | `/en/mosque/wuppertal/al-nur-moschee4` | 2026-10-21 | detail | `4` | Al-Nur Moschee مسجد النور (ChIJnfSXbmnRuEcRhTrvN2UV8TQ) | `/en/mosque/wuppertal/al-nur-moschee` | `NEW_301` ✅ |
| 367 | `/ar/mosque/koeln/ditib-koeln-porz-mevlana-moschee4` | 2026-10-21 | detail | `4` | DITIB Köln Porz - Mevlana Moschee (ChIJW2CIyEonv0cRqlSDZ9kA6Co) | `/ar/mosque/koeln/ditib-koeln-porz-mevlana-moschee` | `NEW_301` ✅ |
| 368 | `/de/moschee/bremen/bangladesch-moschee4` | 2026-10-21 | detail | `4` | Bangladesch Moschee (ChIJf_pKHgDXsEcR1lNyuRZo9eg) | `/de/moschee/bremen/bangladesch-moschee` | `NEW_301` ✅ |
| 369 | `/en/mosque/bremen/abu-bakr-moschee4` | 2026-10-21 | detail | `4` | Abu Bakr Moschee (ChIJt3dCktfXsEcRvPEvkv-BAfg) | `/en/mosque/bremen/abu-bakr-moschee` | `NEW_301` ✅ |
| 370 | `/ar/mosque/duesseldorf/fidan-mosque-holthausen4` | 2026-10-21 | detail | `4` | Fidan Mosque Holthausen (ChIJCYRdTmTLuEcRl5tV4K-GEzg) | `/ar/mosque/duesseldorf/fidan-mosque-holthausen` | `NEW_301` ✅ |
| 371 | `/ar/mosque/dortmund/albanischer-islamischer-kultuverein-furkan3` | 2026-10-21 | detail | `3` | Albanischer Islamischer Kultuverein Furkan (ChIJM-Aa0lMXuUcRe0dyJNZZ-ok) | `/ar/mosque/dortmund/albanischer-islamischer-kultuverein-furkan` | `NEW_301` ✅ |
| 372 | `/en/mosque/berlin/arresalah-mosque3` | 2026-10-21 | detail | `3` | Arresalah Mosque (ChIJmwWL6zBRqEcRY1S-KePN-64) | `/en/mosque/berlin/arresalah-mosque` | `NEW_301` ✅ |
| 373 | `/en/mosque/bremen/moschee-walle4` | 2026-10-21 | detail | `4` | Масджид Ахлулбейт (ChIJi9e3OVoosUcRJ4UuuDAcELw) | `/en/mosque/bremen/moschee-walle` | `NEW_301` ✅ |
| 374 | `/de/moschee/bremen/gemeinde-bosnischer-moslems-bremen3` | 2026-10-21 | detail | `3` | Gemeinde Bosnischer Moslems-Bremen e.V. (ChIJH29GPnUpsUcRbeP8sn2VPvk) | `/de/moschee/bremen/gemeinde-bosnischer-moslems-bremen` | `NEW_301` ✅ |
| 375 | `/de/moschee/stuttgart/annas-hah-moschee-stuttgart3` | 2026-10-21 | detail | `3` | Annasîhah Moschee Stuttgart (ChIJ8V1dw-jamUcRHc9y2SaREEU) | `/de/moschee/stuttgart/annas-hah-moschee-stuttgart` | `EXISTING_301` ✅ |
| 376 | `/de/moschee/hamburg/masjid-al-tawba3` | 2026-10-21 | detail | `3` | Masjid al Tawba (ChIJAQBwg-WOsUcRcVcBoUmFGiA) | `/de/moschee/hamburg/masjid-al-tawba` | `NEW_301` ✅ |
| 377 | `/ar/mosque/frankfurt/muslim-prayer-room-sued4` | 2026-10-21 | detail | `4` | Muslim Prayer room (ChIJTT0hU0YLvUcRHly8JzMP_NU) | `/ar/mosque/frankfurt/muslim-prayer-room-sued` | `NEW_301` ✅ |
| 378 | `/ar/mosque/berlin/al-khair-mosque3` | 2026-10-21 | detail | `3` | Al Khair Mosque (ChIJW5_NtnZTqEcREszCd1yEbgI) | `/ar/mosque/berlin/al-khair-mosque` | `NEW_301` ✅ |
| 379 | `/de/moschee/muenchen/neuaubing-mosque3` | 2026-10-21 | detail | `3` | Neuaubing Mosque (ChIJRQbNqdDXnUcR8T3_vd_9fM4) | `/de/moschee/muenchen/neuaubing-mosque` | `NEW_301` ✅ |
| 380 | `/ar/mosque/muenchen/neuaubing-mosque3` | 2026-10-21 | detail | `3` | Neuaubing Mosque (ChIJRQbNqdDXnUcR8T3_vd_9fM4) | `/ar/mosque/muenchen/neuaubing-mosque` | `NEW_301` ✅ |
| 381 | `/en/mosque/berlin/turgut-alp-moschee4` | 2026-10-21 | detail | `4` | Turgut Alp Moschee (ChIJvRII1gNTqEcR9GWH0IvetBk) | `/en/mosque/berlin/turgut-alp-moschee` | `NEW_301` ✅ |
| 382 | `/de/moschee/stuttgart/tunesischer-kultur-und-dialogverein3` | 2026-10-21 | detail | `3` | Tunesischer Kultur und Dialogverein e.V. (ChIJxY3xOgDbmUcRAX9yIy912zc) | `/de/moschee/stuttgart/tunesischer-kultur-und-dialogverein` | `NEW_301` ✅ |
| 383 | `/en/mosque/hamburg/masjid-al-tawba3` | 2026-10-21 | detail | `3` | Masjid al Tawba (ChIJAQBwg-WOsUcRcVcBoUmFGiA) | `/en/mosque/hamburg/masjid-al-tawba` | `NEW_301` ✅ |
| 384 | `/ar/mosque/wuppertal/wuppertal-d-t-b-barmen-fatih-camii3` | 2026-10-21 | detail | `3` | WUPPERTAL DİTİB BARMEN FATIH CAMii (ChIJt4xA31O4cUERw61UnJB9T_w) | `/ar/mosque/wuppertal/wuppertal-d-t-b-barmen-fatih-camii` | `NEW_301` ✅ |
| 385 | `/de/moschee/frankfurt/muslim-prayer-room-sued4` | 2026-10-21 | detail | `4` | Muslim Prayer room (ChIJTT0hU0YLvUcRHly8JzMP_NU) | `/de/moschee/frankfurt/muslim-prayer-room-sued` | `NEW_301` ✅ |
| 386 | `/en/mosque/munich/neuaubing-mosque3` | 2026-10-21 | detail | `3` | Neuaubing Mosque (ChIJRQbNqdDXnUcR8T3_vd_9fM4) | `/en/mosque/munich/neuaubing-mosque` | `NEW_301` ✅ |
| 387 | `/en/mosque/wuppertal/wuppertal-central-mosque3` | 2026-10-21 | detail | `3` | Wuppertal Central Mosque (ChIJCQqnKNjXuEcRgXthIj6I1to) | `/en/mosque/wuppertal/wuppertal-central-mosque` | `NEW_301` ✅ |
| 388 | `/de/moschee/dortmund/islamisches-kulturzentrum-der-bosniaken-sand-ak3` | 2026-10-21 | detail | `3` | Islamisches Kulturzentrum der Bosniaken - Sandžak e. V. (ChIJbTF3lVUXuUcRNMGY-ddcNzg) | `/de/moschee/dortmund/islamisches-kulturzentrum-der-bosniaken-sand-ak` | `NEW_301` ✅ |
| 389 | `/ar/mosque/dortmund/mesjid-ikre3` | 2026-10-21 | detail | `3` | Mesjid Ikre (ChIJB5b3dwAZuUcRNGWN_8ZklQ4) | `/ar/mosque/dortmund/mesjid-ikre` | `NEW_301` ✅ |
| 390 | `/ar/mosque/dortmund/islamisches-kulturzentrum-der-bosniaken-sand-ak3` | 2026-10-21 | detail | `3` | Islamisches Kulturzentrum der Bosniaken - Sandžak e. V. (ChIJbTF3lVUXuUcRNMGY-ddcNzg) | `/ar/mosque/dortmund/islamisches-kulturzentrum-der-bosniaken-sand-ak` | `NEW_301` ✅ |
| 391 | `/de/moschee/dortmund/msjd-alamam-malk3` | 2026-10-21 | detail | `3` | مسجد الامام مالك (ChIJN0MCC_4ZuUcR3DWuzK6jgxk) | `/de/moschee/dortmund/msjd-alamam-malk` | `NEW_301` ✅ |
| 392 | `/ar/mosque/hamburg/sultan-ahmet-moschee3` | 2026-10-21 | detail | `3` | Sultan Ahmet Moschee (ChIJH6-kMfeMsUcRS7nYDBM1LL4) | `/ar/mosque/hamburg/sultan-ahmet-moschee` | `NEW_301` ✅ |
| 393 | `/de/moschee/berlin/pak-mohammad-moschee3` | 2026-10-21 | detail | `3` | PAK Mohammad Moschee (ChIJ-XfwMABRqEcRCKx0Xk4OxfY) | `/de/moschee/berlin/pak-mohammad-moschee` | `NEW_301` ✅ |
| 394 | `/de/moschee/stuttgart/islamische-gemeinschaft-stuttgart4` | 2026-10-21 | detail | `4` | Islamische Gemeinschaft Stuttgart e.V. (ChIJ0wS8e2zEmUcRvNWhGZKyEFY) | `/de/moschee/stuttgart/islamische-gemeinschaft-stuttgart` | `NEW_301` ✅ |
| 395 | `/de/moschee/dortmund/yeni-cami3` | 2026-10-21 | detail | `3` | Yeni Cami (ChIJL7Q_r_AZuUcR-Z08r11QQ70) | `/de/moschee/dortmund/yeni-cami` | `NEW_301` ✅ |
| 396 | `/ar/mosque/dortmund/dortmund-merkez-c-mii3` | 2026-10-21 | detail | `3` | Dortmund Merkez Câmii (ChIJCaNLrlUXuUcRmCIsrOHoDXg) | `/ar/mosque/dortmund/dortmund-merkez-c-mii` | `NEW_301` ✅ |
| 397 | `/de/moschee/dortmund/el-medine3` | 2026-10-21 | detail | `3` | El Medine e. V. (ChIJ8_BPDfoZuUcRJQDEfJrZoC0) | `/de/moschee/dortmund/el-medine` | `NEW_301` ✅ |
| 398 | `/ar/mosque/dortmund/ali-moschee3` | 2026-10-21 | detail | `3` | Ali Moschee - مسجد علي (ChIJL-2ClPwZuUcRwt_c5wSgW4k) | `/ar/mosque/dortmund/ali-moschee` | `NEW_301` ✅ |
| 399 | `/de/moschee/hamburg/muradiye-moschee-ditib-wilhelmsburg3` | 2026-10-21 | detail | `3` | Muradiye-Moschee DITIB Wilhelmsburg (ChIJsQKSDTWOsUcRfzFGHqIJCFw) | `/de/moschee/hamburg/muradiye-moschee-ditib-wilhelmsburg` | `NEW_301` ✅ |
| 400 | `/ar/mosque/dortmund/islamisches-kulturzentrum-bedr-dortmund3` | 2026-10-21 | detail | `3` | Islamisches Kulturzentrum "Bedr" e.V. Dortmund (ChIJm4BQGP4ZuUcRMMRokGT9N1Q) | `/ar/mosque/dortmund/islamisches-kulturzentrum-bedr-dortmund` | `NEW_301` ✅ |
| 401 | `/de/moschee/dortmund/igmg-anatolian-mosque-dortmund3` | 2026-10-21 | detail | `3` | IGMG Anatolian Mosque Dortmund (ChIJt7JRh_kZuUcRW-p3OMBJ1Wo) | `/de/moschee/dortmund/igmg-anatolian-mosque-dortmund` | `NEW_301` ✅ |
| 402 | `/de/moschee/frankfurt/taqwa-moschee3` | 2026-10-21 | detail | `3` | Taqwa Moschee (ChIJgxlbCfsLvUcRbbiEnLOEzf0) | `/de/moschee/frankfurt/taqwa-moschee` | `NEW_301` ✅ |
| 403 | `/de/moschee/hamburg/islamische-gemeinde-in-harburg3` | 2026-10-21 | detail | `3` | Islamische Gemeinde in Harburg e.V. (ChIJo9L7R66RsUcRsxXtNcrtVZY) | `/de/moschee/hamburg/islamische-gemeinde-in-harburg` | `NEW_301` ✅ |
| 404 | `/de/moschee/berlin/islamische-gemeinde-al-baraka-haselhorst3` | 2026-10-21 | detail | `3` | Islamische Gemeinde Al Baraka e.V Haselhorst مسجد البركه هازل هورست (ChIJ_dfs04RXqEcRJ-1VG7XVz84) | `/de/moschee/berlin/islamische-gemeinde-al-baraka-haselhorst` | `NEW_301` ✅ |
| 405 | `/ar/mosque/hamburg/masjid-al-tawheed-verein-der-afghanischen-muslime-deutschland3` | 2026-10-21 | detail | `3` | Masjid Al-Tawheed - Verein der afghanischen Muslime-Deutschland e.V. (ChIJ9U7pgdWJsUcRc3xwTbUREL8) | `/ar/mosque/hamburg/masjid-al-tawheed-verein-der-afghanischen-muslime-deutschland` | `NEW_301` ✅ |
| 406 | `/ar/mosque/frankfurt/mevlana-moschee-tuerk-kultur-und-bildungsverein-in-frankfurt-hoechst3` | 2026-10-21 | detail | `3` | Mevlana Moschee-Türk.Kultur und Bildungsverein e.V. in Frankfurt-Höchst (ChIJQVE9nqagvUcREAf94fIF4jA) | `/ar/mosque/frankfurt/mevlana-moschee-tuerk-kultur-und-bildungsverein-in-frankfurt-hoechst` | `NEW_301` ✅ |
| 407 | `/ar/mosque/stuttgart/islamic-community-for-kosovo-albanians3` | 2026-10-21 | detail | `3` | Islamic Community for Kosovo-Albanians (ChIJHyRHt5_cmUcRZI6kMpFBJjA) | `/ar/mosque/stuttgart/islamic-community-for-kosovo-albanians` | `NEW_301` ✅ |
| 408 | `/en/mosque/frankfurt/gamaat-bismi-allah4` | 2026-10-20 | detail | `4` | Gamaat Bismi Allah (ChIJZ5ZOEwAPvUcRvoCQw6iIrUE) | `/en/mosque/frankfurt/gamaat-bismi-allah` | `NEW_301` ✅ |
| 409 | `/de/moschee/berlin/mehmed-zahid-kotku-sufi-lodge3` | 2026-10-20 | detail | `3` | Mehmed Zahid Kotku Sufi Lodge (ChIJ0YmP7YhTqEcR4a_fhRL6n7U) | `/de/moschee/berlin/mehmed-zahid-kotku-sufi-lodge` | `EXISTING_301` ✅ |
| 410 | `/ar/mosque/frankfurt/baitul-hamd-moschee-bangladesch-islamisches-zentrum3` | 2026-10-20 | detail | `3` | Baitul Hamd Moschee (Bangladesch Islamisches Zentrum) (ChIJkfxAlYMNvUcRZPBMtR90VYU) | `/ar/mosque/frankfurt/baitul-hamd-moschee-bangladesch-islamisches-zentrum` | `NEW_301` ✅ |
| 411 | `/ar/mosque/muenchen/jamia-masjid-sufia-deutsch-pakistanischer-kulturverein-fuer-bildung-und-integration3` | 2026-10-20 | detail | `3` | Jamia Masjid Sufia Deutsch-Pakistanischer Kulturverein für Bildung und Integration e.V. (ChIJE4rULcF2nkcRfqyyCpWz0W0) | `/ar/mosque/muenchen/jamia-masjid-sufia-deutsch-pakistanischer-kulturverein-fuer-bildung-und-integration` | `EXISTING_301` ✅ |
| 412 | `/de/moschee/muenchen/mosque-eyuep-sultan-mg-munich4` | 2026-10-20 | detail | `4` | Mosque Eyüp Sultan MG Munich (ChIJdcvN0InfnUcRjUU-UYREs9g) | `/de/moschee/muenchen/mosque-eyuep-sultan-mg-munich` | `EXISTING_301` ✅ |
| 413 | `/en/mosque/cologne/kurdistan-islam-zentrum4` | 2026-10-20 | detail | `4` | Kurdistan Islam Zentrum e.V. (ChIJuwitVDUlv0cRPfB5Lg22EeE) | `/en/mosque/cologne/kurdistan-islam-zentrum` | `EXISTING_301` ✅ |
| 414 | `/en/mosque/berlin/emir-sultan-moschee3` | 2026-10-20 | detail | `3` | Emir Sultan Moschee (ChIJV6S3wUBQqEcRSsh2uSCq1jg) | `/en/mosque/berlin/emir-sultan-moschee` | `EXISTING_301` ✅ |
| 415 | `/en/mosque/munich/d-t-m-merkez-camii-muenih3` | 2026-10-20 | detail | `3` | DİTİM Merkez Camii Münih (ChIJBToV8zbfnUcRJ3Ws_rdcIes) | `/en/mosque/munich/d-t-m-merkez-camii-muenih` | `EXISTING_301` ✅ |
| 416 | `/en/mosque/wuppertal/taten-werk-wuppertal3` | 2026-10-20 | detail | `3` | Taten Werk e.V. - Wuppertal (ChIJJcKhTwDXuEcRt7KYb48ECX0) | `/en/mosque/wuppertal/taten-werk-wuppertal` | `EXISTING_301` ✅ |
| 417 | `/ar/mosque/muenchen/islamic-centre-of-munich3` | 2026-10-20 | detail | `3` | Islamic Centre of Munich (ChIJTSHJyX9znkcRtMjp7yJN_1M) | `/ar/mosque/muenchen/islamic-centre-of-munich` | `EXISTING_301` ✅ |
| 418 | `/en/mosque/hamburg/al-irsch-d-moschee-hamburg3` | 2026-10-20 | detail | `3` | Al-Irschâd Moschee Hamburg (ChIJiXChx-eOsUcRHMX4i6sOZvU) | `/en/mosque/hamburg/al-irsch-d-moschee-hamburg` | `EXISTING_301` ✅ |
| 419 | `/en/mosque/munich/togolesische-moschee-actim3` | 2026-10-20 | detail | `3` | Togolesische Moschee (ACTIM e.V.) (ChIJvdBaOdd3nkcRyyx4-aqaMBw) | `/en/mosque/munich/togolesische-moschee-actim` | `EXISTING_301` ✅ |
| 420 | `/en/mosque/berlin/mrkz-alamam-alsyd-mwsa-alsdr3` | 2026-10-20 | detail | `3` | مركز الامام السيد موسى الصدر (ChIJ1-yaIgJQqEcR_f-QRz8tjjc) | `/en/mosque/berlin/mrkz-alamam-alsyd-mwsa-alsdr` | `EXISTING_301` ✅ |
| 421 | `/en/mosque/munich/vikz-gemeinde-muenchen-giesing4` | 2026-10-20 | detail | `4` | VIKZ-Gemeinde München-Giesing (ChIJPV6kxhLfnUcRv6BFDX4mqyE) | `/en/mosque/munich/vikz-gemeinde-muenchen-giesing` | `EXISTING_301` ✅ |
| 422 | `/en/mosque/stuttgart/annas-hah-moschee-stuttgart3` | 2026-10-20 | detail | `3` | Annasîhah Moschee Stuttgart (ChIJ8V1dw-jamUcRHc9y2SaREEU) | `/en/mosque/stuttgart/annas-hah-moschee-stuttgart` | `EXISTING_301` ✅ |
| 423 | `/en/mosque/munich/oberpollinger-mescid-moschee3` | 2026-10-20 | detail | `3` | Oberpollinger Mescid / Moschee (ChIJpcahnlN1nkcRuzihuPa_5hg) | `/en/mosque/munich/oberpollinger-mescid-moschee` | `EXISTING_301` ✅ |
| 424 | `/en/mosque/munich/imam-al-hadi-14-rivers-moschee4` | 2026-10-20 | detail | `4` | Imam Al Hadi - 14 Rivers Moschee (ChIJE0FCOAV1nkcRWcmZDrylsiU) | `/en/mosque/munich/imam-al-hadi-14-rivers-moschee` | `EXISTING_301` ✅ |
| 425 | `/ar/mosque/nuernberg/islamic-center-of-nuremberg3` | 2026-10-20 | detail | `3` | Islamic Center of Nuremberg (ChIJK850Sf5Wn0cR-LU5uQoF_j8) | `/ar/mosque/nuernberg/islamic-center-of-nuremberg` | `EXISTING_301` ✅ |
| 426 | `/en/mosque/stuttgart/islamic-center-for-albanians3` | 2026-10-20 | detail | `3` | Islamic Center for Albanians e.V. (ChIJ2SUdy-jamUcRpnvhIG1HRVQ) | `/en/mosque/stuttgart/islamic-center-for-albanians` | `EXISTING_301` ✅ |
| 427 | `/en/mosque/hamburg/mevlana-mosque-hamburg-moschee3` | 2026-10-20 | detail | `3` | Mevlana Mosque Hamburg (Moschee) (ChIJW6EQuWuPsUcRXfjoZClL73g) | `/en/mosque/hamburg/mevlana-mosque-hamburg-moschee` | `EXISTING_301` ✅ |
| 428 | `/en/mosque/duesseldorf/moschee-mosque-beyazit-camii3` | 2026-10-20 | detail | `3` | Moschee Mosque Beyazit Camii (ChIJ3WKWnWS3uEcRGTCj2YPZ4TA) | `/en/mosque/duesseldorf/moschee-mosque-beyazit-camii` | `EXISTING_301` ✅ |
| 429 | `/en/mosque/munich/islamisches-kulturzentrum-hidaje4` | 2026-10-20 | detail | `4` | Islamisches Kulturzentrum Hidaje e.V. مسجد بوسني (ChIJmVRiyFh2nkcRkCoCe8p919I) | `/en/mosque/munich/islamisches-kulturzentrum-hidaje` | `EXISTING_301` ✅ |
| 430 | `/en/mosque/bremen/gemeinde-bosnischer-moslems-bremen3` | 2026-10-20 | detail | `3` | Gemeinde Bosnischer Moslems-Bremen e.V. (ChIJH29GPnUpsUcRbeP8sn2VPvk) | `/en/mosque/bremen/gemeinde-bosnischer-moslems-bremen` | `EXISTING_301` ✅ |
| 431 | `/en/mosque/hamburg/mosque-community-altona-ulu-cami3` | 2026-10-20 | detail | `3` | Mosque community Altona - Ulu Cami (ChIJAQy1wIWFsUcR25-ZD0zRvkY) | `/en/mosque/hamburg/mosque-community-altona-ulu-cami` | `EXISTING_301` ✅ |
| 432 | `/en/mosque/hamburg/interreligioeser-raum-der-stille4` | 2026-10-20 | detail | `4` | Interreligiöser Raum der Stille (ChIJj36n2TuPsUcRBBE7ri4D0Ss) | `/en/mosque/hamburg/interreligioeser-raum-der-stille` | `EXISTING_301` ✅ |
| 433 | `/de1` | 2026-10-20 | home | `1` | Root Locale | `/de` | `EXISTING_301` ✅ |
| 434 | `/en/mosque/leipzig/imambaragah-leipzig-shia-community4` | 2026-10-20 | detail | `4` | Imambaragah Leipzig Shia Community (ChIJbRG_WAD5pkcRk--vPdppaks) | `/en/mosque/leipzig/imambaragah-leipzig-shia-community` | `EXISTING_301` ✅ |
| 435 | `/de/moschee/berlin/islamic-culture-u-education-center4` | 2026-10-20 | detail | `4` | Islamic culture u. education center (ChIJPfVUf6ZPqEcRBz2SIe9aGWA) | `/de/moschee/berlin/islamic-culture-u-education-center` | `EXISTING_301` ✅ |
| 436 | `/en/mosque/berlin/familienberatung-haus-der-weisheit3` | 2026-10-20 | detail | `3` | Familienberatung Haus der Weisheit دار الحكمة (ChIJXQ_BP59RqEcRYNlQ2yQu5pY) | `/en/mosque/berlin/familienberatung-haus-der-weisheit` | `EXISTING_301` ✅ |
| 437 | `/en/mosque/munich/islamische-gemeinschaft-fedzr-muenchen3` | 2026-10-20 | detail | `3` | Islamische Gemeinschaft Fedzr München (ChIJET1ACBjZnUcR2_zQ3Ir_FR4) | `/en/mosque/munich/islamische-gemeinschaft-fedzr-muenchen` | `EXISTING_301` ✅ |
| 438 | `/en/mosque/stuttgart/kulturgemeinschaft-der-kosovo-bosniaken3` | 2026-10-20 | detail | `3` | Kulturgemeinschaft der Kosovo Bosniaken (ChIJUfZ9MvTbmUcRNMEuZsYsB7w) | `/en/mosque/stuttgart/kulturgemeinschaft-der-kosovo-bosniaken` | `EXISTING_301` ✅ |
| 439 | `/de/moschee/koeln/divan-lebens-und-kulturgemeinschaft-koeln4` | 2026-10-20 | detail | `4` | Divan Lebens- und Kulturgemeinschaft Köln e.V. (ChIJ__8vS6o6v0cRsCTVbKV0zbQ) | `/de/moschee/koeln/divan-lebens-und-kulturgemeinschaft-koeln` | `EXISTING_301` ✅ |
| 440 | `/ar/mosque/berlin/sultan-abdul-hamid-jugend-und-kulturhaus3` | 2026-10-20 | detail | `3` | Sultan Abdul Hamid Jugend und Kulturhaus e.V. (ChIJxYmrsvlTqEcR2gci1qawWhQ) | `/ar/mosque/berlin/sultan-abdul-hamid-jugend-und-kulturhaus` | `EXISTING_301` ✅ |
| 441 | `/de/moschee/berlin/imam-riza-moschee-und-solidaritaetsverein3` | 2026-10-20 | detail | `3` | Imam Riza Moschee und Solidaritätsverein e.V. (ChIJqbUumLtPqEcRXtDHFuTWaX4) | `/de/moschee/berlin/imam-riza-moschee-und-solidaritaetsverein` | `EXISTING_301` ✅ |
| 442 | `/en/mosque/berlin/prayer-rooms-charit-campus-virchow-klinikum3` | 2026-10-20 | detail | `3` | Prayer rooms Charité Campus Virchow-Klinikum (ChIJl_LeozNRqEcRmsv4cFbF_E4) | `/en/mosque/berlin/prayer-rooms-charit-campus-virchow-klinikum` | `EXISTING_301` ✅ |
| 443 | `/en/mosque/essen/islamische-gemeinde-essen-kupferdreh-u-umgebung3` | 2026-10-20 | detail | `3` | Islamische Gemeinde Essen-Kupferdreh u. Umgebung e.V. (ChIJqVLcwHTcuEcR_sY7SGfJ0MI) | `/en/mosque/essen/islamische-gemeinde-essen-kupferdreh-u-umgebung` | `EXISTING_301` ✅ |
| 444 | `/en/mosque/hamburg/yeni-ayasofya-camii-islamische-gemeinde-wilhelmsburg3` | 2026-10-20 | detail | `3` | Yeni Ayasofya Camii islamische Gemeinde Wilhelmsburg (ChIJY5Dw_hqPsUcRbGtkrIRFTXs) | `/en/mosque/hamburg/yeni-ayasofya-camii-islamische-gemeinde-wilhelmsburg` | `EXISTING_301` ✅ |
| 445 | `/ar/mosque/koeln/zentrum-fuer-bildung-und-integration-in-koeln-muelheim-vikz4` | 2026-10-20 | detail | `4` | Zentrum für Bildung und Integration in Köln-Mülheim - VIKZ e.V. (ChIJHc7Emhwmv0cReDiIHyE_II0) | `/ar/mosque/koeln/zentrum-fuer-bildung-und-integration-in-koeln-muelheim-vikz` | `EXISTING_301` ✅ |
| 446 | `/de/moschee/koeln/mevlana-camii-moschee-und-sittenverein-koeln-und-umgebung4` | 2026-10-20 | detail | `4` | Mevlana Camii Moschee und Sittenverein Köln und Umgebung e.V. (ChIJt3bs2Wkmv0cRwlNdBHGl-d8) | `/de/moschee/koeln/mevlana-camii-moschee-und-sittenverein-koeln-und-umgebung` | `EXISTING_301` ✅ |
| 447 | `/en/mosque/munich/foerderverein-der-vikz-gemeinde-in-muenchen-hasenbergl-und-umgebung3` | 2026-10-19 | detail | `3` | Förderverein der VIKZ-Gemeinde in München-Hasenbergl und Umgebung e.V. (ChIJuURmFbB2nkcRoShyUvLgtCk) | `/en/mosque/munich/foerderverein-der-vikz-gemeinde-in-muenchen-hasenbergl-und-umgebung` | `EXISTING_301` ✅ |
| 448 | `/ar/mosque/stuttgart/ulu-camii-moschee-des-landesverbands-der-islamischen-kulturzentren-bw3` | 2026-10-19 | detail | `3` | Ulu Camii - Moschee des Landesverbands der islamischen Kulturzentren BW e.V. (ChIJFev-mCnbmUcRPRTTdyeORWk) | `/ar/mosque/stuttgart/ulu-camii-moschee-des-landesverbands-der-islamischen-kulturzentren-bw` | `EXISTING_301` ✅ |
| 449 | `/en/mosque/munich/dikz-deutsch-islamisches-kulturzentrum-und-moschee-neuperlach3` | 2026-10-19 | detail | `3` | DIKZ Deutsch-Islamisches Kulturzentrum und Moschee Neuperlach (ChIJa0bwK3XgnUcRf4zapo9P6Vo) | `/en/mosque/munich/dikz-deutsch-islamisches-kulturzentrum-und-moschee-neuperlach` | `EXISTING_301` ✅ |
| 450 | `/en/mosque/hamburg/landesverband-slamische-religionsgemeinschaft-ditib-hamburg-und-schleswig-holstein3` | 2026-10-19 | detail | `3` | Landesverband İslamische Religionsgemeinschaft DITIB Hamburg und Schleswig-Holstein e.V. (ChIJR1pfSJ-OsUcRJKqtFg1oHPQ) | `/en/mosque/hamburg/landesverband-slamische-religionsgemeinschaft-ditib-hamburg-und-schleswig-holstein` | `EXISTING_301` ✅ |
| 451 | `/en/mosque/cologne/atib-hodscha-ahmed-yesevi-moschee4` | 2026-10-19 | detail | `4` | ATIB Hodscha-Ahmed-Yesevi-Moschee (ChIJpYIeSk4kv0cRmKZJIFGGODk) | `/en/mosque/cologne/atib-hodscha-ahmed-yesevi-moschee` | `EXISTING_301` ✅ |
| 452 | `/en/mosque/frankfurt/mabin-main-bildungs-integrationsforum3` | 2026-10-19 | detail | `3` | Mabin e.V. (Main Bildungs- & Integrationsforum) (ChIJT_BTSAAMvUcRply8nieVFzI) | `/en/mosque/frankfurt/mabin-main-bildungs-integrationsforum` | `EXISTING_301` ✅ |
| 453 | `/en/mosque/berlin/farhat-pasha-mosque-ikre-berlin3` | 2026-10-19 | detail | `3` | Farhat Pasha Mosque - Ikre Berlin (ChIJNdnNYeVTqEcRCbHsefQBECI) | `/en/mosque/berlin/farhat-pasha-mosque-ikre-berlin` | `EXISTING_301` ✅ |
| 454 | `/en/mosque/hamburg/yeni-beyazit-moschee3` | 2026-10-19 | detail | `3` | Yeni Beyazit Moschee (ChIJm9x6bwCPsUcRIawDz8MZau8) | `/en/mosque/hamburg/yeni-beyazit-moschee` | `EXISTING_301` ✅ |

---

## 6. Implementation Readiness & Final Recommendation

### Final Verdict: **READY TO IMPLEMENT**

1. **Zero Guesswork:** All 454 URLs map deterministically to active, verified canonical endpoints.
2. **Zero Invasiveness:** No wildcard redirects, no regexes, and no bulk homepage redirects are required.
3. **Zero Conflicts:** The existing 74 redirects in `src/data/redirects.json` are preserved 100% without modification, and exactly 380 new rules will complete the coverage to 454 total rules.
4. **Clear 404 Fix:** The blank 404 page diagnosis is independently confirmed with static build and architecture evidence, ready for remediation in the subsequent phase.

*Report compiled strictly in audit-only mode without code modification or deployment.*
