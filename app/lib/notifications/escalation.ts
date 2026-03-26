/**
 * Escalation Flow — Chief Orchestrator 텔레그램 보고
 *
 * 모든 Cron이 Yellow/Red 감지 시 이 유틸리티를 통해 Chief에게 보고.
 * Chief가 auto-remediation 시도 후 결과(성공/실패 모두)를 텔레그램으로 보고.
 *
 * 메시지 두 종류:
 * 1. ✅ 자체 해결 완료 (참고용)
 * 2. 🔴 해결 실패 → 은태님 확인 필요
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

function formatKST(): string {
  return new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

async function sendTelegram(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
      }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ===== 개별 Cron용: Yellow/Red 즉시 보고 =====

export interface CronAlertData {
  source: string;
  sourceName: string;
  overall: string;
  issues: Array<{
    name: string;
    status: string;
    message: string;
  }>;
  durationMs: number;
}

export async function reportCronAlert(data: CronAlertData): Promise<boolean> {
  const emoji = data.overall === 'red' ? '🔴' : '🟡';
  const issueLines = data.issues
    .filter(i => i.status !== 'green')
    .map(i => {
      const e = i.status === 'red' ? '🔴' : '🟡';
      return `  ${e} ${i.name}: ${i.message}`;
    })
    .join('\n');

  const message = [
    `${emoji} <b>Chief — Cron 이상 감지</b>`,
    `출처: ${data.sourceName} (${data.source})`,
    `상태: ${data.overall.toUpperCase()}`,
    `━━━━━━━━━━━━━━━━━━━━━`,
    issueLines,
    `━━━━━━━━━━━━━━━━━━━━━`,
    `⏱ ${data.durationMs}ms | ${formatKST()}`,
    ``,
    `💡 다음 division-monitor 사이클에서 자동 수정 시도 예정`,
  ].join('\n');

  return sendTelegram(message);
}

// ===== Division Monitor용: 해결 결과 보고 (성공 + 실패 모두) =====

export interface EscalationReportData {
  overall: string;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  autoResolved: Array<{
    division: string;
    issue: string;
    action: string;
  }>;
  needsAttention: Array<{
    division: string;
    divisionName: string;
    issue: string;
    status: string;
    recommendation: string;
  }>;
  durationMs: number;
}

export async function reportEscalationResult(data: EscalationReportData): Promise<{ sent: boolean; type: string }> {
  // 전부 Green이면 보고 안 함
  if (data.autoResolved.length === 0 && data.needsAttention.length === 0) {
    return { sent: false, type: 'all_green_skip' };
  }

  const lines: string[] = [];
  const statusEmoji = data.overall === 'green' ? '🟢' : data.overall === 'yellow' ? '🟡' : '🔴';

  lines.push(`🧠 <b>Chief Orchestrator — Escalation 보고</b>`);
  lines.push(`${statusEmoji} ${data.greenCount} Green / ${data.yellowCount} Yellow / ${data.redCount} Red`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

  if (data.autoResolved.length > 0) {
    lines.push('');
    lines.push(`✅ <b>자체 해결 완료 (${data.autoResolved.length}건)</b>`);
    for (const r of data.autoResolved) {
      lines.push(`  ${r.division}: ${r.issue}`);
      lines.push(`  → ${r.action}`);
    }
  }

  if (data.needsAttention.length > 0) {
    lines.push('');
    lines.push(`🔴 <b>해결 실패 — 확인 필요 (${data.needsAttention.length}건)</b>`);
    for (const n of data.needsAttention) {
      const emoji = n.status === 'red' ? '🔴' : '🟡';
      lines.push(`  ${emoji} ${n.division} ${n.divisionName}`);
      lines.push(`     ${n.issue}`);
      lines.push(`     💡 ${n.recommendation}`);
    }
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`⏱ ${data.durationMs}ms | ${formatKST()}`);

  const type = data.needsAttention.length > 0
    ? (data.autoResolved.length > 0 ? 'mixed' : 'needs_attention_only')
    : 'auto_resolved_only';

  const sent = await sendTelegram(lines.join('\n'));
  return { sent, type };
}
