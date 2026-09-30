# Phase 7 — Operator Review Workflow & Review Queue Operations

**Domain:** `https://moscheeatlas.de`  
**Execution Date:** 2026-09-30  
**Status:** IMPLEMENTED & OPERATIONAL  

---

## 1. Review Queue Architecture

The operator review queue is populated deterministically from `src/data/all-entities.json` where `dataStatus === 'REVIEWED'`.

### Current Queue Metrics:
- **Total Entities in Review:** 52 records
- **Primary Hold Categories:**
  - Generic associations requiring prayer hall confirmation (33%)
  - Low-completeness thin records held to prevent thin-page indexing (38%)
  - Administrative headquarters / Verbandszentralen (17%)
  - Metropolitan cross-boundary anomalies (12%)

---

## 2. Permitted Operator Actions

| Action | Resulting `dataStatus` | Verification Impact | Preconditions |
|---|---|---|---|
| **APPROVE** | `PUBLISHED` | None (`UNVERIFIED`) | Entity passes all 8 entity-level gates |
| **REJECT** | `REJECTED` | None (`UNVERIFIED`) | Non-mosque entity, club, or spam |
| **KEEP_REVIEW** | `REVIEWED` | None | Awaiting field evidence |
| **MARK_COLOCATED** | `REVIEWED` / `PUBLISHED` | None | Confirmed distinct entity at shared address |
| **MERGE** | `REJECTED` (duplicate retired) | None | Primary target entity explicitly specified |
| **REQUEST_INFO** | `REVIEWED` | None | Evidence request dispatched to community |

---

## 3. Auditability
Every execution of `OperatorReviewService.executeAction()` logs an immutable `DataAuditEvent` recording the operator ID, timestamp, prior state, new state, and justification reason.
