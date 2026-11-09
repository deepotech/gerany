const fs = require('fs');

const files = [
  '.next/server/app/de/moschee/berlin/mevlana-moschee-berlin.html',
  '.next/server/app/de/moschee/hamburg/hamburg-central-mosque.html',
  '.next/server/app/de/moschee/koeln/zumunta-kulturverein.html',
];

console.log('=== INSPECTION OF 3 MOSQUE DETAIL PAGES ===\n');

files.forEach((f) => {
  console.log(`\n========================================`);
  console.log(`File: ${f}`);
  console.log(`========================================`);
  if (!fs.existsSync(f)) {
    console.log(`File not found: ${f}`);
    return;
  }
  const html = fs.readFileSync(f, 'utf8');

  // Title
  const titleM = html.match(/<title>(.*?)<\/title>/);
  console.log('Title:', titleM ? titleM[1] : 'NONE');

  // Meta description
  const descM = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/);
  console.log('Description:', descM ? descM[1] : 'NONE');

  // H1
  const h1M = html.match(/<h1[^>]*>(.*?)<\/h1>/);
  console.log('H1:', h1M ? h1M[1].replace(/<[^>]*>/g, '').trim() : 'NONE');

  // Canonical
  const canonM = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/);
  console.log('Canonical:', canonM ? canonM[1] : 'NONE');

  // Hreflang alternates
  const hreflangRegex = /<link[^>]*rel="alternate"[^>]*hreflang="([^"]*)"[^>]*href="([^"]*)"/g;
  let hlMatch;
  const hls = [];
  while ((hlMatch = hreflangRegex.exec(html)) !== null) {
    hls.push({ lang: hlMatch[1], href: hlMatch[2] });
  }
  console.log('Hreflangs count:', hls.length);
  hls.forEach((h) => console.log(`   ${h.lang} -> ${h.href}`));

  // OpenGraph URL and Title
  const ogTitleM = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"/);
  const ogUrlM = html.match(/<meta[^>]*property="og:url"[^>]*content="([^"]*)"/);
  console.log('OG Title:', ogTitleM ? ogTitleM[1] : 'NONE');
  console.log('OG URL:', ogUrlM ? ogUrlM[1] : 'NONE');

  // Twitter Card
  const twCardM = html.match(/<meta[^>]*name="twitter:card"[^>]*content="([^"]*)"/);
  console.log('Twitter Card:', twCardM ? twCardM[1] : 'NONE');

  // Schemas
  const scriptRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let sm;
  let scIdx = 1;
  while ((sm = scriptRegex.exec(html)) !== null) {
    const raw = sm[1];
    try {
      const parsed = JSON.parse(raw);
      console.log(`\n  --- Schema #${scIdx++}: ${parsed['@type']} ---`);
      if (parsed['@type'] === 'Mosque') {
        console.log(`  Name: ${parsed.name}`);
        console.log(`  @id: ${parsed['@id']}`);
        console.log(`  additionalType: ${parsed.additionalType}`);
        console.log(`  Address: ${parsed.address?.streetAddress}, ${parsed.address?.postalCode} ${parsed.address?.addressLocality}`);
        console.log(`  Geo: lat=${parsed.geo?.latitude}, lon=${parsed.geo?.longitude}`);
        console.log(`  OpeningHoursSpecification count: ${parsed.openingHoursSpecification ? parsed.openingHoursSpecification.length : 0}`);
        console.log(`  Visible address matches schema: ${html.includes(parsed.address?.streetAddress)}`);
      } else if (parsed['@type'] === 'BreadcrumbList') {
        console.log(`  Breadcrumb items count: ${parsed.itemListElement?.length}`);
        parsed.itemListElement?.forEach((item) => {
          console.log(`    ${item.position}. ${item.name} (${item.item})`);
        });
      }
    } catch (e) {
      console.log(`  JSON Error: ${e.message}`);
    }
  }

  // Check parent city hub link in HTML
  const parentCityLinkRegex = /href="\/de\/moscheen\/([^"]*)"/g;
  let pclMatch;
  const parentLinks = [];
  while ((pclMatch = parentCityLinkRegex.exec(html)) !== null) {
    parentLinks.push(pclMatch[0]);
  }
  console.log('\nParent City Hub links in page:', parentLinks.length, parentLinks.slice(0, 3));

  // Check nearby sibling links in HTML
  const siblingLinkRegex = /href="\/de\/moschee\/([^"]*)"/g;
  let sibMatch;
  const siblingLinks = [];
  while ((sibMatch = siblingLinkRegex.exec(html)) !== null) {
    siblingLinks.push(sibMatch[0]);
  }
  console.log('Mosque detail links on page (self + siblings):', siblingLinks.length);
});
