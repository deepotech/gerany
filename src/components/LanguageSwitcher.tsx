'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Locale } from '@/lib/i18n';
import { getCityConfigBySlug } from '@/lib/routes';

interface LanguageSwitcherProps {
  currentLocale: Locale;
}

const LANGUAGES: Array<{ code: Locale; label: string; flag: string }> = [
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

export default function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const pathname = usePathname();

  // Helper to replace locale prefix in current URL
  const getLocalizedPath = (targetLocale: Locale) => {
    if (!pathname) return `/${targetLocale}`;
    const segments = pathname.split('/');
    // segments[1] is current locale ('de', 'en', or 'ar')
    if (segments.length > 1 && ['de', 'en', 'ar'].includes(segments[1])) {
      // Handle route names across locales
      // e.g., /de/moscheen/berlin -> /en/mosques/berlin or /ar/mosques/berlin
      if (segments[2] === 'moscheen' || segments[2] === 'mosques') {
        const rawCity = segments[3];
        let citySegment = '';
        if (rawCity) {
          const config = getCityConfigBySlug(rawCity);
          citySegment = config
            ? targetLocale === 'en'
              ? config.englishSlug
              : config.slug
            : rawCity;
        }
        const listName = targetLocale === 'de' ? 'moscheen' : 'mosques';
        return `/${targetLocale}/${listName}${citySegment ? `/${citySegment}` : ''}`;
      }
      if (segments[2] === 'moschee' || segments[2] === 'mosque') {
        const rawCity = segments[3];
        let citySegment = '';
        if (rawCity) {
          const config = getCityConfigBySlug(rawCity);
          citySegment = config
            ? targetLocale === 'en'
              ? config.englishSlug
              : config.slug
            : rawCity;
        }
        const singleName = targetLocale === 'de' ? 'moschee' : 'mosque';
        const slug = segments[4] || '';
        return `/${targetLocale}/${singleName}/${citySegment}/${slug}`;
      }
      segments[1] = targetLocale;
      return segments.join('/');
    }
    return `/${targetLocale}`;
  };

  return (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
      {LANGUAGES.map((lang) => {
        const isActive = lang.code === currentLocale;
        const ariaLabel =
          currentLocale === 'ar'
            ? `تغيير اللغة إلى ${lang.label}`
            : currentLocale === 'en'
            ? `Switch language to ${lang.label}`
            : `Sprache wechseln zu ${lang.label}`;
        return (
          <Link
            key={lang.code}
            href={getLocalizedPath(lang.code)}
            className={`px-2.5 py-1 rounded-md transition-all duration-150 flex items-center gap-1 ${
              isActive
                ? 'bg-white text-brand-800 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
            aria-label={ariaLabel}
          >
            <span>{lang.flag}</span>
            <span>{lang.code.toUpperCase()}</span>
          </Link>
        );
      })}
    </div>
  );
}
