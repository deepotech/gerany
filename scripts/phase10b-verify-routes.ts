import { getMosqueRepository } from '../src/lib/db';
import { CITY_CONFIGS } from '../src/pipeline/city-config';
import { getPublishedCityRegistryEntries } from '../src/pipeline/city-registry';

async function verify() {
  console.log('=== VERIFYING REPOSITORY AND ROUTES FOR WIESBADEN ===\n');

  const repo = getMosqueRepository();
  const allPublished = await repo.getAllPublished();
  console.log(`Total published mosques in repo: ${allPublished.length}`);
  if (allPublished.length !== 559) throw new Error(`Expected 559, got ${allPublished.length}`);

  const cities = await repo.getCities();
  console.log(`Total cities with published counts: ${cities.length}`);
  const wiesbadenCity = cities.find(c => c.name === 'Wiesbaden');
  console.log(`Wiesbaden city count in repo: ${wiesbadenCity?.count}`);
  if (wiesbadenCity?.count !== 17) throw new Error(`Expected 17 Wiesbaden mosques, got ${wiesbadenCity?.count}`);

  const wiesbadenMosques = await repo.getByCity('Wiesbaden');
  console.log(`repo.getByCity('Wiesbaden') count: ${wiesbadenMosques.length}`);
  if (wiesbadenMosques.length !== 17) throw new Error(`Expected 17, got ${wiesbadenMosques.length}`);

  // Test retrieval by slug
  const sample = await repo.getByCityAndSlug('wiesbaden', 'marokkanischer-kulturverein-badr-moschee');
  console.log(`Retrieved sample mosque: ${sample?.canonicalName} (${sample?.address})`);
  if (!sample) throw new Error('Failed to retrieve sample mosque by city and slug');

  // Verify excluded record is not retrievable
  const excluded = await repo.getByCityAndSlug('wiesbaden', 'moschee-schierstein');
  console.log(`Retrieved excluded record (should be null): ${excluded}`);
  if (excluded !== null) throw new Error('CRITICAL: Excluded record returned by repository!');

  // Verify registry entries
  const publishedRegistry = getPublishedCityRegistryEntries();
  const wiesbadenRegistry = publishedRegistry.find(c => c.slug === 'wiesbaden');
  console.log(`Wiesbaden in published registry: status=${wiesbadenRegistry?.status}, publicationEnabled=${wiesbadenRegistry?.publicationEnabled}`);
  if (!wiesbadenRegistry || wiesbadenRegistry.status !== 'PUBLISHED') {
    throw new Error('Wiesbaden not found as PUBLISHED in city registry!');
  }

  // Verify other candidates remain unpromoted
  const candidates = ['mainz', 'aachen', 'bielefeld', 'kiel', 'luebeck', 'freiburg', 'regensburg', 'saarbruecken', 'augsburg', 'karlsruhe', 'muenster'];
  for (const cand of candidates) {
    const entry = publishedRegistry.find(c => c.slug === cand);
    if (entry) {
      throw new Error(`CRITICAL: Candidate city "${cand}" leaked into published registry!`);
    }
  }
  console.log(`Verified: All ${candidates.length} other candidate cities remain UNPUBLISHED.`);

  console.log('\nAll repository and route verification checks PASSED!');
}

verify().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
