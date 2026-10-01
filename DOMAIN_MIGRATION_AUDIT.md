# Domain Migration Audit: MoscheeAtlas → moscheeindernaehe.de

**Execution Timestamp:** 2026-10-01T20:53:00Z  
**Old Domain:** `https://moscheeatlas.de`  
**New Domain:** `https://moscheeindernaehe.de`  
**Status:** Audit Complete — Pre-Implementation Baseline Verified  

---

## 1. Executive Summary & Architecture Analysis

The repository uses a highly centralized architecture for site URLs, metadata, and sitemaps:
- The single source of truth for site URL is `src/lib/config.ts` (`SITE_URL` initialized from `process.env.NEXT_PUBLIC_SITE_URL || 'https://moscheeatlas.de'`).
- The root layout (`src/app/layout.tsx`) sets Next.js `metadataBase: new URL(SITE_URL)`.
- All page-level `alternates.canonical` and `alternates.languages` (hreflang) use relative routes (`/de`, `/en`, `/ar`, `/de/moscheen/...`, `/en/mosques/...`), which Next.js automatically resolves against `metadataBase` to construct fully-qualified canonical and hreflang URLs.
- The sitemap generator (`src/app/sitemap.ts`) constructs all 1,674 canonical sitemap URLs using `baseUrl = SITE_URL`.
- The robots generator (`src/app/robots.ts`) specifies the sitemap declaration using `${baseUrl}/sitemap.xml`.
- Structured data generators (`src/lib/seo/schema.ts`) use `siteUrl: string = SITE_URL` as a default parameter to produce absolute JSON-LD schema IDs and URLs.
- Security headers and CSP configuration in `next.config.mjs` use origin keywords (`'self'`) and broad HTTPS sources (`https:`, `blob:`, `data:`), with no hardcoded domain strings.

Therefore, the core runtime domain migration requires updating `src/lib/config.ts`, alongside visible domain text in UI/i18n strings, test assertions, and audit/management scripts.

---

## 2. Complete Inventory of Old-Domain References

### Category A: Core Application & Production Source (`src/`)

| File Path | Line(s) | Context / Code Snippet | Purpose | Action | Rationale |
|---|---|---|---|---|---|
| `src/lib/config.ts` | 7 | `process.env.NEXT_PUBLIC_SITE_URL \|\| 'https://moscheeatlas.de'` | Fallback site URL if env variable is absent | **CHANGE** | Migrate default to `'https://moscheeindernaehe.de'`. |
| `src/lib/config.ts` | 9 | `export const SITE_NAME = 'MoscheeAtlas.de';` | Site brand name constant | **CHANGE** | Update to `'MoscheeAtlas'` (brand preserved, domain suffix removed). Add `SITE_DOMAIN = 'moscheeindernaehe.de'`. |
| `src/lib/i18n/index.ts` | 127 | `homeTitle: 'MoscheeAtlas.de – Finde eine Moschee in deiner Nähe'` | German home page meta title | **CHANGE** | Update to `'MoscheeAtlas – Finde eine Moschee in deiner Nähe'`. |
| `src/lib/i18n/index.ts` | 191 | `homeTitle: 'MoscheeAtlas.de – Find a Mosque Near You in Germany'` | English home page meta title | **CHANGE** | Update to `'MoscheeAtlas – Find a Mosque Near You in Germany'`. |
| `src/lib/i18n/index.ts` | 255 | `homeTitle: 'MoscheeAtlas.de – ابحث عن أقرب مسجد إليك في ألمانيا'` | Arabic home page meta title | **CHANGE** | Update to `'MoscheeAtlas – ابحث عن أقرب مسجد إليك في ألمانيا'`. |
| `src/components/Header.tsx` | 44 | `<span ...>MoscheeAtlas.de</span>` | Brand header text | **CHANGE** | Update to `MoscheeAtlas` (brand name preserved without old domain extension). |
| `src/components/Footer.tsx` | 24 | `<span ...>MoscheeAtlas.de</span>` | Brand footer text | **CHANGE** | Update to `MoscheeAtlas`. |
| `src/components/Footer.tsx` | 107 | `&copy; {new Date().getFullYear()} MoscheeAtlas.de.` | Copyright notice | **CHANGE** | Update to `&copy; {new Date().getFullYear()} MoscheeAtlas.` |
| `src/app/layout.tsx` | 27 | `authors: [{ name: 'MoscheeAtlas Team' }]` | Metadata author tag | **UNCHANGED** | Brand name "MoscheeAtlas" is unchanged; no domain extension is referenced. |

