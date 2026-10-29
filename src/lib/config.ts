/**
 * Centralized Application & SEO Site Configuration
 * Supports environment variable overrides with fallback to canonical production domain.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://moscheeindernaehe.de';

export const SITE_NAME = 'MoscheeAtlas';
export const SITE_DOMAIN = 'moscheeindernaehe.de';
export const SITE_CODENAME = 'Germany Mosque Finder';

/**
 * Google AdSense Configuration & Feature Gate
 * Default: DISABLED until an official Google-certified IAB TCF CMP is configured and verified.
 */
export const ADSENSE_PUBLISHER_ID = 'ca-pub-6331163447795368';
export const ENABLE_ADSENSE = process.env.NEXT_PUBLIC_ENABLE_ADSENSE === 'true';

