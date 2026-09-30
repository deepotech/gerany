import {
  RawGooglePlaceRecord,
  MosqueEntity,
  DataQualityReport,
  SourceProvenance,
  ChangeReport,
} from './types';
import {
  parseAddress,
  detectOrganization,
  extractFacilities,
  calculateRating,
  sanitizePhone,
  sanitizeWebsite,
  normalizeMosqueName,
} from './normalize';
import { classifyRecord } from './classify';
import { detectDuplicates } from './deduplicate';
import { ensureUniqueSlugs } from './slugs';
import { generateTranslations } from './translations';
import { validateMosqueEntity } from './validate';
import { evaluateQualityGates } from './gates';
import { detectEntityDiff } from './change-detection';

export interface CrossCityAnomaly {
  placeId: string | null;
  title: string;
  address: string;
  sourceDataset: string;
  resolvedCity: string;
  resolvedPostal: string;
  note: string;
}

export interface PipelineOptions {
  dryRun?: boolean;
  existingEntities?: MosqueEntity[];
  sourceProvenance?: SourceProvenance;
  includeExtendedCities?: boolean;
}

export interface PipelineResult {
  publishedEntities: MosqueEntity[];
  allEntities: MosqueEntity[];
  report: DataQualityReport;
  crossCityAnomalies: CrossCityAnomaly[];
  changeReport?: ChangeReport;
  isDryRun?: boolean;
}

/**
 * Runs the full 9-stage production quality pipeline on raw records.
 *
 * @param rawRecords - Raw Google Maps or external records
 * @param sourceCity - The city name inferred from source filename / dataset
 * @param options - Pipeline options (dryRun, existingEntities for diffing, custom provenance, includeExtendedCities)
 */
