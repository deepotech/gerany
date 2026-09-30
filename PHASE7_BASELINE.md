# Phase 7 — Production Baseline Snapshot

**Domain:** `https://moscheeatlas.de`  
**Execution Timestamp:** 2026-09-30T11:25:00Z  
**Baseline Status:** VERIFIED & FROZEN  

---

## 1. Authoritative Production Counts

| Metric | Baseline Value | Invariant Rule |
|---|---|---|
| **Published Mosques** | **542** | Must not change unless an explicit P0/P1 defect is proven |
| **Published Cities** | **14** | Berlin (104), Hamburg (65), München (54), Dortmund (50), Frankfurt (50), Köln (39), Bremen (37), Stuttgart (27), Düsseldorf (27), Essen (27), Wuppertal (24), Nürnberg (18), Bonn (14), Leipzig (6) |
| **All Entities Pool** | **594** | 542 Published + 52 Reviewed |
| **Sitemap URLs** | **1,674** | 3 home + 3 search hubs + 42 city pages + 1,626 detail pages |
| **Verification State** | **100% UNVERIFIED** | 542/542 records have \`verificationStatus: 'UNVERIFIED'\` |
| **Prayer Times** | **0 Fabricated** | No static prayer times generated |
| **Facilities Semantics** | **null = unknown** | Zero unverified booleans defaulted to false |
| **Automated Tests** | **224 passing** | 12 test suites in Vitest |
| **HTTP Smoke Tests** | **33 passing** | 100% success on \`localhost:3000\` |

---

## 2. Protected City Configurations

| City Slug | Canonical Name | State | Baseline Published Records |
|---|---|---|---|
| `berlin` | Berlin | Berlin | 104 |
| `hamburg` | Hamburg | Hamburg | 65 |
| `muenchen` | München | Bayern | 54 |
| `dortmund` | Dortmund | Nordrhein-Westfalen | 50 |
| `frankfurt` | Frankfurt | Hessen | 50 |
| `koeln` | Köln | Nordrhein-Westfalen | 39 |
| `bremen` | Bremen | Bremen | 37 |
| `stuttgart` | Stuttgart | Baden-Württemberg | 27 |
| `duesseldorf` | Düsseldorf | Nordrhein-Westfalen | 27 |
| `essen` | Essen | Nordrhein-Westfalen | 27 |
| `wuppertal` | Wuppertal | Nordrhein-Westfalen | 24 |
| `nuernberg` | Nürnberg | Bayern | 18 |
| `bonn` | Bonn | Nordrhein-Westfalen | 14 |
| `leipzig` | Leipzig | Sachsen | 6 |

---

## 3. Candidate Cities In Review / Blocked (Zero Exposure)

| Candidate City | Slug | Current Gate Status | Published in Production | In Sitemap |
|---|---|---|---|---|
| **Hannover** | `hannover` | `NOT_READY` (GATE_C) | 0 | 0 |
| **Duisburg** | `duisburg` | `NOT_READY` (GATE_C) | 0 | 0 |
| **Bochum** | `bochum` | `BLOCKED` (GATE_D) | 0 | 0 |
| **Mannheim** | `mannheim` | `NOT_READY` (GATE_C) | 0 | 0 |
| **Dresden** | `dresden` | `BLOCKED` (GATE_F) | 0 | 0 |

---

## 4. Regression Guarantee

Any new feature in Phase 7 (Operator Review, Verification Events, Claim Workflow, Community Submissions) operates in a strictly isolated governance layer and does NOT mutate this baseline.
