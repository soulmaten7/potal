/**
 * Chief Orchestrator — Telegram Command Processor
 *
 * Processes incoming commands and returns HTML-formatted Telegram messages.
 */

import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function wrap(title: string, content: string, durationMs: number): string {
  return `🧠 <b>Chief — ${title}</b>\n━━━━━━━━━━━━━━━━━━━━━\n${content}\n━━━━━━━━━━━━━━━━━━━━━\n⏱ ${durationMs}ms`;
}

// ─── Division Meta ──────────────────────────────────

const DIVISIONS: Record<number, { name: string; tables: string[]; cronKeywords: string[] }> = {
  1: { name: 'Tariff & Compliance', tables: ['macmap_ntlc_rates', 'macmap_min_rates', 'macmap_agr_rates', 'trade_remedy_cases'], cronKeywords: ['trade-remedy', 'tariff'] },
  2: { name: 'Tax Engine', tables: ['vat_gst_rates', 'de_minimis_thresholds', 'customs_fees'], cronKeywords: [] },
  3: { name: 'HS Classification', tables: ['product_hs_mappings', 'hs_classification_vectors', 'gov_tariff_schedules'], cronKeywords: [] },
  4: { name: 'Data Pipeline', tables: ['countries'], cronKeywords: ['gov-api', 'exchange-rate', 'tariff-change'] },
  5: { name: 'Product & Web', tables: [], cronKeywords: ['uptime'] },
  6: { name: 'Platform & Integrations', tables: ['marketplace_connections'], cronKeywords: ['plugin-health'] },
  7: { name: 'API & AI Platform', tables: [], cronKeywords: [] },
  8: { name: 'QA & Verification', tables: [], cronKeywords: ['spot-check'] },
  9: { name: 'Customer Acquisition', tables: ['enterprise_leads'], cronKeywords: ['enterprise-lead'] },
  10: { name: 'Revenue & Billing', tables: [], cronKeywords: ['billing-overage', 'subscription-cleanup'] },
  11: { name: 'Infrastructure & Security', tables: [], cronKeywords: ['health-check'] },
  12: { name: 'Marketing & Partnerships', tables: [], cronKeywords: [] },
  13: { name: 'Legal & Compliance', tables: [], cronKeywords: [] },
  14: { name: 'Finance & Strategy', tables: [], cronKeywords: [] },
  15: { name: 'Intelligence & Market', tables: [], cronKeywords: ['competitor-scan'] },
};

// ─── Commands ───────────────────────────────────────

async function showHelp(): Promise<string> {
  const lines = [
    '<b>사용 가능한 명령어:</b>',
    '',
    '📊 <b>전체 상태</b>',
    '  <code>상태</code> <code>브리핑</code> <code>/status</code> — 15개 Division 상태',
    '',
    '🔍 <b>Division 상세</b>',
    '  <code>D1</code>~<code>D15</code> — 개별 Division 상세',
    '',
    '💾 <b>데이터</b>',
    '  <code>데이터</code> <code>db</code> — 주요 테이블 행 수',
    '',
    '🏢 <b>고객</b>',
    '  <code>리드</code> <code>고객</code> — Enterprise 리드 현황',
    '',
    '🌐 <b>API</b>',
    '  <code>api</code> <code>health</code> — API 헬스체크',
    '',
    '🖥 <b>인프라</b>',
    '  <code>인프라</code> <code>cron</code> — Cron/서버 상태',
    '',
    '💰 <b>매출</b>',
    '  <code>매출</code> <code>paddle</code> — 구독/매출 현황',
    '',
    '🔒 <b>보안</b>',
    '  <code>보안</code> <code>security</code> — 보안 상태',
  ];
  return lines.join('\n');
}

async function checkAllDivisions(): Promise<string> {
  const start = Date.now();
  const supabase = getSupabase();
  if (!supabase) return wrap('전체 상태', '❌ DB 연결 불가', Date.now() - start);

  const { data: logs } = await supabase
    .from('health_check_logs')
    .select('overall_status, checks, checked_at, source')
    .order('checked_at', { ascending: false })
    .limit(50);

  let green = 0, yellow = 0, red = 0;
  const divStatus: string[] = [];

  for (let i = 1; i <= 15; i++) {
    const div = DIVISIONS[i];
    // Check if any related cron has issues
    const relatedLogs = (logs || []).filter(l => {
      const src = l.source || '';
      return div.cronKeywords.some(kw => src.includes(kw));
    });

    const hasRed = relatedLogs.some(l => l.overall_status === 'red');
    const hasYellow = relatedLogs.some(l => l.overall_status === 'yellow');
    const status = hasRed ? '🔴' : hasYellow ? '🟡' : '🟢';

    if (hasRed) red++;
    else if (hasYellow) yellow++;
    else green++;

    divStatus.push(`${status} D${i} ${div.name}`);
  }

  const overall = red > 0 ? '🔴' : yellow > 0 ? '🟡' : '🟢';
  const content = [
    `${overall} <b>${green}</b> Green / <b>${yellow}</b> Yellow / <b>${red}</b> Red`,
    '',
    ...divStatus,
  ].join('\n');

  return wrap('전체 상태', content, Date.now() - start);
}

