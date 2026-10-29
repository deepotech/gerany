'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import Link from 'next/link';
import { Locale } from '@/lib/i18n';
import { getDatenschutzUrl } from '@/lib/routes';

interface CookieConsentProps {
  locale: Locale;
}

type ConsentState = 'accepted' | 'rejected' | 'pending';

const CONSENT_COOKIE_KEY = 'moschee_analytics_consent';
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XRV9JC90FT';

export default function CookieConsent({ locale }: CookieConsentProps) {
  const [consent, setConsent] = useState<ConsentState>('pending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(CONSENT_COOKIE_KEY);
      if (stored === 'accepted' || stored === 'rejected') {
        setConsent(stored);
      }
    } catch {
      // localStorage may fail in restricted/private environments
    }

    // Listen to custom event to reopen modal from footer or links
    const handleReopen = () => setIsModalOpen(true);
    window.addEventListener('openCookieSettings', handleReopen);
    return () => window.removeEventListener('openCookieSettings', handleReopen);
  }, []);

  const handleChoice = (choice: 'accepted' | 'rejected') => {
    setConsent(choice);
    setIsModalOpen(false);
    try {
      localStorage.setItem(CONSENT_COOKIE_KEY, choice);
      if (choice === 'rejected' && typeof window !== 'undefined') {
        (window as any)[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
      }
    } catch {
      // ignore storage error
    }
  };

  const labels = {
    de: {
      title: 'Privatsphäre & Cookie-Einstellungen',
      desc: 'Wir nutzen technisch notwendige Funktionen sowie optional Google Analytics, um die Nutzung unseres Moscheen-Verzeichnisses anonymisiert zu verstehen und zu verbessern. Derzeit werden keine Werbe-Cookies gesetzt.',
      accept: 'Alle akzeptieren',
      reject: 'Nur notwendige (Ablehnen)',
      moreInfo: 'Datenschutzerklärung',
      badge: 'Cookie-Einstellungen anpassen',
    },
    en: {
      title: 'Privacy & Cookie Settings',
      desc: 'We use strictly necessary technical features and optional Google Analytics to anonymously understand and improve directory usage. No advertising cookies are currently set.',
      accept: 'Accept All',
      reject: 'Essential Only (Reject)',
      moreInfo: 'Privacy Policy',
      badge: 'Manage Cookie Settings',
    },
    ar: {
      title: 'الخصوصية وإعدادات ملفات تعريف الارتباط',
      desc: 'نستخدم وظائف ضرورية تقنياً بالإضافة إلى Google Analytics اختيارياً لفهم استخدام الدليل وتحسينه بشكل مجهول الهوية. لا يتم حالياً تفعيل أي ملفات تعريف ارتباط إعلانية.',
      accept: 'قبول الكل',
      reject: 'الضرورية فقط (رفض)',
      moreInfo: 'سياسة الخصوصية',
      badge: 'تعديل خيارات ملفات تعريف الارتباط',
    },
  }[locale];

  if (!mounted) return null;

  const showBanner = consent === 'pending' || isModalOpen;

  return (
    <>
      {/* 
        Google Analytics is rendered ONLY AFTER affirmative user consent ('accepted').
        If consent is pending or rejected, NO Google Analytics script or tracking cookie is loaded.
      */}
      {consent === 'accepted' && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}');
            `}
          </Script>
        </>
      )}

      {showBanner && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={labels.title}
          className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-slate-200 shadow-2xl"
        >
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1 pr-4">
              <h3 className="text-sm font-bold text-white mb-1">{labels.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {labels.desc}{' '}
                <Link
                  href={getDatenschutzUrl(locale)}
                  className="text-brand-400 hover:underline inline-block mt-1 sm:mt-0 font-medium"
                >
                  {labels.moreInfo}
                </Link>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => handleChoice('rejected')}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              >
                {labels.reject}
              </button>
              <button
                type="button"
                onClick={() => handleChoice('accepted')}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
              >
                {labels.accept}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
