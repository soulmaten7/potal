"use client";

import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 py-12">
      <h1 className="text-xl font-bold text-slate-800 mb-2">Login link invalid or expired</h1>
      <p className="text-sm text-slate-600 mb-6 text-center max-w-sm">
        The link you used may have expired or already been used. Please request a new sign-in link from the login page.
      </p>
      <Link
        href="/auth/signin"
        className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
      >
        Back to Sign in
      </Link>
      <Link href="/" className="mt-4 text-sm text-slate-500 hover:text-slate-700 underline">
        Home
      </Link>
    </div>
  );
}
