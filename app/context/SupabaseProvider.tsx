"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { Session } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

type SupabaseContextValue = {
  supabase: SupabaseClient;
  session: Session | null;
};

const SupabaseContext = createContext<SupabaseContextValue | null>(null);

function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
    );
  }
  return createBrowserClient(url, key);
}

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(createClient);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) setSession(data.session ?? null);
      } catch (e) {
        console.error("Supabase getSession failed:", e);
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (mounted) {
        setSession(currentSession ?? null);
        // Sync zipcode to localStorage on login
        const zipcode = currentSession?.user?.user_metadata?.zipcode;
        if (zipcode && typeof window !== 'undefined') {
          localStorage.setItem('potal_zipcode', zipcode);
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo(
    () => ({ supabase, session }),
    [supabase, session]
  );

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase(): SupabaseContextValue {
  const ctx = useContext(SupabaseContext);
  if (!ctx) {
    throw new Error("useSupabase must be used within SupabaseProvider");
  }
  return ctx;
}
