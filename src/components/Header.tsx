import React from 'react';
import Link from 'next/link';
import { Locale, getDictionary } from '@/lib/i18n';
import LanguageSwitcher from './LanguageSwitcher';
import { Compass, Search, MapPin } from 'lucide-react';
import { getHomeUrl, getSearchUrl } from '@/lib/routes';

interface HeaderProps {
  locale: Locale;
  cityCount?: number;
}

export default function Header({ locale, cityCount = 9 }: HeaderProps) {
  const dict = getDictionary(locale);

  const subtitle =
    locale === 'en'
      ? `${cityCount} Cities • Germany`
      : locale === 'ar'
      ? `${cityCount} مدن • ألمانيا`
      : `${cityCount} Städte • Deutschland`;

  const navAriaLabel =
    locale === 'en'
      ? 'Main navigation'
      : locale === 'ar'
      ? 'التنقل الرئيسي'
      : 'Hauptnavigation';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link
            href={getHomeUrl(locale)}
            className="flex items-center gap-2.5 group focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-lg tracking-tight block leading-tight">
                MoscheeAtlas
              </span>
              <span className="text-xs text-brand-700 font-medium tracking-wide">
                {subtitle}
              </span>
            </div>
          </Link>

          {/* Quick Nav Links */}
          <nav
            aria-label={navAriaLabel}
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <Link
              href={getSearchUrl(locale)}
              className="hover:text-brand-700 transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-md px-2 py-1"
            >
              <MapPin className="w-4 h-4 text-brand-600" />
              <span>{locale === 'en' ? 'Find Mosques' : locale === 'ar' ? 'ابحث عن مسجد' : 'Moscheen finden'}</span>
            </Link>
            <Link
              href={getSearchUrl(locale)}
              className="hover:text-brand-700 transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-md px-2 py-1"
            >
              <Search className="w-4 h-4 text-brand-600" />
              <span>{dict.common.search}</span>
            </Link>
          </nav>

          {/* Language Switcher */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher currentLocale={locale} />
          </div>
        </div>
      </div>
    </header>
  );
}
