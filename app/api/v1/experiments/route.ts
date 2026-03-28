/**
 * F145: A/B Testing Framework
 *
 * POST /api/v1/experiments
 * Create experiments, assign variants, record conversions, and view results.
 */
import { NextRequest } from 'next/server';
import { withApiAuth, type ApiAuthContext } from '@/app/lib/api-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/app/lib/api-auth/response';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

interface Variant {
  id: string;
  weight: number;
  metadata?: Record<string, unknown>;
}

interface Experiment {
  id: string;
  name: string;
  description?: string;
  variants: Variant[];
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  targetSampleSize?: number;
}

// In-memory experiment store (production: use DB)
const experimentStore: Map<string, Experiment & { impressions: Record<string, number>; conversions: Record<string, number> }> = new Map();

function assignVariant(variants: Variant[], userId: string): Variant {
  // Deterministic assignment based on userId hash for consistency
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  const normalizedHash = Math.abs(hash) % 100;

  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (normalizedHash < cumulative) return variant;
  }
  return variants[variants.length - 1];
}

function calculateSignificance(controlConversions: number, controlImpressions: number, variantConversions: number, variantImpressions: number): { significant: boolean; pValue: number; confidence: number } {
  if (controlImpressions === 0 || variantImpressions === 0) {
    return { significant: false, pValue: 1, confidence: 0 };
  }

  const p1 = controlConversions / controlImpressions;
  const p2 = variantConversions / variantImpressions;
  const pPooled = (controlConversions + variantConversions) / (controlImpressions + variantImpressions);
  const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / controlImpressions + 1 / variantImpressions));

  if (se === 0) return { significant: false, pValue: 1, confidence: 0 };

  const z = Math.abs(p1 - p2) / se;
  // Approximate p-value from z-score (simplified)
  const pValue = Math.max(0.001, Math.round(Math.exp(-0.5 * z * z) * 1000) / 1000);
  const confidence = Math.round((1 - pValue) * 100);
  const significant = pValue < 0.05;

  return { significant, pValue, confidence };
}

