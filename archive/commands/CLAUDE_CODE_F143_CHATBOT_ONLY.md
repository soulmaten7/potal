# F143 AI Chatbot 품질 강화 — 단일 기능 명령어

> **이 파일은 F143 AI Chatbot + Support 수정만 다룬다. 다른 기능은 절대 건드리지 마라.**

## 목표
AI 챗봇(Groq LLM)과 FAQ 지원 시스템의 버그 수정 + 프로덕션 강화 + Regulation RAG 연동 + 대화 히스토리 + 테스트 작성

---

## Step 1: 현재 상태 분석

### 대상 파일
```
app/api/v1/support/chat/route.ts     (115줄) — AI 챗봇 (Groq LLM)
app/api/v1/support/route.ts          (241줄) — FAQ 키워드 매칭
```

### 발견된 문제

#### A. Support Chat (chat/route.ts) — CRITICAL 4건 + MISSING 7건

1. **CRITICAL: 대화 히스토리 없음**
   - 현재: 매 요청이 stateless → LLM에 현재 메시지만 전달
   - 문제: "관세율 알려줘" → "어떻게 줄일 수 있어?" → 두 번째 질문에 문맥 없음
   - 수정: 요청 body에 `messages: Array<{role, content}>` 배열 수신 → 최근 10턴까지 LLM에 전달

2. **CRITICAL: 인증/Rate Limit 없음**
   - 현재: 아무나 무한 호출 가능 → Groq 토큰 비용 폭증
   - 수정: API Key 또는 세션 기반 인증 추가. 미인증 사용자는 분당 5회 제한 (IP 기반)

3. **CRITICAL: Groq API Key 없을 때 조용히 실패**
   - 현재: 키 없으면 "general response" 반환 → 로그 없음
   - 수정: console.warn('[support/chat] GROQ_API_KEY missing') + 응답에 `source: 'fallback_no_api_key'` 명시

4. **CRITICAL: DB 조회 regex 취약**
   - 현재: "VAT rate in USA?" → regex `(\w+)`가 "in" 매칭 (3글자) → 잘못된 국가 조회
   - 수정: 240개국 국가명/코드 사전 매칭으로 교체. `countries` 테이블에서 name/iso2/iso3 기준 매칭

5. **MISSING: Regulation RAG 연동 없음**
   - 현재: LLM 답변은 하드코딩된 시스템 프롬프트에만 의존
   - 수정: 사용자 질문 → `searchRegulations()` 호출 → 관련 규정 top 3개를 시스템 프롬프트에 삽입
   - 형식: `Relevant regulations:\n1. [title] (country, topic): [snippet]...\n2. ...`

6. **MISSING: 로깅 없음**
   - 추가: 모든 질문/답변을 `support_chat_logs` 테이블에 기록
   - 컬럼: id, session_id, user_message, ai_response, source, response_time_ms, created_at

7. **MISSING: 토큰 카운팅 없음**
   - 추가: 프롬프트 + 히스토리 + RAG 컨텍스트 합산 → 모델 토큰 한도(128K) 초과 방지
   - 간단한 추정: 1 토큰 ≈ 4 chars. 총 8000 chars 넘으면 오래된 히스토리부터 제거

8. **MISSING: 스트리밍 응답 없음**
   - 추가: `stream: true` 옵션 시 SSE(Server-Sent Events)로 청크 전달
   - Groq API는 streaming 지원 → `response.body` ReadableStream 활용

9. **MISSING: 피드백 수집 없음**
   - 추가: POST `/api/v1/support/chat/feedback` 엔드포인트
   - body: `{ message_id, rating: 'helpful' | 'not_helpful', comment? }`
   - `support_chat_feedback` 테이블에 저장

10. **MISSING: 타임아웃 재시도 없음**
    - 현재: 15초 timeout → 실패
    - 수정: 1회 재시도 (timeout 20초). 2회 실패 시 폴백 메시지

11. **MISSING: VAT 조회 결과 검증 없음**
    - 현재: rate 또는 vat_rate 컬럼 → 둘 다 null이면 "undefined%"
    - 수정: null 체크 → "VAT rate data not available for this country"

