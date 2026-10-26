import sitemap from '../src/app/sitemap';
import { JsonMosqueRepository } from '../src/lib/db/json-repository';
import { getPublishedCityConfigs } from '../src/pipeline/city-config';

async function main() {
  const repo = new JsonMosqueRepository();
  const publishedMosques = await repo.getAllPublished();
  const cities = await repo.getCities();
  const liveCities = cities.filter((c) => c.count >= 1);
  const configs = getPublishedCityConfigs();

  console.log(`Published mosques count: ${publishedMosques.length}`);
  console.log(`Live cities count: ${liveCities.length}`);
  console.log(`Published configs count: ${configs.length}`);

  const entries = await sitemap();
  console.log(`Total sitemap entries: ${entries.length}`);

  const homeUrls = entries.filter((e) => ['/de', '/en', '/ar'].some((h) => e.url.endsWith(h)));
  console.log(`Home URLs: ${homeUrls.length}`);

  const hubUrls = entries.filter((e) =>
    ['/de/moscheen', '/en/mosques', '/ar/mosques'].some((h) => e.url.endsWith(h))
  );
  console.log(`Hub URLs: ${hubUrls.length}`);

  const aachenCityUrls = entries.filter((e) =>
    ['/de/moscheen/aachen', '/en/mosques/aachen', '/ar/mosques/aachen'].some((h) => e.url.endsWith(h))
  );
  console.log(`Aachen City URLs: ${aachenCityUrls.length}`);

  const aachenDetailUrls = entries.filter((e) => e.url.includes('/aachen/'));
  console.log(`Aachen Detail URLs: ${aachenDetailUrls.length}`);

  const expectedTotal = 3 + 3 + (configs.length * 3) + (publishedMosques.length * 3);
  console.log(`Expected sitemap total: ${expectedTotal}`);

  if (entries.length !== expectedTotal) {
    throw new Error(`Sitemap mismatch! Expected ${expectedTotal}, got ${entries.length}`);
  }

  // Check uniqueness
  const urls = entries.map((e) => e.url);
  const uniqueUrls = new Set(urls);
  if (urls.length !== uniqueUrls.size) {
    throw new Error(`Duplicate URLs found in sitemap! (${urls.length - uniqueUrls.size} duplicates)`);
  }
  console.log('Zero duplicate URLs in sitemap verified!');
}

main();
