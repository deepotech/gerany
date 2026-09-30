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

// Strictly generate only German locale for /de/moscheen to avoid duplicate route generation
export function generateStaticParams() {
  return [{ locale: 'de' }];
}

export async function generateMetadata({ params }: SearchPageProps): Promise<Metadata> {
  const { locale } = params;
  if (locale !== 'de') return {};

  const dict = getDictionary('de');

  return {
    title: dict.seo.listTitle,
    description: dict.seo.listDesc,
    alternates: {
      canonical: `/de/moscheen`,
      languages: {
        de: '/de/moscheen',
        en: '/en/mosques',
        ar: '/ar/mosques',
        'x-default': '/de/moscheen',
      },
    },
  };
}

export default async function GermanMosqueSearchPage({
  params,
  searchParams,
}: SearchPageProps) {
  const { locale } = params;
  // Strictly disallow non-German locales on /moscheen route
  if (locale !== 'de') notFound();

  const repo = getMosqueRepository();
  const mosques = await repo.getAllPublished();

  return (
    <SearchClient
      initialMosques={mosques}
      districts={[]}
      locale="de"
      initialDistrict={searchParams?.district || ''}
      initialQuery={searchParams?.query || ''}
      cityTitle="Moscheen-Verzeichnis Deutschland"
    />
  );
}
