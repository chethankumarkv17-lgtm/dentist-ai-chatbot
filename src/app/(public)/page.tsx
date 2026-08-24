import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full max-w-5xl mx-auto px-4 py-20 md:py-32 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6">
          Add an <span className="text-blue-600">AI receptionist</span> to your dental website.
        </h1>
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-3xl mx-auto">
          Automate appointment booking, answer patient questions 24/7, and reduce front-desk workload with a smart AI chatbot integrated directly into your clinic&apos;s workflow.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/signup" className="bg-blue-600 text-white px-8 py-3 rounded-md text-lg font-medium hover:bg-blue-700 transition shadow-lg">
            Start Free Trial
          </Link>
          <Link href="/how-it-works" className="bg-white text-slate-700 border border-slate-200 px-8 py-3 rounded-md text-lg font-medium hover:bg-slate-50 transition shadow-sm">
            See How It Works
          </Link>
        </div>
      </section>

      {/* Two Paths Section */}
      <section className="w-full bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Built for every dental practice</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Whether you have an established online presence or are starting fresh, we have you covered.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Path A */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col items-start">
              <div className="bg-blue-100 text-blue-700 p-3 rounded-lg mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">I already have a website</h3>
              <p className="text-slate-600 mb-6 flex-grow">
                Keep your existing WordPress, Wix, or custom website. Simply copy and paste our secure javascript snippet to embed the AI booking widget instantly.
              </p>
              <ul className="space-y-3 mb-8 w-full text-sm text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Easy copy-paste installation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Works with any CMS</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Isolated, secure iframe widget</li>
              </ul>
              <Link href="/signup" className="text-blue-600 font-semibold hover:underline">Get your widget &rarr;</Link>
            </div>

            {/* Path B */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex flex-col items-start">
              <div className="bg-blue-100 text-blue-700 p-3 rounded-lg mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">I need a website</h3>
              <p className="text-slate-600 mb-6 flex-grow">
                Don&apos;t have a website? No problem. Use our built-in website builder to generate a professional, SEO-optimized dental clinic site with the AI receptionist fully integrated.
              </p>
              <ul className="space-y-3 mb-8 w-full text-sm text-slate-700">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Professional dental templates</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> AI widget pre-installed</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Custom domain support</li>
              </ul>
              <Link href="/signup" className="text-blue-600 font-semibold hover:underline">Build your site &rarr;</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlight */}
      <section className="w-full max-w-6xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-12">Everything you need to run your front desk</h2>
        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="p-6">
            <h4 className="font-bold text-lg mb-2">Real-time Appointment Booking</h4>
            <p className="text-slate-600 text-sm">Patients can book open slots directly through the chat. The AI checks your real calendar availability, completely eliminating double bookings.</p>
          </div>
          <div className="p-6">
            <h4 className="font-bold text-lg mb-2">24/7 Patient Support</h4>
            <p className="text-slate-600 text-sm">Answer FAQs about pricing, insurance, and procedures instantly, even when your clinic is closed.</p>
          </div>
          <div className="p-6">
            <h4 className="font-bold text-lg mb-2">Centralized Clinic Dashboard</h4>
            <p className="text-slate-600 text-sm">Manage staff, track chat analytics, and monitor daily appointments all from a secure B2B dashboard.</p>
          </div>
        </div>
        <div className="mt-12">
          <Link href="/features" className="text-blue-600 font-semibold hover:underline">View all features &rarr;</Link>
        </div>
      </section>
    </div>
  );
}
