# F126 Regulation RAG 품질 강화 — 단일 기능 명령어

> **이 파일은 F126 Regulation RAG 수정만 다룬다. 다른 기능은 절대 건드리지 마라.**

## 목표
regulation-rag 시스템의 버그 수정 + 프로덕션 강화 + 테스트 작성.
현재 `regulation_vectors` 테이블이 비어있어도 코드가 동작해야 하며, 실제 데이터 로딩 후에도 안정적으로 작동해야 함.

---

## Step 1: 현재 상태 분석

### 대상 파일
```
app/lib/cost-engine/regulation-rag/index.ts    (223줄)
app/api/v1/regulations/route.ts                (라우트 핸들러)
supabase/migrations/025_regulation_vectors.sql  (마이그레이션)
```

### 발견된 문제 (코드 읽고 확인할 것)

#### CRITICAL 4건

1. **CRITICAL: 빈 테이블 처리 없음**
   - 위치: `regulation-rag/index.ts` — searchRegulations()
   - 현재: regulation_vectors 테이블 비어있으면 RPC 실행 → 빈 배열 반환 → 호출자가 "결과 없음"인지 "테이블 비어있음"인지 구분 불가
   - 수정: 먼저 `SELECT count(*) FROM regulation_vectors` 쿼리 → 0이면 `{ results: [], meta: { table_empty: true, message: "No regulations loaded yet" } }` 반환

2. **CRITICAL: Fallback 검색이 순위 없음**
   - 현재: RPC 실패 시 `.or(ilike)` 폴백 → 관련성 순위 없이 모든 매칭 반환
   - 수정: 폴백에도 limit(10) + `.order('updated_at', { ascending: false })` 추가. 최신 규정 우선.

3. **CRITICAL: 임베딩 캐시 없음**
   - 현재: 동일 쿼리 반복 시 매번 OpenAI 임베딩 API 호출 ($비용)
   - 수정: 쿼리 텍스트의 SHA256 해시 → Map<string, number[]> 인메모리 캐시 (TTL 1시간, 최대 1000개)

4. **CRITICAL: RPC 존재 여부 확인 안 함**
   - 현재: `match_regulation_vectors` RPC 없으면 에러가 catch에 먹힘 → 조용히 폴백
   - 수정: catch 블록에 console.warn 추가 (디버깅용) + 폴백 이유를 응답 meta에 포함

#### MISSING 7건

5. **MISSING: 배치 삽입 없음**
   - 현재: insertRegulation()은 1건씩만 삽입
   - 추가: `insertRegulationsBatch(regulations: RegulationInput[])` — .insert(array) 사용, 100건 청크

6. **MISSING: 업데이트/삭제 메서드 없음**
   - 추가: `updateRegulation(id: string, data: Partial<RegulationInput>)` — 임베딩 재생성 포함
   - 추가: `deleteRegulation(id: string)` — 소프트 삭제 또는 하드 삭제

7. **MISSING: 중복 검사 없음**
   - 추가: 삽입 전 `(country_code, topic, title)` 조합 중복 체크 → UPSERT 로직

8. **MISSING: 토픽 검증 없음**
   - 현재: 아무 topic이나 삽입 가능
   - 수정: insertRegulation에서 REGULATION_TOPICS 배열 검증 → 목록에 없으면 에러

9. **MISSING: 날짜 기반 순위 없음**
   - 현재: similarity score만으로 정렬
   - 수정: `score = similarity * 0.8 + recency_score * 0.2` (최근 6개월 이내 = 1.0, 1년 이내 = 0.7, 그 외 = 0.3)

10. **MISSING: 소스 권위도 가중치 없음**
    - 추가: source_url에 따라 가중치:
      - `.gov`, `.gc.ca`, `ec.europa.eu` → authority = 1.0
      - `.org` (WTO, WCO) → authority = 0.9
      - 기타 → authority = 0.6
    - final_score = similarity * 0.6 + recency * 0.2 + authority * 0.2

11. **MISSING: 검색 결과에 하이라이트 없음**
    - 추가: 검색어가 포함된 content 부분을 `...앞문맥 **키워드** 뒷문맥...` 형태로 snippet 반환

---

## Step 2: regulation-rag/index.ts 수정

### 임베딩 캐시 추가
```typescript
// 파일 상단에 추가
const embeddingCache = new Map<string, { embedding: number[]; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1시간
const MAX_CACHE = 1000;

function getCachedEmbedding(text: string): number[] | null {
  const hash = createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
  const cached = embeddingCache.get(hash);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.embedding;
  embeddingCache.delete(hash);
  return null;
}

function setCachedEmbedding(text: string, embedding: number[]) {
  const hash = createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
  if (embeddingCache.size >= MAX_CACHE) {
    const oldest = [...embeddingCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
    if (oldest) embeddingCache.delete(oldest[0]);
  }
  embeddingCache.set(hash, { embedding, timestamp: Date.now() });
}
```

