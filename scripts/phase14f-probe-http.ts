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
    // 1. German Münster city page
    {
      path: '/de/moscheen/muenster',
      expectedStatus: 200,
      expectedTitleSub: 'Münster',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moscheen/muenster',
      requiredTexts: [
        'Münster',
        'Arrahmanmoschee',
        'Sultan Ahmet Camii',
        'Munster Central Mosque',
        'As-Salam Moschee',
      ],
      forbiddenTexts: [
        'Palace Square Prayer Room Mosque',
      ],
    },
    // 2. English Münster city page
    {
      path: '/en/mosques/muenster',
      expectedStatus: 200,
      expectedTitleSub: 'Muenster',
      expectedCanonical: 'https://moscheeindernaehe.de/en/mosques/muenster',
      requiredTexts: [
        'Muenster',
        'Munster Central Mosque',
      ],
      forbiddenTexts: [
        'Palace Square Prayer Room Mosque',
      ],
    },
    // 3. Arabic Münster city page (RTL)
    {
      path: '/ar/mosques/muenster',
      expectedStatus: 200,
      expectedRtl: true,
      expectedCanonical: 'https://moscheeindernaehe.de/ar/mosques/muenster',
      requiredTexts: [
        'مونستر',
        'Munster Central Mosque',
      ],
      forbiddenTexts: [
        'Palace Square Prayer Room Mosque',
      ],
    },
    // 4. German Detail page 1: Arrahmanmoschee
    {
      path: '/de/moschee/muenster/arrahmanmoschee',
      expectedStatus: 200,
      expectedTitleSub: 'Arrahmanmoschee',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/muenster/arrahmanmoschee',
      requiredTexts: [
        'Meßkamp 15',
        '48147',
        'Münster',
      ],
    },
    // 5. English Detail page 1: Arrahmanmoschee
    {
      path: '/en/mosque/muenster/arrahmanmoschee',
      expectedStatus: 200,
      expectedTitleSub: 'Arrahman',
      expectedCanonical: 'https://moscheeindernaehe.de/en/mosque/muenster/arrahmanmoschee',
      requiredTexts: [
        'Meßkamp 15',
      ],
    },
    // 6. Arabic Detail page 1: Arrahmanmoschee (RTL)
    {
      path: '/ar/mosque/muenster/arrahmanmoschee',
      expectedStatus: 200,
      expectedRtl: true,
      expectedCanonical: 'https://moscheeindernaehe.de/ar/mosque/muenster/arrahmanmoschee',
      requiredTexts: [
        'Meßkamp 15',
      ],
    },
    // 7. German Detail page 2: Munster Central Mosque (DITIB)
    {
      path: '/de/moschee/muenster/munster-central-mosque',
      expectedStatus: 200,
      expectedTitleSub: 'Munster Central Mosque',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/muenster/munster-central-mosque',
      requiredTexts: [
        'Bremer Platz 42',
        '48155',
      ],
    },
    // 8. German Detail page 3: Sultan Ahmet Camii (VIKZ)
    {
      path: '/de/moschee/muenster/sultan-ahmet-camii-verband-islamischer-kulturzentren-vikz',
      expectedStatus: 200,
      expectedTitleSub: 'Sultan Ahmet Camii',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/muenster/sultan-ahmet-camii-verband-islamischer-kulturzentren-vikz',
      requiredTexts: [
        'Bernhard-Ernst-Straße 7',
        '48155',
      ],
    },
    // 9. German Detail page 4: As-Salam Moschee
    {
      path: '/de/moschee/muenster/as-salam-moschee',
      expectedStatus: 200,
      expectedTitleSub: 'As-Salam Moschee',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/muenster/as-salam-moschee',
      requiredTexts: [
        'Hammer Str. 352',
        '48153',
      ],
    },
    // 10. German Detail page 5: Ar-Rahmah Moschee
    {
      path: '/de/moschee/muenster/ar-rahmah-moschee',
      expectedStatus: 200,
      expectedTitleSub: 'Ar-Rahmah Moschee',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/muenster/ar-rahmah-moschee',
      requiredTexts: [
        'Königsberger Str. 260',
        '48157',
      ],
    },
    // 11. German Detail page 6: Bošnjački Džemat Münster - BKZ
    {
      path: '/de/moschee/muenster/bo-nja-ki-d-emat-muenster-bkz',
      expectedStatus: 200,
      expectedTitleSub: 'Bošnjački Džemat Münster - BKZ',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/muenster/bo-nja-ki-d-emat-muenster-bkz',
      requiredTexts: [
        'Münsterstraße 52B',
        '48167',
      ],
    },
    // 12. German Detail page 7: Bait ul Momin Moschee
    {
      path: '/de/moschee/muenster/bait-ul-momin-moschee',
      expectedStatus: 200,
      expectedTitleSub: 'Bait ul Momin Moschee',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/muenster/bait-ul-momin-moschee',
      requiredTexts: [
        'Hansestraße 61',
        '48165',
      ],
    },
    // 13. Quarantined HOLD record: Palace Square Prayer Room Mosque (Must 404)
    {
      path: '/de/moschee/muenster/palace-square-prayer-room-mosque',
      expectedStatus: 404,
    },
    // 14. Non-promoted candidate city collection: Kiel (Must 404)
    {
      path: '/de/moscheen/kiel',
      expectedStatus: 404,
    },
    // 15. Non-promoted candidate city collection: Regensburg (Must 404)
    {
      path: '/de/moscheen/regensburg',
      expectedStatus: 404,
    },
    // 16. Non-promoted candidate city collection: Karlsruhe (Must 404)
    {
      path: '/de/moscheen/karlsruhe',
      expectedStatus: 404,
    },
    // 17. Non-promoted candidate city collection: Bielefeld (Must 404)
    {
      path: '/de/moscheen/bielefeld',
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
