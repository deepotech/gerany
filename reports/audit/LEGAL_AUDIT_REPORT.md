# MoscheeAtlas — Legal Pages Audit Report

**Project:** MoscheeAtlas  
**Domain:** `https://moscheeindernaehe.de`  
**Date:** 2026-10-10  
**Audit Target:** Impressum (`/de/impressum`), Datenschutzerklärung (`/de/datenschutz`), Cookie Consent, Analytics, and Data Processing Architecture  
**Operator Profile:** Natural person (individual), residing in Morocco, operating without a registered legal entity, targeting users in Germany.

---

## 1. Executive Summary & Audit Baseline

This report documents the forensic evaluation of the data processing and legal disclosure implementation for **MoscheeAtlas**.

### Distinctions Made Throughout This Report:
- **Verified Facts:** Directly confirmed in the source code, runtime environment, or network behavior.
- **Unverified Assumptions:** Information that cannot be proven from the codebase alone.
- **Missing Information:** Required operational or legal facts not present in the repository.

---

## 2. Verified Technical Findings

### 2.1 Route Structure & Localization
- **Files:**
  - [`src/lib/routes.ts`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/lib/routes.ts#L13-L19): Defines `getImpressumUrl(locale)` (`/${locale}/impressum`) and `getDatenschutzUrl(locale)` (`/${locale}/datenschutz`).
  - [`src/lib/i18n/index.ts`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/lib/i18n/index.ts): Contains translation dictionaries for `de`, `en`, and `ar`.
  - [`src/app/[locale]/impressum/page.tsx`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/app/[locale]/impressum/page.tsx): Pre-rendered static pages for `/de/impressum`, `/en/impressum`, `/ar/impressum`.
  - [`src/app/[locale]/datenschutz/page.tsx`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/app/[locale]/datenschutz/page.tsx): Pre-rendered static pages for `/de/datenschutz`, `/en/datenschutz`, `/ar/datenschutz`.
  - [`src/components/Footer.tsx`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/components/Footer.tsx#L120-L137): Persistent footer navigation links present on every page across all locales (`Home`, `Berlin`, `Suche`, `Impressum`, `Datenschutz`, `Cookie-Einstellungen`).

### 2.2 Google Analytics & Consent Architecture
- **Files:**
  - [`src/components/CookieConsent.tsx`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/components/CookieConsent.tsx)
  - [`src/app/[locale]/layout.tsx`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/app/[locale]/layout.tsx#L43)
- **Verified Behavior:**
  - Measurement ID: `G-XRV9JC90FT`.
  - **No tracking before consent:** Initial state is `'pending'`. The `<Script src="https://www.googletagmanager.com/gtag/js?id=G-XRV9JC90FT">` tag is **only mounted when `consent === 'accepted'`**.
  - **Rejection works:** Selecting "Nur notwendige (Ablehnen)" stores `'rejected'` in `localStorage` under `moschee_analytics_consent`. No Google script or tracking cookies are loaded.
  - **Equal prominence:** UI displays two equal buttons ("Alle akzeptieren" vs. "Nur notwendige (Ablehnen)").
  - **Persistent revocation:** Clicking "Cookie-Einstellungen" in the footer dispatches `window.dispatchEvent(new CustomEvent('openCookieSettings'))`, allowing reopening the preference modal at any time.
  - **No other cookies:** No server-set cookies, session cookies, or advertising cookies exist on the site.

### 2.3 Client-Side Storage Usage
- **Verified Storage:**
  - `localStorage`: Exactly one key used: `moschee_analytics_consent` (stores `'accepted'` or `'rejected'`).
  - `sessionStorage`: None.
  - `IndexedDB`: None.
  - Server Cookies: None.

### 2.4 Geolocation Processing
- **Files:**
  - [`src/components/HomeHero.tsx`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/components/HomeHero.tsx#L40-L60)
  - [`src/components/SearchClient.tsx`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/components/SearchClient.tsx#L60-L86)
- **Verified Behavior:**
  - Uses browser `navigator.geolocation.getCurrentPosition()`.
  - When allowed by user, coordinates (`lat`, `lng`) are passed client-side to URL parameters (`?lat=...&lng=...`).
  - Haversine distance is calculated client-side in `SearchClient.tsx` against the pre-loaded static mosque dataset (`src/data/mosques.json`).
  - **Zero server transmission:** No POST requests, no server API endpoints receive the coordinates. However, coordinates in URL queries (`?lat=...&lng=...`) could be transmitted in standard HTTP GET access logs to the edge server if requested as document loads.

### 2.5 External Services, Network Requests & Third Parties
- **Hosting / Edge:**
  - Hosted on **Railway** (`Railway Corp.`, San Francisco, USA). Apex IP resolves to Railway edge.
  - Railway server logs process IP address, user agent, request timestamp, and URL path for traffic routing and DDoS protection.
- **Map Tiles:**
  - [`src/components/map/LeafletProvider.tsx`](file:///c:/Users/HP/Desktop/Germany%20Mosque%20Finder/src/components/map/LeafletProvider.tsx#L45-L48):
  - Fetches map tiles from `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` directly from user browsers.
  - Recipient: **OpenStreetMap Foundation** (UK).
- **External Image Thumbnails:**
  - Mosque image thumbnails originate from Google Street View / Google User Content (`https://lh3.googleusercontent.com`, `https://streetviewpixels-pa.googleapis.com`).
  - These are defined in `src/data/mosques.json` and permitted in `next.config.mjs` and OpenGraph metadata. Currently rendered via OpenGraph meta tags on mosque detail pages.
- **Web Fonts:**
  - **Self-hosted / System fonts only:** `globals.css` specifies `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto...`. Zero external Google Fonts CDN calls.
- **Contact Forms & User Input:**
  - **Zero contact forms, zero feedback forms, zero submission forms.** No database mutations or form handlers exist on the public frontend.
- **Advertising & Monetization:**
  - Zero Google AdSense code (`adsbygoogle`), zero affiliate links, zero tracking pixels.

---

## 3. Discrepancies in the Current Legal Notices

1. **Impressum:**
   - Currently includes generic German placeholders:
     - `[Name / Organisation / Betreiber des Onlineangebots]`
     - `[Rechtsform, z.B. Einzelperson / Verein e.V. / UG / GmbH]` -> Must NOT state or imply a corporate entity. Operator is a natural person.
     - `[PLZ und Ort, Deutschland]` -> Operator resides in **Morocco**, not Germany.
     - `[Vorname und Nachname des Vertretungsberechtigten]` -> Not applicable to a solo individual operator.
     - `[Vorname und Nachname]` / `[PLZ und Ort, Deutschland]` under § 18 Abs. 2 MStV.
2. **Datenschutzerklärung:**
   - Mentions `[Name / Organisation des Betreibers]`, `[PLZ und Ort, Deutschland]`.
   - Missing disclosure of **OpenStreetMap Foundation** tile server requests (IP transfer when viewing maps).
   - Missing disclosure of international data transfers to **Morocco** (for operator contact handling) and the **USA / UK** (Railway edge, Google Ireland/USA, OpenStreetMap Foundation UK).
   - Incomplete clarification on URL query transmission during geolocation navigation.

---

## 4. Operator Information Missing (Blockers)

The following information cannot be determined from the codebase and is required from the operator:
1. **Full Legal Name** (First and Last Name) of the individual operator.
2. **Valid Postal Address** in Morocco (Street, Number, Postal Code, City, Country: Morocco).
3. **Contact Email Address** (e.g. `kontakt@moscheeindernaehe.de` or direct personal email).
4. **Telephone Number** (if telephone is provided as an immediate contact channel).

---

## 5. Cross-Border Legal Questions Requiring Professional Review

1. **Applicability of German DDG § 5 to a Moroccan Resident:**
   - Does § 5 Digitale-Dienste-Gesetz (DDG) apply directly to a third-country provider outside the EU targeting German consumers, or does the Moroccan Law No. 09-08 and international private law govern? German case law frequently applies DDG/TMG rules to foreign websites targeting Germany (territoriality principle for telemedia aimed at the German market).
2. **Postal Address & Impressumspflicht:**
   - German DDG § 5 requires a "ladungsfähige Anschrift" (physical summons-eligible address). Whether an individual operator can use a Moroccan address, or if a domestic representative/service address in Germany is needed under consumer protection or media law, requires qualified legal counsel.
3. **§ 18 Abs. 2 MStV (Medienstaatsvertrag):**
   - Applies to telemedia with journalistic/editorial content. A factual geographical directory may be exempt, but legal review should confirm whether a named editorial representative is mandatory.
4. **International Data Transfers under GDPR Chapter V:**
   - Transfer of server logs to Railway (USA) relies on the EU-U.S. Data Privacy Framework (if Railway Corp. is certified) or Standard Contractual Clauses (SCCs).
   - Direct communication with an operator in Morocco entails a transfer of personal data (e.g. emails) to a third country without an adequacy decision under Art. 45 GDPR.

---

## 6. Audit Classification

- **Status:** **NOT READY — REQUIRED INFORMATION MISSING**
- **Blockers:** Operator legal name, postal address, and contact details must be supplied. Placeholder texts must be made explicit and honest without fabricating German entity or residency details.
