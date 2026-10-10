import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/lib/i18n';
import { SITE_URL, SITE_NAME } from '@/lib/config';
import { FileText, Mail, Scale, Info } from 'lucide-react';

interface ImpressumPageProps {
  params: {
    locale: string;
  };
}

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'en' }, { locale: 'ar' }];
}

export async function generateMetadata({ params }: ImpressumPageProps): Promise<Metadata> {
  const { locale } = params;
  if (!isValidLocale(locale)) return {};

  const title =
    locale === 'en'
      ? 'Legal Notice / Imprint'
      : locale === 'ar'
      ? 'إشعار قانوني وبيانات الموقع'
      : 'Impressum & Anbieterkennzeichnung';

  const description =
    locale === 'en'
      ? 'Legal notice and provider identification for MoscheeAtlas in accordance with German telemedia law (§ 5 DDG).'
      : locale === 'ar'
      ? 'الإشعار القانوني وهوية المشغل لمنصة MoscheeAtlas وفقاً للقانون الألماني (§ 5 DDG).'
      : 'Impressum und gesetzliche Anbieterkennzeichnung von MoscheeAtlas nach § 5 Digitale-Dienste-Gesetz (DDG).';

  const canonicalPath = `/${locale}/impressum`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        de: '/de/impressum',
        en: '/en/impressum',
        ar: '/ar/impressum',
        'x-default': '/de/impressum',
      },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${canonicalPath}`,
      siteName: SITE_NAME,
      locale: locale === 'de' ? 'de_DE' : locale === 'ar' ? 'ar_AR' : 'en_US',
      type: 'website',
    },
  };
}

export default async function ImpressumPage({ params }: ImpressumPageProps) {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Qualified legal review recommended before full commercial launch */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-10 text-slate-700 text-xs sm:text-sm flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          Diese Anbieterkennzeichnung basiert auf den tatsächlichen Betreiberdaten (Privatperson, Wohnsitz Marokko, kein eingetragenes Unternehmen).
          Eine Überprüfung durch einen qualifizierten Rechtsanwalt zur Anwendbarkeit des § 5 DDG auf Betreiber mit Wohnsitz außerhalb der EU wird vor dem offiziellen Regelbetrieb empfohlen.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 space-y-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-3">
            <Scale className="w-3.5 h-3.5 text-brand-600" />
            <span>Rechtliche Informationen</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Impressum
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Anbieterkennzeichnung für das Online-Verzeichnis {SITE_NAME} ({SITE_URL})
          </p>
        </div>

        {/* Section 1: Diensteanbieter */}
        <section className="space-y-3 border-t border-slate-100 pt-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-600" />
            <span>Angaben zum Diensteanbieter</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Diensteanbieter dieses Onlineverzeichnisses ist eine natürliche Person (Privatperson ohne Handelsregistereintrag):
          </p>
          <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <p className="font-semibold text-slate-900">Dounia Elmarradi</p>
            <p className="text-slate-600">
              Rechtsform: Natürliche Person (kein eingetragenes Unternehmen, keine juristische Person)
            </p>
            <p className="text-slate-600 pt-1">Anschrift:</p>
            <div className="pl-4 border-l-2 border-slate-300 text-sm text-slate-700 space-y-0.5">
              <p>Derb Touahra Echoara</p>
              <p>El Kalaa des Sraghna</p>
              <p>Marokko (Morocco)</p>
            </div>
          </div>
        </section>

        {/* Section 2: Kontakt */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-brand-600" />
            <span>Kontaktmöglichkeiten</span>
          </h2>
          <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p>
              E-Mail:{' '}
              <a
                href="mailto:dounia.elmarradi@gmail.com"
                className="font-mono text-brand-700 hover:underline"
              >
                dounia.elmarradi@gmail.com
              </a>
            </p>
          </div>
        </section>

        {/* Section 3: Redaktionelle Verantwortung */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">
            Verantwortlich für redaktionelle Inhalte (§ 18 Abs. 2 MStV)
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Soweit dieses Angebot journalistisch-redaktionell gestaltete Inhalte bereithält, ist verantwortlich:
          </p>
          <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-0.5">
            <p className="font-semibold text-slate-900">Dounia Elmarradi</p>
            <p className="text-slate-600">Derb Touahra Echoara, El Kalaa des Sraghna, Marokko</p>
          </div>
        </section>

        {/* Section 4: Haftungsausschluss */}
        <section className="space-y-4 border-t border-slate-100 pt-6 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900">Haftung für Inhalte und Verzeichnisdaten</h2>
          <p>
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
            Die Angaben zu Moscheen, Gebetsräumen, Öffnungszeiten, Ausstattungsmerkmalen und Zuordnungen werden auf Basis frei zugänglicher Geodaten (u.a. OpenStreetMap) sowie öffentlich verifizierter Gemeindequellen aggregiert.
            Wir bemühen uns um eine sorgfältige und aktuelle Erfassung. Da sich Öffnungszeiten und Angebote von Gemeinden ändern können, übernehmen wir keine Gewähr für die ständige Vollständigkeit, Richtigkeit oder permanente Verfügbarkeit einzelner Einrichtungen.
          </p>

          <h2 className="text-base font-bold text-slate-900 pt-2">Haftung für externe Links</h2>
          <p>
            Unser Internetangebot enthält Links zu externen Websites Dritter (beispielsweise offizielle Webpräsenzen von Moscheegemeinden oder Routenplanungsdienste), auf deren Inhalte wir keinen Einfluss haben.
            Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
          </p>

          <h2 className="text-base font-bold text-slate-900 pt-2">Urheberrecht</h2>
          <p>
            Die durch den Betreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem Urheberrecht.
            Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
          </p>
        </section>
      </div>
    </div>
  );
}
