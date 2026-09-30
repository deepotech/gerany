import { MosqueEntity, DataQualityReport, DataStatus } from '@/pipeline/types';

export interface SearchFilters {
  query?: string;
  city?: string;
  district?: string;
  postalCode?: string;
  category?: string;
  openNowOnly?: boolean;
  facilities?: {
    parking?: boolean;
    womenArea?: boolean;
    wheelchairAccessible?: boolean;
    restroom?: boolean;
    wudu?: boolean;
  };
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  maxDistanceKm?: number;
  limit?: number;
  offset?: number;
}

export interface MosqueWithDistance extends MosqueEntity {
  distanceKm?: number;
}

export interface MosqueRepository {
  getAllPublished(filters?: SearchFilters): Promise<MosqueWithDistance[]>;
  getByCityAndSlug(city: string, slug: string): Promise<MosqueEntity | null>;
  getBySlug(slug: string, city?: string): Promise<MosqueEntity | null>;
  getByCity(city: string): Promise<MosqueEntity[]>;
  getByDistrict(city: string, district: string): Promise<MosqueEntity[]>;
  getNearby(latitude: number, longitude: number, limit?: number, excludeSlug?: string, excludeId?: string): Promise<MosqueWithDistance[]>;
  getCities(): Promise<Array<{ name: string; slug: string; count: number; state: string }>>;
  getDistricts(city: string): Promise<Array<{ name: string; count: number }>>;
  getDataQualityReport(): Promise<DataQualityReport>;
  getAllEntitiesForAdmin(): Promise<MosqueEntity[]>;
  updateEntityStatus(id: string, status: DataStatus): Promise<boolean>;
}
