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
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900 relative">
      {/* Background Liquid Atmosphere Gradients */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none overflow-hidden select-none -z-10"
      >
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-10 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
}
