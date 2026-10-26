import { CITY_CONFIGS, EXTENDED_CITY_CONFIGS } from '../src/pipeline/city-config';
import { getCityRegistryEntry } from '../src/pipeline/city-registry';

const cands = [
  'freiburg',
  'karlsruhe',
  'muenster',
  'mainz',
  'bielefeld',
  'augsburg',
  'regensburg',
  'kiel',
  'duisburg',
  'hannover'
];

for (const slug of cands) {
  const inCity = CITY_CONFIGS.find(c => c.slug === slug);
  const inExt = EXTENDED_CITY_CONFIGS.find(c => c.slug === slug);
  const config = inCity || inExt;
  const canonical = config?.canonical || slug;
  const reg = getCityRegistryEntry(slug);

  console.log(`${slug.toUpperCase()}:`);
  console.log(`  Canonical: "${canonical}"`);
  console.log(`  in CITY_CONFIGS: ${!!inCity}`);
  console.log(`  in EXTENDED_CITY_CONFIGS: ${!!inExt}`);
  console.log(`  Registry Status: ${reg?.status || 'NOT_FOUND'} (pubEnabled=${reg?.publicationEnabled}, seoIndexable=${reg?.seoIndexable})`);
}
