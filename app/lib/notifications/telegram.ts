// app/lib/notifications/telegram.ts
// Enterprise Sales + 범용 Telegram 알림 유틸리티

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramNotification(
  message: string,
  parseMode: 'HTML' | 'MarkdownV2' = 'HTML'
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: parseMode,
        }),
      }
    );

    if (!response.ok) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Enterprise Sales 전용 알림
export async function notifyNewEnterpriseLead(
  companyName: string,
  contactEmail: string,
  contactName?: string,
  estimatedVolume?: string
): Promise<boolean> {
  const message = [
    `🏢 <b>새 Enterprise 리드</b>`,
    ``,
    `회사: ${companyName}`,
    `담당자: ${contactName || '미입력'} (${contactEmail})`,
    estimatedVolume ? `예상 볼륨: ${estimatedVolume}` : '',
    ``,
    `✅ Capability Deck + Questionnaire 자동 발송 완료`,
    `📊 D9 파이프라인: proposal_sent`,
  ]
    .filter(Boolean)
    .join('\n');

  return sendTelegramNotification(message);
}

export async function notifyQuestionnaireReceived(
  companyName: string,
  contactEmail: string
): Promise<boolean> {
  const message = [
    `📋 <b>Questionnaire 회신 도착!</b>`,
    ``,
    `회사: ${companyName}`,
    `발신자: ${contactEmail}`,
    ``,
    `⚡ 은태님 확인 필요 → Cowork에서 맞춤 Proposal 작성`,
    `📊 D9 파이프라인: questionnaire_received`,
  ].join('\n');

  return sendTelegramNotification(message);
}

// === Chief Orchestrator Morning Brief Telegram ===

interface MorningBriefTelegramData {
  overall: string;
  summary: { green: number; yellow: number; red: number; total: number };
  auto_resolved: Array<{ division: string; issue: string; action: string; result: string }>;
  needs_attention: Array<{ division: string; divisionName: string; issue: string; status: string; recommendation: string; message: string }>;
  all_green: Array<{ division: string; name: string }>;
  d9_enterprise: {
    total_active: number;
    proposal_sent: number;
    questionnaire_received: number;
    negotiating: number;
    stale_5days: number;
    needs_attention: Array<{ company: string; email: string }>;
  };
  durationMs: number;
}

export async function sendMorningBriefTelegram(data: MorningBriefTelegramData): Promise<{ sent: boolean; reason: string }> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return { sent: false, reason: 'Telegram not configured' };
  }

  const kstTime = new Date().toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

  const statusEmoji = data.overall === 'green' ? '🟢' : data.overall === 'yellow' ? '🟡' : '🔴';
  const lines: string[] = [];

  lines.push(`🧠 <b>Chief Orchestrator — Morning Brief</b>`);
  lines.push(`${kstTime} | ${data.durationMs}ms`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`${statusEmoji} <b>${data.summary.green}</b> Green / <b>${data.summary.yellow}</b> Yellow / <b>${data.summary.red}</b> Red`);

  if (data.auto_resolved.length > 0) {
    lines.push('');
    lines.push(`✅ <b>자동 해결 (${data.auto_resolved.length}건)</b>`);
    for (const r of data.auto_resolved) {
      lines.push(`  ${r.division}: ${r.issue} → ${r.action}`);
    }
  }

  if (data.needs_attention.length > 0) {
    lines.push('');
    lines.push(`⚠️ <b>판단 필요 (${data.needs_attention.length}건)</b>`);
    for (const n of data.needs_attention) {
      const emoji = n.status === 'red' ? '🔴' : '🟡';
      lines.push(`  ${emoji} ${n.division} ${n.divisionName}`);
      lines.push(`     ${n.issue}`);
      lines.push(`     💡 ${n.recommendation}`);
    }
  }

  if (data.d9_enterprise.total_active > 0) {
    lines.push('');
    lines.push(`🏢 <b>D9 Enterprise Pipeline</b>`);
    lines.push(`  Active: ${data.d9_enterprise.total_active} | Proposal: ${data.d9_enterprise.proposal_sent} | Questionnaire: ${data.d9_enterprise.questionnaire_received} | Negotiating: ${data.d9_enterprise.negotiating}`);
    if (data.d9_enterprise.stale_5days > 0) {
      lines.push(`  ⚠️ ${data.d9_enterprise.stale_5days}건 5일+ 미응답`);
    }
    for (const lead of data.d9_enterprise.needs_attention) {
      lines.push(`  📋 Questionnaire 회신: ${lead.company} (${lead.email})`);
    }
  }

  if (data.needs_attention.length === 0 && data.auto_resolved.length === 0) {
    lines.push('');
    lines.push(`☀️ 전 Division 정상. 오늘도 좋은 하루!`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

  const sent = await sendTelegramNotification(lines.join('\n'), 'HTML');
  return { sent, reason: sent ? 'sent' : 'telegram_send_failed' };
}
