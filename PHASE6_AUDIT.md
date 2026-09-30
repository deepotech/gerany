# Phase 6 — Comprehensive Architecture & Data Operations Audit
# MoscheeAtlas.de

**Domain:** `https://moscheeatlas.de`  
**Audit Date:** 2026-09-30  
**Environment:** Production Dataset & Core Application  
**Audit Scope:** Full repository code audit across data layer, pipeline, repository abstractions, SEO/routing, search, map, security, and operator workflows.

---

## 1. Executive Summary

MoscheeAtlas.de currently operates as a static-generated, JSON-backed German mosque directory with **542 published records** across **14 German cities**, generating **1,674 canonical sitemap URLs** with strict multilingual parity (`de`, `en`, `ar`).

Phase 5B successfully promoted 5 candidate cities (Bremen, Wuppertal, Bonn, Nürnberg, Leipzig) while maintaining 5 candidate cities (Hannover, Duisburg, Bochum, Mannheim, Dresden) in `REVIEW` or `BLOCKED` states due to quality gate failures.

This audit evaluates the system's operational readiness to scale across Germany to hundreds of cities and thousands of records without degrading data accuracy, user trust, or search engine equity.

---

## 2. Current Architecture & Data Flow

### 2.1 Storage & Data Layer
- **Production Store:** Local JSON files (`src/data/mosques.json` for 542 published entities; `src/data/all-entities.json` for 594 total entities including reviewed and rejected).
- **Data Repository:** `JsonMosqueRepository` (`src/lib/db/json-repository.ts`) acts as the single data-access layer for Next.js App Router static site generation (SSG) and server component reads.
- **Prisma Schema:** `prisma/schema.prisma` defines a PostgreSQL schema (`Mosque`, `MosqueTranslation`, `VerificationLog`), but production currently runs offline-first via JSON for determinism and zero-infrastructure hosting simplicity.

### 2.2 Ingestion & Transformation Flow
```
RAW SOURCE (JSON / External)
      ↓
[SourceAdapter] (extracts id, rawHash, provenance)
      ↓
[detectDuplicates] (5-stage multi-signal deduplication + co-location protection)
      ↓
[parseAddress] (resolves canonical city via postal code range & city aliases)
      ↓
[classifyRecord] (assigns category: MOSQUE, ISLAMIC_CENTER, etc., and initial status)
      ↓
[detectOrganization] (identifies DITIB, IGMG, VIKZ, AMJ, etc.)
      ↓
[evaluateQualityGates] (8 entity-level gates: coords, address, phone/web, SEO route, trust)
      ↓
[evaluateCityGates] (10 city-level gates: min 5 records, bounding box, category purity)
      ↓
OPERATOR PROMOTION (explicit CLI promotion writes to city-registry-overrides.json)
      ↓
PRODUCTION MERGE (mosques.json updated; sitemap and SSG routes generated)
```

---

## 3. Current City Lifecycle & Publication Governance

The city lifecycle model (`src/pipeline/city-registry.ts`) manages cities through 6 explicit states:
1. `DISCOVERED`: City identified in administrative lists or postal data; no verified mosques yet.
2. `REVIEW`: City contains ingested candidate mosques held in review queue; quality gates not yet evaluated or passed.
3. `VALIDATED`: City candidate records have passed entity-level normalization and schema validation.
4. `READY_FOR_LAUNCH`: City has passed all 10 city-level quality gates (GATE_A through GATE_J); ready for operator decision.
5. `PUBLISHED`: City explicitly promoted by operator; routes active, indexable in sitemap, included in search and footer.
6. `PAUSED`: City temporarily withdrawn from publication; returns 404 / noindex.

**Key Safeguard:** A city NEVER transitions to `PUBLISHED` automatically. Presence in raw source files or configuration does NOT expose the city publicly.

---

## 4. Source & Provenance Model Audit

### 4.1 Existing Capabilities
- `SourceProvenance` interface tracks `name`, `type`, `url`, `externalId`, `importedAt`, and `license`.
- `hashRawRecord` computes a deterministic hash of `placeId|title|address|phone` to detect raw record changes.
- Pipeline strips Google user reviews, review text, and reviewer names to prevent copyright and privacy violations.

### 4.2 Gaps Identified (Phase 6 Needs)
- **Multi-Source Support:** Only `GooglePlacesJsonAdapter` is active. OpenStreetMap (OSM) and community submission adapters lack a unified ingestion and reconciliation harness.
- **Transformation History:** Entities record `source: 'google_places'`, but intermediate pipeline decisions (e.g. why an address was reformatted, which gate triggered review) are not permanently structured on the entity.
- **Operator Attribution:** The identity of the operator who promoted a city or approved a record is stored in launch reports, but not embedded directly into entity metadata.