async function checkSingleDivision(num: number): Promise<string> {
  const start = Date.now();
  const div = DIVISIONS[num];
  if (!div) return wrap(`D${num}`, '❌ 존재하지 않는 Division', Date.now() - start);

  const supabase = getSupabase();
  if (!supabase) return wrap(`D${num} ${div.name}`, '❌ DB 연결 불가', Date.now() - start);

  const lines: string[] = [];

  // Table row counts
  if (div.tables.length > 0) {
    lines.push('<b>📊 테이블 현황:</b>');
    for (const table of div.tables) {
      try {
        const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        lines.push(`  ${table}: ${(count || 0).toLocaleString()}행`);
      } catch {
        lines.push(`  ${table}: ⚠️ 조회 실패`);
      }
    }
  }

  // Recent health check logs
  const { data: recentLogs } = await supabase
    .from('health_check_logs')
    .select('overall_status, checked_at, source')
    .order('checked_at', { ascending: false })
    .limit(30);

  const relatedLogs = (recentLogs || []).filter(l => {
    const src = String(l.source || '');
    return div.cronKeywords.some(kw => src.includes(kw));
  }).slice(0, 3);

  if (relatedLogs.length > 0) {
    lines.push('');
    lines.push('<b>📋 최근 Cron 로그:</b>');
    for (const log of relatedLogs) {
      const emoji = log.overall_status === 'green' ? '🟢' : log.overall_status === 'yellow' ? '🟡' : '🔴';
      const time = new Date(log.checked_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      lines.push(`  ${emoji} ${log.source || 'unknown'} — ${time}`);
    }
  } else if (div.cronKeywords.length > 0) {
    lines.push('');
    lines.push('📋 최근 Cron 로그 없음');
  }

  if (lines.length === 0) {
    lines.push('자동화 모니터링 대상 없음 (앱 내장 로직으로 동작)');
  }

  return wrap(`D${num} ${div.name}`, lines.join('\n'), Date.now() - start);
}

async function checkDataStatus(): Promise<string> {
  const start = Date.now();
  const supabase = getSupabase();
  if (!supabase) return wrap('데이터 현황', '❌ DB 연결 불가', Date.now() - start);

  const tables = [
    'macmap_min_rates', 'macmap_agr_rates', 'macmap_ntlc_rates',
    'gov_tariff_schedules', 'sanctions_entries', 'product_hs_mappings',
    'hs_classification_vectors', 'precomputed_landed_costs',
    'trade_remedy_cases', 'enterprise_leads',
  ];

  const lines: string[] = [];
  for (const table of tables) {
    try {
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      const formatted = (count || 0).toLocaleString();
      lines.push(`  ${table}: <b>${formatted}</b>`);
    } catch {
      lines.push(`  ${table}: ⚠️ 조회 실패`);
    }
  }

  return wrap('데이터 현황', lines.join('\n'), Date.now() - start);
}

async function checkD9Leads(): Promise<string> {
  const start = Date.now();
  const supabase = getSupabase();
  if (!supabase) return wrap('D9 Enterprise Leads', '❌ DB 연결 불가', Date.now() - start);

  const { data, count } = await supabase
    .from('enterprise_leads')
    .select('company_name, contact_email, status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(5);

  const lines: string[] = [];
  lines.push(`총 리드: <b>${count || 0}</b>건`);
  lines.push('');

  if (data && data.length > 0) {
    lines.push('<b>최근 5건:</b>');
    for (const lead of data) {
      const date = new Date(lead.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: '2-digit', day: '2-digit' });
      const statusEmoji = lead.status === 'questionnaire_received' ? '📋' : lead.status === 'negotiating' ? '🤝' : lead.status === 'proposal_sent' ? '📨' : '📝';
      lines.push(`  ${statusEmoji} ${lead.company_name || 'N/A'} — ${lead.status} (${date})`);
      lines.push(`     ${lead.contact_email}`);
    }
  } else {
    lines.push('리드 없음');
  }

  return wrap('D9 Enterprise Leads', lines.join('\n'), Date.now() - start);
}

async function checkAPIHealth(): Promise<string> {
  const start = Date.now();
  const baseUrl = 'https://www.potal.app';
  const endpoints = [
    { path: '/', name: 'Homepage' },
    { path: '/api/v1/calculate', name: 'Calculate API' },
    { path: '/api/v1/classify', name: 'Classify API' },
    { path: '/api/v1/exchange-rate', name: 'Exchange Rate API' },
  ];

  const lines: string[] = [];

  for (const ep of endpoints) {
    const epStart = Date.now();
    try {
      const res = await fetch(`${baseUrl}${ep.path}`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });
      const ms = Date.now() - epStart;
      const emoji = res.ok ? '🟢' : res.status === 401 ? '🔐' : '🔴';
      lines.push(`${emoji} ${ep.name}: ${res.status} (${ms}ms)`);
    } catch {
      lines.push(`🔴 ${ep.name}: TIMEOUT/ERROR`);
    }
  }

  return wrap('API Health', lines.join('\n'), Date.now() - start);
}

