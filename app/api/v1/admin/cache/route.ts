/**
 * POTAL API v1 — /api/v1/admin/cache
 *
 * Cache management endpoint.
 *
 * GET    — View cache status
 * DELETE — Invalidate all caches (force fresh DB load on next request)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCacheStatus, invalidateAllCaches } from '@/app/lib/cost-engine/db';

function verifyAdminAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;

  const token = authHeader.slice(7);
  const adminKey = process.env.POTAL_ADMIN_KEY;
  if (!adminKey) return false;

  return token === adminKey;
}

export async function GET(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    cache: getCacheStatus(),
    ttl: '5 minutes',
    note: 'Cache is per serverless instance. DELETE to force refresh.',
  });
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdminAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  invalidateAllCaches();

  return NextResponse.json({
    success: true,
    message: 'All tariff caches invalidated. Next API call will load fresh data from DB.',
  });
}
