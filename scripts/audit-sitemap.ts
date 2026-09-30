import sitemap from '../src/app/sitemap';

async function auditSitemap() {
  console.log('Generating sitemap...');
  const entries = await sitemap();
  console.log(`Generated ${entries.length} entries.`);

  const seenUrls = new Set<string>();
  const duplicateUrls: string[] = [];
  const invalidUrls: string[] = [];
  const adminUrls: string[] = [];
  const nonHttpsUrls: string[] = [];

  for (const entry of entries) {
    if (seenUrls.has(entry.url)) {
      duplicateUrls.push(entry.url);
    }
    seenUrls.add(entry.url);

    if (!entry.url.startsWith('https://')) {
      nonHttpsUrls.push(entry.url);
    }

    if (entry.url.includes('/admin')) {
      adminUrls.push(entry.url);
    }

    try {
      new URL(entry.url);
    } catch {
      invalidUrls.push(entry.url);
    }
  }

  console.log('\n--- Sitemap Audit Results ---');
  console.log('Total entries:', entries.length);
  console.log('Unique entries:', seenUrls.size);
  console.log('Duplicates:', duplicateUrls.length);
  console.log('Invalid URLs:', invalidUrls.length);
  console.log('Admin URLs:', adminUrls.length);
  console.log('Non-HTTPS URLs:', nonHttpsUrls.length);

  if (duplicateUrls.length > 0) {
    console.error('DUPLICATES FOUND:', duplicateUrls.slice(0, 10));
    process.exit(1);
  }

  if (adminUrls.length > 0) {
    console.error('ADMIN URLS FOUND IN SITEMAP:', adminUrls);
    process.exit(1);
  }

  console.log('Sitemap validation PASSED!');
}

auditSitemap().catch((err) => {
  console.error('Sitemap audit failed:', err);
  process.exit(1);
});
