const fs = require('fs');

console.log('=== HREFLANG & CANONICAL AUDIT ACROSS LOCALES ===\n');

const testCases = [
  { name: 'Homepage DE', path: '.next/server/app/de.html' },
  { name: 'Homepage EN', path: '.next/server/app/en.html' },
  { name: 'Homepage AR', path: '.next/server/app/ar.html' },
  { name: 'Berlin Hub DE', path: '.next/server/app/de/moscheen/berlin.html' },
  { name: 'Berlin Hub EN', path: '.next/server/app/en/mosques/berlin.html' },
  { name: 'Berlin Hub AR', path: '.next/server/app/ar/mosques/berlin.html' },
  { name: 'Mevlana Detail DE', path: '.next/server/app/de/moschee/berlin/mevlana-moschee-berlin.html' },
  { name: 'Mevlana Detail EN', path: '.next/server/app/en/mosque/berlin/mevlana-moschee-berlin.html' },
  { name: 'Mevlana Detail AR', path: '.next/server/app/ar/mosque/berlin/mevlana-moschee-berlin.html' },
];

testCases.forEach(tc => {
  console.log(`\n--------------------------------------------------`);
  console.log(`Case: ${tc.name} (${tc.path})`);
  console.log(`--------------------------------------------------`);
  if (!fs.existsSync(tc.path)) {
    console.log(`File not found: ${tc.path}`);
    return;
  }
  const html = fs.readFileSync(tc.path, 'utf8');
  
  // Canonical
  const canonMatch = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i);
  console.log('Canonical:', canonMatch ? canonMatch[1] : 'NONE');

  // Alternates
  const altRegex = /<link[^>]*rel="alternate"[^>]*hrefLang="([^"]*)"[^>]*href="([^"]*)"/gi;
  let m;
  const alternates = [];
  while ((m = altRegex.exec(html)) !== null) {
    alternates.push({ lang: m[1], href: m[2] });
  }
  console.log('Alternates count:', alternates.length);
  alternates.forEach(a => console.log(`  hreflang="${a.lang}" -> ${a.href}`));

  // Check self-referencing canonical
  // The canonical should match the page's own URL
  // Check reciprocal hreflangs
});