---

## 5. Review & Freshness Capabilities

### 5.1 Review Queue Current State
- Records held in review carry `dataStatus: 'REVIEWED'` and an optional `reviewReason` string.
- Currently, review items are queried by filtering `all-entities.json` where `dataStatus === 'REVIEWED'`.
- There is no dedicated operational domain model for tracking review assignment, resolution status, or reviewer notes.

### 5.2 Freshness Current State
- Entities have `createdAt`, `updatedAt`, and nullable `lastVerified`.
- In the current dataset, all 542 published records have `lastVerified: null` because they are `UNVERIFIED`.
- **Gap:** No automated decay or freshness tiering (e.g. `FRESH`, `STALE`, `VERY_STALE`, `UNKNOWN`) exists to systematically flag records needing verification checks.

---

## 6. Duplicate & Co-Location Detection

### 6.1 Multi-Signal Engine
`src/pipeline/deduplicate.ts` implements a 5-tier similarity algorithm:
1. Exact `placeId` matching (Level 1).
2. Exact CID matching (Level 2).
3. Exact coordinates (< 25m) + high phonetic name similarity (Level 3).
4. Same street + postal code + name token overlap > 85% (Level 4).
5. **Co-Location Safety Override (Level 5):** Distinct organizations at the same building address are flagged as `FLAGGED_CO_LOCATED` and NEVER auto-merged.

### 6.2 Audit Finding
The deduplication algorithm correctly prevented false merges during Phase 5B (0 cross-city duplicates, 0 accidental merges). Operational reporting can be strengthened by generating standalone machine-readable duplicate audits.

---

## 7. Search & Map Scalability

### 7.1 Search
- `JsonMosqueRepository.getAllPublished({ query, city, category, district })` performs memory-efficient in-process filtering.
- Implements German phonetic normalization (`normalizeGermanPhonetic`) converting umlauts (`ä` → `ae`, `ö` → `oe`, `ü` → `ue`, `ß` → `ss`).
- Tested with 542 records: sub-millisecond execution. Public search strictly queries `mosques.json` (published-only).

### 7.2 Map
- Map component uses Leaflet. Currently renders 542 markers client-side.
- Performance is smooth at 542 records; scaling beyond 1,500+ records across Germany will require marker clustering or bounding-box viewport virtualization to prevent DOM overhead on mobile devices.

---

## 8. SEO & Indexation Safeguards

- **Domain:** `https://moscheeatlas.de` canonicalized across all links.
- **Sitemap Integrity:** Exactly 1,674 URLs (3 home + 3 search + 42 city + 1,626 detail).
- **Indexation Guards:** Unpromoted cities return 404 and `robots: { index: false, follow: false }`.
- **No Thin Pages:** Low-quality records (0 reviews + no contact) are held in `REVIEWED` and never indexed.

---

## 9. Severity Findings (P0 to P3)

| ID | Severity | Category | Description | Phase 6 Resolution |
|---|---|---|---|---|
| **F-01** | **P1** | Operations | No unified operator review domain model to inspect and resolve `REVIEWED` queue items | Build `OperatorReviewService` & domain model in Step 3 |
| **F-02** | **P1** | Operations | No automated data freshness classification model based on `updatedAt`/`lastVerified` | Implement deterministic `DataFreshnessClassifier` in Step 5 |
| **F-03** | **P2** | Architecture | Multi-source adapter abstraction needs formal OpenStreetMap (OSM) adapter specification | Implement `OsmSourceAdapter` abstraction with conflict rules in Step 7 |
| **F-04** | **P2** | Scalability | Map rendering on mobile will degrade when scaling from 542 to 2,000+ markers | Implement Leaflet marker clustering recommendation & map scaling guidelines in Step 12 |
| **F-05** | **P3** | Operations | City operational metrics currently split across individual reports | Create consolidated `PHASE6_DATA_QUALITY.json` and `PHASE6_OPERATIONS_REPORT.md` |

---

## 10. Audit Conclusion

The MoscheeAtlas.de foundation is robust, secure, and architecturally sound. The core data invariants (*Accuracy > Coverage*, *Unknown ≠ False*, *Unverified ≠ Verified*) are deeply respected. Phase 6 will implement the operational tooling and services required to scale safely.
