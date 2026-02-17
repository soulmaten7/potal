"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSupabase } from '../../context/SupabaseProvider';

export default function JoinPage() {
  const { supabase } = useSupabase();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [agreed, setAgreed] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const getAuthCallbackUrl = () =>
    typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "";

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!zipcode.trim() || !/^\d{5}$/.test(zipcode.trim())) {
      setError('Please enter a valid 5-digit US zipcode.');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`,
            zipcode: zipcode.trim(),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // Save zipcode to localStorage for SearchBar
      if (zipcode.trim()) {
        localStorage.setItem('potal_zipcode', zipcode.trim());
      }

      setSuccess(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    const redirectTo = getAuthCallbackUrl();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-[#02122c] flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-[480px] bg-[#0a192f] border border-gray-800 rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
          <p className="text-gray-400 text-sm mb-6">
            We sent a confirmation link to <span className="text-white font-semibold">{email}</span>. Click the link to activate your account.
          </p>
          <Link href="/auth/login" className="text-[#F59E0B] font-bold text-sm hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#02122c] flex flex-col justify-center items-center px-4 py-12">
      {/* Join Card */}
      <div className="w-full max-w-[480px] bg-[#0a192f] border border-gray-800 rounded-3xl p-8 shadow-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black text-white tracking-tighter mb-2 inline-block">
            POTAL
          </Link>
          <h1 className="text-xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400 text-sm mt-1">
            Join POTAL to get AI-powered shopping insights.
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

        {/* Signup Form */}
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-xs font-bold text-gray-500 mb-1 ml-1">FIRST NAME</label>
              <input
                id="firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
                className="w-full bg-[#02122c] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F59E0B] disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-xs font-bold text-gray-500 mb-1 ml-1">LAST NAME</label>
              <input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
                className="w-full bg-[#02122c] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F59E0B] disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-xs font-bold text-gray-500 mb-1 ml-1">EMAIL</label>
            <input
              id="email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
              className="w-full bg-[#02122c] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F59E0B] disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-gray-500 mb-1 ml-1">PASSWORD</label>
            <input
              id="password"
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
              className="w-full bg-[#02122c] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F59E0B] disabled:opacity-50"
            />
            <p className="text-[10px] text-gray-500 mt-1 ml-1">Minimum 6 characters.</p>
          </div>

          {/* Critical Data for AI: Zipcode */}
          <div>
            <label htmlFor="zipcode" className="block text-xs font-bold text-[#F59E0B] mb-1 ml-1 flex items-center gap-1">
              ZIPCODE <span className="bg-[#F59E0B]/20 text-[#F59E0B] text-[9px] px-1.5 py-0.5 rounded">REQUIRED</span>
            </label>
            <input
              id="zipcode"
              type="text"
              placeholder="e.g. 10001"
              value={zipcode}
              onChange={(e) => setZipcode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              inputMode="numeric"
              maxLength={5}
              disabled={loading}
              className="w-full bg-[#02122c] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F59E0B] disabled:opacity-50"
            />
            <p className="text-[10px] text-gray-500 mt-1 ml-1">Used to calculate accurate shipping and delivery dates.</p>
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start gap-3 mt-2">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-600 bg-[#02122c] checked:border-[#F59E0B] checked:bg-[#F59E0B] transition-all"
              />
              <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 stroke-[#02122c] opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 14" fill="none">
                <path d="M3 7L5.5 9.5L11 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <label htmlFor="terms" className="text-xs text-gray-400 leading-snug cursor-pointer select-none">
              I agree to POTAL's <Link href="/legal/terms" className="text-white hover:underline">Terms of Service</Link> and <Link href="/legal/privacy" className="text-white hover:underline">Privacy Policy</Link>.
            </label>
          </div>

          <button
            type="submit"
            disabled={!agreed || loading}
            className="w-full bg-[#F59E0B] text-[#02122c] font-black py-4 rounded-xl hover:bg-amber-400 transition-all mt-4 shadow-lg shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {/* Social Divider */}
        <div className="flex items-center my-8">
          <div className="flex-1 h-[1px] bg-gray-800"></div>
          <span className="px-4 text-xs text-gray-600 font-bold">OR JOIN WITH</span>
          <div className="flex-1 h-[1px] bg-gray-800"></div>
        </div>

        {/* Social Login */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
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
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            Already have an account? <Link href="/auth/login" className="text-[#F59E0B] font-bold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
