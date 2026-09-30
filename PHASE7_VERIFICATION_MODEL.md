# Phase 7 — Verification Domain Model & Event Sourcing

**Domain:** `https://moscheeatlas.de`  
**Execution Date:** 2026-09-30  
**Status:** IMPLEMENTED & VERIFIED  

---

## 1. Separation of Concerns: Publication vs. Verification

In MoscheeAtlas.de, **Publication** and **Verification** are completely independent dimensions:

| Dimension | Managed States | Authority / Criteria |
|---|---|---|
| **Publication** | `RAW` → `NORMALIZED` → `REVIEWED` → `PUBLISHED` / `REJECTED` | Technical quality gates (valid address, Germany coords, active category, SEO route) |
| **Verification** | `UNVERIFIED` → `COMMUNITY_VERIFIED` → `OFFICIALLY_VERIFIED` | Legal / documentary / field evidence approved by authorized operator |

### Inviolable Invariant Rules:
1. An imported or published entity is **100% UNVERIFIED** by default.
2. Operator publication approval NEVER implies verification.
3. Google Place ID presence NEVER grants verification.
4. A community claim submission NEVER grants verification.
5. Verification requires an explicit, immutable **VerificationEvent**.

---

## 2. Verification Event Lifecycle

```
PENDING --> APPROVED (valid for 1 year) --> EXPIRED
PENDING --> REJECTED
APPROVED --> REVOKED (reverts to UNVERIFIED)
```

### Evidence Standards:
- **OFFICIAL_REGISTER_DOCUMENT:** Official extract from the German Vereinsregister (Amtsgericht).
- **ASSOCIATION_MEMBERSHIP_LETTER:** Official written confirmation from parent federation (DITIB, IGMG, VIKZ, AMJ, etc.).
- **IMPRESSUM_LEGAL_MATCH:** Public Impressum with authorized legal representative matching claimant.
- **SITE_VISIT_PHOTO_EVIDENCE:** Georeferenced, timestamped physical photography of prayer hall and entrance plaque.
- **DIRECT_PHONE_INTERVIEW:** Formal verification call with congregational board member or Imam.

---

## 3. Privacy & Public Separation

Evidence references (hashes, file paths, contact documents) are stored in secure internal audit logs and **NEVER exposed in public JSON APIs or web pages**.
