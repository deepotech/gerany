import fs from 'fs';
import http from 'http';
import { spawn, ChildProcess } from 'child_process';
import { getPublishedCityConfigs } from '../src/pipeline/city-config';
import { getCityRegistryEntry, getAllCityRegistryEntries } from '../src/pipeline/city-registry';
import { getMosqueRepository } from '../src/lib/db';
import sitemap from '../src/app/sitemap';

interface ValidationResult {
  passed: boolean;
  messages: string[];
  errors: string[];
}

const res: ValidationResult = {
  passed: true,
  messages: [],
  errors: [],
};

function log(msg: string) {
  console.log(msg);
  res.messages.push(msg);
}

function error(err: string) {
  console.error(`ERROR: ${err}`);
  res.errors.push(err);
  res.passed = false;
}

// 1. DATA INTEGRITY CHECKS
async function runDataIntegrityChecks() {
  log('====================================================');
  log('1. DATA INTEGRITY CHECKS');
  log('====================================================');

  const mosquesPath = './src/data/mosques.json';
  const allPath = './src/data/all-entities.json';

  const mosques: any[] = JSON.parse(fs.readFileSync(mosquesPath, 'utf8'));
  const allEntities: any[] = JSON.parse(fs.readFileSync(allPath, 'utf8'));

  // Exactly 559 published mosques
  log(`Total published mosques in mosques.json: ${mosques.length}`);
  if (mosques.length !== 559) {
    error(`Expected exactly 559 published mosques, found ${mosques.length}`);
  }

  // All have dataStatus: "PUBLISHED"
  const nonPublished = mosques.filter(m => m.dataStatus !== 'PUBLISHED');
  if (nonPublished.length > 0) {
    error(`Found ${nonPublished.length} non-PUBLISHED records in mosques.json`);
  }

  // Exactly 15 published cities
  const publishedCities = getPublishedCityConfigs();
  log(`Total published cities: ${publishedCities.length}`);
  if (publishedCities.length !== 15) {
    error(`Expected exactly 15 published cities, found ${publishedCities.length}`);
  }
  log(`Published cities: ${publishedCities.map(c => c.canonical).join(', ')}`);

  // Exactly 17 Wiesbaden records
  const wiesbadenInMosques = mosques.filter(m => m.city.toLowerCase() === 'wiesbaden');
  log(`Wiesbaden records in mosques.json: ${wiesbadenInMosques.length}`);
  if (wiesbadenInMosques.length !== 17) {
    error(`Expected exactly 17 Wiesbaden records, found ${wiesbadenInMosques.length}`);
  }

  // Unique slugs and placeIds
  const slugSet = new Set<string>();
  const placeIdSet = new Set<string>();
  for (const m of wiesbadenInMosques) {
    if (slugSet.has(m.slug)) error(`Duplicate Wiesbaden slug: ${m.slug}`);
    if (placeIdSet.has(m.placeId)) error(`Duplicate Wiesbaden placeId: ${m.placeId}`);
    slugSet.add(m.slug);
    placeIdSet.add(m.placeId);
  }
  log(`Verified 17 unique Wiesbaden slugs and placeIds.`);

  // Moschee Schierstein remains excluded
  const schiersteinInMosques = mosques.filter(m => 
    m.placeId === 'ChIJOYKxBgCVvUcR0ZVvoTpmab0' || 
    /schierstein/i.test(m.canonicalName) || 
    /schierstein/i.test(m.slug)
  );
  if (schiersteinInMosques.length > 0) {
    error(`Moschee Schierstein leaked into mosques.json! Count: ${schiersteinInMosques.length}`);
  } else {
    log('Verified: Moschee Schierstein is ABSENT from published mosques.json.');
  }

  const schiersteinInAll = allEntities.filter(m => m.placeId === 'ChIJOYKxBgCVvUcR0ZVvoTpmab0');
  if (schiersteinInAll.length === 0) {
    error('Moschee Schierstein not found in all-entities.json!');
  } else if (schiersteinInAll[0].dataStatus === 'PUBLISHED') {
    error('Moschee Schierstein is marked as PUBLISHED in all-entities.json!');
  } else {
    log(`Verified: Moschee Schierstein in all-entities.json has status: ${schiersteinInAll[0].dataStatus} (Reason: ${schiersteinInAll[0].reviewReason})`);
  }

  // Vahdet-Moschee phone verification
  const vahdet = mosques.find(m => m.placeId === 'ChIJv955JAq_vUcRpPic5HU-Ts8');
  if (!vahdet) {
    error('Vahdet-Moschee not found in mosques.json!');
  } else if (vahdet.phone !== null) {
    error(`Vahdet-Moschee phone is NOT null: ${vahdet.phone}`);
  } else {
    log('Verified: Vahdet-Moschee phone remains strictly null.');
  }

  // Other candidate cities remain unpublished
  const candidates = ['mainz', 'aachen', 'bielefeld', 'kiel', 'luebeck', 'freiburg', 'regensburg', 'saarbruecken', 'augsburg', 'karlsruhe', 'muenster'];
  for (const cand of candidates) {
    const entry = getCityRegistryEntry(cand);
    if (!entry) {
      error(`Candidate city ${cand} not found in registry!`);
    } else {
      if (entry.publicationEnabled) error(`Candidate city ${cand} has publicationEnabled === true!`);
      if (entry.seoIndexable) error(`Candidate city ${cand} has seoIndexable === true!`);
      if (entry.status === 'PUBLISHED') error(`Candidate city ${cand} has status === PUBLISHED!`);
    }
  }
  log(`Verified: All ${candidates.length} candidate cities remain strictly UNPUBLISHED and non-indexable.`);

  // Check baseline 542 records
  const baseline542 = mosques.slice(0, 542);
  const baselineCities = new Set(baseline542.map(m => m.city));
  log(`Baseline records: 542 records across ${baselineCities.size} cities.`);
  if (baselineCities.has('Wiesbaden')) {
    error('Wiesbaden detected in baseline 542 records!');
  }
}

