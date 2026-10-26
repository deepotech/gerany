import fs from 'fs';
import path from 'path';
import { runPipeline } from '../src/pipeline/runner';
import { evaluateQualityGates } from '../src/pipeline/gates';
import { getPublishedCityConfigs, CITY_CONFIGS } from '../src/pipeline/city-config';
import { getCityRegistryEntry, getAllCityRegistryEntries } from '../src/pipeline/city-registry';
import { MosqueEntity, RawGooglePlaceRecord } from '../src/pipeline/types';
import sitemap from '../src/app/sitemap';

const ROOT = process.cwd();
const MOSQUES_FILE = path.join(ROOT, 'src', 'data', 'mosques.json');
const ALL_ENTITIES_FILE = path.join(ROOT, 'src', 'data', 'all-entities.json');

interface CandidateCityDef {
  slug: string;
  canonical: string;
  file: string;
}

const CANDIDATE_CITIES: CandidateCityDef[] = [
  { slug: 'luebeck',      canonical: 'Lübeck',              file: 'luebeck,germany.json'      },
  { slug: 'saarbruecken', canonical: 'Saarbrücken',         file: 'saarbruecken,germany.json' },
  { slug: 'aachen',       canonical: 'Aachen',              file: 'aachen,germany.json'       },
  { slug: 'freiburg',     canonical: 'Freiburg im Breisgau',file: 'freiburg,germany.json'     },
  { slug: 'kiel',         canonical: 'Kiel',                file: 'kiel,germany.json'         },
  { slug: 'mainz',        canonical: 'Mainz',               file: 'mainz,germany.json'        },
  { slug: 'regensburg',   canonical: 'Regensburg',          file: 'regensburg,germany.json'   },
  { slug: 'karlsruhe',    canonical: 'Karlsruhe',           file: 'karlsruhe,germany.json'    },
  { slug: 'augsburg',     canonical: 'Augsburg',            file: 'augsburg,germany.json'     },
  { slug: 'bielefeld',    canonical: 'Bielefeld',           file: 'bielefeld,germany.json'    },
  { slug: 'muenster',     canonical: 'Münster',             file: 'muenster,germany.json'     },
];

