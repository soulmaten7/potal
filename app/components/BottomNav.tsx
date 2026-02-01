"use client";

import Link from "next/link";
import { useSupabase } from "../context/SupabaseProvider";
import { useWishlist } from "../context/WishlistContext";

function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function BookmarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

type BottomNavProps = {
  onCategoriesClick: () => void;
};

export function BottomNav({ onCategoriesClick }: BottomNavProps) {
  const { supabase, session } = useSupabase();
  const { wishlist } = useWishlist();

  const handleMyPotal = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault();
      supabase?.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "" },
      });
    }
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[9999] md:hidden border-t border-slate-200 bg-white safe-area-pb"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-14 px-2">
        <Link
          href="/"
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 text-slate-600 hover:text-indigo-600 transition-colors min-w-[64px]"
        >
          <HomeIcon className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <button
          type="button"
          onClick={onCategoriesClick}
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 text-slate-600 hover:text-indigo-600 transition-colors min-w-[64px]"
        >
          <MenuIcon className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-medium">Categories</span>
        </button>
        <Link
          href="/saved"
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 text-slate-600 hover:text-indigo-600 transition-colors min-w-[64px] relative"
        >
          <BookmarkIcon className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-medium">Saved</span>
          {wishlist.length > 0 && (
            <span className="absolute top-0 right-1 min-w-[14px] h-[14px] rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
              {wishlist.length > 99 ? "99+" : wishlist.length}
            </span>
          )}
        </Link>
        <Link
          href={session ? "/settings" : "#"}
          onClick={handleMyPotal}
          className="flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 text-slate-600 hover:text-indigo-600 transition-colors min-w-[64px]"
        >
          <UserIcon className="w-5 h-5 shrink-0" />
          <span className="text-[10px] font-medium">My Potal</span>
        </Link>
      </div>
    </nav>
  );
}
