/**
 * POTAL Signals API — Phase 1: User Signal Collection
 *
 * Endpoint: POST /api/signals
 * Purpose: Collect client-side signals (clicks, wishlist adds, re-searches, bounces, filter applies, photo searches)
 *
 * Body: { search_id, signal_type, product_id?, product_site?, metadata? }
 * Response: 200 OK (immediately, signal batched in background)
 */

import { NextRequest, NextResponse } from 'next/server';
import { logSignal, type SearchSignal } from '@/app/lib/learning';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { search_id, signal_type, product_id, product_site, metadata } = body;

    // Validate required fields
    if (!search_id) {
      return NextResponse.json(
        { error: 'Missing search_id' },
        { status: 400 }
      );
    }

    if (!signal_type || !['click', 'add_wishlist', 're_search', 'bounce', 'filter_apply', 'photo_search'].includes(signal_type)) {
      return NextResponse.json(
        { error: 'Invalid signal_type' },
        { status: 400 }
      );
    }

    // Create signal object
    const signal: SearchSignal = {
      search_id,
      signal_type: signal_type as SearchSignal['signal_type'],
      ...(product_id && { product_id }),
      ...(product_site && { product_site }),
      ...(metadata && { metadata }),
    };

    // Log signal (async, fire-and-forget)
    logSignal(signal);

    // Return immediately (signal is batched and flushed in background)
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
