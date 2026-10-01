/**
 * Centralized Application & SEO Site Configuration
 * Supports environment variable overrides with fallback to canonical production domain.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://moscheeindernaehe.de';

export const SITE_NAME = 'MoscheeAtlas';
export const SITE_DOMAIN = 'moscheeindernaehe.de';
export const SITE_CODENAME = 'Germany Mosque Finder';
