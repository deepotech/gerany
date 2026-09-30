export type ClaimStatus =
  | 'CLAIM_SUBMITTED'
  | 'EVIDENCE_REQUIRED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'REVOKED';

export type ClaimantRole =
  | 'VORSTAND'          // Registered Board Member (Vorstand nach § 26 BGB)
  | 'IMAM'              // Official Congregational Imam
  | 'OFFICIAL_DELEGATE' // Designated Community Representative (Gemeindevertreter)
  | 'ADMINISTRATOR';    // Facility / Office Administrator

export interface MosqueClaim {
  claimId: string;
  mosqueId: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  claimantRole: ClaimantRole;
  officialRoleDescription?: string;
  status: ClaimStatus;
  submittedAt: string;
  evidenceProvided: string[]; // List of submitted proof identifiers
  reviewedBy: string | null;
  reviewedAt: string | null;
  managementPrivilegesGranted: boolean;
  rejectionReason?: string | null;
  notes?: string | null;
}

/**
 * Creates a new MosqueClaim in CLAIM_SUBMITTED state.
 *
 * CRITICAL SAFETY RULES:
 * - A claim NEVER directly modifies production data.
 * - managementPrivilegesGranted is strictly false.
 * - Mosque verificationStatus is NOT altered by a claim submission.
 */
export function createMosqueClaim(input: {
  mosqueId: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  claimantRole: ClaimantRole;
  officialRoleDescription?: string;
  initialEvidence?: string[];
}): MosqueClaim {
  return {
    claimId: `claim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    mosqueId: input.mosqueId,
    claimantName: input.claimantName.trim(),
    claimantEmail: input.claimantEmail.trim().toLowerCase(),
    claimantPhone: input.claimantPhone.trim(),
    claimantRole: input.claimantRole,
    officialRoleDescription: input.officialRoleDescription?.trim(),
    status: input.initialEvidence && input.initialEvidence.length > 0 ? 'UNDER_REVIEW' : 'EVIDENCE_REQUIRED',
    submittedAt: new Date().toISOString(),
    evidenceProvided: input.initialEvidence || [],
    reviewedBy: null,
    reviewedAt: null,
    managementPrivilegesGranted: false,
  };
}

/**
 * Transition claim to UNDER_REVIEW once sufficient evidence has been attached.
 */
export function submitClaimEvidence(
  claim: MosqueClaim,
  evidenceIdentifiers: string[]
): MosqueClaim {
  return {
    ...claim,
    evidenceProvided: Array.from(new Set([...claim.evidenceProvided, ...evidenceIdentifiers])),
    status: 'UNDER_REVIEW',
  };
}

/**
 * Operator approves claim.
 * Only at this step are management privileges granted.
 */
export function approveMosqueClaim(
  claim: MosqueClaim,
  operatorId: string,
  notes?: string
): MosqueClaim {
  return {
    ...claim,
    status: 'APPROVED',
    reviewedBy: operatorId,
    reviewedAt: new Date().toISOString(),
    managementPrivilegesGranted: true,
    notes: notes || claim.notes,
  };
}

/**
 * Operator rejects claim.
 */
export function rejectMosqueClaim(
  claim: MosqueClaim,
  operatorId: string,
  rejectionReason: string
): MosqueClaim {
  return {
    ...claim,
    status: 'REJECTED',
    reviewedBy: operatorId,
    reviewedAt: new Date().toISOString(),
    managementPrivilegesGranted: false,
    rejectionReason,
  };
}
