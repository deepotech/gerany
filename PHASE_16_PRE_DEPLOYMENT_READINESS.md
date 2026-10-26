# Phase 16 — Pre-Deployment Readiness Review

**Project:** MoscheeAtlas  
**Domain:** `https://moscheeindernaehe.de`  
**Directory:** `C:\Users\HP\Desktop\Germany Mosque Finder`  
**Execution Date:** 2026-10-26  
**Scope:** Read-only. No code, data, configuration, or redirects changed. No commit, push, or deployment performed.

---

## 1. Repository State

### 1.1 Branch and Remote

| Item | Value |
|---|---|
| **Branch** | `main` |
| **Remote origin** | `https://github.com/deepotech/gerany.git` |
| **Upstream sync** | `Your branch is up to date with 'origin/main'` |
| **Last committed SHA** | `10802d8` — *feat: add legal pages (Impressum & Datenschutz), cookie consent, nearby mosques, and i18n improvements* |
| **Commit count** | 5 commits total on `main` |

### 1.2 Uncommitted Working Tree

All application and data changes since the initial commit are **unstaged and uncommitted**. This is the defining deployment prerequisite: **nothing in the working tree has been pushed to `origin/main`**.

**20 modified tracked files** (all accumulated across phases 8–15F/15A):

| File | Nature of Change |
|---|---|
| `next.config.mjs` | Phase 15A: redirect loader + `experimental.cpus:1` |
| `src/data/mosques.json` | Phases 8–14F: 601 published records (+5,443 lines) |
| `src/data/all-entities.json` | Phases 8–14F: full entity registry 661 records (+6,154 lines) |
| `src/data/city-registry-overrides.json` | Phases 8–14F: 20 published cities |
| `src/pipeline/city-config.ts` | Phases 8–14F: full city configuration (+166 lines) |
| `src/pipeline/city-registry.ts` | Phases 8–14F: city registry logic (+212/−46 lines) |
| `src/pipeline/classify.ts` | Phase improvements (+16 lines) |
| `src/pipeline/normalize.ts` | Phase improvements (+47/−11 lines) |
| `src/pipeline/runner.ts` | Phase improvements (+17/−5 lines) |
| `src/pipeline/translations.ts` | Phase improvements (+19 lines) |
| `src/app/[locale]/mosques/[city]/page.tsx` | Phase improvements (+11 lines) |
| `src/components/MosqueDetailView.tsx` | Phase improvements (+11 lines) |
| `reports/audit/production-audit-events.jsonl` | Audit log (+87 lines) |
| 7 test files | Baseline updates for 601 records and 20 cities |

**Key new untracked files required for production:**
- `src/data/redirects.json` — 74 GSC 404 repair redirects (Phase 15A)
- `tests/phase15a_gsc_404_repair.test.ts` — regression tests for redirects

> [!IMPORTANT]
> **None of these changes exist on `origin/main`**. The remote branch is 5 commits behind the current working tree content. The deployment must include all 20 modified files plus `src/data/redirects.json` as a minimum.

---

## 2. Cross-Check with Phase 15A/15B/15C Reports

All three reports were verified against the **live working tree** as of this phase. No discrepancies found:

| Metric | Phase 15A/B/C Claimed | Current Working Tree | Match? |
|---|:---:|:---:|:---:|
| Published mosques | 601 | 601 | ✅ |
| Total entities | 661 | 661 | ✅ |
| Published cities | 20 | 20 | ✅ |
| Sitemap URLs | 1,869 | 1,869 | ✅ |
| Prerendered SSG pages | 1,885 | 1,885 | ✅ |
| Configured redirects | 74 | 74 | ✅ |
| Redirect wire status | 308 Permanent | 308 Permanent | ✅ |
| Quarantined records | 60 (53 REVIEWED, 7 REJECTED) | 60 | ✅ |
| Test suite | 308/308 passed | 308/308 passed | ✅ |

---

## 3. Environment and Hosting Requirements

### 3.1 Hosting Platform

Based on `DOMAIN_MIGRATION_ENV.md` and `DOMAIN_MIGRATION_NOTES.md`:

**Target platform: Railway**  
Project: **Germany Mosque Finder / MoscheeAtlas**

### 3.2 Environment Variables

| Variable | Required? | Default (if omitted) | Production Value |
|---|:---:|---|---|
| `NEXT_PUBLIC_SITE_URL` | **Optional** | `https://moscheeindernaehe.de` (hardcoded in `src/lib/config.ts`) | `https://moscheeindernaehe.de` |
| `DATABASE_URL` | **Declared in schema but NOT used at runtime** | — | Not needed (see §3.4) |

> [!NOTE]
> `NEXT_PUBLIC_SITE_URL` is the only application-level variable. It is optional with a safe hardcoded fallback. No secrets, tokens, or API keys are required by the production application.

