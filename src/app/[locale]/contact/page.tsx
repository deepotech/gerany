import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { isValidLocale } from '@/lib/i18n';
import { SITE_URL, SITE_NAME } from '@/lib/config';
import { getHomeUrl, getImpressumUrl } from '@/lib/routes';
import { generateBreadcrumbJsonLd } from '@/lib/seo/schema';
import { Mail, MessageSquare, MapPin, CheckCircle, ChevronRight, AlertCircle, Send } from 'lucide-react';

interface ContactPageProps {
  params: {
    locale: string;
  };
}

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'en' }, { locale: 'ar' }];
}

export async function generateMetadata({ params }: ContactPageProps): Promise<Metadata> {
  const { locale } = params;
  if (!isValidLocale(locale)) return {};

  const title =
    locale === 'en'
      ? 'Contact & Data Corrections – MoscheeAtlas'
      : locale === 'ar'
      ? 'الاتصال وتصحيح البيانات – MoscheeAtlas'
      : 'Kontakt & Fehlermeldung – MoscheeAtlas';

  const description =
    locale === 'en'
      ? 'Contact the MoscheeAtlas operator or report updated mosque information, opening hours, or accessibility features.'
      : locale === 'ar'
      ? 'تواصل مع إدارة دليل MoscheeAtlas أو أرسل تصحيحات وبيانات محدثة عن المساجد ومواعيد الصلاة والمرافق.'
      : 'Kontakt zum MoscheeAtlas-Team: Korrekturen zu Moscheen, Öffnungszeiten, Frauenbereich oder Barrierefreiheit melden.';

  const canonicalPath = `/${locale}/contact`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        de: '/de/contact',
        en: '/en/contact',
        ar: '/ar/contact',
        'x-default': '/de/contact',
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

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();

  const isAr = locale === 'ar';
  const isEn = locale === 'en';

  const breadcrumbs = generateBreadcrumbJsonLd([
    { name: 'Home', url: getHomeUrl(locale) },
    {
      name: isEn ? 'Contact & Feedback' : isAr ? 'الاتصال والملاحظات' : 'Kontakt & Feedback',
      url: `${SITE_URL}/${locale}/contact`,
    },
  ]);

  const emailSubject = encodeURIComponent(
    isEn
      ? '[MoscheeAtlas Correction] Mosque Name or City'
      : isAr
      ? '[MoscheeAtlas تصحيح] اسم المسجد أو المدينة'
      : '[MoscheeAtlas Korrektur] Moscheename oder Stadt'
  );

  const emailBody = encodeURIComponent(
    isEn
      ? 'Hello MoscheeAtlas Team,\n\nI would like to submit the following correction/addition:\n\n- Mosque Name:\n- City / Address:\n- What needs updating (opening hours, phone, wheelchair access, women area, website):\n- Source or reference (e.g. official website):\n\nThank you!'
      : isAr
      ? 'مرحباً بفريق MoscheeAtlas،\n\nأود إرسال التصحيح/التحديث التالي:\n\n- اسم المسجد:\n- المدينة / العنوان:\n- ما يحتاج للتحديث (أوقات الفتح، الهاتف، مصلى النساء، الكراسي المتحركة، الموقع):\n- مصدر المعلومة للتأكيد (رابط الموقع أو صفحة المسجد):\n\nشكراً لكم!'
      : 'Hallo MoscheeAtlas-Team,\n\nich möchte folgenden Eintrag korrigieren / ergänzen:\n\n- Moscheename:\n- Stadt / Adresse:\n- Was soll aktualisiert werden (Öffnungszeiten, Telefon, Frauenbereich, Barrierefreiheit, Website):\n- Quelle / Beleg (z.B. offizielle Website):\n\nVielen Dank!'
  );

  const mailtoUrl = `mailto:dounia.elmarradi@gmail.com?subject=${emailSubject}&body=${emailBody}`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir={isAr ? 'rtl' : 'ltr'}>
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
            {isEn ? 'Contact & Feedback' : isAr ? 'الاتصال والملاحظات' : 'Kontakt & Feedback'}
          </span>
        </nav>

        {/* Page Header */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200 text-xs font-semibold mb-4">
            <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
            <span>{isEn ? 'Community Dialogue' : isAr ? 'التواصل والمشاركة المجتمعية' : 'Gemeinschaftlicher Dialog'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
            {isEn
              ? 'Contact & Community Feedback'
              : isAr
              ? 'الاتصال وملاحظات المجتمع'
              : 'Kontakt & Fehlermeldung'}
          </h1>

          <p className="text-base text-slate-600 leading-relaxed">
            {isEn
              ? 'MoscheeAtlas relies on verified factual data. If you represent a mosque administration, notice an outdated address, or want to confirm prayer room accessibility, please reach out to us.'
              : isAr
              ? 'يعتمد دليل MoscheeAtlas على بيانات واقعية محققة. إذا كنت تمثل إدارة مسجد أو لاحظت معلومة بحاجة لتحديث (مثل مواعيد الفتح، مصلى النساء، أو رقم الهاتف)، يسعدنا تواصلك معنا.'
              : 'MoscheeAtlas lebt von verlässlichen Daten. Wenn du eine Moscheegemeinde vertrittst, veraltete Angaben bemerkst oder Ausstattungsmerkmale (wie Frauenbereiche oder Barrierefreiheit) bestätigen möchtest, kannst du dich direkt an uns wenden.'}
          </p>
        </div>

        {/* Two-Column Contact & Guidelines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Direct Email Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600 mb-6">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {isEn ? 'Direct Contact' : isAr ? 'التواصل المباشر' : 'Direkter Kontakt'}
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                {isEn
                  ? 'All inquiries and data update requests are reviewed directly by the directory operator.'
                  : isAr
                  ? 'تتم مراجعة جميع الرسائل وطلبات تحديث البيانات مباشرة من قِبل مشغل الدليل.'
                  : 'Anfragen und Aktualisierungswünsche werden durch die Betreiberin persönlich geprüft.'}
              </p>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6 space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-900 block">
                    {isEn ? 'Email Address' : isAr ? 'البريد الإلكتروني' : 'E-Mail-Adresse'}:
                  </span>
                  <a
                    href="mailto:dounia.elmarradi@gmail.com"
                    className="font-mono text-brand-700 hover:underline text-sm font-medium"
                  >
                    dounia.elmarradi@gmail.com
                  </a>
                </div>
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="font-semibold text-slate-900 block">
                    {isEn ? 'Operator & Legal Details' : isAr ? 'بيانات المشغل القانونية' : 'Betreiberangaben'}:
                  </span>
                  <p className="text-slate-600">
                    Dounia Elmarradi &bull; Derb Touahra Echoara, El Kalaa des Sraghna, Marokko ({' '}
                    <Link href={getImpressumUrl(locale)} className="text-brand-700 hover:underline">
                      {isEn ? 'View Imprint' : isAr ? 'عرض الإشعار القانوني' : 'siehe Impressum'}
                    </Link>
                    )
                  </p>
                </div>
              </div>
            </div>

            <a
              href={mailtoUrl}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <Send className="w-4 h-4 rtl:rotate-180" />
              <span>{isEn ? 'Send Message via Email' : isAr ? 'إرسال بريد إلكتروني' : 'Nachricht per E-Mail senden'}</span>
            </a>
          </div>

          {/* Submission Guidelines Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mb-6">
              <CheckCircle className="w-6 h-6 text-brand-600" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {isEn ? 'What Information to Include' : isAr ? 'البيانات المفيدة للإرسال' : 'Checkliste für Meldungen'}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              {isEn
                ? 'To help us process your update efficiently, please include:'
                : isAr
                ? 'لمساعدتنا في معالجة طلبك بسرعة وتدقيقه، يُرجى تزويدنا بالتالي:'
                : 'Um eine zügige Prüfung zu ermöglichen, nenne uns idealerweise:'}
            </p>

            <ul className="space-y-3 text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                <span>
                  <strong>{isEn ? 'Exact Name & City:' : isAr ? 'اسم المسجد والمدينة:' : 'Name & Stadt:'}</strong>{' '}
                  {isEn
                    ? 'The official mosque name and city/district.'
                    : isAr
                    ? 'الاسم الرسمي للمسجد والمدينة أو الحي.'
                    : 'Der genaue Name der Gemeinde und der Stadtteil.'}
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                <span>
                  <strong>{isEn ? 'Updated Details:' : isAr ? 'البيانات المراد تحديثها:' : 'Was soll geändert werden:'}</strong>{' '}
                  {isEn
                    ? 'e.g., verified phone, opening times, women\'s area, wheelchair entrance.'
                    : isAr
                    ? 'مثال: رقم هاتف متاح، مواعيد الفتح، توفر مصلى للنساء، أو مدخل للكراسي المتحركة.'
                    : 'z.B. Telefonnummer, Öffnungszeiten, Frauenbereich oder Barrierefreiheit.'}
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                <span>
                  <strong>{isEn ? 'Verification Source:' : isAr ? 'مصدر التأكيد:' : 'Offizieller Nachweis:'}</strong>{' '}
                  {isEn
                    ? 'Link to an official community website or announcement.'
                    : isAr
                    ? 'رابط للموقع الرسمي للمسجد أو صفحته المعتمدة.'
                    : 'Link zur Gemeindewebsite oder öffentlicher Bekanntmachung.'}
                </span>
              </li>
            </ul>

            <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                {isEn
                  ? 'Notice: We do not accept advertising inquiries, paid placements, or sponsored mosque listings. MoscheeAtlas is strictly independent.'
                  : isAr
                  ? 'ملاحظة: لا نقبل طلبات الإعلانات المدفوعة أو الترويج التجاري للمساجد. دليل MoscheeAtlas مستقل وغير تجاري.'
                  : 'Hinweis: Wir schalten keine bezahlten Platzierungen für einzelne Moscheen. MoscheeAtlas arbeitet unabhängig und werbefrei in der Listungsreihenfolge.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
