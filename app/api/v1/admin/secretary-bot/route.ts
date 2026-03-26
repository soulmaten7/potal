/**
 * D16 Secretary Telegram Bot — Webhook Receiver
 *
 * POST: Telegram webhook (message processing)
 * GET: Status check
 *
 * Secretary는 보고만 함. 자동 답장/삭제/전달 절대 안 함.
 * Chief Bot(8375819470)과 완전 별개 — 토큰, 엔드포인트, 프로세서 모두 분리.
 */

import { NextRequest, NextResponse } from 'next/server';
import { processSecretaryCommand } from '@/app/lib/secretary/command-processor';

const SECRETARY_BOT_TOKEN = process.env.SECRETARY_BOT_TOKEN || '';
const AUTHORIZED_CHAT_ID = '1714151002';

async function sendReply(chatId: string | number, text: string): Promise<void> {
  if (!SECRETARY_BOT_TOKEN) return;

  const MAX_LEN = 4000;
  const parts: string[] = [];

  if (text.length <= MAX_LEN) {
    parts.push(text);
  } else {
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= MAX_LEN) {
        parts.push(remaining);
        break;
      }
      let splitAt = remaining.lastIndexOf('\n', MAX_LEN);
      if (splitAt < MAX_LEN / 2) splitAt = MAX_LEN;
      parts.push(remaining.substring(0, splitAt));
      remaining = remaining.substring(splitAt);
    }
  }

  for (const part of parts) {
    await fetch(`https://api.telegram.org/bot${SECRETARY_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: part,
        parse_mode: 'HTML',
      }),
    }).catch(() => {});
  }
}

async function sendTyping(chatId: string | number): Promise<void> {
  if (!SECRETARY_BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${SECRETARY_BOT_TOKEN}/sendChatAction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action: 'typing' }),
  }).catch(() => {});
}

// ─── POST: Telegram Webhook ─────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message;

    if (!message?.text || !message?.chat?.id) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);

    // Security: only respond to authorized chat
    if (chatId !== AUTHORIZED_CHAT_ID) {
      return NextResponse.json({ ok: true });
    }

    const userText = String(message.text).trim();
    if (!userText) {
      return NextResponse.json({ ok: true });
    }

    // Show typing indicator
    await sendTyping(chatId);

    // Process command
    const response = await processSecretaryCommand(userText);

    // Send reply
    await sendReply(chatId, response);

    return NextResponse.json({ ok: true });
  } catch {
    // Always return 200 to prevent Telegram retries
    return NextResponse.json({ ok: true });
  }
}

// ─── GET: Status ────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    status: 'active',
    bot: 'D16 Secretary',
    commands: ['/help', '메일', '중요 메일', '미응답', '메일 N', '오늘 메일', '주간 메일', '채팅', '리드'],
  });
}
