import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale, Locale } from '@/lib/i18n';
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

  const params: Array<{ locale: string; city: string; slug: string }> = [];
  mosques.forEach((m) => {
    const config = CITY_CONFIGS.find((cfg) => cfg.canonical === m.city);
    if (!config) return;
    params.push({ locale: 'en', city: config.englishSlug, slug: m.slug });
    params.push({ locale: 'ar', city: config.slug, slug: m.slug });
  });

  return params;
}

export async function generateMetadata({ params }: MosqueDetailPageProps): Promise<Metadata> {
  const { locale, city, slug } = params;
  if (locale === 'de' || !isValidLocale(locale)) return {};

  const normalized = normalizeCitySlug(city);
  const cityConfig = CITY_CONFIGS.find(
    (cfg) => cfg.slug === normalized || cfg.englishSlug === normalized || cfg.canonical.toLowerCase() === normalized
  );
  if (!cityConfig) return {};

  if (locale === 'en' && city !== cityConfig.englishSlug) return {};
  if (locale === 'ar' && city !== cityConfig.slug) return {};

  const repo = getMosqueRepository();
  const mosque = await repo.getByCityAndSlug(cityConfig.canonical, slug);
  if (!mosque) return {};

  const isEn = locale === 'en';
  const trans = isEn ? mosque.translations.en : mosque.translations.ar;
  const canonicalUrl = isEn
    ? `/en/mosque/${cityConfig.englishSlug}/${mosque.slug}`
    : `/ar/mosque/${cityConfig.slug}/${mosque.slug}`;

  return {
    title: trans.seoTitle,
    description: trans.seoDescription,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        de: `/de/moschee/${cityConfig.slug}/${mosque.slug}`,
        en: `/en/mosque/${cityConfig.englishSlug}/${mosque.slug}`,
        ar: `/ar/mosque/${cityConfig.slug}/${mosque.slug}`,
        'x-default': `/de/moschee/${cityConfig.slug}/${mosque.slug}`,
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

export default async function EnglishArabicMosqueDetailPage({ params }: MosqueDetailPageProps) {
  const { locale, city, slug } = params;
  if (locale === 'de' || !isValidLocale(locale)) notFound();

  const normalized = normalizeCitySlug(city);
  const cityConfig = CITY_CONFIGS.find(
    (cfg) => cfg.slug === normalized || cfg.englishSlug === normalized || cfg.canonical.toLowerCase() === normalized
  );
  if (!cityConfig) notFound();

  if (locale === 'en' && city !== cityConfig.englishSlug) notFound();
  if (locale === 'ar' && city !== cityConfig.slug) notFound();

  const repo = getMosqueRepository();
  const mosque = await repo.getByCityAndSlug(cityConfig.canonical, slug);
  if (!mosque) notFound();

  const nearby = await repo.getNearby(mosque.latitude, mosque.longitude, 6, mosque.slug, mosque.id);

  return (
    <MosqueDetailView
      mosque={mosque}
      nearbyMosques={nearby}
      locale={locale as Locale}
    />
  );
}
