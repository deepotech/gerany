# PHASE 4 AUDIT — DATA ARCHITECTURE, PIPELINE & QUALITY INVENTORY

**Project:** MoscheeAtlas.de  
**Domain:** https://moscheeatlas.de  
**Date:** 2026-09-30  
**Phase:** Phase 4 (Germany-Wide Data Expansion & Production Data Quality Pipeline)  
**Status:** COMPLETE AUDIT  

---

## 1. Executive Summary

MoscheeAtlas.de is Germany's specialized mosque and Islamic center directory. Following the successful completion of Phases 1 through 3B, the production application currently serves **443 published mosque records** across 9 major metropolitan cities (Berlin, Hamburg, München, Frankfurt, Dortmund, Köln, Stuttgart, Düsseldorf, Essen).

The objective of Phase 4 is to build a **production-grade, scalable, auditable data expansion and quality pipeline**. This audit systematically analyzes the current data architecture, models, pipeline stages, ingestion mechanics, deduplication logic, classification algorithms, validation gates, and scalability limitations prior to any expansion.

---

## 2. Current Data Models & Contracts

### 2.1 Source & Raw Ingestion Model (`src/pipeline/types.ts`)

The raw ingestion schema currently mirrors Google Places JSON dumps:

```typescript
export interface RawGooglePlaceRecord {
  title?: string;
  address?: string;
  categoryName?: string;
  categories?: string[];
  city?: string | null;
  state?: string | null;
  countryCode?: string;
  postalCode?: string | null;
  street?: string | null;
  location?: {
    lat?: number;
    lng?: number;
  };
  phone?: string | null;
  website?: string | null;
  placeId?: string | null;
  cid?: string | null;
  url?: string | null;
  description?: string | null;
  openingHours?: Array<{ day: string; hours: string }>;
  additionalInfo?: Record<string, Array<Record<string, boolean>>>;
  reviewsCount?: number;
  rating?: number;
  totalScore?: number;
  reviewsDistribution?: {
    oneStar: number;
    twoStar: number;
    threeStar: number;
    fourStar: number;
    fiveStar: number;
  };
  imageUrl?: string | null;
  imageUrls?: string[];
}
```

**Audit Assessment:**
- **Source Specificity:** The raw record interface is tightly coupled to Google Places scraper exports (`totalScore`, `cid`, `additionalInfo` nested structures).
- **Provenance Deficit:** Raw records lack explicit ingestion metadata such as `importedAt`, `sourceName`, `sourceType`, `license`, or raw hash.
- **Immutability:** Raw records are currently loaded from flat files (`<City>, Germany.json` in the root) and transformed directly into memory without a dedicated raw archive store.

### 2.2 Normalized Entity Model (`MosqueEntity`)

```typescript
export interface MosqueEntity {
  id: string; // Defaults to Google Place ID or synthetic ID
  canonicalName: string;
  slug: string;
  address: string;
  street: string | null;
  postalCode: string;
  city: string;
  district: string | null;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  mapsUrl: string | null;
  placeId: string | null;
  category: MosqueCategory;
  organization: string | null;
  description: string | null;
  openingHours: Array<{ day: string; hours: string }> | null;
  rating: number | null;
  reviewCount: number;
  imageUrl: string | null;
  dataStatus: DataStatus; // 'RAW' | 'NORMALIZED' | 'REVIEWED' | 'PUBLISHED' | 'REJECTED'
  verificationStatus: VerificationStatus; // 'UNVERIFIED' | 'COMMUNITY_VERIFIED' | 'OFFICIALLY_VERIFIED'
  source: string;
  lastVerified: string | null;
  facilities: MosqueFacilities;
  translations: Record<'de' | 'en' | 'ar', MosqueTranslation>;
  createdAt: string;
  updatedAt: string;
}
```

**Audit Assessment:**
- Clean separation between `dataStatus` and `verificationStatus`.
- Well-structured multilingual support (`translations` record).
- Facilities preserve strict tri-state (`boolean | null`) semantics (`Unknown ≠ False`).
- Missing: Fine-grained tracking of raw vs normalized values (e.g., `rawPhone` vs `normalizedPhone`).

### 2.3 Prisma Database Schema (`prisma/schema.prisma`)

