import fs from 'fs';
import path from 'path';

interface CandidateCity {
  city: string;
  file: string;
  state: string;
}

const candidateFiles: CandidateCity[] = [
  { city: 'Hannover', file: 'Hannover, Germany.json', state: 'Niedersachsen' },
  { city: 'Bremen', file: 'Bremen, Germany.json', state: 'Bremen' },
  { city: 'Duisburg', file: 'Duisburg, Germany.json', state: 'Nordrhein-Westfalen' },
  { city: 'Bochum', file: 'Bochum, Germany.json', state: 'Nordrhein-Westfalen' },
  { city: 'Wuppertal', file: 'Wuppertal, Germany.json', state: 'Nordrhein-Westfalen' },
  { city: 'Bonn', file: 'Bonn, Germany.json', state: 'Nordrhein-Westfalen' },
  { city: 'Mannheim', file: 'Mannheim, Germany.json', state: 'Baden-Württemberg' },
  { city: 'Nürnberg', file: 'Nürnberg, Germany.json', state: 'Bayern' },
  { city: 'Leipzig', file: 'Leipzig, Germany.json', state: 'Sachsen' },
  { city: 'Dresden', file: 'Dresden, Germany.json', state: 'Sachsen' },
];

function main() {
  const rootDir = path.resolve(__dirname, '..');
  let md = '# Phase 5B — Source Data Inventory (10 Candidate Cities)\n\n';
  md += `**Generated At:** ${new Date().toISOString()}\n`;
  md += `**Total Candidate Datasets:** 10\n\n---\n\n`;
  md += `## 1. Summary Table\n\n`;
  md += `| City | File | Size | Raw Count | Unique IDs | Missing IDs | Coords | Address | Phone | Website | Hours | Ratings | Images |\n`;
  md += `|---|---|---|---|---|---|---|---|---|---|---|---|---|\n`;

  let totalRaw = 0;
  let totalUniqueIds = 0;

  const details: any[] = [];

  for (const item of candidateFiles) {
    const filePath = path.join(rootDir, item.file);
    if (!fs.existsSync(filePath)) {
      console.error('File not found:', item.file);
      continue;
    }
    const stat = fs.statSync(filePath);
    const data: any[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const placeIds = new Set<string>();
    let missingPlaceId = 0;
    let hasCoords = 0;
    let hasAddress = 0;
    let hasPhone = 0;
    let hasWebsite = 0;
    let hasHours = 0;
    let hasRating = 0;
    let hasImage = 0;
    const categories: Record<string, number> = {};

    data.forEach((r) => {
      if (r.placeId) placeIds.add(r.placeId);
      else missingPlaceId++;

      if (
        r.location &&
        typeof r.location.lat === 'number' &&
        typeof r.location.lng === 'number' &&
        r.location.lat !== 0 &&
        r.location.lng !== 0
      )
        hasCoords++;
      if (r.address && r.address.trim().length > 0) hasAddress++;
      if (r.phone && r.phone.trim().length > 0) hasPhone++;
      if (r.website && r.website.trim().length > 0) hasWebsite++;
      if (r.openingHours && Array.isArray(r.openingHours) && r.openingHours.length > 0) hasHours++;
      if (typeof r.rating === 'number' || typeof r.reviewsCount === 'number') hasRating++;
      if (r.imageUrl || r.image) hasImage++;

      const cat = r.categoryName || 'Unknown';
      categories[cat] = (categories[cat] || 0) + 1;
    });

    totalRaw += data.length;
    totalUniqueIds += placeIds.size;

    md += `| **${item.city}** | \`${item.file}\` | ${(stat.size / 1024).toFixed(1)} KB | ${data.length} | ${placeIds.size} | ${missingPlaceId} | ${hasCoords} | ${hasAddress} | ${hasPhone} | ${hasWebsite} | ${hasHours} | ${hasRating} | ${hasImage} |\n`;

    details.push({
      city: item.city,
      file: item.file,
      state: item.state,
      size: stat.size,
      count: data.length,
      placeIdsCount: placeIds.size,
      missingPlaceId,
      hasCoords,
      hasAddress,
      hasPhone,
      hasWebsite,
      hasHours,
      hasRating,
      hasImage,
      categories,
    });
  }

  md += `\n**Total Candidate Raw Records:** ${totalRaw}\n`;
  md += `**Total Unique Source Place IDs:** ${totalUniqueIds}\n\n---\n\n`;

  md += `## 2. City-by-City Initial Category Distributions\n\n`;

  for (const d of details) {
    md += `### ${d.city} (\`${d.file}\`)\n`;
    md += `- **Federal State:** ${d.state}\n`;
    md += `- **Raw Records:** ${d.count} (Unique placeIds: ${d.placeIdsCount})\n`;
    md += `- **Categories Breakdown:**\n`;
    for (const [cat, count] of Object.entries(d.categories)) {
      md += `  - \`${cat}\`: ${count}\n`;
    }
    md += `- **Data Completeness:**\n`;
    md += `  - Coordinates: ${d.hasCoords}/${d.count} (${((d.hasCoords / d.count) * 100).toFixed(1)}%)\n`;
    md += `  - Address: ${d.hasAddress}/${d.count} (${((d.hasAddress / d.count) * 100).toFixed(1)}%)\n`;
    md += `  - Phone: ${d.hasPhone}/${d.count} (${((d.hasPhone / d.count) * 100).toFixed(1)}%)\n`;
    md += `  - Website: ${d.hasWebsite}/${d.count} (${((d.hasWebsite / d.count) * 100).toFixed(1)}%)\n`;
    md += `  - Opening Hours: ${d.hasHours}/${d.count} (${((d.hasHours / d.count) * 100).toFixed(1)}%)\n`;
    md += `  - Ratings/Reviews: ${d.hasRating}/${d.count} (${((d.hasRating / d.count) * 100).toFixed(1)}%)\n`;
    md += `  - Images: ${d.hasImage}/${d.count} (${((d.hasImage / d.count) * 100).toFixed(1)}%)\n\n`;
  }

  const outPath = path.join(rootDir, 'PHASE5B_SOURCE_INVENTORY.md');
  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`[Phase 5B Inventory] Saved ${outPath} with ${details.length} cities and ${totalRaw} total raw records.`);
}

main();
