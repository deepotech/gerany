/**
 * Centralized Application & SEO Site Configuration
 * Supports environment variable overrides with fallback to canonical production domain.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://moscheeatlas.de';

export const SITE_NAME = 'MoscheeAtlas.de';
export const SITE_CODENAME = 'Germany Mosque Finder';
