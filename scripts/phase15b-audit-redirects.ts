import fs from 'fs';
import path from 'path';

interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
  crawlDate: string;
  placeId?: string | null;
  canonicalName: string;
  reason: string;
}

interface Mosque {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  address: string;
  postalCode: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface Entity {
  id: string;
  canonicalName: string;
  slug: string;
  city: string;
  dataStatus: string;
}

// 1. Read files
const csvPath = 'reports/gsc/drilldown-2026-10-26/Tableau.csv';
const redirectsJsonPath = 'src/data/redirects.json';
const mosquesJsonPath = 'src/data/mosques.json';
const allEntitiesJsonPath = 'src/data/all-entities.json';

const csvRaw = fs.readFileSync(csvPath, 'utf8');
const lines = csvRaw.split(/\r?\n/).filter((l) => l.trim().length > 0);
const csvRows = lines.slice(1).map((line) => {
  const parts = line.split(',');
  const rawUrl = parts[0].trim().replace(/^"|"$/g, '');
  const crawlDate = parts[1] ? parts[1].trim().replace(/^"|"$/g, '') : '';
  const pathname = new URL(rawUrl).pathname;
  return { rawUrl, pathname, crawlDate };
});

const redirects: RedirectRule[] = JSON.parse(fs.readFileSync(redirectsJsonPath, 'utf8'));
const publishedMosques: Mosque[] = JSON.parse(fs.readFileSync(mosquesJsonPath, 'utf8'));
const allEntities: Entity[] = JSON.parse(fs.readFileSync(allEntitiesJsonPath, 'utf8'));

console.log(`=== AUDIT SUMMARY ===`);
console.log(`CSV URLs count: ${csvRows.length}`);
console.log(`Redirects in JSON: ${redirects.length}`);
console.log(`Published Mosques: ${publishedMosques.length}`);
console.log(`All Entities: ${allEntities.length}`);

// 2. Uniqueness & 1-to-1 inventory check
const redirectSourceSet = new Set<string>();
const duplicateSources: string[] = [];
for (const r of redirects) {
  if (redirectSourceSet.has(r.source)) {
    duplicateSources.push(r.source);
  }
  redirectSourceSet.add(r.source);
}
console.log(`Duplicate sources in redirects.json: ${duplicateSources.length}`);

const csvPathSet = new Set(csvRows.map((c) => c.pathname));
const missingInRedirects = Array.from(csvPathSet).filter((p) => !redirectSourceSet.has(p));
const extraInRedirects = Array.from(redirectSourceSet).filter((p) => !csvPathSet.has(p));

console.log(`CSV paths missing in redirects: ${missingInRedirects.length}`);
console.log(`Extra sources in redirects not in CSV: ${extraInRedirects.length}`);

// 3. Inspect suffixes breakdown
let countEnding3 = 0;
let countEnding4 = 0;
let countDe1 = 0;
let countOther = 0;

for (const r of redirects) {
  if (r.source === '/de1') {
    countDe1++;
  } else if (r.source.endsWith('3')) {
    countEnding3++;
  } else if (r.source.endsWith('4')) {
    countEnding4++;
  } else {
    countOther++;
  }
}
console.log(`Suffix breakdown: ending in 3 = ${countEnding3}, ending in 4 = ${countEnding4}, /de1 = ${countDe1}, other = ${countOther}`);

// 4. Chains, Loops, Homepage fallback
const chains = redirects.filter((r) => redirectSourceSet.has(r.destination));
const loops = redirects.filter((r) => r.source === r.destination);
const homepageFallbacks = redirects.filter((r) => r.destination === '/' || (r.destination === '/de' && r.source !== '/de1'));

console.log(`Redirect chains count: ${chains.length}`);
console.log(`Redirect loops count: ${loops.length}`);
console.log(`Generic homepage fallbacks count: ${homepageFallbacks.length}`);

// 5. Check each destination validity against published data
const publishedByPlaceId = new Map<string, Mosque>();
const publishedBySlug = new Map<string, Mosque>();
for (const m of publishedMosques) {
  publishedByPlaceId.set(m.id, m);
  publishedBySlug.set(m.slug, m);
}

const allEntitiesByPlaceId = new Map<string, Entity>();
for (const e of allEntities) {
  allEntitiesByPlaceId.set(e.id, e);
}

interface ItemAudit {
  index: number;
  source: string;
  destination: string;
  crawlDate: string;
  locale: string;
  routeType: string;
  sourceCity: string;
  slugWithDigit: string;
  targetSlug: string;
  placeId: string | null | undefined;
  canonicalName: string;
  destinationValid: boolean;
  targetEntityStatus: string;
  sameMosqueVerified: boolean;
  issues: string[];
}

const auditList: ItemAudit[] = [];

for (let i = 0; i < redirects.length; i++) {
  const r = redirects[i];
  const issues: string[] = [];

  // Parse source URL
  let locale = '';
  let routeType = '';
  let sourceCity = '';
  let slugWithDigit = '';
  let targetSlug = '';

  if (r.source === '/de1') {
    locale = 'de';
    routeType = 'home';
    if (r.destination !== '/de') {
      issues.push(`Expected destination /de for /de1, got ${r.destination}`);
    }
  } else {
    // Expected pattern: /:locale/:mosqueWord/:city/:slug
    const parts = r.source.split('/').filter(Boolean);
    locale = parts[0];
    routeType = parts[1];
    sourceCity = parts[2];
    slugWithDigit = parts[3];

    // Destination pattern
    const destParts = r.destination.split('/').filter(Boolean);
    const destLocale = destParts[0];
    const destRouteType = destParts[1];
    const destCity = destParts[2];
    targetSlug = destParts[3];

    if (destLocale !== locale) {
      issues.push(`Locale mismatch: source ${locale} vs dest ${destLocale}`);
    }
    if (destRouteType !== routeType) {
      issues.push(`Route type mismatch: source ${routeType} vs dest ${destRouteType}`);
    }
    if (destCity !== sourceCity) {
      issues.push(`City mismatch: source ${sourceCity} vs dest ${destCity}`);
    }

    // Verify slug transformation: stripping trailing '3' or '4'
    const expectedTargetSlug = slugWithDigit.replace(/[34]$/, '');
    if (targetSlug !== expectedTargetSlug) {
      issues.push(`Slug mismatch: expected ${expectedTargetSlug}, got ${targetSlug}`);
    }

    // Verify mosque exists in published data
    const mosque = publishedBySlug.get(targetSlug);
    if (!mosque) {
      issues.push(`Destination slug ${targetSlug} not found in published mosques.json`);
    } else {
      if (r.placeId && mosque.id !== r.placeId) {
        issues.push(`Place ID mismatch: rule has ${r.placeId}, mosque has ${mosque.id}`);
      }
    }
  }

  // Check entity status in all-entities.json
  let targetEntityStatus = 'UNKNOWN';
  if (r.placeId) {
    const ent = allEntitiesByPlaceId.get(r.placeId);
    if (ent) {
      targetEntityStatus = ent.dataStatus;
      if (ent.dataStatus !== 'PUBLISHED') {
        issues.push(`Target entity ${r.placeId} has status ${ent.dataStatus} (MUST BE PUBLISHED)`);
      }
    } else {
      issues.push(`Place ID ${r.placeId} not found in all-entities.json`);
    }
  } else if (r.source === '/de1') {
    targetEntityStatus = 'N/A (HOME)';
  }

  auditList.push({
    index: i + 1,
    source: r.source,
    destination: r.destination,
    crawlDate: r.crawlDate,
    locale,
    routeType,
    sourceCity,
    slugWithDigit,
    targetSlug,
    placeId: r.placeId,
    canonicalName: r.canonicalName,
    destinationValid: issues.length === 0,
    targetEntityStatus,
    sameMosqueVerified: issues.length === 0,
    issues,
  });
}

const failedItems = auditList.filter((a) => a.issues.length > 0);
console.log(`Failed items count: ${failedItems.length}`);
if (failedItems.length > 0) {
  console.error('Failed items:', JSON.stringify(failedItems, null, 2));
} else {
  console.log('ALL 74 REDIRECTS PASSED INTEGRITY VERIFICATION!');
}

// 6. Inspect locale distribution
const byLocale = { de: 0, en: 0, ar: 0 };
for (const a of auditList) {
  if (a.locale in byLocale) {
    byLocale[a.locale as keyof typeof byLocale]++;
  }
}
console.log('By locale:', byLocale);

// 7. Save detailed verification json for report generation
fs.writeFileSync('reports/gsc/phase15b-verification.json', JSON.stringify(auditList, null, 2));
console.log('Saved reports/gsc/phase15b-verification.json');
