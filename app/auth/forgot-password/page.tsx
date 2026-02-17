"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useSupabase } from '../../context/SupabaseProvider';

export default function ForgotPasswordPage() {
  const { supabase } = useSupabase();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/callback`
        : '';

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo,
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setSent(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (sent) {
    return (
      <div className="w-full flex-grow flex flex-col justify-center items-center bg-[#02122c] py-20">
        <div className="w-full max-w-[400px] bg-[#0a192f] border border-gray-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-gray-400 text-sm mb-6">
            We sent a password reset link to <span className="text-white font-semibold">{email}</span>. Click the link to set a new password.
          </p>
          <Link href="/auth/login" className="text-[#F59E0B] font-bold text-sm hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-grow flex flex-col justify-center items-center bg-[#02122c] py-20">
      <div className="w-full max-w-[400px] bg-[#0a192f] border border-gray-800 rounded-3xl p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black text-white tracking-tighter mb-2 inline-block">
            POTAL
          </Link>
          <h1 className="text-xl font-bold text-white">Reset your password</h1>
          <p className="text-gray-400 text-sm mt-1">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2" role="alert">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-xs font-bold text-gray-500 mb-1 ml-1">EMAIL</label>
            <input
              id="reset-email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
              className="w-full bg-[#02122c] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F59E0B] transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F59E0B] text-[#02122c] font-black py-4 rounded-xl hover:bg-amber-400 transition-all mt-2 shadow-lg shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'SEND RESET LINK'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link href="/auth/login" className="text-gray-500 text-xs hover:text-gray-300">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