---

### Category B: Test Suites (`tests/`)

| File Path | Line(s) | Context / Code Snippet | Purpose | Action | Rationale |
|---|---|---|---|---|---|
| `tests/phase1_5_audit.test.ts` | 114–116 | `sitemapUrls.has('https://moscheeatlas.de/de/moschee/...')` | Asserts unpublished records not in sitemap | **CHANGE** | Update domain to `https://moscheeindernaehe.de`. |
| `tests/phase1_5_audit.test.ts` | 131–133 | `urls.filter((u) => u === 'https://moscheeatlas.de/de/moschee/...')` | Asserts exact 1 match per locale in sitemap | **CHANGE** | Update domain to `https://moscheeindernaehe.de`. |
| `tests/phase2b_seo.test.ts` | 3, 7, 57 | Comment header & test description | Test documentation | **CHANGE** | Update descriptions to reflect new canonical domain. |
| `tests/phase2b_seo.test.ts` | 58–62 | `it('2. SITE_URL default resolves to moscheeatlas.de', ...)` | Asserts `SITE_URL` default value | **CHANGE** | Update assertion to expect `'https://moscheeindernaehe.de'`. |
| `tests/phase5b.test.ts` | 179, 182 | `it('all sitemap URLs start with https://moscheeatlas.de', ...)` | Asserts sitemap URL prefix | **CHANGE** | Update to assert `https://moscheeindernaehe.de/`. |
| `tests/phase5b.test.ts` | 194–196 | `urls.has('https://moscheeatlas.de/de/moschee/...')` | Asserts 3 localized URLs per mosque in sitemap | **CHANGE** | Update to `https://moscheeindernaehe.de/...`. |
| `tests/phase6.test.ts` | 85 | `sitemapUrls.has('https://moscheeatlas.de/de/moschee/...')` | Asserts REVIEW records not in sitemap | **CHANGE** | Update to `https://moscheeindernaehe.de/...`. |
| `tests/phase7.test.ts` | 192 | `urls.has('https://moscheeatlas.de/de/moschee/...')` | Asserts REVIEW records excluded from sitemap | **CHANGE** | Update to `https://moscheeindernaehe.de/...`. |
| `tests/seo-and-routes.test.ts` | 71–76 | `expect(urls).toContain('https://moscheeatlas.de/de')`, etc. | Asserts sitemap URLs for home and city | **CHANGE** | Update to `https://moscheeindernaehe.de/...`. |
| `tests/seo-and-routes.test.ts` | 82 | `expect(r.sitemap).toBe('https://moscheeatlas.de/sitemap.xml')` | Asserts robots.txt sitemap reference | **CHANGE** | Update to `https://moscheeindernaehe.de/sitemap.xml`. |

---

### Category C: Operational & Audit Scripts (`scripts/`)

| File Path | Line(s) | Context / Code Snippet | Purpose | Action | Rationale |
|---|---|---|---|---|---|
| `scripts/data-audit.ts` | 2, 24 | Banner `MOSCHEEATLAS.DE — PRODUCTION DATA QUALITY AUDIT` | Console output header | **CHANGE** | Update banner to `MOSCHEEATLAS`. |
| `scripts/data-diff.ts` | 2, 17 | Banner `MOSCHEEATLAS.DE — DATASET DIFF REPORT` | Console output header | **CHANGE** | Update banner to `MOSCHEEATLAS`. |
| `scripts/data-duplicates.ts` | 2, 23 | Banner `MOSCHEEATLAS.DE — DUPLICATE AUDIT REPORT` | Console output header | **CHANGE** | Update banner to `MOSCHEEATLAS`. |
| `scripts/run-pilot.ts` | 11 | Banner `MOSCHEEATLAS.DE — CONTROLLED PILOT EXECUTION` | Console output header | **CHANGE** | Update banner to `MOSCHEEATLAS`. |
| `scripts/phase5b-generate-reports.ts` | 166, 186–212, 228, 234, 286, 289, 297 | Markdown generation strings for historical Phase 5B | Historical report generator | **UNCHANGED** | Historical generator for completed Phase 5B. Does not affect runtime. |
| `scripts/phase6-generate-operations.ts` | 75, 199, 206, 237 | Markdown generation strings for historical Phase 6 | Historical operations generator | **UNCHANGED** | Historical generator for completed Phase 6. Does not affect runtime. |
| `scripts/phase7-generate-city-enrichment.ts` | 117 | Markdown generation string for historical Phase 7 | Historical report generator | **UNCHANGED** | Historical generator for completed Phase 7. Does not affect runtime. |

