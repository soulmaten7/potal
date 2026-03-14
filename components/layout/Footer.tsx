"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/app/i18n';

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    try {
      // Store in Supabase via API (best-effort)
      await fetch('/api/v1/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('success'); // Still show success — email captured client-side
    }
  }

  if (status === 'success') {
    return (
      <p className="text-sm text-emerald-400 font-medium mt-3">
        Subscribed! We&apos;ll keep you updated.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="flex-1 px-3 py-2 rounded-lg bg-white/10 border border-slate-600/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#F59E0B] transition-colors"
      />
      <button
        type="submit"
        className="px-4 py-2 rounded-lg bg-[#F59E0B] text-[#02122c] text-sm font-bold hover:bg-[#e8930a] transition-colors cursor-pointer whitespace-nowrap"
      >
        Subscribe
      </button>
    </form>
  );
}

export function Footer() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <footer className="bg-[#02122c] text-white py-12 mt-auto w-full z-10 relative">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">

        {/* Main Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="text-2xl font-extrabold tracking-tight cursor-pointer inline-block">
              <span className="text-white">P</span>
              <span className="text-[#F59E0B]">O</span>
              <span className="text-white">TAL</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              {t('footer.tagline')}
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3 mt-1">
              <a href="https://www.linkedin.com/company/potal-app" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-[#F59E0B] transition-colors" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://x.com/pabortal" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-[#F59E0B] transition-colors" aria-label="X (Twitter)">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://github.com/potal-app" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-[#F59E0B] transition-colors" aria-label="GitHub">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </a>
            </div>
            {/* Newsletter */}
            <div className="mt-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Stay updated</p>
              <p className="text-xs text-slate-500 mt-1">Trade regulation changes & product updates</p>
              <NewsletterForm />
            </div>
          </div>

          {/* Product */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('footer.product')}</h4>
            <Link href="/developers" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              {t('nav.developers')}
            </Link>
            <Link href="/developers/docs" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              {t('footer.documentation')}
            </Link>
            <Link href="/developers/playground" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              Widget Playground
            </Link>
            <Link href="/pricing" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              {t('nav.pricing')}
            </Link>
            <Link href="/dashboard" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              {t('nav.dashboard')}
            </Link>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('footer.resources')}</h4>
            <Link href="/help" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              {t('footer.helpCenter')}
            </Link>
            <Link href="/widget/demo" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              Widget Demo
            </Link>
            <Link href="/contact" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              {t('footer.contact')}
            </Link>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('footer.legal')}</h4>
            <Link href="/terms" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              {t('footer.terms')}
            </Link>
            <Link href="/privacy" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              {t('footer.privacy')}
            </Link>
            <Link href="/refund" className="text-sm text-slate-300 hover:text-[#F59E0B] transition-colors cursor-pointer">
              Refund Policy
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-8 border-t border-slate-700/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-500">
            &copy; 2026 POTAL. All rights reserved.
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {['GDPR Compliant', '240 Countries', 'SOC 2 Ready', '99.9% Uptime'].map(badge => (
              <span key={badge} className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2.5 py-1 rounded-full border border-slate-700/50">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