The Prisma schema defines PostgreSQL tables for `Mosque`, `Facilities`, `Translation`, and `AuditLog`.
- `@@unique([city, slug])` enforces unique slugs scoped to cities.
- `placeId @unique` enables external ID deduplication.
- Relational mapping mirrors the in-memory JSON repository.
- The active runtime uses `JsonMosqueRepository` (`src/data/mosques.json` and `src/data/all-entities.json`) for zero-latency static generation and edge deployments.

---

## 3. Current Pipeline Architecture & Logic

The pipeline operates via `scripts/run-pipeline.ts` and `src/pipeline/runner.ts`:

```
[City JSON Files]
       ↓
Cross-Dataset Place ID Deduplication
       ↓
Per-City Ingestion
       ↓
Deduplicate (Exact Place ID + Phone/Proximity)
       ↓
Normalize (Address, District, City Config, Facilities, Contacts)
       ↓
Classify (Spam Filter, Category Rules, DataStatus Decision)
       ↓
Slug Generation (Scoped per City, Transliteration)
       ↓
Multilingual Translation Generation (DE, EN, AR)
       ↓
Zod Schema Validation (`validateMosqueEntity`)
       ↓
Status Split: PUBLISHED (443) vs REVIEWED (39) vs REJECTED (4)
       ↓
Export: mosques.json, all-entities.json, data-quality-report.json
```

### 3.1 Deduplication Logic (`src/pipeline/deduplicate.ts`)

Current checks:
1. **Level 1 (Place ID):** Exact match on `placeId`. If found, subsequent records are marked as `MERGED` and skipped.
2. **Level 2 (Address/Proximity + Phone + Name):**
   - Haversine distance < 60 meters OR identical street address (first comma token).
   - If identical phone AND name similarity (>3 chars substring), merged as `NAME_PROXIMITY_MATCH`.
   - If address matches or distance < 60m but phone or name differs: flagged as `FLAGGED_CO_LOCATED` (`SAME_ADDRESS_DIFFERENT_ORG` or `PHONE_MATCH`) and preserved!
3. **Cross-Dataset Deduplication:** `scripts/run-pipeline.ts` detects identical `placeId`s occurring across multiple city source files and assigns ownership to the first dataset.

**Limitations identified:**
- Name comparison only strips a fixed regex list of mosque stop-words (`moschee`, `mosque`, `camii`, `verein`, etc.).
- Does not compute formal Levenshtein, Jaro-Winkler, or token sort ratios for fuzzy matching.
- Does not generate an explainable multi-signal similarity score breakdown for review queues.

### 3.2 Classification Logic (`src/pipeline/classify.ts`)

1. **Spam/Prank:** Regex patterns (`pastel-ghost`, `fake`, `test`, `spam`) → `REJECTED`.
2. **Definitively Non-Mosque Categories:** (`funeral home`, `charity`, `association / organization` without mosque indicator in title) → `REJECTED`.
3. **Pure Non-Religious Club:** Category `club` or cultural association without prayer facility indicators → `REJECTED`.
4. **Low Quality / Thin Records:** Title is generic "mosque" or 0 reviews with no contact/hours → `REVIEWED`.
5. **Headquarters / Verbandszentrale:** Administrative offices → `REVIEWED` (requires prayer verification).
6. **Generic Educational/Cultural Associations:** → `REVIEWED`.
7. **Religious Organizations / Islamic Centers / Mosques:** → `PUBLISHED` (`UNVERIFIED`).

**Audit Assessment:**
- Classification rules are strict and prevent thin or administrative spam from polluting the published directory.
- `classify.ts` strictly assigns `verificationStatus: 'UNVERIFIED'`, preserving Phase 3A trust semantics.

### 3.3 Organization Affiliation Safety (`src/pipeline/normalize.ts`)

- Rule: **NEVER infer organization affiliation solely from the mosque name/title.**
- Only matches against verified domain names on the mosque's website (`ditib.de`, `vikz.de`, `ahmadiyya.de`, `igmg.org`, `atib.org`).
- Title mentions of "DITIB", "IGMG", etc., without verified website/registry proof result in `organization = null`.
- Fully satisfies Phase 4 affiliation safety criteria.

### 3.4 Slugs & Uniqueness (`src/pipeline/slugs.ts`)

