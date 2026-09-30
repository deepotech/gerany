import { RawGooglePlaceRecord, MosqueCategory, DataStatus, VerificationStatus } from './types';

export interface ClassificationResult {
  category: MosqueCategory;
  dataStatus: DataStatus;
  verificationStatus: VerificationStatus;
  reason: string;
}

const SPAM_OR_PRANK_PATTERNS = [
  /pastel-ghost/i,
  /fake/i,
  /test/i,
  /spam/i,
];

const EXPLICIT_MOSQUE_INDICATORS = [
  /moschee/i,
  /mosque/i,
  /camii/i,
  /jami/i,
  /masjid/i,
  /mescid/i,
  /مسجد/i,
  /جامع/i,
  /ansarullah/i,
  /fatih/i,
  /eyüp-sultan/i,
  /ömerül/i,
  /mevlana/i,
  /\bbait/i,      // Phase 2A: AMJ mosque names (Baitun Nasr, Baitus Sabuh…)
  /\bbayt/i,
];

const MOSQUE_NAME_INDICATORS = [
  ...EXPLICIT_MOSQUE_INDICATORS,
  /islamisch/i,   // e.g. "Islamisches Zentrum Berlin"
  /islami\b/i,    // e.g. "Islamic Center"
];

/** Google Maps category names that definitively indicate non-mosque entities */
const NON_MOSQUE_CATEGORIES = new Set([
  'funeral home',
  'charity',
  'association / organization',
  'association or organization',
]);

const ADMIN_OR_ORG_INDICATORS = [
  /zentrale/i,
  /verbandszentrale/i,
  /hauptsitz/i,
  /headquarters/i,
  /verwaltung/i,
];

export function classifyRecord(raw: RawGooglePlaceRecord): ClassificationResult {
  const title = (raw.title || '').trim();
  const rawCat = (raw.categoryName || (raw.categories && raw.categories[0]) || '').toLowerCase();
  const hasContactOrHours = Boolean(raw.phone || raw.website || (raw.openingHours && raw.openingHours.length > 0));

  // 1. Check for spam or prank
  for (const pattern of SPAM_OR_PRANK_PATTERNS) {
    if (pattern.test(title)) {
      return {
        category: 'OTHER',
        dataStatus: 'REJECTED',
        verificationStatus: 'UNVERIFIED',
        reason: 'Detected spam, prank, or suspicious title pattern',
      };
    }
  }

  // 2a. Definitively non-mosque Google Maps categories (Funeral Home, Charity, Association/Organization)
  if (
    NON_MOSQUE_CATEGORIES.has(rawCat) &&
    !EXPLICIT_MOSQUE_INDICATORS.some((p) => p.test(title))
  ) {
    return {
      category: 'OTHER',
      dataStatus: 'REJECTED',
      verificationStatus: 'UNVERIFIED',
      reason: `Google Maps category "${rawCat}" is not a mosque or prayer facility; no mosque indicator found in title`,
    };
  }

  // 2b. Pure Non-Religious Club / Social Club
  if (
    rawCat === 'club' ||
    (!rawCat.includes('mosque') &&
      !rawCat.includes('religious') &&
      title.toLowerCase().includes('kulturverein') &&
      !MOSQUE_NAME_INDICATORS.some((p) => p.test(title)))
  ) {
    return {
      category: 'COMMUNITY_CENTER',
      dataStatus: 'REJECTED',
      verificationStatus: 'UNVERIFIED',
      reason: 'Entity is a social/cultural club without confirmed prayer facilities',
    };
  }

  // 3. Low quality / Thin placeholder / Zero data (e.g. 0 reviews, no phone, no web, no hours)
  if (title.toLowerCase() === 'mosque' || title.toLowerCase() === 'moschee') {
    return {
      category: 'MOSQUE',
      dataStatus: 'REVIEWED',
      verificationStatus: 'UNVERIFIED',
      reason: 'Low quality: Generic placeholder title without specific congregation name',
    };
  }

  if ((raw.reviewsCount === 0 || raw.reviewsCount === null) && !hasContactOrHours && Boolean(raw.address)) {
    return {
      category: 'MOSQUE',
      dataStatus: 'REVIEWED',
      verificationStatus: 'UNVERIFIED',
      reason: 'Thin record: Zero reviews, no phone, no website, and no opening hours; held in review queue to avoid thin page indexing',
    };
  }

  // 4. Verbandszentrale / Headquarters
  if (ADMIN_OR_ORG_INDICATORS.some((p) => p.test(title))) {
    return {
      category: 'RELIGIOUS_ORGANIZATION',
      dataStatus: 'REVIEWED',
      verificationStatus: 'UNVERIFIED',
      reason: 'Administrative association headquarters; requires verification of public prayer space',
    };
  }

  // 5. Generic Educational / Cultural Associations without explicit mosque designation
  if (
    title.toLowerCase().includes('integration and educational') ||
    title.toLowerCase().includes('bildungs- und kulturverein') ||
    title.toLowerCase().startsWith('ibv ') ||
    title.toLowerCase() === 'kulturzentrum köln e.v.'
  ) {
    return {
      category: 'COMMUNITY_CENTER',
      dataStatus: 'REVIEWED',
      verificationStatus: 'UNVERIFIED',
      reason: 'Association/community center; requires manual confirmation of regular congregational prayer facilities',
    };
  }

  // 6. Explicit Religious organization
  if (rawCat.includes('religious organization') || title.includes('الإتحاد الإسلامي')) {
    if (MOSQUE_NAME_INDICATORS.some((p) => p.test(title))) {
      return {
        category: 'MOSQUE',
        dataStatus: 'PUBLISHED',
        verificationStatus: 'UNVERIFIED',
        reason: 'Religious organization operating as established mosque',
      };
    }
    return {
      category: 'RELIGIOUS_ORGANIZATION',
      dataStatus: 'REVIEWED',
      verificationStatus: 'UNVERIFIED',
      reason: 'Religious organization entity; holds non-daily or restricted prayer sessions',
    };
  }

  // 7. Islamic Center with confirmed prayers
  if (
    title.toLowerCase().includes('zentrum') ||
    title.toLowerCase().includes('center') ||
    title.toLowerCase().includes('gemeinde')
  ) {
    const isMosqueName = MOSQUE_NAME_INDICATORS.some((p) => p.test(title));
    return {
      category: isMosqueName ? 'MOSQUE' : 'ISLAMIC_CENTER',
      dataStatus: 'PUBLISHED',
      verificationStatus: 'UNVERIFIED',
      reason: 'Active Islamic center / congregation with confirmed prayer facilities',
    };
  }

  // 8. Standard Mosque
  if (rawCat.includes('mosque') || MOSQUE_NAME_INDICATORS.some((p) => p.test(title))) {
    return {
      category: 'MOSQUE',
      dataStatus: 'PUBLISHED',
      verificationStatus: 'UNVERIFIED',
      reason: 'Identified local mosque entity',
    };
  }

  return {
    category: 'OTHER',
    dataStatus: 'REVIEWED',
    verificationStatus: 'UNVERIFIED',
    reason: 'Unclear classification; requires manual review',
  };
}
