import type { Metadata } from 'next';
import { SITE_URL, SITE_NAME } from '@/lib/config';

export interface ConstructMetadataOptions {
  title: string;
  description: string;
  canonical?: string;
  languages?: Record<string, string>;
  noIndex?: boolean;
  noFollow?: boolean;
  ogImage?: string;
  ogType?: 'website' | 'article';
  locale?: string;
}

/**
 * Shared SEO Metadata Constructor for MoscheeAtlas Germany.
 *
 * Implements:
 * 1. Brand suffix deduplication (prevents "Title | MoscheeAtlas | MoscheeAtlas")
 * 2. Deterministic canonical and reciprocal hreflang alternates
 * 3. OpenGraph and Twitter card configuration
 * 4. Robots directives with max-image-preview: large for eligible pages
 * 5. Independent noindex/nofollow support for utility or sparse pages
 */
export function constructMetadata({
  title,
  description,
  canonical,
  languages,
  noIndex = false,
  noFollow = false,
  ogImage = '/og-default.jpg',
  ogType = 'website',
  locale = 'de',
}: ConstructMetadataOptions): Metadata {
  // Relative canonical paths match Next.js metadataBase; OpenGraph requires absolute URLs
  const canonicalPath = canonical || `/${locale}`;
  const absoluteUrl = canonicalPath.startsWith('http')
    ? canonicalPath
    : `${SITE_URL}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}`;

  // Clean trailing brand suffix if already present to guarantee exactly one brand suffix
  let cleanTitle = title.trim();
  const brandSuffixes = [
    ` | ${SITE_NAME}`,
    ` – ${SITE_NAME}`,
    ` - ${SITE_NAME}`,
  ];
  for (const suffix of brandSuffixes) {
    if (cleanTitle.endsWith(suffix)) {
      cleanTitle = cleanTitle.slice(0, -suffix.length).trim();
    }
  }

  const ogLocale = locale === 'ar' ? 'ar_AR' : locale === 'en' ? 'en_US' : 'de_DE';
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`;

  const metadata: Metadata = {
    title: cleanTitle,
    description,
    alternates: {
      canonical: canonicalPath,
      ...(languages ? { languages } : {}),
    },
    robots: noIndex
      ? { index: false, follow: !noFollow }
      : { index: true, follow: true, 'max-image-preview': 'large' },
    openGraph: {
      title: `${cleanTitle} | ${SITE_NAME}`,
      description,
      url: absoluteUrl,
      siteName: SITE_NAME,
      locale: ogLocale,
      type: ogType,
      images: [
        {
          url: fullOgImage,
          width: 1200,
          height: 630,
          alt: cleanTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${cleanTitle} | ${SITE_NAME}`,
      description,
      images: [fullOgImage],
    },
  };

  return metadata;
}