- Slugs are generated deterministically:
  - Preserves Latin parts when mixed with Arabic.
  - Arabic characters transliterated phonetically.
  - German umlauts transliterated (`ä→ae`, `ö→oe`, `ü→ue`, `ß→ss`).
  - Scoped uniquely per city (`@@unique([city, slug])`).
  - Collisions within the same city append district or incremental numerical suffix.

### 3.5 City & Geographic Resolution (`src/pipeline/city-config.ts`)

- City resolution priority:
  1. German 5-digit postal code matched against `CITY_CONFIGS` postal ranges.
  2. City string alias match.
  3. Source filename hint.
- If postal code belongs to a different canonical city than the source file, it is flagged as a `CROSS_CITY_ANOMALY` and routed to `REVIEWED`.
- Current limitation: Only 9 cities are configured in `CITY_CONFIGS`. Any record outside these 9 cities falls back to `null` and is routed to `REVIEWED`.
- City expansion requires extending the city configuration architecture.

---

## 4. Verification Semantics & Trust Audit

- Current published records: **443 records**.
- All 443 records have `verificationStatus === 'UNVERIFIED'`.
- All 443 render the neutral grey "Erfasst" / "Listed" / "مُدرج" badge.
- Zero records have `COMMUNITY_VERIFIED` or `OFFICIALLY_VERIFIED`.
- Facilities follow **Unknown ≠ False**:
  - `null`: "Keine Angabe" / "Not available" / "غير محدد"
  - `true`: confirmed facility
  - `false`: confirmed absence (currently 0 records)
- Speculative Friday prayer times are strictly prohibited and absent from the UI.

---

## 5. SEO, Routes & Public Presentation

- Canonical URLs:
  - German: `/de/moscheen/[city]` and `/de/moschee/[city]/[slug]`
  - English: `/en/mosques/[englishSlug]` and `/en/mosque/[englishSlug]/[slug]`
  - Arabic: `/ar/mosques/[citySlug]` and `/ar/mosque/[citySlug]/[slug]`
- Indexability Gates:
  - Only `dataStatus === 'PUBLISHED'` records generate static routes and sitemap entries.
  - City pages are indexed only when `publishedCount >= 1`.
  - Admin routes (`/admin`, `/[locale]/admin`) are excluded from robots and sitemap (`Disallow: /admin`).
  - Search query parameters are excluded from indexing (`Disallow: /*?*query=`).

---

## 6. Identified Gaps & Scalability Limitations

1. **Source Layer Abstraction:** Currently no generic `SourceAdapter` interface. Ingestion expects Google Places schema in flat files.
2. **Immutable Raw Storage:** Raw files exist in root without versioned or staged immutable archive storage.
3. **Multi-Stage Pipeline Execution:** `runPipeline()` combines multiple operations in a single run; needs distinct stages: Ingest → Raw → Normalize → Deduplicate → Classify → Validate → Review → Publish → Report.
4. **Fuzzy Deduplication Scoring:** Missing multi-attribute fuzzy similarity score with transparent evidence explanation.
5. **CLI Tooling:** Missing dedicated commands for `npm run data:audit`, `npm run data:duplicates`, `npm run data:diff`, and explicit `--dry-run` flag.
6. **City Expansion Scalability:** `CITY_CONFIGS` is hardcoded to 9 cities. Expanding to 16 federal states and hundreds of German cities requires a comprehensive German postal-to-city/state resolution mapping.
7. **Performance at Scale:** 443 records generate 1,372 static pages and ~3MB page payloads. Scaling to 5,000+ records requires verifying client bundle sizes, search index execution, and dynamic SSG optimization.

---

## 7. Next Actions for Phase 4 Implementation

1. **Establish Baseline Report:** Record exact counts and quality distributions (`PHASE4_BASELINE_DATA.md`).
2. **Document Data Sources & Rights:** Establish provenance and license boundaries (`PHASE4_DATA_SOURCES.md`).
3. **Refactor Pipeline Architecture:** Implement modular stage contracts with raw immutability, fuzzy duplicate detection, explainable candidate scoring, and quality gates.
4. **Implement CLI Tooling:** Add audit, duplicates, diff, and dry-run scripts.
5. **Run Existing Data Regression:** Prove 100% preservation of all 443 published records.
6. **Execute Controlled Pilot:** Ingest a controlled pilot dataset (e.g., Hannover / Niedersachsen or Bremen) through the new pipeline.
7. **Verify Performance, SEO, and Build Integrity.**
