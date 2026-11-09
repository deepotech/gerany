const fs = require('fs');

const targets = [
  { name: 'Homepage (DE)', path: '.next/server/app/de.html' },
  { name: 'Berlin City Hub', path: '.next/server/app/de/moscheen/berlin.html' },
  { name: 'Hamburg City Hub', path: '.next/server/app/de/moscheen/hamburg.html' },
  { name: 'Dortmund City Hub (Tier 2)', path: '.next/server/app/de/moscheen/dortmund.html' },
  { name: 'Leipzig City Hub (Tier 3)', path: '.next/server/app/de/moscheen/leipzig.html' },
  { name: 'Şehitlik Berlin Detail', path: '.next/server/app/de/moschee/berlin/sehitlik-moschee.html' },
  { name: 'Centrum-Moschee Hamburg Detail', path: '.next/server/app/de/moschee/hamburg/centrum-moschee.html' },
  { name: 'Zumunta Köln Detail', path: '.next/server/app/de/moschee/koeln/zumunta-kulturverein.html' },
];

console.log('=== STRUCTURED DATA AUDIT ===\n');

targets.forEach(t => {
  console.log(`\n========================================`);
  console.log(`Target: ${t.name} (${t.path})`);
  console.log(`========================================`);
  if (!fs.existsSync(t.path)) {
    console.log(`FILE NOT FOUND: ${t.path}`);
    return;
  }
  const html = fs.readFileSync(t.path, 'utf8');
  const scriptRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match;
  let index = 1;
  while ((match = scriptRegex.exec(html)) !== null) {
    const rawJson = match[1];
    try {
      const parsed = JSON.parse(rawJson);
      console.log(`\n--- Schema Node #${index++} (${parsed['@type'] || 'Unknown'}) ---`);
      if (parsed['@type'] === 'CollectionPage') {
        console.log(`Type: ${parsed['@type']}, Name: ${parsed.name}, Url: ${parsed.url}`);
        if (parsed.mainEntity) {
          console.log(`MainEntity Type: ${parsed.mainEntity['@type']}, Total Items: ${parsed.mainEntity.numberOfItems}`);
          console.log(`Sample First Item:`, JSON.stringify(parsed.mainEntity.itemListElement[0], null, 2));
          const lastIdx = parsed.mainEntity.itemListElement.length - 1;
          console.log(`Sample Last Item:`, JSON.stringify(parsed.mainEntity.itemListElement[lastIdx], null, 2));
          // verify positions
          let posValid = true;
          parsed.mainEntity.itemListElement.forEach((it, idx) => {
            if (it.position !== idx + 1) posValid = false;
          });
          console.log(`Are ItemList positions contiguous 1..N: ${posValid}`);
        }
      } else if (parsed['@type'] === 'BreadcrumbList') {
        console.log(`Breadcrumb items (${parsed.itemListElement?.length || 0}):`);
        parsed.itemListElement?.forEach(item => {
          console.log(`  ${item.position}. ${item.name} -> ${item.item}`);
        });
      } else if (parsed['@type'] === 'WebSite') {
        console.log(`WebSite Schema: Name: ${parsed.name}, URL: ${parsed.url}`);
        console.log(`PotentialAction:`, JSON.stringify(parsed.potentialAction, null, 2));
      } else if (parsed['@type'] === 'Mosque') {
        console.log(`Mosque Schema: Name: ${parsed.name}, @id: ${parsed['@id']}, additionalType: ${parsed.additionalType}`);
        console.log(`Address:`, JSON.stringify(parsed.address, null, 2));
        console.log(`Geo:`, JSON.stringify(parsed.geo, null, 2));
        console.log(`Opening Hours:`, parsed.openingHoursSpecification ? `${parsed.openingHoursSpecification.length} specifications` : 'none');
      } else {
        console.log(JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      console.error(`JSON Parse Error in ${t.name}:`, e.message);
    }
  }
});
