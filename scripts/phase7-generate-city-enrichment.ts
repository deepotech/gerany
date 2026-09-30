import fs from 'fs';
import path from 'path';
import { RawGooglePlaceRecord } from '../src/pipeline/types';
import { validateCityForLaunch } from '../src/pipeline/city-gates';

interface CandidateCityAudit {
  city: string;
  slug: string;
  state: string;
  sourceFile: string;
  rawCount: number;
  publishableCount: number;
  reviewCount: number;
  rejectedCount: number;
  duplicateCount: number;
  missingPhoneCount: number;
  missingWebsiteCount: number;
  missingAddressCount: number;
  gateStatus: 'BLOCKED' | 'NOT_READY' | 'READY_FOR_LAUNCH';
  gateBlockers: string[];
  gateWarnings: string[];
  recommendation: string;
  evidenceWorkRequired: string[];
}

function main() {
  const rootDir = path.resolve(__dirname, '..');
  const candidateConfigs = [
    { city: 'Hannover', slug: 'hannover', state: 'Niedersachsen', file: 'Hannover, Germany.json' },
    { city: 'Duisburg', slug: 'duisburg', state: 'Nordrhein-Westfalen', file: 'Duisburg, Germany.json' },
    { city: 'Bochum', slug: 'bochum', state: 'Nordrhein-Westfalen', file: 'Bochum, Germany.json' },
    { city: 'Mannheim', slug: 'mannheim', state: 'Baden-Württemberg', file: 'Mannheim, Germany.json' },
    { city: 'Dresden', slug: 'dresden', state: 'Sachsen', file: 'Dresden, Germany.json' },
  ];

  const audits: CandidateCityAudit[] = [];

  for (const config of candidateConfigs) {
    const rawPath = path.join(rootDir, config.file);
    if (!fs.existsSync(rawPath)) continue;

    const rawRecords: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(rawPath, 'utf8'));

    // Check cached report if exists
    const reportPath = path.join(rootDir, 'reports', 'phase5b', `${config.slug}.json`);
    let cachedReport: any = null;
    if (fs.existsSync(reportPath)) {
      cachedReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    }

    const missingPhone = rawRecords.filter((r) => !r.phone).length;
    const missingWebsite = rawRecords.filter((r) => !r.website).length;
    const missingAddress = rawRecords.filter((r) => !r.address).length;

    const gateReport = cachedReport?.gateReport;
    const gateStatus = gateReport?.status || 'NOT_READY';
    const blockers = (gateReport?.blockers || []).map((b: any) => `[${b.gate}] ${b.reason}`);
    const warnings = (gateReport?.warnings || []).map((w: any) => `[${w.gate}] ${w.reason}`);

    let evidenceWork: string[] = [];
    if (config.slug === 'hannover') {
      evidenceWork = [
        'Phone Verification Campaign: 15/28 records lack telephone numbers (> 50%).',
        'Direct congregation contact outreach to confirm daily prayer hall availability.',
        'Address corroboration on Podbielskistraße and Vahrenwalder Straße centers.',
      ];
    } else if (config.slug === 'duisburg') {
      evidenceWork = [
        'Phone Verification Campaign: 31/61 records lack telephone numbers (> 50%).',
        'DITIB Marxloh Merkez Camii & regional congregation contact updates.',
        'Confirmation of community facilities in Hochfeld and Hamborn districts.',
      ];
    } else if (config.slug === 'bochum') {
      evidenceWork = [
        'GATE_D Blocker Remediation: Reclassify non-mosque cultural destination (Darul Arqam - Quran-Haus) from OTHER to RELIGIOUS_ORGANIZATION or REJECT.',
        'Verify public daily congregation prayers at VIKZ Bochum Stahlhausen and DITIB Bochum.',
        'Phone number completeness verification.',
      ];
    } else if (config.slug === 'mannheim') {
      evidenceWork = [
        'Phone Verification Campaign: 14/23 records lack telephone numbers (> 50%).',
        'Postal code explicit parsing: Ensure Mannheim postal codes (68159–68309) are corroborated in raw record field.',
        'Yavuz Sultan Selim Mosque contact enrichment.',
      ];
    } else if (config.slug === 'dresden') {
      evidenceWork = [
        'GATE_F Blocker Remediation: Only 3 raw records exist (minimum required is 5).',
        'Field discovery / OpenStreetMap cross-referencing for prayer spaces in Dresden-Neustadt and university musallas.',
        'Community verification outreach with Marwa Elsherbiny Kultur- und Bildungszentrum.',
      ];
    }

    audits.push({
      city: config.city,
      slug: config.slug,
      state: config.state,
      sourceFile: config.file,
      rawCount: rawRecords.length,
      publishableCount: cachedReport?.publishedCount || 0,
      reviewCount: cachedReport?.reviewCount || 0,
      rejectedCount: cachedReport?.rejectedCount || 0,
      duplicateCount: 0,
      missingPhoneCount: missingPhone,
      missingWebsiteCount: missingWebsite,
      missingAddressCount: missingAddress,
      gateStatus,
      gateBlockers: blockers,
      gateWarnings: warnings,
      recommendation: gateReport?.recommendation || 'Enrichment required before promotion.',
      evidenceWorkRequired: evidenceWork,
    });
  }

  // Generate PHASE7_CITY_ENRICHMENT.md
  let md = `# Phase 7 — Candidate City Enrichment & Quality Gate Strategy

**Domain:** \`https://moscheeatlas.de\`  
**Target Candidates:** Hannover, Duisburg, Bochum, Mannheim, Dresden  
**Policy:** Strict Gate Enforcement (*Accuracy > Record Count*)  

---

## 1. Candidate City Forensic Status

| Candidate City | State | Raw Records | Publishable Pool | Gate Status | Primary Gate Failure | Launch Decision |
|---|---|---|---|---|---|---|
`;

  for (const a of audits) {
    md += `| **${a.city}** | ${a.state} | ${a.rawCount} | ${a.publishableCount} | \`${a.gateStatus}\` | ${a.gateBlockers[0] || a.gateWarnings[0] || 'None'} | **WITHHELD** |\n`;
  }

  md += `\n---

## 2. City-by-City Forensic Detail & Action Plans

`;

  for (const a of audits) {
    md += `### ${a.city} (\`${a.slug}\`)
- **Bundesland:** ${a.state}
- **Source File:** \`${a.sourceFile}\` (${a.rawCount} raw records)
- **Publishable Candidates:** ${a.publishableCount} | **In Review:** ${a.reviewCount} | **Rejected:** ${a.rejectedCount}
- **Data Completeness:**
  - Missing Phone: ${a.missingPhoneCount} / ${a.rawCount} (${Math.round((a.missingPhoneCount / a.rawCount) * 100)}%)
  - Missing Website: ${a.missingWebsiteCount} / ${a.rawCount} (${Math.round((a.missingWebsiteCount / a.rawCount) * 100)}%)
  - Missing Address: ${a.missingAddressCount} / ${a.rawCount}
- **Quality Gate Evaluation:** \`${a.gateStatus}\`
  - Blockers: ${a.gateBlockers.length > 0 ? a.gateBlockers.join(', ') : 'None'}
  - Warnings: ${a.gateWarnings.length > 0 ? a.gateWarnings.join(', ') : 'None'}
- **Recommended Evidence & Enrichment Work:**
${a.evidenceWorkRequired.map((w) => `  1. ${w}`).join('\n')}

`;
  }

  md += `---

## 3. Strict Quality Invariants

1. **No Artificial Gate Lowering:** The minimum threshold of 5 published records (GATE_F) for Dresden will NOT be reduced to 3.
2. **No False Phone Synthesis:** Missing phone numbers in Hannover, Duisburg, and Mannheim will NOT be populated with placeholder numbers.
3. **Controlled Promotion:** Once evidence is verified and all 10 gates pass, explicit promotion will be executed via \`phase5b-promote-ready.ts --city <slug>\`.
`;

  fs.writeFileSync(path.join(rootDir, 'PHASE7_CITY_ENRICHMENT.md'), md, 'utf8');
  console.log('[Phase 7] PHASE7_CITY_ENRICHMENT.md generated successfully.');
}

main();
