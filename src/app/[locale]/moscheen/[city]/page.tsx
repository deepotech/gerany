import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMosqueRepository } from '@/lib/db';
import { normalizeCitySlug, getCityUrl, getMosqueUrl } from '@/lib/routes';
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

// Generate static params for all live cities with published mosques
export async function generateStaticParams() {
  const repo = getMosqueRepository();
  const cities = await repo.getCities();
  const liveCities = cities.filter((c) => c.count >= 1);

  return liveCities.map((c) => {
    const config = CITY_CONFIGS.find((cfg) => cfg.canonical === c.name);
    return {
      locale: 'de',
      city: config ? config.slug : normalizeCitySlug(c.name),
    };
  });
}

export async function generateMetadata({ params, searchParams }: CityPageProps): Promise<Metadata> {
  const { locale, city } = params;
  if (locale !== 'de') return {};

  const normalized = normalizeCitySlug(city);
  const cityConfig = CITY_CONFIGS.find(
    (cfg) => cfg.slug === normalized || cfg.englishSlug === normalized || cfg.canonical.toLowerCase() === normalized
  );

  if (!cityConfig) {
    return { robots: { index: false, follow: false } };
  }

  const repo = getMosqueRepository();
  const mosques = await repo.getByCity(cityConfig.canonical);
  if (mosques.length === 0) {
    return { robots: { index: false, follow: false } };
  }

  const district = searchParams?.district ? ` in ${searchParams.district}` : '';
  const title = `Moscheen in ${cityConfig.canonical}${district} – Alle Gebetsräume & Adressen`;
  const description = `Entdecke ${mosques.length} erfasste Moscheen in ${cityConfig.canonical}${district}. Öffnungszeiten, Frauenbereich, barrierefreier Zugang, Wudu-Waschräume und Wegbeschreibung.`;

  const canonicalPath = `/de/moscheen/${cityConfig.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        de: canonicalPath,
        en: `/en/mosques/${cityConfig.englishSlug}`,
        ar: `/ar/mosques/${cityConfig.slug}`,
        'x-default': canonicalPath,
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${canonicalPath}`,
      type: 'website',
    },
  };
}

export default async function GermanCityCollectionPage({
  params,
  searchParams,
}: CityPageProps) {
  const { locale, city } = params;
  if (locale !== 'de') notFound();

  const normalized = normalizeCitySlug(city);
  const cityConfig = CITY_CONFIGS.find(
    (cfg) => cfg.slug === normalized || cfg.englishSlug === normalized || cfg.canonical.toLowerCase() === normalized
  );
  if (!cityConfig) notFound();

  // Enforce canonical slug for German locale
  if (city !== cityConfig.slug) notFound();

  const repo = getMosqueRepository();
  const mosques = await repo.getByCity(cityConfig.canonical);
  if (mosques.length === 0) notFound();

  const districts = await repo.getDistricts(cityConfig.canonical);

  const breadcrumbsJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: '/de' },
    { name: cityConfig.state, url: '/de/moscheen' },
    { name: cityConfig.canonical, url: `/de/moscheen/${cityConfig.slug}` },
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
        locale="de"
        initialDistrict={searchParams?.district || ''}
        initialQuery={searchParams?.query || ''}
        cityTitle={`Moscheen in ${cityConfig.canonical}`}
      />
    </>
  );
}
