import sitemap from '../src/app/sitemap';
import { getPublishedCityConfigs } from '../src/pipeline/city-config';
import { getMosqueRepository } from '../src/lib/db';

async function verify() {
  const repo = getMosqueRepository();
  const published = await repo.getAllPublished();
  const cities = await repo.getCities();
  const liveCities = cities.filter(c => c.count >= 1);
  const configs = getPublishedCityConfigs();

  console.log(`Published mosques count: ${published.length}`);
  console.log(`Live cities count: ${liveCities.length}`);
  console.log(`Published configs count: ${configs.length}`);

  const entries = await sitemap();
  console.log(`Total sitemap entries: ${entries.length}`);

  const homeUrls = entries.filter(e => ['/de', '/en', '/ar'].some(h => e.url.endsWith(h)));
  const hubUrls = entries.filter(e => ['/de/moscheen', '/en/mosques', '/ar/mosques'].some(h => e.url.endsWith(h)));
  const luebeckCityUrls = entries.filter(e => e.url.includes('/luebeck') && (e.url.includes('/moscheen/') || e.url.includes('/mosques/')));
  const luebeckDetailUrls = entries.filter(e => e.url.includes('/luebeck/') && (e.url.includes('/moschee/') || e.url.includes('/mosque/')));

  console.log(`Home URLs: ${homeUrls.length}`);
  console.log(`Hub URLs: ${hubUrls.length}`);
  console.log(`Lübeck City URLs: ${luebeckCityUrls.length}`);
  console.log(`Lübeck Detail URLs: ${luebeckDetailUrls.length}`);

  // Expected:
  // 3 home + 3 hub + (16 cities * 3) + (566 mosques * 3)
  // 3 + 3 + 48 + 1698 = 1752
  const expected = 3 + 3 + (configs.length * 3) + (published.length * 3);
  console.log(`Expected sitemap total: ${expected}`);

  if (entries.length !== expected) {
    throw new Error(`Sitemap mismatch! Expected ${expected}, got ${entries.length}`);
  }

  // Check duplicate URLs
  const set = new Set<string>();
  for (const e of entries) {
    if (set.has(e.url)) {
      throw new Error(`Duplicate URL in sitemap: ${e.url}`);
    }
    set.add(e.url);
  }
  console.log('Zero duplicate URLs in sitemap verified!');
}

verify().catch(e => {
  console.error(e);
  process.exit(1);
});
