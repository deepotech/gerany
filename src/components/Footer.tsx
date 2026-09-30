import React from 'react';
import Link from 'next/link';
import { Locale, getDictionary } from '@/lib/i18n';
import { getCityUrl, getHomeUrl, getSearchUrl } from '@/lib/routes';
import { getPublishedCityConfigs } from '@/pipeline/city-config';

interface FooterProps {
  locale: Locale;
  totalMosques?: number;
  cityCount?: number;
}

export default function Footer({ locale, totalMosques, cityCount }: FooterProps) {
  const dict = getDictionary(locale);
  const activeCityCount = cityCount || getPublishedCityConfigs().length;

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand & Purpose */}
          <div className="md:col-span-1">
            <span className="font-bold text-white text-lg tracking-tight block mb-2">
              MoscheeAtlas.de
            </span>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              {dict.common.tagline}. Erfasste lokale Gebetsstätten, Kontaktdaten, Barrierefreiheit und Wegbeschreibungen in ganz Deutschland.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-950 text-brand-300 border border-brand-800 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              {activeCityCount} {locale === 'en' ? 'Cities' : locale === 'ar' ? 'مدن' : 'Städte'} {totalMosques ? `• ${totalMosques} ${locale === 'en' ? 'Mosques' : locale === 'ar' ? 'مسجد' : 'Moscheen'}` : ''} live
            </div>
          </div>

          {/* Cities SEO Internal Linking */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">
              {locale === 'en' ? 'Mosques by City' : locale === 'ar' ? 'المساجد حسب المدينة' : 'Moscheen nach Stadt'}
            </h4>
            <ul className="space-y-2 text-sm">
              {getPublishedCityConfigs().map((c) => {
                const slug = locale === 'en' ? c.englishSlug : c.slug;
                return (
                  <li key={c.canonical}>
                    <Link
                      href={getCityUrl(locale, slug)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {locale === 'en' ? `Mosques in ${c.canonical}` : locale === 'ar' ? `مساجد ${c.canonical}` : `Moscheen in ${c.canonical}`}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Popular Cities in Germany */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">
              {dict.common.popularCities}
            </h4>
            <ul className="space-y-2 text-sm">
              {getPublishedCityConfigs().map((c) => {
                const slug = locale === 'en' ? c.englishSlug : c.slug;
                return (
                  <li key={c.canonical} className="flex items-center gap-2">
                    <Link
                      href={getCityUrl(locale, slug)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {c.canonical}
                    </Link>
                    <span className="text-[10px] uppercase font-bold bg-brand-900 text-brand-300 px-1.5 py-0.5 rounded">
                      Live
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>


          {/* Geographic Hierarchy & SEO Structure */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">
              {locale === 'en' ? 'Geographic Hierarchy' : locale === 'ar' ? 'التسلسل الجغرافي' : 'Geografische Hierarchie'}
            </h4>
            <div className="text-xs text-slate-400 space-y-2">
              <p>
                <strong className="text-slate-300">{locale === 'en' ? 'Country:' : locale === 'ar' ? 'الدولة:' : 'Land:'}</strong> {locale === 'en' ? 'Germany' : locale === 'ar' ? 'ألمانيا' : 'Deutschland'}
              </p>
              <p>
                <strong className="text-slate-300">{locale === 'en' ? 'Regions:' : locale === 'ar' ? 'الولايات:' : 'Regionen:'}</strong> {locale === 'en' ? '6 Federal States' : locale === 'ar' ? '6 ولايات اتحادية' : '6 Bundesländer'}
              </p>
              <p>
                <strong className="text-slate-300">{locale === 'en' ? 'Cities:' : locale === 'ar' ? 'المدن:' : 'Städte:'}</strong> {activeCityCount} {locale === 'en' ? 'Major German cities' : locale === 'ar' ? 'مدن ألمانية كبرى' : 'Großstädte in Deutschland'}
              </p>
              <p>
                <strong className="text-slate-300">{locale === 'en' ? 'Directory Type:' : locale === 'ar' ? 'نوع الدليل:' : 'Verzeichnis-Typ:'}</strong> {locale === 'en' ? 'National structured search service' : locale === 'ar' ? 'دليل وطني منظم للبحث' : 'Nationaler strukturierter Suchdienst'}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>&copy; {new Date().getFullYear()} MoscheeAtlas.de. {locale === 'en' ? 'All rights reserved.' : locale === 'ar' ? 'جميع الحقوق محفوظة.' : 'Alle Rechte vorbehalten.'}</p>
          <div className="flex items-center gap-6">
            <Link href={getHomeUrl(locale)} className="hover:text-slate-300">
              Home
            </Link>
            <Link href={getCityUrl(locale, 'berlin')} className="hover:text-slate-300">
              Berlin
            </Link>
            <Link href={getSearchUrl(locale)} className="hover:text-slate-300">
              {dict.common.search}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