#### B. Support FAQ (route.ts) — CRITICAL 3건 + MISSING 5건

12. **CRITICAL: 키워드 매칭 너무 단순**
    - 현재: 단어 길이가 곧 점수 → 3글자 단어 하나만 매칭되면 통과
    - 수정: 최소 점수 5로 올리기 + 다중 키워드 매칭 보너스 (2개 이상 매칭 시 score * 1.5)

13. **CRITICAL: bestScore >= 3 너무 낮음**
    - 수정: `bestScore >= 5`로 변경. 3글자 단어 1개로는 매칭 안 되게

14. **CRITICAL: i18n 불완전 (50개국어 중 5개만)**
    - 현재: ko, ja, zh, es, fr, de만 번역
    - 수정: 나머지 44개 언어의 fallback 메시지 최소 추가 (pt, ru, ar, hi, th, vi, tr, pl, nl, sv, da, it 등)
    - **최소 20개 언어**로 확장 (가장 많이 쓰이는 20개)

15. **MISSING: FAQ 13개 → 25개로 확장**
    - 추가할 FAQ:
      - Batch API 사용법 (pricing, limits, 형식)
      - Webhook 설정 방법 (delivery, retry, signing)
      - Rules of Origin / FTA 적용 방법
      - Sandbox/테스트 모드 사용법
      - GDPR / 데이터 보존 정책
      - SLA / 가용성 보장
      - SDK 사용법 (JavaScript, Python)
      - 경쟁사 마이그레이션 가이드
      - 이미지 기반 분류 사용법
      - 관세 최적화 팁 (MIN/AGR 자동 적용)
      - Custom HS Code 제출 방법
      - 다국어 지원 범위

16. **MISSING: 컨텍스트(sellerId, plan) 미활용**
    - 현재: body에 context 받지만 무시
    - 수정: plan에 따라 답변 맞춤화 (Free → 업그레이드 안내, Enterprise → 전담 CSM 안내)

17. **MISSING: 분석/로깅 없음**
    - 추가: 어떤 FAQ가 가장 많이 조회되는지 카운트
    - `support_faq_analytics` 테이블: faq_id, hit_count, last_accessed

18. **MISSING: 관련 FAQ 추천 없음**
    - 현재: 매칭 실패 시 "contact support"만
    - 수정: 점수 상위 3개 FAQ를 `suggestions` 배열로 반환

19. **MISSING: Regulation RAG 연결 없음**
    - FAQ에서 IOSS, 브라질 세금 등 언급하지만 실제 규정 링크 없음
    - 수정: FAQ 응답에 관련 규정 snippet 첨부 (searchRegulations 호출)

---

## Step 2: Support Chat 수정 (chat/route.ts)

### 대화 히스토리 + RAG 연동 + 국가 매칭 리팩토링

