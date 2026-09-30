'use client';

import React, { useState, useMemo } from 'react';
import { MosqueEntity } from '@/pipeline/types';
import { MosqueWithDistance } from '@/lib/db/types';
import { Locale, getDictionary } from '@/lib/i18n';
import MosqueCard from './MosqueCard';
import MapContainer from './map/MapContainer';
import { MapMarker } from './map/types';
import { getMosqueUrl } from '@/lib/routes';
import { haversineDistanceKm, isOpenNow } from '@/lib/db/geo';
import { normalizeGermanPhonetic } from '@/lib/normalize';
import { Search, Navigation, X, Map, List, Check } from 'lucide-react';

interface SearchClientProps {
  initialMosques: MosqueEntity[];
  districts: string[];
  locale: Locale;
  initialDistrict?: string;
  initialQuery?: string;
  cityTitle?: string;
}

export default function SearchClient({
  initialMosques,
  districts,
  locale,
  initialDistrict = '',
  initialQuery = '',
  cityTitle,
}: SearchClientProps) {
  const dict = getDictionary(locale);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedDistrict, setSelectedDistrict] = useState(initialDistrict);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [filterParking, setFilterParking] = useState(false);
  const [filterWheelchair, setFilterWheelchair] = useState(false);
  const [filterWomen, setFilterWomen] = useState(false);
  const [filterRestroom, setFilterRestroom] = useState(false);

  // Geolocation State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Map & View Mode
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list');

  // Trigger browser geolocation
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation wird nicht unterstützt');
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setLocationError(dict.common.locationDenied);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Filter & Sort Pipeline
  const filteredMosques = useMemo(() => {
    let list: MosqueWithDistance[] = initialMosques.map((m) => {
      const copy: MosqueWithDistance = { ...m };
      if (userLocation) {
        copy.distanceKm = haversineDistanceKm(
          userLocation.lat,
          userLocation.lng,
          m.latitude,
          m.longitude
        );
      }
      return copy;
    });

    // 1. Text Query Search with Phonetic Normalization & Multi-Token Matching
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length > 0) {
      const qRaw = trimmedQuery.toLowerCase();
      const qNorm = normalizeGermanPhonetic(trimmedQuery);
      const queryTokens = qNorm.split(/\s+/).filter(Boolean);

      list = list.filter((m) => {
        const titleRaw = m.canonicalName.toLowerCase();
        const titleNorm = normalizeGermanPhonetic(m.canonicalName);
        const locTitleRaw = (m.translations[locale]?.name || '').toLowerCase();
        const locTitleNorm = normalizeGermanPhonetic(locTitleRaw);
        const deNameNorm = normalizeGermanPhonetic(m.translations.de?.name || '');
        const arNameRaw = m.translations.ar?.name || '';
        const addressNorm = normalizeGermanPhonetic(m.address);
        const cityNorm = normalizeGermanPhonetic(m.city);
        const districtNorm = m.district ? normalizeGermanPhonetic(m.district) : '';
        const postalCode = m.postalCode;
        const orgNorm = m.organization ? normalizeGermanPhonetic(m.organization) : '';

        // Exact substring / postal match directly
        if (
          titleRaw.includes(qRaw) ||
          locTitleRaw.includes(qRaw) ||
          arNameRaw.includes(qRaw) ||
          postalCode.includes(qRaw) ||
          cityNorm.includes(qNorm) ||
          titleNorm.includes(qNorm)
        ) {
          return true;
        }

        // Multi-token match: every word in query must match at least one normalized field
        if (queryTokens.length > 1) {
          const matchAllTokens = queryTokens.every((token) => {
            return (
              titleNorm.includes(token) ||
              locTitleNorm.includes(token) ||
              deNameNorm.includes(token) ||
              addressNorm.includes(token) ||
              cityNorm.includes(token) ||
              districtNorm.includes(token) ||
              postalCode.includes(token) ||
              orgNorm.includes(token)
            );
          });
          if (matchAllTokens) return true;
        }

        // Single normalized token match
        return (
          addressNorm.includes(qNorm) ||
          districtNorm.includes(qNorm) ||
          orgNorm.includes(qNorm)
        );
      });
    }

    // 2. District Filter
    if (selectedDistrict) {
      const dNorm = normalizeGermanPhonetic(selectedDistrict);
      list = list.filter(
        (m) => m.district && normalizeGermanPhonetic(m.district) === dNorm
      );
    }

    // 3. Open Now Filter
    if (openNowOnly) {
      const now = new Date();
      list = list.filter((m) => isOpenNow(m.openingHours, now) === true);
    }

    // 4. Facilities Filters (unknown != false: only filter when mosque.facilities[prop] === true)
    if (filterParking) list = list.filter((m) => m.facilities.parking === true);
    if (filterWheelchair) list = list.filter((m) => m.facilities.wheelchairAccessible === true);
    if (filterWomen) list = list.filter((m) => m.facilities.womenArea === true);
    if (filterRestroom) list = list.filter((m) => m.facilities.restroom === true);

    // 5. Distance Sorting
    if (userLocation) {
      list.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    }

    return list;
  }, [
    initialMosques,
    searchQuery,
    selectedDistrict,
    openNowOnly,
    filterParking,
    filterWheelchair,
    filterWomen,
    filterRestroom,
    userLocation,
    locale,
  ]);

  // Generate Map Markers
  const mapMarkers: MapMarker[] = useMemo(() => {
    return filteredMosques.map((m) => ({
      id: m.id,
      title: m.translations[locale]?.name || m.canonicalName,
      latitude: m.latitude,
      longitude: m.longitude,
      address: m.address,
      slug: m.slug,
      district: m.district,
      detailUrl: getMosqueUrl(locale, m.city, m.slug),
      rating: m.rating,
      reviewCount: m.reviewCount,
    }));
  }, [filteredMosques, locale]);

  const activeFiltersCount =
    (selectedDistrict ? 1 : 0) +
    (openNowOnly ? 1 : 0) +
    (filterParking ? 1 : 0) +
    (filterWheelchair ? 1 : 0) +
    (filterWomen ? 1 : 0) +
    (filterRestroom ? 1 : 0);

  const resetFilters = () => {
    setSelectedDistrict('');
    setOpenNowOnly(false);
    setFilterParking(false);
    setFilterWheelchair(false);
    setFilterWomen(false);
    setFilterRestroom(false);
    setSearchQuery('');
  };

  const defaultTitle =
    locale === 'en'
      ? 'Mosques in Germany'
      : locale === 'ar'
      ? 'دليل مساجد ألمانيا'
      : 'Moscheen in Deutschland';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header & Title */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {cityTitle || defaultTitle}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {filteredMosques.length}{' '}
          {locale === 'en' ? 'mosques available' : locale === 'ar' ? 'مسجد متاح' : 'Moscheen gefunden'}
          {userLocation ? ` • ${locale === 'en' ? 'Sorted by distance' : locale === 'ar' ? 'مرتبة حسب المسافة' : 'Sortiert nach Entfernung'}` : ''}
        </p>
      </div>

      {/* Main Search & Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="search"
              role="searchbox"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={dict.common.searchPlaceholder}
              aria-label={dict.common.searchPlaceholder}
              className="w-full pl-11 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all text-slate-900"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Suche zurücksetzen"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Near Me Location CTA */}
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isLocating}
            aria-label={isLocating ? dict.common.loadingLocation : dict.common.nearMe}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
              userLocation
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <Navigation className={`w-4 h-4 text-brand-600 ${isLocating ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>
              {isLocating
                ? dict.common.loadingLocation
                : userLocation
                ? (locale === 'en' ? 'Location active' : locale === 'ar' ? 'الموقع مفعّل' : 'Standort aktiv')
                : dict.common.nearMe}
            </span>
          </button>
        </div>

        {locationError && (
          <p className="text-xs text-rose-600 mt-2 px-1" role="alert">{locationError}</p>
        )}

        {/* Filter Pills */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          {/* District Select */}
          {districts.length > 0 && (
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              aria-label={dict.common.filterByDistrict}
              className="text-xs font-medium py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">{dict.common.allDistricts}</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}

          {/* Open Now Toggle */}
          <button
            type="button"
            onClick={() => setOpenNowOnly(!openNowOnly)}
            aria-pressed={openNowOnly}
            className={`text-xs font-medium py-1.5 px-3 rounded-lg border transition-colors flex items-center gap-1.5 ${
              openNowOnly
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {openNowOnly && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
            <span>{dict.common.openNow}</span>
          </button>

          {/* Facilities Toggles */}
          <button
            type="button"
            onClick={() => setFilterWheelchair(!filterWheelchair)}
            aria-pressed={filterWheelchair}
            className={`text-xs font-medium py-1.5 px-3 rounded-lg border transition-colors flex items-center gap-1.5 ${
              filterWheelchair
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {filterWheelchair && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
            <span>{dict.common.wheelchair}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterParking(!filterParking)}
            aria-pressed={filterParking}
            className={`text-xs font-medium py-1.5 px-3 rounded-lg border transition-colors flex items-center gap-1.5 ${
              filterParking
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {filterParking && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
            <span>{dict.common.parking}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterWomen(!filterWomen)}
            aria-pressed={filterWomen}
            className={`text-xs font-medium py-1.5 px-3 rounded-lg border transition-colors flex items-center gap-1.5 ${
              filterWomen
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {filterWomen && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
            <span>{dict.common.womenArea}</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterRestroom(!filterRestroom)}
            aria-pressed={filterRestroom}
            className={`text-xs font-medium py-1.5 px-3 rounded-lg border transition-colors flex items-center gap-1.5 ${
              filterRestroom
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {filterRestroom && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
            <span>{dict.common.restroom}</span>
          </button>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-rose-600 hover:text-rose-800 font-medium ml-auto px-2 py-1"
            >
              {dict.common.resetFilters} ({activeFiltersCount})
            </button>
          )}
        </div>
      </div>

      {/* Mobile View Switcher (List vs Map) */}
      <div
        role="tablist"
        aria-label={locale === 'en' ? 'Select view' : locale === 'ar' ? 'اختر طريقة العرض' : 'Ansicht auswählen'}
        className="lg:hidden flex items-center justify-center p-1 bg-slate-200/70 rounded-xl mb-4 text-xs font-semibold"
      >
        <button
          role="tab"
          aria-selected={mobileTab === 'list'}
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'list'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <List className="w-4 h-4" aria-hidden="true" />
          <span>{locale === 'en' ? 'List' : locale === 'ar' ? 'قائمة' : 'Liste'} ({filteredMosques.length})</span>
        </button>
        <button
          role="tab"
          aria-selected={mobileTab === 'map'}
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'map'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Map className="w-4 h-4" aria-hidden="true" />
          <span>{locale === 'en' ? 'Map' : locale === 'ar' ? 'الخريطة' : 'Karte'}</span>
        </button>
      </div>

      {/* Two Column Layout: Mosque List + Sticky Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Mosque List Column */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'map' ? 'hidden lg:block' : 'block'}`}>
          {filteredMosques.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" aria-hidden="true" />
              <h3 className="text-base font-bold text-slate-900">{dict.common.noResults}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {openNowOnly
                  ? (locale === 'en'
                      ? 'Opening hours are only shown when verified by the community. Try turning off "Open now".'
                      : locale === 'ar'
                      ? 'أوقات العمل تُعرض فقط عند تأكيدها. جرب إيقاف تصفية "مفتوح الآن".'
                      : 'Öffnungszeiten werden nur angezeigt, wenn sie von der Gemeinde bestätigt wurden. Schalte den Filter „Jetzt geöffnet“ aus.')
                  : dict.common.noResultsHint}
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 inline-flex items-center text-xs font-semibold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-lg transition-colors"
              >
                {dict.common.resetFilters}
              </button>
            </div>
          ) : (
            filteredMosques.map((mosque) => (
              <div
                key={mosque.id}
                onMouseEnter={() => setActiveMarkerId(mosque.id)}
                onMouseLeave={() => setActiveMarkerId(null)}
              >
                <MosqueCard
                  mosque={mosque}
                  locale={locale}
                  highlighted={activeMarkerId === mosque.id}
                />
              </div>
            ))
          )}
        </div>

        {/* Sticky Map Column */}
        <div className={`lg:col-span-5 lg:sticky lg:top-24 ${mobileTab === 'list' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm h-[400px] lg:h-[calc(100vh-140px)]">
            <MapContainer
              markers={mapMarkers}
              activeMarkerId={activeMarkerId}
              onMarkerSelect={(m) => setActiveMarkerId(m.id)}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
