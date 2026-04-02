# F090 SDK 3종 품질 강화 — 단일 기능 명령어

> **이 파일은 F090 SDK 수정만 다룬다. 다른 기능은 절대 건드리지 마라.**

## 목표
JavaScript SDK, Python SDK의 버그 수정 + 누락 기능 추가 + 테스트 작성

---

## Step 1: 현재 상태 분석

### 대상 파일
```
sdk/javascript/src/index.ts          (140줄)
sdk/javascript/package.json
sdk/python/potal/client.py           (182줄)
sdk/python/setup.py
```

### 발견된 문제 (코드 읽고 확인할 것)

#### JavaScript SDK — CRITICAL 3건 + MISSING 4건

1. **CRITICAL: 429 Rate Limit 재시도 안 됨**
   - 위치: `sdk/javascript/src/index.ts` — fetch 후 에러 처리 부분
   - 현재: `status < 500`이면 즉시 throw → 429도 즉시 실패
   - 수정: 429는 `Retry-After` 헤더 읽고 대기 후 재시도

2. **CRITICAL: JSON 파싱 실패 무시**
   - 현재: `res.json()` 실패 시 generic error로 빠짐
   - 수정: try-catch로 감싸고, text() 폴백 → 에러 메시지에 원본 응답 포함

3. **CRITICAL: AbortSignal timeout 호환성**
   - 수정: AbortController 수동 생성 + setTimeout clearTimeout 패턴으로 교체

4. **MISSING: batch 메서드 없음**
   - 추가: `classifyBatch(items[])`, `calculateBatch(items[])` 메서드
   - 엔드포인트: `/api/v1/classify/batch`, `/api/v1/calculate/batch`

5. **MISSING: webhook 관리 메서드 없음**
   - 추가: `listWebhooks()`, `createWebhook()`, `deleteWebhook()`
   - 엔드포인트: `/api/v1/webhooks`

6. **MISSING: Rate Limit 상태 추적 없음**
   - 응답 헤더에서 `X-RateLimit-Remaining`, `X-RateLimit-Reset` 파싱
   - `client.rateLimitRemaining` 프로퍼티로 노출

7. **MISSING: TypeScript 타입 불완전**
   - `params as unknown as Record<string, unknown>` 캐스트 제거
   - 각 메서드별 proper return type 정의 (CalculateResponse, ClassifyResponse 등)

#### Python SDK — CRITICAL 2건 + MISSING 5건

1. **CRITICAL: 에러 핸들링 버그**
   - 위치: `sdk/python/potal/client.py` — except 블록 중첩
   - 현재: PotalError가 outer except에 잡혀서 generic Exception으로 재포장
   - 수정: except PotalError를 별도 핸들러로 분리, re-raise

2. **CRITICAL: Query String 인코딩 누락**
   - 현재: `f"{k}={v}"` — 특수문자(&, =, 공백) 깨짐
   - 수정: `urllib.parse.urlencode(params)` 사용

3. **MISSING: AsyncPotalClient 재시도 로직 없음**
   - 동기 클라이언트는 retry 있지만 비동기는 없음
   - 수정: 동기와 동일한 retry 로직 추가

4. **MISSING: AsyncPotalClient 메서드 누락**
   - 동기: 8개 메서드, 비동기: 3개만 (calculate, classify, screen)
   - 추가: validate_hs, get_country, exchange_rate, batch_calculate, pre_shipment_check

5. **MISSING: Async 세션 리소스 누출**
   - `aiohttp.ClientSession` 에러 시 close 안 됨
   - 수정: `async with` 또는 try/finally로 세션 관리

6. **MISSING: return type 없음**
   - 모든 메서드 `-> dict` 반환
   - 수정: TypedDict 또는 dataclass로 반환 타입 정의

7. **MISSING: 429 Rate Limit 재시도**
   - JS SDK와 동일하게 429 시 Retry-After 대기 후 재시도

---

## Step 2: JavaScript SDK 수정

### 수정 사항 (sdk/javascript/src/index.ts)