```typescript
import { searchRegulations } from '@/lib/cost-engine/regulation-rag';

// 요청 body 타입
interface ChatRequest {
  message: string;
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  language?: string;
  session_id?: string;
  stream?: boolean;
}

export async function POST(req: NextRequest) {
  const body: ChatRequest = await req.json();
  const { message, messages = [], language = 'en', session_id, stream = false } = body;

  if (!message || message.length > 2000) {
    return apiError('Message required (max 2000 chars)', 400);
  }

  // Rate limit: IP 기반 분당 10회
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(ip, 10, 60)) {
    return apiError('Rate limit exceeded. Max 10 requests/minute.', 429);
  }

  const startTime = Date.now();

  // 1. Quick DB lookups (국가명 사전 매칭)
  const quickResult = await tryQuickLookup(message);
  if (quickResult) {
    await logChat(session_id, message, quickResult.answer, 'database', Date.now() - startTime);
    return apiSuccess({ answer: quickResult.answer, source: 'database' });
  }

  // 2. RAG 컨텍스트 조회
  let ragContext = '';
  try {
    const ragResult = await searchRegulations({ query: message, limit: 3 });
    if (ragResult.results.length > 0) {
      ragContext = '\n\nRelevant regulations:\n' +
        ragResult.results.map((r, i) =>
          `${i + 1}. [${r.title}] (${r.country_code}, ${r.topic}): ${r.snippet || r.content?.slice(0, 200)}`
        ).join('\n');
    }
  } catch { /* RAG 실패해도 계속 진행 */ }

  // 3. Groq LLM 호출
  const groqKey = process.env.GROQ_API_KEY;
  if (!groqKey) {
    console.warn('[support/chat] GROQ_API_KEY missing — falling back to generic response');
    return apiSuccess({ answer: getFallbackMessage(language), source: 'fallback_no_api_key' });
  }

  // 히스토리 구성 (최근 10턴, 토큰 제한 ~6000 chars)
  const historyMessages = truncateHistory(messages, 6000);
  const systemPrompt = SYSTEM_PROMPT + ragContext;

  const groqMessages = [
    { role: 'system', content: systemPrompt },
    ...historyMessages,
    { role: 'user', content: message }
  ];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: groqMessages,
        max_tokens: 500,
        temperature: 0.3,
        stream: false, // v1은 비스트리밍, 추후 stream 옵션 추가
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[support/chat] Groq error ${res.status}: ${errText.slice(0, 200)}`);
      return apiSuccess({ answer: getFallbackMessage(language), source: 'fallback_groq_error' });
    }

    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content || getFallbackMessage(language);

    await logChat(session_id, message, answer, ragContext ? 'ai+rag' : 'ai', Date.now() - startTime);
    return apiSuccess({ answer, source: ragContext ? 'ai+rag' : 'ai', rag_used: !!ragContext });

  } catch (err) {
    console.warn('[support/chat] Groq call failed:', (err as Error).message);
    return apiSuccess({ answer: getFallbackMessage(language), source: 'fallback_timeout' });
  }
}

// 국가 매칭 — 240개국 이름/코드 사전
async function tryQuickLookup(message: string): Promise<{ answer: string } | null> {
  const lower = message.toLowerCase();

  // VAT 관련 질문 감지
  if (/\b(vat|gst|tax rate|sales tax)\b/i.test(message)) {
    const country = await matchCountryFromText(message);
    if (country) {
      const { data } = await supabase.from('vat_gst_rates')
        .select('rate, vat_name').eq('country_code', country.iso2).single();
      if (data && data.rate != null) {
        return { answer: `${country.name} ${data.vat_name || 'VAT'} rate is ${data.rate}%.` };
      }
    }
  }

  // de minimis 관련
  if (/\b(de minimis|duty.?free|threshold)\b/i.test(message)) {
    const country = await matchCountryFromText(message);
    if (country) {
      const { data } = await supabase.from('de_minimis_thresholds')
        .select('threshold_usd').eq('country_code', country.iso2).single();
      if (data && data.threshold_usd != null) {
        return { answer: `${country.name} de minimis threshold is $${data.threshold_usd} USD.` };
      }
    }
  }

  return null;
}

async function matchCountryFromText(text: string): Promise<{ name: string; iso2: string } | null> {
  // countries 테이블에서 name, iso2, iso3로 매칭
  const { data: countries } = await supabase.from('countries').select('name, iso2, iso3');
  if (!countries) return null;

  const lower = text.toLowerCase();
  // 긴 이름부터 매칭 (United Kingdom > UK)
  const sorted = countries.sort((a, b) => b.name.length - a.name.length);
  for (const c of sorted) {
    if (lower.includes(c.name.toLowerCase()) ||
        lower.includes(c.iso2.toLowerCase()) ||
        (c.iso3 && lower.includes(c.iso3.toLowerCase()))) {
      return { name: c.name, iso2: c.iso2 };
    }
  }
  return null;
}

function truncateHistory(messages: Array<{role: string; content: string}>, maxChars: number) {
  let total = 0;
  const result = [];
  for (let i = messages.length - 1; i >= 0; i--) {
    const len = messages[i].content.length;
    if (total + len > maxChars) break;
    total += len;
    result.unshift(messages[i]);
  }
  return result.slice(-10); // 최대 10턴
}

