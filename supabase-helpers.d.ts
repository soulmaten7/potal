declare module '@supabase/auth-helpers-react' {
  // Minimal type declarations to satisfy TypeScript in client components.
  // The actual runtime implementations are provided by the library.
  export function useSession(): any;
  export function useSupabaseClient(): any;
}

