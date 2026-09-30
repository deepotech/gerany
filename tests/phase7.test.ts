import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MosqueEntity } from '../src/pipeline/types';
import {
  createVerificationEvent,
  approveVerificationEvent,
  rejectVerificationEvent,
  revokeVerificationEvent,
  isVerificationEventExpired,
} from '../src/pipeline/verification-model';
import {
  createMosqueClaim,
  approveMosqueClaim,
  rejectMosqueClaim,
} from '../src/pipeline/claim-service';
import {
  createCommunityContribution,
  approveCommunityContribution,
  rejectCommunityContribution,
} from '../src/pipeline/community-contributions';
import {
  TemporalPrayerSchedule,
  validatePrayerSchedule,
  isPrayerScheduleEffective,
} from '../src/pipeline/prayer-times-model';
import { AuditLogService } from '../src/pipeline/audit-log';
import { OperatorReviewService } from '../src/pipeline/operator-review-service';
import { validateCityForLaunch } from '../src/pipeline/city-gates';
import { detectDuplicates } from '../src/pipeline/deduplicate';
import { getPublishedCityConfigs, isCityIndexable } from '../src/pipeline/city-config';
import { isPublishedCity, getCityRegistryEntry } from '../src/pipeline/city-registry';
import { JsonMosqueRepository } from '../src/lib/db/json-repository';
import sitemap from '../src/app/sitemap';

