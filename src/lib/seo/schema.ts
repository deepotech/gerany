import { MosqueEntity } from '@/pipeline/types';
import { Locale } from '@/lib/i18n';
import { getCityUrl, getMosqueUrl, ARABIC_CITY_NAMES } from '@/lib/routes';
import { SITE_URL, SITE_NAME } from '@/lib/config';
import { CityConfig } from '@/pipeline/city-config';

/**
 * Generates WebSite JSON-LD for MoscheeAtlas Germany.
 */
export function generateWebSiteSchema(locale: Locale = 'de', siteUrl: string = SITE_URL) {
  const descriptions: Record<Locale, string> = {
    de: 'Verzeichnis und Suchdienst für erfasste Moscheen und Gebetsräume in Deutschland. Adressen, Ausstattung, Barrierefreiheit und Wegbeschreibungen.',
    en: 'Directory and search service for verified mosques and prayer facilities in Germany. Addresses, amenities, accessibility, and directions.',
    ar: 'دليل ومحرك بحث للمساجد والمصليات الموثقة في ألمانيا. العناوين، المرافق، إمكانية الوصول واتجاهات السير.',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${siteUrl}/${locale}`,
    description: descriptions[locale] || descriptions.de,
  };
}

/**
 * Generates PlaceOfWorship / Mosque schema.org JSON-LD.
 * Only includes fields that actually exist in the verified source data.
 */
export function generateMosqueJsonLd(mosque: MosqueEntity, locale: Locale, siteUrl: string = SITE_URL): Record<string, any> {
  const localizedName = mosque.translations[locale]?.name || mosque.canonicalName;
  const localizedDesc = mosque.translations[locale]?.description || mosque.description || '';
  const detailUrl = `${siteUrl}${getMosqueUrl(locale, mosque.city, mosque.slug)}`;

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Mosque',
    additionalType: 'https://schema.org/PlaceOfWorship',
    '@id': `${detailUrl}#place`,
    name: localizedName,
    description: localizedDesc,
    url: detailUrl,
    address: {
      '@type': 'PostalAddress',
      streetAddress: mosque.street || mosque.address,
      addressLocality: mosque.city,
      postalCode: mosque.postalCode,
      addressRegion: mosque.state,
      addressCountry: 'DE',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: mosque.latitude,
      longitude: mosque.longitude,
    },
  };

  if (mosque.imageUrl) {
    schema.image = mosque.imageUrl.startsWith('http') ? mosque.imageUrl : `${siteUrl}${mosque.imageUrl}`;
  }

  if (mosque.phone) {
    schema.telephone = mosque.phone;
  }

  if (mosque.website) {
    schema.sameAs = [mosque.website];
  }

  // Real ratings & reviews strictly guarded: only when genuine reviewCount > 0 exists
  if (mosque.rating && mosque.reviewCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: mosque.rating,
      reviewCount: mosque.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (mosque.openingHours && mosque.openingHours.length > 0) {
    schema.openingHours = mosque.openingHours.map((h) => `${h.day.slice(0, 2)} ${h.hours}`);
    schema.openingHoursSpecification = mosque.openingHours.map((h) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${h.day}`,
      description: h.hours,
    }));
  }

  return schema;
}

/**
 * Generates CollectionPage & ItemList JSON-LD for an eligible City Page.
 * Conforms to Google's Search Essentials for structured list pages.
 */
export function generateCityCollectionSchema(
  cityConfig: CityConfig,
  mosques: MosqueEntity[],
  locale: Locale,
  siteUrl: string = SITE_URL
): Record<string, any> {
  const isEn = locale === 'en';
  const isAr = locale === 'ar';
  const cityName = isEn
    ? cityConfig.englishSlug.charAt(0).toUpperCase() + cityConfig.englishSlug.slice(1)
    : isAr
    ? ARABIC_CITY_NAMES[cityConfig.canonical] || cityConfig.canonical
    : cityConfig.canonical;

  const url = `${siteUrl}${getCityUrl(locale, cityConfig.canonical)}`;
  const title = isEn
    ? `Mosques in ${cityName}`
    : isAr
    ? `مساجد ${cityName}`
    : `Moscheen in ${cityName}`;

  const description = isEn
    ? `Directory of ${mosques.length} verified mosques and Islamic prayer centers in ${cityName}, Germany.`
    : isAr
    ? `دليل يضم ${mosques.length} مسجداً ومصلى موثقاً في مدينة ${cityName}، ألمانيا.`
    : `Verzeichnis von ${mosques.length} erfassten Moscheen und Gebetsräumen in ${cityName}, ${cityConfig.state}.`;

  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url,
    description,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: mosques.length,
      itemListElement: mosques.map((m, index) => {
        const localizedName = m.translations[locale]?.name || m.canonicalName;
        const mosqueUrl = `${siteUrl}${getMosqueUrl(locale, cityConfig.canonical, m.slug)}`;
        return {
          '@type': 'ListItem',
          position: index + 1,
          name: localizedName,
          url: mosqueUrl,
        };
      }),
    },
  };
}

/**
 * Generates BreadcrumbList JSON-LD
 */
export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>,
  siteUrl: string = SITE_URL
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
    })),
  };
}
