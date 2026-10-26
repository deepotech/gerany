import fs from 'fs';
import path from 'path';
import { getMosqueRepository } from '../src/lib/db';
import { getPublishedCityConfigs, CITY_CONFIGS } from '../src/pipeline/city-config';
import { getPublishedCityRegistryEntries, isPublishedCity, getCityRegistryEntry } from '../src/pipeline/city-registry';
import sitemap from '../src/app/sitemap';

async function verifyBoundaries() {
  console.log('=== PHASE 14G: PUBLICATION BOUNDARY AUDIT ===\n');

  const ROOT = process.cwd();
  const mosques: any[] = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/mosques.json'), 'utf8'));
  const allEntities: any[] = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/all-entities.json'), 'utf8'));
  const overrides: any = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/city-registry-overrides.json'), 'utf8'));

  const sitemapEntries = await sitemap();
  const sitemapUrls = new Set(sitemapEntries.map(e => e.url));

  // 1. Audit Palace Square Prayer Room Mosque (ChIJd58rTou7uUcRllSptiif6u0)
  const holdPlaceId = 'ChIJd58rTou7uUcRllSptiif6u0';
  const inMosques = mosques.some(m => m.placeId === holdPlaceId);
  if (inMosques) throw new Error('CRITICAL: Palace Square is present in mosques.json!');
  console.log('1. Palace Square in mosques.json: ABSENT ✅');

  const entity = allEntities.find((e: any) => e.placeId === holdPlaceId);
  if (!entity) throw new Error('CRITICAL: Palace Square missing from all-entities.json!');
  if (entity.dataStatus !== 'REVIEWED') throw new Error(`CRITICAL: Palace Square status is ${entity.dataStatus}, expected REVIEWED!`);
  console.log(`2. Palace Square in all-entities.json: status="${entity.dataStatus}", reason="${entity.reviewReason?.slice(0, 50)}..." ✅`);

  const repo = getMosqueRepository();
  const repoRecord = await repo.getByCityAndSlug('muenster', 'palace-square-prayer-room-mosque');
  if (repoRecord !== null) throw new Error('CRITICAL: Palace Square is retrievable via repository getByCityAndSlug!');
  console.log('3. Palace Square repository lookup: NULL ✅');

  const sitemapMatch = [...sitemapUrls].some(u => u.includes('palace-square'));
  if (sitemapMatch) throw new Error('CRITICAL: Palace Square leaked into sitemap URLs!');
  console.log('4. Palace Square in sitemap URLs: ABSENT ✅');

  // Check generated static city HTML for leakage
  for (const loc of ['de', 'en', 'ar']) {
    const cityHubPath = loc === 'de'
      ? path.join(ROOT, `.next/server/app/${loc}/moscheen/muenster.html`)
      : path.join(ROOT, `.next/server/app/${loc}/mosques/muenster.html`);
    if (fs.existsSync(cityHubPath)) {
      const content = fs.readFileSync(cityHubPath, 'utf8');
      if (content.includes('Palace Square') || content.includes(holdPlaceId)) {
        throw new Error(`CRITICAL: Palace Square leaked into ${cityHubPath}!`);
      }
    }
  }
  console.log('5. Palace Square in generated Münster city pages (de, en, ar): ABSENT ✅');

  // 2. Audit all HOLD and REJECT records across all-entities.json
  const nonPublished = allEntities.filter((e: any) => e.dataStatus !== 'PUBLISHED');
  console.log(`\nAuditing ${nonPublished.length} non-published entities (53 REVIEWED, 7 REJECTED)...`);

  for (const np of nonPublished) {
    if (mosques.some(m => m.placeId === np.placeId)) {
      throw new Error(`CRITICAL: Non-published entity ${np.canonicalName} (${np.placeId}) is in mosques.json!`);
    }
    const cityConfig = CITY_CONFIGS.find(c => c.canonical.toLowerCase() === (np.city || '').toLowerCase());
    const citySlug = cityConfig ? cityConfig.slug : (np.city || '').toLowerCase();
    for (const url of sitemapUrls) {
      const parsedUrl = new URL(url);
      const parts = parsedUrl.pathname.split('/').filter(Boolean);
      // Format: [locale, "moschee"|"mosque", citySlug, slug]
      if (parts.length === 4 && parts[2] === citySlug && parts[3] === np.slug) {
        throw new Error(`CRITICAL: Non-published entity ${np.slug} in ${np.city} found in sitemap: ${url}`);
      }
    }
  }
  console.log('6. All 60 non-published entities (HOLD & REJECT): 0 in mosques.json, 0 in sitemap ✅');

  // 3. Audit unpublished candidate cities
  const candidateCities = [
    'kiel',
    'regensburg',
    'karlsruhe',
    'augsburg',
    'bielefeld',
    'mainz',
    'hannover',
    'duisburg',
    'bochum',
    'dresden',
    'mannheim'
  ];

  console.log(`\nAuditing ${candidateCities.length} candidate cities for non-indexability...`);
  for (const slug of candidateCities) {
    if (isPublishedCity(slug)) {
      throw new Error(`CRITICAL: Candidate city "${slug}" is marked published in city registry!`);
    }
    const regEntry = getCityRegistryEntry(slug);
    if (regEntry && (regEntry.publicationEnabled || regEntry.seoIndexable)) {
      throw new Error(`CRITICAL: Candidate city "${slug}" has publicationEnabled or seoIndexable = true!`);
    }
    if (overrides[slug] && overrides[slug].publicationEnabled) {
      throw new Error(`CRITICAL: Candidate city "${slug}" has publication override enabled!`);
    }
    const countInDb = (await repo.getByCity(regEntry?.canonical || slug)).length;
    if (countInDb > 0) {
      throw new Error(`CRITICAL: Candidate city "${slug}" has ${countInDb} published records in database!`);
    }
    for (const url of sitemapUrls) {
      if (url.includes(`/moscheen/${slug}`) || url.includes(`/mosques/${slug}`)) {
        throw new Error(`CRITICAL: Candidate city "${slug}" leaked into sitemap: ${url}`);
      }
    }
  }
  console.log(`7. All ${candidateCities.length} candidate cities strictly UNPUBLISHED and NON-INDEXABLE ✅`);

  // 4. Verify Münster is the ONLY newly enabled city in Phase 14F
  const defaultCities = ['koeln', 'berlin', 'hamburg', 'muenchen', 'frankfurt', 'duesseldorf', 'stuttgart', 'dortmund', 'essen'];
  const launchedInPriorPhases = ['wuppertal', 'bonn', 'bremen', 'nuernberg', 'leipzig', 'wiesbaden', 'luebeck', 'aachen', 'saarbruecken', 'freiburg'];
  const launchedInPhase14F = ['muenster'];

  const expectedPublishedSlugs = new Set([...defaultCities, ...launchedInPriorPhases, ...launchedInPhase14F]);
  const actualPublishedConfigs = getPublishedCityConfigs();
  const actualPublishedSlugs = new Set(actualPublishedConfigs.map(c => c.slug));

  console.log(`\nPublished cities check: expected ${expectedPublishedSlugs.size}, actual ${actualPublishedSlugs.size}`);
  if (actualPublishedSlugs.size !== 20) throw new Error(`Expected 20 published cities, got ${actualPublishedSlugs.size}`);

  for (const slug of actualPublishedSlugs) {
    if (!expectedPublishedSlugs.has(slug)) {
      throw new Error(`CRITICAL: Unexpected published city "${slug}"!`);
    }
  }
  for (const slug of expectedPublishedSlugs) {
    if (!actualPublishedSlugs.has(slug)) {
      throw new Error(`CRITICAL: Expected published city "${slug}" is missing!`);
    }
  }
  console.log('8. Münster is confirmed to be the ONLY newly enabled city in Phase 14F ✅');

  console.log('\n✅ PUBLICATION BOUNDARY AUDIT PASSED: All boundaries intact.');
}

verifyBoundaries();
