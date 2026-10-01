import './globals.css';
import type { Metadata } from 'next';

import { SITE_URL, SITE_NAME } from '@/lib/config';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: `%s | ${SITE_NAME}`,
    default: `${SITE_NAME} – Finde eine Moschee in deiner Nähe`,
  },
  description:
    'Lokaler Suchdienst und Verzeichnis für erfasste Moscheen und Gebetsräume in Deutschland. Adressen, Ausstattung, Barrierefreiheit und Wegbeschreibungen.',
  keywords: [
    'Moschee in der Nähe',
    'Mosque near me',
    'مسجد قريب',
    'Moschee Berlin',
    'Moschee Köln',
    'Moschee Hamburg',
    'Moschee München',
    'Moschee Frankfurt',
    'Moscheen Deutschland',
    'Gebetsräume Deutschland',
    'Islamische Zentren Deutschland',
  ],
  authors: [{ name: 'MoscheeAtlas Team' }],
  creator: SITE_NAME,
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'gn8N5OcGt0pLLpTALghRPXtJj31NPHB2UiK0uCZYCSI',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
