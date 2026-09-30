# Phase 7 — Mosque Claiming Governance & Workflow

**Domain:** `https://moscheeatlas.de`  
**Execution Date:** 2026-09-30  
**Status:** IMPLEMENTED & PROTECTED  

---

## 1. "Claim This Mosque" Architecture

Local congregations (Vorstand, Imam, or authorized community delegates) can submit claims to manage their mosque's listing.

### The 4-Stage Lifecycle:
```
CLAIM_SUBMITTED --> EVIDENCE_REQUIRED --> UNDER_REVIEW --> APPROVED / REJECTED
```

### Safety Principles:
1. **Zero Direct Writes:** A claim NEVER directly modifies `src/data/mosques.json`.
2. **Zero Auto-Verification:** Claim approval allows management of proposed edits; it does NOT automatically confer `OFFICIALLY_VERIFIED` status without documentary evidence.
3. **Privilege Isolation:** Management privileges (`managementPrivilegesGranted`) remain `false` until human operator approval.
