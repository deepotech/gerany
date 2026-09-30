# Phase 1.6 Fix Report — Safe Per-City Mosque Slug Uniqueness

**Date:** 2026-09-29  
**Target:** Safe Per-City Mosque Slug Uniqueness (`@@unique([city, slug])`)  
**Status:** COMPLETE & VERIFIED

---

## 1. Overview of Task & Objectives

In accordance with the MUST-FIX identified in `PHASE1_5_AUDIT.md`, mosque slugs were migrated from global uniqueness to **safe per-city uniqueness**. This change ensures:
1. Different cities across Germany can legitimately feature identical mosque names (e.g., *Fatih Moschee* in Köln, Berlin, and Hamburg) without slug collisions.
2. Within the same city, identical slugs remain strictly disallowed and are deterministically disambiguated (appending district or incremental suffix).
3. The public URL structure and all existing Köln URLs remain 100% unchanged.
4. Repository and route lookups resolve entities by both `city` and `slug`.

---

## 2. Files Changed

1. **`prisma/schema.prisma`**
   - Removed global `@unique` constraint from `slug String`.
   - Added composite constraint `@@unique([city, slug])` to `Mosque` model.
   - Kept `@@index([city, district])` for district-level filtering.
   - Re-generated Prisma Client types (`npx prisma generate`).

2. **`src/pipeline/slugs.ts`**
   - Updated `ensureUniqueSlugs` to scope collision detection per city: `Map<cityKey:slug, count>`.
   - Preserved `generateCanonicalSlug` for clean ASCII/transliterated slug generation.
   - Fixed district disambiguation suffix to transliterate umlauts (e.g. `Mülheim` $\rightarrow$ `muelheim`).

3. **`src/pipeline/runner.ts`**
   - Passed `city: p.addressInfo.city` into `ensureUniqueSlugs`.

4. **`src/lib/db/types.ts`**
   - Added `getByCityAndSlug(city: string, slug: string): Promise<MosqueEntity | null>` to `MosqueRepository` interface.
   - Updated `getBySlug(slug: string, city?: string)` signature.

5. **`src/lib/db/json-repository.ts`**
   - Implemented `getByCityAndSlug(city: string, slug: string)` with phonetic German city normalization (supporting `"koeln"`, `"cologne"`, `"Köln"` interchangeably).
   - Ensured `getByCityAndSlug('berlin', 'igmg-fatih-moschee-nippes')` returns `null` (preventing wrong-city entity resolution).
   - Updated `getBySlug(slug, city?)` to delegate to `getByCityAndSlug` when `city` is provided.

6. **`src/app/[locale]/moschee/[city]/[slug]/page.tsx` (German Detail Page)**
   - Updated `generateMetadata` to resolve via `repo.getByCityAndSlug(normalized, slug)`.
   - Updated page component to resolve via `repo.getByCityAndSlug(normalized, slug)`.

7. **`src/app/[locale]/mosque/[city]/[slug]/page.tsx` (English & Arabic Detail Page)**
   - Updated `generateMetadata` to resolve via `repo.getByCityAndSlug(normalized, slug)`.
   - Updated page component to resolve via `repo.getByCityAndSlug(normalized, slug)`.

8. **`tests/phase1_6_slug_fix.test.ts` (New Regression Test Suite)**
   - Added comprehensive tests for per-city uniqueness, cross-city duplicate allowance, same-city collision resolution, and route lookup integrity.

9. **ESLint Configuration (`.eslintrc.json` & dependencies)**
   - Added Next.js core web vitals linting configuration.

---

## 3. Database Schema Change (`prisma/schema.prisma`)

