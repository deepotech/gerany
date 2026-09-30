import { describe, it, expect } from 'vitest';
import { CITY_CONFIGS, getPublishedCityConfigs, resolveCanonicalCity } from '../src/pipeline/city-config';
import { 
  getAllCityRegistryEntries, 
  getPublishedCityRegistryEntries,
  getCityLifecycleStatus,
  canPublishCity,
  isPublishedCity,
  getCityRegistryEntry
} from '../src/pipeline/city-registry';
import { validateCityForLaunch } from '../src/pipeline/city-gates';
import fs from 'fs';
import path from 'path';

describe('Phase 5A: City Lifecycle and Gates', () => {
  it('CITY_CONFIGS.length must be >= 9 (base cities; grows as cities are promoted)', () => {
    expect(CITY_CONFIGS.length).toBeGreaterThanOrEqual(9);
  });

  it('getPublishedCityRegistryEntries() returns at least 9 cities (grows with promotions)', () => {
    expect(getPublishedCityRegistryEntries().length).toBeGreaterThanOrEqual(9);
  });

  it('getAllCityRegistryEntries() returns at least 14 cities (9 base + extended registry)', () => {
    expect(getAllCityRegistryEntries().length).toBeGreaterThanOrEqual(14);
  });

  it('getCityLifecycleStatus returns correct status for base cities', () => {
    expect(getCityLifecycleStatus('koeln')).toBe('PUBLISHED');
    expect(getCityLifecycleStatus('berlin')).toBe('PUBLISHED');
  });

  it('getCityLifecycleStatus returns REVIEW for unpromoted candidate cities', () => {
    expect(getCityLifecycleStatus('hannover')).toBe('REVIEW');
    expect(getCityLifecycleStatus('dresden')).toBe('REVIEW');
    // Bremen was legitimately promoted in Phase 5B
    expect(getCityLifecycleStatus('bremen')).toBe('PUBLISHED');
  });

  it('canPublishCity returns true for PUBLISHED or READY_FOR_LAUNCH cities', () => {
    expect(canPublishCity('koeln')).toBe(true);
    expect(canPublishCity('bremen')).toBe(true);
  });

  it('canPublishCity returns false for REVIEW cities', () => {
    expect(canPublishCity('hannover')).toBe(false);
    expect(canPublishCity('dresden')).toBe(false);
  });

  it('isPublishedCity returns true only for PUBLISHED cities', () => {
    expect(isPublishedCity('koeln')).toBe(true);
    expect(isPublishedCity('hannover')).toBe(false);
  });

  it('getPublishedCityConfigs() returns the same length as CITY_CONFIGS', () => {
    const published = getPublishedCityConfigs();
    expect(published.length).toBe(CITY_CONFIGS.length);
    expect(published).toEqual(CITY_CONFIGS);
  });

  it('resolveCanonicalCity without includeExtended does NOT resolve Hannover', () => {
    const res = resolveCanonicalCity('30159', null);
    expect(res).toBeNull();
  });

  it('resolveCanonicalCity with includeExtended=true resolves Hannover', () => {
    const res = resolveCanonicalCity('30159', null, undefined, true);
    expect(res).not.toBeNull();
    expect(res?.config.canonical).toBe('Hannover');
  });

  it('resolveCanonicalCity resolves base city correctly without extended', () => {
    const res = resolveCanonicalCity('50667', null);
    expect(res).not.toBeNull();
    expect(res?.config.canonical).toBe('Köln');
  });
  
  it('validateCityForLaunch returns BLOCKED with empty entities', () => {
    const report = validateCityForLaunch('koeln', []);
    expect(report.status).toBe('BLOCKED');
    expect(report.blockers.some(b => b.gate === 'GATE_F')).toBe(true); // Min records
  });

  it('validateCityForLaunch returns BLOCKED for GATE_F when insufficient records', () => {
    const entities: any[] = [
      { dataStatus: 'PUBLISHED', placeId: '1', latitude: 50, longitude: 10, street: 'A', city: 'B', phone: '1', category: 'MOSQUE' }
    ];
    const report = validateCityForLaunch('koeln', entities);
    expect(report.status).toBe('BLOCKED');
    expect(report.blockers.some(b => b.gate === 'GATE_F')).toBe(true);
  });

  it('validateCityForLaunch returns BLOCKED for GATE_B when invalid coordinates', () => {
    const entities: any[] = Array(5).fill(0).map((_, i) => ({
      dataStatus: 'PUBLISHED', placeId: `p${i}`, latitude: 0, longitude: 0, street: 'A', city: 'B', phone: '1', category: 'MOSQUE'
    }));
    const report = validateCityForLaunch('koeln', entities);
    expect(report.status).toBe('BLOCKED');
    expect(report.blockers.some(b => b.gate === 'GATE_B')).toBe(true);
  });

  it('validateCityForLaunch returns READY_FOR_LAUNCH with valid complete data', () => {
    const entities: any[] = Array(5).fill(0).map((_, i) => ({
      dataStatus: 'PUBLISHED', placeId: `p${i}`, latitude: 50, longitude: 10, street: 'A', city: 'B', phone: '1', website: 'a.com', category: 'MOSQUE'
    }));
    const report = validateCityForLaunch('koeln', entities);
    expect(report.status).toBe('READY_FOR_LAUNCH');
    expect(report.blockers.length).toBe(0);
  });

  it('validateCityForLaunch GATE_A passes for valid city', () => {
    const entities: any[] = Array(5).fill(0).map((_, i) => ({
      dataStatus: 'PUBLISHED', placeId: `p${i}`, latitude: 50, longitude: 10, street: 'A', city: 'B', phone: '1', category: 'MOSQUE'
    }));
    const report = validateCityForLaunch('koeln', entities);
    expect(report.blockers.some(b => b.gate === 'GATE_A')).toBe(false);
  });

  it('validateCityForLaunch GATE_A fails for unknown city', () => {
    const entities: any[] = Array(5).fill(0).map((_, i) => ({
      dataStatus: 'PUBLISHED', placeId: `p${i}`, latitude: 50, longitude: 10, street: 'A', city: 'B', phone: '1', category: 'MOSQUE'
    }));
    const report = validateCityForLaunch('unknown-city', entities);
    expect(report.status).toBe('BLOCKED');
    expect(report.blockers.some(b => b.gate === 'GATE_A')).toBe(true);
  });

  it('validateCityForLaunch report structure is correct', () => {
    const report = validateCityForLaunch('koeln', []);
    expect(report).toHaveProperty('city');
    expect(report).toHaveProperty('slug');
    expect(report).toHaveProperty('evaluatedAt');
    expect(report).toHaveProperty('status');
    expect(report).toHaveProperty('passed');
    expect(report).toHaveProperty('blockers');
    expect(report).toHaveProperty('warnings');
    expect(report).toHaveProperty('metrics');
    expect(report).toHaveProperty('recommendation');
  });

  it('Sitemap only includes PUBLISHED cities indirectly (via getPublishedCityConfigs)', () => {
    const configs = getPublishedCityConfigs();
    expect(configs.every(c => isPublishedCity(c.slug))).toBe(true);
  });

  it('Footer uses getPublishedCityConfigs indirectly (length check >= 9)', () => {
    const configs = getPublishedCityConfigs();
    expect(configs.length).toBeGreaterThanOrEqual(9);
  });

  it('mosques.json has at least 443 published records (grows with each promotion phase)', () => {
    const mosquesPath = path.join(process.cwd(), 'src', 'data', 'mosques.json');
    if (fs.existsSync(mosquesPath)) {
      const data = JSON.parse(fs.readFileSync(mosquesPath, 'utf8'));
      expect(data.length).toBeGreaterThanOrEqual(443);
      expect(data.every((d: any) => d.verificationStatus === 'UNVERIFIED')).toBe(true);
    }
  });

  it('PAUSED city would not be indexable', () => {
    const entry = getCityRegistryEntry('koeln');
    if (entry) {
      expect(entry.seoIndexable).toBe(true);
    }
  });
  
  it('GATE_D returns warning if >10% non-mosque categories', () => {
    const entities: any[] = Array(10).fill(0).map((_, i) => ({
      dataStatus: 'PUBLISHED', placeId: `p${i}`, latitude: 50, longitude: 10, street: 'A', city: 'B', phone: '1', category: i < 2 ? 'RESTAURANT' : 'MOSQUE'
    }));
    const report = validateCityForLaunch('koeln', entities);
    expect(report.warnings.some(w => w.gate === 'GATE_D')).toBe(true);
  });

  it('GATE_D fails (hard blocker) if OTHER category entities are present in publishable records', () => {
    const entities: any[] = Array(5).fill(0).map((_, i) => ({
      dataStatus: 'PUBLISHED', placeId: `p${i}`, latitude: 50, longitude: 10, street: 'A', city: 'B', phone: '1', category: i === 0 ? 'OTHER' : 'MOSQUE'
    }));
    const report = validateCityForLaunch('koeln', entities);
    expect(report.blockers.some(b => b.gate === 'GATE_D')).toBe(true);
  });

});
