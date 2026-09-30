import React from 'react';
import Link from 'next/link';
import { MosqueEntity } from '@/pipeline/types';
import { MosqueWithDistance } from '@/lib/db/types';
import { Locale, getDictionary } from '@/lib/i18n';
import { getCityUrl, getHomeUrl, getMosqueUrl } from '@/lib/routes';
import { CITY_CONFIGS } from '@/pipeline/city-config';
import { generateMosqueJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo/schema';
import MapContainer from './map/MapContainer';
import { MapMarker } from './map/types';
import MosqueCard from './MosqueCard';
import {
  MapPin,
  Phone,
  Globe,
  Navigation,
  Clock,
  ShieldCheck,
  Star,
  Users,
  Accessibility,
  Car,
  Check,
  Calendar,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { isOpenNow, formatDistance } from '@/lib/db/geo';

interface MosqueDetailViewProps {
  mosque: MosqueEntity;
  nearbyMosques: MosqueWithDistance[];
  locale: Locale;
}

const ARABIC_CITY_NAMES: Record<string, string> = {
  'Köln': 'كولونيا',
  'Berlin': 'برلين',
  'Hamburg': 'هامبورغ',
  'München': 'ميونيخ',
  'Frankfurt': 'فرانكفورت',
  'Düsseldorf': 'دوسلدورف',
  'Stuttgart': 'شتوتغارت',
  'Dortmund': 'دورتموند',
  'Essen': 'إيسن',
};

export default function MosqueDetailView({
  mosque,
  nearbyMosques,
  locale,
}: MosqueDetailViewProps) {
  const dict = getDictionary(locale);
  const localized = mosque.translations[locale] || mosque.translations.de;
  const isCurrentlyOpen = isOpenNow(mosque.openingHours);

  const cityConfig = CITY_CONFIGS.find((c) => c.canonical === mosque.city) || {
    canonical: mosque.city,
    slug: mosque.city.toLowerCase(),
    englishSlug: mosque.city.toLowerCase(),
    state: mosque.state || 'Deutschland',
  };

  const citySlug = locale === 'en' ? cityConfig.englishSlug : cityConfig.slug;
  const cityName =
    locale === 'en'
      ? cityConfig.englishSlug.charAt(0).toUpperCase() + cityConfig.englishSlug.slice(1)
      : locale === 'ar'
      ? ARABIC_CITY_NAMES[cityConfig.canonical] || cityConfig.canonical
      : cityConfig.canonical;

  const countryName =
    locale === 'en' ? 'Germany' : locale === 'ar' ? 'ألمانيا' : 'Deutschland';

  // Breadcrumbs data
  const breadcrumbItems = [
    { name: 'Home', url: getHomeUrl(locale) },
    { name: countryName, url: getHomeUrl(locale) },
    { name: cityName, url: getCityUrl(locale, cityConfig.canonical) },
    ...(mosque.district
      ? [{ name: mosque.district, url: `${getCityUrl(locale, cityConfig.canonical)}?district=${encodeURIComponent(mosque.district)}` }]
      : []),
    { name: localized.name, url: getMosqueUrl(locale, cityConfig.canonical, mosque.slug) },
  ];

  // Map marker for current mosque
  const marker: MapMarker = {
    id: mosque.id,
    title: localized.name,
    latitude: mosque.latitude,
    longitude: mosque.longitude,
    address: mosque.address,
    slug: mosque.slug,
    district: mosque.district,
    detailUrl: getMosqueUrl(locale, cityConfig.canonical, mosque.slug),
    rating: mosque.rating,
  };

  const mosqueJsonLd = generateMosqueJsonLd(mosque, locale);
  const breadcrumbsJsonLd = generateBreadcrumbJsonLd(breadcrumbItems);

  const breadcrumbAriaLabel =
    locale === 'en'
      ? 'Breadcrumb navigation'
      : locale === 'ar'
      ? 'مسار التنقل'
      : 'Brotkrümelnavigation';

  return (
    <>
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(mosqueJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label={breadcrumbAriaLabel}
          className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-6 font-medium"
        >
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={item.url + index}>
              {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              {index === breadcrumbItems.length - 1 ? (
                <span className="text-slate-900 font-semibold truncate max-w-xs">{item.name}</span>
              ) : (
                <Link href={item.url} className="hover:text-brand-700 transition-colors">
                  {item.name}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Header Block */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {mosque.district && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-800">
                    {mosque.city}-{mosque.district}
                  </span>
                )}
                {mosque.organization && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200">
                    {mosque.organization}
                  </span>
                )}
                {mosque.verificationStatus === 'OFFICIALLY_VERIFIED' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {dict.common.verified}
                  </span>
                ) : mosque.verificationStatus === 'COMMUNITY_VERIFIED' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {dict.common.communityVerified}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    {dict.common.unverified}
                  </span>
                )}
                {isCurrentlyOpen !== null && (
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isCurrentlyOpen
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {isCurrentlyOpen ? dict.common.openNow : dict.common.closed}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                {localized.name}
              </h1>

              {/* Address */}
              <p className="text-sm sm:text-base text-slate-600 flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                <span>{mosque.address}</span>
              </p>

              {/* Rating */}
              {mosque.rating && (
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-600">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{mosque.rating}</span>
                  </div>
                  <span className="text-slate-400 font-normal">
                    ({mosque.reviewCount} {dict.common.reviews})
                  </span>
                </div>
              )}
            </div>

            {/* Direct Action Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-brand-600/20"
              >
                <Navigation className="w-4 h-4" />
                <span>{dict.common.directions}</span>
              </a>

              {mosque.phone && (
                <a
                  href={`tel:${mosque.phone}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium rounded-xl text-sm border border-slate-200 transition-colors"
                >
                  <Phone className="w-4 h-4 text-brand-600" />
                  <span>{locale === 'en' ? 'Call' : locale === 'ar' ? 'اتصال' : 'Anrufen'}</span>
                </a>
              )}

              {mosque.website && (
                <a
                  href={mosque.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium rounded-xl text-sm border border-slate-200 transition-colors"
                >
                  <Globe className="w-4 h-4 text-brand-600" />
                  <span>{locale === 'en' ? 'Website' : locale === 'ar' ? 'الموقع' : 'Website'}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
          {/* Main Details (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Facilities & Amenities Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-600" />
                <span>{dict.common.facilities}</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mosque.facilities.womenArea ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-400'}`}>
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{dict.common.womenArea}</span>
                    <span className="text-xs text-slate-500">
                      {mosque.facilities.womenArea ? (locale === 'en' ? 'Available' : locale === 'ar' ? 'متاح' : 'Verfügbar') : dict.common.noInfo}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mosque.facilities.wheelchairAccessible ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-400'}`}>
                    <Accessibility className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{dict.common.wheelchair}</span>
                    <span className="text-xs text-slate-500">
                      {mosque.facilities.wheelchairAccessible ? (locale === 'en' ? 'Accessible entrance' : locale === 'ar' ? 'مدخل ميسر' : 'Barrierefreier Zugang') : dict.common.noInfo}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mosque.facilities.parking ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-400'}`}>
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{dict.common.parking}</span>
                    <span className="text-xs text-slate-500">
                      {mosque.facilities.parking ? (locale === 'en' ? 'Parking available' : locale === 'ar' ? 'موقف سيارات' : 'Parkmöglichkeiten vorhanden') : dict.common.noInfo}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${mosque.facilities.restroom ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-400'}`}>
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{dict.common.restroom}</span>
                    <span className="text-xs text-slate-500">
                      {mosque.facilities.restroom ? (locale === 'en' ? 'Available' : locale === 'ar' ? 'متاح' : 'WCs vorhanden') : dict.common.noInfo}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prayer Times Section (Strict rule: only when verified/available) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-600" />
                <span>{dict.detail.prayerTimesTitle}</span>
              </h2>
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {dict.detail.prayerTimesNotice}
                </p>
              </div>
            </div>

            {/* Opening Hours Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-600" />
                <span>{dict.detail.openingHours}</span>
              </h2>

              {mosque.openingHours && mosque.openingHours.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {mosque.openingHours.map((h) => {
                    const isToday =
                      new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() ===
                      h.day.toLowerCase();
                    return (
                      <div
                        key={h.day}
                        className={`flex items-center justify-between p-2.5 rounded-lg border ${
                          isToday
                            ? 'bg-brand-50/80 border-brand-200 text-brand-950 font-bold'
                            : 'bg-slate-50/60 border-slate-100 text-slate-700'
                        }`}
                      >
                        <span>{h.day}</span>
                        <span>{h.hours}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  {dict.detail.hoursNotAvailable}
                </p>
              )}
            </div>

            {/* Interactive Map */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-600" />
                <span>{dict.detail.address}</span>
              </h2>
              <div className="h-72 w-full rounded-xl overflow-hidden mb-3">
                <MapContainer
                  markers={[marker]}
                  center={[mosque.latitude, mosque.longitude]}
                  zoom={15}
                  locale={locale}
                />
              </div>
              <p className="text-xs text-slate-500">
                {mosque.address} &bull; {mosque.postalCode} {mosque.city}
              </p>
            </div>
          </div>

          {/* Sidebar: District Navigation & Nearby Mosques (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* District Navigation Link Box */}
            {mosque.district && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  {dict.detail.districtNavigation}
                </h3>
                <p className="text-xs text-slate-600 mb-3">
                  {locale === 'en'
                    ? `Explore all mosques and prayer spaces in ${cityName} (${mosque.district}).`
                    : locale === 'ar'
                    ? `استكشف جميع المصليات والمساجد في ${cityName} (${mosque.district}).`
                    : `Entdecke alle Gebetsräume und Gemeinschaften in ${cityName} (${mosque.district}).`}
                </p>
                <Link
                  href={`${getCityUrl(locale, cityConfig.canonical)}?district=${encodeURIComponent(mosque.district)}`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:text-brand-900"
                >
                  {locale === 'en'
                    ? `View all mosques in ${mosque.district} →`
                    : locale === 'ar'
                    ? `عرض جميع مساجد ${mosque.district} ←`
                    : `Alle Moscheen in ${mosque.district} ansehen →`}
                </Link>
              </div>
            )}

            {/* Nearby Mosques List */}
            {nearbyMosques && nearbyMosques.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-brand-600" />
                  <span>{dict.detail.nearbyTitle}</span>
                </h3>

                <div className="space-y-3">
                  {nearbyMosques.map((nearby) => {
                    const nearbyDetailUrl = getMosqueUrl(locale, nearby.city || cityConfig.canonical, nearby.slug);
                    const formattedDist = nearby.distanceKm !== undefined ? formatDistance(nearby.distanceKm, locale) : null;
                    const nearbyName = nearby.translations[locale]?.name || nearby.canonicalName;

                    return (
                      <Link
                        key={nearby.id}
                        href={nearbyDetailUrl}
                        className="block p-3 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/80 transition-all group focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-slate-800 group-hover:text-brand-700 transition-colors line-clamp-1">
                            {nearbyName}
                          </h4>
                          {formattedDist && (
                            <span className="text-[11px] font-semibold text-emerald-700 whitespace-nowrap">
                              {formattedDist}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                          {nearby.address}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