```typescript
// 1. 429 재시도 — fetch 에러 처리 부분에 추가
if (res.status === 429) {
  const retryAfter = parseInt(res.headers.get('Retry-After') || '1', 10);
  await new Promise(r => setTimeout(r, retryAfter * 1000));
  continue; // retry loop 계속
}

// 2. JSON 파싱 안전하게
let data: any;
try {
  data = await res.json();
} catch {
  const text = await res.text();
  throw new PotalError(`Invalid JSON response: ${text.slice(0, 200)}`, res.status);
}

// 3. AbortController 수동 관리
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), this.timeout);
try {
  const res = await fetch(url, { ...opts, signal: controller.signal });
  // ...
} finally {
  clearTimeout(timeoutId);
}

// 4. batch 메서드 추가
async classifyBatch(items: ClassifyParams[]): Promise<ClassifyResponse[]> {
  return this.request('POST', '/classify/batch', { items });
}
async calculateBatch(items: CalculateParams[]): Promise<CalculateResponse[]> {
  return this.request('POST', '/calculate/batch', { items });
}

// 5. webhook 메서드 추가
async listWebhooks(): Promise<Webhook[]> {
  return this.request('GET', '/webhooks');
}
async createWebhook(params: CreateWebhookParams): Promise<Webhook> {
  return this.request('POST', '/webhooks', params);
}
async deleteWebhook(id: string): Promise<void> {
  return this.request('DELETE', `/webhooks/${id}`);
}

// 6. Rate Limit 헤더 추적
public rateLimitRemaining: number | null = null;
public rateLimitReset: Date | null = null;
// fetch 후:
this.rateLimitRemaining = parseInt(res.headers.get('X-RateLimit-Remaining') || '', 10) || null;
const resetTs = res.headers.get('X-RateLimit-Reset');
this.rateLimitReset = resetTs ? new Date(parseInt(resetTs, 10) * 1000) : null;
```

### 타입 정의 추가
```typescript
// 각 응답 타입을 명확하게 정의
interface CalculateResponse {
  total_landed_cost: number;
  duty: number;
  tax: number;
  currency: string;
  breakdown: Record<string, number>;
}
interface ClassifyResponse {
  hs_code: string;
  confidence: number;
  description: string;
  method: string;
}
interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
}
// ... 기타 타입들
```

### package.json 버전 업데이트
- `"version": "1.0.0"` → `"version": "1.1.0"`

---

## Step 3: Python SDK 수정

### 수정 사항 (sdk/python/potal/client.py)

```python
# 1. 에러 핸들링 수정
for attempt in range(self.max_retries + 1):
    try:
        # ... fetch 로직 ...
        data = json.loads(body)
        if resp.status >= 400:
            err = PotalError(data.get('error', 'Unknown'), resp.status)
            if resp.status == 429:
                retry_after = int(resp.headers.get('Retry-After', '1'))
                time.sleep(retry_after)
                continue
            if resp.status < 500:
                raise err  # 4xx는 즉시 raise
            last_err = err  # 5xx는 retry
        else:
            return data
    except PotalError:
        raise  # PotalError는 그대로 전파
    except Exception as e:
        last_err = e
        if attempt < self.max_retries:
            time.sleep(2 ** attempt)
raise last_err

# 2. Query String 인코딩
from urllib.parse import urlencode
if params:
    url += '?' + urlencode(params)

# 3. AsyncPotalClient 전면 재작성
class AsyncPotalClient:
    def __init__(self, api_key, base_url='https://www.potal.app/api/v1', max_retries=2, timeout=30):
        self.api_key = api_key
        self.base_url = base_url
        self.max_retries = max_retries
        self.timeout = aiohttp.ClientTimeout(total=timeout)

    async def _request(self, method, path, params=None, json_data=None):
        headers = {'Authorization': f'Bearer {self.api_key}', 'Content-Type': 'application/json'}
        url = f'{self.base_url}{path}'
        if params:
            url += '?' + urlencode(params)

        last_err = None
        for attempt in range(self.max_retries + 1):
            try:
                async with aiohttp.ClientSession(timeout=self.timeout) as session:
                    async with session.request(method, url, headers=headers, json=json_data) as resp:
                        try:
                            data = await resp.json()
                        except:
                            text = await resp.text()
                            raise PotalError(f'Invalid JSON: {text[:200]}', resp.status)
                        if resp.status == 429:
                            retry_after = int(resp.headers.get('Retry-After', '1'))
                            await asyncio.sleep(retry_after)
                            continue
                        if resp.status >= 400:
                            raise PotalError(data.get('error', 'Unknown'), resp.status)
                        return data
            except PotalError:
                raise
            except Exception as e:
                last_err = e
                if attempt < self.max_retries:
                    await asyncio.sleep(2 ** attempt)
        raise last_err

    # 8개 메서드 전부 구현 (동기와 동일)
    async def calculate(self, **kwargs): return await self._request('POST', '/calculate', json_data=kwargs)
    async def classify(self, **kwargs): return await self._request('POST', '/classify', json_data=kwargs)
    async def validate_hs(self, **kwargs): return await self._request('POST', '/validate', json_data=kwargs)
    async def screen(self, **kwargs): return await self._request('POST', '/screening', json_data=kwargs)
    async def get_country(self, code): return await self._request('GET', f'/countries/{code}')
    async def exchange_rate(self, **kwargs): return await self._request('GET', '/exchange-rate/historical', params=kwargs)
    async def batch_calculate(self, items): return await self._request('POST', '/calculate/batch', json_data={'items': items})
    async def pre_shipment_check(self, **kwargs): return await self._request('POST', '/verify/pre-shipment', json_data=kwargs)
```

