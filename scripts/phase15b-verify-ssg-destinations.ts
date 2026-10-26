import fs from 'fs';
import path from 'path';

interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
  crawlDate: string;
  placeId?: string | null;
  canonicalName: string;
  reason: string;
}

const redirects: RedirectRule[] = JSON.parse(fs.readFileSync('src/data/redirects.json', 'utf8'));

console.log(`Checking ${redirects.length} destinations in prerendered SSG output...`);

let missingPages = 0;
let validPages = 0;

for (const r of redirects) {
  // Destination e.g. /de, /en/mosque/bremen/bilal-habashi-moschee
  let relativeHtmlPath = '';
  if (r.destination === '/de') {
    relativeHtmlPath = path.join('.next', 'server', 'app', 'de.html');
  } else {
    // /locale/type/city/slug -> .next/server/app/locale/type/city/slug.html
    const cleanPath = r.destination.replace(/^\//, '');
    relativeHtmlPath = path.join('.next', 'server', 'app', cleanPath + '.html');
  }

  if (fs.existsSync(relativeHtmlPath)) {
    validPages++;
    const html = fs.readFileSync(relativeHtmlPath, 'utf8');

    // Check canonical link tag: <link rel="canonical" href="..."
    const canonicalMatch = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i) ||
                           html.match(/<link[^>]+href="([^"]+)"[^>]+rel="canonical"/i);
    
    // Check hreflang tags: <link rel="alternate" hreflang="de" href="..."
    const hreflangDe = html.match(/hreflang="de"/i);
    const hreflangEn = html.match(/hreflang="en"/i);
    const hreflangAr = html.match(/hreflang="ar"/i);

    if (!canonicalMatch) {
      console.warn(`Missing canonical tag in ${r.destination} (${relativeHtmlPath})`);
    } else {
      const canonicalHref = canonicalMatch[1];
      const expectedCanonical = `https://moscheeindernaehe.de${r.destination}`;
      if (canonicalHref !== expectedCanonical) {
        console.warn(`Canonical mismatch for ${r.destination}: expected ${expectedCanonical}, got ${canonicalHref}`);
      }
    }

    if (!hreflangDe || !hreflangEn || !hreflangAr) {
      console.warn(`Missing hreflang alternates in ${r.destination}: de=${!!hreflangDe}, en=${!!hreflangEn}, ar=${!!hreflangAr}`);
    }
  } else {
    missingPages++;
    console.error(`MISSING HTML file for destination ${r.destination}: ${relativeHtmlPath}`);
  }
}

console.log(`Summary: Valid destination HTML files: ${validPages}, Missing: ${missingPages}`);
