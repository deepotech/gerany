import http from 'http';

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

function fetchUrl(port: number, path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(
      {
        host: '127.0.0.1',
        port,
        path,
        headers: { Accept: 'text/html' },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => resolve({ status: res.statusCode || 500, body }));
      }
    );
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${path}`));
    });
  });
}

function parseJsonLd(html: string): any[] {
  const results: any[] = [];
  const scriptRegex = /<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      results.push(JSON.parse(match[1]));
    } catch {
      console.error('Failed to parse JSON-LD chunk');
    }
  }
  return results;
}

async function probe() {
  const PORT = 3012;
  let hasErrors = false;

  const testCases: RouteTest[] = [
    // 1. German Freiburg city page
    {
      path: '/de/moscheen/freiburg',
      expectedStatus: 200,
      expectedTitleSub: 'Freiburg',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moscheen/freiburg',
      requiredTexts: [
        'Freiburg',
        'Freiburg Islamic Centre',
        'Ibad ur Rahman Moschee',
        'Mosque Freiburg',
      ],
      forbiddenTexts: [
        'Villingen',
        'Freiburg-Herdern Mosque',
      ],
    },
    // 2. English Freiburg city page
    {
      path: '/en/mosques/freiburg',
      expectedStatus: 200,
      expectedTitleSub: 'Freiburg',
      expectedCanonical: 'https://moscheeindernaehe.de/en/mosques/freiburg',
      requiredTexts: [
        'Freiburg Islamic Centre',
        'Ibad ur Rahman Moschee',
      ],
      forbiddenTexts: [
        'Villingen',
        'Freiburg-Herdern Mosque',
      ],
    },
    // 3. Arabic Freiburg city page (RTL)
    {
      path: '/ar/mosques/freiburg',
      expectedStatus: 200,
      expectedRtl: true,
      expectedCanonical: 'https://moscheeindernaehe.de/ar/mosques/freiburg',
      requiredTexts: [
        'فرايبورغ إم برايسغاو',
        'Freiburg Islamic Centre',
      ],
      forbiddenTexts: [
        'Villingen',
        'Freiburg-Herdern Mosque',
      ],
    },
    // 4. German Detail page: Freiburg Islamic Centre
    {
      path: '/de/moschee/freiburg/freiburg-islamic-centre',
      expectedStatus: 200,
      expectedTitleSub: 'Freiburg Islamic Centre',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/freiburg/freiburg-islamic-centre',
      requiredTexts: [
        'Hugstetter Str. 36',
        '79106',
        'Freiburg im Breisgau',
      ],
    },
    // 5. English Detail page: Freiburg Islamic Centre
    {
      path: '/en/mosque/freiburg/freiburg-islamic-centre',
      expectedStatus: 200,
      expectedTitleSub: 'Freiburg Islamic Centre',
      expectedCanonical: 'https://moscheeindernaehe.de/en/mosque/freiburg/freiburg-islamic-centre',
      requiredTexts: [
        'Hugstetter Str. 36',
      ],
    },
    // 6. Arabic Detail page: Freiburg Islamic Centre (RTL)
    {
      path: '/ar/mosque/freiburg/freiburg-islamic-centre',
      expectedStatus: 200,
      expectedRtl: true,
      expectedCanonical: 'https://moscheeindernaehe.de/ar/mosque/freiburg/freiburg-islamic-centre',
      requiredTexts: [
        'Hugstetter Str. 36',
      ],
    },
    // 7. German Detail page: Ibad ur Rahman Moschee (approved Habsburgerstr. 56a record)
    {
      path: '/de/moschee/freiburg/ibad-ur-rahman-moschee',
      expectedStatus: 200,
      expectedTitleSub: 'Ibad ur Rahman Moschee',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/freiburg/ibad-ur-rahman-moschee',
      requiredTexts: [
        'Habsburgerstraße 56A',
        '79104',
      ],
    },
    // 8. German Detail page: Mosque Freiburg / BBF
    {
      path: '/de/moschee/freiburg/mosque-freiburg',
      expectedStatus: 200,
      expectedTitleSub: 'Mosque Freiburg',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/freiburg/mosque-freiburg',
      requiredTexts: [
        'Rufacher Str. 5',
        '79110',
      ],
    },
    // 9. German Detail page: DITIB Mevlana
    {
      path: '/de/moschee/freiburg/freiburg-ditib-mevlana-moschee',
      expectedStatus: 200,
      expectedTitleSub: 'Freiburg DITIB Mevlana Moschee',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/freiburg/freiburg-ditib-mevlana-moschee',
      requiredTexts: [
        'Rufacher Str. 11',
      ],
    },
    // 10. Quarantined HOLD record 1: Villingen (Must 404)
    {
      path: '/de/moschee/freiburg/villingen',
      expectedStatus: 404,
    },
    // 11. Quarantined HOLD record 2: Freiburg-Herdern Mosque (Must 404)
    {
      path: '/de/moschee/freiburg/freiburg-herdern-mosque',
      expectedStatus: 404,
    },
    // 12. Non-promoted candidate city collection (Must 404)
    {
      path: '/de/moscheen/kiel',
      expectedStatus: 404,
    },
    // 13. Non-promoted candidate city collection (Must 404)
    {
      path: '/de/moscheen/muenster',
      expectedStatus: 404,
    },
    // 14. Non-promoted candidate city collection (Must 404)
    {
      path: '/de/moscheen/karlsruhe',
      expectedStatus: 404,
    },
  ];

  console.log(`--- Running ${testCases.length} HTTP Route Smoke Tests on Port ${PORT} ---\n`);

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    process.stdout.write(`[Test ${i + 1}/${testCases.length}] ${tc.path} ... `);

    try {
      const res = await fetchUrl(PORT, tc.path);

      if (res.status !== tc.expectedStatus) {
        console.log(`FAILED! Status: ${res.status}, Expected: ${tc.expectedStatus}`);
        hasErrors = true;
        continue;
      }

      if (tc.expectedStatus === 200) {
        // Title check
        if (tc.expectedTitleSub) {
          const titleMatch = res.body.match(/<title>([^<]*)<\/title>/i);
          const titleText = titleMatch ? titleMatch[1] : '';
          if (!titleText.toLowerCase().includes(tc.expectedTitleSub.toLowerCase())) {
            console.log(`FAILED! Title "${titleText}" does not contain "${tc.expectedTitleSub}"`);
            hasErrors = true;
            continue;
          }
        }

        // Canonical check
        if (tc.expectedCanonical) {
          const canonicalMatch = res.body.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i);
          const canonicalUrl = canonicalMatch ? canonicalMatch[1] : '';
          if (canonicalUrl !== tc.expectedCanonical) {
            console.log(`FAILED! Canonical "${canonicalUrl}" != "${tc.expectedCanonical}"`);
            hasErrors = true;
            continue;
          }
        }

        // RTL check
        if (tc.expectedRtl) {
          const isRtl = res.body.includes('dir="rtl"');
          if (!isRtl) {
            console.log(`FAILED! Expected dir="rtl" not found in HTML.`);
            hasErrors = true;
            continue;
          }
        }

        // Required text check
        if (tc.requiredTexts) {
          let missingRequired = false;
          for (const req of tc.requiredTexts) {
            if (!res.body.includes(req)) {
              console.log(`FAILED! Missing required text: "${req}"`);
              hasErrors = true;
              missingRequired = true;
              break;
            }
          }
          if (missingRequired) continue;
        }

        // Forbidden text check
        if (tc.forbiddenTexts) {
          let foundForbidden = false;
          for (const forb of tc.forbiddenTexts) {
            if (res.body.includes(forb)) {
              console.log(`FAILED! Found forbidden text: "${forb}"`);
              hasErrors = true;
              foundForbidden = true;
              break;
            }
          }
          if (foundForbidden) continue;
        }

        // JSON-LD check for detail pages
        if (tc.path.includes('/moschee/') || tc.path.includes('/mosque/')) {
          const jsonLdChunks = parseJsonLd(res.body);
          if (jsonLdChunks.length === 0) {
            console.log(`FAILED! No JSON-LD schema found on detail route.`);
            hasErrors = true;
            continue;
          }
        }
      }

      console.log('PASSED ✅');
    } catch (e: any) {
      console.log(`ERROR! ${e.message}`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error('\n❌ HTTP Smoke Tests encountered one or more errors.');
    process.exit(1);
  } else {
    console.log(`\n✅ All ${testCases.length} HTTP Route Smoke Tests PASSED!`);
    process.exit(0);
  }
}

probe();
