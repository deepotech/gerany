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
    // 1. German Aachen city page
    {
      path: '/de/moscheen/aachen',
      expectedStatus: 200,
      expectedTitleSub: 'Aachen',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moscheen/aachen',
      expectedRtl: false,
      requiredTexts: ['Aachen', 'Islamic Center Bilal Mosque', 'Aachen Central Mosque'],
      forbiddenTexts: ['Masjid As-Sunnah', 'Minaret Aachen Central Mosque Ditib'],
    },
    // 2. English Aachen city page
    {
      path: '/en/mosques/aachen',
      expectedStatus: 200,
      expectedTitleSub: 'Aachen',
      expectedCanonical: 'https://moscheeindernaehe.de/en/mosques/aachen',
      expectedRtl: false,
      requiredTexts: ['Aachen', 'Islamic Center Bilal Mosque'],
      forbiddenTexts: ['Masjid As-Sunnah'],
    },
    // 3. Arabic Aachen city page and RTL
    {
      path: '/ar/mosques/aachen',
      expectedStatus: 200,
      expectedTitleSub: 'آخن',
      expectedCanonical: 'https://moscheeindernaehe.de/ar/mosques/aachen',
      expectedRtl: true,
      requiredTexts: ['آخن', 'مساجد'],
    },
    // 4. Detail page 1 (Islamic Center Bilal Mosque in Aachen)
    {
      path: '/de/moschee/aachen/islamic-center-bilal-mosque',
      expectedStatus: 200,
      expectedTitleSub: 'Islamic Center Bilal Mosque',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/aachen/islamic-center-bilal-mosque',
      expectedRtl: false,
      requiredTexts: ['Professor-Pirlet-Straße 20', '52074'],
    },
    // 5. Detail page 2 (Aachen Central Mosque)
    {
      path: '/de/moschee/aachen/aachen-central-mosque',
      expectedStatus: 200,
      expectedTitleSub: 'Aachen Central Mosque',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/aachen/aachen-central-mosque',
      expectedRtl: false,
      requiredTexts: ['Stolberger Str. 209', '52068'],
    },
    // 6. Arabic detail page (Al-Imam-Malik Moschee in Aachen)
    {
      path: '/ar/mosque/aachen/al-imam-malik-moschee',
      expectedStatus: 200,
      expectedCanonical: 'https://moscheeindernaehe.de/ar/mosque/aachen/al-imam-malik-moschee',
      expectedRtl: true,
      requiredTexts: ['Ottostraße 89', '52070'],
    },
    // 7. Excluded HOLD record (Masjid As-Sunnah) -> 404
    {
      path: '/de/moschee/aachen/masjid-as-sunnah',
      expectedStatus: 404,
    },
    // 8. Excluded REJECT record (Minaret Aachen Central Mosque Ditib) -> 404
    {
      path: '/de/moschee/aachen/minaret-aachen-central-mosque-ditib-yunus-emre-moschee-aachen',
      expectedStatus: 404,
    },
    // 9. Valid published city outside Aachen (Lübeck)
    {
      path: '/de/moscheen/luebeck',
      expectedStatus: 200,
      expectedTitleSub: 'Lübeck',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moscheen/luebeck',
      expectedRtl: false,
      requiredTexts: ['Lübeck', 'Assalam Mosque'],
    },
    // 10. Unpublished candidate city route (Mainz)
    {
      path: '/de/moscheen/mainz',
      expectedStatus: 404,
    },
    // 11. Unpublished candidate city route (Bielefeld)
    {
      path: '/en/mosques/bielefeld',
      expectedStatus: 404,
    },
  ];

  console.log('--- STARTING PHASE 12B HTTP ROUTE SMOKE TESTS ---');

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
    console.log('\n🎉 ALL 11 LOCAL ROUTE SMOKE TESTS PASSED PERFECTLY!');
  }
}

probe();
