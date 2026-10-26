import fs from 'fs';
import path from 'path';

export type CityLifecycleStatus = 'DISCOVERED' | 'REVIEW' | 'VALIDATED' | 'READY_FOR_LAUNCH' | 'PUBLISHED' | 'PAUSED';

export interface CityRegistryEntry {
  id: string;           // lowercase slug used as key
  canonical: string;    // German canonical name e.g. 'Köln'
  slug: string;         // Latin slug e.g. 'koeln'
  englishSlug: string;
  nameEn: string;
  nameAr?: string;
  state: string;
  country: string;
  status: CityLifecycleStatus;
  publicationEnabled: boolean;  // true only if status === 'PUBLISHED'
  seoIndexable: boolean;        // true only if status === 'PUBLISHED' AND records exist
  launchedAt?: string;          // ISO datetime when promoted to PUBLISHED
  pausedAt?: string;            // ISO datetime when paused
  minPublishedRecords: number;  // gate threshold
  postalMin: number;
  postalMax: number;
  aliases: string[];
}

const DEFAULT_REGISTRY: CityRegistryEntry[] = [
  {
    id: 'koeln',
    canonical: 'Köln',
    slug: 'koeln',
    englishSlug: 'cologne',
    nameEn: 'Cologne',
    state: 'Nordrhein-Westfalen',
    country: 'Germany',
    status: 'PUBLISHED',
    publicationEnabled: true,
    seoIndexable: true,
    minPublishedRecords: 5,
    postalMin: 50667,
    postalMax: 51149,
    aliases: ['koeln', 'cologne', 'Cologne', 'Köln'],
  },
  {
    id: 'berlin',
    canonical: 'Berlin',
    slug: 'berlin',
    englishSlug: 'berlin',
    nameEn: 'Berlin',
    state: 'Berlin',
    country: 'Germany',
    status: 'PUBLISHED',
    publicationEnabled: true,
    seoIndexable: true,
    minPublishedRecords: 5,
    postalMin: 10115,
    postalMax: 14199,
    aliases: ['berlin', 'Berlin'],
  },
  {
    id: 'hamburg',
    canonical: 'Hamburg',
    slug: 'hamburg',
    englishSlug: 'hamburg',
    nameEn: 'Hamburg',
    state: 'Hamburg',
    country: 'Germany',
    status: 'PUBLISHED',
    publicationEnabled: true,
    seoIndexable: true,
    minPublishedRecords: 5,
    postalMin: 20001,
    postalMax: 22999,
    aliases: ['hamburg', 'Hamburg'],
  },
  {
    id: 'muenchen',
    canonical: 'München',
    slug: 'muenchen',
    englishSlug: 'munich',
    nameEn: 'Munich',
    state: 'Bayern',
    country: 'Germany',
    status: 'PUBLISHED',
    publicationEnabled: true,
    seoIndexable: true,
    minPublishedRecords: 5,
    postalMin: 80001,
    postalMax: 81999,
    aliases: ['muenchen', 'munich', 'Munich', 'München'],
  },
  {
    id: 'frankfurt',
    canonical: 'Frankfurt',
    slug: 'frankfurt',
    englishSlug: 'frankfurt',
    nameEn: 'Frankfurt',
    state: 'Hessen',
    country: 'Germany',
    status: 'PUBLISHED',
    publicationEnabled: true,
    seoIndexable: true,
    minPublishedRecords: 5,
    postalMin: 60001,
    postalMax: 60599,
    aliases: ['frankfurt', 'Frankfurt', 'Frankfurt am Main', 'Frankfurt Am Main'],
  },
  {
    id: 'duesseldorf',
    canonical: 'Düsseldorf',
    slug: 'duesseldorf',
    englishSlug: 'duesseldorf',
    nameEn: 'Dusseldorf',
    state: 'Nordrhein-Westfalen',
    country: 'Germany',
    status: 'PUBLISHED',
    publicationEnabled: true,
    seoIndexable: true,
    minPublishedRecords: 5,
    postalMin: 40001,
    postalMax: 40629,
    aliases: ['duesseldorf', 'düsseldorf', 'Düsseldorf'],
  },
  {
    id: 'stuttgart',
    canonical: 'Stuttgart',
    slug: 'stuttgart',
    englishSlug: 'stuttgart',
    nameEn: 'Stuttgart',
    state: 'Baden-Württemberg',
    country: 'Germany',
    status: 'PUBLISHED',
    publicationEnabled: true,
    seoIndexable: true,
    minPublishedRecords: 5,
    postalMin: 70001,
    postalMax: 70629,
    aliases: ['stuttgart', 'Stuttgart'],
  },
  {
    id: 'dortmund',
    canonical: 'Dortmund',
    slug: 'dortmund',
    englishSlug: 'dortmund',
    nameEn: 'Dortmund',
    state: 'Nordrhein-Westfalen',
    country: 'Germany',
    status: 'PUBLISHED',
    publicationEnabled: true,
    seoIndexable: true,
    minPublishedRecords: 5,
    postalMin: 44001,
    postalMax: 44399,
    aliases: ['dortmund', 'Dortmund'],
  },
  {
    id: 'essen',
    canonical: 'Essen',
    slug: 'essen',
    englishSlug: 'essen',
    nameEn: 'Essen',
    state: 'Nordrhein-Westfalen',
    country: 'Germany',
    status: 'PUBLISHED',
    publicationEnabled: true,
    seoIndexable: true,
    minPublishedRecords: 5,
    postalMin: 45001,
    postalMax: 45359,
    aliases: ['essen', 'Essen'],
  },
  {
    id: 'hannover',
    canonical: 'Hannover',
    slug: 'hannover',
    englishSlug: 'hanover',
    nameEn: 'Hanover',
    state: 'Niedersachsen',
    country: 'Germany',
    status: 'REVIEW',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 30159,
    postalMax: 30669,
    aliases: ['hannover', 'Hanover', 'Hannover'],
  },
  {
    id: 'bremen',
    canonical: 'Bremen',
    slug: 'bremen',
    englishSlug: 'bremen',
    nameEn: 'Bremen',
    state: 'Bremen',
    country: 'Germany',
    status: 'REVIEW',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 28195,
    postalMax: 28779,
    aliases: ['bremen', 'Bremen'],
  },
  {
    id: 'nuernberg',
    canonical: 'Nürnberg',
    slug: 'nuernberg',
    englishSlug: 'nuremberg',
    nameEn: 'Nuremberg',
    state: 'Bayern',
    country: 'Germany',
    status: 'REVIEW',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 90402,
    postalMax: 90491,
    aliases: ['nuernberg', 'nürnberg', 'Nürnberg', 'Nuremberg'],
  },
  {
    id: 'leipzig',
    canonical: 'Leipzig',
    slug: 'leipzig',
    englishSlug: 'leipzig',
    nameEn: 'Leipzig',
    state: 'Sachsen',
    country: 'Germany',
    status: 'REVIEW',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 4001,
    postalMax: 4579,
    aliases: ['leipzig', 'Leipzig'],
  },
  {
    id: 'dresden',
    canonical: 'Dresden',
    slug: 'dresden',
    englishSlug: 'dresden',
    nameEn: 'Dresden',
    state: 'Sachsen',
    country: 'Germany',
    status: 'REVIEW',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 1001,
    postalMax: 1477,
    aliases: ['dresden', 'Dresden'],
  }
];

