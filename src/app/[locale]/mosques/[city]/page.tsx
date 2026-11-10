import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { isValidLocale, Locale } from '@/lib/i18n';
import { getMosqueRepository } from '@/lib/db';
import { normalizeCitySlug, getCityUrl, resolveTrailingDigitCityUrl, ARABIC_CITY_NAMES } from '@/lib/routes';
import { CITY_CONFIGS } from '@/pipeline/city-config';
import SearchClient from '@/components/SearchClient';
import { generateBreadcrumbJsonLd, generateCityCollectionSchema } from '@/lib/seo/schema';
import { constructMetadata } from '@/lib/seo/metadata';

interface CityPageProps {
  params: {
    locale: string;
    city: string;
  };
}

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

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { locale, city } = params;
  if (locale === 'de' || !isValidLocale(locale)) return {};

  const normalized = normalizeCitySlug(city);
  const cityConfig = CITY_CONFIGS.find(
    (cfg) => cfg.slug === normalized || cfg.englishSlug === normalized || cfg.canonical.toLowerCase() === normalized
  );

  if (!cityConfig) {
    const fallbackUrl = resolveTrailingDigitCityUrl(locale as Locale, city);
    if (fallbackUrl) {
      permanentRedirect(fallbackUrl);
    }
    return constructMetadata({
      title: locale === 'en' ? 'City Not Found' : 'المدينة غير موجودة',
      description: locale === 'en' ? 'The requested city could not be found.' : 'لم يتم العثور على المدينة المطلوبة.',
      noIndex: true,
      noFollow: false,
      locale,
    });
  }

  // Ensure English only pairs with englishSlug, Arabic only with slug
  if (locale === 'en' && city !== cityConfig.englishSlug) {
    return constructMetadata({
      title: 'City Not Found',
      description: 'Page not found.',
      noIndex: true,
      noFollow: false,
      locale,
    });
  }
  if (locale === 'ar' && city !== cityConfig.slug) {
    return constructMetadata({
      title: 'المدينة غير موجودة',
      description: 'الصفحة غير موجودة.',
      noIndex: true,
      noFollow: false,
      locale,
    });
  }

  const repo = getMosqueRepository();
  const mosques = await repo.getByCity(cityConfig.canonical);
  if (mosques.length === 0) {
    return constructMetadata({
      title: locale === 'en' ? `Mosques in ${cityConfig.englishSlug}` : `مساجد ${cityConfig.canonical}`,
      description: locale === 'en' ? 'No mosques listed.' : 'لا توجد مساجد مسجلة.',
      noIndex: true,
      noFollow: false,
      locale,
    });
  }

  const isEn = locale === 'en';
  const englishCityName = cityConfig.englishSlug.charAt(0).toUpperCase() + cityConfig.englishSlug.slice(1);
  const arabicCityName = ARABIC_CITY_NAMES[cityConfig.canonical] || cityConfig.canonical;

  const title = isEn
    ? `Mosques in ${englishCityName} – Complete Prayer Directory & Map`
    : `مساجد ${arabicCityName} – دليل المصليات والمراكز الإسلامية`;

  const description = isEn
    ? `Find ${mosques.length} listed mosques and Islamic prayer centers in ${englishCityName}, Germany. Filter by district, wheelchair access, parking, and women's prayer facilities.`
    : `دليل يضم ${mosques.length} مسجداً ومركزاً إسلامياً في مدينة ${arabicCityName} الألمانية مع خريطة تفاعلية، أوقات العمل، مرافق الوضوء ومصلى النساء.`;

  const currentPath = isEn ? `/en/mosques/${cityConfig.englishSlug}` : `/ar/mosques/${cityConfig.slug}`;

  return constructMetadata({
    title,
    description,
    canonical: currentPath,
    languages: {
      de: `/de/moscheen/${cityConfig.slug}`,
      en: `/en/mosques/${cityConfig.englishSlug}`,
      ar: `/ar/mosques/${cityConfig.slug}`,
      'x-default': `/de/moscheen/${cityConfig.slug}`,
    },
    locale,
  });
}

