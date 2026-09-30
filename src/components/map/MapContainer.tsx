'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { MapProviderProps } from './types';

// Dynamic import with SSR disabled to prevent Leaflet window reference errors
const ActiveProvider = dynamic(() => import('./LeafletProvider'), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Karte wird geladen"
      className="w-full h-full min-h-[320px] flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-400 animate-pulse"
    >
      <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mb-3" />
      <span className="text-sm font-medium text-slate-500">Karte wird geladen...</span>
    </div>
  ),
});

export default function MapContainer(props: MapProviderProps) {
  return <ActiveProvider {...props} />;
}
