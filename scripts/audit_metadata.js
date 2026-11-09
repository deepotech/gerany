const fs = require('fs');

const entities = JSON.parse(fs.readFileSync('src/data/all-entities.json', 'utf8'));
const published = entities.filter(e => e.dataStatus === 'PUBLISHED');

// Select 20 real published mosques across different cities
const sampleMosques = [];
const cities = [...new Set(published.map(e => e.city))];
cities.forEach((c, idx) => {
  const m = published.find(e => e.city === c);
  if (m && sampleMosques.length < 20) {
    const citySlug = m.city.toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/ im breisgau/g, '')
      .replace(/ü/g, 'ue');
    sampleMosques.push({ city: m.city, citySlug, slug: m.slug });
  }
});

const sampleCities = [
  'berlin', 'hamburg', 'muenchen', 'koeln', 'frankfurt',
  'stuttgart', 'duesseldorf', 'dortmund', 'essen', 'leipzig'
];

console.log('=== METADATA AUDIT: HOMEPAGES, 10 CITIES, 20 REAL MOSQUES ===\n');

const allAudited = [];

function checkFile(label, filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`[NOT FOUND] ${label}: ${filePath}`);
    return;
  }
  const html = fs.readFileSync(filePath, 'utf8');
  const titleM = html.match(/<title>(.*?)<\/title>/);
  const title = titleM ? titleM[1] : '';
  const descM = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/);
  const desc = descM ? descM[1] : '';
  const h1M = html.match(/<h1[^>]*>(.*?)<\/h1>/);
  const h1 = h1M ? h1M[1].replace(/<[^>]*>/g, '').trim() : '';
  const ogTitleM = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/);
  const ogTitle = ogTitleM ? ogTitleM[1] : '';
  const ogUrlM = html.match(/<meta[^>]*property="og:url"[^>]*content="([^"]*)"/);
  const ogUrl = ogUrlM ? ogUrlM[1] : '';

  const brandSuffixCount = (title.match(/MoscheeAtlas/g) || []).length;
  const titleLen = title.length;
  const descLen = desc.length;

  allAudited.push({
    label,
    filePath,
    title,
    titleLen,
    brandSuffixCount,
    desc,
    descLen,
    h1,
    ogTitle,
    ogUrl
  });
}

// 1. Homepages (DE, EN, AR)
checkFile('Homepage DE', '.next/server/app/de.html');
checkFile('Homepage EN', '.next/server/app/en.html');
checkFile('Homepage AR', '.next/server/app/ar.html');

// 2. 10 Cities
sampleCities.forEach(c => {
  checkFile(`City Hub: ${c}`, `.next/server/app/de/moscheen/${c}.html`);
});

// 3. 20 Mosques
sampleMosques.forEach(m => {
  checkFile(`Mosque: ${m.city} (${m.slug})`, `.next/server/app/de/moschee/${m.citySlug}/${m.slug}.html`);
});

console.log(`\nTotal verified files: ${allAudited.length}`);

allAudited.forEach((a, i) => {
  console.log(`\n[${i + 1}] ${a.label}`);
  console.log(`  Title (${a.titleLen} chars | brand count: ${a.brandSuffixCount}): "${a.title}"`);
  console.log(`  Desc (${a.descLen} chars): "${a.desc}"`);
  console.log(`  H1: "${a.h1}"`);
  console.log(`  OG Title: "${a.ogTitle}"`);
  console.log(`  OG URL: "${a.ogUrl}"`);
});

const titles = allAudited.map(a => a.title);
const uniqueTitles = new Set(titles);
console.log(`\nTotal titles audited: ${titles.length}, Unique titles: ${uniqueTitles.size}`);

const doubleBrand = allAudited.filter(a => a.brandSuffixCount > 1);
console.log(`Pages with duplicate brand suffix: ${doubleBrand.length}`);