export const POST = withApiAuth(async (req: NextRequest, ctx: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON.'); }

  const action = typeof body.action === 'string' ? body.action : 'list';

  if (action === 'create') {
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const variants = Array.isArray(body.variants) ? body.variants as Variant[] : [];
    const targetSampleSize = typeof body.targetSampleSize === 'number' ? body.targetSampleSize : 1000;

    if (!name) return apiError(ApiErrorCode.BAD_REQUEST, '"name" required.');
    if (variants.length < 2) return apiError(ApiErrorCode.BAD_REQUEST, 'At least 2 variants required.');

    // Validate weights sum to ~100
    const totalWeight = variants.reduce((s, v) => s + (v.weight || 0), 0);
    if (totalWeight < 95 || totalWeight > 105) {
      return apiError(ApiErrorCode.BAD_REQUEST, 'Variant weights must sum to approximately 100.');
    }

    const experimentId = `exp_${Date.now().toString(36)}`;
    const experiment = {
      id: experimentId,
      name,
      description,
      variants: variants.map(v => ({ id: v.id || `v_${Math.random().toString(36).slice(2, 6)}`, weight: v.weight, metadata: v.metadata })),
      status: 'running' as const,
      startDate: new Date().toISOString(),
      targetSampleSize,
      impressions: Object.fromEntries(variants.map(v => [v.id, 0])),
      conversions: Object.fromEntries(variants.map(v => [v.id, 0])),
    };

    experimentStore.set(experimentId, experiment);

    // Also store in DB if available
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('experiments').insert({
          experiment_id: experimentId,
          seller_id: ctx.sellerId,
          name,
          description,
          variants: JSON.stringify(experiment.variants),
          status: 'running',
          target_sample_size: targetSampleSize,
          created_at: new Date().toISOString(),
        });
      } catch { /* best-effort */ }
    }

    return apiSuccess({
      action: 'create',
      experiment: {
        id: experimentId,
        name,
        description,
        variants: experiment.variants,
        status: 'running',
        startDate: experiment.startDate,
        targetSampleSize,
      },
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'assign') {
    const experimentId = typeof body.experimentId === 'string' ? body.experimentId : '';
    const userId = typeof body.userId === 'string' ? body.userId : `anon_${Date.now()}`;

    if (!experimentId) return apiError(ApiErrorCode.BAD_REQUEST, '"experimentId" required.');

    const experiment = experimentStore.get(experimentId);
    if (!experiment) {
      return apiError(ApiErrorCode.NOT_FOUND, 'Experiment not found.');
    }

    if (experiment.status !== 'running') {
      return apiError(ApiErrorCode.BAD_REQUEST, `Experiment is ${experiment.status}, not running.`);
    }

    const variant = assignVariant(experiment.variants, userId);

    // Record impression
    if (experiment.impressions[variant.id] !== undefined) {
      experiment.impressions[variant.id]++;
    }

    return apiSuccess({
      action: 'assign',
      experimentId,
      userId,
      variant: {
        id: variant.id,
        metadata: variant.metadata || null,
      },
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'convert') {
    const experimentId = typeof body.experimentId === 'string' ? body.experimentId : '';
    const variantId = typeof body.variantId === 'string' ? body.variantId : '';
    const value = typeof body.value === 'number' ? body.value : 1;

    if (!experimentId || !variantId) {
      return apiError(ApiErrorCode.BAD_REQUEST, '"experimentId" and "variantId" required.');
    }

    const experiment = experimentStore.get(experimentId);
    if (!experiment) return apiError(ApiErrorCode.NOT_FOUND, 'Experiment not found.');

    if (experiment.conversions[variantId] !== undefined) {
      experiment.conversions[variantId] += value;
    }

    return apiSuccess({
      action: 'convert',
      experimentId,
      variantId,
      recorded: true,
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'results') {
    const experimentId = typeof body.experimentId === 'string' ? body.experimentId : '';
    if (!experimentId) return apiError(ApiErrorCode.BAD_REQUEST, '"experimentId" required.');

    const experiment = experimentStore.get(experimentId);
    if (!experiment) return apiError(ApiErrorCode.NOT_FOUND, 'Experiment not found.');

    const variantResults = experiment.variants.map(v => {
      const impressions = experiment.impressions[v.id] || 0;
      const conversions = experiment.conversions[v.id] || 0;
      const conversionRate = impressions > 0 ? Math.round((conversions / impressions) * 10000) / 100 : 0;

      return {
        variantId: v.id,
        weight: v.weight,
        impressions,
        conversions,
        conversionRate,
      };
    });

    // Statistical significance between first variant (control) and others
    const control = variantResults[0];
    const significance = variantResults.slice(1).map(v => ({
      variantId: v.variantId,
      vsControl: calculateSignificance(
        control.conversions, control.impressions,
        v.conversions, v.impressions
      ),
      uplift: control.conversionRate > 0
        ? Math.round(((v.conversionRate - control.conversionRate) / control.conversionRate) * 100)
        : 0,
    }));

    const totalImpressions = variantResults.reduce((s, v) => s + v.impressions, 0);
    const winner = variantResults.reduce((best, v) => v.conversionRate > best.conversionRate ? v : best, variantResults[0]);

    return apiSuccess({
      action: 'results',
      experiment: {
        id: experiment.id,
        name: experiment.name,
        status: experiment.status,
        startDate: experiment.startDate,
      },
      variants: variantResults,
      significance,
      summary: {
        totalImpressions,
        winner: winner.variantId,
        winnerConversionRate: winner.conversionRate,
        isStatisticallySignificant: significance.some(s => s.vsControl.significant),
        recommendation: significance.some(s => s.vsControl.significant && s.uplift > 0)
          ? `Variant "${significance.find(s => s.vsControl.significant && s.uplift > 0)?.variantId}" is the winner with statistical significance.`
          : totalImpressions < 100
            ? 'Need more data. At least 100 impressions recommended per variant.'
            : 'No statistically significant winner yet. Continue running the experiment.',
      },
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'list') {
    const experiments = Array.from(experimentStore.values())
      .map(e => ({
        id: e.id,
        name: e.name,
        status: e.status,
        variants: e.variants.length,
        totalImpressions: Object.values(e.impressions).reduce((s, v) => s + v, 0),
        startDate: e.startDate,
      }));

    return apiSuccess({
      action: 'list',
      experiments,
      total: experiments.length,
    }, { sellerId: ctx.sellerId });
  }

  if (action === 'stop') {
    const experimentId = typeof body.experimentId === 'string' ? body.experimentId : '';
    if (!experimentId) return apiError(ApiErrorCode.BAD_REQUEST, '"experimentId" required.');

    const experiment = experimentStore.get(experimentId);
    if (!experiment) return apiError(ApiErrorCode.NOT_FOUND, 'Experiment not found.');

    experiment.status = 'completed';
    experiment.endDate = new Date().toISOString();

    return apiSuccess({
      action: 'stop',
      experimentId,
      status: 'completed',
      endDate: experiment.endDate,
    }, { sellerId: ctx.sellerId });
  }

  return apiError(ApiErrorCode.BAD_REQUEST, 'action must be: create, assign, convert, results, list, or stop.');
});

export async function GET() {
  return apiError(ApiErrorCode.BAD_REQUEST, 'Use POST. Actions: create, assign, convert, results, list, stop.');
}