async function checkInfrastructure(): Promise<string> {
  const start = Date.now();
  const lines: string[] = [];

  // Cron count from vercel.json
  lines.push('<b>인프라 현황:</b>');
  lines.push('  Vercel Cron: <b>24개</b> 등록');
  lines.push('  Vercel 비용: ~$20/월');
  lines.push('  Supabase 비용: ~$25/월');
  lines.push('  총 인프라: ~$49/월');
  lines.push('');

  // potal.app response
  try {
    const t = Date.now();
    const res = await fetch('https://www.potal.app/', { signal: AbortSignal.timeout(10000) });
    const ms = Date.now() - t;
    lines.push(`🌐 potal.app: ${res.status} (${ms}ms)`);
  } catch {
    lines.push('🔴 potal.app: UNREACHABLE');
  }

  return wrap('인프라', lines.join('\n'), Date.now() - start);
}

async function checkD10Revenue(): Promise<string> {
  const start = Date.now();
  const lines: string[] = [];

  lines.push('<b>D10 Revenue & Billing:</b>');
  lines.push('  결제 시스템: Paddle (MoR)');
  lines.push('  Free: $0 (200건/월)');
  lines.push('  Basic: $20/월 (2,000건)');
  lines.push('  Pro: $80/월 (10,000건)');
  lines.push('  Enterprise: $300/월 (50,000건)');
  lines.push('');
  lines.push('  현재 유료 구독자: 0 (프리런치)');
  lines.push('  MRR: $0');
  lines.push('');
  lines.push('💡 Product Hunt 리런치 승인 대기 중');

  return wrap('D10 매출', lines.join('\n'), Date.now() - start);
}

async function checkSecurity(): Promise<string> {
  const start = Date.now();
  const supabase = getSupabase();
  const lines: string[] = [];

  lines.push('<b>보안 상태:</b>');
  lines.push('  🔐 API Key 인증: withApiAuth 미들웨어');
  lines.push('  🔒 RLS: 전 테이블 활성화');
  lines.push('  🛡 Rate Limiting: plan-checker 기반');
  lines.push('  📋 Webhook 서명 검증: HMAC-SHA256');
  lines.push('  🔑 토큰 암호화: AES-256-CBC (marketplace)');

  if (supabase) {
    try {
      const { count } = await supabase.from('sanctions_entries').select('*', { count: 'exact', head: true });
      lines.push(`  🚨 제재 스크리닝: ${(count || 0).toLocaleString()}건 DB`);
    } catch {
      lines.push('  🚨 제재 스크리닝: ⚠️ DB 조회 실패');
    }
  }

  return wrap('보안', lines.join('\n'), Date.now() - start);
}

// ─── AI System Prompt ───────────────────────────────

