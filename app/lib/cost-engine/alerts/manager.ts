/**
 * POTAL Tariff Alert — Manager
 *
 * CRUD operations for tariff alerts + rate change detection.
 * Uses Supabase REST API for storage.
 */

import type {
  TariffAlert,
  TariffAlertCreateInput,
  TariffChangeEvent,
} from './types';

// ─── Supabase REST helpers ──────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zyurflkhiregundhisky.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

async function supabaseRest(
  table: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  options?: {
    query?: string;
    body?: unknown;
    headers?: Record<string, string>;
  }
): Promise<unknown> {
  const url = `${SUPABASE_URL}/rest/v1/${table}${options?.query || ''}`;
  const res = await fetch(url, {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=representation' : 'return=minimal',
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${method} ${table} failed: ${res.status} ${text}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('json')) {
    return res.json();
  }
  return null;
}

// ─── Alert CRUD ─────────────────────────────────────

/**
 * Create a new tariff alert for a seller.
 */
export async function createAlert(
  sellerId: string,
  input: TariffAlertCreateInput,
  currentRate?: number,
  rateSource?: string
): Promise<TariffAlert> {
  const id = `ta_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const defaultAlertTypes: TariffAlert['alertTypes'] = ['tariff_change', 'fta_update', 'trade_remedy', 'section_301', 'regulation_change'];

  const alert: TariffAlert = {
    id,
    sellerId,
    hsCode: input.hsCode.replace(/\./g, '').slice(0, 6),
    originCountry: input.originCountry.toUpperCase(),
    destinationCountry: input.destinationCountry.toUpperCase(),
    lastKnownRate: currentRate ?? 0,
    lastKnownRateSource: rateSource ?? 'unknown',
    webhookUrl: input.webhookUrl,
    notifyEmail: input.notifyEmail,
    alertTypes: input.alertTypes || defaultAlertTypes,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const result = await supabaseRest('tariff_alerts', 'POST', {
    body: {
      id: alert.id,
      seller_id: alert.sellerId,
      hs_code: alert.hsCode,
      origin_country: alert.originCountry,
      destination_country: alert.destinationCountry,
      last_known_rate: alert.lastKnownRate,
      last_known_rate_source: alert.lastKnownRateSource,
      webhook_url: alert.webhookUrl,
      notify_email: alert.notifyEmail,
      alert_types: alert.alertTypes,
      is_active: alert.isActive,
    },
  });

  return Array.isArray(result) ? (result[0] as TariffAlert) : alert;
}

/**
 * List all alerts for a seller.
 */
export async function listAlerts(sellerId: string): Promise<TariffAlert[]> {
  const result = await supabaseRest('tariff_alerts', 'GET', {
    query: `?seller_id=eq.${sellerId}&is_active=eq.true&order=created_at.desc`,
  });

  if (!Array.isArray(result)) return [];

  return (result as Record<string, unknown>[]).map(row => ({
    id: String(row.id),
    sellerId: String(row.seller_id),
    hsCode: String(row.hs_code),
    originCountry: String(row.origin_country),
    destinationCountry: String(row.destination_country),
    lastKnownRate: Number(row.last_known_rate),
    lastKnownRateSource: String(row.last_known_rate_source),
    webhookUrl: row.webhook_url ? String(row.webhook_url) : undefined,
    notifyEmail: row.notify_email ? String(row.notify_email) : undefined,
    alertTypes: Array.isArray(row.alert_types) ? row.alert_types : ['tariff_change', 'fta_update', 'trade_remedy', 'section_301', 'regulation_change'],
    isActive: Boolean(row.is_active),
    createdAt: String(row.created_at),
    lastCheckedAt: row.last_checked_at ? String(row.last_checked_at) : undefined,
    lastTriggeredAt: row.last_triggered_at ? String(row.last_triggered_at) : undefined,
  }));
}

/**
 * Delete (deactivate) an alert.
 */
export async function deleteAlert(alertId: string, sellerId: string): Promise<boolean> {
  try {
    await supabaseRest('tariff_alerts', 'PATCH', {
      query: `?id=eq.${alertId}&seller_id=eq.${sellerId}`,
      body: { is_active: false },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Send webhook notification for a tariff change.
 */
export async function sendWebhookNotification(
  webhookUrl: string,
  event: TariffChangeEvent
): Promise<boolean> {
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'tariff_rate_changed',
        data: event,
        timestamp: new Date().toISOString(),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
