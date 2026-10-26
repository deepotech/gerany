import fs from 'fs';

const mosques = JSON.parse(fs.readFileSync('src/data/mosques.json', 'utf8'));

// Slugs ending in bare digit (no hyphen before digit) — i.e. slug like "foo3" or "foo4"
const bareDigitSlugs = mosques.filter((m: any) => /[0-9]$/.test(m.slug) && !/-[0-9]+$/.test(m.slug));
console.log('Mosques with bare trailing digit slugs (no hyphen):', bareDigitSlugs.length);
bareDigitSlugs.slice(0, 5).forEach((m: any) => console.log(' ', m.slug, '|', m.id));

// Slugs ending in hyphen+digit (legitimate collision suffix from ensureUniqueSlugs)
const hyphenDigitSlugs = mosques.filter((m: any) => /-[0-9]+$/.test(m.slug));
console.log('\nMosques with hyphen-separated collision suffix slugs:', hyphenDigitSlugs.length);
hyphenDigitSlugs.forEach((m: any) => console.log(' ', m.slug, '|', m.id));

// Now check: do any of the 74 SOURCE urls (with bare trailing digit) actually correspond
// to any published slug (meaning the digit IS part of the slug)?
const redirects = JSON.parse(fs.readFileSync('src/data/redirects.json', 'utf8'));
const sourceSlugSet = new Set(
  redirects
    .filter((r: any) => r.source !== '/de1')
    .map((r: any) => r.source.split('/').pop()) // slug with digit appended
);

const publishedSlugSet = new Set(mosques.map((m: any) => m.slug));

// Any source slug (with trailing digit) matches a published canonical slug?
const falseMappings: string[] = [];
for (const s of sourceSlugSet) {
  if (publishedSlugSet.has(s)) {
    falseMappings.push(s as string);
  }
}
console.log('\nSource slugs (with digit) that also exist as canonical published slugs:', falseMappings.length);
falseMappings.forEach(s => console.log(' ', s));

// Conversely: do any destinations NOT exist in published slugs?
const missingDests: string[] = [];
for (const r of redirects) {
  if (r.source === '/de1') continue;
  const destSlug = r.destination.split('/').pop();
  if (!publishedSlugSet.has(destSlug)) {
    missingDests.push(r.destination);
  }
}
console.log('\nDestinations whose slug is NOT found in mosques.json:', missingDests.length);
missingDests.forEach(d => console.log(' ', d));

console.log('\nDone.');
