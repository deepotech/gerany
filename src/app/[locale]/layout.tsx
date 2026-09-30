import React from 'react';
import { notFound } from 'next/navigation';
import { isValidLocale, Locale } from '@/lib/i18n';
import { getMosqueRepository } from '@/lib/db';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
    <div lang={locale} dir={isRtl ? 'rtl' : 'ltr'} className="flex flex-col min-h-screen">
      <Header locale={locale} cityCount={cities.length} />
      <main className="flex-1">{children}</main>
      <Footer
        locale={locale}
        totalMosques={mosques.length}
        cityCount={cities.length}
      />
    </div>
  );
}
