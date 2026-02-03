"use client";

import React, { useState } from "react";
import { useSupabase } from "../context/SupabaseProvider";

type AuthFormProps = {
  onMagicLinkSent?: () => void;
  onError?: (message: string) => void;
};

export function AuthForm({ onMagicLinkSent, onError }: AuthFormProps) {
  const { supabase } = useSupabase();
  const [email, setEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Redirect URL for PKCE / Magic Link — must match app/auth/callback/route.ts.
  // Use origin so it works on localhost and in production.
  const getAuthCallbackUrl = () =>
    typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "";

  const handleSignInWithGoogle = async () => {
    const redirectTo = getAuthCallbackUrl();
    await supabase?.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  const handleSignInWithEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      onError?.("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      onError?.("Please enter a valid email address.");
      return;
    }
    setEmailLoading(true);
    try {
      const emailRedirectTo = getAuthCallbackUrl();
      const { error } = await supabase?.auth.signInWithOtp({
        email: trimmed,
        options: { emailRedirectTo: emailRedirectTo || undefined },
      });
      if (error) {
        onError?.(error.message);
        return;
      }
      onMagicLinkSent?.();
      setEmail("");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[280px] flex flex-col items-stretch gap-6">
      {/* Google – Social brand colors */}
      <button
        type="button"
        onClick={handleSignInWithGoogle}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white border-2 border-slate-200 text-slate-800 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign in with Google
      </button>

      {/* OR divider */}
      <div className="flex items-center gap-3 w-full">
        <span className="flex-1 h-px bg-slate-200" aria-hidden />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          or
        </span>
        <span className="flex-1 h-px bg-slate-200" aria-hidden />
      </div>

      {/* Email (Magic Link) – POTAL primary */}
      <form onSubmit={handleSignInWithEmail} className="flex flex-col gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={emailLoading}
          className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:border-indigo-500 disabled:opacity-60"
          aria-label="Email address"
        />
        <button
          type="submit"
          disabled={emailLoading}
          className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {emailLoading ? "Sending link…" : "Sign in with Email"}
        </button>
      </form>
    </div>
  );
}
