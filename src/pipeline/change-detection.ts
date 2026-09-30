import { MosqueEntity, ChangeReport, EntityChange } from './types';

export type ChangeSeverity = 'NO_CHANGE' | 'MINOR_CHANGE' | 'SIGNIFICANT_CHANGE' | 'CONFLICT';

export interface DetailedEntityChange extends EntityChange {
  severity: ChangeSeverity;
  reviewRequired: boolean;
  conflictReason?: string;
}

export interface DetailedChangeReport extends Omit<ChangeReport, 'changes'> {
  changes: DetailedEntityChange[];
  severitySummary: Record<ChangeSeverity, number>;
  reviewRequiredCount: number;
}

/**
 * Determines the severity of changes between an existing entity and incoming data.
 *
 * Rules:
 * - NO_CHANGE: Exact field match.
 * - MINOR_CHANGE: Contact info (phone, website) or opening hours. Auto-updatable if unverified.
 * - SIGNIFICANT_CHANGE: Name, address, coordinates (< 200m), category, or facilities. Requires review.
 * - CONFLICT:
 *     - Modification to an OFFICIALLY_VERIFIED or COMMUNITY_VERIFIED entity.
 *     - Significant coordinates shift (> 200m).
 *     - Category changed from MOSQUE to non-mosque.
 */
export function classifyChangeSeverity(
  existing: MosqueEntity,
  fieldChanges: Array<{ field: string; oldValue: any; newValue: any }>
): { severity: ChangeSeverity; reviewRequired: boolean; conflictReason?: string } {
  if (fieldChanges.length === 0) {
    return { severity: 'NO_CHANGE', reviewRequired: false };
  }

  // 1. Conflict: Any mutation to an officially verified entity
  if (existing.verificationStatus === 'OFFICIALLY_VERIFIED') {
    return {
      severity: 'CONFLICT',
      reviewRequired: true,
      conflictReason: 'Attempted mutation to an officially verified entity. Requires human operator review.',
    };
  }

  // 2. Conflict: Large coordinate jump (> 200 meters)
  const coordChange = fieldChanges.find((f) => f.field === 'coordinates');
  if (coordChange) {
    const [lat1, lng1] = String(coordChange.oldValue).split(',').map(Number);
    const [lat2, lng2] = String(coordChange.newValue).split(',').map(Number);
    const distMeters = Math.hypot((lat1 - lat2) * 111320, (lng1 - lng2) * 71000);
    if (distMeters > 200) {
      return {
        severity: 'CONFLICT',
        reviewRequired: true,
        conflictReason: `Significant GPS displacement (${Math.round(distMeters)}m > 200m). Potential address mismatch or distinct location.`,
      };
    }
  }

  // 3. Significant change: name, address, category, facilities
  const sensitiveFields = ['canonicalName', 'address', 'street', 'category', 'coordinates', 'facilities'];
  const hasSensitiveChange = fieldChanges.some((f) => sensitiveFields.includes(f.field));

  if (hasSensitiveChange) {
    return {
      severity: 'SIGNIFICANT_CHANGE',
      reviewRequired: true,
      conflictReason: 'Sensitive identity, category, or location field changed. Verification required before publication.',
    };
  }

  // 4. Minor change: phone, website, hours
  return {
    severity: 'MINOR_CHANGE',
    reviewRequired: false,
  };
}

export function detectEntityDiff(
  existingEntities: MosqueEntity[],
  incomingEntities: MosqueEntity[]
): DetailedChangeReport {
  const existingMap = new Map<string, MosqueEntity>();
  for (const e of existingEntities) {
    existingMap.set(e.id, e);
  }

  const incomingMap = new Map<string, MosqueEntity>();
  for (const i of incomingEntities) {
    incomingMap.set(i.id, i);
  }

  const changes: DetailedEntityChange[] = [];
  const severitySummary: Record<ChangeSeverity, number> = {
    NO_CHANGE: 0,
    MINOR_CHANGE: 0,
    SIGNIFICANT_CHANGE: 0,
    CONFLICT: 0,
  };

  let addedCount = 0;
  let removedCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;

  // Check incoming vs existing
  for (const inc of incomingEntities) {
    const existing = existingMap.get(inc.id);
    if (!existing) {
      addedCount++;
      severitySummary.SIGNIFICANT_CHANGE++;
      changes.push({
        id: inc.id,
        name: inc.canonicalName,
        city: inc.city,
        changeType: 'ADDED',
        severity: 'SIGNIFICANT_CHANGE',
        reviewRequired: true,
      });
      continue;
    }

    const fieldChanges: Array<{ field: string; oldValue: any; newValue: any }> = [];

    if (existing.canonicalName !== inc.canonicalName) {
      fieldChanges.push({ field: 'canonicalName', oldValue: existing.canonicalName, newValue: inc.canonicalName });
    }
    if (existing.phone !== inc.phone) {
      fieldChanges.push({ field: 'phone', oldValue: existing.phone, newValue: inc.phone });
    }
    if (existing.website !== inc.website) {
      fieldChanges.push({ field: 'website', oldValue: existing.website, newValue: inc.website });
    }
    if (
      Math.abs(existing.latitude - inc.latitude) > 0.0001 ||
      Math.abs(existing.longitude - inc.longitude) > 0.0001
    ) {
      fieldChanges.push({
        field: 'coordinates',
        oldValue: `${existing.latitude},${existing.longitude}`,
        newValue: `${inc.latitude},${inc.longitude}`,
      });
    }
    if (existing.category !== inc.category) {
      fieldChanges.push({ field: 'category', oldValue: existing.category, newValue: inc.category });
    }
    if (existing.dataStatus !== inc.dataStatus) {
      fieldChanges.push({ field: 'dataStatus', oldValue: existing.dataStatus, newValue: inc.dataStatus });
    }

    const { severity, reviewRequired, conflictReason } = classifyChangeSeverity(existing, fieldChanges);
    severitySummary[severity]++;

    if (fieldChanges.length > 0) {
      updatedCount++;
      changes.push({
        id: inc.id,
        name: inc.canonicalName,
        city: inc.city,
        changeType: 'UPDATED',
        fieldChanges,
        severity,
        reviewRequired,
        conflictReason,
      });
    } else {
      unchangedCount++;
      changes.push({
        id: inc.id,
        name: inc.canonicalName,
        city: inc.city,
        changeType: 'UNCHANGED',
        severity: 'NO_CHANGE',
        reviewRequired: false,
      });
    }
  }

  // Check removed
  for (const ext of existingEntities) {
    if (!incomingMap.has(ext.id)) {
      removedCount++;
      severitySummary.SIGNIFICANT_CHANGE++;
      changes.push({
        id: ext.id,
        name: ext.canonicalName,
        city: ext.city,
        changeType: 'REMOVED',
        severity: 'SIGNIFICANT_CHANGE',
        reviewRequired: true,
        conflictReason: 'Entity was deleted or omitted from incoming source dataset.',
      });
    }
  }

  const reviewRequiredCount = changes.filter((c) => c.reviewRequired).length;

  return {
    timestamp: new Date().toISOString(),
    totalExisting: existingEntities.length,
    totalIncoming: incomingEntities.length,
    addedCount,
    removedCount,
    updatedCount,
    unchangedCount,
    severitySummary,
    reviewRequiredCount,
    changes,
  };
}
