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

const PORT = 3018;

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
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${requestPath}`));
    });
  });
}

async function run() {
  console.log(`=== PHASE 18: GSC 454 REDIRECT & 404 INTEGRITY PROBE ===\n`);
  console.log(`Auditing all ${redirects.length} configured redirects on port ${PORT}...\n`);

  let failureCount = 0;
  let status308Count = 0;
  let status301Count = 0;

  for (let i = 0; i < redirects.length; i++) {
    const r = redirects[i];
    process.stdout.write(`[Redirect ${i + 1}/${redirects.length}] ${r.source} -> `);

    try {
      const initial = await fetchRaw(PORT, r.source);

      if (initial.status === 308) {
        status308Count++;
      } else if (initial.status === 301) {
        status301Count++;
      } else {
        console.log(`FAILED! Expected 308 or 301, got ${initial.status}`);
        failureCount++;
        continue;
      }

      const location = initial.headers.location;
      if (!location) {
        console.log(`FAILED! Missing Location header in redirect response`);
        failureCount++;
        continue;
      }

      const expectedDestination = r.destination;
      const normalizedLocation = location
        .replace(/^https?:\/\/moscheeindernaehe\.de/, '')
        .replace(/^https?:\/\/127\.0\.0\.1:3018/, '');

      if (normalizedLocation !== expectedDestination) {
        console.log(`FAILED! Location "${location}" does not match expected destination "${expectedDestination}"`);
        failureCount++;
        continue;
      }

      // 2. Follow redirect to target: expect 200 OK without further redirects (no chains)
      const target = await fetchRaw(PORT, normalizedLocation);
      if (target.status !== 200) {
        console.log(`FAILED! Target "${normalizedLocation}" returned status ${target.status}, expected 200`);
        failureCount++;
        continue;
      }

      if (target.headers.location) {
        console.log(`FAILED! Target "${normalizedLocation}" triggered an additional redirect to "${target.headers.location}" (chain detected)`);
        failureCount++;
        continue;
      }

      console.log(`${initial.status} -> ${normalizedLocation} (200 OK) ✅`);
    } catch (e: any) {
      console.log(`ERROR! ${e.message}`);
      failureCount++;
    }
  }

  console.log(`\nRedirect Status Codes Summary: HTTP 308: ${status308Count}, HTTP 301: ${status301Count}`);

  // 3. Negative control tests & 404 HTML Document Structure
  console.log('\n--- Negative Control Tests & 404 Document Validation ---');
  const negativeTests = [
    '/de/moschee/berlin/completely-non-existent-fake-mosque',
    '/de/moschee/muenster/palace-square-prayer-room-mosque',
    '/de/moscheen/kiel',
    '/de/moscheen/regensburg',
    '/de/moscheen/karlsruhe',
  ];

  for (const neg of negativeTests) {
    process.stdout.write(`[Negative Test] ${neg} ... `);
    try {
      const res = await fetchRaw(PORT, neg);
      if (res.status === 404) {
        // Validate 404 document structure
        const body = res.body;
        const hasDoctype = body.includes('<!DOCTYPE html>') || body.includes('<!doctype html>');
        const hasHtml = body.includes('<html');
        const hasBody = body.includes('<body');
        const hasCloseBody = body.includes('</body>');
        const hasCloseHtml = body.includes('</html>');

        if (hasHtml && hasBody && hasCloseBody && hasCloseHtml) {
          console.log('404 Not Found (Valid HTML5 Document) ✅');
        } else {
          console.log(`FAILED! Status 404 but invalid HTML structure: hasHtml=${hasHtml}, hasBody=${hasBody}`);
          failureCount++;
        }
      } else {
        console.log(`FAILED! Expected 404, got ${res.status}`);
        failureCount++;
      }
    } catch (e: any) {
      console.log(`ERROR! ${e.message}`);
      failureCount++;
    }
  }

  console.log(`\n=================================================`);
  if (failureCount > 0) {
    console.error(`❌ Phase 18 Probe FAILED: ${failureCount} checks failed.`);
    process.exit(1);
  } else {
    console.log(`✅ All ${redirects.length} GSC Redirects and Negative Controls PASSED!`);
    process.exit(0);
  }
}

run();
