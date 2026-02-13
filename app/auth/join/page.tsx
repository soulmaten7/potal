"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function JoinPage() {
  const [agreed, setAgreed] = useState(false);

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

        {/* Signup Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">FIRST NAME</label>
              <input type="text" placeholder="John" className="w-full bg-[#02122c] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F59E0B]" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">LAST NAME</label>
              <input type="text" placeholder="Doe" className="w-full bg-[#02122c] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F59E0B]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">EMAIL</label>
            <input type="email" placeholder="name@company.com" className="w-full bg-[#02122c] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F59E0B]" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">PASSWORD</label>
            <input type="password" placeholder="Create a strong password" className="w-full bg-[#02122c] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F59E0B]" />
          </div>

          {/* Critical Data for AI: Zipcode */}
          <div>
            <label className="block text-xs font-bold text-[#F59E0B] mb-1 ml-1 flex items-center gap-1">
              ZIPCODE <span className="bg-[#F59E0B]/20 text-[#F59E0B] text-[9px] px-1.5 py-0.5 rounded">REQUIRED</span>
            </label>
            <input type="text" placeholder="e.g. 10001" className="w-full bg-[#02122c] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#F59E0B]" />
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
              I agree to POTAL's <Link href="/terms" className="text-white hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-white hover:underline">Privacy Policy</Link>.
            </label>
          </div>

          <button className="w-full bg-[#F59E0B] text-[#02122c] font-black py-4 rounded-xl hover:bg-amber-400 transition-all mt-4 shadow-lg shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!agreed}>
            CREATE ACCOUNT
          </button>
        </div>

        {/* Social Dividier */}
        <div className="flex items-center my-8">
          <div className="flex-1 h-[1px] bg-gray-800"></div>
          <span className="px-4 text-xs text-gray-600 font-bold">OR JOIN WITH</span>
          <div className="flex-1 h-[1px] bg-gray-800"></div>
        </div>

        {/* Social Login */}
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 bg-white text-black py-3 rounded-xl font-bold text-xs hover:bg-gray-100 transition-all">
            <span>Google</span>
          </button>
          <button className="flex items-center justify-center gap-2 bg-[#1877F2] text-white py-3 rounded-xl font-bold text-xs hover:bg-[#166fe5] transition-all">
            <span>Facebook</span>
          </button>
        </div>

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