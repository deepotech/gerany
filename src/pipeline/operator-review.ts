import { MosqueEntity, MosqueCategory, DataStatus, VerificationStatus, SourceProvenance } from './types';

export interface ReviewItem {
  id: string;
  placeId: string | null;
  name: string;
  city: string;
  address: string;
  street: string | null;
  postalCode: string;
  source: string;
  sourceIdentifier: string | null;
  detectedCategory: MosqueCategory;
  classificationReason: string;
  dataStatus: DataStatus;
  verificationStatus: VerificationStatus;
  duplicateCandidates: string[];
  coLocationCandidates: string[];
  missingCriticalFields: string[];
  dataQualityFailures: string[];
  cityGateFailures?: string[];
  provenance: SourceProvenance | null;
  lastVerification: string | null;
  reviewReason: string | null;
  assignedOperator?: string | null;
  reviewedAt?: string | null;
  resolution?: 'APPROVE_PUBLISH' | 'REJECT' | 'HOLD_FOR_EVIDENCE' | null;
}

/**
 * Builds the authoritative operator review queue from the complete entity pool.
 * Only includes entities that require review (dataStatus === 'REVIEWED' or flagged).
 */
export function buildReviewQueue(
  entities: MosqueEntity[],
  duplicateMap?: Map<string, string[]>
): ReviewItem[] {
  const reviewEntities = entities.filter(
    (e) => e.dataStatus === 'REVIEWED' || Boolean(e.reviewReason)
  );

  return reviewEntities.map((entity) => {
    const missingCritical: string[] = [];
    if (!entity.street) missingCritical.push('street');
    if (!entity.phone && !entity.website) missingCritical.push('phone_or_website');
    if (!entity.postalCode || entity.postalCode === '00000') missingCritical.push('postalCode');

    const qualityFailures: string[] = [];
    if (entity.latitude === 0 || entity.longitude === 0) {
      qualityFailures.push('ZERO_COORDINATES');
    }
    if (entity.latitude < 47 || entity.latitude > 55.5 || entity.longitude < 5.5 || entity.longitude > 15.5) {
      qualityFailures.push('COORDINATES_OUTSIDE_GERMANY');
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entity.slug)) {
      qualityFailures.push('INVALID_SLUG');
    }

    const duplicates = duplicateMap?.get(entity.id) || [];

    return {
      id: entity.id,
      placeId: entity.placeId,
      name: entity.canonicalName,
      city: entity.city,
      address: entity.address,
      street: entity.street,
      postalCode: entity.postalCode,
      source: entity.source,
      sourceIdentifier: entity.sourceProvenance?.externalId || entity.placeId || null,
      detectedCategory: entity.category,
      classificationReason: entity.description || 'Category assigned by classification engine',
      dataStatus: entity.dataStatus,
      verificationStatus: entity.verificationStatus,
      duplicateCandidates: duplicates,
      coLocationCandidates: [],
      missingCriticalFields: missingCritical,
      dataQualityFailures: qualityFailures,
      provenance: entity.sourceProvenance || null,
      lastVerification: entity.lastVerified,
      reviewReason: entity.reviewReason || 'Held in review queue by quality pipeline',
      resolution: null,
    };
  });
}
