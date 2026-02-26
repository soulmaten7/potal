"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignInPage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);

  const showToastMessage = useCallback((msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setTimeout(() => setToastMessage(null), 350);
    }, 3000);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 md:px-6 border-b border-slate-200 bg-white">
        <Link
          href="/"
          className="flex items-center justify-center w-10 h-10 rounded-full text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0"
          aria-label="Close / Back to home"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </Link>
        <span className="text-sm font-medium text-slate-800">Sign in</span>
        <div className="w-10 shrink-0" aria-hidden />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 md:py-12">
        <div className="w-full max-w-md mx-auto md:bg-white md:rounded-2xl md:shadow-sm md:border md:border-slate-200 md:p-8 flex flex-col items-center">
          <h1 className="text-xl font-bold text-slate-800 mb-2">Sign in to Potal</h1>
          <p className="text-sm text-slate-600 mb-8 text-center max-w-xs">
            Sign in with Google or your email to save preferences and get unlimited searches.
          </p>
          <AuthForm
            onMagicLinkSent={() => showToastMessage("Check your email for the login link!")}
            onError={(msg) => showToastMessage(msg)}
          />
          <Link
            href="/"
            className="mt-8 text-sm text-slate-500 hover:text-slate-700 underline"
          >
            Back to home
          </Link>
        </div>
      </main>

      {/* Toast: Magic link / error */}
      {showToast && toastMessage && (
        <div
          className="fixed left-4 right-4 bottom-24 z-20 flex items-center justify-center px-4 py-3 rounded-xl bg-slate-800/95 text-white text-sm font-medium shadow-lg transition-all duration-300"
          role="alert"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
