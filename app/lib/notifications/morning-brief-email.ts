/**
 * Morning Brief Email Notification
 *
 * Sends email alerts via Resend API (resend.com).
 * Free tier: 100 emails/day, 3,000/month.
 *
 * Rules:
 * - Daily: Only sends if needs_attention >= 1 (avoids noise)
 * - Weekly (Monday): Always sends summary, even if all green
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const MORNING_BRIEF_EMAIL_TO = process.env.MORNING_BRIEF_EMAIL_TO || 'contact@potal.app';
const MORNING_BRIEF_EMAIL_FROM = process.env.MORNING_BRIEF_EMAIL_FROM || 'POTAL <onboarding@resend.dev>';

interface AutoResolved {
  division: string;
  issue: string;
  action: string;
  result: string;
}

interface NeedsAttention {
  division: string;
  divisionName: string;
  issue: string;
  status: string;
  layer: number;
  layerLabel: string;
  recommendation: string;
  message: string;
}

interface AllGreen {
  division: string;
  name: string;
}

interface BriefData {
  overall: string;
  summary: { green: number; yellow: number; red: number; total: number };
  auto_resolved: AutoResolved[];
  needs_attention: NeedsAttention[];
  all_green: AllGreen[];
  durationMs: number;
}

function getDateString(): string {
  return new Date().toLocaleDateString('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  });
}

function isMonday(): boolean {
  const kstDay = new Date().toLocaleDateString('en-US', {
    timeZone: 'Asia/Seoul',
    weekday: 'long',
  });
  return kstDay === 'Monday';
}

function buildDailyHtml(data: BriefData): string {
  const dateStr = getDateString();

  let html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px;">
  <div style="background: #02122c; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 18px; font-weight: 700;">POTAL Morning Brief</h1>
    <p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">${dateStr} &middot; ${data.durationMs}ms</p>
  </div>

  <div style="background: white; padding: 20px 24px; border: 1px solid #e2e8f0; border-top: none;">
    <!-- Summary -->
    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
      <div style="flex: 1; text-align: center; padding: 12px; background: #ecfdf5; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 700; color: #10b981;">${data.summary.green}</div>
        <div style="font-size: 11px; color: #065f46;">Green</div>
      </div>
      <div style="flex: 1; text-align: center; padding: 12px; background: #fffbeb; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${data.summary.yellow}</div>
        <div style="font-size: 11px; color: #92400e;">Yellow</div>
      </div>
      <div style="flex: 1; text-align: center; padding: 12px; background: #fef2f2; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 700; color: #ef4444;">${data.summary.red}</div>
        <div style="font-size: 11px; color: #991b1b;">Red</div>
      </div>
    </div>`;

  // Auto-resolved section
  if (data.auto_resolved.length > 0) {
    html += `
    <div style="margin-bottom: 16px;">
      <h3 style="margin: 0 0 8px; font-size: 14px; color: #10b981;">&#x2705; Auto-Resolved: ${data.auto_resolved.length}</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">`;
    for (const item of data.auto_resolved) {
      html += `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 6px 8px; font-weight: 600; color: #374151;">${item.division}</td>
          <td style="padding: 6px 8px; color: #64748b;">${item.issue}</td>
          <td style="padding: 6px 8px; color: #10b981; font-size: 12px;">${item.action}</td>
        </tr>`;
    }
    html += `
      </table>
    </div>`;
  }

  // Needs attention section
  if (data.needs_attention.length > 0) {
    html += `
    <div style="margin-bottom: 16px;">
      <h3 style="margin: 0 0 8px; font-size: 14px; color: #f59e0b;">&#x1F7E1; Needs Attention: ${data.needs_attention.length}</h3>`;
    for (const item of data.needs_attention) {
      const statusColor = item.status === 'red' ? '#ef4444' : '#f59e0b';
      html += `
      <div style="background: #fafafa; border-left: 3px solid ${statusColor}; padding: 10px 14px; margin-bottom: 8px; border-radius: 0 6px 6px 0;">
        <div style="font-size: 13px; font-weight: 700; color: #1e293b;">${item.division} ${item.divisionName} — ${item.issue}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Layer ${item.layer}: ${item.layerLabel}</div>
        <div style="font-size: 12px; color: #374151; margin-top: 4px;">&#x1F4A1; ${item.recommendation}</div>
      </div>`;
    }
    html += `
    </div>`;
  }

  // All green
  if (data.all_green.length > 0) {
    html += `
    <div>
      <h3 style="margin: 0 0 8px; font-size: 14px; color: #10b981;">&#x1F7E2; All Green: ${data.all_green.length} Divisions</h3>
      <p style="margin: 0; font-size: 12px; color: #94a3b8;">${data.all_green.map(d => `${d.division} ${d.name}`).join(' &middot; ')}</p>
    </div>`;
  }

  html += `
  </div>

  <div style="padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; background: #f1f5f9; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    POTAL Chief Orchestrator &middot; <a href="https://www.potal.app/admin/division-status" style="color: #2563eb;">Division Dashboard</a>
  </div>
</div>`;

  return html;
}

function buildWeeklyHtml(data: BriefData): string {
  const dateStr = getDateString();

  let html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 24px;">
  <div style="background: #1e40af; color: white; padding: 20px 24px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 18px; font-weight: 700;">POTAL Weekly Summary</h1>
    <p style="margin: 4px 0 0; font-size: 13px; color: #93c5fd;">${dateStr}</p>
  </div>

  <div style="background: white; padding: 20px 24px; border: 1px solid #e2e8f0; border-top: none;">
    <!-- Summary -->
    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
      <div style="flex: 1; text-align: center; padding: 12px; background: #ecfdf5; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 700; color: #10b981;">${data.summary.green}</div>
        <div style="font-size: 11px; color: #065f46;">Green</div>
      </div>
      <div style="flex: 1; text-align: center; padding: 12px; background: #fffbeb; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 700; color: #f59e0b;">${data.summary.yellow}</div>
        <div style="font-size: 11px; color: #92400e;">Yellow</div>
      </div>
      <div style="flex: 1; text-align: center; padding: 12px; background: #fef2f2; border-radius: 8px;">
        <div style="font-size: 24px; font-weight: 700; color: #ef4444;">${data.summary.red}</div>
        <div style="font-size: 11px; color: #991b1b;">Red</div>
      </div>
    </div>

    <!-- 15 Division Status -->
    <h3 style="margin: 0 0 10px; font-size: 14px; color: #1e293b;">15 Division Status</h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px;">
      <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
        <th style="padding: 8px; text-align: left; font-weight: 600; color: #64748b;">Division</th>
        <th style="padding: 8px; text-align: center; font-weight: 600; color: #64748b;">Status</th>
      </tr>`;

  const STATUS_EMOJI: Record<string, string> = {
    green: '&#x1F7E2;',
    yellow: '&#x1F7E1;',
    red: '&#x1F534;',
  };

  // Combine all_green with needs_attention for full list
  const divisionList = [
    ...data.all_green.map(d => ({ id: d.division, name: d.name, status: 'green' })),
    ...data.needs_attention.map(d => ({ id: d.division, name: d.divisionName, status: d.status })),
  ].sort((a, b) => {
    const numA = parseInt(a.id.replace('D', ''));
    const numB = parseInt(b.id.replace('D', ''));
    return numA - numB;
  });

  // Deduplicate
  const seen = new Set<string>();
  for (const d of divisionList) {
    if (seen.has(d.id)) continue;
    seen.add(d.id);
    html += `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 6px 8px; color: #374151;">${d.id} ${d.name}</td>
        <td style="padding: 6px 8px; text-align: center;">${STATUS_EMOJI[d.status] || '&#x26AA;'}</td>
      </tr>`;
  }

  html += `
    </table>

    <!-- Key Metrics -->
    <h3 style="margin: 0 0 10px; font-size: 14px; color: #1e293b;">Key Metrics</h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 6px 8px; color: #64748b;">47 Features</td>
        <td style="padding: 6px 8px; font-weight: 600; color: #374151;">34/47 complete</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 6px 8px; color: #64748b;">Countries</td>
        <td style="padding: 6px 8px; font-weight: 600; color: #374151;">240</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 6px 8px; color: #64748b;">Languages</td>
        <td style="padding: 6px 8px; font-weight: 600; color: #374151;">50</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 6px 8px; color: #64748b;">MFN Tariff Rates</td>
        <td style="padding: 6px 8px; font-weight: 600; color: #374151;">1,027,674 (186 countries)</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 6px 8px; color: #64748b;">MIN Rates</td>
        <td style="padding: 6px 8px; font-weight: 600; color: #374151;">~113M rows (53 countries)</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 6px 8px; color: #64748b;">AGR Rates</td>
        <td style="padding: 6px 8px; font-weight: 600; color: #374151;">~144M rows (53 countries)</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 6px 8px; color: #64748b;">Sanctions Screening</td>
        <td style="padding: 6px 8px; font-weight: 600; color: #374151;">21,301 entries (19 sources)</td>
      </tr>
      <tr>
        <td style="padding: 6px 8px; color: #64748b;">Vercel Crons</td>
        <td style="padding: 6px 8px; font-weight: 600; color: #374151;">11 active</td>
      </tr>
    </table>
  </div>

  <div style="padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; background: #f1f5f9; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    POTAL Chief Orchestrator &middot; <a href="https://www.potal.app/admin/division-status" style="color: #2563eb;">Division Dashboard</a> &middot; <a href="https://www.potal.app/admin/intelligence" style="color: #2563eb;">Intelligence</a>
  </div>
</div>`;

  return html;
}

/**
 * Send Morning Brief email via Resend API.
 * Returns true if sent, false if skipped or failed.
 */
