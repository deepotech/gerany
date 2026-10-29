import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale, Locale } from '@/lib/i18n';
import { SITE_URL, SITE_NAME } from '@/lib/config';
import { ShieldCheck, Lock, Eye, Navigation, Server, MapPin, Globe, Info, Megaphone } from 'lucide-react';

interface DatenschutzPageProps {
  params: {
    locale: string;
  };
}

export function generateStaticParams() {
  return [{ locale: 'de' }, { locale: 'en' }, { locale: 'ar' }];
}

export async function generateMetadata({ params }: DatenschutzPageProps): Promise<Metadata> {
  const { locale } = params;
  if (!isValidLocale(locale)) return {};

  const title =
    locale === 'en'
      ? 'Privacy Policy'
      : locale === 'ar'
      ? 'سياسة الخصوصية وحماية البيانات'
      : 'Datenschutzerklärung';

  const description =
    locale === 'en'
      ? 'Privacy policy for MoscheeAtlas in accordance with the EU General Data Protection Regulation (GDPR).'
      : locale === 'ar'
      ? 'سياسة الخصوصية وحماية البيانات لمنصة MoscheeAtlas وفقاً للائحة العامة لحماية البيانات (GDPR).'
      : 'Datenschutzerklärung von MoscheeAtlas: Informationen zur Verarbeitung personenbezogener Daten nach der DSGVO.';

  const canonicalPath = `/${locale}/datenschutz`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
      languages: {
        de: '/de/datenschutz',
        en: '/en/datenschutz',
        ar: '/ar/datenschutz',
        'x-default': '/de/datenschutz',
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

export default async function DatenschutzPage({ params }: DatenschutzPageProps) {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();

  const isAr = locale === 'ar';
  const isEn = locale === 'en';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Qualified transparency notice */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-10 text-slate-700 text-xs sm:text-sm flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          {isEn
            ? 'This privacy policy reflects the technical data processing operations of this directory (Hosting at Railway, OpenStreetMap map tiles, strictly client-side geolocation, optional Google Analytics with affirmative opt-in). Qualified legal advice is recommended before regular commercial operations.'
            : isAr
            ? 'توضح سياسة الخصوصية هذه عمليات معالجة البيانات التقنية الفعلية لهذا الموقع (الاستضافة عبر Railway، خرائط OpenStreetMap، تحديد الموقع الجغرافي محلياً بالكامل في المتصفح، وتحليلات Google Analytics الاختيارية بموافقة مسبقة). يُنصح بمراجعة قانونية مختصة.'
            : 'Diese Datenschutzerklärung bildet die tatsächlichen technischen Datenverarbeitungsprozesse dieser Website ab (Hosting bei Railway, OpenStreetMap-Kartenkacheln, clientseitige Geolocation, optionales Google Analytics nach ausdrücklicher Einwilligung). Eine Überprüfung durch einen qualifizierten Rechtsanwalt wird vor Regelbetrieb empfohlen.'}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 space-y-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-3">
            <Lock className="w-3.5 h-3.5 text-brand-600" />
            <span>
              {isEn ? 'Privacy & GDPR' : isAr ? 'الخصوصية وحماية البيانات' : 'Datenschutz & DSGVO'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {isEn ? 'Privacy Policy' : isAr ? 'سياسة الخصوصية' : 'Datenschutzerklärung'}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {isEn
              ? 'Information pursuant to Articles 12, 13 and 21 of the General Data Protection Regulation (GDPR)'
              : isAr
              ? 'معلومات الشفافية وفقاً للمواد 12 و13 و21 من اللائحة العامة لحماية البيانات (GDPR)'
              : 'Informationen nach Art. 12, 13 und 21 der Datenschutz-Grundverordnung (DSGVO)'}
          </p>
        </div>

        {/* 1. Verantwortliche Stelle */}
        <section className="space-y-3 border-t border-slate-100 pt-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span>
              {isEn
                ? '1. Data Controller'
                : isAr
                ? '1. الجهة المسؤولة عن معالجة البيانات'
                : '1. Verantwortliche Stelle (Verantwortlicher)'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {isEn
              ? 'The data controller within the meaning of the EU General Data Protection Regulation (GDPR) and other applicable data protection laws for this directory is:'
              : isAr
              ? 'الجهة المسؤولة عن معالجة البيانات وفقاً لأحكام اللائحة العامة لحماية البيانات (GDPR) هي:'
              : 'Verantwortlicher im Sinne der EU-Datenschutz-Grundverordnung (DSGVO) sowie sonstiger datenschutzrechtlicher Bestimmungen für dieses Internetangebot ist:'}
          </p>
          <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <p className="font-semibold text-slate-900">Dounia Elmarradi</p>
            <p className="text-slate-600">
              {isEn
                ? 'Natural person (no registered company, not a legal entity)'
                : isAr
                ? 'شخص طبيعي (ليست شركة مسجلة وليست شخصية اعتبارية)'
                : 'Natürliche Person (kein eingetragenes Unternehmen, keine juristische Person)'}
            </p>
            <div className="pl-4 rtl:pl-0 rtl:pr-4 border-l-2 rtl:border-l-0 rtl:border-r-2 border-slate-300 text-sm text-slate-700 space-y-0.5 pt-1">
              <p>Derb Touahra Echoara</p>
              <p>El Kalaa des Sraghna</p>
              <p>{isEn ? 'Morocco' : isAr ? 'المملكة المغربية' : 'Marokko (Morocco)'}</p>
            </div>
            <p className="text-slate-600 pt-1">
              {isEn ? 'Email: ' : isAr ? 'البريد الإلكتروني: ' : 'E-Mail: '}
              <a
                href="mailto:dounia.elmarradi@gmail.com"
                className="font-mono text-brand-700 hover:underline"
              >
                dounia.elmarradi@gmail.com
              </a>
            </p>
          </div>
        </section>

        {/* 2. Hosting & Server Logfiles */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-brand-600" />
            <span>
              {isEn
                ? '2. Website Delivery and Server Log Files'
                : isAr
                ? '2. استضافة الموقع وسجلات الخادم (Log Files)'
                : '2. Bereitstellung der Website und Server-Logfiles'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {isEn
              ? 'Our website is hosted with the cloud provider Railway (Railway Corp., 548 Market St, Suite 79430, San Francisco, CA 94104, USA). When accessing our pages, the web server automatically records technical information transmitted by your browser:'
              : isAr
              ? 'تتم استضافة موقعنا عبر خدمة الحوسبة السحابية Railway (Railway Corp.، الولايات المتحدة الأمريكية). عند زيارة الموقع، يسجل الخادم تلقائياً بيانات تقنية يرسلها متصفحك:'
              : 'Unsere Website wird bei dem Cloud-Hosting-Dienstleister Railway (Railway Corp., 548 Market St, Suite 79430, San Francisco, CA 94104, USA) gehostet. Beim Aufrufen unserer Website erfasst der Webserver automatisch technische Informationen, die Ihr Browser übermittelt (sogenannte Server-Logfiles):'}
          </p>
          <ul className="list-disc pl-5 rtl:pl-0 rtl:pr-5 text-xs sm:text-sm text-slate-600 space-y-1">
            <li>{isEn ? 'IP address of the requesting device' : isAr ? 'عنوان IP للجهاز المتصل' : 'IP-Adresse des anfragenden Geräts'}</li>
            <li>{isEn ? 'Date and time of server request' : isAr ? 'تاريخ ووقت الطلب' : 'Datum und Uhrzeit des Zugriffs'}</li>
            <li>{isEn ? 'Requested URL path and HTTP status code' : isAr ? 'المسار المطلوب ورمز الاستجابة HTTP' : 'Aufgerufene Seite bzw. Dateiname und HTTP-Statuscode'}</li>
            <li>{isEn ? 'Transferred data volume' : isAr ? 'حجم البيانات المنقولة' : 'Übertragene Datenmenge'}</li>
            <li>{isEn ? 'Referrer URL (previously visited website)' : isAr ? 'عنوان الموقع المرجعي السابق' : 'Referrer URL (zuvor besuchte Seite)'}</li>
            <li>{isEn ? 'Browser type, version, and operating system' : isAr ? 'نوع المتصفح ونظام التشغيل' : 'Browsertyp, Browserversion und verwendetes Betriebssystem'}</li>
          </ul>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            <strong>{isEn ? 'Purpose & Legal Basis:' : isAr ? 'الغرض والأساس القانوني:' : 'Zweck & Rechtsgrundlage:'}</strong>{' '}
            {isEn
              ? 'Temporary storage of the IP address is necessary to deliver website content securely, maintain platform stability, and mitigate attacks. Legal basis: Art. 6 Para. 1 lit. f GDPR (legitimate interests).'
              : isAr
              ? 'تعد المعالجة المؤقتة لعنوان IP ضرورية لضمان تسليم المحتوى التقني واستقرار الخوادم والحماية من الهجمات. الأساس القانوني: المادة 6 فقرة 1 (f) من GDPR (المصلحة المشروعة).'
              : 'Die vorübergehende Speicherung der IP-Adresse ist erforderlich, um eine Auslieferung der Website zu ermöglichen sowie die Systemsicherheit, Betriebsstabilität und Angriffsabwehr zu gewährleisten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).'}
          </p>
        </section>

        {/* 3. OpenStreetMap */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            <span>
              {isEn
                ? '3. Interactive Map Display via OpenStreetMap'
                : isAr
                ? '3. عرض الخرائط التفاعلية عبر OpenStreetMap'
                : '3. Kartendarstellung mit OpenStreetMap'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {isEn
              ? 'For interactive spatial orientation, we display map tiles provided by OpenStreetMap (OpenStreetMap Foundation, St John\'s Innovation Centre, Cowley Road, Cambridge, CB4 0WS, United Kingdom). When viewing map components, your browser connects directly to OpenStreetMap servers, transmitting your IP address.'
              : isAr
              ? 'لعرض المواقع جغرافياً، نستخدم مربعات الخرائط المقدمة من OpenStreetMap (المملكة المتحدة). عند تحميل الخريطة، يقوم متصفحك بالاتصال بخوادم OpenStreetMap مباشرة، مما يرسل عنوان IP الخاص بك إليهم.'
              : 'Zur interaktiven Darstellung von Standorten verwenden wir Kartenkacheln von OpenStreetMap, einem Dienst der OpenStreetMap Foundation (St John\'s Innovation Centre, Cowley Road, Cambridge, CB4 0WS, Vereinigtes Königreich). Beim Laden der Karte baut Ihr Webbrowser eine direkte Verbindung zu den Kachelservern auf.'}
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            <strong>{isEn ? 'Legal Basis:' : isAr ? 'الأساس القانوني:' : 'Rechtsgrundlage:'}</strong>{' '}
            {isEn
              ? 'Art. 6 Para. 1 lit. f GDPR (legitimate interest in providing intuitive geographic discovery).'
              : isAr
              ? 'المادة 6 فقرة 1 (f) من GDPR (المصلحة المشروعة في تسهيل الاستكشاف الجغرافي).'
              : 'Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an nutzerfreundlicher visueller Orientierung).'}
          </p>
        </section>

        {/* 4. Google Analytics */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-brand-600" />
            <span>
              {isEn
                ? '4. Web Analytics with Google Analytics (Opt-In Only)'
                : isAr
                ? '4. تحليلات الموقع عبر Google Analytics (بموافقة مسبقة فقط)'
                : '4. Webanalyse mit Google Analytics (nur nach Einwilligung)'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {isEn
              ? 'Subject to your explicit consent, this website uses Google Analytics, a service of Google Ireland Limited ("Google"), Gordon House, Barrow Street, Dublin 4, Ireland.'
              : isAr
              ? 'بشرط موافقتك الصريحة، يستخدم هذا الموقع Google Analytics المقدم من شركة Google Ireland Limited ("Google").'
              : 'Soweit Sie eingewilligt haben, nutzt diese Website Google Analytics, einen Webanalysedienst der Google Ireland Limited („Google“), Gordon House, Barrow Street, Dublin 4, Irland.'}
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-2">
            <p><strong>{isEn ? 'Strict Opt-In Protection:' : isAr ? 'حماية الموافقة الصريحة:' : 'Opt-in-Garantie:'}</strong></p>
            <p>
              {isEn
                ? 'Google Analytics is completely disabled by default. Only if you explicitly click "Accept All" in the cookie settings is the analytics script loaded. If you choose "Essential Only", Google Analytics is never executed and no tracking cookies are set.'
                : isAr
                ? 'تحليلات Google Analytics معطلة بالكامل بشكل افتراضي. يتم تحميل سكريبت التحليلات فقط إذا نقرت صراحةً على "قبول الكل". في حال الرفض، لا يتم تفعيل التحليلات إطلاقاً ولا يتم تعيين أي ملفات تعريف ارتباط.'
                : 'Google Analytics ist standardmäßig vollständig deaktiviert. Erst wenn Sie im Cookie-Banner ausdrücklich auf „Alle akzeptieren“ klicken, wird das Analyseskript geladen. Bei Ablehnung wird Google Analytics zu keinem Zeitpunkt ausgeführt und es werden keine Tracking-Cookies gesetzt.'}
            </p>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            <strong>{isEn ? 'Legal Basis:' : isAr ? 'الأساس القانوني:' : 'Rechtsgrundlage:'}</strong>{' '}
            {isEn
              ? '§ 25 Para. 1 TDDDG and Art. 6 Para. 1 lit. a GDPR (freely given consent). You may withdraw consent at any time via the "Cookie Settings" in the footer.'
              : isAr
              ? 'المادة 6 فقرة 1 (a) من GDPR و § 25 TDDDG (الموافقة الحرة). يمكنك سحب موافقتك في أي وقت عبر رابط "إعدادات ملفات تعريف الارتباط" في أسفل الموقع.'
              : '§ 25 Abs. 1 TDDDG sowie Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). Widerruf ist jederzeit über den Footer-Link „Cookie-Einstellungen“ möglich.'}
          </p>
        </section>

        {/* 5. Geolocation */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-brand-600" />
            <span>
              {isEn
                ? '5. Location Detection ("Mosques Near Me")'
                : isAr
                ? '5. تحديد الموقع ("مساجد قريبة مني")'
                : '5. Standortermittlung („Moscheen in meiner Nähe“)'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {isEn
              ? 'When clicking "Mosques Near Me", your browser prompts for voluntary permission to access your geographic coordinates. Distance calculation occurs strictly client-side inside your browser. Your coordinates are never sent to or stored on our servers.'
              : isAr
              ? 'عند النقر على "مساجد قريبة مني"، يطلب متصفحك الإذن للوصول إلى إحداثيات موقعك. تتم جميع حسابات المسافة محلياً داخل متصفحك فقط، ولا يتم إرسال موقعك أو تخزينه في خوادمنا.'
              : 'Wenn Sie die Funktion „Moscheen in meiner Nähe“ nutzen, fordert Ihr Browser über einen Dialog die Standortfreigabe an. Die Entfernungsberechnung erfolgt ausschließlich clientseitig in Ihrem Browser — Ihr Standort wird nicht auf unseren Servern gespeichert oder an Dritte übermittelt.'}
          </p>
        </section>

        {/* 6. LocalStorage */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-600" />
            <span>
              {isEn
                ? '6. Local Browser Storage (localStorage)'
                : isAr
                ? '6. التخزين المحلي في المتصفح (localStorage)'
                : '6. Lokale Speicherung im Browser (Local Storage)'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {isEn
              ? 'We use the browser localStorage to store your consent choice across page visits (key: moschee_analytics_consent, value: "accepted" or "rejected"). Legal basis: § 25 Para. 2 No. 2 TDDDG (strictly necessary to remember user preferences).'
              : isAr
              ? 'نستخدم التخزين المحلي (localStorage) لحفظ اختيارك للموافقة على ملفات تعريف الارتباط عبر الصفحات (المفتاح: moschee_analytics_consent). الأساس القانوني: § 25 TDDDG (ضروري تقنياً لحفظ خيارات الزائر).'
              : 'Wir verwenden localStorage, um Ihre Einwilligungsentscheidung zu speichern (Schlüssel: moschee_analytics_consent, Wert: \'accepted\' oder \'rejected\'). Rechtsgrundlage: § 25 Abs. 2 Nr. 2 TDDDG.'}
          </p>
        </section>

        {/* 7. Information on Advertising & Future AdSense Integration */}
        <section className="space-y-3 border-t border-slate-100 pt-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-brand-600" />
            <span>
              {isEn
                ? '7. Information Regarding Online Advertising & Future Services'
                : isAr
                ? '7. الشفافية بشأن الإعلانات الإلكترونية والخدمات المستقبلية'
                : '7. Hinweis zu Online-Werbung und zukünftigen Diensten'}
            </span>
          </h2>
          <div className="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3">
            <p>
              <strong>{isEn ? 'Current Status:' : isAr ? 'الوضع الحالي:' : 'Aktueller Status:'}</strong>{' '}
              {isEn
                ? 'MoscheeAtlas does not currently serve commercial advertisements and does not place third-party advertising cookies or ad tracking pixels.'
                : isAr
                ? 'لا يعرض موقع MoscheeAtlas حالياً أي إعلانات تجارية ولا يقوم بتعيين ملفات تعريف ارتباط إعلانية لأطراف ثالثة.'
                : 'MoscheeAtlas blendet derzeit keine kommerziellen Werbeanzeigen ein und setzt keine Werbe-Cookies oder Werbe-Tracking-Pixel von Drittanbietern ein.'}
            </p>
            <p>
              <strong>{isEn ? 'Future Advertising Integration Policy:' : isAr ? 'سياسة إدراج الإعلانات مستقبلاً:' : 'Transparenzhinweis für künftige Werbeeinbindung:'}</strong>{' '}
              {isEn
                ? 'Should advertising services (such as Google AdSense) be integrated in the future, the following standards will apply strictly:'
                : isAr
                ? 'في حال تفعيل خدمات إعلانية (مثل Google AdSense) مستقبلاً، ستطبق المعايير الصارمة التالية:'
                : 'Sollten künftig Werbedienste (beispielsweise Google AdSense) integriert werden, gelten hierfür vorab folgende verbindliche Grundsätze:'}
            </p>
            <ul className="list-disc pl-5 rtl:pl-0 rtl:pr-5 space-y-1">
              <li>
                {isEn
                  ? 'Consent Mechanism: A Google-certified Consent Management Platform (CMP) integrated with IAB Europe\'s Transparency and Consent Framework (TCF) will be deployed to collect granular consent before any ad technologies are initialized.'
                  : isAr
                  ? 'آلية الموافقة: سيتم تشغيل منصة إدارة موافقة (CMP) معتمدة من Google ومتوافقة مع إطار عمل الشفافية والموافقة (IAB TCF) لجمع موافقة الزائر قبل تحميل أي إعلانات.'
                  : 'Einwilligungsmanagement: Vorab wird eine Google-zertifizierte Consent Management Platform (CMP) gemäß dem IAB Europe Transparency and Consent Framework (TCF) integriert, um eine rechtssichere Einwilligung für Werbe-Cookies einzuholen.'}
              </li>
              <li>
                {isEn
                  ? 'Third-Party Cookies: Third-party vendors, including Google, will use cookies to serve ads based on prior visits to this website or other websites on the internet.'
                  : isAr
                  ? 'ملفات تعريف ارتباط الأطراف الثالثة: ستستخدم الجهات الخارجية، بما فيها Google، ملفات تعريف الارتباط لعرض الإعلانات بناءً على زيارات سابقة لهذا الموقع أو مواقع أخرى.'
                  : 'Drittanbieter-Cookies: Drittanbieter (einschließlich Google) verwenden Cookies, um Anzeigen auf Basis früherer Besuche auf dieser oder anderen Websites zu schalten.'}
              </li>
              <li>
                {isEn
                  ? 'Opt-Out Controls: Users can opt out of personalized advertising by visiting Google Ads Settings (https://adssettings.google.com) or www.aboutads.info.'
                  : isAr
                  ? 'خيارات إلغاء التخصيص: يمكن للزوار إدارة خيارات تخصيص الإعلانات أو إلغائها عبر زيارة إعدادات إعلانات Google أو www.aboutads.info.'
                  : 'Widerspruchsmöglichkeiten: Nutzer können personalisierte Werbung über die Google-Anzeigeneinstellungen (https://adssettings.google.com) oder über www.aboutads.info deaktivieren.'}
              </li>
            </ul>
          </div>
        </section>

        {/* 8. Betroffenenrechte */}
        <section className="space-y-3 border-t border-slate-100 pt-6">
          <h2 className="text-lg font-bold text-slate-900">
            {isEn
              ? '8. Your Rights as a Data Subject'
              : isAr
              ? '8. حقوقك كصاحب بيانات وفقاً للائحة GDPR'
              : '8. Ihre Rechte als betroffene Person'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {isEn
              ? 'Under the provisions of the GDPR, you have the following rights regarding your personal data:'
              : isAr
              ? 'وفقاً لأحكام لائحة GDPR، يحق لك ممارسة الحقوق التالية:'
              : 'Ihnen stehen im Rahmen der Bestimmungen der DSGVO folgende Rechte zu:'}
          </p>
          <ul className="list-disc pl-5 rtl:pl-0 rtl:pr-5 text-xs sm:text-sm text-slate-600 space-y-1">
            <li>{isEn ? 'Right of access (Art. 15 GDPR)' : isAr ? 'حق الوصول والاستعلام (المادة 15 GDPR)' : 'Auskunftsrecht (Art. 15 DSGVO)'}</li>
            <li>{isEn ? 'Right to rectification (Art. 16 GDPR)' : isAr ? 'حق التصحيح (المادة 16 GDPR)' : 'Recht auf Berichtigung (Art. 16 DSGVO)'}</li>
            <li>{isEn ? 'Right to erasure ("right to be forgotten", Art. 17 GDPR)' : isAr ? 'حق المحو ("الحق في النسيان"، المادة 17 GDPR)' : 'Recht auf Löschung (Art. 17 DSGVO)'}</li>
            <li>{isEn ? 'Right to restriction of processing (Art. 18 GDPR)' : isAr ? 'حق تقييد المعالجة (المادة 18 GDPR)' : 'Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)'}</li>
            <li>{isEn ? 'Right to data portability (Art. 20 GDPR)' : isAr ? 'حق نقل البيانات (المادة 20 GDPR)' : 'Recht auf Datenübertragbarkeit (Art. 20 DSGVO)'}</li>
            <li>{isEn ? 'Right to object (Art. 21 GDPR)' : isAr ? 'حق الاعتراض على المعالجة (المادة 21 GDPR)' : 'Widerspruchsrecht (Art. 21 DSGVO)'}</li>
            <li>{isEn ? 'Right to lodge a complaint with a supervisory authority (Art. 77 GDPR)' : isAr ? 'حق تقديم شكوى إلى سلطة حماية بيانات رسمية (المادة 77 GDPR)' : 'Beschwerderecht bei einer Aufsichtsbehörde (Art. 77 DSGVO)'}</li>
          </ul>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
            {isEn ? 'To exercise any of these rights, please contact: ' : isAr ? 'لممارسة حقوقك، يرجى التواصل معنا عبر: ' : 'Zur Geltendmachung Ihrer Rechte wenden Sie sich bitte an: '}
            <a
              href="mailto:dounia.elmarradi@gmail.com"
              className="font-mono text-brand-700 hover:underline"
            >
              dounia.elmarradi@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
