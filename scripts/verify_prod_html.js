const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function checkFile(relPath) {
  const fullPath = path.join(ROOT, '.next', 'server', 'app', relPath);
  if (!fs.existsSync(fullPath)) {
    console.error(`File NOT found: ${relPath}`);
    return null;
  }
  return fs.readFileSync(fullPath, 'utf8');
}

console.log('=== VERIFYING GENERATED PRODUCTION HTML ===\n');

// 1. German City Page: Berlin
const berlinHtml = checkFile('de/moscheen/berlin.html');
if (berlinHtml) {
  console.log('--- /de/moscheen/berlin.html ---');
  // Title
  const titleMatch = berlinHtml.match(/<title>([^<]+)<\/title>/);
  console.log('Title:', titleMatch ? titleMatch[1] : 'NOT FOUND');
  // Description
  const descMatch = berlinHtml.match(/<meta\s+name="description"\s+content="([^"]+)"/);
  console.log('Description:', descMatch ? descMatch[1] : 'NOT FOUND');
  // Canonical
  const canMatch = berlinHtml.match(/<link\s+rel="canonical"\s+href="([^"]+)"/);
  console.log('Canonical:', canMatch ? canMatch[1] : 'NOT FOUND');
  // Hreflang
  const hreflangMatches = [...berlinHtml.matchAll(/<link[^>]+rel="alternate"[^>]*>/gi)];
  console.log('Hreflangs:', hreflangMatches.map(m => m[0]));
  // Robots
  const robotsMatch = berlinHtml.match(/<meta\s+name="robots"\s+content="([^"]+)"/);
  console.log('Robots:', robotsMatch ? robotsMatch[1] : 'NOT FOUND');
  // JSON-LD
  const jsonLdMatches = [...berlinHtml.matchAll(/<script\s+type="application\/ld\+json">([^<]+)<\/script>/g)];
  console.log(`JSON-LD scripts found: ${jsonLdMatches.length}`);
  jsonLdMatches.forEach((m, idx) => {
    try {
      const parsed = JSON.parse(m[1]);
      console.log(`  JSON-LD #${idx + 1}: @type = ${parsed['@type']}, name = ${parsed.name || parsed['@id']}`);
      if (parsed['@type'] === 'CollectionPage') {
        console.log(`    mainEntity: @type = ${parsed.mainEntity?.['@type']}, items = ${parsed.mainEntity?.numberOfItems}`);
      }
    } catch (e) {
      console.log(`  JSON-LD #${idx + 1}: PARSE ERROR`);
    }
  });
  // Check visible breadcrumb
  const hasBreadcrumbNav = berlinHtml.includes('aria-label="Brotkrümelnavigation"');
  console.log('Has visible breadcrumb nav:', hasBreadcrumbNav);
  // Check sibling discovery section
  const hasSiblingDiscovery = berlinHtml.includes('Weitere Städte in Deutschland entdecken');
  console.log('Has sibling city discovery section:', hasSiblingDiscovery);
}

// 2. German Mosque Detail Page: Lubars Mosque
const detailHtml = checkFile('de/moschee/berlin/lubars-mosque.html');
if (detailHtml) {
  console.log('\n--- /de/moschee/berlin/lubars-mosque.html ---');
  const titleMatch = detailHtml.match(/<title>([^<]+)<\/title>/);
  console.log('Title:', titleMatch ? titleMatch[1] : 'NOT FOUND');
  const canMatch = detailHtml.match(/<link\s+rel="canonical"\s+href="([^"]+)"/);
  console.log('Canonical:', canMatch ? canMatch[1] : 'NOT FOUND');
  const robotsMatch = detailHtml.match(/<meta\s+name="robots"\s+content="([^"]+)"/);
  console.log('Robots:', robotsMatch ? robotsMatch[1] : 'NOT FOUND');
  const jsonLdMatches = [...detailHtml.matchAll(/<script\s+type="application\/ld\+json">([^<]+)<\/script>/g)];
  console.log(`JSON-LD scripts found: ${jsonLdMatches.length}`);
  jsonLdMatches.forEach((m, idx) => {
    try {
      const parsed = JSON.parse(m[1]);
      console.log(`  JSON-LD #${idx + 1}: @type = ${parsed['@type']}, additionalType = ${parsed.additionalType || 'none'}`);
      if (parsed.openingHoursSpecification) {
        console.log(`    OpeningHoursSpecification count: ${parsed.openingHoursSpecification.length}`);
      }
    } catch (e) {
      console.log(`  JSON-LD #${idx + 1}: PARSE ERROR`);
    }
  });
  // Check parent city hub discovery card
  const hasParentCityCard = detailHtml.includes('Alle Moscheen in Berlin');
  console.log('Has parent city hub discovery card:', hasParentCityCard);
}

// 3. Homepage: /de
const homeHtml = checkFile('de.html');
if (homeHtml) {
  console.log('\n--- /de.html ---');
  const titleMatch = homeHtml.match(/<title>([^<]+)<\/title>/);
  console.log('Title:', titleMatch ? titleMatch[1] : 'NOT FOUND');
  const jsonLdMatches = [...homeHtml.matchAll(/<script\s+type="application\/ld\+json">([^<]+)<\/script>/g)];
  console.log(`JSON-LD scripts found: ${jsonLdMatches.length}`);
  jsonLdMatches.forEach((m, idx) => {
    try {
      const parsed = JSON.parse(m[1]);
      console.log(`  JSON-LD #${idx + 1}: @type = ${parsed['@type']}, name = ${parsed.name}`);
    } catch (e) {
      console.log(`  JSON-LD #${idx + 1}: PARSE ERROR`);
    }
  });
}
