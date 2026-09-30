import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale, Locale } from '@/lib/i18n';
import { getMosqueRepository } from '@/lib/db';
import { normalizeCitySlug } from '@/lib/routes';
import { CITY_CONFIGS } from '@/pipeline/city-config';
import { SITE_URL } from '@/lib/config';
import SearchClient from '@/components/SearchClient';
import { generateBreadcrumbJsonLd } from '@/lib/seo/schema';

interface CityPageProps {
  params: {
    locale: string;
    city: string;
  };
  searchParams?: {
    district?: string;
    query?: string;
  };
}

const ARABIC_CITY_NAMES: Record<string, string> = {
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

// Generate static params for English and Arabic across all live cities
export async function generateStaticParams() {
  const repo = getMosqueRepository();
  const cities = await repo.getCities();
  const liveCities = cities.filter((c) => c.count >= 1);

  const params: Array<{ locale: string; city: string }> = [];
  liveCities.forEach((c) => {
    const config = CITY_CONFIGS.find((cfg) => cfg.canonical === c.name);
    if (!config) return;
    params.push({ locale: 'en', city: config.englishSlug });
    params.push({ locale: 'ar', city: config.slug });
  });

  return params;
}

export async function generateMetadata({ params, searchParams }: CityPageProps): Promise<Metadata> {
  const { locale, city } = params;
  if (locale === 'de' || !isValidLocale(locale)) return {};

  const normalized = normalizeCitySlug(city);
  const cityConfig = CITY_CONFIGS.find(
    (cfg) => cfg.slug === normalized || cfg.englishSlug === normalized || cfg.canonical.toLowerCase() === normalized
  );

  if (!cityConfig) {
    return { robots: { index: false, follow: false } };
  }

  // Ensure English only pairs with englishSlug, Arabic only with slug
  if (locale === 'en' && city !== cityConfig.englishSlug) return { robots: { index: false, follow: false } };
  if (locale === 'ar' && city !== cityConfig.slug) return { robots: { index: false, follow: false } };

  const repo = getMosqueRepository();
  const mosques = await repo.getByCity(cityConfig.canonical);
  if (mosques.length === 0) {
    return { robots: { index: false, follow: false } };
  }

  const isEn = locale === 'en';
  const englishCityName = cityConfig.englishSlug.charAt(0).toUpperCase() + cityConfig.englishSlug.slice(1);
  const arabicCityName = ARABIC_CITY_NAMES[cityConfig.canonical] || cityConfig.canonical;

  const district = searchParams?.district ? ` - ${searchParams.district}` : '';
  const title = isEn
    ? `Mosques in ${englishCityName}${district} – Complete Prayer Directory & Map`
    : `مساجد ${arabicCityName}${district} – دليل المصليات والمراكز الإسلامية`;

  const description = isEn
    ? `Find ${mosques.length} listed mosques and Islamic prayer centers in ${englishCityName}, Germany. Filter by district, wheelchair access, parking, and women's prayer facilities.`
    : `دليل يضم ${mosques.length} مسجداً ومركزاً إسلامياً في مدينة ${arabicCityName} الألمانية مع خريطة تفاعلية، أوقات العمل، مرافق الوضوء ومصلى النساء.`;

  const currentPath = isEn ? `/en/mosques/${cityConfig.englishSlug}` : `/ar/mosques/${cityConfig.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: currentPath,
      languages: {
        de: `/de/moscheen/${cityConfig.slug}`,
        en: `/en/mosques/${cityConfig.englishSlug}`,
        ar: `/ar/mosques/${cityConfig.slug}`,
        'x-default': `/de/moscheen/${cityConfig.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${currentPath}`,
      type: 'website',
    },
  };
}

export default async function EnglishArabicCityCollectionPage({
  params,
  searchParams,
}: CityPageProps) {
  const { locale, city } = params;
  if (locale === 'de' || !isValidLocale(locale)) notFound();

  const normalized = normalizeCitySlug(city);
  const cityConfig = CITY_CONFIGS.find(
    (cfg) => cfg.slug === normalized || cfg.englishSlug === normalized || cfg.canonical.toLowerCase() === normalized
  );
  if (!cityConfig) notFound();

  // Enforce English -> englishSlug, Arabic -> slug
  if (locale === 'en' && city !== cityConfig.englishSlug) notFound();
  if (locale === 'ar' && city !== cityConfig.slug) notFound();

  const repo = getMosqueRepository();
  const mosques = await repo.getByCity(cityConfig.canonical);
  if (mosques.length === 0) notFound();

  const districts = await repo.getDistricts(cityConfig.canonical);

  const isEn = locale === 'en';
  const englishCityName = cityConfig.englishSlug.charAt(0).toUpperCase() + cityConfig.englishSlug.slice(1);
  const arabicCityName = ARABIC_CITY_NAMES[cityConfig.canonical] || cityConfig.canonical;

  const breadcrumbsJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: `/${locale}` },
    { name: isEn ? cityConfig.state : 'ألمانيا', url: `/${locale}/mosques` },
    { name: isEn ? englishCityName : arabicCityName, url: isEn ? `/en/mosques/${cityConfig.englishSlug}` : `/ar/mosques/${cityConfig.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <SearchClient
        initialMosques={mosques}
        districts={districts.map((d) => d.name)}
        locale={locale as Locale}
        initialDistrict={searchParams?.district || ''}
        initialQuery={searchParams?.query || ''}
        cityTitle={isEn ? `Mosques in ${englishCityName}` : `مساجد ${arabicCityName}`}
      />
    </>
  );
}
