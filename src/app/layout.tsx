import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google';
import './globals.css';
import { generateSaaSSoftwareSchema } from '@/lib/seo/structured-data';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://radiantnobel.com';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Radiant Nobel — AI Receptionist & Dental Practice Management',
    template: '%s | Radiant Nobel',
  },
  description:
    'Autonomous 24/7 AI Dental Receptionist that answers patient questions, checks live dentist schedules, and books confirmed appointments with zero double-booking.',
  keywords: [
    'AI Dental Receptionist',
    'Dental Appointment Scheduling',
    'Dental Practice Management SaaS',
    'Automated Dental Booking',
    'Healthcare AI Assistant',
  ],
  authors: [{ name: 'Radiant Nobel Team' }],
  creator: 'Radiant Nobel',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: baseUrl,
    siteName: 'Radiant Nobel',
    title: 'Radiant Nobel — AI Receptionist for Dental Clinics',
    description:
      'Autonomous 24/7 AI Receptionist that converts website visitors into confirmed dental bookings.',
    images: [
      {
        url: `${baseUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Radiant Nobel AI Dental Receptionist',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Radiant Nobel — AI Receptionist for Dental Clinics',
    description:
      'Autonomous 24/7 AI Receptionist that converts website visitors into confirmed dental bookings.',
    creator: '@radiantnobel',
    images: [`${baseUrl}/og-image.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const softwareSchema = generateSaaSSoftwareSchema();

  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {/* WCAG 2.1 AA Accessible Skip Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-semibold text-sm"
        >
          Skip to main content
        </a>
        <div id="main-content" className="flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
