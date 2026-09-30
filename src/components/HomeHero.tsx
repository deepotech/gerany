'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Locale, getDictionary } from '@/lib/i18n';
import { getCityUrl, getSearchUrl } from '@/lib/routes';
import { CITY_CONFIGS } from '@/pipeline/city-config';
import { Search, Navigation, MapPin, Building2, CheckCircle2, Database, MapIcon } from 'lucide-react';
import Link from 'next/link';

interface CityData {
  name: string;
  slug: string;
  count: number;
  state: string;
}

interface HomeHeroProps {
  locale: Locale;
  totalMosques: number;
  cities: CityData[];
}

export default function HomeHero({ locale, totalMosques, cities }: HomeHeroProps) {
  const dict = getDictionary(locale);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchBase = getSearchUrl(locale);
    if (query.trim()) {
      router.push(`${searchBase}?query=${encodeURIComponent(query.trim())}`);
    } else {
      router.push(searchBase);
    }
  };

  const handleNearMe = () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          router.push(
            `${getSearchUrl(locale)}?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`
          );
        },
        () => {
          setIsLocating(false);
          router.push(getSearchUrl(locale));
        },
        { timeout: 8000 }
      );
    } else {
      setIsLocating(false);
      router.push(getSearchUrl(locale));
    }
  };

  // Total city count for display
  const cityCount = cities.length;

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-slate-50 pt-16 pb-20 border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Directory Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100 text-brand-900 border border-brand-200/80 text-xs font-semibold mb-6 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse" />
            <span>{dict.home.pilotBadge} &bull; {totalMosques} {dict.home.statsMosques}</span>
          </div>

          {/* Hero Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            {dict.home.heroTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            {dict.home.heroSubtitle}
          </p>

          {/* Main Search Input Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6" role="search">
            <div className="relative flex flex-col sm:flex-row items-center gap-2 p-2 bg-white rounded-2xl shadow-lg shadow-slate-200/70 border border-slate-200">
              <div className="relative flex-1 w-full flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={dict.common.searchPlaceholder}
                  aria-label={dict.common.searchPlaceholder}
                  className="w-full pl-12 pr-4 py-3.5 text-base text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-brand-600/20 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  {dict.common.search}
                </button>
              </div>
            </div>
          </form>

          {/* Location CTA */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <button
              onClick={handleNearMe}
              disabled={isLocating}
              aria-label={isLocating ? dict.common.loadingLocation : dict.common.nearMe}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-60"
            >
              <Navigation className={`w-3.5 h-3.5 text-brand-400 ${isLocating ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{isLocating ? dict.common.loadingLocation : dict.common.nearMe}</span>
            </button>

            <Link
              href={cities.length > 0 ? getCityUrl(locale, cities[0].slug) : getSearchUrl(locale)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-brand-600" aria-hidden="true" />
              <span>
                {locale === 'en'
                  ? `Browse ${cities[0]?.name || 'mosques'} directory`
                  : locale === 'ar'
                  ? `تصفح مساجد ${cities[0]?.name || ''}`
                  : `Moscheen in ${cities[0]?.name || 'Deutschland'}`}
              </span>
            </Link>
          </div>

          {/* Top Cities Quick Links */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">
              {locale === 'en' ? 'Popular cities:' : locale === 'ar' ? 'مدن رائجة:' : 'Häufig gesucht:'}
            </span>
            {cities.slice(0, 4).map((city) => (
              <Link
                key={city.slug}
                href={getCityUrl(locale, city.slug)}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Cities Section — Counts derived from live repository data */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {dict.home.popularCitiesTitle}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {dict.home.popularCitiesSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {cities.map((city) => {
            const config = CITY_CONFIGS.find((c) => c.canonical === city.name);
            const citySlug = config
              ? (locale === 'en' ? config.englishSlug : config.slug)
              : city.slug;

            return (
              <div
                key={city.slug}
                className="p-5 rounded-2xl border transition-all duration-200 bg-white border-brand-300 ring-2 ring-brand-500/10 hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand-600 text-white">
                      <Building2 className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">
                        {city.name}
                      </h3>
                      <span className="text-xs text-slate-500">{city.state}</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-800">
                    <Building2 className="w-3 h-3 text-brand-600" aria-hidden="true" />
                    {city.count}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mb-4 line-clamp-2">
                  {locale === 'en'
                    ? `${city.count} listed mosques with addresses, facilities, and directions.`
                    : locale === 'ar'
                    ? `${city.count} مسجداً مع العناوين والمرافق واتجاهات الطريق.`
                    : `${city.count} erfasste Moscheen mit Adressen, Ausstattung und Wegbeschreibungen.`}
                </p>

                <Link
                  href={getCityUrl(locale, citySlug)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900"
                >
                  <span>
                    {locale === 'en'
                      ? `Browse ${city.name} mosques`
                      : locale === 'ar'
                      ? `تصفح مساجد ${city.name}`
                      : `Moscheen in ${city.name} ansehen`}
                  </span>
                  <span aria-hidden="true" className="rtl:rotate-180 inline-block">&rarr;</span>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Directory Quality Architecture Banner */}
      <section className="bg-slate-100/70 border-y border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-600 shadow-2xs shrink-0">
                <Database className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Strukturierte Einträge</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Jeder Eintrag durchläuft eine automatische Klassifizierung und Deduplizierung.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-600 shadow-2xs shrink-0">
                <Navigation className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Präzise Lokale Suche</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Finde Moscheen nach Stadtteil, PLZ oder GPS-Entfernung. Direkte Routenplanung.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-600 shadow-2xs shrink-0">
                <MapIcon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Ausstattungsangaben</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Frauenbereich, Barrierefreiheit, Wudu-Waschräume und Parkplätze – sofern bekannt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
