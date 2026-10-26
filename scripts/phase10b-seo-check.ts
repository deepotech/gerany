import { getMosqueRepository } from '../src/lib/db';
import { generateMosqueJsonLd, generateBreadcrumbJsonLd } from '../src/lib/seo/schema';
import { CITY_CONFIGS } from '../src/pipeline/city-config';
import sitemap from '../src/app/sitemap';

async function testSeo() {
  console.log('=== PHASE 10B: DETAILED SEO & METADATA VERIFICATION ===\n');

  const repo = getMosqueRepository();
  const wiesbadenMosques = await repo.getByCity('Wiesbaden');
  const wiesbadenConfig = CITY_CONFIGS.find(c => c.canonical === 'Wiesbaden');

  if (!wiesbadenConfig) throw new Error('Wiesbaden not found in CITY_CONFIGS');

  // 1. City collection routes
  console.log('1. City Collection Routes & Alternates:');
  const cityRoutes = {
    de: `/de/moscheen/${wiesbadenConfig.slug}`,
    en: `/en/mosques/${wiesbadenConfig.englishSlug}`,
    ar: `/ar/mosques/${wiesbadenConfig.slug}`,
  };
  console.log('  German City Route: ', cityRoutes.de);
  console.log('  English City Route:', cityRoutes.en);
  console.log('  Arabic City Route: ', cityRoutes.ar);

  // 2. Sample Mosque JSON-LD Verification
  console.log('\n2. Mosque Detail JSON-LD Schema:');
  const sample = wiesbadenMosques[0];
  const jsonLdDe = generateMosqueJsonLd(sample, 'de');
  const jsonLdEn = generateMosqueJsonLd(sample, 'en');
  const jsonLdAr = generateMosqueJsonLd(sample, 'ar');

  console.log('  JSON-LD @id (de):', jsonLdDe['@id']);
  console.log('  JSON-LD url (de):', jsonLdDe.url);
  console.log('  JSON-LD name (de):', jsonLdDe.name);
  console.log('  JSON-LD address (de):', jsonLdDe.address.addressLocality, jsonLdDe.address.postalCode);
  console.log('  JSON-LD name (ar):', jsonLdAr.name);

  if (!jsonLdDe['@id'].includes('/de/moschee/wiesbaden/')) {
    throw new Error('Invalid German JSON-LD @id');
  }
  if (!jsonLdEn['@id'].includes('/en/mosque/wiesbaden/')) {
    throw new Error('Invalid English JSON-LD @id');
  }
  if (!jsonLdAr['@id'].includes('/ar/mosque/wiesbaden/')) {
    throw new Error('Invalid Arabic JSON-LD @id');
  }

  // 3. Sitemap coverage of Wiesbaden
  console.log('\n3. Sitemap Verification for Wiesbaden:');
  const entries = await sitemap();
  const wiesbadenEntries = entries.filter(e => e.url.includes('wiesbaden'));
  console.log(`  Total sitemap URLs for Wiesbaden: ${wiesbadenEntries.length}`);

  // Expected: 3 city collection URLs + (17 mosques * 3 locales) = 54 URLs
  if (wiesbadenEntries.length !== 54) {
    throw new Error(`Expected exactly 54 Wiesbaden URLs in sitemap, got ${wiesbadenEntries.length}`);
  }

  // Check city pages exist
  const hasDeCity = entries.some(e => e.url === 'https://moscheeindernaehe.de/de/moscheen/wiesbaden');
  const hasEnCity = entries.some(e => e.url === 'https://moscheeindernaehe.de/en/mosques/wiesbaden');
  const hasArCity = entries.some(e => e.url === 'https://moscheeindernaehe.de/ar/mosques/wiesbaden');

  console.log('  Has /de/moscheen/wiesbaden:', hasDeCity);
  console.log('  Has /en/mosques/wiesbaden: ', hasEnCity);
  console.log('  Has /ar/mosques/wiesbaden: ', hasArCity);

  if (!hasDeCity || !hasEnCity || !hasArCity) {
    throw new Error('Missing city collection page in sitemap');
  }

  // Verify excluded record is absent
  const hasExcluded = entries.some(e => e.url.includes('schierstein') || e.url.includes('ChIJOYKxBgCVvUcR0ZVvoTpmab0'));
  console.log('  Has excluded Moschee Schierstein in sitemap:', hasExcluded);
  if (hasExcluded) throw new Error('CRITICAL: Excluded record found in sitemap!');

  console.log('\nAll SEO and structured data verification checks PASSED!');
}

testSeo().catch(e => {
  console.error('SEO Check failed:', e);
  process.exit(1);
});