export async function sendMorningBriefEmail(data: BriefData): Promise<{ sent: boolean; reason: string }> {
  if (!RESEND_API_KEY) {
    return { sent: false, reason: 'RESEND_API_KEY not configured' };
  }

  const dateStr = getDateString();
  const monday = isMonday();

  // Decision: send or not
  const hasIssues = data.needs_attention.length > 0;

  if (!hasIssues && !monday) {
    return { sent: false, reason: 'All green, not Monday — skipping email' };
  }

  // Build email
  let subject: string;
  let html: string;

  if (monday && !hasIssues) {
    // Weekly summary — all green
    subject = `POTAL Weekly Summary — ${dateStr} — All Green`;
    html = buildWeeklyHtml(data);
  } else if (monday && hasIssues) {
    // Weekly + issues
    subject = `POTAL Weekly Summary — ${dateStr} — ${data.needs_attention.length} issue(s)`;
    html = buildWeeklyHtml(data);
  } else {
    // Daily alert — has issues
    subject = `POTAL Morning Brief — ${dateStr} — ${data.needs_attention.length} issue(s)`;
    html = buildDailyHtml(data);
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: MORNING_BRIEF_EMAIL_FROM,
        to: [MORNING_BRIEF_EMAIL_TO],
        subject,
        html,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { sent: false, reason: `Resend API error (${res.status}): ${errorText}` };
    }

    return { sent: true, reason: monday ? 'Weekly summary sent' : 'Daily alert sent' };
  } catch (err) {
    return { sent: false, reason: `Email send failed: ${err instanceof Error ? err.message : 'Unknown'}` };
  }
}
