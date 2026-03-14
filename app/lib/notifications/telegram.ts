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
