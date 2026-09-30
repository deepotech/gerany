import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMosqueRepository } from '@/lib/db';
import { normalizeCitySlug } from '@/lib/routes';
import { CITY_CONFIGS } from '@/pipeline/city-config';
import { SITE_URL } from '@/lib/config';
import MosqueDetailView from '@/components/MosqueDetailView';

interface MosqueDetailPageProps {
  params: {
    locale: string;
    city: string;
    slug: string;
  };
}

export async function generateStaticParams() {
  const repo = getMosqueRepository();
  const mosques = await repo.getAllPublished();

  return mosques.map((m) => {
    const config = CITY_CONFIGS.find((cfg) => cfg.canonical === m.city);
    return {
      locale: 'de',
      city: config ? config.slug : normalizeCitySlug(m.city),
      slug: m.slug,
    };
  });
}

export async function generateMetadata({ params }: MosqueDetailPageProps): Promise<Metadata> {
  const { locale, city, slug } = params;
  if (locale !== 'de') return {};

  const normalized = normalizeCitySlug(city);
  const cityConfig = CITY_CONFIGS.find(
    (cfg) => cfg.slug === normalized || cfg.englishSlug === normalized || cfg.canonical.toLowerCase() === normalized
  );
  if (!cityConfig) return {};

  const repo = getMosqueRepository();
  const mosque = await repo.getByCityAndSlug(cityConfig.canonical, slug);
  if (!mosque) return {};

  const trans = mosque.translations.de;
  const canonicalUrl = `/de/moschee/${cityConfig.slug}/${mosque.slug}`;

  return {
    title: trans.seoTitle,
    description: trans.seoDescription,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        de: canonicalUrl,
        en: `/en/mosque/${cityConfig.englishSlug}/${mosque.slug}`,
        ar: `/ar/mosque/${cityConfig.slug}/${mosque.slug}`,
        'x-default': canonicalUrl,
      },
    },
    openGraph: {
      title: trans.seoTitle,
      description: trans.seoDescription,
      url: `${SITE_URL}${canonicalUrl}`,
      type: 'article',
      images: mosque.imageUrl ? [{ url: mosque.imageUrl }] : undefined,
    },
  };
}

export default async function GermanMosqueDetailPage({ params }: MosqueDetailPageProps) {
  const { locale, city, slug } = params;
  // Strictly disallow non-German locale on /moschee route
  if (locale !== 'de') notFound();

  const normalized = normalizeCitySlug(city);
  const cityConfig = CITY_CONFIGS.find(
    (cfg) => cfg.slug === normalized || cfg.englishSlug === normalized || cfg.canonical.toLowerCase() === normalized
  );
  if (!cityConfig) notFound();

  // Enforce German canonical slug
  if (city !== cityConfig.slug) notFound();

  const repo = getMosqueRepository();
  const mosque = await repo.getByCityAndSlug(cityConfig.canonical, slug);
  if (!mosque) notFound();

  const nearby = await repo.getNearby(mosque.latitude, mosque.longitude, 6, mosque.slug, mosque.id);

  return (
    <MosqueDetailView
      mosque={mosque}
      nearbyMosques={nearby}
      locale="de"
    />
  );
}
