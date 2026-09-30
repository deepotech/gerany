import { MetadataRoute } from 'next';
import { getMosqueRepository } from '@/lib/db';
import { getPublishedCityConfigs } from '@/pipeline/city-config';
import { SITE_URL } from '@/lib/config';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;
  const repo = getMosqueRepository();
  const mosques = await repo.getAllPublished();
  const cities = await repo.getCities();

  // Only index cities with at least 1 published entity
  const liveCities = cities.filter((c) => c.count >= 1);

  const entries: MetadataRoute.Sitemap = [];

  // 1. Homepages — 3 canonical URLs
  for (const locale of ['de', 'en', 'ar'] as const) {
    entries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    });
  }

  // 2. Search hub pages — canonical route per locale (NOT duplicated across locales)
  entries.push({
    url: `${baseUrl}/de/moscheen`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  });
  entries.push({
    url: `${baseUrl}/en/mosques`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  });
  entries.push({
    url: `${baseUrl}/ar/mosques`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  });

  // 3. City collection pages — ONLY for cities with published data
  for (const city of liveCities) {
    const config = getPublishedCityConfigs().find((c) => c.canonical === city.name);
    if (!config) continue; // Skip unknown cities not in our config

    const deSlug = config.slug;
    const enSlug = config.englishSlug;
    const arSlug = config.slug; // Arabic routes use Latin slug

    entries.push({
      url: `${baseUrl}/de/moscheen/${deSlug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    });
    entries.push({
      url: `${baseUrl}/en/mosques/${enSlug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    });
    entries.push({
      url: `${baseUrl}/ar/mosques/${arSlug}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    });
  }

  // 4. Mosque detail pages — ONLY PUBLISHED entities, once per locale
  for (const m of mosques) {
    const config = getPublishedCityConfigs().find((c) => c.canonical === m.city);
    if (!config) continue; // Skip entities from unknown/unconfigured cities

    const lastMod = m.updatedAt ? new Date(m.updatedAt) : new Date();

    // German: /de/moschee/[citySlug]/[slug]
    entries.push({
      url: `${baseUrl}/de/moschee/${config.slug}/${m.slug}`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    // English: /en/mosque/[englishSlug]/[slug]
    entries.push({
      url: `${baseUrl}/en/mosque/${config.englishSlug}/${m.slug}`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.8,
    });

    // Arabic: /ar/mosque/[citySlug]/[slug]
    entries.push({
      url: `${baseUrl}/ar/mosque/${config.slug}/${m.slug}`,
      lastModified: lastMod,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  return entries;
}
