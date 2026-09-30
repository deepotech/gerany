# Phase 5B — Deduplication & Co-Location Audit

**Generated At:** 2026-09-30T10:56:07.002Z

---

## 1. Deduplication Principles Enforced
Throughout Phase 5B, the multi-signal deduplication engine and strict co-location rules were maintained:
1. **Level 1 (Exact Place ID):** Records with identical Google Place IDs are unified.
2. **Level 2 (CID Match):** Identical Google Customer Identifiers are unified.
3. **Level 3 (Normalized Name + Exact Coordinates):** Names normalized with German phonetic algorithms at same GPS coords (< 25m) are merged.
4. **Level 4 (High Name Similarity + Identical Street/Postal):** > 85% token overlap on same street address merged.
5. **Level 5 (Co-Location Safety Override):** Multiple organizations sharing the same building/street number are **NEVER auto-merged** unless verified as identical entity.

---

## 2. Ingestion Deduplication Results

- **Total Candidate Raw Records Evaluated:** 236
- **Within-Dataset Deduplications:** 0 (all 236 records had distinct coordinates / entities)
- **Cross-Candidate Place ID Duplicates:** 0
- **Cross-Production Collision:** 0 (no placeId in candidate files collided with the baseline 486 entities)
- **Entities Retained in Complete Pool:** 594 total (486 baseline + 108 ingested across candidate sets)

---

## 3. Co-Location Protection Verification
All multi-tenant facilities and shared Islamic center addresses were preserved as distinct records with unique slugs.
Zero accidental merges occurred.
