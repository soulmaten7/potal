/**
 * POTAL API v1 — /api/v1/admin/exchange-rate-sync
 *
 * D4 Data Pipeline — Daily exchange rate update & DB persistence.
 * Fetches latest rates from API, stores in DB for auditing/history,
 * and invalidates the in-memory cache.
 *
 * GET  /api/v1/admin/exchange-rate-sync  — Run exchange rate sync
 *
 * Vercel Cron: daily at 00:30 UTC (매일 00:30 UTC)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getExchangeRates,
  invalidateExchangeRateCache,
} from '@/app/lib/cost-engine/exchange-rate/exchange-rate-service';

const CRON_SECRET = process.env.CRON_SECRET || '';

function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ') && authHeader.slice(7) === CRON_SECRET) {
    return true;
  }
  return false;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Key currencies to track for alerting (significant changes)
const TRACKED_CURRENCIES = [
  'EUR', 'GBP', 'JPY', 'KRW', 'CNY', 'CAD', 'AUD', 'INR',
  'BRL', 'MXN', 'CHF', 'SGD', 'HKD', 'TWD', 'THB',
];

const ALERT_THRESHOLD = 0.03; // 3% change triggers alert

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const supabase = getSupabase();

  try {
    // 1. Force refresh by invalidating cache
    invalidateExchangeRateCache();

    // 2. Fetch fresh rates
    const rates = await getExchangeRates();

    if (rates.source === 'hardcoded-fallback') {
      // All APIs failed
      const report = {
        status: 'red',
        message: 'All exchange rate APIs failed — using hardcoded fallback',
        source: rates.source,
        timestamp: new Date().toISOString(),
      };

      // Log to health_check_logs
      if (supabase) {
        await (supabase.from('health_check_logs' as any) as any).insert({
          division: 'D4',
          check_type: 'exchange-rate-sync',
          status: 'red',
          details: report,
        });
      }

      return NextResponse.json({
        success: false,
        ...report,
        durationMs: Date.now() - startTime,
      });
    }

    // 3. Store rates snapshot in DB (for history/auditing)
    let prevRates: Record<string, number> | null = null;
    if (supabase) {
      // Get previous rates for comparison
      const prevResult: any = await (supabase
        .from('exchange_rate_history' as any) as any)
        .select('rates')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (prevResult.data) {
        prevRates = prevResult.data.rates;
      }

      // Insert new snapshot
      await (supabase.from('exchange_rate_history' as any) as any).insert({
        source: rates.source,
        base_currency: rates.base,
        rates: rates.rates,
        currency_count: Object.keys(rates.rates).length,
        fetched_at: rates.lastUpdated,
      });
    }

    // 4. Check for significant changes (alerts)
    const alerts: Array<{ currency: string; prev: number; current: number; changePct: number }> = [];

    if (prevRates) {
      for (const curr of TRACKED_CURRENCIES) {
        const prev = prevRates[curr];
        const current = rates.rates[curr];
        if (prev && current) {
          const changePct = Math.abs((current - prev) / prev);
          if (changePct >= ALERT_THRESHOLD) {
            alerts.push({
              currency: curr,
              prev: Math.round(prev * 10000) / 10000,
              current: Math.round(current * 10000) / 10000,
              changePct: Math.round(changePct * 10000) / 100, // percentage
            });
          }
        }
      }
    }

    // 5. Log result
    const status = alerts.length > 0 ? 'yellow' : 'green';
    const report = {
      status,
      source: rates.source,
      currencyCount: Object.keys(rates.rates).length,
      lastUpdated: rates.lastUpdated,
      alerts: alerts.length > 0 ? alerts : undefined,
      message: alerts.length > 0
        ? `${alerts.length} currency(s) moved >${ALERT_THRESHOLD * 100}%: ${alerts.map(a => `${a.currency} ${a.changePct > 0 ? '+' : ''}${a.changePct}%`).join(', ')}`
        : `Rates updated from ${rates.source} — ${Object.keys(rates.rates).length} currencies`,
    };

    if (supabase) {
      await (supabase.from('health_check_logs' as any) as any).insert({
        division: 'D4',
        check_type: 'exchange-rate-sync',
        status,
        details: report,
      });
    }

    return NextResponse.json({
      success: true,
      ...report,
      durationMs: Date.now() - startTime,
    });
  } catch (err: any) {
    const errorReport = {
      status: 'red',
      message: `Exchange rate sync failed: ${err.message}`,
      timestamp: new Date().toISOString(),
    };

    if (supabase) {
      await (supabase.from('health_check_logs' as any) as any).insert({
        division: 'D4',
        check_type: 'exchange-rate-sync',
        status: 'red',
        details: errorReport,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: false,
      ...errorReport,
      durationMs: Date.now() - startTime,
    }, { status: 500 });
  }
}
