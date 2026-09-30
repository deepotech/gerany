import React from 'react';
import Link from 'next/link';
import { MosqueWithDistance } from '@/lib/db/types';
import { Locale, getDictionary } from '@/lib/i18n';
import { getMosqueUrl } from '@/lib/routes';
import { MapPin, Star, Navigation, Clock, Check, Car, Accessibility, Users } from 'lucide-react';
import { isOpenNow } from '@/lib/db/geo';

interface MosqueCardProps {
  mosque: MosqueWithDistance;
  locale: Locale;
  highlighted?: boolean;
}

export default function MosqueCard({ mosque, locale, highlighted = false }: MosqueCardProps) {
  const dict = getDictionary(locale);
  const detailUrl = getMosqueUrl(locale, mosque.city, mosque.slug);

  // Localized title
  const localizedName = mosque.translations[locale]?.name || mosque.canonicalName;
  const isCurrentlyOpen = isOpenNow(mosque.openingHours);

  return (
    <article
      aria-labelledby={`mosque-title-${mosque.id}`}
      className={`group bg-white rounded-xl border p-5 transition-all duration-200 hover:shadow-md ${
        highlighted ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-sm' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
        <div>
          {/* District & Status Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            {mosque.district && (
              <span className="inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {mosque.district}
              </span>
            )}
            {mosque.organization && (
              <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 text-brand-800 border border-brand-200">
                {mosque.organization}
              </span>
            )}
            {mosque.distanceKm !== undefined && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Navigation className="w-3 h-3 text-emerald-600" />
                {Number(mosque.distanceKm.toFixed(1))} {dict.common.kmAway}
              </span>
            )}
            {isCurrentlyOpen !== null && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
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

          {/* Mosque Name */}
          <h3 id={`mosque-title-${mosque.id}`} className="text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors leading-snug">
            <Link href={detailUrl} className="focus:outline-none focus:underline">
              {localizedName}
            </Link>
          </h3>

          {/* Rating */}
          {mosque.rating && (
            <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-amber-600">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{mosque.rating}</span>
              <span className="text-slate-400 font-normal">({mosque.reviewCount} {dict.common.reviews})</span>
            </div>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start gap-2 text-xs text-slate-600 mb-4">
        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <span>{mosque.address}</span>
      </div>

      {/* Facilities Badges (Only shown when true) */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {mosque.facilities.wheelchairAccessible && (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600">
            <Accessibility className="w-3 h-3 text-brand-600" />
            {dict.common.wheelchair}
          </span>
        )}
        {mosque.facilities.parking && (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600">
            <Car className="w-3 h-3 text-brand-600" />
            {dict.common.parking}
          </span>
        )}
        {mosque.facilities.restroom && (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600">
            <Check className="w-3 h-3 text-brand-600" />
            {dict.common.restroom}
          </span>
        )}
        {mosque.facilities.womenArea && (
          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600">
            <Users className="w-3 h-3 text-brand-600" />
            {dict.common.womenArea}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-3">
        <Link
          href={detailUrl}
          className="text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors flex items-center gap-1"
        >
          <span>{dict.common.viewDetails}</span>
          <span aria-hidden="true" className="rtl:rotate-180 inline-block">&rarr;</span>
        </Link>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <Navigation className="w-3.5 h-3.5 text-brand-600" />
          <span>{dict.common.directions}</span>
        </a>
      </div>
    </article>
  );
}
