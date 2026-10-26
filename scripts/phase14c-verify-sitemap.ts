import sitemap from '../src/app/sitemap';
import { JsonMosqueRepository } from '../src/lib/db/json-repository';
import { getPublishedCityConfigs } from '../src/pipeline/city-config';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('=== PHASE 14C SITEMAP & INTEGRITY VERIFICATION ===\n');

  const repo = new JsonMosqueRepository();
  const publishedMosques = await repo.getAllPublished();
  const cities = await repo.getCities();
  const liveCities = cities.filter((c) => c.count >= 1);
  const publishedConfigs = getPublishedCityConfigs();

  console.log(`Published mosques count: ${publishedMosques.length} (Expected: 594)`);
  console.log(`Live cities count: ${liveCities.length} (Expected: 19)`);
  console.log(`Published configs count: ${publishedConfigs.length} (Expected: 19)`);

  if (publishedMosques.length !== 594) {
    throw new Error(`FAIL: published mosques count is ${publishedMosques.length}, expected 594`);
  }
  if (liveCities.length !== 19 || publishedConfigs.length !== 19) {
    throw new Error(`FAIL: live cities count is ${liveCities.length}, expected 19`);
  }

  const sitemapEntries = await sitemap();
  console.log(`Total sitemap entries: ${sitemapEntries.length} (Expected: 1845)`);

  if (sitemapEntries.length !== 1845) {
    throw new Error(`FAIL: sitemap total is ${sitemapEntries.length}, expected 1845`);
  }

  const urls = sitemapEntries.map((e) => e.url);
  const uniqueUrls = new Set(urls);
  if (urls.length !== uniqueUrls.size) {
    throw new Error(`FAIL: duplicate URLs found in sitemap!`);
  }
  console.log('Zero duplicate URLs in sitemap verified!');

  // Check home and hub
  const homeUrls = urls.filter((u) => ['/de', '/en', '/ar'].some((h) => u.endsWith(h)));
  const hubUrls = urls.filter((u) => ['/de/moscheen', '/en/mosques', '/ar/mosques'].some((h) => u.endsWith(h)));
  console.log(`Home URLs: ${homeUrls.length} (Expected: 3)`);
  console.log(`Hub URLs: ${hubUrls.length} (Expected: 3)`);

  // Check Freiburg city URLs
  const freiburgCityUrls = urls.filter((u) =>
    ['/de/moscheen/freiburg', '/en/mosques/freiburg', '/ar/mosques/freiburg'].some((frag) => u.endsWith(frag))
  );
  console.log(`Freiburg City URLs: ${freiburgCityUrls.length} (Expected: 3)`);
  freiburgCityUrls.forEach((u) => console.log('  -', u));

  if (freiburgCityUrls.length !== 3) {
    throw new Error(`FAIL: Expected 3 Freiburg city URLs, found ${freiburgCityUrls.length}`);
  }

  // Check Freiburg detail URLs
  const freiburgDetailUrls = urls.filter((u) =>
    u.includes('/moschee/freiburg/') || u.includes('/mosque/freiburg/')
  );
  console.log(`Freiburg Detail URLs: ${freiburgDetailUrls.length} (Expected: 24)`);

  if (freiburgDetailUrls.length !== 24) {
    throw new Error(`FAIL: Expected 24 Freiburg detail URLs (8 mosques * 3 locales), found ${freiburgDetailUrls.length}`);
  }

  // Check HOLD records absence
  const holdSlugs = ['villingen', 'freiburg-herdern-mosque'];
  for (const s of holdSlugs) {
    const leak = urls.filter((u) => u.includes(s));
    console.log(`HOLD record "${s}" in sitemap: ${leak.length} (Expected: 0)`);
    if (leak.length > 0) {
      throw new Error(`FAIL: Leakage detected for HOLD record "${s}"!`);
    }
  }

  console.log('\n✅ All Phase 14C Sitemap and Count Verifications PASSED!');
}

main();