**No `.env` files exist** in the repository. The application runs correctly without any `.env` configuration for the JSON-backed production mode.

### 3.3 Key Confirmed Facts About `NEXT_PUBLIC_SITE_URL`

- Default value `https://moscheeindernaehe.de` is hardcoded at `src/lib/config.ts` line 7.
- Confirmed at runtime: `SITE_URL: https://moscheeindernaehe.de` (tested without any env variable set).
- Used by: robots.ts, sitemap.ts, layout.tsx `metadataBase`, JSON-LD schemas, and all canonical/hreflang tag generation.

### 3.4 Database — Critical Architecture Finding

> [!IMPORTANT]
> **The production application does NOT use a database at runtime.** Despite Prisma being listed as a dependency and `prisma/schema.prisma` declaring a PostgreSQL schema, the active runtime backend is `JsonMosqueRepository` (confirmed: `Repo type: JsonMosqueRepository`).
>
> The `getMosqueRepository()` function in `src/lib/db/index.ts` unconditionally instantiates `JsonMosqueRepository`, reading from `src/data/mosques.json` and `src/data/all-entities.json` at build time (SSG). **No `DATABASE_URL` is required for production.**
>
> Prisma and its client are installed as dependencies but are not invoked in the SSG path. The schema exists as a historical artefact of a planned future migration. It does not need to be configured, provisioned, or migrated for this deployment.

### 3.5 Google Analytics

GA tag `G-XRV9JC90FT` is embedded in the root layout (`src/app/layout.tsx` via `next/script`). This is active on production and does not require any environment variable.

### 3.6 Google Search Console Verification

The Google Site Verification token (`gn8N5OcGt0pLLpTALghRPXtJj31NPHB2UiK0uCZYCSI`) is embedded in the root layout metadata. No env variable required.

---

## 4. Build Output, Routes, and Redirects

### 4.1 Production Build Status

`npm run build` — exit code **0** (verified Phase 15B/15C)
- **1,885 static pages** prerendered via SSG
- **0 TypeScript errors**, **0 ESLint errors**
- Compiled output: `.next/`

### 4.2 Route Structure

| Route Pattern | Type | Locales | Count |
|---|---|---|---|
| `/[locale]` | SSG | de, en, ar | 3 |
| `/[locale]/moscheen` / `/[locale]/mosques` | SSG | de, en, ar | 3 |
| `/[locale]/moscheen/[city]` / `/[locale]/mosques/[city]` | SSG | de (20) + en (20) + ar (20) | 60 |
| `/[locale]/moschee/[city]/[slug]` (DE) | SSG | de | 601 |
| `/[locale]/mosque/[city]/[slug]` (EN+AR) | SSG | en, ar | 1,202 |
| `/[locale]/impressum`, `/[locale]/datenschutz` | SSG | de, en, ar | 6 |
| `/[locale]/admin` | SSG (protected) | de, en, ar | 3 |
| `/robots.txt`, `/sitemap.xml` | Dynamic | — | 2 |
| `/` (root) | Static redirect shell | — | 1 |

**Total: 1,885 prerendered pages** ✅

### 4.3 Redirects in Production Manifest

From `.next/routes-manifest.json`:
- **75 total redirects** in manifest
- **1 internal** (Next.js trailing-slash normalizer: `/:path+/` → `/:path+`, status 308)
- **74 application** (Phase 15A GSC 404 repair, all status **308 Permanent**)
- **0 wildcard or regex rules** — all are exact literal path matches

### 4.4 `experimental.cpus: 1` — Deployment Risk Flag

> [!WARNING]
> `next.config.mjs` contains `experimental: { cpus: 1 }`. This was added during Phase 15A to work around a Windows `EPERM` build issue. On Railway (Linux), this **unnecessarily caps the build worker count to 1**, significantly slowing multi-CPU build environments.
>
> **Recommendation before deployment:** Remove this setting for production builds on Railway. It was a local Windows-only workaround and provides no benefit on Linux containers. Verify that `npm run build` still succeeds without it before committing.
>
> This is a **pre-commit fix**, not a blocker if the build is confirmed clean after removal.

### 4.5 Sitemap and robots.txt

Both use `SITE_URL` from `src/lib/config.ts`, defaulting to `https://moscheeindernaehe.de`.

- **sitemap.xml**: Generates 1,869 canonical URLs — all published mosques × 3 locales, all city pages × 3 locales, and homepage/search-hub pages. No quarantined or unpublished records included.
- **robots.txt**: Allows all crawlers on `/`, disallows `/*/admin`, `/admin`, `/api/`, and paginated/query-param paths. References `https://moscheeindernaehe.de/sitemap.xml`.

---

## 5. SEO and Multilingual Configuration

### 5.1 Canonical URLs and hreflang