export default async function EnglishArabicCityCollectionPage({
  params,
}: CityPageProps) {
  const { locale, city } = params;
  if (locale === 'de' || !isValidLocale(locale)) notFound();

  const normalized = normalizeCitySlug(city);
  const cityConfig = CITY_CONFIGS.find(
    (cfg) => cfg.slug === normalized || cfg.englishSlug === normalized || cfg.canonical.toLowerCase() === normalized
  );
  if (!cityConfig) {
    const fallbackUrl = resolveTrailingDigitCityUrl(locale as Locale, city);
    if (fallbackUrl) {
      permanentRedirect(fallbackUrl);
    }
    notFound();
  }

  // Enforce English -> englishSlug, Arabic -> slug
  if (locale === 'en' && city !== cityConfig.englishSlug) notFound();
  if (locale === 'ar' && city !== cityConfig.slug) notFound();

  const repo = getMosqueRepository();
  const [mosques, allCities, districts] = await Promise.all([
    repo.getByCity(cityConfig.canonical),
    repo.getCities(),
    repo.getDistricts(cityConfig.canonical),
  ]);

  if (mosques.length === 0) notFound();

  const isEn = locale === 'en';
  const englishCityName = cityConfig.englishSlug.charAt(0).toUpperCase() + cityConfig.englishSlug.slice(1);
  const arabicCityName = ARABIC_CITY_NAMES[cityConfig.canonical] || cityConfig.canonical;

  const breadcrumbsJsonLd = generateBreadcrumbJsonLd([
    { name: isEn ? 'Home' : 'الرئيسية', url: `/${locale}` },
    { name: isEn ? 'Mosques in Germany' : 'مساجد ألمانيا', url: `/${locale}/mosques` },
    { name: isEn ? englishCityName : arabicCityName, url: isEn ? `/en/mosques/${cityConfig.englishSlug}` : `/ar/mosques/${cityConfig.slug}` },
  ]);

  const collectionJsonLd = generateCityCollectionSchema(cityConfig, mosques, locale as Locale);

  const otherCities = allCities
    .filter((c) => c.name !== cityConfig.canonical && c.count >= 1)
    .sort((a, b) => b.count - a.count);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />

      {/* Visible Breadcrumb Navigation */}
      <nav
        aria-label={isEn ? 'Breadcrumb navigation' : 'مسار التنقل'}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 font-medium"
      >
        <Link href={`/${locale}`} className="hover:text-brand-700 transition-colors">
          {isEn ? 'Home' : 'الرئيسية'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href={`/${locale}/mosques`} className="hover:text-brand-700 transition-colors">
          {isEn ? 'Mosques in Germany' : 'مساجد ألمانيا'}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold">{isEn ? englishCityName : arabicCityName}</span>
      </nav>

      <SearchClient
        initialMosques={mosques}
        districts={districts.map((d) => d.name)}
        locale={locale as Locale}
        cityTitle={isEn ? `Mosques in ${englishCityName}` : `مساجد ${arabicCityName}`}
      />

      {/* Sibling City Discovery Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
            {isEn ? 'Explore Mosques in Other German Cities' : 'استكشف مساجد المدن الألمانية الأخرى'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">
            {isEn
              ? 'Browse verified mosques, prayer times, and community centers in other major metropolitan areas across Germany.'
              : 'تصفح المساجد الموثقة ومراكز الصلاة في المدن والولايات الألمانية الأخرى.'}
          </p>
          <div className="flex flex-wrap gap-2">
            {otherCities.map((c) => {
              const displayName = isEn
                ? c.name
                : ARABIC_CITY_NAMES[c.name] || c.name;
              return (
                <Link
                  key={c.name}
                  href={getCityUrl(locale as Locale, c.name)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-800 border border-slate-200 text-xs font-medium transition-colors"
                >
                  <span>{displayName}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({c.count})</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
