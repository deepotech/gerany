import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary, isValidLocale, Locale } from '@/lib/i18n';
import { getMosqueRepository } from '@/lib/db';
import SearchClient from '@/components/SearchClient';

interface SearchPageProps {
  params: {
    locale: string;
  };
  searchParams?: {
    query?: string;
    district?: string;
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

  return {
    title: dict.seo.listTitle,
    description: dict.seo.listDesc,
    alternates: {
      canonical: `/${locale}/mosques`,
      languages: {
        de: '/de/moscheen',
        en: '/en/mosques',
        ar: '/ar/mosques',
        'x-default': '/de/moscheen',
      },
    },
  };
}

export default async function EnglishArabicMosqueSearchPage({
  params,
  searchParams,
}: SearchPageProps) {
  const { locale } = params;
  // German must use /de/moscheen - return 404 on /de/mosques to prevent duplicate URLs
  if (locale === 'de' || !isValidLocale(locale)) notFound();

  const repo = getMosqueRepository();
  const mosques = await repo.getAllPublished();

  return (
    <SearchClient
      initialMosques={mosques}
      districts={[]}
      locale={locale}
      initialDistrict={searchParams?.district || ''}
      initialQuery={searchParams?.query || ''}
      cityTitle={
        locale === 'en'
          ? 'Mosque Directory Germany'
          : 'دليل مساجد ألمانيا'
      }
    />
  );
}
