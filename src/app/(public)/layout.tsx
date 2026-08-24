import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "DentalAI | Add an AI receptionist to your dental website",
  description: "Automate appointment booking and provide 24/7 patient support with a smart AI chatbot designed specifically for dental clinics.",
  openGraph: {
    title: "DentalAI - Your 24/7 AI Dental Receptionist",
    description: "Automate appointment booking and provide 24/7 patient support.",
    url: "https://dentalai.test",
    siteName: "DentalAI",
    locale: "en_US",
    type: "website",
  },
};

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans">
      <header className="border-b sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-bold text-xl text-blue-600">DentalAI</Link>
            <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
              <Link href="/features" className="hover:text-blue-600 transition-colors">Features</Link>
              <Link href="/how-it-works" className="hover:text-blue-600 transition-colors">How It Works</Link>
              <Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/login" className="text-slate-600 hover:text-blue-600 transition-colors">Log In</Link>
            <Link href="/signup" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">Get Started</Link>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {children}
      </main>

      <footer className="bg-slate-50 border-t py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg text-slate-900 mb-4">DentalAI</h3>
            <p className="text-sm text-slate-500">The modern AI receptionist and booking engine for dental professionals.</p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/features" className="hover:text-blue-600">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-blue-600">Pricing</Link></li>
              <li><Link href="/how-it-works" className="hover:text-blue-600">How It Works</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/contact" className="hover:text-blue-600">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-blue-600">Terms of Service</Link></li>
              <li><Link href="/refund-policy" className="hover:text-blue-600">Refund Policy</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-blue-600">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t text-sm text-slate-500 text-center">
          &copy; {new Date().getFullYear()} DentalAI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
