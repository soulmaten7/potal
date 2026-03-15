/**
 * POTAL Email Service — Unified email sender via Resend API
 *
 * 6 email templates: welcome, usage-alert-80, usage-alert-100,
 * rate-change, weekly-summary, security-alert
 */

import { createClient } from '@supabase/supabase-js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'POTAL <contact@potal.app>';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function getSupabase() {
  return createClient(supabaseUrl, supabaseKey);
}

// ─── Email Types ─────────────────────────────────────

export type EmailType =
  | 'welcome'
  | 'usage-alert-80'
  | 'usage-alert-100'
  | 'rate-change'
  | 'weekly-summary'
  | 'security-alert';

export interface WelcomeData {
  userName?: string;
  planName: string;
}

export interface UsageAlertData {
  used: number;
  limit: number;
  planName: string;
  percentUsed: number;
}

export interface RateChangeData {
  hsCode: string;
  destination: string;
  oldRate: number;
  newRate: number;
  effectiveDate: string;
}

export interface WeeklySummaryData {
  totalRequests: number;
  topCountries: { country: string; count: number }[];
  errorCount: number;
  avgResponseMs: number;
  periodStart: string;
  periodEnd: string;
}

export interface SecurityAlertData {
  ipAddress: string;
  location?: string;
  apiKeyPrefix: string;
  timestamp: string;
}

type EmailData = WelcomeData | UsageAlertData | RateChangeData | WeeklySummaryData | SecurityAlertData;

// ─── Dedup Check ─────────────────────────────────────

async function shouldSendEmail(sellerId: string | undefined, emailType: EmailType, dedupeHours = 24): Promise<boolean> {
  if (!sellerId) return true;
  try {
    const supabase = getSupabase();
    const cutoff = new Date(Date.now() - dedupeHours * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('email_sent_logs')
      .select('id')
      .eq('seller_id', sellerId)
      .eq('email_type', emailType)
      .gte('sent_at', cutoff)
      .limit(1);
    return !data || data.length === 0;
  } catch {
    return true; // Send on error
  }
}

async function logEmailSent(sellerId: string | undefined, emailType: EmailType, metadata?: Record<string, unknown>): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.from('email_sent_logs').insert({
      seller_id: sellerId || null,
      email_type: emailType,
      metadata: metadata || null,
    });
  } catch { /* non-blocking */ }
}

// ─── Notification Preference Check ───────────────────

async function isEmailEnabled(userId: string | undefined, notificationType: string): Promise<boolean> {
  if (!userId) return true;
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('notification_preferences')
      .select('email_enabled')
      .eq('user_id', userId)
      .eq('notification_type', notificationType)
      .limit(1)
      .single();
    return data ? data.email_enabled !== false : true; // Default: enabled
  } catch {
    return true;
  }
}

// ─── Template Builders ───────────────────────────────