export const CANDIDATE_CITIES_5B: CityRegistryEntry[] = [
  {
    id: 'duisburg',
    canonical: 'Duisburg',
    slug: 'duisburg',
    englishSlug: 'duisburg',
    nameEn: 'Duisburg',
    state: 'Nordrhein-Westfalen',
    country: 'Germany',
    status: 'REVIEW',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 47051,
    postalMax: 47279,
    aliases: ['duisburg', 'Duisburg'],
  },
  {
    id: 'bochum',
    canonical: 'Bochum',
    slug: 'bochum',
    englishSlug: 'bochum',
    nameEn: 'Bochum',
    state: 'Nordrhein-Westfalen',
    country: 'Germany',
    status: 'REVIEW',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 44787,
    postalMax: 44894,
    aliases: ['bochum', 'Bochum'],
  },
  {
    id: 'wuppertal',
    canonical: 'Wuppertal',
    slug: 'wuppertal',
    englishSlug: 'wuppertal',
    nameEn: 'Wuppertal',
    state: 'Nordrhein-Westfalen',
    country: 'Germany',
    status: 'REVIEW',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 42103,
    postalMax: 42399,
    aliases: ['wuppertal', 'Wuppertal'],
  },
  {
    id: 'bonn',
    canonical: 'Bonn',
    slug: 'bonn',
    englishSlug: 'bonn',
    nameEn: 'Bonn',
    state: 'Nordrhein-Westfalen',
    country: 'Germany',
    status: 'REVIEW',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 53111,
    postalMax: 53229,
    aliases: ['bonn', 'Bonn'],
  },
  {
    id: 'mannheim',
    canonical: 'Mannheim',
    slug: 'mannheim',
    englishSlug: 'mannheim',
    nameEn: 'Mannheim',
    state: 'Baden-Württemberg',
    country: 'Germany',
    status: 'REVIEW',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 68159,
    postalMax: 68309,
    aliases: ['mannheim', 'Mannheim'],
  },
];

