"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useSupabase } from "../context/SupabaseProvider";
import { useWishlist } from "../context/WishlistContext";

function BookmarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

type HeaderProps = {
  resetToHome: () => void;
  profileMenuOpen: boolean;
  setProfileMenuOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
};

export function Header({
  resetToHome,
  profileMenuOpen,
  setProfileMenuOpen,
}: HeaderProps) {
  const { supabase, session } = useSupabase();
  const { wishlist } = useWishlist();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profileMenuOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [profileMenuOpen, setProfileMenuOpen]);

  return (
    <header className="sticky top-0 z-[9999] relative border-b border-gray-200/80 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={resetToHome}
            className="inline-flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600 tracking-tight">
              POTAL
            </h1>
            <SparklesIcon className="w-6 h-6 text-amber-500 shrink-0" aria-hidden />
          </button>
          <p className="text-sm text-slate-500 mt-1">
            Local Fast Delivery vs Global Best Price
          </p>
        </div>
        <div className="hidden md:flex items-center justify-end gap-3 sm:gap-4 shrink-0">
          <Link
            href="/saved"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-indigo-600 transition-colors rounded-lg px-3 py-2 hover:bg-indigo-50/80"
          >
            <span className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-1 shadow-sm">
              <BookmarkIcon className="w-4 h-4 text-slate-600" strokeWidth={2} />
            </span>
            <span>Saved</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-gray-200 font-medium">
              {wishlist.length}
            </span>
          </Link>

          {session ? (
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className="inline-flex items-center rounded-full border border-gray-200 bg-white px-1.5 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                  {session.user?.email?.[0]?.toUpperCase() ?? "U"}
                </span>
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-lg z-[120] overflow-hidden">
                  <Link
                    href="/settings"
                    onClick={() => setProfileMenuOpen(false)}
                    className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border-b border-gray-100 transition-colors"
                  >
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await supabase.auth.signOut();
                      } catch (error) {
                        console.error("Failed to sign out:", error);
                      } finally {
                        setProfileMenuOpen(false);
                      }
                    }}
                    className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="inline-flex items-center rounded-full border border-indigo-500 bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
