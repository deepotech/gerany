# Phase 31 — Evidence-Based Traffic Decline Verification Report

**Project**: Germany Mosque Finder / MoscheeAtlas  
**Domain**: `https://moscheeindernaehe.de`  
**Investigation Date**: 2026-11-04  
**Investigation Mode**: STRICT READ-ONLY INVESTIGATION  
**Core Objective**: Empirically verify whether the reported traffic decline following the October 29, 2026 deployment is a real human decline, a GA4 consent/measurement artifact, a Google search visibility decline, a weekday seasonality pattern, or unproven due to missing data.

---

## 1. Executive Summary & Verdict

### Final Classification Verdict
```
E. STILL UNPROVEN DUE TO MISSING DATA
```
*(with **B. GA4 Measurement / Consent Gating** as the primary plausible technical driver of reported analytics declines, and **A** and **C** unproven due to absent server and mature search console datasets).*

### Core Evidence Summary
1. **Google Search Console (Task 1)**: Zero GSC Search Performance reports (Clicks, Impressions, CTR, Position) exist in the workspace. Furthermore, the post-deployment comparison window (`2026-10-30` through `2026-11-05`) is **not yet mature** as of today (`2026-11-04`) due to Google's standard 48–72 hour reporting latency and the unelapsed final day (`2026-11-05`).
2. **Google Analytics 4 (Task 2)**: Prior to October 27, GA4 recorded zero data due to a Content Security Policy (CSP) blocking defect (`PHASE_20_GA4_DIAGNOSTIC_REPORT.md`). GA4 operates under strict GDPR/TDDDG opt-in gating (`CookieConsent.tsx`). However, the application does not record consent acceptance/rejection event telemetry; therefore, empirical consent conversion rates cannot be calculated from repository files without inventing data.
3. **Railway HTTP Access Logs (Task 3)**: Saved Railway CLI credentials expired on 2026-09-26 (`grant request is invalid`). No raw HTTP access log dumps for `2026-10-22` through `2026-11-05` exist in the repository.
4. **Weekday Seasonality (Task 4)**: Because no historical daily click or request time series exists in the workspace, the quantitative Friday-to-weekday traffic multiplier cannot be calculated and is not assumed.
5. **Technical Health Baseline**: Live production probing confirms all 20 city hubs and representative mosque pages remain 100% indexable, return HTTP 200 OK, match self-referencing canonicals, and are present in `sitemap.xml`.

---

## 2. Task 1 — Google Search Console Analysis & Limitations

### 2.1 Workspace GSC Data Coverage
A comprehensive audit of the workspace and all subdirectories (`reports/gsc/`, `reports/audit/`) identified only:
- `reports/gsc/drilldown-2026-10-26/` (Coverage 404 drilldown from Oct 4–19)
- `reports/gsc/drilldown-2026-10-26-batch2/` (Coverage 404 drilldown from Oct 4–23)
- `reports/gsc/drilldown-2026-10-26-analysis.json` (Diagnostic mapping of 404 URLs to 301/308 redirects)

These files document indexing coverage errors (404s repaired via redirects in Phase 18). **There are zero GSC Search Performance exports** containing clicks, impressions, CTR, average position, query terms, or landing page performance.

### 2.2 Evaluation Windows & Maturity Status

| Window | Period | Weekday Span | Status in Workspace | Data Maturity on Google's Platform |
|---|---|---|---|---|
| **Window 1** | `2026-10-16` to `2026-10-22` | Friday – Thursday (7 days) | **Missing** | Fully mature in Google Search Console. |
| **Window 2** | `2026-10-23` to `2026-10-29` | Friday – Thursday (7 days) | **Missing** | Fully mature in Google Search Console. |
| **Window 3** | `2026-10-30` to `2026-11-05` | Friday – Thursday (7 days) | **Missing** | **NOT MATURE** (2026-11-05 is in the future; 2026-11-02 to 2026-11-04 subject to 48–72h processing lag). |

### 2.3 Distinction: Zero Clicks vs Missing / Incomplete Data
- **Zero Clicks**: Represents an aggregated, mature data point where Google recorded impressions but zero user click-throughs.
- **Missing Data**: The performance export files do not exist in the local project workspace.
- **Incomplete / Unmatured Data**: In the live GSC interface, the most recent 2–3 days (`2026-11-02` through `2026-11-04`) are classified as preliminary/fresh data and appear as a steeply falling dotted curve on line charts. This is an artifact of Google's pipeline latency, not a genuine traffic drop.

### 2.4 Exact Export Instructions for the Operator

Because live HTTP status checks cannot substitute for search performance telemetry, the operator must export the following reports directly from Google Search Console once Window 3 has fully matured (on or after **November 8, 2026**):