export function runPipeline(
  rawRecords: RawGooglePlaceRecord[],
  sourceCity?: string,
  options?: PipelineOptions
): PipelineResult {
  console.log(
    `[Pipeline] Starting pipeline for ${sourceCity || 'unknown city'} with ${rawRecords.length} raw records...`
  );

  const crossCityAnomalies: CrossCityAnomaly[] = [];

  // Stage 1 & 4: Deduplication (Multi-level + Co-Location Rule)
  const { uniqueRecords, duplicateCandidates } = detectDuplicates(rawRecords);
  console.log(
    `[Pipeline] Deduplication: ${uniqueRecords.length} unique, ${
      rawRecords.length - uniqueRecords.length
    } merged.`
  );

  // Stage 3 & 5: Normalization, Classification, Affiliation
  const preProcessed = uniqueRecords.map((raw, index) => {
    const addressInfo = parseAddress(raw.address, raw.postalCode, sourceCity, options?.includeExtendedCities);
    const classification = classifyRecord(raw);
    const organization = detectOrganization(raw.title || '', raw.website);
    const facilities = extractFacilities(raw);
    const { rating, reviewCount } = calculateRating(raw);

    // Detect cross-city anomalies
    if (addressInfo.isCrossCity && sourceCity) {
      crossCityAnomalies.push({
        placeId: raw.placeId || null,
        title: raw.title || `record_${index}`,
        address: raw.address || '',
        sourceDataset: sourceCity,
        resolvedCity: addressInfo.city,
        resolvedPostal: addressInfo.postalCode,
        note: `Record found in "${sourceCity}" dataset but postal ${addressInfo.postalCode} maps to canonical city "${addressInfo.city}". Held in REVIEW.`,
      });
      classification.dataStatus = 'REVIEWED';
      if (!classification.reason.includes('CROSS_CITY')) {
        classification.reason += ' [CROSS_CITY_ANOMALY: canonical city differs from source dataset]';
      }
    }

    // Flag unknown city resolution
    if (!addressInfo.cityConfig && !addressInfo.isCrossCity) {
      crossCityAnomalies.push({
        placeId: raw.placeId || null,
        title: raw.title || `record_${index}`,
        address: raw.address || '',
        sourceDataset: sourceCity || 'unknown',
        resolvedCity: addressInfo.city,
        resolvedPostal: addressInfo.postalCode,
        note: `Could not resolve canonical city from postal "${addressInfo.postalCode}" or city field. Held in REVIEW.`,
      });
      classification.dataStatus = 'REVIEWED';
      classification.reason += ' [UNKNOWN_CITY: could not resolve canonical city]';
    }

    return {
      raw,
      index,
      addressInfo,
      classification,
      organization,
      facilities,
      rating,
      reviewCount,
    };
  });

  // Slug generation (per-city scoped)
  const slugInputs = preProcessed.map((p) => ({
    title: p.raw.title || `moschee-${p.index}`,
    city: p.addressInfo.city,
    district: p.addressInfo.district,
    placeId: p.raw.placeId,
  }));
  const slugs = ensureUniqueSlugs(slugInputs);

  // Stage 6, 7, 8: Entity construction, Quality Gates, Review/Publish separation
  const allEntities: MosqueEntity[] = [];
  const publishedEntities: MosqueEntity[] = [];

  let validCoordinatesCount = 0;
  let missingWebsiteCount = 0;
  let missingPhoneCount = 0;
  let missingHoursCount = 0;

  const categoriesBreakdown: Record<string, number> = {};
  const districtsBreakdown: Record<string, number> = {};

  const defaultImportTime = new Date().toISOString();

  preProcessed.forEach((item, idx) => {
    const { raw, addressInfo, classification, organization, facilities, rating, reviewCount } = item;
    const slug = slugs[idx];
    const { canonicalName } = normalizeMosqueName(raw.title);

    // Stats
    const lat = raw.location?.lat ?? addressInfo.cityConfig?.postalMin ?? 0;
    const lng = raw.location?.lng ?? 0;
    if (raw.location?.lat && raw.location?.lng) validCoordinatesCount++;
    if (!raw.website) missingWebsiteCount++;
    if (!raw.phone) missingPhoneCount++;
    if (!raw.openingHours || raw.openingHours.length === 0) missingHoursCount++;

    const catName = classification.category;
    categoriesBreakdown[catName] = (categoriesBreakdown[catName] || 0) + 1;

    const districtName = addressInfo.district || 'Zentrum';
    districtsBreakdown[districtName] = (districtsBreakdown[districtName] || 0) + 1;

    const translations = generateTranslations(
      canonicalName,
      addressInfo.city,
      addressInfo.district,
      addressInfo.postalCode
    );

    const sourceLabel = sourceCity
      ? `google_maps_${sourceCity.toLowerCase().replace(/[^a-z]/g, '_')}`
      : 'google_maps_unknown';

    const sourceProvenance: SourceProvenance = options?.sourceProvenance || {
      name: sourceLabel,
      type: 'google_places_json',
      url: raw.url || null,
      externalId: raw.placeId || null,
      importedAt: defaultImportTime,
      license: 'factual_geodata_directory_rights',
    };

    const entity: MosqueEntity = {
      id: raw.placeId || `mosque_${sourceCity || 'de'}_${idx + 1}`,
      canonicalName,
      slug,
      address: addressInfo.formattedAddress,
      street: addressInfo.street,
      postalCode: addressInfo.postalCode,
      city: addressInfo.city,
      district: addressInfo.district,
      state: addressInfo.state,
      country: addressInfo.country,
      latitude: lat,
      longitude: lng,
      phone: sanitizePhone(raw.phone),
      website: sanitizeWebsite(raw.website),
      mapsUrl: raw.url || null,
      placeId: raw.placeId || null,
      category: classification.category,
      organization,
      description: raw.description || null,
      openingHours: raw.openingHours && raw.openingHours.length > 0 ? raw.openingHours : null,
      rating,
      reviewCount,
      imageUrl: raw.imageUrl || null,
      dataStatus: classification.dataStatus,
      verificationStatus: classification.verificationStatus,
      source: sourceLabel,
      lastVerified: defaultImportTime,
      facilities,
      translations,
      createdAt: defaultImportTime,
      updatedAt: defaultImportTime,
      sourceProvenance,
      rawValues: {
        name: raw.title || null,
        address: raw.address || null,
        phone: raw.phone || null,
        website: raw.website || null,
      },
      rejectionReason: classification.dataStatus === 'REJECTED' ? classification.reason : null,
      reviewReason: classification.dataStatus === 'REVIEWED' ? classification.reason : null,
    };

    // Stage 6: Evaluate Data Quality Gates
    const gateEval = evaluateQualityGates(entity);
    if (!gateEval.canPublish && entity.dataStatus === 'PUBLISHED') {
      entity.dataStatus = 'REVIEWED';
      entity.reviewReason = `Quality gate failure: ${gateEval.failedGates.join(', ')}`;
    }

    // Zod validation fallback
    const validation = validateMosqueEntity(entity);
    if (!validation.success) {
      console.warn(`[Pipeline] Entity ${entity.id} failed schema validation:`, validation.errors);
      entity.dataStatus = 'REVIEWED';
      entity.reviewReason = `Schema validation failed: ${validation.errors?.join(', ')}`;
    }

    allEntities.push(entity);
    if (entity.dataStatus === 'PUBLISHED') {
      publishedEntities.push(entity);
    }
  });

  const report: DataQualityReport = {
    timestamp: defaultImportTime,
    totalRawRecords: rawRecords.length,
    normalizedRecords: allEntities.length,
    publishableRecords: publishedEntities.length,
    reviewedRecords: allEntities.filter((e) => e.dataStatus === 'REVIEWED').length,
    rejectedRecords: allEntities.filter((e) => e.dataStatus === 'REJECTED').length,
    validCoordinatesCount,
    missingWebsiteCount,
    missingPhoneCount,
    missingHoursCount,
    categoriesBreakdown,
    districtsBreakdown,
    duplicateCandidates,
  };

  // Change detection if existing entities provided
  let changeReport: ChangeReport | undefined;
  if (options?.existingEntities) {
    changeReport = detectEntityDiff(options.existingEntities, allEntities);
  }

  return {
    publishedEntities,
    allEntities,
    report,
    crossCityAnomalies,
    changeReport,
    isDryRun: options?.dryRun,
  };
}