- All 601 mosque detail pages emit correct `<link rel="canonical">` tags and bidirectional `<link rel="alternate" hreflang="de|en|ar|x-default">`.
- Verified by Phase 15B/15C SSG file checks: 74/74 destination pages with correct metadata.
- `metadataBase` is set to `new URL(SITE_URL)` in `src/app/layout.tsx`, ensuring all Next.js-generated canonical and OG URLs use the correct production domain.

### 5.2 City Slug Conventions

| City | German Route | English Route | Arabic Route |
|---|---|---|---|
| Köln | `/de/moscheen/koeln` | `/en/mosques/cologne` | `/ar/mosques/koeln` |
| München | `/de/moscheen/muenchen` | `/en/mosques/munich` | `/ar/mosques/muenchen` |
| Nürnberg | `/de/moscheen/nuernberg` | `/en/mosques/nuremberg` | `/ar/mosques/nuernberg` |
| Münster | `/de/moscheen/muenster` | `/en/mosques/muenster` | `/ar/mosques/muenster` |

### 5.3 `www` Subdomain Handling

> [!WARNING]
> **No in-app `www` → apex redirect is configured** in `next.config.mjs` or middleware. Requests to `https://www.moscheeindernaehe.de` will **not** be automatically redirected to `https://moscheeindernaehe.de` by the application.
>
> This must be handled at the DNS/Railway domain configuration level before going live:
> - Configure Railway (or Cloudflare) to add `www.moscheeindernaehe.de` as an alias and redirect it to the apex domain via a 301/308.
> - If using Cloudflare: add both the apex and `www` as custom domains, and create a redirect Page Rule or Redirect Rule for `www` → apex.

### 5.4 Legacy Domain (`moscheeatlas.de`) Migration

Per `DOMAIN_MIGRATION_NOTES.md`, the old domain `moscheeatlas.de` is not yet redirecting to `moscheeindernaehe.de`. The recommended approach (Option A) is a DNS-level wildcard redirect at the registrar/Cloudflare level. This is a post-deployment action, not a blocker.

---

## 6. Backup and Rollback Strategy

### 6.1 Current Backup Points

| Asset | Backup Location | Risk if Lost |
|---|---|---|
| Source code | `https://github.com/deepotech/gerany.git` (`main` branch, 5 commits) | **HIGH** — but working tree is 12,000+ lines ahead of `main` |
| Published data (`mosques.json`, `all-entities.json`) | Only in working tree — **not committed** | **CRITICAL** — 601 published mosque records would be lost |
| Redirect rules (`redirects.json`) | Only in working tree — **not committed** | HIGH — 74 GSC 404 repair rules |
| City config (`city-config.ts`, `city-registry-overrides.json`) | Only in working tree — **not committed** | HIGH — 20 city publication configuration |

> [!CAUTION]
> **The working tree is the only copy of all production data and configuration.** If the local machine fails before a commit and push, all 12,000+ lines of phase work (601 published mosques, 20 cities, 74 redirects, all pipeline improvements) would be irretrievably lost. **Committing and pushing to `origin/main` is itself the primary backup action.**

### 6.2 Rollback Plan (Post-Deployment)

If a deployment causes issues:

1. **Railway instant rollback**: Railway retains the previous deployment snapshot. Use **Rollback to previous deployment** in the Railway dashboard (available within the deployment history).
2. **Git revert**: Since the working tree will be committed before deployment, a `git revert HEAD` followed by a redeploy restores the prior state.
3. **Data safety**: `mosques.json` and `all-entities.json` are SSG — no database to roll back. Reverting the commit restores the exact data state.

---

## 7. Pre-Deployment Checklist

### BLOCKING — Must Be Resolved Before Deployment

- [ ] **P1 · Commit all working tree changes to `main`**  
  Stage and commit all 20 modified tracked files, plus `src/data/redirects.json` and `tests/phase15a_gsc_404_repair.test.ts`. This is both the deployment action and the primary data backup.  
  *Suggested commit message:* `feat(production): phases 8–15A — 601 published mosques, 20 cities, GSC 404 redirects, Münster promotion`

- [ ] **P2 · Remove `experimental: { cpus: 1 }` from `next.config.mjs`**  
  This setting was a Windows-only build workaround. Confirm `npm run build` passes without it, then include the fix in the commit. If build fails without it, investigate the root cause before deploying.

- [ ] **P3 · Push committed changes to `origin/main` (`github.com/deepotech/gerany`)**  
  Railway CI/CD triggers from the `main` branch. Without a push, no Railway deployment can be initiated.