function buildWelcomeHtml(data: WelcomeData): { subject: string; html: string } {
  return {
    subject: 'Welcome to POTAL — Your Landed Cost API is Ready',
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="color:#1a1a2e;font-size:28px;margin:0;">POTAL</h1>
          <p style="color:#666;margin:4px 0;">Total Landed Cost Infrastructure</p>
        </div>
        <h2 style="color:#1a1a2e;">Welcome${data.userName ? `, ${data.userName}` : ''}!</h2>
        <p>Your POTAL account is active on the <strong>${data.planName}</strong> plan.</p>
        <div style="background:#f0f4ff;border-radius:8px;padding:16px;margin:16px 0;">
          <h3 style="margin:0 0 8px;">Quick Start Guide</h3>
          <ol style="margin:0;padding-left:20px;">
            <li>Generate your API key at <a href="https://potal.app/dashboard">Dashboard</a></li>
            <li>Try your first calculation: <code>POST /api/v1/calculate</code></li>
            <li>Classify products: <code>POST /api/v1/classify</code></li>
            <li>Explore the <a href="https://potal.app/developers/docs">API Documentation</a></li>
          </ol>
        </div>
        <p style="color:#666;font-size:13px;">240 countries · 113M+ tariff records · HS classification · FTA optimization</p>
      </div>`,
  };
}

function buildUsageAlert80Html(data: UsageAlertData): { subject: string; html: string } {
  return {
    subject: `POTAL: 80% of your ${data.planName} plan limit reached`,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#f59e0b;">⚠️ Usage Alert — 80% Reached</h2>
        <p>You've used <strong>${data.used.toLocaleString()}</strong> of your <strong>${data.limit.toLocaleString()}</strong> monthly API requests (${data.percentUsed}%).</p>
        <div style="background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:16px 0;">
          <div style="background:#e5e7eb;border-radius:999px;height:12px;overflow:hidden;">
            <div style="background:#f59e0b;height:100%;width:${Math.min(data.percentUsed, 100)}%;border-radius:999px;"></div>
          </div>
          <p style="margin:8px 0 0;font-size:14px;color:#666;">${data.used.toLocaleString()} / ${data.limit.toLocaleString()} requests used</p>
        </div>
        <p>To avoid service interruption, consider <a href="https://potal.app/pricing">upgrading your plan</a>.</p>
      </div>`,
  };
}

function buildUsageAlert100Html(data: UsageAlertData): { subject: string; html: string } {
  return {
    subject: `POTAL: Monthly limit reached — ${data.planName} plan`,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#ef4444;">🚨 Monthly Limit Reached</h2>
        <p>You've used all <strong>${data.limit.toLocaleString()}</strong> API requests for this month.</p>
        <div style="background:#fef2f2;border:1px solid #ef4444;border-radius:8px;padding:16px;margin:16px 0;">
          <div style="background:#e5e7eb;border-radius:999px;height:12px;overflow:hidden;">
            <div style="background:#ef4444;height:100%;width:100%;border-radius:999px;"></div>
          </div>
          <p style="margin:8px 0 0;font-size:14px;"><strong>100%</strong> — ${data.used.toLocaleString()} / ${data.limit.toLocaleString()}</p>
        </div>
        <a href="https://potal.app/pricing" style="display:inline-block;background:#1a1a2e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Upgrade Now</a>
        <p style="color:#666;font-size:13px;margin-top:16px;">Paid plans include overage billing — no hard cutoff.</p>
      </div>`,
  };
}

function buildRateChangeHtml(data: RateChangeData): { subject: string; html: string } {
  const changeDir = data.newRate > data.oldRate ? 'increased' : 'decreased';
  return {
    subject: `POTAL: Duty rate ${changeDir} for HS ${data.hsCode} → ${data.destination}`,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#1a1a2e;">📊 Tariff Rate Change Alert</h2>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">HS Code</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">${data.hsCode}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Destination</td><td style="padding:8px;border-bottom:1px solid #eee;">${data.destination}</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Previous Rate</td><td style="padding:8px;border-bottom:1px solid #eee;">${(data.oldRate * 100).toFixed(1)}%</td></tr>
          <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">New Rate</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;color:${data.newRate > data.oldRate ? '#ef4444' : '#22c55e'};">${(data.newRate * 100).toFixed(1)}%</td></tr>
          <tr><td style="padding:8px;color:#666;">Effective</td><td style="padding:8px;">${data.effectiveDate}</td></tr>
        </table>
        <p style="color:#666;font-size:13px;">This may affect your landed cost calculations. Review your pricing accordingly.</p>
      </div>`,
  };
}

