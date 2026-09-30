# Phase 7 — Community Contributions & Edit Staging

**Domain:** `https://moscheeatlas.de`  
**Execution Date:** 2026-09-30  
**Status:** IMPLEMENTED & STAGED  

---

## 1. Staged Ingestion Architecture

All community contributions (contact details, facility booleans, prayer times, languages, Friday prayer announcements) enter a staging pool:

```
User Proposal --> STATUS: PENDING --> Operator Review --> APPROVED / REJECTED
```

### Modifiable Fields:
- `phone`
- `website`
- `openingHours`
- `facilities` (`parking`, `womenArea`, `wheelchairAccessible`, `restroom`, `wudu`)
- `languages` (German, Turkish, Arabic, Bosnian, English, Urdu, etc.)
- `fridayPrayerInfo` (Khutbah language, congregation count, time)
- `prayerTimes` (Temporal schedule with source)
- `address`
- `imageUrl`

### Guardrails:
- Proposed values are stored alongside `previousValue` for instant diffing.
- Rejection preserves existing published data without side effects.
- Direct database writes from client submissions are strictly blocked.
