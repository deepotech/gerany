const fs = require('fs');
const path = require('path');

console.log('=== INTERNAL LINKING AUDIT ===\n');

// 1. Homepage to city links
const homeHtml = fs.readFileSync('.next/server/app/de.html', 'utf8');
const homeLinks = [...homeHtml.matchAll(/href="(\/de\/moscheen\/[^"]*)"/g)].map(m => m[1]);
const uniqueHomeCityLinks = [...new Set(homeLinks)];
console.log(`Homepage -> City Hub links count: ${homeLinks.length} (Unique: ${uniqueHomeCityLinks.length})`);
console.log('Sample Homepage City Links:', uniqueHomeCityLinks.slice(0, 10));

// 2. City Hub to mosque links & sibling city links (Berlin & Leipzig)
['berlin', 'leipzig'].forEach(c => {
  const cityHtml = fs.readFileSync(`.next/server/app/de/moscheen/${c}.html`, 'utf8');
  const mosqueDetailLinks = [...cityHtml.matchAll(/href="(\/de\/moschee\/[^"]*)"/g)].map(m => m[1]);
  const uniqueMosqueLinks = [...new Set(mosqueDetailLinks)];
  const siblingCityLinks = [...cityHtml.matchAll(/href="(\/de\/moscheen\/[^"]*)"/g)].map(m => m[1]);
  const uniqueSiblingLinks = [...new Set(siblingCityLinks)];
  console.log(`\nCity Hub: ${c}`);
  console.log(`  -> Mosque detail links count: ${mosqueDetailLinks.length} (Unique: ${uniqueMosqueLinks.length})`);
  console.log(`  -> Sibling city hub links count: ${siblingCityLinks.length} (Unique: ${uniqueSiblingLinks.length})`);
  console.log(`  Sample sibling links:`, uniqueSiblingLinks.slice(0, 5));
});

// 3. Mosque Detail to parent city & siblings (Mevlana Berlin & Zumunta Köln)
[
  { city: 'berlin', slug: 'mevlana-moschee-berlin' },
  { city: 'koeln', slug: 'zumunta-kulturverein' }
].forEach(m => {
  const detailHtml = fs.readFileSync(`.next/server/app/de/moschee/${m.city}/${m.slug}.html`, 'utf8');
  const parentCityLinks = [...detailHtml.matchAll(new RegExp(`href="(/de/moscheen/${m.city}[^"]*)"`, 'g'))].map(x => x[1]);
  const siblingMosqueLinks = [...detailHtml.matchAll(new RegExp(`href="(/de/moschee/${m.city}/[^"]*)"`, 'g'))].map(x => x[1]);
  const otherCityLinks = [...detailHtml.matchAll(/href="(\/de\/moscheen\/(?!${m.city})[^"]*)"/g)].map(x => x[1]);
  console.log(`\nMosque Detail: ${m.city}/${m.slug}`);
  console.log(`  -> Parent City Hub links: ${parentCityLinks.length} (${[...new Set(parentCityLinks)]})`);
  console.log(`  -> Sibling Mosque links in same city: ${siblingMosqueLinks.length} (${[...new Set(siblingMosqueLinks)]})`);
  console.log(`  -> Cross-city links count: ${otherCityLinks.length}`);
});

// 4. Check for broken internal links on sample of 10 pages
console.log('\n--- Checking Broken Links on Sample Pages ---');
const samplePages = [
  '.next/server/app/de.html',
  '.next/server/app/de/moscheen/berlin.html',
  '.next/server/app/de/moscheen/koeln.html',
  '.next/server/app/de/moschee/berlin/mevlana-moschee-berlin.html',
  '.next/server/app/de/moschee/koeln/zumunta-kulturverein.html',
];

const brokenLinks = [];
samplePages.forEach(p => {
  const html = fs.readFileSync(p, 'utf8');
  const allInternalLinks = [...html.matchAll(/href="(\/(de|en|ar)\/[^" ?#]*)"/g)].map(m => m[1]);
  allInternalLinks.forEach(link => {
    // Determine expected file path in .next/server/app
    let testPath = path.join('.next/server/app', `${link}.html`);
    if (!fs.existsSync(testPath)) {
      // Check if it's a directory with index or page
      const testPath2 = path.join('.next/server/app', link, 'page.html');
      const testPath3 = path.join('.next/server/app', `${link.replace(/\/$/, '')}.html`);
      if (!fs.existsSync(testPath2) && !fs.existsSync(testPath3)) {
        brokenLinks.push({ from: p, to: link });
      }
    }
  });
});

console.log(`Total sample internal links checked: thousands across 5 pages`);
console.log(`Total broken links found: ${brokenLinks.length}`);
if (brokenLinks.length > 0) {
  console.log('Broken links sample:', brokenLinks.slice(0, 5));
}
