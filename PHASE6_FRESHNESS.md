# Phase 6 — Data Freshness Architecture & Decay Policy

**Domain:** `https://moscheeatlas.de`  
**Generated At:** 2026-09-30T11:08:48.050Z  

---

## 1. Freshness Policy Principles

In accordance with our core trust standard (**Unverified ≠ Verified**):
1. **Source Fetch Time ≠ Verification:** The date Google Maps or OSM provided data is NOT recorded as a human verification.
2. **Deterministic Decay:** Records without human verification are classified as `UNKNOWN`.
3. **Zero Automated Mutations:** Stale records are flagged for review tasks, never silently altered or removed.

---

## 2. Thresholds & Classification Model

| Freshness Tier | Definition / Threshold | Operator Action Required |
|---|---|---|
| **FRESH** | `lastVerified` within the last 90 days | None. Data is current. |
| **STALE** | `lastVerified` between 91 and 365 days ago | Low-priority scheduled re-verification. |
| **VERY_STALE** | `lastVerified` older than 365 days | High-priority field audit task. |
| **UNKNOWN** | `lastVerified` is null (100% of current baseline) | Initial verification queue item. |

---

## 3. Production Baseline Assessment

- **Total Assessed:** 542 published records
- **UNKNOWN:** 0 (100.0%) — All records currently retain honest `UNVERIFIED` status.
- **FRESH:** 0
- **STALE:** 0
- **VERY_STALE:** 0
