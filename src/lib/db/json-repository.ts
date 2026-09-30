import fs from 'fs';
import path from 'path';
import { MosqueEntity, DataQualityReport, DataStatus } from '@/pipeline/types';
import { MosqueRepository, SearchFilters, MosqueWithDistance } from './types';
import { haversineDistanceKm, isOpenNow } from './geo';
import { CITY_CONFIGS, getPublishedCityConfigs } from '@/pipeline/city-config';
import { normalizeGermanPhonetic } from '@/lib/normalize';

// Re-export for backwards compatibility with tests that import from here
export { normalizeGermanPhonetic };

export class JsonMosqueRepository implements MosqueRepository {
  private mosques: MosqueEntity[] = [];
  private allEntities: MosqueEntity[] = [];
  private report: DataQualityReport | null = null;
  private dataDir: string;

  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'src', 'data');
    this.loadData();
  }

  private loadData() {
    try {
      const mosquesPath = path.join(this.dataDir, 'mosques.json');
      if (fs.existsSync(mosquesPath)) {
        this.mosques = JSON.parse(fs.readFileSync(mosquesPath, 'utf8'));
      }

      const allPath = path.join(this.dataDir, 'all-entities.json');
      if (fs.existsSync(allPath)) {
        this.allEntities = JSON.parse(fs.readFileSync(allPath, 'utf8'));
      } else {
        this.allEntities = [...this.mosques];
      }

      const reportPath = path.join(this.dataDir, 'data-quality-report.json');
      if (fs.existsSync(reportPath)) {
        this.report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      }
    } catch (err) {
      console.error('Error loading JSON repository data:', err);
    }
  }

  async getAllPublished(filters?: SearchFilters): Promise<MosqueWithDistance[]> {
    let results: MosqueWithDistance[] = this.mosques.map((m) => ({ ...m }));

    if (!filters) return results;

    // 1. Text search query (name, address, postalCode, district, canonical, translations)
    if (filters.query && filters.query.trim().length > 0) {
      const qRaw = filters.query.trim().toLowerCase();
      const qNorm = normalizeGermanPhonetic(filters.query);

      results = results.filter((m) => {
        const titleRaw = m.canonicalName.toLowerCase();
        const titleNorm = normalizeGermanPhonetic(m.canonicalName);
        const deNameNorm = normalizeGermanPhonetic(m.translations.de?.name || '');
        const enNameNorm = normalizeGermanPhonetic(m.translations.en?.name || '');
        const arNameRaw = m.translations.ar?.name || '';
        const addressNorm = normalizeGermanPhonetic(m.address);
        const cityNorm = normalizeGermanPhonetic(m.city);
        const districtNorm = m.district ? normalizeGermanPhonetic(m.district) : '';
        const postalMatch = m.postalCode.includes(qRaw);
        const orgNorm = m.organization ? normalizeGermanPhonetic(m.organization) : '';

        return (
          titleRaw.includes(qRaw) ||
          titleNorm.includes(qNorm) ||
          deNameNorm.includes(qNorm) ||
          enNameNorm.includes(qNorm) ||
          arNameRaw.includes(qRaw) ||
          addressNorm.includes(qNorm) ||
          cityNorm.includes(qNorm) ||
          districtNorm.includes(qNorm) ||
          postalMatch ||
          orgNorm.includes(qNorm)
        );
      });
    }

    // 2. City filter
    if (filters.city) {
      const c = normalizeGermanPhonetic(filters.city);
      results = results.filter((m) => {
        const mCity = normalizeGermanPhonetic(m.city);
        return mCity === c || (c === 'cologne' && mCity === 'koln');
      });
    }

    // 3. District filter
    if (filters.district) {
      const d = normalizeGermanPhonetic(filters.district);
      results = results.filter((m) => m.district && normalizeGermanPhonetic(m.district) === d);
    }

    // 4. Postal Code filter
    if (filters.postalCode) {
      const targetPostal = filters.postalCode.trim();
      results = results.filter((m) => m.postalCode === targetPostal);
    }

    // 5. Category filter
    if (filters.category) {
      results = results.filter((m) => m.category === filters.category);
    }

    // 6. Facilities filter
    if (filters.facilities) {
      const f = filters.facilities;
      results = results.filter((m) => {
        if (f.parking && !m.facilities.parking) return false;
        if (f.wheelchairAccessible && !m.facilities.wheelchairAccessible) return false;
        if (f.restroom && !m.facilities.restroom) return false;
        if (f.womenArea && !m.facilities.womenArea) return false;
        if (f.wudu && !m.facilities.wudu) return false;
        return true;
      });
    }

    // 7. Open now only (only applies when opening hour data exists)
    if (filters.openNowOnly) {
      const now = new Date();
      results = results.filter((m) => {
        const open = isOpenNow(m.openingHours, now);
        return open === true;
      });
    }

    // 8. Distance calculation from user location
    if (filters.userLocation) {
      const { latitude, longitude } = filters.userLocation;
      results = results.map((m) => ({
        ...m,
        distanceKm: haversineDistanceKm(latitude, longitude, m.latitude, m.longitude),
      }));

      results.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));

      if (filters.maxDistanceKm) {
        results = results.filter((m) => (m.distanceKm ?? 0) <= filters.maxDistanceKm!);
      }
    }

    if (filters.offset !== undefined || filters.limit !== undefined) {
      const start = filters.offset || 0;
      const end = filters.limit ? start + filters.limit : results.length;
      results = results.slice(start, end);
    }

    return results;
  }

  async getByCityAndSlug(city: string, slug: string): Promise<MosqueEntity | null> {
    const c = normalizeGermanPhonetic(city);
    const cleanSlug = slug.toLowerCase().trim();

    return (
      this.mosques.find((m) => {
        const mCity = normalizeGermanPhonetic(m.city);
        // Direct phonetic match
        if (mCity === c && m.slug.toLowerCase() === cleanSlug) return true;
        // Alias resolution: e.g. cologne→koeln, munich→muenchen
        const config = CITY_CONFIGS.find(
          (cfg) =>
            cfg.slug === c ||
            cfg.englishSlug === c ||
            cfg.aliases.some((a: string) => normalizeGermanPhonetic(a) === c)
        );
        if (config) {
          const canonicalNorm = normalizeGermanPhonetic(config.canonical);
          return mCity === canonicalNorm && m.slug.toLowerCase() === cleanSlug;
        }
        return false;
      }) || null
    );
  }

  async getBySlug(slug: string, city?: string): Promise<MosqueEntity | null> {
    if (city) {
      return this.getByCityAndSlug(city, slug);
    }
    const clean = slug.toLowerCase().trim();
    return this.mosques.find((m) => m.slug.toLowerCase() === clean) || null;
  }

  async getByCity(city: string): Promise<MosqueEntity[]> {
    const c = normalizeGermanPhonetic(city);
    const config = CITY_CONFIGS.find(
      (cfg) =>
        cfg.slug === c ||
        cfg.englishSlug === c ||
        cfg.aliases.some((a: string) => normalizeGermanPhonetic(a) === c)
    );
    const canonicalNorm = config ? normalizeGermanPhonetic(config.canonical) : c;
    return this.mosques.filter((m) => normalizeGermanPhonetic(m.city) === canonicalNorm);
  }

  async getByDistrict(city: string, district: string): Promise<MosqueEntity[]> {
    const cityResults = await this.getByCity(city);
    const d = normalizeGermanPhonetic(district);
    return cityResults.filter(
      (m) => m.district && normalizeGermanPhonetic(m.district) === d
    );
  }

  async getNearby(
    latitude: number,
    longitude: number,
    limit: number = 6,
    excludeSlug?: string,
    excludeId?: string
  ): Promise<MosqueWithDistance[]> {
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude <= 0 ||
      longitude <= 0
    ) {
      return [];
    }

    const publishedCityConfigs = getPublishedCityConfigs();
    const publishedCityNames = new Set(publishedCityConfigs.map((c) => c.canonical.toLowerCase()));

    const eligible = this.mosques.filter((m) => {
      // Must be PUBLISHED
      if (m.dataStatus !== 'PUBLISHED') return false;
      // Exclude current mosque
      if (excludeSlug && m.slug === excludeSlug) return false;
      if (excludeId && m.id === excludeId) return false;
      // Valid coordinates within Germany bounds (lat: 47-55.5, lon: 5.5-15.5)
      if (
        typeof m.latitude !== 'number' ||
        typeof m.longitude !== 'number' ||
        isNaN(m.latitude) ||
        isNaN(m.longitude) ||
        m.latitude < 47 ||
        m.latitude > 55.5 ||
        m.longitude < 5.5 ||
        m.longitude > 15.5
      ) {
        return false;
      }
      // Must belong to a published city
      if (!m.city || !publishedCityNames.has(m.city.toLowerCase())) {
        return false;
      }
      // Must have valid slug
      if (!m.slug || typeof m.slug !== 'string' || m.slug.trim().length === 0) {
        return false;
      }
      return true;
    });

    const withDist = eligible.map((m) => ({
      ...m,
      distanceKm: haversineDistanceKm(latitude, longitude, m.latitude, m.longitude),
    }));

    withDist.sort((a, b) => (a.distanceKm ?? 999999) - (b.distanceKm ?? 999999));
    return withDist.slice(0, limit);
  }

  async getCities(): Promise<Array<{ name: string; slug: string; count: number; state: string }>> {
    const map = new Map<string, { count: number; state: string }>();
    this.mosques.forEach((m) => {
      const entry = map.get(m.city) || { count: 0, state: m.state };
      entry.count++;
      map.set(m.city, entry);
    });

    return Array.from(map.entries()).map(([name, data]) => {
      const config = CITY_CONFIGS.find((c) => c.canonical === name);
      const slug = config?.slug ||
        name.toLowerCase()
          .replace(/ä/g, 'ae')
          .replace(/ö/g, 'oe')
          .replace(/ü/g, 'ue')
          .replace(/ß/g, 'ss')
          .replace(/[^a-z0-9]+/g, '-');
      return { name, slug, count: data.count, state: data.state };
    });
  }


  async getDistricts(city: string): Promise<Array<{ name: string; count: number }>> {
    const cityMosques = await this.getByCity(city);
    const map = new Map<string, number>();
    cityMosques.forEach((m) => {
      if (m.district) {
        map.set(m.district, (map.get(m.district) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getDataQualityReport(): Promise<DataQualityReport> {
    if (this.report) return this.report;
    return {
      timestamp: new Date().toISOString(),
      totalRawRecords: this.allEntities.length,
      normalizedRecords: this.allEntities.length,
      publishableRecords: this.mosques.length,
      reviewedRecords: this.allEntities.filter((e) => e.dataStatus === 'REVIEWED').length,
      rejectedRecords: this.allEntities.filter((e) => e.dataStatus === 'REJECTED').length,
      validCoordinatesCount: this.allEntities.length,
      missingWebsiteCount: this.allEntities.filter((e) => !e.website).length,
      missingPhoneCount: this.allEntities.filter((e) => !e.phone).length,
      missingHoursCount: this.allEntities.filter((e) => !e.openingHours).length,
      categoriesBreakdown: {},
      districtsBreakdown: {},
      duplicateCandidates: [],
    };
  }

  async getAllEntitiesForAdmin(): Promise<MosqueEntity[]> {
    return this.allEntities;
  }

  async updateEntityStatus(id: string, status: DataStatus): Promise<boolean> {
    const entity = this.allEntities.find((e) => e.id === id);
    if (!entity) return false;
    entity.dataStatus = status;
    entity.updatedAt = new Date().toISOString();

    this.mosques = this.allEntities.filter((e) => e.dataStatus === 'PUBLISHED');

    try {
      fs.writeFileSync(path.join(this.dataDir, 'all-entities.json'), JSON.stringify(this.allEntities, null, 2));
      fs.writeFileSync(path.join(this.dataDir, 'mosques.json'), JSON.stringify(this.mosques, null, 2));
      return true;
    } catch (e) {
      console.error('Failed to write updated entities:', e);
      return false;
    }
  }
}
