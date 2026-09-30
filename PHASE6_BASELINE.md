# Phase 6 — Protected Production Baseline

**Captured At:** 2026-09-30T11:07:27.567Z  
**Production Dataset:** Authoritative verified state post-Phase 5B  

---

## 1. High-Level Metrics

| Metric | Protected Baseline Value | Verification Rule |
|---|---|---|
| **Total Published Mosques** | **542** | Must never decrease without documented defect |
| **Total Published Cities** | **14** | 9 Base + 5 Promoted in Phase 5B |
| **Total All Entities** | **594** | Complete entity pool in `all-entities.json` |
| **Canonical Sitemap URLs** | **1,674** | 3 home + 3 search + 42 city + 1,626 detail |
| **Verification Semantics** | **100% UNVERIFIED** (542/542) | Zero unearned verification badges |
| **Prayer Times** | **0 Fabricated** | No synthetic times allowed |
| **Facilities Semantics** | **null = unknown** | No artificial false conversions |

---

## 2. Published Cities Breakdown

| City | State | Published Mosques | Status |
|---|---|---|---|
| **Berlin** | Germany | 104 | PUBLISHED |
| **Bonn** | Germany | 14 | PUBLISHED |
| **Bremen** | Germany | 37 | PUBLISHED |
| **Dortmund** | Germany | 50 | PUBLISHED |
| **Düsseldorf** | Germany | 27 | PUBLISHED |
| **Essen** | Germany | 27 | PUBLISHED |
| **Frankfurt** | Germany | 50 | PUBLISHED |
| **Hamburg** | Germany | 65 | PUBLISHED |
| **Köln** | Germany | 39 | PUBLISHED |
| **Leipzig** | Germany | 6 | PUBLISHED |
| **München** | Germany | 54 | PUBLISHED |
| **Nürnberg** | Germany | 18 | PUBLISHED |
| **Stuttgart** | Germany | 27 | PUBLISHED |
| **Wuppertal** | Germany | 24 | PUBLISHED |

---

## 3. Stable Identifier Index (Sample of 14 Cities)

| City | Primary Place ID Example | Canonical Name Example | Slug Example |
|---|---|---|---|
| Berlin | `ChIJdS9FyEFTqEcRE-EAa2RjgYQ` | Lubars Mosque | `lubars-mosque` |
| Bonn | `ChIJuwEBhsPhvkcRDCqyxDysJHo` | Al-Muhajirin Mosque Bonn e.V. | `al-muhajirin-mosque-bonn` |
| Bremen | `ChIJE3QeUwopsUcRiX3YAqsLR9s` | DITIB Mevlana-Moschee Bremen | `ditib-mevlana-moschee-bremen` |
| Dortmund | `ChIJDfcsxvgZuUcRgyy_c_OYId8` | مسجد ابو بكر | `msjd-abw-bkr` |
| Düsseldorf | `ChIJQXDUW8HLuEcROysb6GyV-Iw` | Transparente Moschee (مسجد المصطفى) | `transparente-moschee` |
| Essen | `ChIJxxdvEWDCuEcR2B-IB4BtORA` | DITIB Central Mosque Essen | `ditib-central-mosque-essen` |
| Frankfurt | `ChIJ5ch7Hp8IvUcRS8sOHD20Yy8` | DITIB - Türkisch Islamische Gemeinde zu Frankfurt-Bonames e.V. | `ditib-tuerkisch-islamische-gemeinde-zu-frankfurt-bonames` |
| Hamburg | `ChIJA4S80vmLsUcR96C5FCg7py8` | Association Afghan Muslims Belal e. V. | `association-afghan-muslims-belal` |
| Köln | `ChIJ8xoKhMIvv0cRvHgLy2kh7ko` | Köln Moschee - Majlis Ansarullah | `koeln-moschee-majlis-ansarullah` |
| Leipzig | `ChIJK2clbxv4pkcRKerKRAyClBE` | Al Rahman Mosque | `al-rahman-mosque` |
| München | `ChIJN32byF91nkcRx6u5yTmIC8s` | Afghanische Moschee/Mosque | `afghanische-moschee-mosque` |
| Nürnberg | `ChIJYx8sehFXn0cRpbRvKpnVLLQ` | DITIB Nuremberg Central Mosque | `ditib-nuremberg-central-mosque` |
| Stuttgart | `ChIJuYQW1hzFmUcRf_mm0qctoMA` | Akşemsettin Mosque – Turkish National Cultural Association Stuttgart | `ak-emsettin-mosque-turkish-national-cultural-association-stuttgart` |
| Wuppertal | `ChIJzf_1ULDXuEcRF5jTze4voWs` | DITIB Zentralmoschee Wuppertal | `ditib-zentralmoschee-wuppertal` |

---

## 4. Production Protection Mandate

These 542 published records represent genuine, verified community facilities.
Any future phase, data ingestion, or refactoring MUST NOT mutate:
- Place IDs
- Slugs
- Coordinates
- Verification statuses
- City associations

All regression test suites in Phase 6 will assert against this baseline.
