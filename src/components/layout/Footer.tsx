import React from 'react';
import Link from 'next/link';
import { Stethoscope, ShieldCheck, Phone, MessageSquare, Globe, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white border-t border-slate-800 pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-slate-800">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <Stethoscope className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">Radiant Nobel</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              The unified 24/7 AI Receptionist, WhatsApp Business & Voice booking platform engineered exclusively for modern dental practices.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Multi-Tenant Encrypted • Indian UPI & Razorpay Compliant</span>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-4">Omnichannel Suite</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link href="/features" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Website AI Widget</span>
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-green-400" />
                  <span>WhatsApp Business API</span>
                </Link>
              </li>
              <li>
                <Link href="/features" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-purple-400" />
                  <span>24/7 Voice Phone AI</span>
                </Link>
              </li>
              <li><Link href="/dashboard/site-builder" className="hover:text-white transition-colors">Instant Website Builder</Link></li>
            </ul>
          </div>

          {/* Practice Resources */}
          <div>
            <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-4">Practice Resources</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing & UPI Plans</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How Scheduling Works</Link></li>
              <li><Link href="/help" className="hover:text-white transition-colors">Setup & WordPress Guide</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact Support Desk</Link></li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-4">Compliance & Trust</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy & Retention Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund-policy" className="hover:text-white transition-colors">Refund & Cancellation</Link></li>
              <li><Link href="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Radiant Nobel Dental SaaS. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span>Engineered for healthcare reliability</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
}
