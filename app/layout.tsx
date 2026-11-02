import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Speedway Broadband Services — ISP Billing & Client Management',
  description: 'Enterprise ISP billing, multi-PG collection tracking, and due date management dashboard.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Speedway ISP',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen h-full bg-slate-50 text-slate-900 antialiased overflow-x-hidden selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
