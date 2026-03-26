/**
 * D16 Secretary — Telegram Command Processor
 *
 * Handles Gmail inbox reporting, enterprise lead tracking, and chat inquiries.
 * 핵심 원칙: Secretary는 **보고만** 함. 자동 답장/삭제/전달 절대 안 함.
 * 메일 내용 과장 금지 — 팩트만.
 */

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function wrap(title: string, content: string, durationMs: number): string {
  return `📬 <b>D16 비서실 — ${title}</b>\n━━━━━━━━━━━━━━━━━━━━━\n${content}\n━━━━━━━━━━━━━━━━━━━━━\n⏱ ${durationMs}ms`;
}

// ─── Mail Classification ────────────────────────────

interface CachedMail {
  id: number;
  from_email: string;
  from_name: string;
  subject: string;
  snippet: string;
  received_at: string;
  is_read: boolean;
  is_replied: boolean;
  category: 'urgent' | 'important' | 'info' | 'skip';
  labels: string[];
}

function classifyMail(from: string, subject: string): 'urgent' | 'important' | 'info' | 'skip' {
  const fromLower = from.toLowerCase();
  const subjectLower = subject.toLowerCase();

  // Urgent: security, payment failure, system down
  if (subjectLower.includes('security') || subjectLower.includes('breach') || subjectLower.includes('incident')) return 'urgent';
  if (subjectLower.includes('payment fail') || subjectLower.includes('charge fail')) return 'urgent';
  if (subjectLower.includes('down') && (subjectLower.includes('system') || subjectLower.includes('server'))) return 'urgent';

  // Important: customer, partner, enterprise, questionnaire
  if (subjectLower.includes('enterprise') || subjectLower.includes('questionnaire') || subjectLower.includes('partnership')) return 'important';
  if (subjectLower.includes('inquiry') || subjectLower.includes('문의') || subjectLower.includes('contact')) return 'important';
  if (fromLower.includes('crisp') || subjectLower.includes('new conversation')) return 'important';

  // Info: tech notifications
  if (fromLower.includes('vercel') || fromLower.includes('supabase') || fromLower.includes('github') || fromLower.includes('paddle')) return 'info';
  if (fromLower.includes('resend') || fromLower.includes('sentry') || fromLower.includes('cloudflare')) return 'info';

  // Skip: newsletters, promo, bounce, spam
  if (subjectLower.includes('newsletter') || subjectLower.includes('unsubscribe') || subjectLower.includes('promo')) return 'skip';
  if (subjectLower.includes('bounce') || subjectLower.includes('delivery failure') || subjectLower.includes('mailer-daemon')) return 'skip';
  if (fromLower.includes('noreply') || fromLower.includes('no-reply') || fromLower.includes('marketing')) return 'skip';

  return 'info';
}

const CATEGORY_EMOJI: Record<string, string> = {
  urgent: '🔴',
  important: '🟡',
  info: '🔵',
  skip: '⚪',
};

const CATEGORY_LABEL: Record<string, string> = {
  urgent: '긴급',
  important: '중요',
  info: '참고',
  skip: '스킵',
};

// ─── Inbox Cache (Supabase table) ───────────────────
// Table: secretary_inbox_cache
// Columns: id SERIAL, from_email TEXT, from_name TEXT, subject TEXT,
//          snippet TEXT, received_at TIMESTAMPTZ, is_read BOOL, is_replied BOOL,
//          category TEXT, labels JSONB, cached_at TIMESTAMPTZ

async function getInboxFromCache(options?: {
  unreadOnly?: boolean;
  categories?: string[];
  daysBack?: number;
  limit?: number;
}): Promise<CachedMail[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    let query = supabase
      .from('secretary_inbox_cache')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(options?.limit || 20);

    if (options?.unreadOnly) {
      query = query.eq('is_read', false);
    }
    if (options?.categories && options.categories.length > 0) {
      query = query.in('category', options.categories);
    }
    if (options?.daysBack) {
      const since = new Date(Date.now() - options.daysBack * 86400000).toISOString();
      query = query.gte('received_at', since);
    }

    const { data } = await query;
    return (data || []) as CachedMail[];
  } catch {
    return [];
  }
}

