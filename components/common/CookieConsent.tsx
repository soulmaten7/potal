'use client';

import { useState, useEffect } from 'react';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = document.cookie.split(';').find(c => c.trim().startsWith('potal_cookie_consent='));
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    document.cookie = 'potal_cookie_consent=accepted;path=/;max-age=31536000;SameSite=Lax';
    setVisible(false);
  };

  const decline = () => {
    document.cookie = 'potal_cookie_consent=declined;path=/;max-age=31536000;SameSite=Lax';
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-[#02122c] border-t border-slate-700 shadow-2xl animate-in slide-in-from-bottom duration-500">
      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-slate-300 leading-relaxed max-w-2xl">
          <p>
            We use essential cookies to keep POTAL running and analytics cookies to improve your experience.
            By clicking &quot;Accept All&quot;, you consent to our use of cookies.
            See our{' '}
            <a href="/privacy" className="text-[#F59E0B] hover:underline font-medium">Privacy Policy</a>
            {' '}for details.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white border border-slate-600 rounded-lg hover:border-slate-400 transition-colors cursor-pointer"
          >
            Essential Only
          </button>
          <button
            onClick={accept}
            className="px-5 py-2 text-sm font-bold text-[#02122c] bg-[#F59E0B] rounded-lg hover:bg-[#D97706] transition-colors cursor-pointer"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
