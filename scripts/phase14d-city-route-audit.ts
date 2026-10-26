import { getMosqueRepository } from '../src/lib/db';
import { getPublishedCityConfigs, CITY_CONFIGS } from '../src/pipeline/city-config';
import { getPublishedCityRegistryEntries, isPublishedCity, getCityRegistryEntry } from '../src/pipeline/city-registry';

async function verifyCityRoutes() {
  console.log('=== PHASE 14D: CITY-ROUTE & INDEXABILITY AUDIT ===\n');

  const repo = getMosqueRepository();
  const allPublished = await repo.getAllPublished();
  console.log(`Total published mosques in repo: ${allPublished.length} (Expected: 594)`);
  if (allPublished.length !== 594) throw new Error(`Expected 594 published mosques, got ${allPublished.length}`);

  const cities = await repo.getCities();
  const liveCities = cities.filter(c => c.count >= 1);
  console.log(`Live cities in database: ${liveCities.length} (Expected: 19)`);
  if (liveCities.length !== 19) throw new Error(`Expected 19 live cities, got ${liveCities.length}`);

  // Verify Freiburg specifically
  const freiburgMosques = await repo.getByCity('Freiburg im Breisgau');
  console.log(`Freiburg published mosques count: ${freiburgMosques.length} (Expected: 8)`);
  if (freiburgMosques.length !== 8) throw new Error(`Expected 8 Freiburg mosques, got ${freiburgMosques.length}`);

  // Verify sample Freiburg mosque
  const sample = await repo.getByCityAndSlug('freiburg', 'freiburg-islamic-centre');
  if (!sample) throw new Error('Failed to retrieve sample Freiburg mosque');
  console.log(`Sample Freiburg retrieval: "${sample.canonicalName}" (${sample.placeId}) -> OK`);

  // Verify HOLD records cannot be retrieved
  const hold1 = await repo.getByCityAndSlug('freiburg', 'villingen');
  if (hold1 !== null) throw new Error('CRITICAL: Quarantined record "villingen" is retrievable!');
  const hold2 = await repo.getByCityAndSlug('freiburg', 'freiburg-herdern-mosque');
  if (hold2 !== null) throw new Error('CRITICAL: Quarantined record "freiburg-herdern-mosque" is retrievable!');
  console.log('Quarantined records check: both return null -> OK');

  // Verify published registry
  const publishedRegistry = getPublishedCityRegistryEntries();
  console.log(`Published registry entries count: ${publishedRegistry.length} (Expected: 19)`);
  if (publishedRegistry.length !== 19) throw new Error(`Expected 19 published registry entries, got ${publishedRegistry.length}`);

  const freiburgEntry = publishedRegistry.find(c => c.slug === 'freiburg');
  if (!freiburgEntry || freiburgEntry.status !== 'PUBLISHED' || !freiburgEntry.publicationEnabled || !freiburgEntry.seoIndexable) {
    throw new Error('Freiburg registry entry is not properly configured as PUBLISHED/indexable!');
  }
  console.log(`Freiburg registry status: ${freiburgEntry.status}, publicationEnabled=${freiburgEntry.publicationEnabled}, seoIndexable=${freiburgEntry.seoIndexable} -> OK`);

  // Verify all 9 remaining candidate cities remain UNPUBLISHED and NON-INDEXABLE
  const remainingCandidates = [
    'muenster',
    'kiel',
    'regensburg',
    'karlsruhe',
    'augsburg',
    'bielefeld',
    'mainz',
    'hannover',
    'duisburg'
  ];

  for (const slug of remainingCandidates) {
    if (isPublishedCity(slug)) {
      throw new Error(`CRITICAL: Candidate city "${slug}" leaked into published cities!`);
    }
    const entry = getCityRegistryEntry(slug);
    if (entry && (entry.publicationEnabled || entry.seoIndexable)) {
      throw new Error(`CRITICAL: Candidate city "${slug}" has publicationEnabled or seoIndexable = true!`);
    }
    const countInRepo = (await repo.getByCity(entry?.canonical || slug)).length;
    if (countInRepo > 0) {
      throw new Error(`CRITICAL: Candidate city "${slug}" has ${countInRepo} published records in database!`);
    }
  }
  console.log(`Verified: All ${remainingCandidates.length} remaining candidate cities remain strictly UNPUBLISHED and NON-INDEXABLE.`);

  console.log('\n✅ City-route and Indexability Audit PASSED!');
}

verifyCityRoutes();