export const CANDIDATE_CITIES_BATCH1: CityRegistryEntry[] = [
  {
    id: 'bielefeld',
    canonical: 'Bielefeld',
    slug: 'bielefeld',
    englishSlug: 'bielefeld',
    nameEn: 'Bielefeld',
    nameAr: 'بيليفيلد',
    state: 'Nordrhein-Westfalen',
    country: 'Germany',
    status: 'DISCOVERED',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 33602,
    postalMax: 33739,
    aliases: ['bielefeld', 'Bielefeld'],
  },
  {
    id: 'muenster',
    canonical: 'Münster',
    slug: 'muenster',
    englishSlug: 'muenster',
    nameEn: 'Muenster',
    nameAr: 'مونستر',
    state: 'Nordrhein-Westfalen',
    country: 'Germany',
    status: 'DISCOVERED',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 48143,
    postalMax: 48167,
    aliases: ['muenster', 'münster', 'Münster', 'Muenster'],
  },
  {
    id: 'karlsruhe',
    canonical: 'Karlsruhe',
    slug: 'karlsruhe',
    englishSlug: 'karlsruhe',
    nameEn: 'Karlsruhe',
    nameAr: 'كارلسروه',
    state: 'Baden-Württemberg',
    country: 'Germany',
    status: 'DISCOVERED',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 76131,
    postalMax: 76229,
    aliases: ['karlsruhe', 'Karlsruhe'],
  },
  {
    id: 'augsburg',
    canonical: 'Augsburg',
    slug: 'augsburg',
    englishSlug: 'augsburg',
    nameEn: 'Augsburg',
    nameAr: 'أوغسبورغ',
    state: 'Bayern',
    country: 'Germany',
    status: 'DISCOVERED',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 86150,
    postalMax: 86199,
    aliases: ['augsburg', 'Augsburg'],
  },
  {
    id: 'aachen',
    canonical: 'Aachen',
    slug: 'aachen',
    englishSlug: 'aachen',
    nameEn: 'Aachen',
    nameAr: 'آخن',
    state: 'Nordrhein-Westfalen',
    country: 'Germany',
    status: 'DISCOVERED',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 52062,
    postalMax: 52080,
    aliases: ['aachen', 'Aachen'],
  },
];

export const CANDIDATE_CITIES_BATCH2: CityRegistryEntry[] = [
  {
    id: 'mainz',
    canonical: 'Mainz',
    slug: 'mainz',
    englishSlug: 'mainz',
    nameEn: 'Mainz',
    nameAr: 'ماينتس',
    state: 'Rheinland-Pfalz',
    country: 'Germany',
    status: 'DISCOVERED',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 55116,
    postalMax: 55131,
    aliases: ['mainz', 'Mainz'],
  },
  {
    id: 'wiesbaden',
    canonical: 'Wiesbaden',
    slug: 'wiesbaden',
    englishSlug: 'wiesbaden',
    nameEn: 'Wiesbaden',
    nameAr: 'فيسبادن',
    state: 'Hessen',
    country: 'Germany',
    status: 'DISCOVERED',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 65183,
    postalMax: 65207,
    aliases: ['wiesbaden', 'Wiesbaden'],
  },
  {
    id: 'kiel',
    canonical: 'Kiel',
    slug: 'kiel',
    englishSlug: 'kiel',
    nameEn: 'Kiel',
    nameAr: 'كيل',
    state: 'Schleswig-Holstein',
    country: 'Germany',
    status: 'DISCOVERED',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 24103,
    postalMax: 24159,
    aliases: ['kiel', 'Kiel'],
  },
  {
    id: 'luebeck',
    canonical: 'Lübeck',
    slug: 'luebeck',
    englishSlug: 'luebeck',
    nameEn: 'Luebeck',
    nameAr: 'لوبيك',
    state: 'Schleswig-Holstein',
    country: 'Germany',
    status: 'DISCOVERED',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 23552,
    postalMax: 23570,
    aliases: ['luebeck', 'lübeck', 'Lübeck', 'Luebeck'],
  },
  {
    id: 'saarbruecken',
    canonical: 'Saarbrücken',
    slug: 'saarbruecken',
    englishSlug: 'saarbruecken',
    nameEn: 'Saarbruecken',
    nameAr: 'زاربروكن',
    state: 'Saarland',
    country: 'Germany',
    status: 'DISCOVERED',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 66111,
    postalMax: 66133,
    aliases: ['saarbruecken', 'saarbrücken', 'Saarbrücken', 'Saarbruecken'],
  },
  {
    id: 'freiburg',
    canonical: 'Freiburg im Breisgau',
    slug: 'freiburg',
    englishSlug: 'freiburg',
    nameEn: 'Freiburg im Breisgau',
    nameAr: 'فرايبورغ إم برايسغاو',
    state: 'Baden-Württemberg',
    country: 'Germany',
    status: 'DISCOVERED',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 79098,
    postalMax: 79117,
    aliases: ['freiburg', 'Freiburg', 'Freiburg im Breisgau'],
  },
  {
    id: 'regensburg',
    canonical: 'Regensburg',
    slug: 'regensburg',
    englishSlug: 'regensburg',
    nameEn: 'Regensburg',
    nameAr: 'ريغنسبورغ',
    state: 'Bayern',
    country: 'Germany',
    status: 'DISCOVERED',
    publicationEnabled: false,
    seoIndexable: false,
    minPublishedRecords: 5,
    postalMin: 93047,
    postalMax: 93059,
    aliases: ['regensburg', 'Regensburg'],
  },
];

