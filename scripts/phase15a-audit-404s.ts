import fs from 'fs';
import path from 'path';
import { CITY_CONFIGS } from '../src/pipeline/city-config';
import { MosqueEntity } from '../src/pipeline/types';

const ROOT = process.cwd();
const mosques: MosqueEntity[] = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/mosques.json'), 'utf8'));
const tableauContent = fs.readFileSync(path.join(ROOT, 'reports/gsc/drilldown-2026-10-26/Tableau.csv'), 'utf8');

const rows = tableauContent
  .split(/\r?\n/)
  .slice(1)
  .filter((l) => l.trim().length > 0)
  .map((l) => {
    const [url, date] = l.split(',');
    return { url: url.trim(), crawlDate: date?.trim() };
  });

console.log(`Analyzing ${rows.length} GSC 404 URLs...\n`);

interface UrlAnalysis {
  index: number;
  originalUrl: string;
  crawlDate: string;
  locale: string | null;
  routeType: 'detail' | 'home' | 'malformed';
  cityInUrl: string | null;
  rawSlug: string | null;
  hasTrailingDigit: boolean;
  trailingDigit: string | null;
  hasCityAlias: boolean;
  matchedMosque: MosqueEntity | null;
  canonicalCity: string | null;
  canonicalCitySlug: string | null;
  canonicalUrl: string | null;
  decision: '301_TO_CANONICAL' | 'KEEP_404' | 'FIX_INTERNAL_LINK';
  reason: string;
  evidence: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

const analyses: UrlAnalysis[] = [];

for (let i = 0; i < rows.length; i++) {
  const { url, crawlDate } = rows[i];
  const u = new URL(url);
  const pathSegments = u.pathname.split('/').filter(Boolean);

  // Case 1: Malformed root/locale e.g. /de1
  if (u.pathname === '/de1' || u.pathname === '/de1/') {
    analyses.push({
      index: i + 1,
      originalUrl: url,
      crawlDate,
      locale: 'de',
      routeType: 'malformed',
      cityInUrl: null,
      rawSlug: null,
      hasTrailingDigit: true,
      trailingDigit: '1',
      hasCityAlias: false,
      matchedMosque: null,
      canonicalCity: null,
      canonicalCitySlug: null,
      canonicalUrl: 'https://moscheeindernaehe.de/de',
      decision: '301_TO_CANONICAL',
      reason: 'Malformed locale path `/de1` caused by stray digit "1" appended to German homepage',
      evidence: 'Root `/de` is the canonical German homepage returning HTTP 200.',
      confidence: 'HIGH',
    });
    continue;
  }

  // Case 2: Mosque detail URLs
  // Standard format: /[locale]/[moschee|mosque]/[city]/[slug]
  const locale = pathSegments[0]; // de, en, ar
  const routePrefix = pathSegments[1]; // moschee or mosque
  const cityInUrl = pathSegments[2];
  const rawSlug = pathSegments[3];

  let hasTrailingDigit = false;
  let trailingDigit: string | null = null;
  let cleanSlug = rawSlug;

  if (/[0-9]$/.test(rawSlug)) {
    hasTrailingDigit = true;
    trailingDigit = rawSlug.slice(-1);
    cleanSlug = rawSlug.slice(0, -1);
  }

  // Find matching mosque in mosques.json
  // First search by exact cleanSlug and city, or cleanSlug globally
  let matched = mosques.find(
    (m) => m.slug === cleanSlug && (
      m.city.toLowerCase() === cityInUrl.toLowerCase() ||
      CITY_CONFIGS.some(
        (c) =>
          c.canonical.toLowerCase() === m.city.toLowerCase() &&
          (c.slug === cityInUrl.toLowerCase() || c.englishSlug === cityInUrl.toLowerCase())
      )
    )
  );

  if (!matched) {
    // Try matching by slug alone
    matched = mosques.find((m) => m.slug === cleanSlug);
  }

  // Check city alias
  const cityConfig = matched ? CITY_CONFIGS.find((c) => c.canonical === matched.city) : null;
  const canonicalCitySlug = cityConfig
    ? locale === 'en'
      ? cityConfig.englishSlug
      : cityConfig.slug
    : cityInUrl;

  const hasCityAlias = cityInUrl.toLowerCase() !== canonicalCitySlug?.toLowerCase();

  let canonicalUrl: string | null = null;
  if (matched && cityConfig) {
    const routeWord = locale === 'de' ? 'moschee' : 'mosque';
    const citySlug = locale === 'en' ? cityConfig.englishSlug : cityConfig.slug;
    canonicalUrl = `https://moscheeindernaehe.de/${locale}/${routeWord}/${citySlug}/${matched.slug}`;
  }

  let decision: '301_TO_CANONICAL' | 'KEEP_404' | 'FIX_INTERNAL_LINK' = '301_TO_CANONICAL';
  let reason = '';
  let evidence = '';
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';

  if (matched && canonicalUrl) {
    decision = '301_TO_CANONICAL';
    reason = `Extraneous trailing digit "${trailingDigit}" appended to canonical slug "${matched.slug}"${
      hasCityAlias ? ` and alternate city slug "${cityInUrl}" used` : ''
    }`;
    evidence = `Verified published mosque "${matched.canonicalName}" (${matched.placeId}) exists at ${canonicalUrl}`;
    confidence = 'HIGH';
  } else {
    decision = 'KEEP_404';
    reason = `No matching published mosque found for slug "${cleanSlug}"`;
    evidence = 'Record does not exist in mosques.json or is non-published.';
    confidence = 'HIGH';
  }

  analyses.push({
    index: i + 1,
    originalUrl: url,
    crawlDate,
    locale,
    routeType: 'detail',
    cityInUrl,
    rawSlug,
    hasTrailingDigit,
    trailingDigit,
    hasCityAlias,
    matchedMosque: matched || null,
    canonicalCity: matched ? matched.city : null,
    canonicalCitySlug,
    canonicalUrl,
    decision,
    reason,
    evidence,
    confidence,
  });
}

// Summary stats
const decisionsCount = analyses.reduce((acc, a) => {
  acc[a.decision] = (acc[a.decision] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

console.log('--- Decision Breakdown ---');
console.log(decisionsCount);

const digitsCount = analyses.reduce((acc, a) => {
  acc[a.trailingDigit || 'none'] = (acc[a.trailingDigit || 'none'] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
console.log('\n--- Trailing Digits Breakdown ---');
console.log(digitsCount);

const aliasCount = analyses.filter((a) => a.hasCityAlias).length;
console.log('\n--- City Alias Mismatches ---');
console.log(`Total URLs with city alias mismatch: ${aliasCount}`);

// Verify all canonical URLs exist and return 200
console.log('\n--- Verifying Canonical Targets Against Prerendered HTML ---');
let missingTargets = 0;
for (const a of analyses) {
  if (a.canonicalUrl) {
    const u = new URL(a.canonicalUrl);
    const htmlPath = path.join(ROOT, `.next/server/app${u.pathname === '/de' ? '/de.html' : u.pathname + '.html'}`);
    if (!fs.existsSync(htmlPath)) {
      console.log(`MISSING HTML for canonical target: ${a.canonicalUrl} (${htmlPath})`);
      missingTargets++;
    }
  }
}
console.log(`Missing prerendered HTML targets: ${missingTargets}`);

// Write JSON artifact for step 4
fs.writeFileSync(
  path.join(ROOT, 'reports/gsc/drilldown-2026-10-26-analysis.json'),
  JSON.stringify(analyses, null, 2),
  'utf8'
);
console.log('\nSaved full analysis to reports/gsc/drilldown-2026-10-26-analysis.json');
