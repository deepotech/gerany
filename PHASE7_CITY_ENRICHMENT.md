# Phase 7 — Candidate City Enrichment & Quality Gate Strategy

**Domain:** `https://moscheeatlas.de`  
**Target Candidates:** Hannover, Duisburg, Bochum, Mannheim, Dresden  
**Policy:** Strict Gate Enforcement (*Accuracy > Record Count*)  

---

## 1. Candidate City Forensic Status

| Candidate City | State | Raw Records | Publishable Pool | Gate Status | Primary Gate Failure | Launch Decision |
|---|---|---|---|---|---|---|
| **Hannover** | Niedersachsen | 28 | 24 | `NOT_READY` | [GATE_C] > 50% missing phone | **WITHHELD** |
| **Duisburg** | Nordrhein-Westfalen | 61 | 58 | `NOT_READY` | [GATE_C] > 50% missing phone | **WITHHELD** |
| **Bochum** | Nordrhein-Westfalen | 13 | 10 | `BLOCKED` | [GATE_D] Found 1 non-Islamic entity (OTHER category) in publishable records | **WITHHELD** |
| **Mannheim** | Baden-Württemberg | 23 | 21 | `NOT_READY` | [GATE_C] > 50% missing phone | **WITHHELD** |
| **Dresden** | Sachsen | 3 | 3 | `BLOCKED` | [GATE_F] 3 publishable records (minimum required: 5) | **WITHHELD** |

---

## 2. City-by-City Forensic Detail & Action Plans

### Hannover (`hannover`)
- **Bundesland:** Niedersachsen
- **Source File:** `Hannover, Germany.json` (28 raw records)
- **Publishable Candidates:** 24 | **In Review:** 4 | **Rejected:** 0
- **Data Completeness:**
  - Missing Phone: 15 / 28 (54%)
  - Missing Website: 16 / 28 (57%)
  - Missing Address: 0 / 28
- **Quality Gate Evaluation:** `NOT_READY`
  - Blockers: None
  - Warnings: [GATE_C] > 50% missing phone
- **Recommended Evidence & Enrichment Work:**
  1. Phone Verification Campaign: 15/28 records lack telephone numbers (> 50%).
  1. Direct congregation contact outreach to confirm daily prayer hall availability.
  1. Address corroboration on Podbielskistraße and Vahrenwalder Straße centers.

### Duisburg (`duisburg`)
- **Bundesland:** Nordrhein-Westfalen
- **Source File:** `Duisburg, Germany.json` (61 raw records)
- **Publishable Candidates:** 58 | **In Review:** 3 | **Rejected:** 0
- **Data Completeness:**
  - Missing Phone: 31 / 61 (51%)
  - Missing Website: 30 / 61 (49%)
  - Missing Address: 0 / 61
- **Quality Gate Evaluation:** `NOT_READY`
  - Blockers: None
  - Warnings: [GATE_C] > 50% missing phone
- **Recommended Evidence & Enrichment Work:**
  1. Phone Verification Campaign: 31/61 records lack telephone numbers (> 50%).
  1. DITIB Marxloh Merkez Camii & regional congregation contact updates.
  1. Confirmation of community facilities in Hochfeld and Hamborn districts.

### Bochum (`bochum`)
- **Bundesland:** Nordrhein-Westfalen
- **Source File:** `Bochum, Germany.json` (13 raw records)
- **Publishable Candidates:** 10 | **In Review:** 3 | **Rejected:** 0
- **Data Completeness:**
  - Missing Phone: 5 / 13 (38%)
  - Missing Website: 9 / 13 (69%)
  - Missing Address: 0 / 13
- **Quality Gate Evaluation:** `BLOCKED`
  - Blockers: [GATE_D] Found 1 non-Islamic entity (OTHER category) in publishable records
  - Warnings: [GATE_D] > 10% are non-mosque categories (15%)
- **Recommended Evidence & Enrichment Work:**
  1. GATE_D Blocker Remediation: Reclassify non-mosque cultural destination (Darul Arqam - Quran-Haus) from OTHER to RELIGIOUS_ORGANIZATION or REJECT.
  1. Verify public daily congregation prayers at VIKZ Bochum Stahlhausen and DITIB Bochum.
  1. Phone number completeness verification.

### Mannheim (`mannheim`)
- **Bundesland:** Baden-Württemberg
- **Source File:** `Mannheim, Germany.json` (23 raw records)
- **Publishable Candidates:** 21 | **In Review:** 2 | **Rejected:** 0
- **Data Completeness:**
  - Missing Phone: 14 / 23 (61%)
  - Missing Website: 11 / 23 (48%)
  - Missing Address: 0 / 23
- **Quality Gate Evaluation:** `NOT_READY`
  - Blockers: None
  - Warnings: [GATE_C] > 50% missing phone
- **Recommended Evidence & Enrichment Work:**
  1. Phone Verification Campaign: 14/23 records lack telephone numbers (> 50%).
  1. Postal code explicit parsing: Ensure Mannheim postal codes (68159–68309) are corroborated in raw record field.
  1. Yavuz Sultan Selim Mosque contact enrichment.

### Dresden (`dresden`)
- **Bundesland:** Sachsen
- **Source File:** `Dresden, Germany.json` (3 raw records)
- **Publishable Candidates:** 3 | **In Review:** 0 | **Rejected:** 0
- **Data Completeness:**
  - Missing Phone: 0 / 3 (0%)
  - Missing Website: 1 / 3 (33%)
  - Missing Address: 0 / 3
- **Quality Gate Evaluation:** `BLOCKED`
  - Blockers: [GATE_F] 3 publishable records (minimum required: 5)
  - Warnings: None
- **Recommended Evidence & Enrichment Work:**
  1. GATE_F Blocker Remediation: Only 3 raw records exist (minimum required is 5).
  1. Field discovery / OpenStreetMap cross-referencing for prayer spaces in Dresden-Neustadt and university musallas.
  1. Community verification outreach with Marwa Elsherbiny Kultur- und Bildungszentrum.

---

## 3. Strict Quality Invariants

1. **No Artificial Gate Lowering:** The minimum threshold of 5 published records (GATE_F) for Dresden will NOT be reduced to 3.
2. **No False Phone Synthesis:** Missing phone numbers in Hannover, Duisburg, and Mannheim will NOT be populated with placeholder numbers.
3. **Controlled Promotion:** Once evidence is verified and all 10 gates pass, explicit promotion will be executed via `phase5b-promote-ready.ts --city <slug>`.
