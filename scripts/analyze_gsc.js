const fs = require('fs');
const path = require('path');

function parseCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split(/\r?\n/);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const rawParts = line.split(',');
    if (rawParts.length >= 5) {
      const pos = parseFloat(rawParts[rawParts.length - 1]) || 0;
      const ctr = rawParts[rawParts.length - 2];
      const imp = parseInt(rawParts[rawParts.length - 3], 10) || 0;
      const clicks = parseInt(rawParts[rawParts.length - 4], 10) || 0;
      const name = rawParts.slice(0, rawParts.length - 4).join(',').replace(/^\"|\"$/g, '');
      rows.push({ name, clicks, impressions: imp, ctr, position: pos });
    }
  }
  return rows;
}

const entities = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'all-entities.json'), 'utf8'))
  .filter(e => e.dataStatus === 'PUBLISHED');

const pagesPath = path.join(__dirname, '..', 'reports', 'gsc', 'export-2026-11-09', 'Pages.csv');
const pages = parseCsv(pagesPath);

// The 20 published cities in Germany
const publishedCities = [
  { canonical: 'Berlin', slug: 'berlin', englishSlug: 'berlin', state: 'Berlin' },
  { canonical: 'Hamburg', slug: 'hamburg', englishSlug: 'hamburg', state: 'Hamburg' },
  { canonical: 'München', slug: 'muenchen', englishSlug: 'munich', state: 'Bayern' },
  { canonical: 'Köln', slug: 'koeln', englishSlug: 'cologne', state: 'Nordrhein-Westfalen' },
  { canonical: 'Frankfurt', slug: 'frankfurt', englishSlug: 'frankfurt', state: 'Hessen' },
  { canonical: 'Stuttgart', slug: 'stuttgart', englishSlug: 'stuttgart', state: 'Baden-Württemberg' },
  { canonical: 'Düsseldorf', slug: 'duesseldorf', englishSlug: 'duesseldorf', state: 'Nordrhein-Westfalen' },
  { canonical: 'Dortmund', slug: 'dortmund', englishSlug: 'dortmund', state: 'Nordrhein-Westfalen' },
  { canonical: 'Essen', slug: 'essen', englishSlug: 'essen', state: 'Nordrhein-Westfalen' },
  { canonical: 'Bremen', slug: 'bremen', englishSlug: 'bremen', state: 'Bremen' },
  { canonical: 'Leipzig', slug: 'leipzig', englishSlug: 'leipzig', state: 'Sachsen' },
  { canonical: 'Nürnberg', slug: 'nuernberg', englishSlug: 'nuremberg', state: 'Bayern' },
  { canonical: 'Wuppertal', slug: 'wuppertal', englishSlug: 'wuppertal', state: 'Nordrhein-Westfalen' },
  { canonical: 'Bonn', slug: 'bonn', englishSlug: 'bonn', state: 'Nordrhein-Westfalen' },
  { canonical: 'Münster', slug: 'muenster', englishSlug: 'muenster', state: 'Nordrhein-Westfalen' },
  { canonical: 'Wiesbaden', slug: 'wiesbaden', englishSlug: 'wiesbaden', state: 'Hessen' },
  { canonical: 'Aachen', slug: 'aachen', englishSlug: 'aachen', state: 'Nordrhein-Westfalen' },
  { canonical: 'Lübeck', slug: 'luebeck', englishSlug: 'luebeck', state: 'Schleswig-Holstein' },
  { canonical: 'Freiburg im Breisgau', slug: 'freiburg', englishSlug: 'freiburg', state: 'Baden-Württemberg' },
  { canonical: 'Saarbrücken', slug: 'saarbruecken', englishSlug: 'saarbruecken', state: 'Saarland' },
];

const cityEntityMap = {};
for (const e of entities) {
  cityEntityMap[e.city] = (cityEntityMap[e.city] || 0) + 1;
}

const cityNamesWithEntities = Object.keys(cityEntityMap);

const cityAudits = cityNamesWithEntities.map(name => {
  const cityMosques = entities.filter(m => m.city === name);
  const matchingConfig = publishedCities.find(c => c.canonical === name) || {
    canonical: name,
    slug: name.toLowerCase(),
    englishSlug: name.toLowerCase(),
    state: cityMosques[0]?.state || 'DE'
  };

  const dePage = pages.find(p => p.name.endsWith('/de/moscheen/' + matchingConfig.slug));
  const enPage = pages.find(p => p.name.endsWith('/en/mosques/' + matchingConfig.englishSlug));
  const arPage = pages.find(p => p.name.endsWith('/ar/mosques/' + matchingConfig.slug));

  const deImp = dePage ? dePage.impressions : 0;
  const enImp = enPage ? enPage.impressions : 0;
  const arImp = arPage ? arPage.impressions : 0;
  const deClicks = dePage ? dePage.clicks : 0;
  const enClicks = enPage ? enPage.clicks : 0;
  const arClicks = arPage ? arPage.clicks : 0;
  const totalImp = deImp + enImp + arImp;
  const totalClicks = deClicks + enClicks + arClicks;

  const phoneCount = cityMosques.filter(m => m.phone).length;
  const websiteCount = cityMosques.filter(m => m.website).length;
  const hoursCount = cityMosques.filter(m => m.openingHours && m.openingHours.length > 0).length;
  const ratingCount = cityMosques.filter(m => m.rating && m.reviewCount > 0).length;
  const districts = new Set(cityMosques.map(m => m.district).filter(Boolean)).size;

  let tier = 'Tier 3';
  if (cityMosques.length >= 30 || totalImp >= 150) {
    tier = 'Tier 1';
  } else if (cityMosques.length >= 10 || totalImp >= 20) {
    tier = 'Tier 2';
  }

  return {
    city: name,
    slug: matchingConfig.slug,
    tier,
    mosques: cityMosques.length,
    districts,
    phonePct: Math.round((phoneCount / cityMosques.length) * 100) + '%',
    hoursPct: Math.round((hoursCount / cityMosques.length) * 100) + '%',
    ratingPct: Math.round((ratingCount / cityMosques.length) * 100) + '%',
    totalImp,
    totalClicks,
    deImp,
    enImp,
    arImp,
    avgPos: dePage ? dePage.position : (enPage ? enPage.position : (arPage ? arPage.position : '-'))
  };
});

cityAudits.sort((a,b) => b.mosques - a.mosques);
console.table(cityAudits);
