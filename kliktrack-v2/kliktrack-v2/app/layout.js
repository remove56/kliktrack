import './globals.css';
import { Analytics } from '@vercel/analytics/react';

export const metadata = {
  title: 'KlikTrack - Dashboard Analitik Klik',
  description: 'Track semua klik link kamu dengan dashboard analytics',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