let cachedRegistryBase: CityRegistryEntry[] | null = null;
let cachedRegistryAll: CityRegistryEntry[] | null = null;

function loadRegistry(includeAllCandidates: boolean = false): CityRegistryEntry[] {
  if (includeAllCandidates && cachedRegistryAll) return cachedRegistryAll;
  if (!includeAllCandidates && cachedRegistryBase) return cachedRegistryBase;

  const overridesPath = path.join(process.cwd(), 'src', 'data', 'city-registry-overrides.json');
  let overrides: Record<string, Partial<CityRegistryEntry>> = {};
  
  if (fs.existsSync(overridesPath)) {
    try {
      const content = fs.readFileSync(overridesPath, 'utf8');
      overrides = JSON.parse(content);
    } catch (e) {
      console.warn('Failed to parse city-registry-overrides.json', e);
    }
  }

  const basePool = includeAllCandidates
    ? [...DEFAULT_REGISTRY, ...CANDIDATE_CITIES_5B, ...CANDIDATE_CITIES_BATCH1, ...CANDIDATE_CITIES_BATCH2]
    : DEFAULT_REGISTRY;

  const resolved = basePool.map(entry => {
    if (overrides[entry.id] || overrides[entry.slug]) {
      const override = overrides[entry.id] || overrides[entry.slug] || {};
      const newStatus = override.status || entry.status;
      return {
        ...entry,
        ...override,
        status: newStatus,
        publicationEnabled: newStatus === 'PUBLISHED',
        seoIndexable: newStatus === 'PUBLISHED'
      };
    }
    return entry;
  });

  if (includeAllCandidates) {
    cachedRegistryAll = resolved;
    return cachedRegistryAll;
  } else {
    cachedRegistryBase = resolved;
    return cachedRegistryBase;
  }
}

export function clearRegistryCache(): void {
  cachedRegistryBase = null;
  cachedRegistryAll = null;
}

export function getAllCityRegistryEntries(includeAllCandidates: boolean = false): CityRegistryEntry[] {
  return loadRegistry(includeAllCandidates);
}

export function getPublishedCityRegistryEntries(): CityRegistryEntry[] {
  return loadRegistry(true).filter(c => c.status === 'PUBLISHED');
}

export function getCityRegistryEntry(slug: string): CityRegistryEntry | null {
  return loadRegistry(true).find(c => c.slug === slug || c.id === slug) || null;
}

export function getCityLifecycleStatus(slug: string): CityLifecycleStatus | null {
  const city = getCityRegistryEntry(slug);
  return city ? city.status : null;
}

export function getCityByStatus(status: CityLifecycleStatus): CityRegistryEntry[] {
  return loadRegistry(true).filter(c => c.status === status);
}

export function canPublishCity(slug: string): boolean {
  const status = getCityLifecycleStatus(slug);
  return status === 'READY_FOR_LAUNCH' || status === 'PUBLISHED';
}

export function isPublishedCity(slug: string): boolean {
  return getCityLifecycleStatus(slug) === 'PUBLISHED';
}