---

### Category D: Historical Documentation (`*.md`)

The following documentation files record completed past development phases and intentionally document the historical context under which those phases were built:
- `PHASE2B_DATA_PROVENANCE.md`
- `PHASE2B_DATA_QUALITY.md`
- `PHASE2B_DUPLICATE_AUDIT.md`
- `PHASE2B_REPORT.md`
- `PHASE2B_SEO_AUDIT.md`
- `PHASE2B_THIN_CONTENT_AUDIT.md`
- `PHASE3A_AUDIT.md`, `PHASE3A_DATA_COUNTS.md`, `PHASE3A_DATA_PROVENANCE.md`, `PHASE3A_DATA_TRUST.md`, `PHASE3A_FINAL_VERIFICATION.md`, `PHASE3A_REPORT.md`, `PHASE3A_SEARCH_MAP.md`
- `PHASE3B_AUDIT.md`, `PHASE3B_REPORT.md`
- `PHASE4_AUDIT.md`, `PHASE4_BASELINE_DATA.md`, `PHASE4_DATA_SOURCES.md`, `PHASE4_EXISTING_DATA_REGRESSION.md`, `PHASE4_PILOT_REPORT.md`, `PHASE4_REPORT.md`
- `PHASE5A_REPORT.md`
- `PHASE5B_FINAL_VERIFICATION.md`, `PHASE5B_REPORT.md`, `PHASE5B_SEO_AUDIT.md`, `PHASE5B_SITEMAP_DELTA.md`
- `PHASE6_AUDIT.md`, `PHASE6_FRESHNESS.md`, `PHASE6_OPERATIONS_REPORT.md`, `PHASE6_REPORT.md`, `PHASE6_SEO_SCALING.md`
- `PHASE7_AUDIT.md`, `PHASE7_BASELINE.md`, `PHASE7_CITY_ENRICHMENT.md`, `PHASE7_CLAIM_WORKFLOW.md`, `PHASE7_CONTRIBUTIONS.md`, `PHASE7_REPORT.md`, `PHASE7_REVIEW_WORKFLOW.md`, `PHASE7_SECURITY.md`, `PHASE7_SEO_AUDIT.md`, `PHASE7_VERIFICATION_MODEL.md`
- `PHASE_INTERNAL_LINKING_NEARBY_MOSQUES.md`, `PHASE_INTERNAL_LINKING_REPORT.md`

**Action:** **REMAIN UNCHANGED**. These documents preserve the immutable audit trail of past engineering milestones.

---

## 3. Search for Variations & Related Patterns

1. **`www.moscheeatlas.de`**: Zero occurrences in codebase.
2. **`http://moscheeatlas.de`**: Zero occurrences in codebase.
3. **`metadataBase`**: Configured once in `src/app/layout.tsx` pointing to `new URL(SITE_URL)`. Will automatically resolve all relative canonical/hreflang tags to `https://moscheeindernaehe.de`.
4. **`canonical` & `alternates`**: All routes in `src/app/` generate relative paths (`/de/...`, `/en/...`, `/ar/...`). With `metadataBase` updated, Next.js generates absolute canonical URLs starting with `https://moscheeindernaehe.de`.
5. **`hreflang`**: All language alternates are defined as relative paths (`/de/...`, `/en/...`, `/ar/...`), preserved exactly across all 3 locales.
6. **`robots.ts`**: Uses `SITE_URL` to define `${baseUrl}/sitemap.xml`.
7. **`sitemap.ts`**: Uses `SITE_URL` to construct all 1,674 URLs.
8. **JSON-LD / Schema.org**: `src/lib/seo/schema.ts` uses `SITE_URL` as default parameter for `detailUrl` and breadcrumb URLs.
9. **CSP & Security Headers**: In `next.config.mjs`, CSP is configured with `'self'`, `https:`, `data:`, `blob:`. No domain-specific origin lockouts or hardcoded legacy domains exist.
10. **Environment Variables**: No `.env` file exists in git. `NEXT_PUBLIC_SITE_URL` is optionally read by `src/lib/config.ts`.

---

## 4. Production Baseline Pre-Audit Verification

Before any modifications, the current baseline was verified:
- Total Published Mosque Records: **542**
- Total Published Cities: **14**
- Total Canonical Sitemap URLs: **1,674**
- Test Suite: **264 tests passing across 14 test files**
- TypeScript: **Zero compilation errors (`npx tsc --noEmit`)**
- ESLint: **Zero lint warnings or errors (`next lint`)**
