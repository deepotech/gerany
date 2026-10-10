import { headers } from 'next/headers';
import crypto from 'crypto';

/**
 * Administrative Access Security Control
 * 
 * Strict fail-closed security:
 * - Requires ADMIN_SECRET or ADMIN_TOKEN in environment variables.
 * - Authenticates ONLY via secure HTTP headers (Authorization: Bearer <secret> or X-Admin-Key: <secret>).
 * - Query-string token (?token=...) authentication is strictly disallowed to prevent secret leakage
 *   in browser history, access logs, analytics, and HTTP Referer headers.
 * - Compares secrets using crypto.timingSafeEqual to prevent timing attacks.
 */
export function isAuthenticatedAdmin(): boolean {
  const configuredSecret = process.env.ADMIN_SECRET || process.env.ADMIN_TOKEN;

  // Fail closed: if no secret is configured, deny all admin access
  if (!configuredSecret || configuredSecret.trim().length === 0) {
    return false;
  }

  try {
    const headersList = headers();
    let providedSecret: string | null = null;

    const authHeader = headersList.get('authorization');
    if (authHeader) {
      const match = authHeader.match(/^Bearer\s+(.+)$/i);
      if (match) {
        providedSecret = match[1];
      }
    }

    if (!providedSecret) {
      const adminKeyHeader = headersList.get('x-admin-key');
      if (adminKeyHeader) {
        providedSecret = adminKeyHeader;
      }
    }

    if (!providedSecret) {
      return false;
    }

    const providedBuf = Buffer.from(providedSecret, 'utf8');
    const configuredBuf = Buffer.from(configuredSecret, 'utf8');

    if (providedBuf.length !== configuredBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(providedBuf, configuredBuf);
  } catch {
    // Outside request context / during static generation -> fail closed
    return false;
  }
}
