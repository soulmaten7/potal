"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../context/SupabaseProvider';

export default function LoginPage() {
  const { supabase } = useSupabase();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getAuthCallbackUrl = () =>
    typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "";

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      // Save zipcode from user metadata to localStorage
      const { data: { user } } = await supabase.auth.getUser();
      const zipcode = user?.user_metadata?.zipcode;
      if (zipcode) {
        localStorage.setItem('potal_zipcode', zipcode);
      }

      router.push('/');
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const redirectTo = getAuthCallbackUrl();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  };

  return (
    <div className="w-full flex-grow flex flex-col justify-center items-center bg-[#02122c] py-20">

      {/* Login Card */}
      <div className="w-full max-w-[400px] bg-[#0a192f] border border-gray-800 rounded-3xl p-8 shadow-2xl">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <Link href="/" className="text-4xl font-black text-white tracking-tighter mb-4 inline-block">
            POTAL
          </Link>
          <p className="text-gray-400 text-sm mt-2">
            Sign in to start smart shopping with AI.
          </p>
        </div>

        {/* Error Toast */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2" role="alert">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-bold text-gray-500 mb-1 ml-1">EMAIL</label>
            <input
              id="login-email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
              className="w-full bg-[#02122c] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F59E0B] transition-all disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-xs font-bold text-gray-500 mb-1 ml-1">PASSWORD</label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={loading}
              className="w-full bg-[#02122c] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F59E0B] transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F59E0B] text-[#02122c] font-black py-4 rounded-xl hover:bg-amber-400 transition-all mt-4 shadow-lg shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'SIGN IN'}
          </button>
        </form>

        {/* Social Divider */}
        <div className="flex items-center my-8">
          <div className="flex-1 h-[1px] bg-gray-800"></div>
          <span className="px-4 text-xs text-gray-600 font-bold">OR</span>
          <div className="flex-1 h-[1px] bg-gray-800"></div>
        </div>

        {/* Google Login */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-white text-black py-3 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        {/* Footer Links */}
        <div className="mt-10 text-center space-y-2">
          <p className="text-gray-500 text-xs">
            Don&apos;t have an account? <Link href="/auth/join" className="text-[#F59E0B] font-bold hover:underline">Sign Up</Link>
          </p>
          <Link href="/auth/forgot-password" className="block text-gray-600 text-[10px] hover:text-gray-400">
            Forgot your password?
          </Link>
        </div>
      </div>

      {/* Trust Message */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 text-[11px] leading-relaxed max-w-[300px]">
          By signing in, you agree to POTAL&apos;s Terms of Service and Privacy Policy. Our AI agent uses data to recommend the best products for you.
        </p>
      </div>
    </div>
  );
}
