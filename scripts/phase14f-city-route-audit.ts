import { getMosqueRepository } from '../src/lib/db';
import { getPublishedCityConfigs, CITY_CONFIGS } from '../src/pipeline/city-config';
import { getPublishedCityRegistryEntries, isPublishedCity, getCityRegistryEntry } from '../src/pipeline/city-registry';
import fs from 'fs';
import path from 'path';

async function verifyCityRoutesAndBoundaries() {
  console.log('=== PHASE 14F: MÜNSTER CITY-ROUTE & BOUNDARY AUDIT ===\n');

  const repo = getMosqueRepository();
  const allPublished = await repo.getAllPublished();
  console.log(`Total published mosques in repo: ${allPublished.length} (Expected: 601)`);
  if (allPublished.length !== 601) throw new Error(`Expected 601 published mosques, got ${allPublished.length}`);

  const cities = await repo.getCities();
  const liveCities = cities.filter(c => c.count >= 1);
  console.log(`Live cities in database: ${liveCities.length} (Expected: 20)`);
  if (liveCities.length !== 20) throw new Error(`Expected 20 live cities, got ${liveCities.length}`);

  // Verify Münster specifically
  const muensterMosques = await repo.getByCity('Münster');
  console.log(`Münster published mosques count: ${muensterMosques.length} (Expected: 7)`);
  if (muensterMosques.length !== 7) throw new Error(`Expected 7 Münster mosques, got ${muensterMosques.length}`);

  // Expected 7 Münster slugs
  const expectedSlugs = [
    { slug: 'arrahmanmoschee', placeId: 'ChIJn6ZhH4y6uUcRRdptFyWdN-I', name: 'مسجد الرحمن / Arrahmanmoschee' },
    { slug: 'sultan-ahmet-camii-verband-islamischer-kulturzentren-vikz', placeId: 'ChIJqyE5Bte6uUcRFkRb8Ywf3NY', name: 'Sultan Ahmet Camii (VIKZ)' },
    { slug: 'munster-central-mosque', placeId: 'ChIJBc5hbdm6uUcRLyetOq73giI', name: 'Munster Central Mosque' },
    { slug: 'as-salam-moschee', placeId: 'ChIJu8AMms-luUcRVFFEtFUSrZQ', name: 'As-Salam Moschee' },
    { slug: 'ar-rahmah-moschee', placeId: 'ChIJN1qZ4Ly7uUcRx3dZUWMjP5Y', name: 'Ar-Rahmah Moschee' },
    { slug: 'bo-nja-ki-d-emat-muenster-bkz', placeId: 'ChIJYypoZAWjuUcRRokLhDbZu5U', name: 'Bošnjački Džemat Münster - BKZ' },
    { slug: 'bait-ul-momin-moschee', placeId: 'ChIJX0PIy1OkuUcR-N76U5wLMdQ', name: 'Bait ul Momin Moschee مسجد' },
  ];

  for (const exp of expectedSlugs) {
    const item = await repo.getByCityAndSlug('muenster', exp.slug);
    if (!item) throw new Error(`Failed to retrieve Münster mosque by slug: ${exp.slug}`);
    if (item.placeId !== exp.placeId) throw new Error(`PlaceId mismatch for ${exp.slug}: expected ${exp.placeId}, got ${item.placeId}`);
    console.log(`  [VERIFIED] /de/moschee/muenster/${item.slug} -> "${item.canonicalName}" (${item.placeId})`);
  }

  // Verify HOLD record cannot be retrieved and is not published
  const holdPlaceId = 'ChIJd58rTou7uUcRllSptiif6u0';
  const holdItem = await repo.getByCityAndSlug('muenster', 'palace-square-prayer-room-mosque');
  if (holdItem !== null) throw new Error('CRITICAL: Quarantined record "palace-square-prayer-room-mosque" is retrievable via repository!');
  if (allPublished.some(m => m.placeId === holdPlaceId)) {
    throw new Error('CRITICAL: Quarantined Place ID ChIJd58rTou7uUcRllSptiif6u0 is in published mosques!');
  }

  // Check all-entities.json for the HOLD record
  const allEntities = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/all-entities.json'), 'utf8'));
  const holdEntity = allEntities.find((e: any) => e.placeId === holdPlaceId);
  if (!holdEntity) throw new Error('CRITICAL: Quarantined record missing from all-entities.json!');
  if (holdEntity.dataStatus !== 'REVIEWED') throw new Error(`CRITICAL: Quarantined record status is ${holdEntity.dataStatus}, expected REVIEWED!`);
  console.log(`\nQuarantined Record Verification: "${holdEntity.canonicalName}" (${holdEntity.placeId}) is strictly REVIEWED (not published).`);

  // Verify published registry
  const publishedRegistry = getPublishedCityRegistryEntries();
  console.log(`Published registry entries count: ${publishedRegistry.length} (Expected: 20)`);
  if (publishedRegistry.length !== 20) throw new Error(`Expected 20 published registry entries, got ${publishedRegistry.length}`);

  const muensterEntry = publishedRegistry.find(c => c.slug === 'muenster');
  if (!muensterEntry || muensterEntry.status !== 'PUBLISHED' || !muensterEntry.publicationEnabled || !muensterEntry.seoIndexable) {
    throw new Error('Münster registry entry is not properly configured as PUBLISHED/indexable!');
  }
  console.log(`Münster registry status: ${muensterEntry.status}, publicationEnabled=${muensterEntry.publicationEnabled}, seoIndexable=${muensterEntry.seoIndexable} -> OK`);

  // Verify candidate cities remain UNPUBLISHED and NON-INDEXABLE
  const remainingCandidates = [
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

  // Coordinate and Germany bounding box validation
  for (const m of allPublished) {
    if (typeof m.latitude !== 'number' || typeof m.longitude !== 'number') {
      throw new Error(`Invalid coords for mosque ${m.canonicalName} (${m.placeId})`);
    }
    if (m.latitude < 47.0 || m.latitude > 55.5 || m.longitude < 5.5 || m.longitude > 15.5) {
      throw new Error(`Coordinates outside Germany bounds for ${m.canonicalName}: (${m.latitude}, ${m.longitude})`);
    }
  }
  console.log(`Verified: All 601 published mosques lie strictly within Germany geographic bounds.`);

  // Münster postal codes and coordinates check
  const muensterConfig = CITY_CONFIGS.find(c => c.slug === 'muenster')!;
  for (const m of muensterMosques) {
    const pc = parseInt(m.postalCode, 10);
    if (isNaN(pc) || pc < muensterConfig.postalMin || pc > muensterConfig.postalMax) {
      throw new Error(`Münster mosque ${m.canonicalName} has invalid postal code ${m.postalCode} (allowed: ${muensterConfig.postalMin}-${muensterConfig.postalMax})`);
    }
    if (m.latitude < 51.85 || m.latitude > 52.05 || m.longitude < 7.55 || m.longitude > 7.75) {
      throw new Error(`Münster mosque ${m.canonicalName} outside Münster bounds: (${m.latitude}, ${m.longitude})`);
    }
  }
  console.log(`Verified: All 7 Münster mosques have valid postal codes (48143–48167) and lie within municipal bounds.`);

  console.log('\n✅ Phase 14F City-Route, Boundary, and Quarantine Audit PASSED!');
}

verifyCityRoutesAndBoundaries();