```prisma
model Mosque {
  id                 String             @id @default(cuid())
  canonicalName      String
  slug               String             // Changed from: slug String @unique
  address            String
  street             String?
  postalCode         String
  city               String             // e.g. "Köln"
  district           String?            // e.g. "Kalk", "Nippes", "Mülheim"
  state              String             @default("Nordrhein-Westfalen")
  country            String             @default("Germany")
  latitude           Float
  longitude          Float
  phone              String?
  website            String?
  mapsUrl            String?
  placeId            String?            @unique
  category           MosqueCategory     @default(MOSQUE)
  organization       String?
  description        String?
  openingHours       Json?
  rating             Float?
  reviewCount        Int                @default(0)
  imageUrl           String?
  dataStatus         DataStatus         @default(NORMALIZED)
  verificationStatus VerificationStatus @default(UNVERIFIED)
  source             String             @default("google_maps_pilot")
  lastVerified       DateTime?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  facilities   Facilities?
  translations Translation[]
  auditLogs    AuditLog[]

  @@unique([city, slug])              // NEW: Safe per-city uniqueness
  @@index([city, district])           // Retained for district queries
  @@index([postalCode])
  @@index([dataStatus])
  @@index([category])
  @@index([latitude, longitude])
}
```

---

## 4. Repository & Route Changes

### Repository Lookups
```ts
// src/lib/db/types.ts
export interface MosqueRepository {
  getAllPublished(filters?: SearchFilters): Promise<MosqueWithDistance[]>;
  getByCityAndSlug(city: string, slug: string): Promise<MosqueEntity | null>;
  getBySlug(slug: string, city?: string): Promise<MosqueEntity | null>;
  ...
}

// src/lib/db/json-repository.ts
async getByCityAndSlug(city: string, slug: string): Promise<MosqueEntity | null> {
  const c = normalizeGermanPhonetic(city);
  const cleanSlug = slug.toLowerCase().trim();

  return (
    this.mosques.find((m) => {
      const mCity = normalizeGermanPhonetic(m.city);
      const isCityMatch = mCity === c || (c === 'cologne' && mCity === 'koln') || (c === 'koeln' && mCity === 'koln');
      return isCityMatch && m.slug.toLowerCase() === cleanSlug;
    }) || null
  );
}
```

### Route Handlers
In both German (`/de/moschee/[city]/[slug]`) and English/Arabic (`/[locale]/mosque/[city]/[slug]`), entity resolution now executes via:
```ts
const normalized = normalizeCitySlug(city);
const mosque = await repo.getByCityAndSlug(normalized, slug);
if (!mosque) notFound();
```
- Querying `/de/moschee/koeln/igmg-fatih-moschee-nippes` resolves the entity with HTTP 200.
- Querying with a mismatched or non-existent city (e.g., `/de/moschee/berlin/igmg-fatih-moschee-nippes`) returns an immediate HTTP 404.

---

## 5. Tests Added (`tests/phase1_6_slug_fix.test.ts`)

1. **`same slug + different city = valid`**:  
   Verifies that 4 mosques titled "Fatih Moschee" across Köln, Berlin, Hamburg, and München all receive the clean canonical slug `fatih-moschee` without collision.
2. **`same slug + same city = collision`**:  
   Verifies that 3 mosques titled "Fatih Moschee" within the same city (Köln) are disambiguated deterministically: `fatih-moschee`, `fatih-moschee-kalk`, `fatih-moschee-muelheim`.
3. **`city + slug lookup returns the correct entity`**:  
   Verifies that `repo.getByCityAndSlug('koeln', 'igmg-fatih-moschee-nippes')` returns the exact entity (tested with `'koeln'`, `'Köln'`, and `'cologne'`).
4. **`wrong city + valid slug returns null (yielding 404)`**:  
   Verifies that passing wrong cities (`'berlin'`, `'hamburg'`, `'muenchen'`) against a Köln slug returns `null`.
5. **`multilingual routes resolve consistently`**:  
   Verifies that `/de/moschee/koeln/[slug]`, `/en/mosque/cologne/[slug]`, and `/ar/mosque/koeln/[slug]` all map to the identical entity ID.

---

## 6. Exact Test Results (`npm test`)

