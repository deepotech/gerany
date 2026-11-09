import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary, isValidLocale, Locale } from '@/lib/i18n';
import { getMosqueRepository } from '@/lib/db';
import SearchClient from '@/components/SearchClient';
import { constructMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbJsonLd } from '@/lib/seo/schema';

interface SearchPageProps {
  params: {
    locale: string;
  };
}

// Strictly generate only English and Arabic locales for /mosques route
export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'ar' }];
}

export async function generateMetadata({ params }: SearchPageProps): Promise<Metadata> {
  const { locale } = params;
  if (locale === 'de' || !isValidLocale(locale)) return {};

  const dict = getDictionary(locale);

  return constructMetadata({
    title: dict.seo.listTitle,
    description: dict.seo.listDesc,
    canonical: `/${locale}/mosques`,
    languages: {
      de: '/de/moscheen',
      en: '/en/mosques',
      ar: '/ar/mosques',
      'x-default': '/de/moscheen',
    },
    locale,
  });
}

export default async function EnglishArabicMosqueSearchPage({
  params,
}: SearchPageProps) {
  const { locale } = params;
  // German must use /de/moscheen - return 404 on /de/mosques to prevent duplicate URLs
  if (locale === 'de' || !isValidLocale(locale)) notFound();

  const repo = getMosqueRepository();
  const mosques = await repo.getAllPublished();

  const isEn = locale === 'en';
  const breadcrumbsJsonLd = generateBreadcrumbJsonLd([
    { name: isEn ? 'Home' : 'الرئيسية', url: `/${locale}` },
    { name: isEn ? 'Mosques in Germany' : 'مساجد ألمانيا', url: `/${locale}/mosques` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <SearchClient
        initialMosques={mosques}
        districts={[]}
        locale={locale}
        cityTitle={
          locale === 'en'
            ? 'Mosque Directory Germany'
            : 'دليل مساجد ألمانيا'
        }
      />
    </>
  );
}
