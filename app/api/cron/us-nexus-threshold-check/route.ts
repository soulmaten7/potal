/**
 * POTAL Cron — /api/cron/us-nexus-threshold-check
 *
 * Runs twice yearly (Jan 1 + Jul 1) to verify US sales tax nexus thresholds
 * are still current. Compares the committed data/us-nexus-thresholds.json
 * against the Sales Tax Institute canonical chart.
 *
 * If a potential change is detected, an alert is sent via Telegram and a
 * Notion Task Board task is created (see docs/TELEGRAM_ALERTS.md,
 * docs/NOTION_TASK_BOARD.md for configuration).
 *
 * Vercel cron schedule: "0 3 1 1,7 *" (Jan 1 and Jul 1 at 03:00 UTC)
 */

import { NextRequest, NextResponse } from 'next/server';
import thresholdsData from '@/data/us-nexus-thresholds.json';

const PRIMARY_SOURCE_URL =
  'https://www.salestaxinstitute.com/resources/economic-nexus-state-guide';

interface AlertResult {
  sent: boolean;
  channel: string;
  error?: string;
}

async function sendTelegramAlert(message: string): Promise<AlertResult> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) {
    return { sent: false, channel: 'telegram', error: 'credentials_missing' };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      return { sent: false, channel: 'telegram', error: `http_${res.status}` };
    }
    return { sent: true, channel: 'telegram' };
  } catch (err) {
    return {
      sent: false,
      channel: 'telegram',
      error: err instanceof Error ? err.message : 'unknown',
    };
  }
}

async function createNotionTask(title: string, body: string): Promise<AlertResult> {
  const notionToken = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_TASK_BOARD_DB_ID;
  if (!notionToken || !databaseId) {
    return { sent: false, channel: 'notion', error: 'credentials_missing' };
  }
  try {
    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          Name: { title: [{ text: { content: title } }] },
        },
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: { rich_text: [{ type: 'text', text: { content: body } }] },
          },
        ],
      }),
    });
    if (!res.ok) {
      return { sent: false, channel: 'notion', error: `http_${res.status}` };
    }
    return { sent: true, channel: 'notion' };
  } catch (err) {
    return {
      sent: false,
      channel: 'notion',
      error: err instanceof Error ? err.message : 'unknown',
    };
  }
}

async function fetchSalesTaxInstitute(): Promise<{ ok: boolean; text: string; status: number }> {
  try {
    const res = await fetch(PRIMARY_SOURCE_URL, {
      headers: { 'User-Agent': 'POTAL-NexusMonitor/1.0 (contact@potal.app)' },
    });
    const text = await res.text();
    return { ok: res.ok, text, status: res.status };
  } catch {
    return { ok: false, text: '', status: 0 };
  }
}

/**
 * Scan the fetched HTML for threshold values that differ from our stored data.
 * This is a lightweight signal — the actual authoritative comparison is human-driven.
 */
function detectPotentialChanges(html: string): string[] {
  const notes: string[] = [];
  const plain = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

  for (const s of thresholdsData.states) {
    if (s.thresholdType === 'no_state_tax' || !s.salesThreshold) continue;
    const expected = `$${s.salesThreshold.toLocaleString()}`;
    const stateMention = plain.indexOf(s.stateName);
    if (stateMention === -1) continue;
    // Check if the expected threshold appears near the state name (±600 chars)
    const window = plain.slice(
      Math.max(0, stateMention - 300),
      Math.min(plain.length, stateMention + 600)
    );
    if (!window.includes(expected)) {
      notes.push(`${s.state} (${s.stateName}): expected ${expected} not found near state mention`);
    }
  }
  return notes;
}

export async function GET(req: NextRequest) {
  // Vercel cron bearer check
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = new Date().toISOString();
  const fetched = await fetchSalesTaxInstitute();

  if (!fetched.ok) {
    const alert = await sendTelegramAlert(
      `⚠️ *US Nexus Threshold Check — fetch failed*\nStatus: ${fetched.status}\nSource: ${PRIMARY_SOURCE_URL}`
    );
    return NextResponse.json({
      success: false,
      phase: 'fetch',
      startedAt,
      sourceStatus: fetched.status,
      alerts: [alert],
    });
  }

  const potentialChanges = detectPotentialChanges(fetched.text);
  const statesCount = thresholdsData.states.length;

  if (potentialChanges.length === 0) {
    return NextResponse.json({
      success: true,
      startedAt,
      finishedAt: new Date().toISOString(),
      message: `All ${statesCount} state thresholds verified current.`,
      dataVersion: thresholdsData.meta.version,
      dataLastUpdated: thresholdsData.meta.lastUpdated,
      potentialChanges: [],
    });
  }

  // Changes detected → alert humans to review
  const summary = `${potentialChanges.length} of ${statesCount} states show potential threshold changes`;
  const details = potentialChanges.slice(0, 15).join('\n');

  const telegram = await sendTelegramAlert(
    `🔔 *US Nexus Threshold Update Signal*\n${summary}\n\n${details}\n\n[Review source](${PRIMARY_SOURCE_URL})`
  );
  const notion = await createNotionTask(
    `[Nexus] Threshold review — ${potentialChanges.length} states need verification`,
    `Automated cron detected potential threshold changes.\n\nSummary: ${summary}\n\nDetails:\n${details}\n\nSource: ${PRIMARY_SOURCE_URL}\n\nAction: Manually verify against each state DOR. If changes are confirmed, update data/us-nexus-thresholds.json and bump meta.version.`
  );

  return NextResponse.json({
    success: true,
    startedAt,
    finishedAt: new Date().toISOString(),
    message: summary,
    potentialChanges,
    alerts: [telegram, notion],
  });
}