### setup.py 버전 업데이트
- `version='1.0.0'` → `version='1.1.0'`

---

## Step 4: 테스트 작성

### `__tests__/f090-sdk-javascript.test.ts` (최소 10개)
```
1. JS SDK — calculate() 성공 응답 파싱
2. JS SDK — classify() 성공
3. JS SDK — 429 Rate Limit → Retry-After 대기 후 재시도 성공
4. JS SDK — 400 Bad Request → 즉시 PotalError throw
5. JS SDK — 500 Server Error → retry 후 실패
6. JS SDK — JSON 파싱 실패 → 에러 메시지에 원본 텍스트 포함
7. JS SDK — timeout → AbortController 정상 작동
8. JS SDK — classifyBatch() 배열 전달 및 응답 확인
9. JS SDK — rateLimitRemaining 헤더 파싱
10. JS SDK — createWebhook() 정상 호출
```

### `__tests__/f090-sdk-python.test.ts` (Node에서 Python 실행 또는 로직 검증)
```
1. Python SDK — urlencode 특수문자 정상 인코딩
2. Python SDK — PotalError 전파 정상 (re-wrap 안 됨)
3. Python SDK — 429 재시도 로직
4. Python SDK — AsyncPotalClient 메서드 8개 존재 확인
5. Python SDK — async session 자원 해제 (context manager)
```

---

## Step 5: 5단계 검수

1. **TypeScript 컴파일**: `npx tsc --noEmit` (JS SDK 타입 체크)
2. **any 타입**: `grep -c "as any\|: any" sdk/javascript/src/index.ts` — 0이어야 함
3. **Python Syntax**: `python3 -c "import ast; ast.parse(open('sdk/python/potal/client.py').read()); print('OK')"` — OK
4. **테스트**: `npx jest __tests__/f090-sdk-javascript.test.ts --verbose 2>&1 | tail -20`
5. **빌드**: `npm run build` — Compiled successfully

### 최종 판정 기준
- [ ] JS SDK: 429 재시도 ✅, JSON 파싱 안전 ✅, batch 메서드 ✅, webhook 메서드 ✅, rate limit 추적 ✅
- [ ] Python SDK: 에러 핸들링 수정 ✅, urlencode ✅, Async 메서드 8개 ✅, retry 로직 ✅
- [ ] 테스트: 15개 이상 PASS
- [ ] 빌드: Compiled successfully

---

## 수정/생성 파일 요약
| 파일 | 작업 |
|------|------|
| sdk/javascript/src/index.ts | 수정 (429 재시도, JSON 파싱, batch, webhook, rate limit, 타입) |
| sdk/javascript/package.json | 수정 (version 1.1.0) |
| sdk/python/potal/client.py | 수정 (에러 핸들링, urlencode, Async 전면 재작성) |
| sdk/python/setup.py | 수정 (version 1.1.0) |
| __tests__/f090-sdk-javascript.test.ts | 신규 (10+ 테스트) |
| __tests__/f090-sdk-python.test.ts | 신규 (5+ 테스트) |

## ⚠️ 절대 규칙
- **이 파일에 적힌 6개 파일만 수정/생성한다**
- **다른 기능(F054, F068, F081 등) 건드리지 않는다**
- **빌드 깨지면 push 하지 않는다**
- **console.log 남기지 않는다**
- **작업 로그를 POTAL_Claude_Code_Work_Log.xlsx에 기록한다**
