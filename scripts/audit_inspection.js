const fs = require('fs');
const path = require('path');

// 1. Load entities and cities
const entities = JSON.parse(fs.readFileSync('src/data/all-entities.json', 'utf8'));
const cities20 = [...new Set(entities.map(e => e.city))].sort();

// Group mosques by city
const cityMosques = {};
cities20.forEach(c => cityMosques[c] = []);
entities.forEach(e => {
  if (cityMosques[e.city]) {
    cityMosques[e.city].push(e);
  }
});

// 2. Load Pages.csv
const pagesCsv = fs.readFileSync('reports/gsc/export-2026-11-09/Pages.csv', 'utf8');
const pageLines = pagesCsv.split(/\r?\n/).filter(Boolean);
const pageRows = pageLines.slice(1).map(line => {
  // simple csv parser for URL, Clicks, Impressions, CTR, Position
  const parts = line.split(',');
  if (parts.length < 5) return null;
  const url = parts[0].trim();
  const clicks = parseInt(parts[1].trim(), 10) || 0;
  const impressions = parseInt(parts[2].trim(), 10) || 0;
  const ctr = parts[3].trim();
  const position = parseFloat(parts[4].trim()) || 0;
  return { url, clicks, impressions, ctr, position };
}).filter(Boolean);

console.log('=== TOTAL ENTITIES & CITIES ===');
console.log('Total published mosques:', entities.length);
console.log('Total published cities:', cities20.length);

// 3. Match city hubs in Pages.csv
// A city hub URL looks like:
// https://moscheeindernaehe.de/de/moscheen/{slug}
// https://moscheeindernaehe.de/en/mosques/{englishSlug}
// https://moscheeindernaehe.de/ar/mosques/{slug or arabicName}
// Note: also old URLs or query-parameterized URLs like ?district=

const cityConfigModule = fs.readFileSync('src/pipeline/city-config.ts', 'utf8');

// Parse slug mappings
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

console.log('\n=== CITY AUDIT IN GSC PAGES.CSV ===');

const cityAudit = {};

cities20.forEach(cityName => {
  const slug = citySlugs[cityName];
  const mosques = cityMosques[cityName] || [];
  
  // Find all URLs in Pages.csv that correspond to this city hub
  const matchingPages = pageRows.filter(r => {
    try {
      const u = decodeURIComponent(r.url);
      // City hubs are /moscheen/{slug} or /mosques/{slug} or Arabic variants
      // Must NOT be a detail page: /moschee/{slug}/{detail} or /mosque/{slug}/{detail}
      const isDeHub = u.includes(`/de/moscheen/${slug}`);
      const isEnHub = u.includes(`/en/mosques/${slug}`);
      const isArHub = u.includes(`/ar/mosques/${slug}`) || u.includes(`/ar/mosques/${cityName}`);
      
      // Ensure it's not a detail page
      if (u.includes('/moschee/') || (u.includes('/mosque/') && !u.includes('/mosques/'))) {
        return false;
      }
      
      return isDeHub || isEnHub || isArHub;
    } catch (e) {
      return false;
    }
  });

  cityAudit[cityName] = {
    canonical: cityName,
    slug: slug,
    mosqueCount: mosques.length,
    matchingPages: matchingPages,
    inGsc: matchingPages.length > 0,
    totalClicks: matchingPages.reduce((acc, p) => acc + p.clicks, 0),
    totalImpressions: matchingPages.reduce((acc, p) => acc + p.impressions, 0),
  };
});

Object.values(cityAudit).forEach(c => {
  if (c.inGsc) {
    console.log(`[FOUND] ${c.canonical} (${c.slug}): ${c.mosqueCount} mosques | GSC Hub Pages: ${c.matchingPages.length} | Clicks: ${c.totalClicks} | Imp: ${c.totalImpressions}`);
    c.matchingPages.forEach(p => console.log(`   - ${p.url} (Clicks: ${p.clicks}, Imp: ${p.impressions}, Pos: ${p.position})`));
  } else {
    console.log(`[ABSENT] ${c.canonical} (${c.slug}): ${c.mosqueCount} mosques | GSC Hub Pages: NOT IN EXPORT (Unavailable)`);
  }
});
