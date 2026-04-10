/**
 * Shared Combo Page — CW26 Sprint 4
 *
 * potal.app/combos/{slug} → loads a shared combo into CUSTOM builder.
 * Server component: fetches combo by slug, passes features to client CustomBuilder.
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

interface ComboRow {
  id: string;
  name: string;
  description: string | null;
  selected_features: string[];
  is_public: boolean;
  user_id: string;
}

async function getCombo(slug: string): Promise<ComboRow | null> {
  const supabase = getSupabase();
  const { data } = await (supabase.from('user_combos') as ReturnType<ReturnType<typeof createClient>['from']>)
    .select('id, name, description, selected_features, is_public, user_id')
    .eq('share_slug', slug)
    .eq('is_public', true)
    .single();
  return (data as ComboRow | null) ?? null;
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const combo = await getCombo(slug);
  if (!combo) return { title: 'Combo Not Found | POTAL' };
  const featureList = combo.selected_features.slice(0, 5).join(', ');
  return {
    title: `${combo.name} — POTAL Custom Combo`,
    description: `${combo.description || 'A custom feature combo on POTAL'}. Features: ${featureList}.`,
    openGraph: {
      title: `${combo.name} — POTAL Custom Combo`,
      description: `${combo.description || 'Try this combo on POTAL'}`,
      url: `https://potal.app/combos/${slug}`,
    },
  };
}

export default async function SharedComboPage({ params }: Props) {
  const { slug } = await params;
  const combo = await getCombo(slug);

  if (!combo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-[48px] mb-4">🔍</div>
          <h1 className="text-[22px] font-extrabold text-[#02122c] mb-2">Combo not found</h1>
          <p className="text-[14px] text-slate-600 mb-6">
            This shared combo doesn&apos;t exist or is no longer public.
          </p>
          <Link
            href="/?type=custom"
            className="inline-block px-6 py-3 rounded-xl bg-[#02122c] text-white font-bold text-[14px] no-underline hover:bg-[#0a1e3d]"
          >
            Build your own combo
          </Link>
        </div>
      </div>
    );
  }

  // Redirect to CUSTOM builder with prefilled features via query param
  const featuresParam = encodeURIComponent(JSON.stringify(combo.selected_features));
  const url = `/?type=custom&combo=${slug}&features=${featuresParam}`;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <div className="text-[48px] mb-4">⚙️</div>
        <h1 className="text-[22px] font-extrabold text-[#02122c] mb-2">{combo.name}</h1>
        {combo.description && (
          <p className="text-[14px] text-slate-600 mb-2">{combo.description}</p>
        )}
        <p className="text-[13px] text-slate-500 mb-6">
          {combo.selected_features.length} features selected
        </p>
        <Link
          href={url}
          className="inline-block px-6 py-3 rounded-xl bg-[#02122c] text-white font-bold text-[14px] no-underline hover:bg-[#0a1e3d]"
        >
          Open in CUSTOM Builder
        </Link>
        <p className="text-[11px] text-slate-400 mt-4">
          Log in to save this combo to your account.
        </p>
      </div>
    </div>
  );
}
