import { MosqueTranslation } from './types';
import { CITY_CONFIGS } from './city-config';

// Arabic city name map
const CITY_ARABIC: Record<string, string> = {
  'Köln': 'كولونيا',
  'Berlin': 'برلين',
  'Hamburg': 'هامبورغ',
  'München': 'ميونيخ',
  'Frankfurt': 'فرانكفورت',
  'Düsseldorf': 'دوسلدورف',
  'Stuttgart': 'شتوتغارت',
  'Dortmund': 'دورتموند',
  'Essen': 'إيسن',
};

// Arabic translations for common mosque and place terms
const TRANSLATION_MAP: Record<string, string> = {
  'Fatih': 'الفاتح',
  'Eyüp-Sultan': 'أيوب سلطان',
  'Eyüp Sultan': 'أيوب سلطان',
  'Abu Bakr': 'أبو بكر',
  'Ömerül Faruk': 'عمر الفاروق',
  'Mevlana': 'مولانا',
  'Hamza': 'حمزة',
  'Yunus Emre': 'يونس إمره',
  'Yunus-Emre': 'يونس إمره',
  'Al Nur': 'النور',
  'Barboros': 'خير الدين بربروس',
  'Al Tauhid': 'التوحيد',
  'Zentralmoschee': 'المسجد المركزي',
  'Bait-un-Nasr': 'بيت النصر',
  'Baitus Sabuh': 'بيت السبوح',
  'Baitun Nur': 'بيت النور',
  'Baitun Nasr': 'بيت النصر',
};

export function cleanGermanName(title: string): string {
  return title
    .replace(/\s*-\s*مسجد.*$/i, '')
    .replace(/^مسجد[^\-]*-\s*/i, '')
    .trim();
}

export function cleanEnglishName(title: string, city: string = 'Cologne'): string {
  const cityConfig = CITY_CONFIGS.find((c) => c.canonical === city);
  const englishCity = cityConfig?.englishSlug
    ? cityConfig.englishSlug.charAt(0).toUpperCase() + cityConfig.englishSlug.slice(1)
    : city;

  let name = cleanGermanName(title);
  name = name.replace(/Moschee/gi, 'Mosque');
  // Replace German city name with English equivalent in the title if present
  name = name.replace(new RegExp(city, 'g'), englishCity);
  return name;
}

export function cleanArabicName(title: string): string {
  // If title has Arabic characters, extract the Arabic phrase
  const arabicRegex = /[\u0600-\u06FF\s]+/g;
  const arabicMatches = title.match(arabicRegex);
  if (arabicMatches) {
    const candidate = arabicMatches.join(' ').trim();
    if (candidate.length >= 4) {
      return candidate.includes('مسجد') ? candidate : `مسجد ${candidate}`;
    }
  }

  // Otherwise translate recognizable terms
  let translated = title.replace(/\s*e\.V\..*$/i, '').trim();
  for (const [key, ar] of Object.entries(TRANSLATION_MAP)) {
    if (translated.includes(key)) {
      return `مسجد ${ar}`;
    }
  }

  return `مسجد ${cleanGermanName(title)}`;
}

export function generateTranslations(
  canonicalName: string,
  city: string,
  district: string | null,
  postalCode: string
): Record<'de' | 'en' | 'ar', MosqueTranslation> {
  const districtSuffix = district ? ` (${district})` : '';

  const cityConfig = CITY_CONFIGS.find((c) => c.canonical === city);
  const englishCity = cityConfig
    ? cityConfig.englishSlug.charAt(0).toUpperCase() + cityConfig.englishSlug.slice(1)
    : city;
  const arabicCity = CITY_ARABIC[city] || city;

  const deName = cleanGermanName(canonicalName);
  const enName = cleanEnglishName(canonicalName, city);
  const arName = cleanArabicName(canonicalName);

  return {
    de: {
      locale: 'de',
      name: deName,
      description: `Informationen, Gebetsmöglichkeiten, Adresse und Ausstattung der ${deName} in ${city}${districtSuffix}, Deutschland.`,
      seoTitle: `${deName} – Moschee in ${city}${districtSuffix} (${postalCode})`,
      seoDescription: `${deName} in ${city}: Adresse, Öffnungszeiten, Ausstattung sowie Wegbeschreibung zur Moschee.`,
    },
    en: {
      locale: 'en',
      name: enName,
      description: `Visitor information, prayer space, address and amenities for ${enName} in ${englishCity}${districtSuffix}, Germany.`,
      seoTitle: `${enName} – Mosque in ${englishCity}${districtSuffix} (${postalCode})`,
      seoDescription: `${enName} in ${englishCity}, Germany: Location, opening hours, facilities, and map directions.`,
    },
    ar: {
      locale: 'ar',
      name: arName,
      description: `معلومات الزوار، أماكن الصلاة، العنوان والمرافق المتاحة في ${arName} في ${arabicCity}${districtSuffix}، ألمانيا.`,
      seoTitle: `${arName} – مسجد في ${arabicCity}${districtSuffix} (${postalCode})`,
      seoDescription: `تفاصيل ${arName} في ${arabicCity}: العنوان، أوقات العمل، مرافق الصلاة، واتجاهات الوصول.`,
    },
  };
}
