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
    const cause = err.cause ? (err.cause.code || err.cause.message) : '';
    try {
      const res = await fetch(`http://localhost:${port}${path}`, {
        headers: { 'Accept': 'text/html' }
      });
      const body = await res.text();
      return { status: res.status, body };
    } catch (err2: any) {
      const cause2 = err2.cause ? (err2.cause.code || err2.cause.message) : '';
      throw new Error(`Connection failed: 127.0.0.1 (${err.message} cause=${cause}) and localhost (${err2.message} cause=${cause2})`);
    }
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
    // 5. Detail page 2 (Süleymaniye-Moschee in Wiesbaden)
    {
      path: '/de/moschee/wiesbaden/sueleymaniye-moschee',
      expectedStatus: 200,
      expectedTitleSub: 'Süleymaniye-Moschee',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/wiesbaden/sueleymaniye-moschee',
      expectedRtl: false,
      requiredTexts: ['Dotzheimer Str. 24-26', '65185'],
    },
    // 6. Detail page 3 (Wiesbaden Central Mosque - Omar Moschee)
    {
      path: '/de/moschee/wiesbaden/wiesbaden-central-mosque-2',
      expectedStatus: 200,
      expectedTitleSub: 'Wiesbaden Central Mosque',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/wiesbaden/wiesbaden-central-mosque-2',
      expectedRtl: false,
      requiredTexts: ['Henkellstraße 12', '65187'],
    },
    // 7. Valid published city outside Wiesbaden (Berlin)
    {
      path: '/de/moscheen/berlin',
      expectedStatus: 200,
      expectedTitleSub: 'Moscheen in Berlin',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moscheen/berlin',
      expectedRtl: false,
      requiredTexts: ['Berlin'],
    },
    // 8. Valid published mosque detail outside Wiesbaden
    {
      path: '/de/moschee/berlin/lubars-mosque',
      expectedStatus: 200,
      expectedTitleSub: 'Lubars Mosque',
      expectedCanonical: 'https://moscheeindernaehe.de/de/moschee/berlin/lubars-mosque',
      expectedRtl: false,
      requiredTexts: ['Berlin'],
    },
    // 9. Unpublished candidate city route (Mainz)
    {
      path: '/de/moscheen/mainz',
      expectedStatus: 404,
    },
    // 10. Unpublished candidate city route (Bielefeld)
    {
      path: '/en/mosques/bielefeld',
      expectedStatus: 404,
    },
    // 11. Excluded mosque route (Moschee Schierstein)
    {
      path: '/de/moschee/wiesbaden/moschee-schierstein',
      expectedStatus: 404,
    },
  ];

  console.log(`--- PROBING PRODUCTION SERVER ON PORT ${PORT} ---`);
  for (const tc of testCases) {
    try {
      const resp = await fetchUrl(PORT, tc.path);
      console.log(`\nROUTE: ${tc.path}`);
      console.log(`  Status Code: ${resp.status} (Expected: ${tc.expectedStatus})`);
      if (resp.status !== tc.expectedStatus) {
        console.error(`  ERROR: Status mismatch for ${tc.path}`);
        hasErrors = true;
      }

      if (tc.expectedStatus === 200) {
        const html = resp.body;

        // Title
        const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : '';
        console.log(`  Title: "${title}"`);
        if (tc.expectedTitleSub && !title.includes(tc.expectedTitleSub)) {
          console.error(`  ERROR: Missing title substring "${tc.expectedTitleSub}"`);
          hasErrors = true;
        }

        // Meta Description
        const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) ||
                          html.match(/<meta\s+content="([^"]*)"\s+name="description"/i);
        const desc = descMatch ? descMatch[1] : '';
        console.log(`  Meta Description: "${desc}"`);
        if (!desc) {
          console.error(`  ERROR: Missing meta description`);
          hasErrors = true;
        }

        // Canonical
        const canonMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/i) ||
                           html.match(/<link\s+href="([^"]*)"\s+rel="canonical"/i);
        const canonical = canonMatch ? canonMatch[1] : '';
        console.log(`  Canonical: "${canonical}"`);
        if (tc.expectedCanonical && canonical !== tc.expectedCanonical) {
          console.error(`  ERROR: Expected canonical "${tc.expectedCanonical}", got "${canonical}"`);
          hasErrors = true;
        }

        // Hreflang
        const hreflangs: Record<string, string> = {};
        const hrefRegex = /<link\s+rel="alternate"\s+hreflang="([^"]*)"\s+href="([^"]*)"/gi;
        let hm;
        while ((hm = hrefRegex.exec(html)) !== null) {
          hreflangs[hm[1]] = hm[2];
        }
        console.log(`  Hreflang alternates: ${JSON.stringify(hreflangs)}`);
        if (!hreflangs['de'] || !hreflangs['en'] || !hreflangs['ar'] || !hreflangs['x-default']) {
          console.error(`  ERROR: Incomplete hreflang alternates!`);
          hasErrors = true;
        }

        // RTL check
        if (tc.expectedRtl) {
          const hasRtl = html.includes('dir="rtl"');
          console.log(`  RTL dir="rtl" present: ${hasRtl}`);
          if (!hasRtl) {
            console.error(`  ERROR: Missing dir="rtl" on Arabic page!`);
            hasErrors = true;
          }
        }

        // JSON-LD
        const jsonLd = parseJsonLd(html);
        console.log(`  JSON-LD schemas count: ${jsonLd.length}`);
        for (const item of jsonLd) {
          console.log(`    - Type: ${item['@type']}, Name: ${item.name || item['@id'] || 'N/A'}`);
        }
        if (jsonLd.length === 0) {
          console.error(`  ERROR: No JSON-LD schema found!`);
          hasErrors = true;
        }

        // Required text
        if (tc.requiredTexts) {
          for (const reqText of tc.requiredTexts) {
            const found = html.includes(reqText);
            if (!found) {
              console.error(`  ERROR: Required text "${reqText}" not found in HTML`);
              hasErrors = true;
            }
          }
        }

        // Forbidden text
        if (tc.forbiddenTexts) {
          for (const fText of tc.forbiddenTexts) {
            const found = html.includes(fText);
            if (found) {
              console.error(`  ERROR: Forbidden text "${fText}" found in HTML`);
              hasErrors = true;
            }
          }
        }
      }
    } catch (e: any) {
      console.error(`  ERROR fetching ${tc.path}: ${e.message}`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error('\nPROBE FAILED: One or more route assertions failed.');
    process.exit(1);
  } else {
    console.log('\nALL ROUTE ASSERTIONS PASSED PERFECTLY!');
    process.exit(0);
  }
}

probe();
