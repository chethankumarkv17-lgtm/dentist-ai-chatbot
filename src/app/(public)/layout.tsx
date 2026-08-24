import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Radiant Nobel | 24/7 AI Dental Receptionist & Practice SaaS',
  description:
    'Automate dental appointment booking across Website, WhatsApp, and Voice Phone channels with real-time zero-double-booking calendar synchronization.',
  openGraph: {
    title: 'Radiant Nobel - 24/7 Omnichannel AI Dental Receptionist',
    description:
      'Autonomous scheduling, WhatsApp reminders, and AI Voice Phone Receptionist for modern dental practices.',
    url: 'https://radiantnobel.com',
    siteName: 'Radiant Nobel',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
