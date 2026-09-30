/**
 * Comprehensive Phase 2B Audit Script
 * Analyzes dataset, geolocation, duplicates, organizations, slugs, routes, and sitemap.
 */

import fs from 'fs';
import path from 'path';
import { MosqueEntity, RawGooglePlaceRecord, DataQualityReport } from '../src/pipeline/types';
import { CITY_CONFIGS } from '../src/pipeline/city-config';
import { getCityUrl, getMosqueUrl } from '../src/lib/routes';

interface AuditResults {
  dataset: any;
  completeness: any;
  geo: any;
  duplicates: any;
  organizations: any;
  slugs: any;
  sitemap: any;
}

function runAudit(): AuditResults {
  const rootDir = path.resolve(__dirname, '..');
  const dataDir = path.join(rootDir, 'src', 'data');

  const mosquesPath = path.join(dataDir, 'mosques.json');
  const allEntitiesPath = path.join(dataDir, 'all-entities.json');
  const qualityReportPath = path.join(dataDir, 'data-quality-report.json');

  const publishedMosques: MosqueEntity[] = JSON.parse(fs.readFileSync(mosquesPath, 'utf8'));
  const allEntities: MosqueEntity[] = JSON.parse(fs.readFileSync(allEntitiesPath, 'utf8'));
  const qualityReport = JSON.parse(fs.readFileSync(qualityReportPath, 'utf8'));

  // 1. Raw files inventory
  const rawFiles = fs.readdirSync(rootDir).filter((f) => f.includes('Germany.json') && !f.startsWith('.'));
  let totalRawCount = 0;
  const rawByFile: Record<string, number> = {};
  const allRawPlaceIds = new Set<string>();
  const rawPlaceIdCounts: Record<string, number> = {};

  for (const f of rawFiles) {
    const records: RawGooglePlaceRecord[] = JSON.parse(fs.readFileSync(path.join(rootDir, f), 'utf8'));
    totalRawCount += records.length;
    rawByFile[f] = records.length;
    for (const r of records) {
      if (r.placeId) {
        allRawPlaceIds.add(r.placeId);
        rawPlaceIdCounts[r.placeId] = (rawPlaceIdCounts[r.placeId] || 0) + 1;
      }
    }
  }

  const crossFileDups = Object.entries(rawPlaceIdCounts).filter(([, count]) => count > 1);

  // 2. Exact Status counts in allEntities
  const statusCounts = {
    PUBLISHED: allEntities.filter((e) => e.dataStatus === 'PUBLISHED').length,
    REVIEWED: allEntities.filter((e) => e.dataStatus === 'REVIEWED').length,
    REJECTED: allEntities.filter((e) => e.dataStatus === 'REJECTED').length,
    total: allEntities.length,
  };

  // 3. Completeness matrix per city for PUBLISHED mosques
  const cities = CITY_CONFIGS.map((c) => c.canonical);
  const cityMatrix: Record<string, any> = {};

  const fields = [
    'canonicalName',
    'slug',
    'address',
    'postalCode',
    'city',
    'latitude',
    'longitude',
    'phone',
    'website',
    'openingHours',
    'organization',
    'description',
    'rating',
    'reviewCount',
    'imageUrl',
    'facilities',
    'lastVerified',
  ] as const;

  for (const city of cities) {
    const cityMosques = publishedMosques.filter((m) => m.city === city);
    const matrix: Record<string, { present: number; missing: number; pct: string }> = {};

    for (const f of fields) {
      let present = 0;
      for (const m of cityMosques) {
        const val = (m as any)[f];
        if (f === 'reviewCount') {
          if (typeof val === 'number' && val > 0) present++;
        } else if (f === 'facilities') {
          if (val && Object.values(val).some((v) => v !== null)) present++;
        } else if (f === 'openingHours') {
          if (Array.isArray(val) && val.length > 0) present++;
        } else if (val !== null && val !== undefined && val !== '') {
          present++;
        }
      }
      matrix[f] = {
        present,
        missing: cityMosques.length - present,
        pct: cityMosques.length > 0 ? ((present / cityMosques.length) * 100).toFixed(1) + '%' : '0%',
      };
    }

    cityMatrix[city] = {
      count: cityMosques.length,
      matrix,
    };
  }

  // Global completeness matrix
  const globalMatrix: Record<string, { present: number; missing: number; pct: string }> = {};
  for (const f of fields) {
    let present = 0;
    for (const m of publishedMosques) {
      const val = (m as any)[f];
      if (f === 'reviewCount') {
        if (typeof val === 'number' && val > 0) present++;
      } else if (f === 'facilities') {
        if (val && Object.values(val).some((v) => v !== null)) present++;
      } else if (f === 'openingHours') {
        if (Array.isArray(val) && val.length > 0) present++;
      } else if (val !== null && val !== undefined && val !== '') {
        present++;
      }
    }
    globalMatrix[f] = {
      present,
      missing: publishedMosques.length - present,
      pct: ((present / publishedMosques.length) * 100).toFixed(1) + '%',
    };
  }

  // 4. Geolocation Audit
  const geoAnomalies: any[] = [];
  // Germany bounding box approx: Lat 47.0 to 55.5, Lng 5.5 to 15.5
  for (const m of publishedMosques) {
    if (typeof m.latitude !== 'number' || typeof m.longitude !== 'number') {
      geoAnomalies.push({ id: m.id, name: m.canonicalName, city: m.city, reason: 'NON_NUMERIC_COORDS' });
    } else if (m.latitude === 0 && m.longitude === 0) {
      geoAnomalies.push({ id: m.id, name: m.canonicalName, city: m.city, reason: 'ZERO_COORDS' });
    } else if (m.latitude < 47.0 || m.latitude > 55.5 || m.longitude < 5.5 || m.longitude > 15.5) {
      geoAnomalies.push({
        id: m.id,
        name: m.canonicalName,
        city: m.city,
        coords: [m.latitude, m.longitude],
        reason: 'OUT_OF_GERMANY_BOUNDS',
      });
    }

    // Check specific city bounds sanity
    const cfg = CITY_CONFIGS.find((c) => c.canonical === m.city) as (typeof CITY_CONFIGS[0] & { lat?: number; lng?: number }) | undefined;
    if (cfg && cfg.lat && cfg.lng) {
      // haversine distance to city center
      const toRad = (x: number) => (x * Math.PI) / 180;
      const R = 6371; // km
      const dLat = toRad(m.latitude - cfg.lat);
      const dLon = toRad(m.longitude - cfg.lng);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(cfg.lat)) * Math.cos(toRad(m.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distKm = R * c;

      // If distance > 45km from city center, flag for review
      if (distKm > 45) {
        geoAnomalies.push({
          id: m.id,
          name: m.canonicalName,
          city: m.city,
          distKm: Math.round(distKm),
          address: m.address,
          postalCode: m.postalCode,
          coords: [m.latitude, m.longitude],
          reason: 'FAR_FROM_CITY_CENTER',
        });
      }
    }
  }

  // 5. Duplicate Audit
  // Check exact placeIds within published
  const seenPublishedPlaceIds = new Map<string, string>();
  const duplicatePlaceIds: any[] = [];
  for (const m of publishedMosques) {
    if (m.placeId) {
      if (seenPublishedPlaceIds.has(m.placeId)) {
        duplicatePlaceIds.push({
          placeId: m.placeId,
          name1: seenPublishedPlaceIds.get(m.placeId),
          name2: m.canonicalName,
          city: m.city,
        });
      } else {
        seenPublishedPlaceIds.set(m.placeId, m.canonicalName);
      }
    }
  }

  // Check same address duplicates within published
  const byAddress = new Map<string, MosqueEntity[]>();
  for (const m of publishedMosques) {
    const key = `${m.city.toLowerCase()}|${m.address.toLowerCase().trim()}`;
    const list = byAddress.get(key) || [];
    list.push(m);
    byAddress.set(key, list);
  }
  const coLocatedOrDuplicateAddresses = Array.from(byAddress.entries())
    .filter(([, list]) => list.length > 1)
    .map(([addr, list]) => ({
      address: addr,
      count: list.length,
      mosques: list.map((m) => ({ id: m.id, name: m.canonicalName, slug: m.slug, phone: m.phone })),
    }));

  // Check phone matches
  const byPhone = new Map<string, MosqueEntity[]>();
  for (const m of publishedMosques) {
    if (m.phone) {
      const cleanPhone = m.phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 7) {
        const list = byPhone.get(cleanPhone) || [];
        list.push(m);
        byPhone.set(cleanPhone, list);
      }
    }
  }
  const phoneDuplicates = Array.from(byPhone.entries())
    .filter(([, list]) => list.length > 1)
    .map(([phone, list]) => ({
      phone,
      count: list.length,
      mosques: list.map((m) => ({ id: m.id, name: m.canonicalName, city: m.city, address: m.address })),
    }));

  // 6. Organization Affiliation Safety
  // Rule: organization must not be assigned solely from name. Must have provenance (domain).
  const orgCheck: any[] = [];
  for (const m of publishedMosques) {
    if (m.organization) {
      // Check website
      const web = m.website?.toLowerCase() || '';
      orgCheck.push({
        name: m.canonicalName,
        city: m.city,
        organization: m.organization,
        website: m.website,
        hasMatchingDomain:
          (m.organization.includes('DITIB') && (web.includes('ditib') || web.includes('diyanet'))) ||
          (m.organization.includes('VIKZ') && web.includes('vikz')) ||
          (m.organization.includes('IGMG') && (web.includes('igmg') || web.includes('milligorus'))) ||
          (m.organization.includes('Ahmadiyya') && web.includes('ahmadiyya')) ||
          (m.organization.includes('ATIB') && web.includes('atib')),
      });
    }
  }

  // 7. Slug audit
  // Per-city slug collisions
  const citySlugCounts = new Map<string, number>();
  const slugCollisionsInCity: string[] = [];
  for (const m of publishedMosques) {
    const key = `${m.city}|${m.slug}`;
    const cnt = (citySlugCounts.get(key) || 0) + 1;
    citySlugCounts.set(key, cnt);
    if (cnt > 1) {
      slugCollisionsInCity.push(key);
    }
  }

  // Cross-city identical slugs (these SHOULD exist and be allowed)
  const crossCitySlugs = new Map<string, string[]>();
  for (const m of publishedMosques) {
    const list = crossCitySlugs.get(m.slug) || [];
    list.push(m.city);
    crossCitySlugs.set(m.slug, list);
  }
  const allowedCrossCitySlugs = Array.from(crossCitySlugs.entries())
    .filter(([, cities]) => cities.length > 1)
    .map(([slug, cities]) => ({ slug, cities }));

  // 8. Sitemap calculation & route checking
  const sitemapCounts = {
    home: 3,
    search: 3,
    cityPages: cities.length * 3, // 9 * 3 = 27
    detailPages: publishedMosques.length * 3, // 443 * 3 = 1329
    total: 3 + 3 + cities.length * 3 + publishedMosques.length * 3, // 1362
  };

  return {
    dataset: {
      rawFiles,
      totalRawCount,
      rawByFile,
      uniqueRawPlaceIds: allRawPlaceIds.size,
      crossFileDuplicatePlaceIdsCount: crossFileDups.length,
      statusCounts,
    },
    completeness: {
      globalMatrix,
      cityMatrix,
    },
    geo: {
      totalPublishedChecked: publishedMosques.length,
      anomalies: geoAnomalies,
    },
    duplicates: {
      duplicatePlaceIds,
      coLocatedOrDuplicateAddresses,
      phoneDuplicates,
    },
    organizations: {
      totalWithOrganization: orgCheck.length,
      entities: orgCheck,
    },
    slugs: {
      slugCollisionsInCity,
      allowedCrossCitySlugs,
    },
    sitemap: sitemapCounts,
  };
}

const res = runAudit();
fs.writeFileSync(
  path.join(__dirname, '..', 'scripts', 'audit-phase2b-results.json'),
  JSON.stringify(res, null, 2),
  'utf8'
);
console.log('Phase 2B Audit Completed. Results saved to scripts/audit-phase2b-results.json');
console.log('Status counts:', res.dataset.statusCounts);
console.log('Geo anomalies:', res.geo.anomalies.length);
console.log('City slug collisions:', res.slugs.slugCollisionsInCity.length);
console.log('Cross-city shared slugs (legitimate):', res.slugs.allowedCrossCitySlugs.length);
console.log('Co-located or shared address groups:', res.duplicates.coLocatedOrDuplicateAddresses.length);
console.log('Phone duplicate groups:', res.duplicates.phoneDuplicates.length);
