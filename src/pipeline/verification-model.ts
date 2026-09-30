import { VerificationStatus, MosqueEntity } from './types';

export type VerificationType = 'COMMUNITY' | 'OFFICIAL';

export type VerificationEventStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REVOKED';

export type EvidenceType =
  | 'OFFICIAL_REGISTER_DOCUMENT'     // Vereinsregisterauszug (Amtsgericht)
  | 'ASSOCIATION_MEMBERSHIP_LETTER'  // Bestätigung der Verbandsmitgliedschaft (DITIB, IGMG, VIKZ, etc.)
  | 'IMPRESSUM_LEGAL_MATCH'          // Offizielles Impressum mit übereinstimmender Vertretung
  | 'SITE_VISIT_PHOTO_EVIDENCE'      // Georeferenziertes Vor-Ort-Foto des Eingangsbereichs/Gebetsraums
  | 'DIRECT_PHONE_INTERVIEW'         // Verifiziertes telefonisches Interview mit dem Vorstand/Imam
  | 'OFFICIAL_DOMAIN_EMAIL_CONFIRM'; // Bestätigung über offizielle Domain-E-Mail (@ditib.de, etc.)

export interface VerificationEvent {
  verificationId: string;
  mosqueId: string;
  verificationType: VerificationType;
  submittedBy: string;
  submittedAt: string;
  evidenceType: EvidenceType;
  evidenceReference: string; // Hash or secure internal document ID — NEVER exposed in public API
  reviewedBy: string | null;
  reviewedAt: string | null;
  status: VerificationEventStatus;
  expiresAt: string | null;
  notes: string | null;
  rejectionReason?: string | null;
}

export interface VerificationTransitionResult {
  success: boolean;
  event: VerificationEvent;
  updatedMosque?: Partial<MosqueEntity>;
  error?: string;
}

/**
 * Creates a new VerificationEvent in PENDING status.
 *
 * CRITICAL RULE:
 * Creating an event does NOT modify the mosque's verificationStatus.
 */
export function createVerificationEvent(input: {
  mosqueId: string;
  verificationType: VerificationType;
  submittedBy: string;
  evidenceType: EvidenceType;
  evidenceReference: string;
  notes?: string;
}): VerificationEvent {
  return {
    verificationId: `verif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    mosqueId: input.mosqueId,
    verificationType: input.verificationType,
    submittedBy: input.submittedBy,
    submittedAt: new Date().toISOString(),
    evidenceType: input.evidenceType,
    evidenceReference: input.evidenceReference,
    reviewedBy: null,
    reviewedAt: null,
    status: 'PENDING',
    expiresAt: null,
    notes: input.notes || null,
  };
}

/**
 * Approves a verification event and computes the corresponding mosque state update.
 *
 * Rules:
 * - Only PENDING events can be approved.
 * - An approved event sets verificationStatus to COMMUNITY_VERIFIED or OFFICIALLY_VERIFIED.
 * - Sets lastVerified to reviewedAt timestamp.
 * - Does NOT alter publicationStatus or dataStatus.
 */
export function approveVerificationEvent(
  event: VerificationEvent,
  reviewedBy: string,
  validityDays = 365,
  notes?: string
): VerificationTransitionResult {
  if (event.status !== 'PENDING') {
    return {
      success: false,
      event,
      error: `Cannot approve verification event in status "${event.status}". Only PENDING events can be approved.`,
    };
  }

  const now = new Date();
  const reviewedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000).toISOString();

  const targetStatus: VerificationStatus =
    event.verificationType === 'OFFICIAL' ? 'OFFICIALLY_VERIFIED' : 'COMMUNITY_VERIFIED';

  const updatedEvent: VerificationEvent = {
    ...event,
    status: 'APPROVED',
    reviewedBy,
    reviewedAt,
    expiresAt,
    notes: notes || event.notes,
  };

  return {
    success: true,
    event: updatedEvent,
    updatedMosque: {
      verificationStatus: targetStatus,
      lastVerified: reviewedAt,
    },
  };
}

/**
 * Rejects a verification event.
 *
 * Rules:
 * - Event transitions to REJECTED.
 * - Mosque verificationStatus remains UNCHANGED (UNVERIFIED).
 */
export function rejectVerificationEvent(
  event: VerificationEvent,
  reviewedBy: string,
  rejectionReason: string
): VerificationTransitionResult {
  if (event.status !== 'PENDING') {
    return {
      success: false,
      event,
      error: `Cannot reject verification event in status "${event.status}". Only PENDING events can be rejected.`,
    };
  }

  const reviewedAt = new Date().toISOString();

  const updatedEvent: VerificationEvent = {
    ...event,
    status: 'REJECTED',
    reviewedBy,
    reviewedAt,
    rejectionReason,
  };

  return {
    success: true,
    event: updatedEvent,
    // Mosque is not updated — maintains unverified status
  };
}

/**
 * Revokes a previously approved verification.
 *
 * Rules:
 * - Event transitions to REVOKED.
 * - Mosque verificationStatus reverts to UNVERIFIED.
 */
export function revokeVerificationEvent(
  event: VerificationEvent,
  revokedBy: string,
  reason: string
): VerificationTransitionResult {
  if (event.status !== 'APPROVED') {
    return {
      success: false,
      event,
      error: `Cannot revoke verification event in status "${event.status}". Only APPROVED events can be revoked.`,
    };
  }

  const reviewedAt = new Date().toISOString();

  const updatedEvent: VerificationEvent = {
    ...event,
    status: 'REVOKED',
    reviewedBy: revokedBy,
    reviewedAt,
    notes: `REVOKED: ${reason}. Previous notes: ${event.notes || 'None'}`,
  };

  return {
    success: true,
    event: updatedEvent,
    updatedMosque: {
      verificationStatus: 'UNVERIFIED',
    },
  };
}

/**
 * Checks whether an approved verification event has expired.
 */
export function isVerificationEventExpired(event: VerificationEvent, now = new Date()): boolean {
  if (event.status !== 'APPROVED') return false;
  if (!event.expiresAt) return false;
  return new Date(event.expiresAt).getTime() <= now.getTime();
}
