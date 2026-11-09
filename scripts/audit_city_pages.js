const fs = require('fs');
const path = require('path');

const entities = JSON.parse(fs.readFileSync('src/data/all-entities.json', 'utf8'));
const published = entities.filter(e => e.dataStatus === 'PUBLISHED');

// City configs
const citySlugs = {
  'Aachen': 'aachen',
  'Berlin': 'berlin',
  'Bonn': 'bonn',
  'Bremen': 'bremen',
  'Dortmund': 'dortmund',
  'Düsseldorf': 'duesseldorf',
  'Essen': 'essen',
  'Frankfurt': 'frankfurt',
  'Freiburg im Breisgau': 'freiburg',
  'Hamburg': 'hamburg',
  'Köln': 'koeln',
  'Leipzig': 'leipzig',
  'Lübeck': 'luebeck',
  'München': 'muenchen',
  'Münster': 'muenster',
  'Nürnberg': 'nuernberg',
  'Saarbrücken': 'saarbruecken',
  'Stuttgart': 'stuttgart',
  'Wiesbaden': 'wiesbaden',
  'Wuppertal': 'wuppertal',
};

// GSC Pages.csv
const pagesCsv = fs.readFileSync('reports/gsc/export-2026-11-09/Pages.csv', 'utf8');
const pageLines = pagesCsv.split(/\r?\n/).filter(Boolean);
const pageRows = pageLines.slice(1).map(line => {
  const parts = line.split(',');
  if (parts.length < 5) return null;
  return {
    url: parts[0].trim(),
    clicks: parseInt(parts[1].trim(), 10) || 0,
    impressions: parseInt(parts[2].trim(), 10) || 0,
    ctr: parts[3].trim(),
    position: parseFloat(parts[4].trim()) || 0,
  };
}).filter(Boolean);

const results = [];

for (const [cityName, slug] of Object.entries(citySlugs)) {
  const cityMosques = published.filter(e => e.city === cityName);
  
  // Inspect generated HTML file
  const htmlPath = path.join('.next/server/app/de/moscheen', `${slug}.html`);
  let htmlExists = fs.existsSync(htmlPath);
  let title = '';
  let description = '';
  let h1 = '';
  let linkCount = 0;
  let sectionCount = 0;
  let hasJsonLd = false;
  let itemCount = 0;
  
  if (htmlExists) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const titleM = html.match(/<title>(.*?)<\/title>/);
    title = titleM ? titleM[1] : '';
    const descM = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/);
    description = descM ? descM[1] : '';
    const h1M = html.match(/<h1[^>]*>(.*?)<\/h1>/);
    h1 = h1M ? h1M[1].replace(/<[^>]*>/g, '') : '';
    const links = html.match(/<a\s+[^>]*href=/gi) || [];
    linkCount = links.length;
    
    // Check schemas
    const ldJsonMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
    hasJsonLd = ldJsonMatches.length > 0;
    ldJsonMatches.forEach(m => {
      const jsonStr = m.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '');
      try {
        const obj = JSON.parse(jsonStr);
        if (obj['@type'] === 'CollectionPage' && obj.mainEntity && obj.mainEntity.itemListElement) {
          itemCount = obj.mainEntity.itemListElement.length;
        }
      } catch (e) {}
    });
  }

  // Find in GSC Pages.csv for German URL
  const deUrl = `https://moscheeindernaehe.de/de/moscheen/${slug}`;
  const enUrl = `https://moscheeindernaehe.de/en/mosques/${slug}`;
  const arUrl = `https://moscheeindernaehe.de/ar/mosques/${slug}`;
  
  const deGsc = pageRows.find(r => r.url === deUrl);
  const enGsc = pageRows.find(r => r.url === enUrl || r.url.endsWith(`/en/mosques/${slug}`));
  const arGsc = pageRows.find(r => r.url === arUrl || r.url.endsWith(`/ar/mosques/${slug}`));

  // Check all matches for this city slug in Pages.csv
  const allMatches = pageRows.filter(r => {
    const u = decodeURIComponent(r.url);
    if (u.includes('/moschee/') || (u.includes('/mosque/') && !u.includes('/mosques/'))) return false;
    return u.includes(`/${slug}`) || u.includes(`/${cityName}`);
  });

  results.push({
    cityName,
    slug,
    mosqueCount: cityMosques.length,
    htmlExists,
    title,
    description,
    h1,
    linkCount,
    itemCount,
    deGsc: deGsc ? { clicks: deGsc.clicks, impressions: deGsc.impressions, pos: deGsc.position } : null,
    enGsc: enGsc ? { clicks: enGsc.clicks, impressions: enGsc.impressions, pos: enGsc.position } : null,
    arGsc: arGsc ? { clicks: arGsc.clicks, impressions: arGsc.impressions, pos: arGsc.position } : null,
    totalGscImp: allMatches.reduce((acc, m) => acc + m.impressions, 0),
    totalGscClicks: allMatches.reduce((acc, m) => acc + m.clicks, 0),
    allMatchesCount: allMatches.length,
  });
}

console.log(JSON.stringify(results, null, 2));