- [ ] **P4 · Configure Railway custom domain for `moscheeindernaehe.de`**  
  In Railway dashboard → Project → Settings → Domains: add `moscheeindernaehe.de`. Wait for SSL provisioning (Let's Encrypt / Railway-managed).

- [ ] **P5 · Configure Railway `www.moscheeindernaehe.de` → apex redirect**  
  Either add `www.moscheeindernaehe.de` in Railway domains and configure a redirect, or handle at DNS/Cloudflare level (recommended).

- [ ] **P6 · Verify Railway build succeeds on Linux with Node ≥ 18**  
  The first Railway deploy will build on a Linux container. Confirm the build log shows `✓ Generating static pages (1885/1885)` and exits 0.

### RECOMMENDED — Before or Shortly After Go-Live

- [ ] **P7 · Set `NEXT_PUBLIC_SITE_URL=https://moscheeindernaehe.de` in Railway Variables**  
  Optional but explicit. Currently unnecessary because the hardcoded default is correct. Setting it explicitly prevents any future config drift.

- [ ] **P8 · Submit sitemap in Google Search Console**  
  After DNS resolves: submit `https://moscheeindernaehe.de/sitemap.xml` in the GSC property for `moscheeindernaehe.de`.

- [ ] **P9 · Trigger "Validate Fix" in GSC Coverage Drilldown**  
  Once the site is live and the 74 redirects are active, click **Validate Fix** in the GSC Coverage → Not Found (404) issue report to expedite recrawling.

- [ ] **P10 · Configure legacy domain redirect (`moscheeatlas.de` → `moscheeindernaehe.de`)**  
  At the registrar or Cloudflare level, set up permanent wildcard redirects for all traffic on `moscheeatlas.de` and `www.moscheeatlas.de`.

- [ ] **P11 · Use GSC Change of Address tool**  
  Under the old `moscheeatlas.de` GSC property, submit a Change of Address to `moscheeindernaehe.de` to accelerate Google's domain migration recognition.

### INFORMATIONAL — Verified, No Action Required

- [x] **No `.env` or secrets required** — application runs with hardcoded defaults
- [x] **No database provisioning required** — `JsonMosqueRepository` reads from bundled JSON at build time
- [x] **No `DATABASE_URL` needed** — Prisma schema exists but is not used in the SSG path
- [x] **Google Analytics (`G-XRV9JC90FT`) embedded** — activates automatically on deployment
- [x] **GSC verification token embedded** — no DNS TXT record needed for in-app verification
- [x] **308/301 redirect semantics** — Google Search Console treats HTTP 308 identically to 301 for crawl and index purposes
- [x] **Arabic RTL support** — `dir="rtl"` applied in locale layout for `ar` locale
- [x] **robots.txt disallows admin and API routes** — correct configuration

---

## 8. Verified Facts vs. Assumptions

### Verified Facts (evidence in repository)
- Application runs on Next.js 14, SSG-only, no database at runtime
- All 74 redirects emit HTTP 308 from `next start`
- Hosting target is Railway (`DOMAIN_MIGRATION_ENV.md`, `DOMAIN_MIGRATION_NOTES.md`)
- No `.env` files required; `NEXT_PUBLIC_SITE_URL` defaults correctly
- 1,885 static pages build cleanly on Windows
- All 308/308 tests pass; 0 TypeScript errors; 0 lint errors

### Assumptions (unverified without Railway access)
- Railway is actively provisioned for this project and accessible
- A Railway service and project named "Germany Mosque Finder / MoscheeAtlas" exists
- The Railway deployment will build successfully on Linux (identical to Windows build output is expected but not guaranteed)
- DNS for `moscheeindernaehe.de` points to Railway or will be updated post-deployment
- No third-party services (email, image CDN beyond Google Maps) require additional env variables

### Unresolved (requires manual confirmation)
- Whether the Railway project/service already has a deployment configured or requires initial setup
- Current DNS provider for `moscheeindernaehe.de` (Cloudflare, registrar, or other)
- Whether `www.moscheeindernaehe.de` DNS record exists
- Whether `moscheeatlas.de` DNS currently points anywhere relevant

---

## Final Verdict

> **INCOMPLETE — HOSTING OR ENVIRONMENT DETAILS MISSING**

The **application code, data, and redirects are fully production-ready** and verified across Phases 15A, 15B, and 15C. All automated checks pass. The build is clean. The 74 GSC redirects are correct.

However, deployment cannot proceed until:

1. **All working tree changes are committed and pushed to `origin/main`** (P1–P3). No Railway deployment can pick up uncommitted local changes.
2. **The Railway domain configuration is set up** (P4–P5). Domain, SSL, and www-to-apex redirect are unverified because they require Railway dashboard access.
3. **The `experimental: { cpus: 1 }` build flag is removed** (P2) before committing.

Once P1–P6 are completed by the operator and the Railway build succeeds, the deployment status can be upgraded to **READY FOR MANUAL DEPLOYMENT APPROVAL**.
