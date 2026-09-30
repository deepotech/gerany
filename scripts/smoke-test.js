const http = require('http');

const urls = [
  '/',
  '/de',
  '/en',
  '/ar',
  '/de/moscheen',
  '/en/mosques',
  '/ar/mosques',
  '/de/moscheen/berlin',
  '/en/mosques/berlin',
  '/ar/mosques/berlin',
  '/de/moscheen/hamburg',
  '/de/moscheen/muenchen',
  '/en/mosques/munich',
  '/de/moscheen/frankfurt',
  '/de/moscheen/dortmund',
  '/de/moscheen/koeln',
  '/en/mosques/cologne',
  '/ar/mosques/koeln',
  '/de/moscheen/stuttgart',
  '/de/moscheen/duesseldorf',
  '/de/moscheen/essen',
  '/de/moscheen/bremen',
  '/de/moscheen/wuppertal',
  '/de/moscheen/bonn',
  '/de/moscheen/nuernberg',
  '/de/moscheen/leipzig',
  '/de/moschee/berlin/lubars-mosque',
  '/en/mosque/berlin/lubars-mosque',
  '/ar/mosque/berlin/lubars-mosque',
  '/robots.txt',
  '/sitemap.xml',
  '/de/moscheen/hannover', // unpromoted candidate city -> must 404
  '/non-existent-path-for-404-test',
];

async function check(url) {
  return new Promise((resolve) => {
    http.get('http://localhost:3000' + url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const hasAdmin = data.includes('/de/admin') || data.includes('/en/admin') || data.includes('/ar/admin');
        const hasCanonical = data.includes('rel="canonical"') || url === '/' || url === '/robots.txt' || url === '/sitemap.xml';
        resolve({ url, status: res.statusCode, hasAdmin, hasCanonical, len: data.length });
      });
    }).on('error', (err) => {
      resolve({ url, status: 'ERROR: ' + err.message });
    });
  });
}

(async () => {
  console.log('Starting HTTP Smoke Tests on localhost:3000...');
  let allPass = true;
  for (const u of urls) {
    const res = await check(u);
    const expected404 = res.url.includes('non-existent') || res.url.includes('hannover');
    const pass = expected404
      ? res.status === 404 && !res.hasAdmin
      : (res.status === 200 || res.status === 307 || res.status === 308) && !res.hasAdmin;
    if (!pass) allPass = false;
    console.log(pass ? '✅ PASS' : '❌ FAIL', res.url, 'status:', res.status, 'hasAdminLink:', res.hasAdmin, 'size:', res.len);
  }
  if (!allPass) {
    console.error('Some smoke tests failed.');
    process.exit(1);
  } else {
    console.log('All HTTP smoke tests passed!');
  }
})();