// IP 기반 rate limiting (인메모리)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string, maxReqs: number, windowSec: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowSec * 1000 });
    return false;
  }
  entry.count++;
  return entry.count > maxReqs;
}

// 채팅 로그 저장
async function logChat(sessionId: string | undefined, userMsg: string, aiResponse: string, source: string, responseTimeMs: number) {
  try {
    await supabase.from('support_chat_logs').insert({
      session_id: sessionId || 'anonymous',
      user_message: userMsg.slice(0, 2000),
      ai_response: aiResponse.slice(0, 5000),
      source,
      response_time_ms: responseTimeMs,
    });
  } catch { /* 로그 실패해도 무시 */ }
}
```

---

## Step 3: FAQ Support 수정 (route.ts)

### 수정 사항
```typescript
// 1. 최소 점수 5로 변경
const MIN_SCORE = 5; // 기존 3에서 5로

// 2. 다중 키워드 보너스
let matchCount = 0;
for (const kw of entry.keywords) {
  if (lower.includes(kw)) {
    score += kw.length;
    matchCount++;
  }
}
if (matchCount >= 2) score *= 1.5; // 2개 이상 키워드 매칭 시 1.5배 보너스

// 3. FAQ 13개 → 25개로 확장 (12개 추가)
const ADDITIONAL_FAQS = [
  { id: 'batch', keywords: ['batch', 'bulk', 'multiple', 'mass'], ... },
  { id: 'webhook', keywords: ['webhook', 'callback', 'notification', 'event'], ... },
  { id: 'roo', keywords: ['origin', 'roo', 'fta', 'preferential', 'certificate'], ... },
  { id: 'sandbox', keywords: ['sandbox', 'test', 'testing', 'development', 'staging'], ... },
  { id: 'gdpr', keywords: ['gdpr', 'privacy', 'data', 'retention', 'delete'], ... },
  { id: 'sla', keywords: ['sla', 'uptime', 'availability', 'guarantee', 'downtime'], ... },
  { id: 'sdk', keywords: ['sdk', 'library', 'package', 'npm', 'pip', 'python', 'javascript'], ... },
  { id: 'migration', keywords: ['migrate', 'migration', 'switch', 'transfer', 'competitor'], ... },
  { id: 'image', keywords: ['image', 'photo', 'picture', 'classify', 'visual'], ... },
  { id: 'optimize', keywords: ['optimize', 'cheapest', 'lowest', 'save', 'reduce', 'fta'], ... },
  { id: 'custom-hs', keywords: ['custom', 'override', 'manual', 'submit', 'own'], ... },
  { id: 'multilang', keywords: ['language', 'translate', 'korean', 'japanese', 'chinese'], ... },
];

// 4. 관련 FAQ 추천 (suggestions)
if (bestScore < MIN_SCORE) {
  const suggestions = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => ({ id: s.entry.id, title: s.entry.keywords[0], score: s.score }));
  return apiSuccess({
    answer: getFallback(language),
    matched: false,
    suggestions, // 관련 FAQ 3개
  });
}

// 5. context 활용 (plan 기반 맞춤)
if (context?.plan === 'free' && bestEntry.id === 'pricing') {
  answer += '\n\n💡 You\'re currently on the Free plan (200 requests/month). Upgrade to Basic ($20/mo) for 2,000 requests and batch API access.';
} else if (context?.plan === 'enterprise') {
  answer += '\n\nAs an Enterprise customer, you have a dedicated CSM. Contact your account manager for personalized assistance.';
}

