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

async function fetchUrl(port: number, path: string): Promise<{ status: number; body: string }> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      headers: { 'Accept': 'text/html' }
    });
    const body = await res.text();
    return { status: res.status, body };
  } catch (err: any) {
    const res = await fetch(`http://localhost:${port}${path}`, {
      headers: { 'Accept': 'text/html' }
    });
    const body = await res.text();
    return { status: res.status, body };
  }
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
  const PORT = 3009;
  let hasErrors = false;

  const testCases: RouteTest[] = [
    // 1. German Lübeck city page
    {
      path: '/de/moscheen/luebeck',
      expectedStatus: 200,
      expectedTitleSub: 'Lübeck',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moscheen/luebeck',
      expectedRtl: false,
      requiredTexts: ['Lübeck', 'Assalam Mosque', 'Bait-ul-Afiyat Moschee'],
    },
    // 2. English Lübeck city page
    {
      path: '/en/mosques/luebeck',
      expectedStatus: 200,
      expectedTitleSub: 'Luebeck',
      expectedCanonical: 'https://moscheeindernaehe.de/en/mosques/luebeck',
      expectedRtl: false,
      requiredTexts: ['Lübeck', 'Assalam Mosque'],
    },
    // 3. Arabic Lübeck city page and RTL
    {
      path: '/ar/mosques/luebeck',
      expectedStatus: 200,
      expectedTitleSub: 'لوبيك',
      expectedCanonical: 'https://moscheeindernaehe.de/ar/mosques/luebeck',
      expectedRtl: true,
      requiredTexts: ['لوبيك', 'مساجد'],
    },
    // 4. Detail page 1 (Assalam Mosque in Lübeck)
    {
      path: '/de/moschee/luebeck/assalam-mosque',
      expectedStatus: 200,
      expectedTitleSub: 'Assalam Mosque',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/luebeck/assalam-mosque',
      expectedRtl: false,
      requiredTexts: ['Assalam Mosque', '23558', 'Dornestraße 56-58'],
    },
    // 5. Detail page 2 (Bait-ul-Afiyat Moschee in Lübeck)
    {
      path: '/de/moschee/luebeck/bait-ul-afiyat-moschee',
      expectedStatus: 200,
      expectedTitleSub: 'Bait-ul-Afiyat Moschee',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/luebeck/bait-ul-afiyat-moschee',
      expectedRtl: false,
      requiredTexts: ['Kaninchenborn 4a', '23560'],
    },
    // 6. Arabic detail page (Assalam Mosque in Lübeck)
    {
      path: '/ar/mosque/luebeck/assalam-mosque',
      expectedStatus: 200,
      expectedCanonical: 'https://moscheeindernaehe.de/ar/mosque/luebeck/assalam-mosque',
      expectedRtl: true,
      requiredTexts: ['Dornestraße 56-58', '23558'],
    },
    // 7. Valid published city outside Lübeck (Wiesbaden)
    {
      path: '/de/moscheen/wiesbaden',
      expectedStatus: 200,
      expectedTitleSub: 'Wiesbaden',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moscheen/wiesbaden',
      expectedRtl: false,
      requiredTexts: ['Wiesbaden', 'Ayasofya Cami'],
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
    // 10. Unpublished candidate city route (Aachen)
    {
      path: '/de/moscheen/aachen',
      expectedStatus: 404,
    },
  ];

  console.log('--- STARTING PHASE 11B HTTP ROUTE SMOKE TESTS ---');

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
          const isRtl = /dir="rtl"/i.test(body);
          if (isRtl !== tc.expectedRtl) {
            console.error(`❌ [FAIL RTL] ${tc.path} - Expected RTL=${tc.expectedRtl}, got dir="rtl"=${isRtl}`);
            hasErrors = true;
          }
        }

        // Check Required Texts
        if (tc.requiredTexts) {
          for (const req of tc.requiredTexts) {
            if (!body.includes(req)) {
              console.error(`❌ [FAIL REQUIRED TEXT] ${tc.path} - Missing text: "${req}"`);
              hasErrors = true;
            }
          }
        }

        // Check Forbidden Texts
        if (tc.forbiddenTexts) {
          for (const forb of tc.forbiddenTexts) {
            if (body.includes(forb)) {
              console.error(`❌ [FAIL FORBIDDEN TEXT] ${tc.path} - Found forbidden text: "${forb}"`);
              hasErrors = true;
            }
          }
        }

        // Check JSON-LD validity
        const jsonLdChunks = parseJsonLd(body);
        if (tc.path.includes('/moschee/') || tc.path.includes('/mosque/')) {
          const hasPlaceOrOrg = jsonLdChunks.some((item) =>
            item['@type'] === 'Place' || item['@type'] === 'Mosque' || item['@type'] === 'CivicStructure' || item['@type'] === 'Organization'
          );
          if (!hasPlaceOrOrg && jsonLdChunks.length === 0) {
            console.warn(`⚠️ [WARN JSON-LD] ${tc.path} - No Place/CivicStructure schema found in ${jsonLdChunks.length} chunks`);
          }
        }
      }

      console.log(`✅ [PASS] ${tc.path} -> ${status} OK`);
    } catch (e: any) {
      console.error(`❌ [EXCEPTION] ${tc.path}: ${e.message}`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error('\n❌ Smoke tests failed with errors!');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL 10 LOCAL ROUTE SMOKE TESTS PASSED PERFECTLY!');
  }
}

probe();