// ─── Commands ───────────────────────────────────────

async function showHelp(): Promise<string> {
  return [
    '<b>📬 D16 비서실 명령어</b>',
    '',
    '📥 <b>메일</b>',
    '  <code>메일</code> <code>inbox</code> — 미읽은 메일 요약',
    '  <code>중요 메일</code> — 긴급+중요만 필터',
    '  <code>미응답</code> — 답장 안 한 메일',
    '  <code>메일 N</code> — N번 메일 상세',
    '  <code>오늘 메일</code> — 오늘 수신 메일',
    '  <code>주간 메일</code> — 최근 7일 메일',
    '',
    '💬 <b>문의</b>',
    '  <code>채팅</code> <code>crisp</code> — 앱 채팅 문의',
    '',
    '🏢 <b>고객</b>',
    '  <code>리드</code> <code>enterprise</code> — Enterprise 리드 현황',
    '',
    '분류: 🔴긴급 🟡중요 🔵참고 ⚪스킵',
  ].join('\n');
}

async function checkInbox(): Promise<string> {
  const mails = await getInboxFromCache({ unreadOnly: true, limit: 30 });

  if (mails.length === 0) {
    return '📭 미읽은 메일이 없습니다.\n\n💡 캐시가 비어있을 수 있습니다. Cowork에서 Gmail 동기화를 실행하세요.';
  }

  const byCategory = { urgent: 0, important: 0, info: 0, skip: 0 };
  for (const m of mails) {
    const cat = m.category || classifyMail(m.from_email, m.subject);
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }

  const lines: string[] = [];
  lines.push(`미읽은 메일: <b>${mails.length}</b>건`);
  lines.push(`🔴 긴급: ${byCategory.urgent} | 🟡 중요: ${byCategory.important} | 🔵 참고: ${byCategory.info} | ⚪ 스킵: ${byCategory.skip}`);
  lines.push('');

  // Show non-skip mails (up to 10)
  const important = mails.filter(m => (m.category || classifyMail(m.from_email, m.subject)) !== 'skip').slice(0, 10);
  for (const m of important) {
    const cat = m.category || classifyMail(m.from_email, m.subject);
    const emoji = CATEGORY_EMOJI[cat] || '⚪';
    const time = new Date(m.received_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    lines.push(`${emoji} #${m.id} ${time}`);
    lines.push(`   <b>${escapeHtml(m.subject.substring(0, 60))}</b>`);
    lines.push(`   ${escapeHtml(m.from_name || m.from_email)}`);
  }

  if (byCategory.skip > 0) {
    lines.push('');
    lines.push(`⚪ 스킵 ${byCategory.skip}건 생략 (뉴스레터/프로모/바운스)`);
  }

  return lines.join('\n');
}

async function checkImportantMail(): Promise<string> {
  const mails = await getInboxFromCache({ categories: ['urgent', 'important'], limit: 15 });

  if (mails.length === 0) return '✅ 긴급/중요 메일이 없습니다.';

  const lines: string[] = [];
  lines.push(`🔴+🟡 중요 메일: <b>${mails.length}</b>건`);
  lines.push('');

  for (const m of mails) {
    const cat = m.category || 'important';
    const emoji = CATEGORY_EMOJI[cat] || '🟡';
    const time = new Date(m.received_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    lines.push(`${emoji} #${m.id} ${time}`);
    lines.push(`   <b>${escapeHtml(m.subject.substring(0, 70))}</b>`);
    lines.push(`   ${escapeHtml(m.from_name || m.from_email)}`);
    if (m.snippet) lines.push(`   ${escapeHtml(m.snippet.substring(0, 80))}...`);
    lines.push('');
  }

  return lines.join('\n');
}

async function checkUnanswered(): Promise<string> {
  const mails = await getInboxFromCache({ limit: 30 });
  const unanswered = mails.filter(m => !m.is_replied && (m.category || classifyMail(m.from_email, m.subject)) !== 'skip');

  if (unanswered.length === 0) return '✅ 미응답 메일이 없습니다.';

  const lines: string[] = [];
  lines.push(`미응답 메일: <b>${unanswered.length}</b>건`);
  lines.push('');

  for (const m of unanswered.slice(0, 10)) {
    const daysSince = Math.floor((Date.now() - new Date(m.received_at).getTime()) / 86400000);
    const urgency = daysSince >= 3 ? '⚠️' : daysSince >= 1 ? '⏰' : '📩';
    lines.push(`${urgency} #${m.id} (${daysSince}일 전)`);
    lines.push(`   <b>${escapeHtml(m.subject.substring(0, 60))}</b>`);
    lines.push(`   ${escapeHtml(m.from_email)}`);
  }

  return lines.join('\n');
}

async function readMailDetail(num: number): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) return '❌ DB 연결 불가';

  try {
    const { data } = await supabase
      .from('secretary_inbox_cache')
      .select('*')
      .eq('id', num)
      .single();

    if (!data) return `❌ #${num} 메일을 찾을 수 없습니다.`;

    const m = data as CachedMail;
    const cat = m.category || classifyMail(m.from_email, m.subject);
    const time = new Date(m.received_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

    const lines = [
      `${CATEGORY_EMOJI[cat]} <b>${CATEGORY_LABEL[cat]}</b> | ${m.is_read ? '읽음' : '안 읽음'} | ${m.is_replied ? '답장 완료' : '미답장'}`,
      '',
      `<b>제목:</b> ${escapeHtml(m.subject)}`,
      `<b>보낸이:</b> ${escapeHtml(m.from_name || '')} &lt;${escapeHtml(m.from_email)}&gt;`,
      `<b>시간:</b> ${time}`,
      '',
      `<b>내용:</b>`,
      escapeHtml(m.snippet || '(내용 없음)'),
    ];

    // Recommended actions based on category
    lines.push('');
    lines.push('<b>추천 액션:</b>');
    if (cat === 'urgent') {
      lines.push('  ⚡ 즉시 확인 필요');
    } else if (cat === 'important') {
      lines.push('  📝 답장 검토 필요');
    } else if (cat === 'info') {
      lines.push('  📋 참고만 하면 됨');
    } else {
      lines.push('  🗑 무시 가능');
    }

    return lines.join('\n');
  } catch {
    return `❌ #${num} 메일 조회 실패`;
  }
}

async function checkTodayMail(): Promise<string> {
  const mails = await getInboxFromCache({ daysBack: 1, limit: 20 });

  if (mails.length === 0) return '📭 오늘 수신 메일이 없습니다.';

  const lines: string[] = [];
  lines.push(`오늘 수신: <b>${mails.length}</b>건`);
  lines.push('');

  for (const m of mails.slice(0, 15)) {
    const cat = m.category || classifyMail(m.from_email, m.subject);
    const emoji = CATEGORY_EMOJI[cat] || '⚪';
    const time = new Date(m.received_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' });
    lines.push(`${emoji} ${time} <b>${escapeHtml(m.subject.substring(0, 50))}</b>`);
    lines.push(`   ${escapeHtml(m.from_name || m.from_email)}`);
  }

  return lines.join('\n');
}

async function checkWeeklyMail(): Promise<string> {
  const mails = await getInboxFromCache({ daysBack: 7, limit: 50 });

  if (mails.length === 0) return '📭 최근 7일 수신 메일이 없습니다.';

  const byCategory = { urgent: 0, important: 0, info: 0, skip: 0 };
  const byDay: Record<string, number> = {};

  for (const m of mails) {
    const cat = m.category || classifyMail(m.from_email, m.subject);
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    const day = new Date(m.received_at).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', weekday: 'short', month: '2-digit', day: '2-digit' });
    byDay[day] = (byDay[day] || 0) + 1;
  }

  const lines: string[] = [];
  lines.push(`최근 7일: <b>${mails.length}</b>건`);
  lines.push(`🔴 ${byCategory.urgent} | 🟡 ${byCategory.important} | 🔵 ${byCategory.info} | ⚪ ${byCategory.skip}`);
  lines.push('');
  lines.push('<b>일별:</b>');
  for (const [day, count] of Object.entries(byDay)) {
    lines.push(`  ${day}: ${count}건`);
  }

  return lines.join('\n');
}

async function checkChatInquiries(): Promise<string> {
  const mails = await getInboxFromCache({ limit: 50 });
  const crisp = mails.filter(m => m.from_email.includes('crisp') || m.subject.toLowerCase().includes('new conversation'));

  if (crisp.length === 0) return '💬 채팅 문의가 없습니다.';

  const lines: string[] = [];
  lines.push(`채팅 문의: <b>${crisp.length}</b>건`);
  lines.push('');

  for (const m of crisp.slice(0, 10)) {
    const time = new Date(m.received_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    lines.push(`💬 ${time}`);
    lines.push(`   <b>${escapeHtml(m.subject.substring(0, 60))}</b>`);
  }

  return lines.join('\n');
}

async function checkEnterprise(): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) return '❌ DB 연결 불가';

  try {
    const { data, count } = await supabase
      .from('enterprise_leads')
      .select('company_name, contact_email, status, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(5);

    const lines: string[] = [];
    lines.push(`총 리드: <b>${count || 0}</b>건`);

    if (data && data.length > 0) {
      lines.push('');
      lines.push('<b>최근 5건:</b>');
      for (const lead of data) {
        const date = new Date(lead.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit' });
        const emoji = lead.status === 'questionnaire_received' ? '📋' : lead.status === 'negotiating' ? '🤝' : lead.status === 'proposal_sent' ? '📨' : '📝';
        lines.push(`${emoji} ${lead.company_name || 'N/A'} — ${lead.status} (${date})`);
        lines.push(`   ${lead.contact_email}`);
      }
    }

    return lines.join('\n');
  } catch {
    return '❌ Enterprise 리드 조회 실패';
  }
}

// ─── Helpers ────────────────────────────────────────

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Main Router ────────────────────────────────────

export async function processSecretaryCommand(command: string): Promise<string> {
  const cmd = command.trim().toLowerCase();
  const start = Date.now();

  // Help
  if (['/start', '/help', '도움', '명령어', 'help'].includes(cmd)) {
    return wrap('명령어 안내', await showHelp(), Date.now() - start);
  }

  // Inbox
  if (['메일', 'inbox', '이메일', '수신함', '메일 확인', '/inbox', 'mail'].includes(cmd)) {
    return wrap('수신함', await checkInbox(), Date.now() - start);
  }

  // Important
  if (['중요', '중요 메일', 'important', '중요메일'].includes(cmd)) {
    return wrap('중요 메일', await checkImportantMail(), Date.now() - start);
  }

  // Unanswered
  if (['미응답', '답장 안 한', 'unanswered', '미답장'].includes(cmd)) {
    return wrap('미응답 메일', await checkUnanswered(), Date.now() - start);
  }

  // Mail detail: "메일 3", "3번", "3번 메일"
  const mailNum = cmd.match(/(?:메일\s*)?(\d+)(?:번)?(?:\s*메일)?/);
  if (mailNum && !cmd.includes('주간') && !cmd.includes('오늘')) {
    const num = parseInt(mailNum[1], 10);
    if (num > 0 && num < 100000) {
      return wrap(`메일 #${num}`, await readMailDetail(num), Date.now() - start);
    }
  }

  // Today
  if (['오늘', '오늘 메일', 'today', '오늘메일'].includes(cmd)) {
    return wrap('오늘 메일', await checkTodayMail(), Date.now() - start);
  }

  // Weekly
  if (['주간', '주간 메일', '이번주', 'week', '주간메일'].includes(cmd)) {
    return wrap('주간 메일', await checkWeeklyMail(), Date.now() - start);
  }

  // Chat inquiries
  if (['채팅', '문의', 'crisp', '채팅 문의', '채팅문의'].includes(cmd)) {
    return wrap('채팅 문의', await checkChatInquiries(), Date.now() - start);
  }

  // Enterprise leads
  if (['리드', '고객', 'enterprise', 'lead', 'leads', '엔터프라이즈'].includes(cmd)) {
    return wrap('Enterprise 리드', await checkEnterprise(), Date.now() - start);
  }

  // Unknown
  return wrap('알 수 없는 명령', `"${escapeHtml(command)}" — 이해하지 못했습니다.\n\n/help 로 명령어를 확인하세요.`, Date.now() - start);
}