// 6. i18n 20개 언어로 확장 (기존 5 → 20)
const FALLBACK_MESSAGES: Record<string, string> = {
  ko: '죄송합니다, 해당 질문에 대한 답변을 찾지 못했습니다. support@potal.app으로 문의해주세요.',
  ja: '申し訳ございませんが、該当する回答が見つかりませんでした。support@potal.appまでお問い合わせください。',
  zh: '抱歉，未找到相关答案。请联系 support@potal.app。',
  es: 'Lo sentimos, no encontramos una respuesta. Contacte support@potal.app.',
  fr: 'Désolé, aucune réponse trouvée. Contactez support@potal.app.',
  de: 'Leider keine Antwort gefunden. Kontaktieren Sie support@potal.app.',
  pt: 'Desculpe, nenhuma resposta encontrada. Contate support@potal.app.',
  ru: 'Извините, ответ не найден. Свяжитесь с support@potal.app.',
  ar: 'عذرًا، لم يتم العثور على إجابة. تواصل مع support@potal.app.',
  hi: 'क्षमा करें, कोई उत्तर नहीं मिला। support@potal.app से संपर्क करें।',
  th: 'ขออภัย ไม่พบคำตอบ กรุณาติดต่อ support@potal.app',
  vi: 'Xin lỗi, không tìm thấy câu trả lời. Liên hệ support@potal.app.',
  tr: 'Üzgünüz, yanıt bulunamadı. support@potal.app ile iletişime geçin.',
  pl: 'Przepraszamy, nie znaleziono odpowiedzi. Skontaktuj się z support@potal.app.',
  nl: 'Sorry, geen antwoord gevonden. Neem contact op met support@potal.app.',
  sv: 'Tyvärr, inget svar hittades. Kontakta support@potal.app.',
  da: 'Beklager, intet svar fundet. Kontakt support@potal.app.',
  it: 'Spiacenti, nessuna risposta trovata. Contatta support@potal.app.',
  id: 'Maaf, jawaban tidak ditemukan. Hubungi support@potal.app.',
  ms: 'Maaf, tiada jawapan ditemui. Hubungi support@potal.app.',
  en: 'Sorry, no matching answer found. Please contact support@potal.app for assistance.',
};
```

---

## Step 4: DB 마이그레이션

### `supabase/migrations/045_support_chat_enhancements.sql`
```sql
-- 채팅 로그 테이블
CREATE TABLE IF NOT EXISTS support_chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL DEFAULT 'anonymous',
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'ai',
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_support_chat_logs_session ON support_chat_logs(session_id);
CREATE INDEX idx_support_chat_logs_created ON support_chat_logs(created_at DESC);

