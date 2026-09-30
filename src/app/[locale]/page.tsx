import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary, isValidLocale, Locale } from '@/lib/i18n';
import { getMosqueRepository } from '@/lib/db';
import HomeHero from '@/components/HomeHero';

import { SITE_URL, SITE_NAME } from '@/lib/config';

interface HomePageProps {
  params: {
    locale: string;
  };
}

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'en' }, { locale: 'ar' }];
}

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = params;
  if (!isValidLocale(locale)) return {};

  const dict = getDictionary(locale);

  return {
    title: dict.seo.homeTitle,
    description: dict.seo.homeDesc,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        de: '/de',
        en: '/en',
        ar: '/ar',
        'x-default': '/de',
      },
    },
    openGraph: {
      title: dict.seo.homeTitle,
      description: dict.seo.homeDesc,
      url: `${SITE_URL}/${locale}`,
      siteName: SITE_NAME,
      locale: locale === 'de' ? 'de_DE' : locale === 'ar' ? 'ar_AR' : 'en_US',
      type: 'website',
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();

  const repo = getMosqueRepository();
  const [mosques, cities] = await Promise.all([
    repo.getAllPublished(),
    repo.getCities(),
  ]);

  // Sort by count descending for display
  const sortedCities = [...cities].sort((a, b) => b.count - a.count);

  return <HomeHero locale={locale} totalMosques={mosques.length} cities={sortedCities} />;
}