const CHIEF_SYSTEM_PROMPT = `당신은 POTAL AI Agent Organization의 🧠 Chief Orchestrator (COO)입니다.
은태님(CEO)의 명령을 받아 16개 Division을 관리합니다.

역할:
- 은태님의 자연어 명령을 이해하고, 어떤 Division이 처리해야 하는지 판단
- DB 조회 결과를 바탕으로 현황 보고
- 실행 계획을 제안 (직접 실행은 Claude Code에서)

16개 Division:
D1 Tariff & Compliance | D2 Tax Engine | D3 HS Classification
D4 Data Pipeline | D5 Product & Web | D6 Integrations
D7 API & AI Platform | D8 QA & Verification | D9 Customer Acquisition
D10 Revenue & Billing | D11 Infrastructure | D12 Marketing
D13 Legal | D14 Finance | D15 Intelligence | D16 Secretary (비서실)

응답 규칙:
- 한국어로 응답, 기술 용어는 영어 그대로
- 간결하게, 과장 없이, 팩트만
- HTML 태그 사용 (<b>, <i>, <code>) — Telegram HTML parse_mode
- session-context.md에 없는 숫자 만들지 말 것
- 실행이 필요한 건 "Claude Code에서 실행 필요" 라고 명시
- Secretary(D16)에서 온 보고 내용을 언급하면, 해당 Division 라우팅 추천`;

// ─── AI Context Gathering ───────────────────────────

async function gatherContext(): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) return 'DB 연결 불가';

  try {
    const [healthLogs, leads] = await Promise.all([
      supabase.from('health_check_logs').select('overall_status, source, checked_at').order('checked_at', { ascending: false }).limit(10),
      supabase.from('enterprise_leads').select('company_name, status, contact_email, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    const healthSummary = (healthLogs.data || []).map(l =>
      `${l.overall_status === 'green' ? '🟢' : l.overall_status === 'yellow' ? '🟡' : '🔴'} ${l.source || 'unknown'}`
    ).join(', ');

    const leadsSummary = (leads.data || []).map(l =>
      `${l.company_name || 'N/A'} (${l.status})`
    ).join(', ');

    return `최근 Health Checks: ${healthSummary || 'none'}\nEnterprise Leads: ${leadsSummary || 'none'}\n현재 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`;
  } catch {
    return '컨텍스트 수집 실패';
  }
}

// ─── AI Processing ──────────────────────────────────

async function processWithClaude(userMessage: string): Promise<string> {
  const start = Date.now();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return wrap('AI 모드 불가', 'ANTHROPIC_API_KEY가 설정되지 않았습니다.\n키워드 명령어는 정상 작동합니다. /help 참조.', Date.now() - start);
  }

  try {
    const context = await gatherContext();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: CHIEF_SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: `현재 상태:\n${context}\n\n은태님 명령: ${userMessage}` },
        ],
      }),
      signal: AbortSignal.timeout(25000),
    });

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data?.error?.message || `HTTP ${response.status}`;
      return wrap('AI 응답 실패', `API 에러: ${errMsg}\n\n키워드 명령어는 정상 작동합니다. /help`, Date.now() - start);
    }

    const aiText = data.content?.[0]?.text || '응답 생성 실패';

    return wrap('Chief AI', aiText, Date.now() - start);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return wrap('AI 에러', `${msg}\n\n키워드 명령어를 사용하세요. /help`, Date.now() - start);
  }
}

// ─── Keyword Match (fast path) ──────────────────────

async function tryKeywordMatch(command: string): Promise<string | null> {
  const cmd = command.trim().toLowerCase();
  const start = Date.now();

  if (['/start', '/help', '도움', '명령어', 'help'].includes(cmd)) {
    return wrap('명령어 안내', await showHelp(), Date.now() - start);
  }
  if (['전체', '상태', '브리핑', '/status', 'status', '모닝', 'morning'].includes(cmd)) {
    return checkAllDivisions();
  }
  const divMatch = cmd.match(/^d(\d{1,2})$/i);
  if (divMatch) return checkSingleDivision(parseInt(divMatch[1], 10));
  if (['데이터', 'db', '테이블', 'data', 'table'].includes(cmd)) return checkDataStatus();
  if (['리드', '고객', '이메일', 'lead', 'leads', 'enterprise'].includes(cmd)) return checkD9Leads();
  if (['api', '헬스', 'health', 'ping'].includes(cmd)) return checkAPIHealth();
  if (['인프라', '서버', 'vercel', 'cron', 'infra'].includes(cmd)) return checkInfrastructure();
  if (['매출', '구독', 'paddle', 'mrr', 'revenue'].includes(cmd)) return checkD10Revenue();
  if (['보안', 'security', '보안점검'].includes(cmd)) return checkSecurity();

  return null; // No keyword match → fall through to AI
}

// ─── Main Router ────────────────────────────────────

export async function processChiefCommand(command: string): Promise<string> {
  // 1단계: 키워드 매칭 (빠른 응답, 토큰 $0)
  const keywordResult = await tryKeywordMatch(command);
  if (keywordResult) return keywordResult;

  // 2단계: Claude API 자연어 처리 (fallback)
  return processWithClaude(command);
}