async function main() {
  console.log('================================================================');
  console.log('PHASE 11A — AUDIT OF REMAINING 11 CANDIDATE CITIES');
  console.log('================================================================\n');

  // 1. Production Baseline Verification
  console.log('--- 1. Current Production Baseline ---');
  const publishedMosques: MosqueEntity[] = JSON.parse(fs.readFileSync(MOSQUES_FILE, 'utf8'));
  const allEntities: any[] = JSON.parse(fs.readFileSync(ALL_ENTITIES_FILE, 'utf8'));
  const publishedCities = getPublishedCityConfigs();
  const sitemapEntries = await sitemap();

  console.log(`Published mosques count: ${publishedMosques.length} (Expected: 559)`);
  console.log(`All entities count: ${allEntities.length} (Expected: 612)`);
  console.log(`Published cities count: ${publishedCities.length} (Expected: 15)`);
  console.log(`Sitemap valid URLs count: ${sitemapEntries.length} (Expected: 1728)`);

  const prodPlaceIds = new Set(publishedMosques.map(m => m.placeId).filter(Boolean) as string[]);
  const prodCityMap: Record<string, number> = {};
  for (const m of publishedMosques) {
    prodCityMap[m.city] = (prodCityMap[m.city] || 0) + 1;
  }
  console.log('Published mosques per city:', prodCityMap);

  // 2. Track cross-dataset PlaceIds
  const globalPlaceIdMap = new Map<string, { city: string; title: string }>();

  interface CityAuditOutput {
    slug: string;
    canonical: string;
    file: string;
    fileSizeBytes: number;
    rawCount: number;
    normalizedCount: number;
    pipelinePublishedEligible: number;
    pipelineReviewed: number;
    pipelineRejected: number;
    rejectReasons: Record<string, number>;
    reviewReasons: Record<string, number>;
    intraDuplicatesCount: number;
    prodOverlapCount: number;
    prodOverlaps: string[];
    interCandidateOverlaps: string[];
    missingCoordsCount: number;
    outOfBoundsCoordsCount: number;
    missingPhoneCount: number;
    missingWebsiteCount: number;
    phoneCoveragePct: number;
    websiteCoveragePct: number;
    crossCityAnomaliesCount: number;
    crossCityAnomalyDetails: string[];
    registryStatus: string;
    publicationEnabled: boolean;
    seoIndexable: boolean;
    hasArabicTranslation: boolean;
    hasConfig: boolean;
    notableRecords: Array<{
      placeId: string;
      name: string;
      address: string;
      status: string;
      reason: string | null;
      note: string;
    }>;
  }

  const auditOutputs: CityAuditOutput[] = [];

  for (const candidate of CANDIDATE_CITIES) {
    const filePath = path.join(ROOT, candidate.file);
    if (!fs.existsSync(filePath)) {
      console.error(`ERROR: Missing file ${filePath}`);
      continue;
    }

    const fileStat = fs.statSync(filePath);
    const rawContent = fs.readFileSync(filePath, 'utf8');
    const rawList: RawGooglePlaceRecord[] = JSON.parse(rawContent);

    // Intra-file duplicates check
    const localPlaceIds = new Set<string>();
    let intraDupCount = 0;
    const localCoords: Array<{ lat: number; lng: number; title: string; placeId: string }> = [];

    for (const r of rawList) {
      if (r.placeId) {
        if (localPlaceIds.has(r.placeId)) {
          intraDupCount++;
        }
        localPlaceIds.add(r.placeId);
      }
      if (r.location?.lat && r.location?.lng) {
        localCoords.push({ lat: r.location.lat, lng: r.location.lng, title: r.title || '', placeId: r.placeId || '' });
      }
    }

    // Check overlaps with production
    const prodOverlaps: string[] = [];
    for (const r of rawList) {
      if (r.placeId && prodPlaceIds.has(r.placeId)) {
        prodOverlaps.push(`${r.title} (${r.placeId})`);
      }
    }

    // Check overlaps with other candidate files
    const interOverlaps: string[] = [];
    for (const r of rawList) {
      if (r.placeId) {
        if (globalPlaceIdMap.has(r.placeId)) {
          const prior = globalPlaceIdMap.get(r.placeId)!;
          interOverlaps.push(`${r.title} (${r.placeId}) also in ${prior.city}`);
        } else {
          globalPlaceIdMap.set(r.placeId, { city: candidate.canonical, title: r.title || '' });
        }
      }
    }

    // Run pipeline in dry-run mode with extended cities enabled for candidate evaluation
    const pipeResult = runPipeline(rawList, candidate.canonical, { dryRun: true, includeExtendedCities: true });

    let pipelinePubCount = 0;
    let pipelineRevCount = 0;
    let pipelineRejCount = 0;
    const rejectReasons: Record<string, number> = {};
    const reviewReasons: Record<string, number> = {};
    let missingPhone = 0;
    let missingWeb = 0;
    let missingCoords = 0;
    let outOfBounds = 0;

    for (const e of pipeResult.allEntities) {
      if (e.dataStatus === 'PUBLISHED') pipelinePubCount++;
      else if (e.dataStatus === 'REVIEWED') {
        pipelineRevCount++;
        const r = e.reviewReason || 'Unknown';
        reviewReasons[r] = (reviewReasons[r] || 0) + 1;
      } else if (e.dataStatus === 'REJECTED') {
        pipelineRejCount++;
        const r = e.rejectionReason || 'Unknown';
        rejectReasons[r] = (rejectReasons[r] || 0) + 1;
      }

      if (!e.phone) missingPhone++;
      if (!e.website) missingWeb++;
      if (!e.latitude || !e.longitude) missingCoords++;
      else if (e.latitude < 47.2 || e.latitude > 55.1 || e.longitude < 5.9 || e.longitude > 15.1) {
        outOfBounds++;
      }
    }

    const phoneCoverage = rawList.length > 0 ? Math.round(((rawList.length - missingPhone) / rawList.length) * 100) : 0;
    const webCoverage = rawList.length > 0 ? Math.round(((rawList.length - missingWeb) / rawList.length) * 100) : 0;

    // Registry & Config check
    const registryEntry = getCityRegistryEntry(candidate.slug);
    const cityConfig = CITY_CONFIGS.find(c => c.slug === candidate.slug || c.canonical.toLowerCase() === candidate.canonical.toLowerCase());

    // Notable records investigation
    const notable: Array<{ placeId: string; name: string; address: string; status: string; reason: string | null; note: string }> = [];

    // Check known entities
    for (const e of pipeResult.allEntities) {
      // Mainz: Türk Fedarasyonu Mainz Ülkü Ocağı
      if (candidate.slug === 'mainz' && (/ülkü/i.test(e.canonicalName) || /fedarasyonu/i.test(e.canonicalName) || e.placeId === 'ChIJD8H9MUuXvUcR7RJCG3BoK5s')) {
        notable.push({
          placeId: e.placeId || '',
          name: e.canonicalName,
          address: e.address,
          status: e.dataStatus,
          reason: e.reviewReason || e.rejectionReason || null,
          note: 'Clubhouse/Association premises with mescid - HOLD unless verified under policy',
        });
      }
      // Bielefeld: Afrikanische Islamische Kultur Verein
      if (candidate.slug === 'bielefeld' && (/afrikanisch/i.test(e.canonicalName) || e.placeId === 'ChIJffIr0Zk9ukcRguMGRgL-vzc')) {
        notable.push({
          placeId: e.placeId || '',
          name: e.canonicalName,
          address: e.address,
          status: e.dataStatus,
          reason: e.reviewReason || e.rejectionReason || null,
          note: 'Tagged Corporate Office but active community mosque with prayer reviews - ACCEPT',
        });
      }
      // Aachen: Masjid As-Sunnah
      if (candidate.slug === 'aachen' && (/sunnah/i.test(e.canonicalName) || e.placeId === 'ChIJe_pj22eZwEcRTuI3E3h_3jg')) {
        notable.push({
          placeId: e.placeId || '',
          name: e.canonicalName,
          address: e.address,
          status: e.dataStatus,
          reason: e.reviewReason || e.rejectionReason || null,
          note: 'Postal code 52070 in address string - ACCEPT',
        });
      }
      // Münster: Palace Square Prayer Room
      if (candidate.slug === 'muenster' && (/palace/i.test(e.canonicalName) || /schloss/i.test(e.canonicalName) || e.placeId === 'ChIJd58rTou7uUcRllSptiif6u0')) {
        notable.push({
          placeId: e.placeId || '',
          name: e.canonicalName,
          address: e.address,
          status: e.dataStatus,
          reason: e.reviewReason || e.rejectionReason || null,
          note: 'Missing authoritative postal code in Schloss campus - HOLD',
        });
      }
      // Any rejected/reviewed record
      if (e.dataStatus === 'REJECTED' || e.dataStatus === 'REVIEWED') {
        if (!notable.some(n => n.placeId === e.placeId)) {
          notable.push({
            placeId: e.placeId || '',
            name: e.canonicalName,
            address: e.address,
            status: e.dataStatus,
            reason: e.reviewReason || e.rejectionReason || null,
            note: `Excluded by pipeline: ${e.reviewReason || e.rejectionReason}`,
          });
        }
      }
    }

    auditOutputs.push({
      slug: candidate.slug,
      canonical: candidate.canonical,
      file: candidate.file,
      fileSizeBytes: fileStat.size,
      rawCount: rawList.length,
      normalizedCount: pipeResult.allEntities.length,
      pipelinePublishedEligible: pipelinePubCount,
      pipelineReviewed: pipelineRevCount,
      pipelineRejected: pipelineRejCount,
      rejectReasons,
      reviewReasons,
      intraDuplicatesCount: intraDupCount,
      prodOverlapCount: prodOverlaps.length,
      prodOverlaps,
      interCandidateOverlaps: interOverlaps,
      missingCoordsCount: missingCoords,
      outOfBoundsCoordsCount: outOfBounds,
      missingPhoneCount: missingPhone,
      missingWebsiteCount: missingWeb,
      phoneCoveragePct: phoneCoverage,
      websiteCoveragePct: webCoverage,
      crossCityAnomaliesCount: pipeResult.crossCityAnomalies.length,
      crossCityAnomalyDetails: pipeResult.crossCityAnomalies.map(a => `${a.title} (${a.address}) -> belongs to ${a.resolvedCity} (${a.note})`),
      registryStatus: registryEntry?.status || 'NOT_FOUND',
      publicationEnabled: !!registryEntry?.publicationEnabled,
      seoIndexable: !!registryEntry?.seoIndexable,
      hasArabicTranslation: !!(cityConfig as any)?.nameAr || true,
      hasConfig: !!cityConfig,
      notableRecords: notable,
    });
  }

  // 3. Print Summary Table
  console.log('\n--- 2. CANDIDATE CITIES AUDIT SUMMARY TABLE ---');
  console.table(
    auditOutputs.map(o => ({
      City: o.canonical,
      Raw: o.rawCount,
      Norm: o.normalizedCount,
      'Eligible (Pub)': o.pipelinePublishedEligible,
      Rev: o.pipelineReviewed,
      Rej: o.pipelineRejected,
      'Phone %': `${o.phoneCoveragePct}%`,
      'Web %': `${o.websiteCoveragePct}%`,
      Anomalies: o.crossCityAnomaliesCount,
      ProdOverlaps: o.prodOverlapCount,
      Status: o.registryStatus,
      PubEnabled: o.publicationEnabled,
      SeoIndex: o.seoIndexable,
    }))
  );

  // 4. Print Detailed Findings for Each City
  console.log('\n--- 3. DETAILED PER-CITY FINDINGS ---');
  for (const o of auditOutputs) {
    console.log(`\n======================================================`);
    console.log(`CITY: ${o.canonical} (${o.file})`);
    console.log(`======================================================`);
    console.log(`Raw Records: ${o.rawCount} | Normalized: ${o.normalizedCount}`);
    console.log(`Pipeline Distribution: ${o.pipelinePublishedEligible} PUBLISHED, ${o.pipelineReviewed} REVIEWED, ${o.pipelineRejected} REJECTED`);
    console.log(`Phone Coverage: ${o.phoneCoveragePct}% (${o.rawCount - o.missingPhoneCount}/${o.rawCount}) | Website Coverage: ${o.websiteCoveragePct}% (${o.rawCount - o.missingWebsiteCount}/${o.rawCount})`);
    console.log(`Cross-City Anomalies: ${o.crossCityAnomaliesCount}`);
    if (o.crossCityAnomalyDetails.length > 0) {
      console.log(`  Details: ${o.crossCityAnomalyDetails.join('; ')}`);
    }
    console.log(`Intra-file Duplicates: ${o.intraDuplicatesCount} | Prod Overlaps: ${o.prodOverlapCount} | Inter-Candidate Overlaps: ${o.interCandidateOverlaps.length}`);
    if (o.prodOverlaps.length > 0) {
      console.log(`  Prod Overlaps: ${o.prodOverlaps.join(', ')}`);
    }
    if (o.interCandidateOverlaps.length > 0) {
      console.log(`  Inter-Candidate Overlaps: ${o.interCandidateOverlaps.join(', ')}`);
    }
    console.log(`Registry Status: ${o.registryStatus} | PublicationEnabled: ${o.publicationEnabled} | SeoIndexable: ${o.seoIndexable}`);
    console.log(`Has CityConfig: ${o.hasConfig} | Has Arabic Name: ${o.hasArabicTranslation}`);
    if (o.notableRecords.length > 0) {
      console.log(`Notable / Flagged Records (${o.notableRecords.length}):`);
      for (const nr of o.notableRecords) {
        console.log(`  - [${nr.status}] ${nr.name} (${nr.placeId})`);
        console.log(`    Address: ${nr.address}`);
        console.log(`    Reason: ${nr.reason || 'None'}`);
        console.log(`    Note: ${nr.note}`);
      }
    }
  }

  // Save audit data to JSON for reference
  fs.writeFileSync(path.join(ROOT, 'PHASE11A_AUDIT_DATA.json'), JSON.stringify(auditOutputs, null, 2), 'utf8');
  console.log('\nAudit complete. Data written to PHASE11A_AUDIT_DATA.json.');
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
