'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Stethoscope, Menu, X, ArrowRight } from 'lucide-react';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentHash, setCurrentHash] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const syncHash = () => {
      setCurrentHash(window.location.hash);
    };
    syncHash();

    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
      if (pathname === '/' && window.scrollY < 180) {
        setCurrentHash('');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('hashchange', syncHash);
    window.addEventListener('popstate', syncHash);

    // IntersectionObserver to detect when #team is in viewport on homepage
    let observer: IntersectionObserver | null = null;
    if (pathname === '/' && typeof IntersectionObserver !== 'undefined') {
      const teamSection = document.getElementById('team');
      if (teamSection) {
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setCurrentHash('#team');
              }
            });
          },
          { rootMargin: '-20% 0px -40% 0px' }
        );
        observer.observe(teamSection);
      }
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', syncHash);
      window.removeEventListener('popstate', syncHash);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [pathname]);

  const navLinks = [
    { label: 'Features', href: '/features' },
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Team', href: '/#team' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Help', href: '/help' },
  ];

  const isLinkActive = (href: string) => {
    if (href.includes('#')) {
      const hash = '#' + href.split('#')[1];
      return pathname === '/' && currentHash === hash;
    }
    return pathname === href;
  };

  const handleNavClick = (href: string, e?: React.MouseEvent) => {
    if (href.includes('#')) {
      const hash = '#' + href.split('#')[1];
      setCurrentHash(hash);
      if (pathname === '/') {
        const targetId = href.split('#')[1];
        const element = document.getElementById(targetId);
        if (element) {
          e?.preventDefault();
          element.scrollIntoView({ behavior: 'smooth' });
          window.history.pushState(null, '', href);
        }
      }
    } else {
      setCurrentHash('');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full pt-3 pb-2 px-4 sm:px-6 lg:px-8 transition-all duration-200">
      <div
        className={`max-w-7xl mx-auto rounded-2xl transition-all duration-300 ${
          scrolled
            ? 'bg-white/90 dark:bg-slate-900/90 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.08)] border-slate-200/80'
            : 'bg-white/75 dark:bg-slate-900/75 shadow-[0_2px_12px_-2px_rgba(15,23,42,0.04)] border-slate-200/60'
        } backdrop-blur-xl border px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between`}
      >
        {/* Brand */}
        <div className="flex items-center gap-7">
          <Link
            href="/"
            onClick={() => {
              setCurrentHash('');
              if (pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Stethoscope className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                Radiant Nobel
              </span>
              <span className="hidden sm:inline-block text-[10px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/60">
                Dental AI
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links — Minimal, Clean & Immediate */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleNavClick(link.href, e)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/50 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Desktop CTA Buttons — Minimal & Premium */}
        <div className="hidden md:flex items-center gap-2.5">
          <Link
            href="/login"
            className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-800/60 transition-colors"
          >
            Practice Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 dark:bg-white dark:text-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 group"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Slide-down Drawer */}
      {mobileOpen && (
        <div className="md:hidden mt-2 max-w-7xl mx-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl animate-fade-in">
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const isActive = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    handleNavClick(link.href, e);
                    setMobileOpen(false);
                  }}
                  className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/50'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/70 dark:hover:bg-slate-800/70'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 space-y-2">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Practice Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileOpen(false)}
              className="block w-full text-center px-4 py-2.5 rounded-full bg-slate-900 dark:bg-white dark:text-slate-950 hover:bg-slate-800 text-white text-sm font-semibold shadow-xs transition-all"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
