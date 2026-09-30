import { MosqueEntity, QualityGateResult } from './types';
import { validateMosqueEntity } from './validate';
import { validateCoordinatesQuality } from './normalize';
import { isCityIndexable, CITY_CONFIGS, EXTENDED_CITY_CONFIGS } from './city-config';

export interface GateEvaluationResult {
  allPassed: boolean;
  canPublish: boolean;
  gates: QualityGateResult[];
  failedGates: string[];
}

/**
 * The 8 Explicit Production Data Quality Gates
 */
export function evaluateQualityGates(
  entity: MosqueEntity,
  context?: {
    existingEntities?: MosqueEntity[];
    isDuplicateCandidate?: boolean;
    duplicateReason?: string;
  }
): GateEvaluationResult {
  const gates: QualityGateResult[] = [];

  // GATE 1: Schema Valid
  const schemaValidation = validateMosqueEntity(entity);
  gates.push({
    gate: 'GATE_1_SCHEMA_VALID',
    passed: schemaValidation.success,
    reason: schemaValidation.success ? undefined : schemaValidation.errors?.join(', '),
  });

  // GATE 2: Location Valid
  const geoQuality = validateCoordinatesQuality(entity.latitude, entity.longitude);
  const locationPassed = geoQuality.isValid && geoQuality.isGermanyBounds;
  gates.push({
    gate: 'GATE_2_LOCATION_VALID',
    passed: locationPassed,
    reason: locationPassed
      ? undefined
      : geoQuality.reason || 'Coordinates outside Germany bounding box or zero',
  });

  // GATE 3: Classification Valid
  const allowedCategories = ['MOSQUE', 'ISLAMIC_CENTER', 'RELIGIOUS_ORGANIZATION', 'PRAYER_ROOM'];
  const classificationPassed =
    allowedCategories.includes(entity.category) && entity.category !== 'OTHER';
  gates.push({
    gate: 'GATE_3_CLASSIFICATION_VALID',
    passed: classificationPassed,
    reason: classificationPassed
      ? undefined
      : `Category "${entity.category}" is not an accepted mosque or prayer facility entity`,
  });

  // GATE 4: Duplicate Check Passed
  const hasUnresolvedDup =
    context?.isDuplicateCandidate &&
    context.duplicateReason !== 'SAME_ADDRESS_DIFFERENT_ORG';
  const duplicatePassed = !hasUnresolvedDup;
  gates.push({
    gate: 'GATE_4_DUPLICATE_CHECK_PASSED',
    passed: duplicatePassed,
    reason: duplicatePassed
      ? undefined
      : `Unresolved duplicate conflict: ${context?.duplicateReason}`,
  });

  // GATE 5: Provenance Present
  const provenancePassed = Boolean(
    entity.source &&
    entity.source.trim().length > 0 &&
    (entity.createdAt || entity.sourceProvenance?.importedAt)
  );
  gates.push({
    gate: 'GATE_5_PROVENANCE_PRESENT',
    passed: provenancePassed,
    reason: provenancePassed ? undefined : 'Missing source identifier or import timestamp',
  });

  // GATE 6: Publishability Passed
  const hasValidName = entity.canonicalName && entity.canonicalName.trim().length >= 2;
  const hasValidAddress = entity.address && entity.address.trim().length >= 5;
  const hasValidCity = entity.city && entity.city.trim().length >= 2;
  const hasValidPostal = /^\d{5}$/.test(entity.postalCode);
  const isGermany = entity.country.toLowerCase() === 'germany' || entity.country.toLowerCase() === 'deutschland';
  const publishableCategory = entity.category === 'MOSQUE' || entity.category === 'ISLAMIC_CENTER';

  const publishabilityPassed = Boolean(
    hasValidName &&
    hasValidAddress &&
    hasValidCity &&
    hasValidPostal &&
    isGermany &&
    publishableCategory &&
    entity.dataStatus !== 'REJECTED'
  );
  gates.push({
    gate: 'GATE_6_PUBLISHABILITY_PASSED',
    passed: publishabilityPassed,
    reason: publishabilityPassed
      ? undefined
      : 'Failed minimum publishability criteria (name, address, city, postal, country, or category)',
  });

  // GATE 7: SEO Route Valid
  const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entity.slug);
  // Check both base CITY_CONFIGS and EXTENDED_CITY_CONFIGS — the entity-level gate
  // validates that a city config EXISTS in our known registry.
  // Whether a city is publicly PUBLISHED is enforced by the city-level gates (A-J),
  // not at the entity level. Candidate city records must pass this gate to reach
  // PUBLISHED dataStatus so the city gates can count them.
  const isKnownCity =
    CITY_CONFIGS.some((c) => c.canonical.toLowerCase() === entity.city.toLowerCase()) ||
    EXTENDED_CITY_CONFIGS.some((c) => c.canonical.toLowerCase() === entity.city.toLowerCase());
  const seoRoutePassed = validSlug && isKnownCity;
  gates.push({
    gate: 'GATE_7_SEO_ROUTE_VALID',
    passed: seoRoutePassed,
    reason: seoRoutePassed
      ? undefined
      : `Invalid SEO route: slug "${entity.slug}" or unconfigured city "${entity.city}"`,
  });

  // GATE 8: Regression Tests & Trust Safety Passed
  // Trust rule: Source presence does not grant verified status
  const trustSafetyPassed = entity.verificationStatus === 'UNVERIFIED' || Boolean(entity.lastVerified);
  gates.push({
    gate: 'GATE_8_TRUST_SAFETY_PASSED',
    passed: trustSafetyPassed,
    reason: trustSafetyPassed
      ? undefined
      : 'Trust semantics violated: unearned verification upgrade detected',
  });

  const allPassed = gates.every((g) => g.passed);
  const failedGates = gates.filter((g) => !g.passed).map((g) => g.gate);

  // An entity can only be published if all quality gates 1, 2, 4, 5, 6, 7, 8 pass
  const canPublish =
    gates.find((g) => g.gate === 'GATE_1_SCHEMA_VALID')!.passed &&
    gates.find((g) => g.gate === 'GATE_2_LOCATION_VALID')!.passed &&
    gates.find((g) => g.gate === 'GATE_4_DUPLICATE_CHECK_PASSED')!.passed &&
    gates.find((g) => g.gate === 'GATE_5_PROVENANCE_PRESENT')!.passed &&
    gates.find((g) => g.gate === 'GATE_6_PUBLISHABILITY_PASSED')!.passed &&
    gates.find((g) => g.gate === 'GATE_7_SEO_ROUTE_VALID')!.passed &&
    gates.find((g) => g.gate === 'GATE_8_TRUST_SAFETY_PASSED')!.passed;

  return {
    allPassed,
    canPublish,
    gates,
    failedGates,
  };
}
