import React from 'react';
import { notFound } from 'next/navigation';
import { isValidLocale, Locale } from '@/lib/i18n';
import { getMosqueRepository } from '@/lib/db';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieConsent from '@/components/CookieConsent';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'en' }, { locale: 'ar' }];
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const repo = getMosqueRepository();
  const mosques = await repo.getAllPublished();
  const cities = await repo.getCities();

  const isRtl = locale === 'ar';

  return (
    <html lang={locale} dir={isRtl ? 'rtl' : 'ltr'}>
      <body className="min-h-screen flex flex-col">
        <Header locale={locale} cityCount={cities.length} />
        <main className="flex-1">{children}</main>
        <Footer
          locale={locale}
          totalMosques={mosques.length}
          cityCount={cities.length}
        />
        <CookieConsent locale={locale} />
      </body>
    </html>
  );
}
