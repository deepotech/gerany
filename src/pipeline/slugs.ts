// Slug generation with Arabic strategy, transliteration, and per-city uniqueness scoping

const ARABIC_TRANSLITERATION: Record<string, string> = {
  'ا': 'a', 'أ': 'a', 'إ': 'i', 'آ': 'aa',
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j',
  'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'dh',
  'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z',
  'ع': 'a', 'غ': 'gh', 'ف': 'f', 'ق': 'q',
  'ك': 'k', 'ل': 'l', 'm': 'm', 'م': 'm',
  'ن': 'n', 'ه': 'h', 'و': 'w', 'ي': 'y',
  'ى': 'a', 'ة': 'ah', 'ء': '', 'ئ': 'e', 'ؤ': 'o',
};

export function transliterateArabic(text: string): string {
  let result = '';
  for (const char of text) {
    result += ARABIC_TRANSLITERATION[char] !== undefined ? ARABIC_TRANSLITERATION[char] : char;
  }
  return result;
}

export function generateCanonicalSlug(title: string, district?: string | null): string {
  let str = title.trim();

  // 1. If title contains both Arabic and Latin (e.g. "مسجد التوحيد كولن Al Tauhid Moschee köln")
  // Prefer the Latin portion for clean cross-locale URLs
  const latinMatch = str.match(/[a-zA-ZäöüÄÖÜß\s\-0-9]+/g);
  const latinText = latinMatch ? latinMatch.join(' ').trim() : '';

  if (latinText.length >= 4) {
    str = latinText;
  } else {
    // Pure Arabic: transliterate
    str = transliterateArabic(str);
  }

  // 2. Transliterate German umlauts
  str = str
    .replace(/ä/gi, 'ae')
    .replace(/ö/gi, 'oe')
    .replace(/ü/gi, 'ue')
    .replace(/ß/g, 'ss');

  // 3. Lowercase and replace symbols
  str = str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  // 4. Remove redundant repetitive tokens
  str = str.replace(/-e-v\b/g, '').replace(/-ev\b/g, '');

  if (!str || str.length < 2) {
    str = 'moschee';
  }

  return str;
}

/**
 * Ensures unique slugs scoped per city (allowing identical slugs across different cities).
 * When a collision occurs within the SAME city, appends district or incremental suffix deterministically.
 */
export function ensureUniqueSlugs(
  items: Array<{ title: string; district?: string | null; city?: string | null; placeId?: string | null }>
): string[] {
  const seenPerCity = new Map<string, number>();

  return items.map((item) => {
    const cityKey = (item.city || 'default').toLowerCase().trim();
    let slug = generateCanonicalSlug(item.title, item.district);
    const compoundKey = `${cityKey}:${slug}`;

    if (seenPerCity.has(compoundKey)) {
      const count = seenPerCity.get(compoundKey)! + 1;
      seenPerCity.set(compoundKey, count);
      // Append district or incremental counter
      if (item.district) {
        const districtSlug = generateCanonicalSlug(item.district);
        slug = `${slug}-${districtSlug}`;
      } else {
        slug = `${slug}-${count}`;
      }
    } else {
      seenPerCity.set(compoundKey, 1);
    }
    return slug;
  });
}
