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

console.log(`Processing ${rows.length} GSC drilldown URLs...`);

interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
  crawlDate?: string;
  placeId?: string | null;
  canonicalName?: string;
  reason: string;
}

const redirects: RedirectRule[] = [];

for (const { url, crawlDate } of rows) {
  const u = new URL(url);
  const sourcePath = u.pathname;

  if (sourcePath === '/de1' || sourcePath === '/de1/') {
    redirects.push({
      source: '/de1',
      destination: '/de',
      permanent: true,
      crawlDate,
      reason: 'Stray digit 1 stripped to resolve canonical German homepage',
    });
    continue;
  }

  const parts = sourcePath.split('/').filter(Boolean);
  const locale = parts[0];
  const routePrefix = parts[1]; // moschee or mosque
  const cityInUrl = parts[2];
  const rawSlug = parts[3];

  const trailingDigit = rawSlug.match(/[0-9]$/)?.[0] || '';
  const cleanSlug = rawSlug.replace(/[0-9]$/, '');

  // Find matching mosque in mosques.json
  const matched = mosques.find(
    (m) =>
      m.slug === cleanSlug &&
      (m.city.toLowerCase() === cityInUrl.toLowerCase() ||
        CITY_CONFIGS.some(
          (c) =>
            c.canonical.toLowerCase() === m.city.toLowerCase() &&
            (c.slug === cityInUrl.toLowerCase() || c.englishSlug === cityInUrl.toLowerCase())
        ))
  ) || mosques.find((m) => m.slug === cleanSlug);

  if (!matched) {
    throw new Error(`Unable to match mosque for slug "${cleanSlug}" from URL ${url}`);
  }

  const cityConfig = CITY_CONFIGS.find((c) => c.canonical === matched.city)!;
  const citySlug = locale === 'en' ? cityConfig.englishSlug : cityConfig.slug;
  const canonicalPath = `/${locale}/${routePrefix}/${citySlug}/${matched.slug}`;

  redirects.push({
    source: sourcePath,
    destination: canonicalPath,
    permanent: true,
    crawlDate,
    placeId: matched.placeId,
    canonicalName: matched.canonicalName,
    reason: `Stray digit "${trailingDigit}" stripped to resolve canonical mosque page`,
  });
}

console.log(`Successfully generated ${redirects.length} redirect rules.`);

fs.writeFileSync(path.join(ROOT, 'src/data/redirects.json'), JSON.stringify(redirects, null, 2), 'utf8');
console.log('Saved redirects to src/data/redirects.json');
