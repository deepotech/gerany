import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const mosques = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/mosques.json'), 'utf8'));
const muensterMosques = mosques.filter((m: any) => m.city.toLowerCase() === 'münster');

console.log(`Auditing ${muensterMosques.length} Münster records from mosques.json...\n`);

for (const m of muensterMosques) {
  console.log(`================================================================`);
  console.log(`Mosque: ${m.canonicalName}`);
  console.log(`Place ID: ${m.placeId}`);
  console.log(`Slug: ${m.slug}`);
  console.log(`Address: ${m.address}`);
  console.log(`Coordinates: (${m.latitude}, ${m.longitude})`);
  console.log(`Phone: ${m.phone || 'null'}`);
  console.log(`Website: ${m.website || 'null'}`);

  // Check generated static HTML files
  const dePath = path.join(ROOT, `.next/server/app/de/moschee/muenster/${m.slug}.html`);
  const enPath = path.join(ROOT, `.next/server/app/en/mosque/muenster/${m.slug}.html`);
  const arPath = path.join(ROOT, `.next/server/app/ar/mosque/muenster/${m.slug}.html`);

  const deExists = fs.existsSync(dePath);
  const enExists = fs.existsSync(enPath);
  const arExists = fs.existsSync(arPath);

  console.log(`Static HTML: DE=${deExists ? 'OK' : 'MISSING'}, EN=${enExists ? 'OK' : 'MISSING'}, AR=${arExists ? 'OK' : 'MISSING'}`);

  if (deExists) {
    const html = fs.readFileSync(dePath, 'utf8');
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const canonMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
    const hreflangMatches = [...html.matchAll(/<link\s+rel="alternate"\s+hreflang="([^"]*)"\s+href="([^"]*)"/gi)];
    const hasJsonLd = html.includes('application/ld+json');

    console.log(`  DE Title: ${titleMatch ? titleMatch[1] : 'NONE'}`);
    console.log(`  DE Canonical: ${canonMatch ? canonMatch[1] : 'NONE'}`);
    console.log(`  DE Hreflangs: ${hreflangMatches.map(h => `${h[1]}: ${h[2]}`).join(' | ')}`);
    console.log(`  DE JSON-LD: ${hasJsonLd ? 'Present' : 'MISSING'}`);
  }

  if (enExists) {
    const html = fs.readFileSync(enPath, 'utf8');
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const canonMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
    console.log(`  EN Title: ${titleMatch ? titleMatch[1] : 'NONE'}`);
    console.log(`  EN Canonical: ${canonMatch ? canonMatch[1] : 'NONE'}`);
  }

  if (arExists) {
    const html = fs.readFileSync(arPath, 'utf8');
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const canonMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
    const isRtl = html.includes('dir="rtl"');
    console.log(`  AR Title: ${titleMatch ? titleMatch[1] : 'NONE'}`);
    console.log(`  AR Canonical: ${canonMatch ? canonMatch[1] : 'NONE'}`);
    console.log(`  AR RTL: ${isRtl ? 'dir="rtl" OK' : 'MISSING'}`);
  }
}
