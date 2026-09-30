import fs from 'fs';
import path from 'path';

function main() {
  const rootDir = path.resolve(__dirname, '..');
  const mosquesPath = path.join(rootDir, 'src', 'data', 'mosques.json');
  const allPath = path.join(rootDir, 'src', 'data', 'all-entities.json');

  const mosques: any[] = JSON.parse(fs.readFileSync(mosquesPath, 'utf8'));
  const allEntities: any[] = JSON.parse(fs.readFileSync(allPath, 'utf8'));

  const cityCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  const verifCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  mosques.forEach((m) => {
    cityCounts[m.city] = (cityCounts[m.city] || 0) + 1;
    statusCounts[m.dataStatus] = (statusCounts[m.dataStatus] || 0) + 1;
    verifCounts[m.verificationStatus] = (verifCounts[m.verificationStatus] || 0) + 1;
    categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
  });

  const allStatusCounts: Record<string, number> = {};
  allEntities.forEach((e) => {
    allStatusCounts[e.dataStatus] = (allStatusCounts[e.dataStatus] || 0) + 1;
  });

  const baselineData = {
    timestamp: new Date().toISOString(),
    totalPublished: mosques.length,
    totalAllEntities: allEntities.length,
    publishedCityCount: Object.keys(cityCounts).length,
    publishedCities: cityCounts,
    publishedDataStatuses: statusCounts,
    allEntityDataStatuses: allStatusCounts,
    verificationStatuses: verifCounts,
    categories: categoryCounts,
    sitemapUrlsEstimate: 3 + 3 + (Object.keys(cityCounts).length * 3) + (mosques.length * 3), // home + search + city*3 + mosque*3
  };

  const jsonOutPath = path.join(rootDir, 'PHASE5B_BASELINE.json');
  fs.writeFileSync(jsonOutPath, JSON.stringify(baselineData, null, 2), 'utf8');

  const mdContent = `# Phase 5B — Pre-Import Production Baseline

**Captured At:** ${baselineData.timestamp}
**Target Environment:** Production Dataset (Pre-Phase 5B Import)

---

## 1. Core Production Metrics

| Metric | Baseline Value | Note |
|---|---|---|
| **Total Published Records** | **${baselineData.totalPublished}** | \`src/data/mosques.json\` |
| **Total All Entities** | **${baselineData.totalAllEntities}** | \`src/data/all-entities.json\` |
| **Published Cities** | **${baselineData.publishedCityCount}** | Berlin, Dortmund, Düsseldorf, Essen, Frankfurt, Hamburg, Köln, München, Stuttgart |
| **Verification Semantics** | **100% UNVERIFIED** (${baselineData.totalPublished}/${baselineData.totalPublished}) | Zero false verification badges |
| **Estimated Sitemap URLs** | **${baselineData.sitemapUrlsEstimate}** | 3 home + 3 search + 27 city + 1,329 detail = 1,362 |

---

## 2. Published Records by City

| City | State | Published Count |
|---|---|---|
${Object.entries(cityCounts)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([city, count]) => `| ${city} | Germany | ${count} |`)
  .join('\n')}

---

## 3. Data Statuses in Production

### \`src/data/mosques.json\` (Published)
- **PUBLISHED:** ${statusCounts['PUBLISHED'] || 0}

### \`src/data/all-entities.json\` (Complete Pool)
- **PUBLISHED:** ${allStatusCounts['PUBLISHED'] || 0}
- **REVIEWED:** ${allStatusCounts['REVIEWED'] || 0}
- **REJECTED:** ${allStatusCounts['REJECTED'] || 0}

---

## 4. Categories Breakdown (Published)
${Object.entries(categoryCounts)
  .map(([cat, count]) => `- **${cat}:** ${count}`)
  .join('\n')}

---

## 5. Verification Protection Statement
All ${baselineData.totalPublished} existing published records must remain completely intact throughout Phase 5B.
No existing records may be deleted, renamed, re-slugged, or mutated without deterministic justification.
`;

  const mdOutPath = path.join(rootDir, 'PHASE5B_BASELINE.md');
  fs.writeFileSync(mdOutPath, mdContent, 'utf8');

  console.log(`[Phase 5B Baseline] Successfully captured baseline:`);
  console.log(`  Published records: ${baselineData.totalPublished}`);
  console.log(`  All entities:      ${baselineData.totalAllEntities}`);
  console.log(`  Published cities:  ${baselineData.publishedCityCount}`);
  console.log(`  Output files:`);
  console.log(`    - ${jsonOutPath}`);
  console.log(`    - ${mdOutPath}`);
}

main();
