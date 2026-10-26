import http from 'http';
import fs from 'fs';
import path from 'path';

interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
  crawlDate?: string;
  placeId?: string;
  canonicalName?: string;
  reason: string;
}

const ROOT = process.cwd();
const redirects: RedirectRule[] = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/redirects.json'), 'utf8')
);

const PORT = 3012;

function fetchRaw(port: number, requestPath: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        host: '127.0.0.1',
        port,
        path: requestPath,
        headers: { Accept: 'text/html' },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode || 500, headers: res.headers, body }));
      }
    );
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${requestPath}`));
    });
  });
}

// Select representative test candidates:
// 1. /de1 (homepage)
// 2. German mosque ending in 3 (/de/moschee/berlin/mehmed-zahid-kotku-sufi-lodge3)
// 3. German mosque ending in 4 (/de/moschee/koeln/ditib-el-aksa-moschee-meschenich4)
// 4. English mosque ending in 3 (/en/mosque/berlin/zeituna-mosque3)
// 5. English mosque ending in 4 (/en/mosque/bremen/bilal-habashi-moschee4)
// 6. Arabic mosque ending in 3 (/ar/mosque/muenchen/igmg-moschee-muenchen-moosach3)
// 7. Arabic mosque ending in 4 (/ar/mosque/bremen/verband-der-islamischen-kulturzentren4)

const candidates = [
  '/de1',
  '/de/moschee/berlin/mehmed-zahid-kotku-sufi-lodge3',
  '/de/moschee/koeln/ditib-el-aksa-moschee-meschenich4',
  '/en/mosque/berlin/zeituna-mosque3',
  '/en/mosque/bremen/bilal-habashi-moschee4',
  '/ar/mosque/muenchen/igmg-moschee-muenchen-moosach3',
  '/ar/mosque/bremen/verband-der-islamischen-kulturzentren4',
];

async function run() {
  console.log(`=== PHASE 15C: EXACT STATUS CODE AND HEADER PROBE ===\n`);

  for (const src of candidates) {
    const rule = redirects.find((r) => r.source === src);
    console.log(`Requesting: ${src}`);
    const initial = await fetchRaw(PORT, src);
    console.log(`  Actual Status Code: ${initial.status}`);
    console.log(`  Location Header:    ${initial.headers.location}`);
    console.log(`  Refresh Header:     ${initial.headers.refresh}`);
    
    if (initial.headers.location) {
      const dest = initial.headers.location;
      const target = await fetchRaw(PORT, dest);
      console.log(`  Following to:       ${dest}`);
      console.log(`  Target Status Code: ${target.status}`);
      console.log(`  Target Has Location:${!!target.headers.location}`);
      console.log(`  Target Content-Type:${target.headers['content-type']}`);
    }
    console.log('');
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
