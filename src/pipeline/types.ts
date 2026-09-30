import { z } from 'zod';

export interface RawGooglePlaceRecord {
  title?: string;
  address?: string;
  categoryName?: string;
  categories?: string[];
  city?: string | null;
  state?: string | null;
  countryCode?: string;
  postalCode?: string | null;
  street?: string | null;
  location?: {
    lat?: number;
    lng?: number;
  };
  phone?: string | null;
  website?: string | null;
  placeId?: string | null;
  cid?: string | null;
  url?: string | null;
  description?: string | null;
  openingHours?: Array<{ day: string; hours: string }>;
  additionalInfo?: Record<string, Array<Record<string, boolean>>>;
  reviewsCount?: number;
  rating?: number;
  totalScore?: number;
  reviewsDistribution?: {
    oneStar: number;
    twoStar: number;
    threeStar: number;
    fourStar: number;
    fiveStar: number;
  };
  imageUrl?: string | null;
  imageUrls?: string[];
}

export type MosqueCategory =
  | 'MOSQUE'
  | 'ISLAMIC_CENTER'
  | 'RELIGIOUS_ORGANIZATION'
  | 'PRAYER_ROOM'
  | 'COMMUNITY_CENTER'
  | 'OTHER';

export type DataStatus = 'RAW' | 'NORMALIZED' | 'REVIEWED' | 'PUBLISHED' | 'REJECTED';
export type VerificationStatus = 'UNVERIFIED' | 'COMMUNITY_VERIFIED' | 'OFFICIALLY_VERIFIED';

export interface MosqueFacilities {
  parking: boolean | null;
  womenArea: boolean | null;
  wheelchairAccessible: boolean | null;
  restroom: boolean | null;
  wudu: boolean | null;
  other?: string | null;
}

export interface MosqueTranslation {
  locale: 'de' | 'en' | 'ar';
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
}

export interface MosqueEntity {
  id: string;
  canonicalName: string;
  slug: string;
  address: string;
  street: string | null;
  postalCode: string;
  city: string;
  district: string | null;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  mapsUrl: string | null;
  placeId: string | null;
  category: MosqueCategory;
  organization: string | null;
  description: string | null;
  openingHours: Array<{ day: string; hours: string }> | null;
  rating: number | null;
  reviewCount: number;
  imageUrl: string | null;
  dataStatus: DataStatus;
  verificationStatus: VerificationStatus;
  source: string;
  lastVerified: string | null;
  facilities: MosqueFacilities;
  translations: Record<'de' | 'en' | 'ar', MosqueTranslation>;
  createdAt: string;
  updatedAt: string;
  sourceProvenance?: SourceProvenance | null;
  rawValues?: {
    name?: string | null;
    address?: string | null;
    phone?: string | null;
    website?: string | null;
  } | null;
  rejectionReason?: string | null;
  reviewReason?: string | null;
}

export interface SourceProvenance {
  name: string;
  type: string;
  url?: string | null;
  externalId?: string | null;
  importedAt: string;
  license?: string | null;
}

export interface DuplicateEvidence {
  nameSimilarity: number;
  addressMatch: boolean;
  phoneMatch: boolean;
  distanceMeters: number;
  explanation: string;
}

export interface DuplicateCandidate {
  primaryId: string;
  primaryName: string;
  duplicateId: string;
  duplicateName: string;
  reason:
    | 'EXACT_PLACE_ID'
    | 'EXACT_COORDINATES_AND_NAME'
    | 'SAME_ADDRESS_DIFFERENT_ORG'
    | 'NAME_PROXIMITY_MATCH'
    | 'PHONE_MATCH'
    | 'FUZZY_CANDIDATE';
  distanceMeters?: number;
  address: string;
  actionTaken: 'MERGED' | 'FLAGGED_CO_LOCATED' | 'FLAGGED_FOR_REVIEW' | 'IGNORED';
  similarityScore?: number;
  evidence?: DuplicateEvidence;
}

export interface QualityGateResult {
  gate: string;
  passed: boolean;
  reason?: string;
}

export interface EntityChange {
  id: string;
  name: string;
  city: string;
  changeType: 'ADDED' | 'REMOVED' | 'UPDATED' | 'UNCHANGED';
  fieldChanges?: Array<{ field: string; oldValue: any; newValue: any }>;
}

export interface ChangeReport {
  timestamp: string;
  totalExisting: number;
  totalIncoming: number;
  addedCount: number;
  removedCount: number;
  updatedCount: number;
  unchangedCount: number;
  changes: EntityChange[];
}

export interface DataQualityReport {
  timestamp: string;
  totalRawRecords: number;
  normalizedRecords: number;
  publishableRecords: number;
  reviewedRecords: number;
  rejectedRecords: number;
  validCoordinatesCount: number;
  missingWebsiteCount: number;
  missingPhoneCount: number;
  missingHoursCount: number;
  categoriesBreakdown: Record<string, number>;
  districtsBreakdown: Record<string, number>;
  duplicateCandidates: DuplicateCandidate[];
}

