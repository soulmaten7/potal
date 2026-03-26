/**
 * Chief Orchestrator Telegram Bot — Webhook Receiver
 *
 * POST: Telegram webhook (message processing)
 * GET: Status check
 */

import { NextRequest, NextResponse } from 'next/server';
import { processChiefCommand } from '@/app/lib/chief-orchestrator/command-processor';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

async function sendTelegramReply(chatId: string | number, text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) return;

  // Split long messages (Telegram 4096 char limit)
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
      // Find last newline before limit
      let splitAt = remaining.lastIndexOf('\n', MAX_LEN);
      if (splitAt < MAX_LEN / 2) splitAt = MAX_LEN;
      parts.push(remaining.substring(0, splitAt));
      remaining = remaining.substring(splitAt);
    }
  }

  for (const part of parts) {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
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

async function sendTypingAction(chatId: string | number): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendChatAction`, {
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
    if (TELEGRAM_CHAT_ID && chatId !== TELEGRAM_CHAT_ID) {
      return NextResponse.json({ ok: true });
    }

    const userText = String(message.text).trim();
    if (!userText) {
      return NextResponse.json({ ok: true });
    }

    // Show typing indicator
    await sendTypingAction(chatId);

    // Process command
    const response = await processChiefCommand(userText);

    // Send reply
    await sendTelegramReply(chatId, response);

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
    bot: 'Chief Orchestrator',
    commands: ['/help', '/status', 'D1-D15', '데이터', '리드', 'api', '인프라', '매출', '보안'],
  });
}
