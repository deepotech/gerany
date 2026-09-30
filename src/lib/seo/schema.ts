import { MosqueEntity } from '@/pipeline/types';
import { Locale } from '@/lib/i18n';
import { getCityUrl, getMosqueUrl } from '@/lib/routes';
import { SITE_URL } from '@/lib/config';

export function generateMosqueJsonLd(mosque: MosqueEntity, locale: Locale, siteUrl: string = SITE_URL) {
  const localizedName = mosque.translations[locale]?.name || mosque.canonicalName;
  const localizedDesc = mosque.translations[locale]?.description || mosque.description || '';
  const detailUrl = `${siteUrl}${getMosqueUrl(locale, mosque.city, mosque.slug)}`;

  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Mosque',
    '@id': detailUrl,
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

  if (mosque.phone) {
    schema.telephone = mosque.phone;
  }

  if (mosque.website) {
    schema.sameAs = [mosque.website];
  }

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
  }

  return schema;
}

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
