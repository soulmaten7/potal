/**
 * POTAL — combo-storage.ts
 * CRUD functions for user_combos table (CUSTOM builder saved combinations).
 * Every function takes a Supabase client as the first argument.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface UserCombo {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  selected_features: string[];
  is_favorite: boolean;
  use_count: number;
  share_slug: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * List all combos for a user (favorites first, then by updated_at desc).
 */
export async function listCombos(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserCombo[]> {
  const { data, error } = await (supabase.from('user_combos') as any)
    .select('*')
    .eq('user_id', userId)
    .order('is_favorite', { ascending: false })
    .order('updated_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as UserCombo[];
}

/**
 * Get a single combo by ID.
 */
export async function getComboById(
  supabase: SupabaseClient,
  id: string,
): Promise<UserCombo | null> {
  const { data, error } = await (supabase.from('user_combos') as any)
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as UserCombo;
}

/**
 * Get a public combo by its share slug.
 */
export async function getComboBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<UserCombo | null> {
  const { data, error } = await (supabase.from('user_combos') as any)
    .select('*')
    .eq('share_slug', slug)
    .eq('is_public', true)
    .single();

  if (error) return null;
  return data as UserCombo;
}

/**
 * Create a new combo.
 */
export async function createCombo(
  supabase: SupabaseClient,
  userId: string,
  name: string,
  features: string[],
  description?: string,
): Promise<UserCombo> {
  const { data, error } = await (supabase.from('user_combos') as any)
    .insert({
      user_id: userId,
      name,
      selected_features: features,
      description: description ?? null,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as UserCombo;
}

/**
 * Update an existing combo. Only provided fields are updated.
 */
export async function updateCombo(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Pick<UserCombo, 'name' | 'description' | 'selected_features' | 'is_favorite' | 'is_public' | 'share_slug'>>,
): Promise<UserCombo> {
  const { data, error } = await (supabase.from('user_combos') as any)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as UserCombo;
}

/**
 * Delete a combo by ID.
 */
export async function deleteCombo(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await (supabase.from('user_combos') as any)
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Duplicate a combo. The new combo gets name + " (copy)" and belongs to the given user.
 */
export async function duplicateCombo(
  supabase: SupabaseClient,
  id: string,
  userId: string,
): Promise<UserCombo> {
  const original = await getComboById(supabase, id);
  if (!original) throw new Error('Combo not found');

  return createCombo(
    supabase,
    userId,
    original.name + ' (copy)',
    original.selected_features,
    original.description ?? undefined,
  );
}

/**
 * Generate a URL-safe share slug from a combo name with a 6-char random suffix.
 */
export function generateShareSlug(comboName: string): string {
  const base = comboName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);

  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }

  return `${base}-${suffix}`;
}

/**
 * Increment the use_count of a combo by 1.
 */
export async function incrementUseCount(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const combo = await getComboById(supabase, id);
  if (!combo) throw new Error('Combo not found');

  const { error } = await (supabase.from('user_combos') as any)
    .update({ use_count: combo.use_count + 1, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
}