function buildWeeklySummaryHtml(data: WeeklySummaryData): { subject: string; html: string } {
  const topCountriesHtml = data.topCountries.slice(0, 5).map(
    c => `<li>${c.country}: ${c.count.toLocaleString()} requests</li>`
  ).join('');

  return {
    subject: `POTAL Weekly Summary: ${data.totalRequests.toLocaleString()} API requests`,
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#1a1a2e;">📈 Weekly API Summary</h2>
        <p style="color:#666;">${data.periodStart} — ${data.periodEnd}</p>
        <div style="display:flex;gap:16px;margin:16px 0;">
          <div style="flex:1;background:#f0f4ff;border-radius:8px;padding:16px;text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#1a1a2e;">${data.totalRequests.toLocaleString()}</div>
            <div style="color:#666;font-size:13px;">Total Requests</div>
          </div>
          <div style="flex:1;background:#f0fff4;border-radius:8px;padding:16px;text-align:center;">
            <div style="font-size:28px;font-weight:700;color:#22c55e;">${data.avgResponseMs}ms</div>
            <div style="color:#666;font-size:13px;">Avg Response</div>
          </div>
          <div style="flex:1;background:${data.errorCount > 0 ? '#fef2f2' : '#f0fff4'};border-radius:8px;padding:16px;text-align:center;">
            <div style="font-size:28px;font-weight:700;color:${data.errorCount > 0 ? '#ef4444' : '#22c55e'};">${data.errorCount}</div>
            <div style="color:#666;font-size:13px;">Errors</div>
          </div>
        </div>
        ${topCountriesHtml ? `<h3 style="margin:16px 0 8px;">Top Destinations</h3><ul style="margin:0;padding-left:20px;">${topCountriesHtml}</ul>` : ''}
        <p style="margin-top:16px;"><a href="https://potal.app/dashboard">View Full Analytics →</a></p>
      </div>`,
  };
}

function buildSecurityAlertHtml(data: SecurityAlertData): { subject: string; html: string } {
  return {
    subject: 'POTAL Security Alert: New IP detected',
    html: `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h2 style="color:#ef4444;">🔒 Security Alert</h2>
        <p>Your API key was used from a new IP address:</p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#666;">IP Address</td><td style="padding:6px 0;font-weight:600;">${data.ipAddress}</td></tr>
            ${data.location ? `<tr><td style="padding:6px 0;color:#666;">Location</td><td style="padding:6px 0;">${data.location}</td></tr>` : ''}
            <tr><td style="padding:6px 0;color:#666;">API Key</td><td style="padding:6px 0;font-family:monospace;">${data.apiKeyPrefix}...****</td></tr>
            <tr><td style="padding:6px 0;color:#666;">Time</td><td style="padding:6px 0;">${data.timestamp}</td></tr>
          </table>
        </div>
        <p>If this wasn't you, <a href="https://potal.app/dashboard">rotate your API key immediately</a>.</p>
      </div>`,
  };
}

// ─── Public API ──────────────────────────────────────

export async function sendEmail(
  type: EmailType,
  to: string,
  data: EmailData,
  options?: { sellerId?: string; userId?: string; skipDedup?: boolean }
): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  // Check notification preferences
  if (options?.userId) {
    const enabled = await isEmailEnabled(options.userId, type);
    if (!enabled) return { success: true }; // Silently skip
  }

  // Dedup check (don't send same email type within 24h)
  if (!options?.skipDedup) {
    const shouldSend = await shouldSendEmail(options?.sellerId, type);
    if (!shouldSend) return { success: true }; // Already sent recently
  }

  // Build template
  let template: { subject: string; html: string };
  switch (type) {
    case 'welcome':
      template = buildWelcomeHtml(data as WelcomeData);
      break;
    case 'usage-alert-80':
      template = buildUsageAlert80Html(data as UsageAlertData);
      break;
    case 'usage-alert-100':
      template = buildUsageAlert100Html(data as UsageAlertData);
      break;
    case 'rate-change':
      template = buildRateChangeHtml(data as RateChangeData);
      break;
    case 'weekly-summary':
      template = buildWeeklySummaryHtml(data as WeeklySummaryData);
      break;
    case 'security-alert':
      template = buildSecurityAlertHtml(data as SecurityAlertData);
      break;
    default:
      return { success: false, error: `Unknown email type: ${type}` };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: template.subject,
        html: template.html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `Resend API error: ${res.status} ${err}` };
    }

    // Log sent email
    await logEmailSent(options?.sellerId, type, { to, subject: template.subject });

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
