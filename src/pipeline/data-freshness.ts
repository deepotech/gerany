import { MosqueEntity } from './types';

export type FreshnessStatus = 'FRESH' | 'STALE' | 'VERY_STALE' | 'UNKNOWN';

export interface FreshnessAssessment {
  entityId: string;
  placeId: string | null;
  name: string;
  city: string;
  status: FreshnessStatus;
  lastVerified: string | null;
  updatedAt: string | null;
  ageDays: number | null;
  reviewRequired: boolean;
  reason: string;
}

export interface FreshnessThresholds {
  freshMaxDays: number;     // e.g. <= 90 days
  staleMaxDays: number;     // e.g. <= 365 days
  veryStaleThresholdDays: number; // > 365 days
}

export const DEFAULT_FRESHNESS_THRESHOLDS: FreshnessThresholds = {
  freshMaxDays: 90,
  staleMaxDays: 365,
  veryStaleThresholdDays: 365,
};

/**
 * Deterministically classifies data freshness for an entity without mutating it.
 *
 * Rules:
 * 1. UNKNOWN: If lastVerified is null, status is UNKNOWN (requires initial verification).
 * 2. FRESH: If lastVerified is within freshMaxDays (<= 90 days).
 * 3. STALE: If lastVerified is between 91 and 365 days.
 * 4. VERY_STALE: If lastVerified is older than 365 days.
 *
 * IMPORTANT: Source fetch time is NOT treated as human verification.
 */
export function classifyDataFreshness(
  entity: MosqueEntity,
  referenceDate: Date = new Date(),
  thresholds: FreshnessThresholds = DEFAULT_FRESHNESS_THRESHOLDS
): FreshnessAssessment {
  const verifiedStr = entity.lastVerified;

  if (!verifiedStr) {
    return {
      entityId: entity.id,
      placeId: entity.placeId,
      name: entity.canonicalName,
      city: entity.city,
      status: 'UNKNOWN',
      lastVerified: null,
      updatedAt: entity.updatedAt || null,
      ageDays: null,
      reviewRequired: true,
      reason: 'Entity has never undergone human verification (lastVerified is null). Initial verification task required.',
    };
  }

  const verifiedDate = new Date(verifiedStr);
  const diffMs = referenceDate.getTime() - verifiedDate.getTime();
  const ageDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (ageDays <= thresholds.freshMaxDays) {
    return {
      entityId: entity.id,
      placeId: entity.placeId,
      name: entity.canonicalName,
      city: entity.city,
      status: 'FRESH',
      lastVerified: verifiedStr,
      updatedAt: entity.updatedAt || null,
      ageDays,
      reviewRequired: false,
      reason: `Verified ${ageDays} days ago (within ${thresholds.freshMaxDays}-day freshness window).`,
    };
  }

  if (ageDays <= thresholds.staleMaxDays) {
    return {
      entityId: entity.id,
      placeId: entity.placeId,
      name: entity.canonicalName,
      city: entity.city,
      status: 'STALE',
      lastVerified: verifiedStr,
      updatedAt: entity.updatedAt || null,
      ageDays,
      reviewRequired: true,
      reason: `Verification is ${ageDays} days old (> ${thresholds.freshMaxDays} days). Scheduled re-verification recommended.`,
    };
  }

  return {
    entityId: entity.id,
    placeId: entity.placeId,
    name: entity.canonicalName,
    city: entity.city,
    status: 'VERY_STALE',
    lastVerified: verifiedStr,
    updatedAt: entity.updatedAt || null,
    ageDays,
    reviewRequired: true,
    reason: `Verification is ${ageDays} days old (> ${thresholds.veryStaleThresholdDays} days). High-priority audit required.`,
  };
}

/**
 * Assesses data freshness for a collection of entities and summarizes results.
 */
export function assessCollectionFreshness(
  entities: MosqueEntity[],
  referenceDate: Date = new Date(),
  thresholds: FreshnessThresholds = DEFAULT_FRESHNESS_THRESHOLDS
): {
  summary: Record<FreshnessStatus, number>;
  totalAssessed: number;
  reviewRequiredCount: number;
  assessments: FreshnessAssessment[];
} {
  const assessments = entities.map((e) => classifyDataFreshness(e, referenceDate, thresholds));
  const summary: Record<FreshnessStatus, number> = {
    FRESH: 0,
    STALE: 0,
    VERY_STALE: 0,
    UNKNOWN: 0,
  };

  assessments.forEach((a) => {
    summary[a.status]++;
  });

  return {
    summary,
    totalAssessed: assessments.length,
    reviewRequiredCount: assessments.filter((a) => a.reviewRequired).length,
    assessments,
  };
}