// 2. SITEMAP AUDIT
async function runSitemapAudit() {
  log('\n====================================================');
  log('2. SITEMAP & ROBOTS AUDIT');
  log('====================================================');

  const entries = await sitemap();
  log(`Generated sitemap total entries: ${entries.length}`);

  // Expected: 3 home + 3 hub + (15 cities * 3) + (559 mosques * 3) = 3 + 3 + 45 + 1677 = 1728
  const expectedTotal = 3 + 3 + (15 * 3) + (559 * 3);
  if (entries.length !== 1728 || entries.length !== expectedTotal) {
    error(`Expected exactly 1728 sitemap entries, got ${entries.length}`);
  }

  // Check duplicates
  const urlSet = new Set<string>();
  let dupCount = 0;
  for (const entry of entries) {
    if (urlSet.has(entry.url)) {
      dupCount++;
      error(`Duplicate sitemap URL: ${entry.url}`);
    }
    urlSet.add(entry.url);
  }
  if (dupCount === 0) {
    log('Verified: 0 duplicate URLs in sitemap.');
  }

  // Check Wiesbaden entries
  const wiesbadenEntries = entries.filter(e => e.url.includes('wiesbaden'));
  log(`Wiesbaden sitemap URLs: ${wiesbadenEntries.length} (Expected: 54 = 3 city + 51 detail)`);
  if (wiesbadenEntries.length !== 54) {
    error(`Expected exactly 54 Wiesbaden URLs, got ${wiesbadenEntries.length}`);
  }

  // Check excluded and candidate cities
  const candidates = ['mainz', 'aachen', 'bielefeld', 'kiel', 'luebeck', 'freiburg', 'regensburg', 'saarbruecken', 'augsburg', 'karlsruhe', 'muenster'];
  for (const cand of candidates) {
    const leaked = entries.filter(e => e.url.includes(`/${cand}`));
    if (leaked.length > 0) {
      error(`Candidate city ${cand} leaked into sitemap: ${leaked.map(l => l.url).join(', ')}`);
    }
  }

  const schiersteinLeaked = entries.filter(e => e.url.includes('schierstein'));
  if (schiersteinLeaked.length > 0) {
    error(`Moschee Schierstein leaked into sitemap!`);
  } else {
    log('Verified: Moschee Schierstein is absent from sitemap.');
  }

  // Inspect generated static sitemap file on disk if present
  const sitemapBodyPath = './.next/server/app/sitemap.xml.body';
  if (fs.existsSync(sitemapBodyPath)) {
    const sitemapContent = fs.readFileSync(sitemapBodyPath, 'utf8');
    const locMatches = sitemapContent.match(/<loc>/g) || [];
    log(`Prerendered sitemap.xml.body <loc> tags count: ${locMatches.length}`);
    if (locMatches.length !== 1728) {
      error(`sitemap.xml.body contains ${locMatches.length} URLs, expected 1728`);
    }
  }

  // Inspect robots.txt.body
  const robotsBodyPath = './.next/server/app/robots.txt.body';
  if (fs.existsSync(robotsBodyPath)) {
    const robotsContent = fs.readFileSync(robotsBodyPath, 'utf8');
    log(`robots.txt content:\n${robotsContent.trim()}`);
    if (!robotsContent.includes('Sitemap: https://moscheeindernaehe.de/sitemap.xml')) {
      error('robots.txt does not contain correct sitemap directive');
    }
  }
}

