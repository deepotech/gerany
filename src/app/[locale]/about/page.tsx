import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isValidLocale } from '@/lib/i18n';
import { SITE_URL, SITE_NAME } from '@/lib/config';
import { getContactUrl, getHomeUrl, getSearchUrl } from '@/lib/routes';
import { generateBreadcrumbJsonLd } from '@/lib/seo/schema';
import { Compass, Database, ShieldCheck, Search, Users, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';

interface AboutPageProps {
  params: {
    locale: string;
  };
}

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'en' }, { locale: 'ar' }];
}

export async function generateMetadata({ params }: AboutPageProps): Promise<Metadata> {
  const { locale } = params;
  if (!isValidLocale(locale)) return {};

  const title =
    locale === 'en'
      ? 'About MoscheeAtlas – Purpose & Verification Methodology'
      : locale === 'ar'
      ? 'عن MoscheeAtlas – رسالة المنصة ومنهجية التحقق'
      : 'Über MoscheeAtlas – Auftrag & Datenverifikation';

  const description =
    locale === 'en'
      ? 'Learn about MoscheeAtlas: an independent directory of mosques in Germany, our 7-stage quality pipeline, and our community verification process.'
      : locale === 'ar'
      ? 'تعرف على MoscheeAtlas: دليل مستقل لمساجد ألمانيا، ومنهجية التدقيق المكونة من 7 مراحل لضمان دقة البيانات الجغرافية والمرافق.'
      : 'Erfahre mehr über MoscheeAtlas: ein unabhängiges Verzeichnis für Moscheen in Deutschland, unsere 7-stufige Daten-Pipeline und Qualitätskriterien.';

  const canonicalPath = `/${locale}/about`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        de: '/de/about',
        en: '/en/about',
        ar: '/ar/about',
        'x-default': '/de/about',
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

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();

  const isAr = locale === 'ar';
  const isEn = locale === 'en';

  const breadcrumbs = generateBreadcrumbJsonLd([
    { name: 'Home', url: getHomeUrl(locale) },
    {
      name: isEn ? 'About Us' : isAr ? 'عن المنصة' : 'Über uns',
      url: `${SITE_URL}/${locale}/about`,
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Breadcrumb Navigation */}
        <nav
          aria-label={isEn ? 'Breadcrumb' : isAr ? 'مسار التنقل' : 'Brotkrümelnavigation'}
          className="flex items-center gap-1.5 text-xs text-slate-500 mb-8 font-medium"
        >
          <Link href={getHomeUrl(locale)} className="hover:text-brand-700 transition-colors">
            {isEn ? 'Home' : isAr ? 'الرئيسية' : 'Startseite'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 rtl:rotate-180" />
          <span className="text-slate-900 font-semibold">
            {isEn ? 'About MoscheeAtlas' : isAr ? 'عن MoscheeAtlas' : 'Über MoscheeAtlas'}
          </span>
        </nav>

        {/* Page Header */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-semibold mb-4">
            <Compass className="w-3.5 h-3.5 text-brand-600" />
            <span>{isEn ? 'Independent Directory' : isAr ? 'دليل مجتمعي مستقل' : 'Unabhängiges Verzeichnis'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
            {isEn
              ? 'About MoscheeAtlas'
              : isAr
              ? 'عن منصة MoscheeAtlas'
              : 'Über das Projekt MoscheeAtlas'}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl">
            {isEn
              ? 'MoscheeAtlas is an open, independent local search directory dedicated to mapping mosques, prayer spaces, and Islamic community centers across major German cities. Our mission is to provide accurate geographic locations, practical accessibility information, and verified community contact details.'
              : isAr
              ? 'منصة MoscheeAtlas هي دليل بحث محلي مستقل يهدف إلى توثيق وتسهيل الوصول إلى المساجد والمصليات والمراكز الإسلامية في المدن الألمانية الكبرى، مع توفير إحداثيات جغرافية دقيقة وتفاصيل المرافق مثل مصليات النساء وتيسير الكراسي المتحركة.'
              : 'MoscheeAtlas ist ein unabhängiger, strukturierter lokaler Suchdienst für Moscheen, Gebetsräume und islamische Gemeinden in deutschen Großstädten. Ziel des Projekts ist es, verlässliche Standort- und Geodaten, Ausstattungsmerkmale sowie praktische Anreisehilfen für Besucher und Gemeindemitglieder bereitzustellen.'}
          </p>
        </div>

        {/* 7-Stage Quality Pipeline Section */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 mb-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-3">
              <Database className="w-3.5 h-3.5 text-brand-600" />
              <span>{isEn ? 'Data Integrity Architecture' : isAr ? 'بنية معالجة البيانات' : 'Datenarchitektur & Pipeline'}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEn
                ? 'Our 7-Stage Data Verification Pipeline'
                : isAr
                ? 'مراحل التحقق السبع لضمان جودة البيانات'
                : 'Die 7-stufige Qualitäts-Pipeline von MoscheeAtlas'}
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              {isEn
                ? 'To ensure that visitors receive truthful information without fabricated details, every record must pass a strict publication pipeline:'
                : isAr
                ? 'لضمان دقة البيانات وتجنب أي معلومات مضللة، يمر كل موقع في الدليل بسلسلة معالجة صارمة قبل النشر:'
                : 'Um verlässliche Daten zu gewährleisten und Falschangaben auszuschließen, durchläuft jeder Datensatz eine mehrstufige Pipeline:'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-black text-brand-700 uppercase tracking-widest block mb-1">
                1. RAW INGESTION
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {isEn
                  ? 'Source data is gathered from public open geodata (OpenStreetMap) and verified public registries. Raw values are permanently archived.'
                  : isAr
                  ? 'يتم تجميع البيانات الأولية من مصادر جغرافية عامة مفتوحة (مثل OpenStreetMap) وسجلات معتمدة مع حفظ البيانات الأصلية.'
                  : 'Rohdaten werden aus offenen Geodatenquellen (u.a. OpenStreetMap) und öffentlich zugänglichen Registern erfasst und revisionssicher archiviert.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-black text-brand-700 uppercase tracking-widest block mb-1">
                2. NORMALIZATION
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {isEn
                  ? 'Addresses, postal codes, and German phone numbers are standardized. Coordinates are verified against German national boundaries (47.0°N–55.5°N, 5.5°E–15.5°E).'
                  : isAr
                  ? 'تتم مطابقة العناوين البريدية وصيغ الهواتف الألمانية والتحقق من وقوع الإحداثيات داخل الحدود الجغرافية لألمانيا.'
                  : 'Adressen, PLZ und Telefonnummern werden vereinheitlicht. Geokoordinaten werden auf das deutsche Hoheitsgebiet geprüft.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-black text-brand-700 uppercase tracking-widest block mb-1">
                3. CROSS-CITY DEDUPLICATION
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {isEn
                  ? 'Entities with matching postal codes or spatial proximity under 200m are analyzed to merge duplicates and prevent cross-city contamination.'
                  : isAr
                  ? 'تحليل التقارب المكاني لمنع تكرار السجلات بين المدن والمناطق المتجاورة.'
                  : 'Dublettenprüfung über Postleitzahlenbereiche und geografische Distanz, um Doppeleinträge sicher zusammenzuführen.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-black text-brand-700 uppercase tracking-widest block mb-1">
                4. CLASSIFICATION & QUALITY GATES
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {isEn
                  ? 'Distinguishing active prayer rooms from student clubs, restaurants, or commercial entities. Records lacking a verified street address are held in review.'
                  : isAr
                  ? 'التمييز الدقيق بين المصليات والمساجد الفعلية وبين الأندية الطلابية أو المحلات التجارية، واحتجاز غير المكتمل للمراجعة.'
                  : 'Trennung echter Gebetsräume von Vereinen oder Gewerbebetrieben. Unvollständige Einträge verbleiben im Prüfstatus.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-black text-brand-700 uppercase tracking-widest block mb-1">
                5. OPERATOR REVIEW & COMMUNITY INPUT
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {isEn
                  ? 'Community corrections and updates are reviewed by the project operator before approval. No automated publishing of unverified community submissions.'
                  : isAr
                  ? 'تتم مراجعة الملاحظات والتصحيحات المجتمعية يدوياً من قِبل المشغل قبل اعتمادها ونشرها في الدليل.'
                  : 'Manuelle Prüfung von Korrekturmeldungen im Admin-Portal vor Freigabe. Keine unkontrollierte Live-Schaltung.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-black text-brand-700 uppercase tracking-widest block mb-1">
                6. HONEST TRANSPARENCY PRINCIPLE
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {isEn
                  ? 'If opening hours, prayer times, or women\'s facilities are unknown, they are labeled "Not available". We never fabricate or estimate missing data.'
                  : isAr
                  ? 'في حال عدم توفر معلومات مؤكدة عن مواقيت الصلاة أو مصلى النساء، نذكر صراحة "غير محدد" دون أي تخمين.'
                  : 'Unbekannte Ausstattungen oder Öffnungszeiten werden ehrlich als „Keine Angabe“ ausgewiesen und niemals künstlich generiert.'}
              </p>
            </div>
          </div>
        </div>

        {/* Verification Status Legend */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 mb-10 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
            <span>{isEn ? 'Verification Status Levels' : isAr ? 'مستويات اعتماد السجلات' : 'Verifikationsstufen im Verzeichnis'}</span>
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-900 block mb-0.5">
                  {isEn ? 'OFFICIALLY VERIFIED' : isAr ? 'معتمد رسمياً' : 'Offiziell verifiziert'}
                </span>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  {isEn
                    ? 'Confirmed directly with the mosque administration or verified through official municipal association publications.'
                    : isAr
                    ? 'تم تأكيد البيانات مباشرة من إدارة المسجد أو عبر سجلات الجمعيات الإسلامية الرسمية.'
                    : 'Direkt durch die Moscheeleitung oder offizielle Verbandsregister bestätigt.'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-slate-900 block mb-0.5">
                  {isEn ? 'COMMUNITY / OPEN-DATA LISTED' : isAr ? 'مُدرج ومطابق جغرافياً' : 'Erfasst & Geografisch validiert'}
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {isEn
                    ? 'Address and coordinates verified via spatial data pipelines. Specific amenities (prayer times, parking) should be verified locally.'
                    : isAr
                    ? 'تم التحقق من العنوان والإحداثيات جغرافياً. يُرجى مراجعة إدارة المسجد للتأكد من مواعيد الصلاة أو الخدمات الدقيقة.'
                    : 'Adresse und Geokoordinaten sind technisch geprüft. Spezifische Gemeindedaten sollten vor Ort erfragt werden.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to action & corrections */}
        <div className="bg-gradient-to-r from-brand-900 to-slate-900 text-white rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold mb-1">
              {isEn ? 'Have a correction or missing information?' : isAr ? 'هل لديك تصحيح أو إضافة لمعلومات مسجد؟' : 'Fehler entdeckt oder neue Informationen?'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
              {isEn
                ? 'We welcome corrections from visitors and mosque administrations to improve data quality for everyone.'
                : isAr
                ? 'نرحب بملاحظاتكم وتصحيحاتكم من قِبل الزوار وإدارات المساجد للمساهمة في تحسين جودة البيانات.'
                : 'Hilf mit, das Verzeichnis aktuell zu halten. Korrekturen zu Öffnungszeiten, Barrierefreiheit oder neuen Standorten sind willkommen.'}
            </p>
          </div>
          <Link
            href={getContactUrl(locale)}
            className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold whitespace-nowrap transition-colors shadow-sm"
          >
            {isEn ? 'Report a Correction' : isAr ? 'إرسال تصحيح أو ملاحظة' : 'Korrektur melden'}
          </Link>
        </div>
      </div>
    </>
  );
}
