import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale, Locale } from '@/lib/i18n';
import { getMosqueRepository } from '@/lib/db';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  MapPin,
  RefreshCw,
  Phone,
  Globe,
  Clock,
  Layers,
} from 'lucide-react';

interface AdminPageProps {
  params: {
    locale: string;
  };
}

export const metadata: Metadata = {
  title: 'Admin Portal & Data Quality Report | Germany Mosque Finder',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminPage({ params }: AdminPageProps) {
  const { locale } = params;
  if (!isValidLocale(locale)) notFound();

  const repo = getMosqueRepository();
  const report = await repo.getDataQualityReport();
  const allEntities = await repo.getAllEntitiesForAdmin();

  const reviewedEntities = allEntities.filter((e) => e.dataStatus === 'REVIEWED');
  const rejectedEntities = allEntities.filter((e) => e.dataStatus === 'REJECTED');
  const publishedEntities = allEntities.filter((e) => e.dataStatus === 'PUBLISHED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
            <span>Admin Data Management Foundation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Datenqualitätsbericht &amp; Pipeline-Status
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Letzte Pipeline-Ausführung: {new Date(report.timestamp).toLocaleString('de-DE')} &bull; Quelle: Köln Pilot Raw Dataset
          </p>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Gesamtdaten</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{report.totalRawRecords}</div>
          <span className="text-xs text-slate-500">100% normalisiert</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Veröffentlicht</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{report.publishableRecords}</div>
          <span className="text-xs text-emerald-600">Im Index aktiv</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">Review-Warteschlange</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">{report.reviewedRecords}</div>
          <span className="text-xs text-amber-600">Prüfung erforderlich</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wide">Abgelehnt (Spam/Club)</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">{report.rejectedRecords}</div>
          <span className="text-xs text-rose-600">Vom Index ausgeschlossen</span>
        </div>
      </div>

      {/* Field Completeness & Quality Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Quality Diagnostics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-600" />
            <span>Feld-Vollständigkeit &amp; Diagnose</span>
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Gültige Geokoordinaten (Lat/Lng)
              </span>
              <span className="font-bold text-emerald-700">
                {report.validCoordinatesCount} / {report.totalRawRecords} (100%)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-500" />
                Fehlende Webseiten
              </span>
              <span className="font-bold text-amber-700">
                {report.missingWebsiteCount} / {report.totalRawRecords} ({Math.round((report.missingWebsiteCount / report.totalRawRecords) * 100)}%)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-500" />
                Fehlende Telefonnummern
              </span>
              <span className="font-bold text-amber-700">
                {report.missingPhoneCount} / {report.totalRawRecords} ({Math.round((report.missingPhoneCount / report.totalRawRecords) * 100)}%)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Fehlende Öffnungszeiten
              </span>
              <span className="font-bold text-slate-600">
                {report.missingHoursCount} / {report.totalRawRecords} ({Math.round((report.missingHoursCount / report.totalRawRecords) * 100)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Deduplication & Co-location Log */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-brand-600" />
            <span>Deduplizierungs- &amp; Co-Location-Analyse</span>
          </h2>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {report.duplicateCandidates.map((c, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{c.reason}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    {c.actionTaken}
                  </span>
                </div>
                <div className="text-slate-600 font-medium truncate">
                  &bull; {c.primaryName}
                </div>
                <div className="text-slate-500 font-medium truncate">
                  &bull; {c.duplicateName}
                </div>
                <div className="text-[10px] text-slate-400">
                  Distanz: {c.distanceMeters ?? 'N/A'}m &bull; {c.address}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            Warteschlange für manuelle Prüfung ({reviewedEntities.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Einträge mit unvollständigen Namen, reinen Verbandszentralen oder unbestätigtem öffentlichen Gebetsbetrieb.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {reviewedEntities.map((item) => (
            <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-900 block text-sm">{item.canonicalName}</span>
                <span className="text-slate-500 block">{item.address}</span>
                <span className="inline-block mt-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Kategorie: {item.category} &bull; Status: {item.dataStatus}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 italic">Vom öffentlichen Suchindex ausgeschlossen</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rejected Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            Abgelehnte Einträge ({rejectedEntities.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatisch abgewiesene Spam-Einträge und reine Freizeit-/Kulturvereine ohne Moscheenbezug.
          </p>
        </div>

        <div className="divide-y divide-slate-100">
          {rejectedEntities.map((item) => (
            <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-900 block text-sm">{item.canonicalName}</span>
                <span className="text-slate-500 block">{item.address}</span>
              </div>
              <div>
                <span className="font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                  Abgelehnt (Spam / Non-Mosque Club)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