-- 채팅 피드백 테이블
CREATE TABLE IF NOT EXISTS support_chat_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID REFERENCES support_chat_logs(id),
  rating TEXT CHECK (rating IN ('helpful', 'not_helpful')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FAQ 분석 테이블
CREATE TABLE IF NOT EXISTS support_faq_analytics (
  faq_id TEXT PRIMARY KEY,
  hit_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE support_chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_chat_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_faq_analytics ENABLE ROW LEVEL SECURITY;

-- 서비스 역할은 전체 접근
CREATE POLICY "service_full_access_chat_logs" ON support_chat_logs FOR ALL USING (true);
CREATE POLICY "service_full_access_chat_feedback" ON support_chat_feedback FOR ALL USING (true);
CREATE POLICY "service_full_access_faq_analytics" ON support_faq_analytics FOR ALL USING (true);
```

---

## Step 5: 피드백 엔드포인트

### `app/api/v1/support/chat/feedback/route.ts` (신규)
```typescript
// POST /api/v1/support/chat/feedback
// body: { log_id: string, rating: 'helpful' | 'not_helpful', comment?: string }
export async function POST(req: NextRequest) {
  const { log_id, rating, comment } = await req.json();
  if (!log_id || !['helpful', 'not_helpful'].includes(rating)) {
    return apiError('log_id and valid rating required', 400);
  }
  const { error } = await supabase.from('support_chat_feedback')
    .insert({ log_id, rating, comment: comment?.slice(0, 500) });
  if (error) return apiError('Failed to save feedback', 500);
  return apiSuccess({ saved: true });
}
```

---

## Step 6: 테스트 작성

### `__tests__/f143-ai-chatbot.test.ts` (최소 15개)
```
=== Chat 테스트 ===
1. POST /support/chat — 정상 메시지 → ai 응답
2. POST /support/chat — 빈 메시지 → 400 에러
3. POST /support/chat — 2000자 초과 → 400 에러
4. POST /support/chat — messages 히스토리 배열 전달 → Groq에 히스토리 포함
5. POST /support/chat — "VAT rate in Japan" → DB 조회 → 10% 반환 (source: database)
6. POST /support/chat — "de minimis in Australia" → threshold 반환
7. POST /support/chat — 존재하지 않는 국가 → AI 폴백
8. POST /support/chat — GROQ_API_KEY 없음 → source: fallback_no_api_key
9. POST /support/chat — Rate limit 11번째 요청 → 429

=== FAQ 테스트 ===
10. POST /support — "how to get API key" → API 관련 FAQ 매칭
11. POST /support — "pricing plans" → 가격 FAQ 매칭
12. POST /support — "asdfghjkl" 의미없는 입력 → matched: false + suggestions 배열
13. POST /support — language: 'ko' → 한국어 답변
14. POST /support — context.plan: 'free' + pricing 질문 → 업그레이드 안내 포함
15. POST /support — 25개 FAQ 전부 키워드로 매칭 가능

=== 피드백 테스트 ===
16. POST /support/chat/feedback — 정상 피드백 저장
17. POST /support/chat/feedback — 잘못된 rating → 400 에러

=== 유틸 테스트 ===
18. matchCountryFromText("Japan") → { name: 'Japan', iso2: 'JP' }
19. matchCountryFromText("US") → { name: 'United States', iso2: 'US' }
20. truncateHistory — 10턴 초과 시 오래된 것부터 제거
```

---

## Step 7: 5단계 검수

1. **TypeScript 컴파일**: `npx tsc --noEmit` — 0 errors in support/
2. **any 타입**: `grep -c "as any\|: any" app/api/v1/support/chat/route.ts app/api/v1/support/route.ts` — 최소화
3. **FAQ 수 확인**: `grep -c "id:" app/api/v1/support/route.ts` — 25개 이상
4. **테스트**: `npx jest __tests__/f143-ai-chatbot.test.ts --verbose 2>&1 | tail -30`
5. **빌드**: `npm run build` — Compiled successfully

### 최종 판정 기준
- [ ] 대화 히스토리 ✅ (messages 배열, 최대 10턴)
- [ ] RAG 연동 ✅ (searchRegulations → 프롬프트 삽입)
- [ ] 국가 매칭 ✅ (countries 테이블 기반, regex 제거)
- [ ] Rate Limit ✅ (IP 기반 분당 10회)
- [ ] 로깅 ✅ (support_chat_logs 테이블)
- [ ] 피드백 ✅ (feedback 엔드포인트)
- [ ] FAQ 25개 ✅ (13 → 25)
- [ ] i18n 20개 ✅ (5 → 20)
- [ ] 관련 FAQ 추천 ✅ (suggestions 배열)
- [ ] context 활용 ✅ (plan 기반)
- [ ] 테스트: 15개 이상 PASS
- [ ] 빌드: Compiled successfully

---

## 수정/생성 파일 요약
| 파일 | 작업 |
|------|------|
| app/api/v1/support/chat/route.ts | 대폭 수정 (히스토리, RAG, 국가매칭, rate limit, 로깅) |
| app/api/v1/support/route.ts | 수정 (FAQ 25개, 점수체계, i18n 20개, suggestions, context) |
| app/api/v1/support/chat/feedback/route.ts | 신규 (피드백 엔드포인트) |
| supabase/migrations/045_support_chat_enhancements.sql | 신규 (3개 테이블) |
| __tests__/f143-ai-chatbot.test.ts | 신규 (20개 테스트) |

## ⚠️ 절대 규칙
- **이 파일에 적힌 5개 파일만 수정/생성한다**
- **다른 기능 건드리지 않는다**
- **regulation-rag/index.ts는 import만 한다. 수정하지 않는다** (F126에서 별도 수정)
- **Groq API Key는 환경변수에서만 읽는다. 하드코딩 금지**
- **빌드 깨지면 push 하지 않는다**
- **console.log 남기지 않는다** (console.warn만 에러 상황에서 허용)
- **작업 로그를 POTAL_Claude_Code_Work_Log.xlsx에 기록한다**
