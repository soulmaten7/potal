'use client';

/**
 * LoginRequiredModal — CW27 Sprint 5
 *
 * 결정 7 (HOMEPAGE_REDESIGN_SPEC.md 432~464): 가치 교환 기반 로그인 게이트.
 * 비로그인 사용자가 로그인 필요한 동작(복사/저장/공유)을 시도할 때 표시.
 *
 * 톤: 강요 X, 친화적 안내 (Keep browsing 가능).
 * "Log in" 클릭 시 `/auth/login?next=<현재 URL>` 로 이동.
 */

import { useEffect } from 'react';
import type { GatedFeature } from '@/lib/auth/feature-gate';

interface LoginRequiredModalProps {
  open: boolean;
  onClose: () => void;
  featureLabel: GatedFeature;
}

const MESSAGES: Record<GatedFeature, { title: string; body: string }> = {
  'code copy': {
    title: 'Log in to copy this code',
    body: 'Copy the snippet to your store, server, or share with a developer. POTAL stays free — login just unlocks the ability to take this code with you.',
  },
  'save combos': {
    title: 'Log in to save your combo',
    body: 'Save your custom feature combination so you can pick up right where you left off. POTAL stays free — login just unlocks saving.',
  },
  'share combos': {
    title: 'Log in to share a combo',
    body: 'Generate a shareable link so teammates can open your combo in one click. POTAL stays free — login just unlocks sharing.',
  },
  'view saved combos': {
    title: 'Log in to see your saved combos',
    body: 'Your custom workflow combinations live here. POTAL stays free — login just unlocks your library.',
  },
};

export default function LoginRequiredModal({
  open,
  onClose,
  featureLabel,
}: LoginRequiredModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = orig;
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleLogin = () => {
    if (typeof window === 'undefined') return;
    const next = encodeURIComponent(
      window.location.pathname + window.location.search + window.location.hash
    );
    window.location.href = `/auth/login?next=${next}`;
  };

  const { title, body } = MESSAGES[featureLabel];

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 px-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-required-title"
        className="w-full max-w-[440px] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex-none w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[20px]" aria-hidden="true">
              🔒
            </div>
            <h2 id="login-required-title" className="text-[16px] font-extrabold text-[#02122c] leading-tight">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex-none w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <span aria-hidden="true" className="text-[18px] leading-none">×</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pb-5">
          <p className="text-[13px] text-slate-600 leading-relaxed">
            {body}
          </p>
          <p className="text-[11px] text-slate-400 mt-3">
            Forever Free. No credit card, no trial, no limits on features.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Keep browsing
          </button>
          <button
            type="button"
            onClick={handleLogin}
            className="px-5 py-2 rounded-lg text-[13px] font-bold bg-[#02122c] text-white hover:bg-[#0a1e3d] transition-colors"
          >
            Log in
          </button>
        </div>
      </div>
    </div>
  );
}
