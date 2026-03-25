/**
 * POTAL API v1 — /api/v1/customs/status
 *
 * C6: Customs clearance status tracking.
 * GET  — Retrieve status by reference number
 * POST — Update status (internal/webhook use)
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

type ClearanceStatus = 'pending' | 'submitted' | 'processing' | 'held' | 'cleared' | 'released' | 'rejected';

const STATUS_ORDER: ClearanceStatus[] = ['pending', 'submitted', 'processing', 'held', 'cleared', 'released'];

const STATUS_DESCRIPTIONS: Record<ClearanceStatus, string> = {
  pending: 'Declaration prepared, not yet submitted to customs authority.',
  submitted: 'Declaration submitted to customs authority. Awaiting processing.',
  processing: 'Customs authority is reviewing the declaration.',
  held: 'Shipment held for inspection or additional documentation.',
  cleared: 'Customs clearance approved. Duties/taxes assessed.',
  released: 'Goods released from customs. Available for delivery.',
  rejected: 'Declaration rejected. Correction or additional information required.',
};

export const GET = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  const url = new URL(req.url);
  const referenceNumber = url.searchParams.get('reference') || '';

  if (!referenceNumber) {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Query param "reference" is required.');
  }

  const supabase = getSupabase();
  if (!supabase) {
    // Return mock status when DB unavailable
    return apiSuccess({
      referenceNumber,
      status: 'pending' as ClearanceStatus,
      statusDescription: STATUS_DESCRIPTIONS.pending,
      timeline: [{ status: 'pending', timestamp: new Date().toISOString(), note: 'Declaration created' }],
      source: 'default',
    }, { sellerId: context.sellerId });
  }

  try {
    const { data } = await supabase
      .from('customs_clearance_status')
      .select('reference_number, status, events, destination_country, updated_at, created_at')
      .eq('reference_number', referenceNumber)
      .eq('seller_id', context.sellerId)
      .single();

    if (!data) {
      return apiError(ApiErrorCode.NOT_FOUND, `No clearance record found for reference "${referenceNumber}".`);
    }

    const status = String(data.status ?? 'pending') as ClearanceStatus;
    const events = (data.events || []) as Array<{ status: string; timestamp: string; note?: string }>;
    const currentIndex = STATUS_ORDER.indexOf(status);

    return apiSuccess({
      referenceNumber: data.reference_number,
      status,
      statusDescription: STATUS_DESCRIPTIONS[status] || status,
      destinationCountry: data.destination_country,
      progress: currentIndex >= 0 ? Math.round((currentIndex / (STATUS_ORDER.length - 1)) * 100) : 0,
      timeline: events,
      nextStep: status === 'released' ? null
        : status === 'rejected' ? 'Correct and resubmit declaration'
        : status === 'held' ? 'Provide requested documentation'
        : STATUS_DESCRIPTIONS[STATUS_ORDER[currentIndex + 1]] || null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      source: 'database',
    }, { sellerId: context.sellerId, plan: context.planId });
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to retrieve clearance status.');
  }
});

export const POST = withApiAuth(async (req: NextRequest, context: ApiAuthContext) => {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError(ApiErrorCode.BAD_REQUEST, 'Invalid JSON body.');
  }

  const referenceNumber = typeof body.referenceNumber === 'string' ? body.referenceNumber.trim() : '';
  const status = typeof body.status === 'string' ? body.status.toLowerCase().trim() : '';
  const note = typeof body.note === 'string' ? body.note.trim() : undefined;
  const destinationCountry = typeof body.destinationCountry === 'string' ? body.destinationCountry.toUpperCase().trim() : undefined;

  if (!referenceNumber) return apiError(ApiErrorCode.BAD_REQUEST, '"referenceNumber" is required.');
  if (!status || !STATUS_DESCRIPTIONS[status as ClearanceStatus]) {
    return apiError(ApiErrorCode.BAD_REQUEST, `"status" must be one of: ${Object.keys(STATUS_DESCRIPTIONS).join(', ')}`);
  }

  const supabase = getSupabase();
  if (!supabase) return apiError(ApiErrorCode.INTERNAL_ERROR, 'Database unavailable.');

  try {
    // Get existing or create
    const { data: existing } = await supabase
      .from('customs_clearance_status')
      .select('events')
      .eq('reference_number', referenceNumber)
      .eq('seller_id', context.sellerId)
      .single();

    const events = (existing?.events || []) as Array<{ status: string; timestamp: string; note?: string }>;
    events.push({ status, timestamp: new Date().toISOString(), note });

    await supabase.from('customs_clearance_status').upsert({
      seller_id: context.sellerId,
      reference_number: referenceNumber,
      status,
      events,
      destination_country: destinationCountry,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'seller_id,reference_number' });

    return apiSuccess({
      referenceNumber,
      status,
      statusDescription: STATUS_DESCRIPTIONS[status as ClearanceStatus],
      updated: true,
      eventCount: events.length,
    }, { sellerId: context.sellerId, plan: context.planId });
  } catch {
    return apiError(ApiErrorCode.INTERNAL_ERROR, 'Failed to update clearance status.');
  }
});