### searchRegulations 수정
```typescript
export async function searchRegulations(params: SearchParams): Promise<SearchResult> {
  const { query, country_code, topic, limit = 10 } = params;

  // 1. 빈 테이블 체크
  const { count } = await supabase.from('regulation_vectors').select('*', { count: 'exact', head: true });
  if (!count || count === 0) {
    return { results: [], meta: { table_empty: true, total_count: 0, message: 'No regulations loaded. Phase 2-3 data pending.' } };
  }

  // 2. 캐시된 임베딩 사용 또는 새로 생성
  let embedding = getCachedEmbedding(query);
  if (!embedding) {
    embedding = await generateEmbedding(query);
    setCachedEmbedding(query, embedding);
  }

  // 3. RPC 벡터 검색 (try-catch with 폴백 이유 추적)
  let results: any[] = [];
  let searchMethod = 'vector';
  try {
    const { data, error } = await supabase.rpc('match_regulation_vectors', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: limit,
      filter_country: country_code || null,
      filter_topic: topic || null,
    });
    if (error) throw error;
    results = data || [];
  } catch (rpcError) {
    console.warn('[regulation-rag] RPC fallback:', (rpcError as Error).message);
    searchMethod = 'fallback_ilike';
    // 폴백: ilike + 날짜순 + limit
    let q = supabase.from('regulation_vectors').select('*');
    if (country_code) q = q.eq('country_code', country_code);
    if (topic) q = q.eq('topic', topic);
    q = q.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
    q = q.order('updated_at', { ascending: false }).limit(limit);
    const { data } = await q;
    results = (data || []).map(r => ({ ...r, similarity: 0.5 })); // 폴백은 0.5 고정
  }

  // 4. 재순위: similarity * 0.6 + recency * 0.2 + authority * 0.2
  const now = Date.now();
  const reranked = results.map(r => {
    const ageMs = now - new Date(r.effective_date || r.updated_at || r.created_at).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const recency = ageDays < 180 ? 1.0 : ageDays < 365 ? 0.7 : 0.3;
    const authority = getAuthorityScore(r.source_url || '');
    const finalScore = (r.similarity || 0.5) * 0.6 + recency * 0.2 + authority * 0.2;
    const snippet = generateSnippet(r.content, query);
    return { ...r, final_score: finalScore, recency_score: recency, authority_score: authority, snippet };
  }).sort((a, b) => b.final_score - a.final_score);

  return {
    results: reranked,
    meta: { table_empty: false, total_count: count, search_method: searchMethod, query_cached: getCachedEmbedding(query) !== null }
  };
}

function getAuthorityScore(url: string): number {
  if (!url) return 0.5;
  if (/\.(gov|go\.\w+|gc\.ca|europa\.eu|customs\.\w+)/.test(url)) return 1.0;
  if (/\.(org|int)/.test(url)) return 0.9;
  return 0.6;
}

function generateSnippet(content: string, query: string, contextLen = 80): string {
  if (!content || !query) return '';
  const lower = content.toLowerCase();
  const qLower = query.toLowerCase();
  const idx = lower.indexOf(qLower);
  if (idx === -1) return content.slice(0, contextLen * 2) + '...';
  const start = Math.max(0, idx - contextLen);
  const end = Math.min(content.length, idx + query.length + contextLen);
  return (start > 0 ? '...' : '') + content.slice(start, end) + (end < content.length ? '...' : '');
}
```

### 배치 삽입 + UPSERT + 토픽 검증
```typescript
export async function insertRegulationsBatch(regulations: RegulationInput[]): Promise<{ inserted: number; skipped: number; errors: string[] }> {
  const errors: string[] = [];
  let inserted = 0, skipped = 0;

  for (let i = 0; i < regulations.length; i += 100) {
    const chunk = regulations.slice(i, i + 100);
    const validated = chunk.filter(r => {
      if (!REGULATION_TOPICS.includes(r.topic)) {
        errors.push(`Invalid topic "${r.topic}" for "${r.title}"`);
        skipped++;
        return false;
      }
      return true;
    });

    const withEmbeddings = await Promise.all(validated.map(async r => {
      const embedding = await generateEmbedding(`${r.title} ${r.content.slice(0, 500)}`);
      return { ...r, embedding: JSON.stringify(embedding) };
    }));

    const { error } = await supabase.from('regulation_vectors')
      .upsert(withEmbeddings, { onConflict: 'country_code,topic,title' });

    if (error) errors.push(`Chunk ${i}: ${error.message}`);
    else inserted += withEmbeddings.length;
  }
  return { inserted, skipped, errors };
}

export async function updateRegulation(id: string, data: Partial<RegulationInput>): Promise<void> {
  if (data.content || data.title) {
    const text = `${data.title || ''} ${(data.content || '').slice(0, 500)}`;
    const embedding = await generateEmbedding(text);
    (data as any).embedding = JSON.stringify(embedding);
  }
  const { error } = await supabase.from('regulation_vectors').update(data).eq('id', id);
  if (error) throw new Error(`Update failed: ${error.message}`);
}

export async function deleteRegulation(id: string): Promise<void> {
  const { error } = await supabase.from('regulation_vectors').delete().eq('id', id);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}
```

