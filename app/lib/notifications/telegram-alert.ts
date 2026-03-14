/**
 * Telegram Alert Notification
 *
 * Sends urgent alerts via Telegram Bot API.
 * Used by division-monitor for Layer 3 (Active) issues.
 *
 * Env vars:
 * - TELEGRAM_BOT_TOKEN: Bot token from @BotFather
 * - TELEGRAM_CHAT_ID: Target chat/group ID
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

interface TelegramAlertData {
  division: string;
  divisionName: string;
  issue: string;
  status: string;
  recommendation: string;
}

function formatKST(): string {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

/**
 * Send a Telegram alert for a Layer 3 issue.
 * Returns true if sent, false if skipped or failed.
 */
export async function sendTelegramAlert(data: TelegramAlertData): Promise<{ sent: boolean; reason: string }> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return { sent: false, reason: 'TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured' };
  }

  const message = [
    `🔴 POTAL 긴급 알림`,
    `Division: ${data.division} ${data.divisionName}`,
    `이슈: ${data.issue}`,
    `상태: ${data.status.toUpperCase()}`,
    `권장: ${data.recommendation}`,
    `시각: ${formatKST()}`,
  ].join('\n');

  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return { sent: false, reason: `Telegram API error (${res.status}): ${errorText.substring(0, 200)}` };
    }

    return { sent: true, reason: 'Telegram alert sent' };
  } catch (err) {
    return { sent: false, reason: `Telegram send failed: ${err instanceof Error ? err.message : 'Unknown'}` };
  }
}

/**
 * Send a batch of Telegram alerts for multiple Layer 3 issues.
 */
export async function sendTelegramAlertBatch(
  issues: TelegramAlertData[]
): Promise<{ sent: number; failed: number; reason: string }> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return { sent: 0, failed: 0, reason: 'Telegram not configured — skipped' };
  }

  let sent = 0;
  let failed = 0;

  for (const issue of issues) {
    const result = await sendTelegramAlert(issue);
    if (result.sent) {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed, reason: `${sent} sent, ${failed} failed` };
}
