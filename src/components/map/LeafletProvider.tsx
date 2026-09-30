'use client';

import React, { useEffect, useRef } from 'react';
import { MapProviderProps } from './types';
import 'leaflet/dist/leaflet.css';

export default function LeafletProvider({
  markers,
  center,
  zoom = 12,
  height = '100%',
  className = '',
  activeMarkerId,
  onMarkerSelect,
  locale = 'de',
}: MapProviderProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  // Localization for popup actions
  const detailsText = locale === 'ar' ? 'التفاصيل' : 'Details';
  const directionsText = locale === 'en' ? 'Directions' : locale === 'ar' ? 'الاتجاهات' : 'Route';

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;

    // Determine initial center inside effect: passed center -> first marker -> Germany geographic center
    const initialCenter: [number, number] = center || (markers.length > 0 ? [markers[0].latitude, markers[0].longitude] : [51.1657, 10.4515]);
    const initialZoom = center ? zoom : markers.length > 0 ? 12 : 6;

    // Dynamically load leaflet on client
    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          scrollWheelZoom: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        markersGroupRef.current = L.layerGroup().addTo(map);
      }

      const map = mapInstanceRef.current;
      const markersGroup = markersGroupRef.current;

      markersGroup.clearLayers();

      // Custom SVG mosque pin
      const createIcon = (isActive: boolean) =>
        L.divIcon({
          className: 'custom-mosque-pin',
          html: `
            <div style="
              width: ${isActive ? '36px' : '30px'};
              height: ${isActive ? '36px' : '30px'};
              background: ${isActive ? '#0b7260' : '#13b392'};
              border: 2px solid #ffffff;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
              cursor: pointer;
              transition: all 0.2s ease;
            ">
              <svg style="transform: rotate(45deg); width: 14px; height: 14px; fill: white;" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          `,
          iconSize: [isActive ? 36 : 30, isActive ? 36 : 30],
          iconAnchor: [isActive ? 18 : 15, isActive ? 36 : 30],
          popupAnchor: [0, -32],
        });

      const bounds = L.latLngBounds([]);

      markers.forEach((m) => {
        const isActive = activeMarkerId === m.id;
        const marker = L.marker([m.latitude, m.longitude], {
          icon: createIcon(isActive),
          title: m.title,
        });

        bounds.extend([m.latitude, m.longitude]);

        const popupContent = document.createElement('div');
        popupContent.className = 'p-1 font-sans text-sm';
        popupContent.innerHTML = `
          <h4 style="font-weight: 600; font-size: 14px; color: #0f172a; margin-bottom: 4px;">${m.title}</h4>
          <p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${m.address}</p>
          ${m.rating ? `<div style="display:flex; align-items:center; gap:4px; font-size:12px; font-weight:600; color:#d97706; margin-bottom:8px;">★ ${m.rating} <span style="color:#94a3b8; font-weight:normal;">(${m.reviewCount || 0})</span></div>` : ''}
          <div style="display: flex; gap: 8px;">
            <a href="${m.detailUrl}" style="background: #13b392; color: white; padding: 4px 8px; border-radius: 4px; text-decoration: none; font-size: 11px; font-weight: 500;">${detailsText}</a>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${m.latitude},${m.longitude}" target="_blank" rel="noopener noreferrer" style="border: 1px solid #cbd5e1; color: #334155; padding: 4px 8px; border-radius: 4px; text-decoration: none; font-size: 11px;">${directionsText}</a>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          if (onMarkerSelect) onMarkerSelect(m);
        });

        markersGroup.addLayer(marker);
      });

      if (markers.length > 0 && bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [markers, activeMarkerId, center, zoom, onMarkerSelect, detailsText, directionsText]);

  return (
    <div
      ref={mapContainerRef}
      style={{ height, minHeight: '320px', width: '100%', zIndex: 1 }}
      className={`rounded-xl overflow-hidden border border-slate-200 shadow-sm ${className}`}
    />
  );
}
