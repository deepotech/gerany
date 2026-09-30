# PHASE 3A — DATA TRUST & VERIFICATION SEMANTICS
**Project:** MoscheeAtlas.de  
**Date:** 2026-09-29  
**Status:** AUDITED & HARDENED — SEMANTICS CORRECTED

---

## 1. Principles of Data Trust

MoscheeAtlas.de operates under strict data integrity constraints:
- **Accuracy > Page Count**
- **Data Integrity > SEO Tricks**
- **Unknown ≠ False**
- **Never fabricate unverified claims**
- **Verification status must be earned, not assigned by pipeline logic**

---

## 2. Verification Status Hierarchy (Corrected Semantics)

The `VerificationStatus` type has three tiers (`src/pipeline/types.ts`):

```ts
type VerificationStatus = 'UNVERIFIED' | 'COMMUNITY_VERIFIED' | 'OFFICIALLY_VERIFIED';
```

### Corrected Semantic Definitions

| Status Code | Meaning | Criteria for assignment |
|---|---|---|
| `UNVERIFIED` | Source-derived listing. Location and category identified from public directories and geographic data. **No direct contact or confirmation from the mosque.** | Default for all pipeline-ingested records. |
| `COMMUNITY_VERIFIED` | Mosque community has directly confirmed their details (name, address, phone, hours, facilities) via an active verification process. | **Must only be set via an explicit operator action after direct community contact.** Never by pipeline signal alone. |
| `OFFICIALLY_VERIFIED` | Mosque is registered in an official Islamic federation registry and that registration has been cross-referenced. | **Must only be set via an explicit operator action with documented evidence.** |

### Correction Applied (2026-09-29)

Prior to this fix, `classify.ts` assigned `COMMUNITY_VERIFIED` to all records that matched mosque-like patterns (name indicators, Google category "mosque", "Islamic center", etc.). This was **semantically incorrect**: matching a name pattern or a Google Places category is not evidence of community confirmation.

All 443 published records and all 486 entities have been migrated:

| Field | Previous value | New value |
|---|---|---|
| `verificationStatus` (all 443 published) | `COMMUNITY_VERIFIED` | `UNVERIFIED` |
| `verificationStatus` (39 reviewed) | mixed `COMMUNITY_VERIFIED` / `UNVERIFIED` | `UNVERIFIED` |
| `verificationStatus` (4 rejected) | `UNVERIFIED` | `UNVERIFIED` (unchanged) |

`classify.ts` has been updated to never assign `COMMUNITY_VERIFIED` from pipeline signals.

---

## 3. User-Facing Badge Semantics (Corrected)

| Status | UI Badge (DE) | UI Badge (EN) | UI Badge (AR) | Visual Treatment |
|---|---|---|---|---|
| `OFFICIALLY_VERIFIED` | "Offiziell verifiziert" | "Officially Verified" | "معتمد رسمياً" | Green ShieldCheck |
| `COMMUNITY_VERIFIED` | "Gemeinde-bestätigt" | "Community Verified" | "معتمد مجتمعياً" | Green ShieldCheck |
| `UNVERIFIED` | "Erfasst" | "Listed" | "مُدرج" | Neutral Info badge (grey) |

### Current State (443 published)

Because all 443 records are `UNVERIFIED`, every mosque detail page displays:
- **Grey Info badge:** "Erfasst" / "Listed" / "مُدرج"
- **No green ShieldCheck** anywhere in the live site
- **No claim of direct community confirmation**

This is the correct, honest representation.

---

## 4. Facility Trust & The "Unknown ≠ False" Rule

An audit of all 443 published entities revealed:
- `womenArea`: null for 100% of records.
- `wudu`: null for 100% of records.
- `parking`: true for 20 records, null for 423 records.
- `wheelchairAccessible`: true for 234 records, null for 209 records.
- `restroom`: true for 429 records, null for 14 records.
- **false:** 0 records for all facilities.

### Hardened Presentation Rules
1. **Never convert missing data into false/negative statements.** Displays `dict.common.noInfo` ("Keine Angabe" / "Not available" / "غير محدد") whenever a facility property is null.
2. **Filtering Semantics:** Toggling a facility filter strictly checks `m.facilities.[prop] === true`. Unknown (null) is never treated as false.

---

## 5. Prayer Times Conservative Policy

- **Removed:** Previously contained a hardcoded speculative window `"Freitagsgebet (Jummah): In der Regel zwischen 13:00 und 14:30 Uhr"`.
- **Current Policy:** The prayer times card displays only a conservative disclaimer. Specific prayer times are only displayed when directly verified data is available in the database.

---

## 6. Regression Tests

Tests 18–21 in `tests/phase3a.test.ts` enforce these semantics permanently:

- **Test 18:** `COMMUNITY_VERIFIED` count in published dataset must equal 0.
- **Test 19:** `OFFICIALLY_VERIFIED` count in published dataset must equal 0.
- **Test 20:** All 443 published records must have `verificationStatus === 'UNVERIFIED'`.
- **Test 21:** `classify.ts` source must not contain the string `verificationStatus: 'COMMUNITY_VERIFIED'`.
