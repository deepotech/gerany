import React from 'react';
import Link from 'next/link';
import { Compass, Search, Home, MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-md w-full text-center bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-200/80 flex items-center justify-center text-brand-600 mx-auto mb-6 shadow-xs">
          <Compass className="w-8 h-8" aria-hidden="true" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
          404 &bull; Seite nicht gefunden
        </span>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-4 mb-2">
          Diese Seite existiert leider nicht
        </h1>

        <p className="text-sm text-slate-600 mb-8 leading-relaxed">
          Die angeforderte Adresse wurde möglicherweise verschoben oder existiert nicht mehr. Nutze unsere Suche, um eine Moschee in deiner Nähe zu finden.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <Link
            href="/de"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition-all shadow-sm shadow-brand-600/20"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Zur Startseite</span>
          </Link>

          <Link
            href="/de/moscheen"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-sm border border-slate-200 transition-colors"
          >
            <Search className="w-4 h-4 text-brand-600" aria-hidden="true" />
            <span>Moscheen suchen</span>
          </Link>
        </div>

        <div className="pt-6 border-t border-slate-100 text-xs text-slate-500">
          <span className="font-semibold text-slate-700 block mb-2">Häufig gesucht:</span>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/de/moscheen/berlin" className="hover:text-brand-700 underline">Berlin</Link>
            <span>&bull;</span>
            <Link href="/de/moscheen/koeln" className="hover:text-brand-700 underline">Köln</Link>
            <span>&bull;</span>
            <Link href="/de/moscheen/hamburg" className="hover:text-brand-700 underline">Hamburg</Link>
            <span>&bull;</span>
            <Link href="/de/moscheen/muenchen" className="hover:text-brand-700 underline">München</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