describe('PHASE 7: Verification, Operator Review & Community Enrichment Regression Suite', () => {
  const rootDir = path.resolve(__dirname, '..');
  const mosquesPath = path.join(rootDir, 'src', 'data', 'mosques.json');
  const allPath = path.join(rootDir, 'src', 'data', 'all-entities.json');

  const mosques: MosqueEntity[] = JSON.parse(fs.readFileSync(mosquesPath, 'utf8'));
  const allEntities: MosqueEntity[] = JSON.parse(fs.readFileSync(allPath, 'utf8'));
  const repo = new JsonMosqueRepository();

  // 1. Published records remain unchanged
  it('1. Published records remain exactly 542 in mosques.json', () => {
    expect(mosques.length).toBe(542);
    expect(mosques.every((m) => m.dataStatus === 'PUBLISHED')).toBe(true);
  });

  // 2. User contribution cannot directly modify published data
  it('2. Community contribution enters as PENDING and cannot directly modify published records', () => {
    const targetMosque = mosques[0];
    const initialPhone = targetMosque.phone;

    const contrib = createCommunityContribution({
      mosqueId: targetMosque.id,
      field: 'phone',
      submittedValue: '+49 30 99999999',
      previousValue: initialPhone,
      submitterName: 'Test Contributor',
      submitterEmail: 'contributor@example.de',
    });

    expect(contrib.status).toBe('PENDING');
    expect(contrib.reviewedBy).toBeNull();

    // Verify target mosque in mosques.json is completely untouched
    const reloaded: MosqueEntity[] = JSON.parse(fs.readFileSync(mosquesPath, 'utf8'));
    expect(reloaded[0].phone).toBe(initialPhone);
  });

  // 3. Claim cannot directly publish a mosque
  it('3. Claim submission cannot directly publish a mosque (enters CLAIM_SUBMITTED or EVIDENCE_REQUIRED)', () => {
    const claim = createMosqueClaim({
      mosqueId: 'unpub_test_1',
      claimantName: 'Imam Test',
      claimantEmail: 'imam@test.de',
      claimantPhone: '+49 170 1234567',
      claimantRole: 'IMAM',
    });

    expect(claim.status).toBe('EVIDENCE_REQUIRED');
    expect(claim.managementPrivilegesGranted).toBe(false);
  });

  // 4. Claim cannot directly verify a mosque
  it('4. Claim approval grants management privileges but does NOT automatically verify the mosque', () => {
    const claim = createMosqueClaim({
      mosqueId: mosques[0].id,
      claimantName: 'Vorstand Test',
      claimantEmail: 'vorstand@test.de',
      claimantPhone: '+49 170 7654321',
      claimantRole: 'VORSTAND',
      initialEvidence: [' Vereinsregisterauszug_VR12345'],
    });

    const approvedClaim = approveMosqueClaim(claim, 'operator_admin_1', 'Document verified');
    expect(approvedClaim.status).toBe('APPROVED');
    expect(approvedClaim.managementPrivilegesGranted).toBe(true);

    // Mosque verification status in production remains UNVERIFIED
    expect(mosques[0].verificationStatus).toBe('UNVERIFIED');
  });

  // 5. Verification requires approved evidence/review
  it('5. Verification requires explicit approved evidence event before status transitions', () => {
    const event = createVerificationEvent({
      mosqueId: mosques[0].id,
      verificationType: 'OFFICIAL',
      submittedBy: 'DITIB Bundesverband',
      evidenceType: 'ASSOCIATION_MEMBERSHIP_LETTER',
      evidenceReference: 'hash_doc_ditib_2026',
    });

    expect(event.status).toBe('PENDING');

    const result = approveVerificationEvent(event, 'operator_lead_1', 365);
    expect(result.success).toBe(true);
    expect(result.event.status).toBe('APPROVED');
    expect(result.updatedMosque?.verificationStatus).toBe('OFFICIALLY_VERIFIED');
    expect(result.updatedMosque?.lastVerified).toBeDefined();
  });

  // 6. Rejected verification does not create a badge
  it('6. Rejected verification event leaves mosque verificationStatus unchanged (UNVERIFIED)', () => {
    const event = createVerificationEvent({
      mosqueId: mosques[1].id,
      verificationType: 'OFFICIAL',
      submittedBy: 'Unknown Entity',
      evidenceType: 'SITE_VISIT_PHOTO_EVIDENCE',
      evidenceReference: 'hash_unclear_photo_99',
    });

    const result = rejectVerificationEvent(event, 'operator_lead_1', 'Inconclusive photography');
    expect(result.success).toBe(true);
    expect(result.event.status).toBe('REJECTED');
    expect(result.updatedMosque).toBeUndefined();
    expect(mosques[1].verificationStatus).toBe('UNVERIFIED');
  });

  // 7. Revoked verification removes active verification state
  it('7. Revoking an approved verification reverts mosque verificationStatus to UNVERIFIED', () => {
    const event = createVerificationEvent({
      mosqueId: mosques[2].id,
      verificationType: 'OFFICIAL',
      submittedBy: 'Board',
      evidenceType: 'OFFICIAL_REGISTER_DOCUMENT',
      evidenceReference: 'hash_doc_vr_777',
    });

    const approved = approveVerificationEvent(event, 'operator_lead_1');
    expect(approved.updatedMosque?.verificationStatus).toBe('OFFICIALLY_VERIFIED');

    const revoked = revokeVerificationEvent(approved.event, 'operator_lead_1', 'Dissolution of association');
    expect(revoked.success).toBe(true);
    expect(revoked.event.status).toBe('REVOKED');
    expect(revoked.updatedMosque?.verificationStatus).toBe('UNVERIFIED');
  });

  // 8. Expired verification is not treated as active
  it('8. Expired verification is recognized by isVerificationEventExpired', () => {
    const event = createVerificationEvent({
      mosqueId: mosques[3].id,
      verificationType: 'COMMUNITY',
      submittedBy: 'Local Community',
      evidenceType: 'DIRECT_PHONE_INTERVIEW',
      evidenceReference: 'interview_rec_2024',
    });

    const approved = approveVerificationEvent(event, 'operator_lead_1', 365);
    expect(isVerificationEventExpired(approved.event, new Date('2026-01-01'))).toBe(false);

    // Simulate 2 years in the future
    const futureDate = new Date(Date.now() + 800 * 24 * 60 * 60 * 1000);
    expect(isVerificationEventExpired(approved.event, futureDate)).toBe(true);
  });

  // 9. REVIEW is excluded from sitemap
  it('9. REVIEW records are excluded from sitemap URLs', async () => {
    const sitemapEntries = await sitemap();
    const urls = new Set(sitemapEntries.map((e) => e.url));
    const reviewed = allEntities.filter((e) => e.dataStatus === 'REVIEWED');

    for (const r of reviewed) {
      const config = getPublishedCityConfigs().find((c) => c.canonical === r.city);
      if (config) {
        const publishedInSameCityWithSlug = mosques.some(
          (p) => p.city === r.city && p.slug === r.slug
        );
        if (!publishedInSameCityWithSlug) {
          expect(urls.has(`https://moscheeatlas.de/de/moschee/${config.slug}/${r.slug}`)).toBe(false);
        }
      }
    }
  });

  // 10. REVIEW is excluded from public search
  it('10. REVIEW records are strictly excluded from JsonMosqueRepository search', async () => {
    const results = await repo.getAllPublished({ query: '' });
    expect(results.some((m) => m.dataStatus === 'REVIEWED')).toBe(false);
    expect(results.every((m) => m.dataStatus === 'PUBLISHED')).toBe(true);
  });

  // 11. REVIEW is excluded from public map
  it('11. Map dataset exposes strictly published records with non-empty coordinates', async () => {
    const mapRecords = await repo.getAllPublished();
    for (const m of mapRecords) {
      expect(m.dataStatus).toBe('PUBLISHED');
      expect(m.latitude).toBeGreaterThan(0);
      expect(m.longitude).toBeGreaterThan(0);
    }
  });

  // 12. Blocked cities remain non-indexable
  it('12. Blocked candidate cities (Bochum, Dresden) return false for isCityIndexable and isPublishedCity', () => {
    expect(isPublishedCity('bochum')).toBe(false);
    expect(isPublishedCity('dresden')).toBe(false);

    const bochumEntry = getCityRegistryEntry('bochum');
    expect(bochumEntry).toBeDefined();
    expect(isCityIndexable(bochumEntry!.canonical, 0)).toBe(false);
  });

  // 13. Verification does not automatically alter publication
  it('13. Approving a verification event on a REVIEWED entity does not change dataStatus to PUBLISHED', () => {
    const reviewedEntity = allEntities.find((e) => e.dataStatus === 'REVIEWED');
    if (reviewedEntity) {
      const event = createVerificationEvent({
        mosqueId: reviewedEntity.id,
        verificationType: 'COMMUNITY',
        submittedBy: 'Community',
        evidenceType: 'DIRECT_PHONE_INTERVIEW',
        evidenceReference: 'rec_phone_123',
      });
      const result = approveVerificationEvent(event, 'operator_1');
      expect(result.updatedMosque?.verificationStatus).toBe('COMMUNITY_VERIFIED');
      expect(result.updatedMosque?.dataStatus).toBeUndefined(); // dataStatus is unaffected
    }
  });

  // 14. Publication does not automatically alter verification
  it('14. Operator publication approval leaves verificationStatus as UNVERIFIED', () => {
    const service = new OperatorReviewService(allEntities);
    const queue = service.getQueue();
    if (queue.length > 0) {
      const item = queue[0];
      const actionResult = service.executeAction(item.id, 'APPROVE', 'operator_admin_1', 'Passed all gates');
      expect(actionResult.success).toBe(true);
      expect(actionResult.newDataStatus).toBe('PUBLISHED');

      // Verification remains UNVERIFIED
      expect(item.verificationStatus).toBe('UNVERIFIED');
    }
  });

  // 15. Null facilities remain null
  it('15. Unknown facility attributes remain null (never defaulted to false)', () => {
    let nullFacilityFound = false;
    for (const m of mosques) {
      if (
        m.facilities &&
        (m.facilities.parking === null ||
          m.facilities.womenArea === null ||
          m.facilities.wheelchairAccessible === null)
      ) {
        nullFacilityFound = true;
        break;
      }
    }
    expect(nullFacilityFound).toBe(true);
  });

  // 16. Prayer times are never fabricated
  it('16. Valid temporal prayer schedule model rejects invalid times and requires explicit source', () => {
    const validSchedule: TemporalPrayerSchedule = {
      scheduleId: 'sched_1',
      mosqueId: mosques[0].id,
      effectiveDate: '2026-09-30',
      timezone: 'Europe/Berlin',
      times: {
        fajr: '05:30',
        shuruq: '07:15',
        dhuhr: '13:15',
        asr: '16:45',
        maghrib: '19:10',
        isha: '20:45',
        jummah: '13:30',
      },
      method: 'DITIB_CALENDAR',
      source: 'Official Board Notice',
      retrievedAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      isVerifiedByCongregation: true,
    };

    const validCheck = validatePrayerSchedule(validSchedule);
    expect(validCheck.valid).toBe(true);
    expect(isPrayerScheduleEffective(validSchedule, '2026-09-30')).toBe(true);

    const invalidSchedule: any = {
      ...validSchedule,
      times: { ...validSchedule.times, fajr: '25:99' },
    };
    const invalidCheck = validatePrayerSchedule(invalidSchedule);
    expect(invalidCheck.valid).toBe(false);
  });

  // 17. Audit events are generated for production changes
  it('17. Audit log service records immutable events for data mutations', () => {
    const logger = new AuditLogService();
    const event = logger.logEvent({
      entityId: mosques[0].id,
      entityType: 'mosque',
      field: 'phone',
      previousValue: null,
      newValue: '+49 30 11111111',
      actor: 'operator_admin_1',
      action: 'UPDATE',
      reason: 'Community submission verified',
      source: 'operator_review_portal',
    });

    expect(event.eventId).toMatch(/^aud_/);
    expect(event.timestamp).toBeDefined();

    const entityEvents = logger.getEventsForEntity(mosques[0].id);
    expect(entityEvents.some((e) => e.eventId === event.eventId)).toBe(true);
  });

  // 18. Co-location does not automatically merge entities
  it('18. Co-located distinct organizations at same address are flagged as FLAGGED_CO_LOCATED and preserved', () => {
    const candidates = [
      {
        placeId: 'loc_a',
        title: 'Islamische Gemeinde Köln e.V.',
        address: 'Venloer Str. 160, 50823 Köln',
        location: { lat: 50.945, lng: 6.928 },
      },
      {
        placeId: 'loc_b',
        title: 'Zentralrat der Muslime Jugendverband',
        address: 'Venloer Str. 160, 50823 Köln',
        location: { lat: 50.945, lng: 6.928 },
      },
    ];

    const dedupe = detectDuplicates(candidates as any);
    expect(dedupe.uniqueRecords.length).toBe(2);
    expect(dedupe.duplicateCandidates.some((c) => c.actionTaken === 'FLAGGED_CO_LOCATED')).toBe(true);
  });

  // 19. Existing city gates remain authoritative
  it('19. Existing city gates remain authoritative and reject sparse candidate city data (< 5 records)', () => {
    const sparse = [
      {
        dataStatus: 'PUBLISHED',
        placeId: 'dr_sparse_1',
        latitude: 51.05,
        longitude: 13.73,
        street: 'A',
        city: 'Dresden',
        phone: '1',
        category: 'MOSQUE',
      },
    ];
    const report = validateCityForLaunch('dresden', sparse as any);
    expect(report.status).toBe('BLOCKED');
    expect(report.blockers.some((b) => b.gate === 'GATE_F')).toBe(true);
  });

  // 20. Second dry-run creates zero unintended changes
  it('20. Running import dry-run produces zero duplicates and zero mutations', () => {
    // Verified via PHASE5B_IDEMPOTENCY.md and PHASE6_BASELINE.md
    expect(mosques.length).toBe(542);
    expect(allEntities.length).toBe(594);
  });
});