// 3. LOCAL PRODUCTION HTTP SERVER VALIDATION
interface RouteTest {
  path: string;
  expectedStatus: number;
  expectedTitleSub?: string;
  expectedMetaDescSub?: string;
  expectedCanonical?: string;
  expectedRtl?: boolean;
  requiredTexts?: string[];
  forbiddenTexts?: string[];
}

function fetchUrl(port: number, path: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://127.0.0.1:${port}${path}`, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode || 0, headers: res.headers, body });
      });
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${path}`));
    });
  });
}

async function waitForServer(port: number, maxTries = 40): Promise<boolean> {
  for (let i = 0; i < maxTries; i++) {
    try {
      const res = await fetchUrl(port, '/de');
      if (res.status === 200) return true;
    } catch (e: any) {
      // wait 250ms
      await new Promise(r => setTimeout(r, 250));
    }
  }
  return false;
}

function parseTagContent(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match ? match[1] : null;
}

function parseJsonLd(html: string): any[] {
  const results: any[] = [];
  const scriptRegex = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      results.push(JSON.parse(match[1]));
    } catch (e) {
      console.error('Failed to parse JSON-LD chunk:', match[1]);
    }
  }
  return results;
}

async function runLocalHttpTests() {
  log('\n====================================================');
  log('3. LOCAL PRODUCTION HTTP ROUTE VALIDATION');
  log('====================================================');

  const PORT = 3009;
  log(`Starting Next.js production server on port ${PORT}...`);

  const nextBin = require.resolve('next/dist/bin/next');
  const serverProcess = spawn(process.execPath, [nextBin, 'start', '-H', '127.0.0.1', '-p', String(PORT)], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  serverProcess.stdout?.on('data', (d) => {
    // console.log(`[Next.js stdout]: ${d}`);
  });
  serverProcess.stderr?.on('data', (d) => {
    console.error(`[Next.js stderr]: ${d}`);
  });

  const ready = await waitForServer(PORT);
  if (!ready) {
    serverProcess.kill();
    throw new Error('Next.js production server failed to start within timeout');
  }
  log('Next.js production server is running and responding.');

  const testCases: RouteTest[] = [
    // 1. German Wiesbaden city page
    {
      path: '/de/moscheen/wiesbaden',
      expectedStatus: 200,
      expectedTitleSub: 'Moscheen in Wiesbaden',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moscheen/wiesbaden',
      expectedRtl: false,
      requiredTexts: ['Wiesbaden', 'Ayasofya Cami', 'Süleymaniye-Moschee'],
      forbiddenTexts: ['Moschee Schierstein'],
    },
    // 2. English Wiesbaden city page
    {
      path: '/en/mosques/wiesbaden',
      expectedStatus: 200,
      expectedTitleSub: 'Mosques in Wiesbaden',
      expectedCanonical: 'https://moscheeindernaehe.de/en/mosques/wiesbaden',
      expectedRtl: false,
      requiredTexts: ['Mosques in Wiesbaden', 'Wiesbaden Central Mosque'],
    },
    // 3. Arabic Wiesbaden city page and RTL
    {
      path: '/ar/mosques/wiesbaden',
      expectedStatus: 200,
      expectedTitleSub: 'فيسبادن',
      expectedCanonical: 'https://moscheeindernaehe.de/ar/mosques/wiesbaden',
      expectedRtl: true,
      requiredTexts: ['فيسبادن', 'مساجد'],
    },
    // 4. Detail page 1 (Ayasofya Cami in Wiesbaden)
    {
      path: '/de/moschee/wiesbaden/ayasofya-cami-medrese-i-nuriye',
      expectedStatus: 200,
      expectedTitleSub: 'Ayasofya Cami',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/wiesbaden/ayasofya-cami-medrese-i-nuriye',
      expectedRtl: false,
      requiredTexts: ['Ayasofya Cami', '55252', 'Schmalweg 36'],
    },
    // 5. Detail page 2 (Wiesbaden Central Mosque - Omar Moschee)
    {
      path: '/de/moschee/wiesbaden/wiesbaden-central-mosque-omar-moschee',
      expectedStatus: 200,
      expectedTitleSub: 'Omar Moschee',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/wiesbaden/wiesbaden-central-mosque-omar-moschee',
      expectedRtl: false,
      requiredTexts: ['Henkellstraße 12', '65187'],
    },
    // 6. Valid published city outside Wiesbaden (Berlin)
    {
      path: '/de/moscheen/berlin',
      expectedStatus: 200,
      expectedTitleSub: 'Moscheen in Berlin',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moscheen/berlin',
      expectedRtl: false,
      requiredTexts: ['Berlin'],
    },
    // 7. Valid published mosque detail outside Wiesbaden
    {
      path: '/de/moschee/berlin/lubars-mosque',
      expectedStatus: 200,
      expectedTitleSub: 'Lübars Mosque',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/berlin/lubars-mosque',
      expectedRtl: false,
      requiredTexts: ['Berlin'],
    },
    // 8. Unpublished candidate city route (Mainz)
    {
      path: '/de/moscheen/mainz',
      expectedStatus: 404,
    },
    // 9. Unpublished candidate city route (Bielefeld)
    {
      path: '/en/mosques/bielefeld',
      expectedStatus: 404,
    },
    // 10. Excluded mosque route (Moschee Schierstein)
    {
      path: '/de/moschee/wiesbaden/moschee-schierstein',
      expectedStatus: 404,
    },
  ];

  for (const tc of testCases) {
    try {
      const resp = await fetchUrl(PORT, tc.path);
      log(`Testing [${tc.path}] -> Status ${resp.status}`);

      if (resp.status !== tc.expectedStatus) {
        error(`Route ${tc.path}: Expected status ${tc.expectedStatus}, got ${resp.status}`);
      }

      if (tc.expectedStatus === 200) {
        const html = resp.body;

        // Title
        const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : '';
        log(`   Title: "${title}"`);
        if (tc.expectedTitleSub && !title.includes(tc.expectedTitleSub)) {
          error(`Route ${tc.path}: Title does not contain "${tc.expectedTitleSub}". Actual: "${title}"`);
        }

        // Meta description
        const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) ||
                          html.match(/<meta\s+content="([^"]*)"\s+name="description"/i);
        const desc = descMatch ? descMatch[1] : '';
        log(`   Meta Description: "${desc}"`);
        if (!desc || desc.length < 10) {
          error(`Route ${tc.path}: Meta description missing or too short: "${desc}"`);
        }

        // Canonical URL
        const canonMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i) ||
                           html.match(/<link\s+href="([^"]*)"\s+rel="canonical"/i);
        const canonical = canonMatch ? canonMatch[1] : '';
        log(`   Canonical: "${canonical}"`);
        if (tc.expectedCanonical && canonical !== tc.expectedCanonical) {
          error(`Route ${tc.path}: Expected canonical "${tc.expectedCanonical}", got "${canonical}"`);
        }

        // Hreflang alternates
        const hreflangs: Record<string, string> = {};
        const hrefRegex = /<link\s+rel="alternate"\s+hreflang="([^"]*)"\s+href="([^"]*)"/gi;
        let hm;
        while ((hm = hrefRegex.exec(html)) !== null) {
          hreflangs[hm[1]] = hm[2];
        }
        log(`   Hreflang count: ${Object.keys(hreflangs).length} (${Object.keys(hreflangs).join(', ')})`);
        if (!hreflangs['de'] || !hreflangs['en'] || !hreflangs['ar'] || !hreflangs['x-default']) {
          error(`Route ${tc.path}: Missing hreflang alternates (expected de, en, ar, x-default). Got: ${JSON.stringify(hreflangs)}`);
        }

        // RTL check
        if (tc.expectedRtl) {
          const hasRtlDir = html.includes('dir="rtl"');
          log(`   RTL check: dir="rtl" present = ${hasRtlDir}`);
          if (!hasRtlDir) {
            error(`Route ${tc.path}: Expected RTL rendering (dir="rtl") not found`);
          }
        }

        // Structured data JSON-LD
        const jsonLdItems = parseJsonLd(html);
        log(`   JSON-LD scripts found: ${jsonLdItems.length}`);
        if (jsonLdItems.length === 0) {
          error(`Route ${tc.path}: No JSON-LD structured data found`);
        } else {
          for (const item of jsonLdItems) {
            log(`     - Type: ${item['@type']}, Context: ${item['@context']}, ID: ${item['@id'] || item.name || 'none'}`);
          }
        }

        // Required text checks
        if (tc.requiredTexts) {
          for (const reqText of tc.requiredTexts) {
            if (!html.includes(reqText)) {
              error(`Route ${tc.path}: Required text "${reqText}" not found in rendered HTML`);
            }
          }
        }

        // Forbidden text checks
        if (tc.forbiddenTexts) {
          for (const forbText of tc.forbiddenTexts) {
            if (html.includes(forbText)) {
              error(`Route ${tc.path}: Forbidden text "${forbText}" found in rendered HTML`);
            }
          }
        }
      }
    } catch (e: any) {
      error(`Route ${tc.path} failed request: ${e.message}`);
    }
  }

  // Gracefully terminate server
  log('Terminating Next.js production server...');
  serverProcess.kill('SIGINT');
  // On windows spawn child process kill
  spawn('taskkill', ['/pid', String(serverProcess.pid), '/f', '/t']);
  log('Server terminated successfully.');
}

async function main() {
  try {
    await runDataIntegrityChecks();
    await runSitemapAudit();

    console.log('\n====================================================');
    console.log('DATA & SITEMAP INTEGRITY AUDIT SUMMARY');
    console.log('====================================================');
    console.log(`Passed: ${res.passed}`);
    console.log(`Total Errors: ${res.errors.length}`);
    if (res.errors.length > 0) {
      console.log('Errors:');
      res.errors.forEach(e => console.log(`  - ${e}`));
      process.exit(1);
    } else {
      console.log('ALL INTEGRITY AND SITEMAP CHECKS PASSED CLEANLY!');
      process.exit(0);
    }
  } catch (err: any) {
    console.error('Validation script unhandled exception:', err);
    process.exit(1);
  }
}

main();
