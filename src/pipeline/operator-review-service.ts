import { MosqueEntity, DataStatus } from './types';
import { ReviewItem, buildReviewQueue } from './operator-review';
import { AuditLogService } from './audit-log';

export interface ReviewQueueFilters {
  city?: string;
  source?: string;
  classification?: string;
  hasMissingFields?: boolean;
  hasDuplicateCandidates?: boolean;
  reviewReasonSubstring?: string;
}

export type OperatorReviewAction =
  | 'APPROVE'             // Transitions dataStatus from REVIEWED to PUBLISHED (does NOT verify)
  | 'REJECT'              // Transitions dataStatus to REJECTED
  | 'KEEP_REVIEW'         // Keeps in review queue with updated operator notes
  | 'MARK_COLOCATED'      // Confirms separate entity sharing address with another organization
  | 'MERGE'               // Merges into target primary entity (only when safe)
  | 'REQUEST_INFORMATION';// Flags entity as waiting for community/field evidence

export interface OperatorActionResult {
  success: boolean;
  action: OperatorReviewAction;
  entityId: string;
  previousDataStatus: DataStatus;
  newDataStatus: DataStatus;
  auditEventId: string;
  notes?: string;
  error?: string;
}

export class OperatorReviewService {
  private reviewQueue: ReviewItem[] = [];
  private auditLogger: AuditLogService;

  constructor(entities: MosqueEntity[], auditLogger?: AuditLogService) {
    this.reviewQueue = buildReviewQueue(entities);
    this.auditLogger = auditLogger || new AuditLogService();
  }

  getQueue(filters?: ReviewQueueFilters): ReviewItem[] {
    let items = [...this.reviewQueue];

    if (!filters) return items;

    if (filters.city) {
      items = items.filter((i) => i.city.toLowerCase() === filters.city!.toLowerCase());
    }
    if (filters.source) {
      items = items.filter((i) => i.source.toLowerCase().includes(filters.source!.toLowerCase()));
    }
    if (filters.classification) {
      items = items.filter((i) => i.detectedCategory === filters.classification);
    }
    if (filters.hasMissingFields !== undefined) {
      items = items.filter((i) =>
        filters.hasMissingFields ? i.missingCriticalFields.length > 0 : i.missingCriticalFields.length === 0
      );
    }
    if (filters.hasDuplicateCandidates !== undefined) {
      items = items.filter((i) =>
        filters.hasDuplicateCandidates ? i.duplicateCandidates.length > 0 : i.duplicateCandidates.length === 0
      );
    }
    if (filters.reviewReasonSubstring) {
      const sub = filters.reviewReasonSubstring.toLowerCase();
      items = items.filter((i) => i.reviewReason && i.reviewReason.toLowerCase().includes(sub));
    }

    return items;
  }

  getItemById(id: string): ReviewItem | undefined {
    return this.reviewQueue.find((i) => i.id === id);
  }

  /**
   * Executes an auditable operator action on a review item.
   *
   * CRITICAL GUARANTEE:
   * APPROVE sets dataStatus to 'PUBLISHED', but leaves verificationStatus as 'UNVERIFIED'.
   * Approval never implies verification.
   */
  executeAction(
    entityId: string,
    action: OperatorReviewAction,
    operatorId: string,
    reason: string,
    targetMergeEntityId?: string
  ): OperatorActionResult {
    const item = this.getItemById(entityId);
    if (!item) {
      return {
        success: false,
        action,
        entityId,
        previousDataStatus: 'REVIEWED',
        newDataStatus: 'REVIEWED',
        auditEventId: '',
        error: `Entity "${entityId}" not found in review queue.`,
      };
    }

    const previousStatus = item.dataStatus;
    let newStatus = previousStatus;

    switch (action) {
      case 'APPROVE':
        newStatus = 'PUBLISHED';
        item.dataStatus = 'PUBLISHED';
        item.resolution = 'APPROVE_PUBLISH';
        break;

      case 'REJECT':
        newStatus = 'REJECTED';
        item.dataStatus = 'REJECTED';
        item.resolution = 'REJECT';
        break;

      case 'MARK_COLOCATED':
        // Stays in queue or approved as distinct facility
        item.reviewReason = `Verified co-location: independent organization confirmed. ${reason}`;
        break;

      case 'MERGE':
        if (!targetMergeEntityId) {
          return {
            success: false,
            action,
            entityId,
            previousDataStatus: previousStatus,
            newDataStatus: previousStatus,
            auditEventId: '',
            error: 'Cannot execute MERGE without target primary entity ID.',
          };
        }
        newStatus = 'REJECTED'; // The duplicate record is retired
        item.dataStatus = 'REJECTED';
        item.resolution = 'REJECT';
        item.reviewReason = `Merged into primary entity ${targetMergeEntityId}. ${reason}`;
        break;

      case 'REQUEST_INFORMATION':
      case 'KEEP_REVIEW':
        item.resolution = 'HOLD_FOR_EVIDENCE';
        item.reviewReason = reason;
        break;
    }

    item.assignedOperator = operatorId;
    item.reviewedAt = new Date().toISOString();

    const auditEvent = this.auditLogger.logEvent({
      entityId,
      entityType: 'mosque',
      field: 'dataStatus',
      previousValue: previousStatus,
      newValue: newStatus,
      actor: operatorId,
      action: action as any,
      reason,
      source: 'operator_review_portal',
      metadata: { targetMergeEntityId },
    });

    return {
      success: true,
      action,
      entityId,
      previousDataStatus: previousStatus,
      newDataStatus: newStatus,
      auditEventId: auditEvent.eventId,
      notes: reason,
    };
  }
}
