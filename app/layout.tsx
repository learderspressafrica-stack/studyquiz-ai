import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Samnote - Électronique',
  description: 'Assistant IA pédagogique spécialisé en Électronique',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif' }}>
        {children}
      </body>
    </html>
  );
}