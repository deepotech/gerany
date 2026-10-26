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
    } catch (e) {
      console.error('Failed to parse JSON-LD chunk');
    }
  }
  return results;
}

async function probe() {
  const PORT = 3010;
  let hasErrors = false;

  const testCases: RouteTest[] = [
    // 1. German Saarbrücken city page
    {
      path: '/de/moscheen/saarbruecken',
      expectedStatus: 200,
      expectedTitleSub: 'Saarbrücken',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moscheen/saarbruecken',
      expectedRtl: false,
      requiredTexts: ['Saarbrücken', 'Masjid Al Noor', 'Ditib Saarbrücken Merkez Cami'],
      forbiddenTexts: ['Pakistan Islamic Centre Saarbrucken'],
    },
    // 2. English Saarbrücken city page
    {
      path: '/en/mosques/saarbruecken',
      expectedStatus: 200,
      expectedTitleSub: 'Saarbruecken',
      expectedCanonical: 'https://moscheeindernaehe.de/en/mosques/saarbruecken',
      expectedRtl: false,
      requiredTexts: ['Saarbruecken', 'Masjid Al Noor'],
      forbiddenTexts: ['Pakistan Islamic Centre Saarbrucken'],
    },
    // 3. Arabic Saarbrücken city page and RTL
    {
      path: '/ar/mosques/saarbruecken',
      expectedStatus: 200,
      expectedTitleSub: 'زاربروكن',
      expectedCanonical: 'https://moscheeindernaehe.de/ar/mosques/saarbruecken',
      expectedRtl: true,
      requiredTexts: ['زاربروكن', 'مساجد'],
    },
    // 4. Detail page 1: Islamisches Kulturzentrum Saarbrücken (verifying placeholder phone is NOT rendered)
    {
      path: '/de/moschee/saarbruecken/islamisches-kulturzentrum-saarbruecken',
      expectedStatus: 200,
      expectedTitleSub: 'Islamisches Kulturzentrum Saarbrücken',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/saarbruecken/islamisches-kulturzentrum-saarbruecken',
      expectedRtl: false,
      requiredTexts: ['Arndtstraße 14', '66121'],
      forbiddenTexts: ['123123456123456', '+49 123123456123456'],
    },
    // 5. Detail page 2: Masjid Al Noor
    {
      path: '/de/moschee/saarbruecken/masjid-al-noor',
      expectedStatus: 200,
      expectedTitleSub: 'Masjid Al Noor',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/saarbruecken/masjid-al-noor',
      expectedRtl: false,
      requiredTexts: ['Jakobstraße 2', '66115'],
      forbiddenTexts: ['Pakistan Islamic Centre Saarbrucken'],
    },
    // 6. Detail page 3: Ditib Saarbrücken Merkez Cami
    {
      path: '/de/moschee/saarbruecken/ditib-saarbruecken-merkez-cami',
      expectedStatus: 200,
      expectedTitleSub: 'Ditib Saarbrücken Merkez Cami',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/saarbruecken/ditib-saarbruecken-merkez-cami',
      expectedRtl: false,
      requiredTexts: ['Goebenstraße 38', '66117'],
    },
    // 7. Arabic detail page: Masjid Al Noor
    {
      path: '/ar/mosque/saarbruecken/masjid-al-noor',
      expectedStatus: 200,
      expectedCanonical: 'https://moscheeindernaehe.de/ar/mosque/saarbruecken/masjid-al-noor',
      expectedRtl: true,
      requiredTexts: ['Jakobstraße 2', '66115'],
    },
    // 8. Excluded REJECT record: Pakistan Islamic Centre Saarbrucken -> 404
    {
      path: '/de/moschee/saarbruecken/pakistan-islamic-centre-saarbrucken',
      expectedStatus: 404,
    },
    // 9. Excluded Aachen HOLD record -> 404
    {
      path: '/de/moschee/aachen/masjid-as-sunnah',
      expectedStatus: 404,
    },
    // 10. Excluded Aachen REJECT record -> 404
    {
      path: '/de/moschee/aachen/minaret-aachen-central-mosque-ditib-yunus-emre-moschee-aachen',
      expectedStatus: 404,
    },
    // 11. Valid Aachen city page
    {
      path: '/de/moscheen/aachen',
      expectedStatus: 200,
      expectedTitleSub: 'Aachen',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moscheen/aachen',
      expectedRtl: false,
      requiredTexts: ['Aachen', 'Islamic Center Bilal Mosque'],
    },
    // 12. Valid Lübeck city page
    {
      path: '/de/moscheen/luebeck',
      expectedStatus: 200,
      expectedTitleSub: 'Lübeck',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moscheen/luebeck',
      expectedRtl: false,
      requiredTexts: ['Lübeck', 'Assalam Mosque'],
    },
    // 13. Unpublished candidate city route: Mainz -> 404
    {
      path: '/de/moscheen/mainz',
      expectedStatus: 404,
    },
    // 14. Unpublished candidate city route: Bielefeld -> 404
    {
      path: '/en/mosques/bielefeld',
      expectedStatus: 404,
    },
    // 15. Unpublished candidate city route: Freiburg -> 404
    {
      path: '/ar/mosques/freiburg',
      expectedStatus: 404,
    },
  ];

  console.log('--- STARTING PHASE 13B HTTP ROUTE SMOKE TESTS ---');

  for (const tc of testCases) {
    try {
      const { status, body } = await fetchUrl(PORT, tc.path);
      const passedStatus = status === tc.expectedStatus;

      if (!passedStatus) {
        console.error(`❌ [FAIL STATUS] ${tc.path} - Expected ${tc.expectedStatus}, got ${status}`);
        hasErrors = true;
        continue;
      }

      if (tc.expectedStatus === 200) {
        // Check Title
        if (tc.expectedTitleSub) {
          const titleMatch = /<title>(.*?)<\/title>/i.exec(body);
          const title = titleMatch ? titleMatch[1] : '';
          if (!title.includes(tc.expectedTitleSub)) {
            console.error(`❌ [FAIL TITLE] ${tc.path} - Expected title to contain "${tc.expectedTitleSub}", got "${title}"`);
            hasErrors = true;
          }
        }

        // Check Canonical
        if (tc.expectedCanonical) {
          const canonicalMatch = /<link\s+rel="canonical"\s+href="([^"]+)"/i.exec(body);
          const canonical = canonicalMatch ? canonicalMatch[1] : '';
          if (canonical !== tc.expectedCanonical) {
            console.error(`❌ [FAIL CANONICAL] ${tc.path} - Expected canonical "${tc.expectedCanonical}", got "${canonical}"`);
            hasErrors = true;
          }
        }

        // Check RTL
        if (tc.expectedRtl !== undefined) {
          const dirRtl = body.includes('dir="rtl"');
          if (dirRtl !== tc.expectedRtl) {
            console.error(`❌ [FAIL RTL] ${tc.path} - Expected RTL: ${tc.expectedRtl}, got: ${dirRtl}`);
            hasErrors = true;
          }
        }

        // Check Required Texts
        if (tc.requiredTexts) {
          for (const req of tc.requiredTexts) {
            if (!body.includes(req)) {
              console.error(`❌ [FAIL REQUIRED TEXT] ${tc.path} - Missing required text: "${req}"`);
              hasErrors = true;
            }
          }
        }

        // Check Forbidden Texts
        if (tc.forbiddenTexts) {
          for (const forb of tc.forbiddenTexts) {
            if (body.includes(forb)) {
              console.error(`❌ [FAIL FORBIDDEN TEXT] ${tc.path} - Contains forbidden text: "${forb}"`);
              hasErrors = true;
            }
          }
        }

        // Check JSON-LD
        const jsonLdChunks = parseJsonLd(body);
        if (jsonLdChunks.length === 0) {
          console.error(`❌ [FAIL JSON-LD] ${tc.path} - Missing JSON-LD script tags`);
          hasErrors = true;
        } else {
          for (const chunk of jsonLdChunks) {
            const str = JSON.stringify(chunk);
            if (str.includes('moscheeatlas.de')) {
              console.error(`❌ [FAIL JSON-LD LEGACY DOMAIN] ${tc.path} contains moscheeatlas.de in JSON-LD`);
              hasErrors = true;
            }
            if (tc.forbiddenTexts) {
              for (const forb of tc.forbiddenTexts) {
                if (str.includes(forb)) {
                  console.error(`❌ [FAIL JSON-LD FORBIDDEN] ${tc.path} contains forbidden text "${forb}" in JSON-LD`);
                  hasErrors = true;
                }
              }
            }
          }
        }
      }

      console.log(`✅ [PASS] ${tc.path} (HTTP ${status})`);
    } catch (err: any) {
      console.error(`❌ [ERROR] ${tc.path}: ${err.message}`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error('\n❌ Smoke tests finished with ERRORS!');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL 15 HTTP ROUTE SMOKE TESTS PASSED PERFECTLY!');
  }
}

probe();
