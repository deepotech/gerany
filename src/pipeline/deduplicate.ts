import { RawGooglePlaceRecord, DuplicateCandidate, DuplicateEvidence } from './types';

// Haversine distance in meters
export function haversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function normalizeTitleForComparison(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(
      /\b(moschee|mosque|camii|masjid|mescid|e v|ev|verein|kulturverein|köln|cologne|germany|deutschland)\b/g,
      ''
    )
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes deterministic name similarity [0.0 - 1.0] using token overlap and containment.
 */
export function computeNameSimilarity(title1: string, title2: string): number {
  const n1 = normalizeTitleForComparison(title1);
  const n2 = normalizeTitleForComparison(title2);

  if (!n1 || !n2) return 0;
  if (n1 === n2) return 1.0;

  if (n1.includes(n2) || n2.includes(n1)) {
    const minLen = Math.min(n1.length, n2.length);
    const maxLen = Math.max(n1.length, n2.length);
    return Math.round((minLen / maxLen) * 100) / 100;
  }

  const tokens1 = new Set(n1.split(/\s+/).filter(Boolean));
  const tokens2 = new Set(n2.split(/\s+/).filter(Boolean));

  let matches = 0;
  tokens1.forEach((t) => {
    if (tokens2.has(t)) matches++;
  });

  const union = new Set(Array.from(tokens1).concat(Array.from(tokens2))).size;
  return union > 0 ? Math.round((matches / union) * 100) / 100 : 0;
}

/**
 * Calculates transparent multi-signal duplicate similarity with explainable breakdown.
 */
export function calculateDuplicateEvidence(
  rec1: RawGooglePlaceRecord,
  rec2: RawGooglePlaceRecord
): { score: number; evidence: DuplicateEvidence } {
  const nameSim = computeNameSimilarity(rec1.title || '', rec2.title || '');

  const phone1 = (rec1.phone || '').replace(/\D/g, '');
  const phone2 = (rec2.phone || '').replace(/\D/g, '');
  const phoneMatch = Boolean(phone1.length >= 7 && phone2.length >= 7 && phone1 === phone2);

  const addr1 = (rec1.address || '').split(',')[0].trim().toLowerCase();
  const addr2 = (rec2.address || '').split(',')[0].trim().toLowerCase();
  const addressMatch = Boolean(addr1.length > 3 && addr2.length > 3 && addr1 === addr2);

  let distanceMeters = 999999;
  if (
    rec1.location?.lat &&
    rec1.location?.lng &&
    rec2.location?.lat &&
    rec2.location?.lng
  ) {
    distanceMeters = haversineDistanceMeters(
      rec1.location.lat,
      rec1.location.lng,
      rec2.location.lat,
      rec2.location.lng
    );
  }

  // Multi-attribute composite score
  let score = nameSim * 0.5;
  if (phoneMatch) score += 0.25;
  if (addressMatch) score += 0.15;
  if (distanceMeters <= 20) score += 0.1;
  else if (distanceMeters <= 60) score += 0.05;

  score = Math.min(1.0, Math.round(score * 100) / 100);

  const explanation = `Name similarity: ${nameSim >= 0.85 ? 'high' : nameSim >= 0.6 ? 'moderate' : 'low'} (${nameSim}), Address match: ${
    addressMatch ? 'exact' : 'differ'
  }, Phone match: ${phoneMatch ? 'exact' : 'none'}, Distance: ${
    distanceMeters < 999999 ? `${distanceMeters}m` : 'unknown'
  }`;

  return {
    score,
    evidence: {
      nameSimilarity: nameSim,
      addressMatch,
      phoneMatch,
      distanceMeters,
      explanation,
    },
  };
}

/**
 * Multi-Level Deduplication Engine
 *
 * LEVEL 1: Exact external/source ID match (placeId)
 * LEVEL 2: Exact coordinates (<= 5m) + high name similarity (>= 0.85)
 * LEVEL 3: Same address + high name similarity (>= 0.85)
 * LEVEL 4: Same phone + strong name similarity (>= 0.70)
 * LEVEL 5: Fuzzy candidate matching (flagged for review; NEVER auto-merged)
 *
 * CO-LOCATION RULE:
 * Multiple legitimate entities at the same address or in close proximity
 * are NEVER merged unless strong evidence (identical phone + strong name match) exists.
 */
export function detectDuplicates(records: RawGooglePlaceRecord[]): {
  uniqueRecords: RawGooglePlaceRecord[];
  duplicateCandidates: DuplicateCandidate[];
} {
  const uniqueRecords: RawGooglePlaceRecord[] = [];
  const duplicateCandidates: DuplicateCandidate[] = [];
  const seenPlaceIds = new Map<string, RawGooglePlaceRecord>();

  for (let i = 0; i < records.length; i++) {
    const current = records[i];
    const currentPlaceId = current.placeId || `idx_${i}`;

    // LEVEL 1: Exact Place ID duplicate check
    if (current.placeId && seenPlaceIds.has(current.placeId)) {
      const existing = seenPlaceIds.get(current.placeId)!;
      duplicateCandidates.push({
        primaryId: existing.placeId || 'unknown',
        primaryName: existing.title || '',
        duplicateId: current.placeId,
        duplicateName: current.title || '',
        reason: 'EXACT_PLACE_ID',
        address: current.address || '',
        actionTaken: 'MERGED',
        similarityScore: 1.0,
        evidence: {
          nameSimilarity: 1.0,
          addressMatch: true,
          phoneMatch: true,
          distanceMeters: 0,
          explanation: 'Exact match on external placeId (Level 1)',
        },
      });
      continue; // Skip exact duplicate
    }

    let isMerged = false;

    for (const existing of uniqueRecords) {
      const { score, evidence } = calculateDuplicateEvidence(current, existing);

      const norm1 = normalizeTitleForComparison(current.title || '');
      const norm2 = normalizeTitleForComparison(existing.title || '');
      const exactTitleMatch = norm1.length > 3 && norm2.length > 3 && norm1 === norm2;
      const veryHighNameSim = evidence.nameSimilarity >= 0.90;

      // LEVEL 2: Exact coordinates (<= 5m) + exact or near-identical name
      if (evidence.distanceMeters <= 5 && (exactTitleMatch || (veryHighNameSim && evidence.phoneMatch))) {
        duplicateCandidates.push({
          primaryId: existing.placeId || existing.title || 'unknown',
          primaryName: existing.title || '',
          duplicateId: current.placeId || current.title || 'unknown',
          duplicateName: current.title || '',
          reason: 'EXACT_COORDINATES_AND_NAME',
          distanceMeters: evidence.distanceMeters,
          address: current.address || '',
          actionTaken: 'MERGED',
          similarityScore: score,
          evidence,
        });
        isMerged = true;
        break;
      }

      // LEVEL 3 & 4: Name Proximity or Phone match
      const isCloseProximity = evidence.addressMatch || evidence.distanceMeters < 60;

      if (isCloseProximity) {
        if (evidence.phoneMatch && (exactTitleMatch || veryHighNameSim)) {
          // LEVEL 4: Same phone + identical/near-identical name
          duplicateCandidates.push({
            primaryId: existing.placeId || existing.title || 'unknown',
            primaryName: existing.title || '',
            duplicateId: current.placeId || current.title || 'unknown',
            duplicateName: current.title || '',
            reason: 'PHONE_MATCH',
            distanceMeters: evidence.distanceMeters,
            address: current.address || '',
            actionTaken: 'MERGED',
            similarityScore: score,
            evidence,
          });
          isMerged = true;
          break;
        } else if (evidence.addressMatch && exactTitleMatch && evidence.distanceMeters <= 10) {
          // LEVEL 3: Same address + exact identical title
          duplicateCandidates.push({
            primaryId: existing.placeId || existing.title || 'unknown',
            primaryName: existing.title || '',
            duplicateId: current.placeId || current.title || 'unknown',
            duplicateName: current.title || '',
            reason: 'NAME_PROXIMITY_MATCH',
            distanceMeters: evidence.distanceMeters,
            address: current.address || '',
            actionTaken: 'MERGED',
            similarityScore: score,
            evidence,
          });
          isMerged = true;
          break;
        } else {
          // CO-LOCATION RULE: Multiple legitimate organizations at same address/vicinity
          duplicateCandidates.push({
            primaryId: existing.placeId || existing.title || 'unknown',
            primaryName: existing.title || '',
            duplicateId: current.placeId || current.title || 'unknown',
            duplicateName: current.title || '',
            reason: evidence.phoneMatch ? 'PHONE_MATCH' : 'SAME_ADDRESS_DIFFERENT_ORG',
            distanceMeters: evidence.distanceMeters,
            address: current.address || '',
            actionTaken: 'FLAGGED_CO_LOCATED',
            similarityScore: score,
            evidence,
          });
          // Do NOT merge: preserve distinct organizations
        }
      } else if (evidence.nameSimilarity >= 0.75 && score >= 0.6) {
        // LEVEL 5: Fuzzy Candidate (similar name but different address/location)
        duplicateCandidates.push({
          primaryId: existing.placeId || existing.title || 'unknown',
          primaryName: existing.title || '',
          duplicateId: current.placeId || current.title || 'unknown',
          duplicateName: current.title || '',
          reason: 'FUZZY_CANDIDATE',
          distanceMeters: evidence.distanceMeters,
          address: current.address || '',
          actionTaken: 'FLAGGED_FOR_REVIEW',
          similarityScore: score,
          evidence,
        });
        // Never auto-merge fuzzy candidates!
      }
    }

    if (!isMerged) {
      if (current.placeId) {
        seenPlaceIds.set(current.placeId, current);
      }
      uniqueRecords.push(current);
    }
  }

  return { uniqueRecords, duplicateCandidates };
}
