import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { getMosqueRepository } from '@/lib/db';
import { normalizeCitySlug, getCityUrl, resolveTrailingDigitCityUrl } from '@/lib/routes';
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

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { locale, city } = params;
  if (locale !== 'de') return {};

  const normalized = normalizeCitySlug(city);
  const cityConfig = CITY_CONFIGS.find(
    (cfg) => cfg.slug === normalized || cfg.englishSlug === normalized || cfg.canonical.toLowerCase() === normalized
  );

  if (!cityConfig) {
    const fallbackUrl = resolveTrailingDigitCityUrl('de', city);
    if (fallbackUrl) {
      permanentRedirect(fallbackUrl);
    }
    return constructMetadata({
      title: 'Stadt nicht gefunden',
      description: 'Die angeforderte Stadt konnte nicht gefunden werden.',
      noIndex: true,
      noFollow: false,
    });
  }

  const repo = getMosqueRepository();
  const mosques = await repo.getByCity(cityConfig.canonical);
  if (mosques.length === 0) {
    return constructMetadata({
      title: `Moscheen in ${cityConfig.canonical}`,
      description: `Derzeit sind keine erfassten Moscheen in ${cityConfig.canonical} verfügbar.`,
      noIndex: true,
      noFollow: false,
    });
  }

  const title = `Moscheen in ${cityConfig.canonical} – Alle Gebetsräume & Adressen`;
  const description = `Entdecke ${mosques.length} erfasste Moscheen in ${cityConfig.canonical}. Öffnungszeiten, Frauenbereich, barrierefreier Zugang, Wudu-Waschräume und Wegbeschreibung.`;

  const canonicalPath = `/de/moscheen/${cityConfig.slug}`;

  return constructMetadata({
    title,
    description,
    canonical: canonicalPath,
    languages: {
      de: canonicalPath,
      en: `/en/mosques/${cityConfig.englishSlug}`,
      ar: `/ar/mosques/${cityConfig.slug}`,
      'x-default': canonicalPath,
    },
    locale: 'de',
  });
}

export default async function GermanCityCollectionPage({
  params,
}: CityPageProps) {
  const { locale, city } = params;
  if (locale !== 'de') notFound();

  const normalized = normalizeCitySlug(city);
  const cityConfig = CITY_CONFIGS.find(
    (cfg) => cfg.slug === normalized || cfg.englishSlug === normalized || cfg.canonical.toLowerCase() === normalized
  );
  if (!cityConfig) {
    const fallbackUrl = resolveTrailingDigitCityUrl('de', city);
    if (fallbackUrl) {
      permanentRedirect(fallbackUrl);
    }
    notFound();
  }

  // Enforce canonical slug for German locale
  if (city !== cityConfig.slug) notFound();

  const repo = getMosqueRepository();
  const [mosques, allCities, districts] = await Promise.all([
    repo.getByCity(cityConfig.canonical),
    repo.getCities(),
    repo.getDistricts(cityConfig.canonical),
  ]);

  if (mosques.length === 0) notFound();

  const breadcrumbsJsonLd = generateBreadcrumbJsonLd([
    { name: 'Startseite', url: '/de' },
    { name: 'Moscheen in Deutschland', url: '/de/moscheen' },
    { name: `Moscheen in ${cityConfig.canonical}`, url: `/de/moscheen/${cityConfig.slug}` },
  ]);

  const collectionJsonLd = generateCityCollectionSchema(cityConfig, mosques, 'de');

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

      {/* Visible Breadcrumbs Navigation */}
      <nav
        aria-label="Brotkrümelnavigation"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 font-medium"
      >
        <Link href="/de" className="hover:text-brand-700 transition-colors">
          Startseite
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link href="/de/moscheen" className="hover:text-brand-700 transition-colors">
          Moscheen in Deutschland
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-semibold">{cityConfig.canonical}</span>
      </nav>

      <SearchClient
        initialMosques={mosques}
        districts={districts.map((d) => d.name)}
        locale="de"
        cityTitle={`Moscheen in ${cityConfig.canonical}`}
      />

      {/* Sibling City Discovery Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-2xs">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">
            Weitere Städte in Deutschland entdecken
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-4 leading-relaxed">
            Finde erfasste Gebetsräume, Moscheen und Adressen in weiteren Großstädten und Regionen Deutschlands.
          </p>
          <div className="flex flex-wrap gap-2">
            {otherCities.map((c) => (
              <Link
                key={c.name}
                href={getCityUrl('de', c.name)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-800 border border-slate-200 text-xs font-medium transition-colors"
              >
                <span>{c.name}</span>
                <span className="text-[10px] text-slate-400 font-normal">({c.count})</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
