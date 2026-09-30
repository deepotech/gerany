import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_URL;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/*/admin',
          '/admin',
          '/api/',
          '/*?*query=',
          '/*?*district=',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
