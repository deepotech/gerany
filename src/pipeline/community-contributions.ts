export type ContributionField =
  | 'phone'
  | 'website'
  | 'openingHours'
  | 'facilities'
  | 'languages'
  | 'fridayPrayerInfo'
  | 'prayerTimes'
  | 'address'
  | 'imageUrl';

export type ContributionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CommunityContribution {
  submissionId: string;
  mosqueId: string;
  field: ContributionField;
  submittedValue: any;
  previousValue: any;
  submitterName: string;
  submitterEmail: string;
  sourceContext?: string;
  submittedAt: string;
  status: ContributionStatus;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason?: string | null;
  operatorNotes?: string | null;
}

/**
 * Creates a new community edit proposal in PENDING status.
 *
 * CRITICAL SAFETY RULES:
 * - A proposal NEVER directly modifies production data.
 * - status is ALWAYS PENDING upon submission.
 * - Changes are applied only after explicit operator approval.
 */
export function createCommunityContribution(input: {
  mosqueId: string;
  field: ContributionField;
  submittedValue: any;
  previousValue: any;
  submitterName: string;
  submitterEmail: string;
  sourceContext?: string;
}): CommunityContribution {
  return {
    submissionId: `contrib_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    mosqueId: input.mosqueId,
    field: input.field,
    submittedValue: input.submittedValue,
    previousValue: input.previousValue,
    submitterName: input.submitterName.trim(),
    submitterEmail: input.submitterEmail.trim().toLowerCase(),
    sourceContext: input.sourceContext?.trim(),
    submittedAt: new Date().toISOString(),
    status: 'PENDING',
    reviewedBy: null,
    reviewedAt: null,
  };
}

/**
 * Approves a community proposal.
 * Returns the updated proposal and the patch to apply to the production entity.
 */
export function approveCommunityContribution(
  contribution: CommunityContribution,
  operatorId: string,
  operatorNotes?: string
): { updatedContribution: CommunityContribution; entityPatch: Record<string, any> } {
  const reviewedAt = new Date().toISOString();

  const updatedContribution: CommunityContribution = {
    ...contribution,
    status: 'APPROVED',
    reviewedBy: operatorId,
    reviewedAt,
    operatorNotes,
  };

  const entityPatch: Record<string, any> = {
    [contribution.field]: contribution.submittedValue,
    updatedAt: reviewedAt,
  };

  return { updatedContribution, entityPatch };
}

/**
 * Rejects a community proposal.
 */
export function rejectCommunityContribution(
  contribution: CommunityContribution,
  operatorId: string,
  rejectionReason: string
): CommunityContribution {
  return {
    ...contribution,
    status: 'REJECTED',
    reviewedBy: operatorId,
    reviewedAt: new Date().toISOString(),
    rejectionReason,
  };
}
