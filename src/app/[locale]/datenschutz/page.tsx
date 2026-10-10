import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale } from '@/lib/i18n';
import { SITE_URL, SITE_NAME } from '@/lib/config';
import { ShieldCheck, Lock, Eye, Navigation, Server, MapPin, Globe, Info } from 'lucide-react';

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Qualified legal review recommended */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-10 text-slate-700 text-xs sm:text-sm flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          Diese Datenschutzerklärung bildet die tatsächlichen technischen Datenverarbeitungsprozesse dieser Website ab
          (Hosting bei Railway, OpenStreetMap-Kartenkacheln, clientseitige Geolocation, optionales Google Analytics nach Einwilligung).
          Eine abschließende rechtliche Prüfung durch einen qualifizierten Rechtsanwalt wird vor Regelbetrieb empfohlen.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 space-y-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-3">
            <Lock className="w-3.5 h-3.5 text-brand-600" />
            <span>Datenschutz &amp; DSGVO</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Datenschutzerklärung
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Informationen nach Art. 12, 13 und 21 der Datenschutz-Grundverordnung (DSGVO)
          </p>
        </div>

        {/* 1. Verantwortliche Stelle */}
        <section className="space-y-3 border-t border-slate-100 pt-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span>1. Verantwortliche Stelle (Verantwortlicher)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Verantwortlicher im Sinne der EU-Datenschutz-Grundverordnung (DSGVO) sowie sonstiger datenschutzrechtlicher
            Bestimmungen für dieses Internetangebot ist:
          </p>
          <div className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <p className="font-semibold text-slate-900">Dounia Elmarradi</p>
            <p className="text-slate-600">Natürliche Person (kein eingetragenes Unternehmen, keine juristische Person)</p>
            <div className="pl-4 border-l-2 border-slate-300 text-sm text-slate-700 space-y-0.5 pt-1">
              <p>Derb Touahra Echoara</p>
              <p>El Kalaa des Sraghna</p>
              <p>Marokko (Morocco)</p>
            </div>
            <p className="text-slate-600 pt-1">
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

        {/* 2. Hosting & Server Logfiles */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-brand-600" />
            <span>2. Bereitstellung der Website und Server-Logfiles</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Unsere Website wird bei dem Cloud-Hosting-Dienstleister <strong>Railway</strong> (Railway Corp.,
            548 Market St, Suite 79430, San Francisco, CA 94104, USA) gehostet.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Beim Aufrufen unserer Website erfasst der Webserver automatisch technische Informationen,
            die Ihr Browser übermittelt (sogenannte Server-Logfiles):
          </p>
          <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-600 space-y-1">
            <li>IP-Adresse des anfragenden Geräts</li>
            <li>Datum und Uhrzeit des Zugriffs</li>
            <li>Aufgerufene Seite bzw. Dateiname und HTTP-Statuscode</li>
            <li>Übertragene Datenmenge</li>
            <li>Referrer URL (zuvor besuchte Seite)</li>
            <li>Browsertyp, Browserversion und verwendetes Betriebssystem</li>
          </ul>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            <strong>Zweck &amp; Rechtsgrundlage:</strong> Die vorübergehende Speicherung der IP-Adresse ist
            erforderlich, um eine Auslieferung der Website zu ermöglichen sowie die Systemsicherheit,
            Betriebsstabilität und Angriffsabwehr zu gewährleisten. Rechtsgrundlage ist{' '}
            <strong>Art. 6 Abs. 1 lit. f DSGVO</strong> (berechtigtes Interesse).
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            <strong>Drittlandübermittlung:</strong> Die Datenverarbeitung erfolgt teilweise auf Servern in
            den USA. Railway Corp. unterliegt dem EU-U.S. Data Privacy Framework oder verarbeitet Daten
            auf Basis von Standardvertragsklauseln der EU-Kommission.
          </p>
        </section>

        {/* 3. OpenStreetMap */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-600" />
            <span>3. Kartendarstellung mit OpenStreetMap</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Zur interaktiven Darstellung von Standorten verwenden wir Kartenkacheln von{' '}
            <strong>OpenStreetMap</strong>, einem Dienst der OpenStreetMap Foundation
            (St John&apos;s Innovation Centre, Cowley Road, Cambridge, CB4 0WS, Vereinigtes Königreich).
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Beim Laden der Karte baut Ihr Webbrowser eine direkte Verbindung zu den Kachelservern der
            OpenStreetMap Foundation auf. Dabei wird Ihre IP-Adresse an OpenStreetMap übermittelt.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            <strong>Rechtsgrundlage:</strong>{' '}
            <strong>Art. 6 Abs. 1 lit. f DSGVO</strong> (berechtigtes Interesse an nutzerfreundlicher
            visueller Orientierung). Weitere Informationen:{' '}
            <a
              href="https://wiki.osmfoundation.org/wiki/Privacy_Policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-700 underline font-medium"
            >
              https://wiki.osmfoundation.org/wiki/Privacy_Policy
            </a>
          </p>
        </section>

        {/* 4. Google Analytics */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Eye className="w-4 h-4 text-brand-600" />
            <span>4. Webanalyse mit Google Analytics (nur nach Einwilligung)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Soweit Sie eingewilligt haben, nutzt diese Website Google Analytics, einen Webanalysedienst der{' '}
            <strong>Google Ireland Limited</strong> (&bdquo;Google&ldquo;), Gordon House, Barrow Street,
            Dublin 4, Irland.
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 space-y-2">
            <p><strong>Opt-in-Garantie:</strong></p>
            <p>
              Google Analytics ist standardmäßig <strong>vollständig deaktiviert</strong>. Erst wenn Sie
              im Cookie-Banner ausdrücklich auf &bdquo;Alle akzeptieren&ldquo; klicken, wird das
              Analyseskript geladen. Bei Ablehnung wird Google Analytics zu keinem Zeitpunkt ausgeführt
              und es werden keine Tracking-Cookies gesetzt.
            </p>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            <strong>Rechtsgrundlage:</strong> § 25 Abs. 1 TDDDG sowie{' '}
            <strong>Art. 6 Abs. 1 lit. a DSGVO</strong> (Einwilligung).
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            <strong>Widerruf:</strong> Klicken Sie jederzeit im Footer auf{' '}
            &bdquo;Cookie-Einstellungen&ldquo; um Ihre Einwilligung zu widerrufen oder zu ändern.
            Alternativ:{' '}
            <a
              href="https://tools.google.com/dlpage/gaoptout?hl=de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-700 underline font-semibold"
            >
              Google Analytics Opt-out Add-on
            </a>
          </p>
        </section>

        {/* 5. Geolocation */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-brand-600" />
            <span>5. Standortermittlung (&bdquo;Moscheen in meiner Nähe&ldquo;)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Wenn Sie die Funktion &bdquo;Moscheen in meiner Nähe&ldquo; nutzen, fordert Ihr Browser
            über einen Dialog die Standortfreigabe an. Die Entfernungsberechnung erfolgt{' '}
            <strong>ausschließlich clientseitig in Ihrem Browser</strong> — Ihr Standort wird nicht
            auf unseren Servern gespeichert oder an Dritte übermittelt.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            <strong>Rechtsgrundlage:</strong>{' '}
            <strong>Art. 6 Abs. 1 lit. a DSGVO</strong> (freiwillige Browserfreigabe).
          </p>
        </section>

        {/* 6. LocalStorage */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-brand-600" />
            <span>6. Lokale Speicherung im Browser (Local Storage)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Wir verwenden die lokale Speicherfunktion Ihres Browsers (<code>localStorage</code>),
            um Ihre Einwilligungsentscheidung zu speichern:
          </p>
          <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-600 space-y-1">
            <li><strong>Schlüssel:</strong> <code>moschee_analytics_consent</code></li>
            <li><strong>Wert:</strong> <code>&apos;accepted&apos;</code> oder <code>&apos;rejected&apos;</code></li>
            <li><strong>Zweck:</strong> Speicherung Ihrer Einwilligungsentscheidung über Seitenaufrufe hinweg.</li>
            <li>
              <strong>Rechtsgrundlage:</strong> § 25 Abs. 2 Nr. 2 TDDDG (unbedingt erforderlicher
              Dienst auf ausdrücklichen Nutzerwunsch).
            </li>
          </ul>
        </section>

        {/* 7. Kontakt & Drittlandtransfer */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900">7. Kontaktaufnahme &amp; Datenweitergabe</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Auf dieser Website existieren keine Registrierungsformulare, Benutzerkonten oder
            Kommentarfunktionen. Bei E-Mail-Kontakt werden Ihre Daten ausschließlich zur
            Bearbeitung Ihrer Anfrage verarbeitet. Rechtsgrundlage ist{' '}
            <strong>Art. 6 Abs. 1 lit. f DSGVO</strong> (berechtigtes Interesse).
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            <strong>Drittlandtransfer:</strong> Da die verantwortliche Person ihren Wohnsitz in Marokko
            hat, wird E-Mail-Korrespondenz in ein Drittland außerhalb der EU/EWR weitergeleitet.
            Marokko verfügt über keinen Angemessenheitsbeschluss der EU-Kommission nach Art. 45 DSGVO.
            Grundlage der Übermittlung ist Ihre freiwillige Kontaktaufnahme (Art. 49 Abs. 1 lit. b DSGVO).
          </p>
        </section>

        {/* 8. Betroffenenrechte */}
        <section className="space-y-3 border-t border-slate-100 pt-6">
          <h2 className="text-lg font-bold text-slate-900">8. Ihre Rechte als betroffene Person</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Ihnen stehen im Rahmen der Bestimmungen der DSGVO folgende Rechte zu:
          </p>
          <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-600 space-y-1">
            <li><strong>Auskunftsrecht</strong> (Art. 15 DSGVO)</li>
            <li><strong>Recht auf Berichtigung</strong> (Art. 16 DSGVO)</li>
            <li><strong>Recht auf Löschung</strong> (Art. 17 DSGVO) — &bdquo;Recht auf Vergessenwerden&ldquo;</li>
            <li><strong>Recht auf Einschränkung der Verarbeitung</strong> (Art. 18 DSGVO)</li>
            <li><strong>Recht auf Datenübertragbarkeit</strong> (Art. 20 DSGVO)</li>
            <li><strong>Widerspruchsrecht</strong> (Art. 21 DSGVO)</li>
            <li><strong>Widerruf erteilter Einwilligungen</strong> (Art. 7 Abs. 3 DSGVO) jederzeit mit Wirkung für die Zukunft</li>
            <li>
              <strong>Beschwerderecht bei einer Aufsichtsbehörde</strong> (Art. 77 DSGVO) — insbesondere
              in dem EU-Mitgliedstaat Ihres gewöhnlichen Aufenthaltsorts oder des Orts des mutmaßlichen
              Verstoßes.
            </li>
          </ul>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
            Zur Geltendmachung Ihrer Rechte wenden Sie sich bitte an:{' '}
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