```text
> vitest run

 RUN  v2.1.9 C:/Users/HP/Desktop/Germany Mosque Finder

 ✓ tests/phase1_6_slug_fix.test.ts (5 tests) 6ms
   - allows identical slugs across different cities (same slug + different city = valid)
   - detects and deterministically resolves collisions within the same city (same slug + same city = collision)
   - correctly resolves mosque entity using both city and slug
   - returns null (yielding 404) when querying with an invalid or mismatched city
   - ensures multilingual routes map to the same entity with consistent canonical URL structure
 ✓ tests/pipeline.test.ts (17 tests) 12ms
 ✓ tests/seo-and-routes.test.ts (9 tests) 23ms
 ✓ tests/phase1_5_audit.test.ts (18 tests) 35ms

 Test Files  4 passed (4)
      Tests  49 passed (49)
   Start at  11:25:16
   Duration  960ms (transform 272ms, setup 0ms, collect 549ms, tests 75ms, environment 1ms, prepare 640ms)
```

---

## 7. Exact Linter Result (`npm run lint`)

```text
> next lint

✔ No ESLint warnings or errors
```

---

## 8. Exact Production Build Result (`npm run build`)

```text
> next build

  ▲ Next.js 14.2.35

   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ... Done
   Collecting page data ... Done
   Generating static pages (0/133) ...
   Generating static pages (33/133) 
   Generating static pages (66/133) 
   Generating static pages (99/133) 
 ✓ Generating static pages (133/133)
   Finalizing page optimization ... Done
   Collecting build traces ... Done

Route (app)                                               Size     First Load JS
┌ ○ /                                                     144 B          87.9 kB
├ ○ /_not-found                                           873 B          88.6 kB
├ ● /[locale]                                             7.12 kB         104 kB
├   ├ /de
├   ├ /en
├   └ /ar
├ ● /[locale]/admin                                       144 B          87.9 kB
├   ├ /de/admin
├   ├ /en/admin
├   └ /ar/admin
├ ● /[locale]/moschee/[city]/[slug]                       1.4 kB         97.8 kB
├   ├ /de/moschee/koeln/koeln-moschee-majlis-ansarullah
├   ├ /de/moschee/koeln/igmg-fatih-moschee-nippes
├   ├ /de/moschee/koeln/taqiyyu-d-din-al-hilali-moschee
├   └ [+35 more paths]
├ ● /[locale]/moscheen                                    139 B           106 kB
├   └ /de/moscheen
├ ● /[locale]/moscheen/[city]                             139 B           106 kB
├   └ /de/moscheen/koeln
├ ● /[locale]/mosque/[city]/[slug]                        1.4 kB         97.8 kB
├   ├ /en/mosque/cologne/koeln-moschee-majlis-ansarullah
├   ├ /ar/mosque/koeln/koeln-moschee-majlis-ansarullah
├   ├ /en/mosque/cologne/igmg-fatih-moschee-nippes
├   └ [+73 more paths]
├ ● /[locale]/mosques                                     138 B           106 kB
├   ├ /en/mosques
├   └ /ar/mosques
├ ● /[locale]/mosques/[city]                              139 B           106 kB
├   ├ /en/mosques/cologne
├   └ /ar/mosques/koeln
├ ○ /admin                                                144 B          87.9 kB
├ ○ /robots.txt                                           0 B                0 B
└ ○ /sitemap.xml                                          0 B                0 B
+ First Load JS shared by all                             87.7 kB
  ├ chunks/117-186ee6a15377e56a.js                        31.7 kB
  ├ chunks/fd9d1056-86af8b28552becb8.js                   53.6 kB
  └ other shared chunks (total)                           2.36 kB

○  (Static)  prerendered as static content
●  (SSG)     prerendered as static HTML (uses getStaticProps)
```

---

## 9. Conclusion

The MUST-FIX requirement is fully resolved and validated. The database schema and route architecture now natively support Germany-wide expansion without risk of cross-city slug collisions. Existing Köln routes and slugs remain 100% stable.