---

## Step 3: API 라우트 강화

### `app/api/v1/regulations/route.ts` 수정
- GET 메서드 추가: `GET /api/v1/regulations?country=US&topic=tariff` → 목록 조회
- POST 그대로 유지 (검색)
- PUT 추가: 규정 업데이트 (admin only)
- DELETE 추가: 규정 삭제 (admin only)
- 응답에 `meta` 필드 포함 (table_empty, search_method, total_count)

---

## Step 4: 마이그레이션 업데이트

### `supabase/migrations/044_regulation_rag_enhancements.sql`
```sql
-- UNIQUE 제약조건 추가 (UPSERT용)
ALTER TABLE regulation_vectors
ADD CONSTRAINT regulation_vectors_unique_entry
UNIQUE (country_code, topic, title);

-- GIN 인덱스 추가 (ilike 폴백 성능)
CREATE INDEX IF NOT EXISTS idx_regulation_vectors_title_gin
ON regulation_vectors USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_regulation_vectors_content_gin
ON regulation_vectors USING gin (content gin_trgm_ops);

-- source_authority 컬럼 추가
ALTER TABLE regulation_vectors
ADD COLUMN IF NOT EXISTS source_authority REAL DEFAULT 0.5;

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_regulation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_regulation_updated_at
BEFORE UPDATE ON regulation_vectors
FOR EACH ROW EXECUTE FUNCTION update_regulation_updated_at();
```

---

## Step 5: 테스트 작성

### `__tests__/f126-regulation-rag.test.ts` (최소 12개)
```
1. searchRegulations — 빈 테이블 → meta.table_empty === true
2. searchRegulations — 정상 벡터 검색 → results.length > 0
3. searchRegulations — country_code 필터 동작
4. searchRegulations — topic 필터 동작
5. searchRegulations — RPC 실패 시 ilike 폴백 + meta.search_method === 'fallback_ilike'
6. 임베딩 캐시 — 동일 쿼리 2회 호출 → OpenAI API 1회만 호출
7. insertRegulationsBatch — 100건 삽입 → inserted === 100
8. insertRegulationsBatch — 잘못된 topic → skipped + errors 기록
9. insertRegulationsBatch — 중복 삽입 → UPSERT (에러 없음)
10. updateRegulation — content 변경 시 임베딩 재생성
11. deleteRegulation — 삭제 후 조회 → 결과 없음
12. getAuthorityScore — .gov = 1.0, .org = 0.9, 기타 = 0.6
13. generateSnippet — 키워드 전후 컨텍스트 정상 추출
14. reranking — 최신+정부소스가 상위로 정렬
```

---

## Step 6: 5단계 검수

1. **TypeScript 컴파일**: `npx tsc --noEmit` — 0 errors
2. **any 타입**: `grep -c "as any\|: any" app/lib/cost-engine/regulation-rag/index.ts` — 최소화 (embedding JSON 변환만 허용)
3. **import 검증**: regulation-rag에서 crypto 모듈 import 확인 (createHash)
4. **테스트**: `npx jest __tests__/f126-regulation-rag.test.ts --verbose 2>&1 | tail -20`
5. **빌드**: `npm run build` — Compiled successfully

### 최종 판정 기준
- [ ] 빈 테이블 처리 ✅ (meta.table_empty)
- [ ] 임베딩 캐시 ✅ (동일 쿼리 1회 API)
- [ ] 배치 삽입 ✅ (insertRegulationsBatch)
- [ ] UPSERT 중복 방지 ✅
- [ ] 토픽 검증 ✅
- [ ] 재순위 (recency + authority) ✅
- [ ] 스니펫 생성 ✅
- [ ] 폴백 검색 limit + 날짜순 ✅
- [ ] 테스트: 12개 이상 PASS
- [ ] 빌드: Compiled successfully

---

## 수정/생성 파일 요약
| 파일 | 작업 |
|------|------|
| app/lib/cost-engine/regulation-rag/index.ts | 대폭 수정 (캐시, 배치, UPSERT, 재순위, 스니펫, 빈 테이블 처리) |
| app/api/v1/regulations/route.ts | 수정 (GET/PUT/DELETE 추가, meta 응답) |
| supabase/migrations/044_regulation_rag_enhancements.sql | 신규 (UNIQUE, GIN index, trigger) |
| __tests__/f126-regulation-rag.test.ts | 신규 (12+ 테스트) |

## ⚠️ 절대 규칙
- **이 파일에 적힌 4개 파일만 수정/생성한다**
- **다른 기능 건드리지 않는다**
- **regulation_vectors 테이블 데이터는 건드리지 않는다** (빈 상태 유지 OK)
- **빌드 깨지면 push 하지 않는다**
- **console.log 남기지 않는다** (console.warn만 RPC 폴백에서 허용)
- **작업 로그를 POTAL_Claude_Code_Work_Log.xlsx에 기록한다**