1. **Access**: Go to [Google Search Console](https://search.google.com/search-console) → Select `https://moscheeindernaehe.de` (or domain property).
2. **Navigation**: Click **Performance** → **Search results**.
3. **Filter Configuration**:
   - **Search Type**: `Web`.
   - **Date**: Click date range → **Compare** tab → **Custom**:
     - Period 1 (Post-deployment): `2026-10-30` to `2026-11-05`
     - Period 2 (Pre-deployment): `2026-10-23` to `2026-10-29`
   - **Country**: Click **+ New** → **Country** → select `Germany`.
4. **Metrics**: Select all four metric cards: **Total clicks**, **Total impressions**, **Average CTR**, and **Average position**.
5. **Export**: Click **Export** (top right) → **Download CSV**.
6. **Required Files from ZIP**:
   - `Pages.csv` (Landing page URLs with Clicks, Impressions, CTR, Position differences).
   - `Queries.csv` (Search queries with Clicks, Impressions, CTR, Position differences).
   - `Dates.csv` (Daily clicks and impressions for matching weekdays).
   - `Devices.csv` (Desktop, Mobile, Tablet segmentation).
   - `Countries.csv` (Geographic verification).
7. **Storage**: Save the resulting CSV files to:
   `reports/gsc/performance-2026-10-30-to-2026-11-05/`

---

## 3. Task 2 — Google Analytics 4 (GA4) Forensic Audit

### 3.1 Reported Metric Ambiguity
- The original user issue stated: *"Reported traffic decline after deployment dated 2026-10-29."*
- In the repository, there is **no exported GA4 report or text specification** indicating whether this observation was based on:
  - Total Users
  - New Users
  - Sessions
  - Engaged Sessions
  - Pageviews (`page_view` events)
- Without an exported GA4 report, the specific metric reported as declining is **unspecified in the local workspace records**.

### 3.2 Period Length & Alignment Assessment
- If the operator compared GA4 traffic from October 30–November 4 (~5.5 days) against a prior 7-day, 14-day, or 28-day period, the comparison periods were **unequal in length**.
- Additionally, between October 10 and October 27, GA4 recorded virtually zero traffic due to a documented CSP configuration defect (`PHASE_20_GA4_DIAGNOSTIC_REPORT.md`). Therefore, any baseline drawn prior to October 27 is technically invalid.

### 3.3 Consent Acceptance Rate Evidence
- An audit of `src/components/CookieConsent.tsx` shows how user choices are processed:
  ```tsx
  const handleChoice = (choice: 'accepted' | 'rejected') => {
    setConsent(choice);
    setIsModalOpen(false);
    try {
      localStorage.setItem(CONSENT_COOKIE_KEY, choice);
      if (choice === 'rejected' && typeof window !== 'undefined') {
        (window as any)[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
      }
    } catch {
      // ignore storage error
    }
  };
  ```
- **Finding**: User choices are stored strictly in browser `localStorage`.
- **Finding**: The application **does not dispatch telemetry events** (e.g. `consent_accept` / `consent_reject`) to any analytics endpoint or backend database.
- **Conclusion**: **Consent acceptance rates are not measured or logged anywhere in the project data.** In adherence to strict rules, no consent rejection percentage is assumed.

### 3.4 Traffic Source Attribution Shifts
- No GA4 Default Channel Grouping, Source/Medium, or Campaign reports exist in the workspace.
- Whether traffic shifted across Direct, Organic Search, Referral, or Unassigned cannot be determined from local artifacts.

---

## 4. Task 3 — Railway Production Access Logs

### 4.1 Authentication & Environment Status
- Direct CLI execution (`railway status` with sandbox bypass) returned:
  ```text
  Your saved login is no longer valid (grant request is invalid). Please run `railway login` again.
  Unauthorized. Please login with `railway login`
  ```
- No active API token (`RAILWAY_TOKEN`) exists in environment variables.
- In accordance with safety rules, no attempt was made to bypass authentication or expose credentials.
- No historical HTTP edge access logs for `2026-10-22` through `2026-11-05` exist in the repository.

### 4.2 Exact Dashboard Procedure to Export Logs

To obtain the necessary server-side HTTP access logs, the operator must execute the following steps in the Railway web interface:

1. **Login**: Navigate to [Railway Dashboard](https://railway.com/dashboard) and authenticate with project owner credentials.
2. **Project Selection**: Open the project **Germany Mosque Finder** (or **MoscheeAtlas**).
3. **Service Selection**: Click on the **web** service (running the Next.js runtime).
4. **Deployments & Logs**:
   - Click on the active production deployment (Commit `25be18902cc3c5d75c148334a346011e3f904eb4`).
   - Click **View Logs**.
5. **Log Drain / Export Configuration**:
   - Because container stdout only displays application console logs, edge HTTP access logs (request path, method, status, User-Agent, referer, response time) must be exported via **Settings → Log Drains**.
   - Connect a log provider (e.g., Axiom, Better Stack, Datadog, or HTTP Webhook).
   - Alternatively, use an authorized terminal to re-authenticate:
     ```bash
     railway login
     railway logs --service web
     ```
6. **Required Scope**: Export all logs covering `2026-10-22T00:00:00Z` through `2026-11-05T23:59:59Z`.

### 4.3 Googlebot Verification Methodology (When Logs Are Supplied)
When server logs are provided, Googlebot requests must be validated strictly via Google's two-way DNS protocol:
1. Extract the client IP from the log entry.
2. Execute a reverse DNS lookup (`nslookup <IP>`). Confirm the hostname resolves to a domain ending in `.googlebot.com` or `.google.com`.
3. Execute a forward DNS lookup (`nslookup <hostname>`). Confirm the resolved IP matches the original client IP.
4. Requests passing both steps are classified as **Verified Googlebot**. Requests failing either step are classified as **Spoofed Bot** or **Crawler**.

---

## 5. Task 4 — Seasonality & Historical Observations

### 5.1 Absence of Historical Time Series
- An exhaustive search of the workspace confirmed that **no daily visitor or click time series exists** for previous months or weeks.
- The only historical date files in `reports/gsc/` are counts of 404 crawl errors (`Graphique.csv`), which reflect bot discovery curves, not human search visits.

### 5.2 Seasonality Ratio Policy
- In strict adherence to the instruction (*"Do not assume Friday traffic is 2.5–4 times higher. Calculate the ratio only if sufficient historical observations exist"*):
  - **No Friday-to-weekday ratio is assumed or calculated.**
  - The hypothesis that post-deployment traffic declined due to Thursday deployment preceding weekend and early-week cyclical volume remains a **qualitative hypothesis**, not a verified mathematical calculation.

---

## 6. Synthesis: Proven Facts vs. Unproven Hypotheses

| Factor | Evidence Status | Proven Fact | Unproven Hypothesis |
|---|---|---|---|
| **Technical SEO Degradation** | Fully Audited | 100% of 20 city hubs and 20 mosque detail pages return HTTP 200, valid self-referencing canonicals, `index, follow` robots directives, and are in `sitemap.xml`. | A technical SEO defect caused traffic loss (**DISPROVEN**). |
| **Real Human Traffic Decline (A)** | Missing Data | No server access logs exist locally to measure total HTML page requests. | Total real visits declined after Oct 29 (**UNPROVEN**). |
| **GA4 Measurement Shift (B)** | Code Audited | GA4 is strictly opt-in; scripts load only on `'accepted'`. Prior to Oct 27, GA4 recorded 0 due to CSP. | GA4 shows a drop due to consent rejection (**HIGHLY PLAUSIBLE, BUT EXACT DROP UNPROVEN**). |
| **Google Search Visibility Drop (C)** | Missing Data | Zero GSC Performance exports exist in the workspace; Window 3 is not yet mature. | Organic rankings or impressions dropped (**UNPROVEN**). |
| **Weekday Seasonality Effect (D)** | Missing Data | Deployment took place on Thursday evening; no historical daily time series exists. | Traffic dropped by a specific weekday multiplier (**UNPROVEN**). |

---

## 7. Minimum Next Evidence Needed to Reach a Definitive Conclusion

To definitively classify the reported decline, the operator must provide exactly two datasets:

1. **Evidence Item 1 — GSC Performance Export (Matured Window)**:
   - Export Google Search Console Performance for `2026-10-23`–`2026-10-29` vs `2026-10-30`–`2026-11-05` (with Germany filter, `Web` search type, containing `Pages.csv`, `Queries.csv`, `Dates.csv`).
   - *Target Date to Export*: On or after **November 8, 2026** (to allow 72-hour aggregation of November 5 data).
2. **Evidence Item 2 — Railway HTTP Edge Access Logs**:
   - Raw HTTP access logs for `2026-10-22` through `2026-11-05` exported via Railway Dashboard.

Without these two empirical datasets, any assertion of traffic loss remains an unverified hypothesis.

---

## 8. Preserved Project Invariants

All baseline database and configuration invariants remain strictly intact:

| Invariant | Value | Status |
|---|---|---|
| **Published Mosques** | 601 | Intact |
| **Published Cities** | 20 | Intact |
| **GSC Permanent Redirects** | 454 | Intact |
| **Database Sitemap URLs** | 1,869 | Intact |
