/**
 * Shared German phonetic normalization utility.
 *
 * Used by both:
 *   - Server-side: src/lib/db/json-repository.ts (search filters)
 *   - Client-side: src/components/SearchClient.tsx (live search)
 *
 * Handles:
 *   - German umlauts: ö→o, ü→u, ä→a
 *   - Common transliterations: oe↔ö, ue↔ü, ae↔ä
 *   - ß→ss
 *   - Lowercase + whitespace normalization
 */
export function normalizeGermanPhonetic(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics: ö→o, ü→u, ä→a
    .replace(/oe/g, 'o')
    .replace(/ae/g, 'a')
    .replace(/ue/g, 'u')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
