# Claude Code 명령어: Layer 1 Category 매핑 업그레이드 — CATEGORY_TO_SECTION → chapter-descriptions.ts

> **날짜**: 2026-03-23 KST
> **목표**: Layer 1 `step2-1-section-candidate.ts`에서 사용하는 CATEGORY_TO_SECTION(임의 128개 키워드)를 `chapter-descriptions.ts`(WCO 97 Chapter 공식 법적 정의)로 전환
> **근거**:
>   - CATEGORY_TO_SECTION은 개발자가 수동 추측한 128개 키워드 → Section 매핑 (법적 근거 없음)
>   - chapter-descriptions.ts는 WCO가 공식 정의한 97개 Chapter 설명 (국제법)
>   - CLAUDE.md에 명시: "category의 법적 기준 = WCO 97 Chapter. chapter-descriptions.ts에 97개 전부 코드화"
>   - Layer 2 실험에서도 WCO 기준(v5) > POTAL 임의 키워드(v4) 확인됨
>   - CHAPTER_TO_SECTION 매핑도 이미 chapter-descriptions.ts에 있음 (97 Chapter → 21 Section)
> **Layer 1 절대 규칙**: 기존 코드 수정은 최소화. 추가 위주. regression 테스트 필수.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

---

## Phase 0: 현재 구조 이해

### 현재 코드 (step2-1-section-candidate.ts):

```
CATEGORY_TO_SECTION: 128개 키워드 → Section (수동 하드코딩)
  예: "jewelry" → section 14, "watch" → section 18, "toy" → section 20
  문제: 법적 근거 없음. 커버리지 부족. 새 키워드 발견할 때마다 수동 추가해야 함.
```

### 전환 대상 (chapter-descriptions.ts):

```
CHAPTER_DESCRIPTIONS: 97개 Chapter → WCO 공식 한 줄 설명
  예: 71: "Natural, cultured pearls; precious, semi-precious stones; precious metals..."
  예: 95: "Toys, games and sports requisites; parts and accessories thereof"

CHAPTER_TO_SECTION: 97개 Chapter → 21 Section (공식 매핑)
  예: Ch.71 → Section 14, Ch.95 → Section 20, Ch.85 → Section 16
```

### 전환 이점:
1. **97개 Chapter 전부 커버** (128개 키워드는 일부 Chapter만 커버)
2. **법적 근거** (WCO 공식 정의 = 국제 규칙)
3. **Chapter까지 직접 확정 가능** (현재는 Section만 확정하고 Chapter는 Step 2-3에서 재계산)
4. **새 키워드 수동 추가 불필요** (WCO 설명에서 자동 매칭)

---

## Phase 1: chapter-descriptions.ts에서 Chapter별 키워드 사전 자동 생성

chapter-descriptions.ts의 97개 WCO 공식 설명에서 키워드를 추출한다.

```typescript
// 예시: Chapter 71 description
// "Natural, cultured pearls; precious, semi-precious stones; precious metals, metals clad with precious metal, and articles thereof; imitation jewellery; coin"
// → 추출 키워드: ["pearl", "pearls", "precious", "stone", "stones", "metal", "metals", "jewellery", "jewelry", "imitation", "coin"]

// Chapter 95 description
// "Toys, games and sports requisites; parts and accessories thereof"
// → 추출 키워드: ["toy", "toys", "game", "games", "sport", "sports"]

// 결과물: CHAPTER_KEYWORDS: Record<number, string[]> = { 71: [...], 95: [...], ... }
```

### 추출 규칙:
1. 세미콜론(;)과 콤마(,)로 분리
2. 불용어 제거: "and", "or", "of", "the", "thereof", "other", "n.e.c.", "not elsewhere specified", "articles", "parts", "accessories", "products", "preparations"
3. 복수형/단수형 둘 다 포함
4. "jewellery" → "jewelry" 변형도 추가
5. 최소 3글자 이상만

### ⚠️ 주의: 이 키워드 사전은 CATEGORY_TO_SECTION 128개를 **대체**하는 것이 아니라 **보강**하는 것
- 기존 128개 중 WCO와 일치하는 것은 유지
- WCO에서 새로 추출된 키워드 추가
- 기존 128개 중 WCO와 충돌하는 것만 WCO 기준으로 교정

---

## Phase 2: 코드 변경 — step2-1-section-candidate.ts

### 2-1. import 추가

```typescript
import { CHAPTER_DESCRIPTIONS, CHAPTER_TO_SECTION } from '../../data/chapter-descriptions';
```

### 2-2. CHAPTER_KEYWORDS 생성 (Phase 1 결과물)

chapter-descriptions.ts의 97개 설명에서 키워드를 추출하는 함수를 만든다.
**런타임에 매번 하지 말고, 빌드 시점에 상수로 생성** (성능).

```typescript
/** WCO Chapter descriptions → keyword index (auto-generated from chapter-descriptions.ts) */
const CHAPTER_KEYWORDS: Record<number, string[]> = buildChapterKeywords(CHAPTER_DESCRIPTIONS);

function buildChapterKeywords(descriptions: Record<number, string>): Record<number, string[]> {
  const STOP_WORDS = new Set(['and', 'or', 'of', 'the', 'thereof', 'other', 'not', 'elsewhere',
    'specified', 'included', 'articles', 'parts', 'accessories', 'products', 'preparations',
    'whether', 'their', 'with', 'than', 'such', 'like', 'similar', 'certain', 'kind',
    'suitable', 'a', 'in', 'for', 'to', 'all', 'kinds', 'n.e.c.', 'n.e.c']);

  const result: Record<number, string[]> = {};
  for (const [ch, desc] of Object.entries(descriptions)) {
    const chNum = parseInt(ch);
    // Split by semicolons, commas, parentheses
    const tokens = desc.toLowerCase()
      .replace(/[;,()]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !STOP_WORDS.has(w));
    // Deduplicate
    result[chNum] = [...new Set(tokens)];
  }
  return result;
}
```

### 2-3. 카테고리 매칭 로직 교체

**현재**: category_tokens → CATEGORY_TO_SECTION(128개) → Section 직접 결정
**변경**: category_tokens → CHAPTER_KEYWORDS(97 Chapter) → Chapter 확정 → CHAPTER_TO_SECTION → Section 확정

```typescript
// 현재 코드 (교체 대상):
// for (const token of reversedTokens) {
//   const override = CATEGORY_TO_SECTION[token];
//   ...
// }

// 새 코드:
// Step 1: category_tokens과 CHAPTER_KEYWORDS의 교집합으로 Chapter 후보 찾기
function matchCategoryToChapter(categoryTokens: string[], productName: string): { chapter: number; section: number; score: number; matched_by: string } | null {
  const allTokens = new Set([...categoryTokens, ...productName.toLowerCase().split(/\s+/)]);

  const chapterScores: { chapter: number; matchCount: number; keywords: string[] }[] = [];

  for (const [chStr, keywords] of Object.entries(CHAPTER_KEYWORDS)) {
    const ch = parseInt(chStr);
    const matched = keywords.filter(kw => allTokens.has(kw));
    if (matched.length > 0) {
      chapterScores.push({ chapter: ch, matchCount: matched.length, keywords: matched });
    }
  }

  // 매칭 수 기준 정렬, 최고 매칭 선택
  chapterScores.sort((a, b) => b.matchCount - a.matchCount);

  if (chapterScores.length > 0) {
    const best = chapterScores[0];
    const section = CHAPTER_TO_SECTION[best.chapter];
    const score = Math.min(0.95, 0.7 + best.matchCount * 0.05); // 매칭 많을수록 높은 점수
    return {
      chapter: best.chapter,
      section,
      score,
      matched_by: `wco_chapter:${best.chapter}(${best.keywords.join(',')})`
    };
  }
  return null;
}
```

### 2-4. 기존 CATEGORY_TO_SECTION은 fallback으로 유지

```
매칭 순서:
1. CHAPTER_KEYWORDS (WCO 법적 기준) — 최우선
2. CATEGORY_TO_SECTION (기존 128개) — WCO에서 매칭 안 된 경우에만 fallback
3. product_name fallback — 둘 다 안 된 경우
```

이렇게 하면 기존 동작을 깨뜨리지 않으면서 WCO 법적 기준을 우선 적용할 수 있다.

---

## Phase 3: regression 테스트

### ⚠️ 벤치마크 원칙: 100% 완전한 데이터만 인정

> **불완전 데이터 벤치마크는 돌리지 않는다.**
> HS Code 계산에는 9-field가 법적으로 있어야 한다. 9-field가 다 없는 데이터(HSCodeComp 632건 등)로 벤치마크를 돌리는 것은 무의미하다.
> 시스템은 완전한 입력을 받으면 100%를 내도록 설계되어 있다. 불완전한 입력의 결과는 시스템의 성능이 아니라 입력의 문제다.
> 따라서 벤치마크는 9-field가 전부 채워진 데이터로만 실행한다.

### 3-1. Amazon 169건 regression (9-field 완벽 데이터)

- 변경 전: Section 100%, Chapter 100%, HS6 100%
- **변경 후에도 100% 유지되어야 함** → 하나라도 떨어지면 롤백

### 3-2. 20건 클린 벤치마크 regression (9-field 완벽 데이터)

- 변경 전: Section 100%, Chapter 100%
- **변경 후에도 100% 유지되어야 함**

### 3-3. npm run build

- TypeScript 에러 0개 확인

---

## Phase 4: 결과 분석

### 4-1. 비교표 (완전한 9-field 데이터만)

```
| 벤치마크 | Before (128 kw) | After (WCO 97 Ch) | 차이 |
|---------|----------------|-------------------|------|
| Amazon 169건 Section | 100% | ?% | |
| Amazon 169건 Chapter | 100% | ?% | |
| Amazon 169건 HS6 | 100% | ?% | |
| Clean 20건 Section | 100% | ?% | |
| Clean 20건 Chapter | 100% | ?% | |
```

> ❌ 불완전 데이터(HSCodeComp 등) 벤치마크는 실행하지 않는다.

### 4-2. 변경으로 새로 맞은 건 / 새로 틀린 건 분석 (9-field 데이터 한정)

---

## Phase 5: 결과물

### 엑셀: `POTAL_Layer1_Category_Upgrade.xlsx`

**Sheet 1: Dashboard**
- Before vs After 비교표
- CHAPTER_KEYWORDS 97개 Chapter별 추출 키워드 수
- 기존 CATEGORY_TO_SECTION 128개 중 WCO와 일치/충돌/누락 분류

**Sheet 2: Regression 결과**
- Amazon 169건 + Clean 20건 전체 상세 (Before/After 비교)

**Sheet 3: (삭제 — 불완전 데이터 벤치마크 미실행)**

---

## ⚠️ 절대 규칙

1. **Layer 1 기존 동작 깨뜨리지 않기** — Amazon 169건 100% 유지 필수
2. **CATEGORY_TO_SECTION 128개는 삭제하지 않고 fallback으로 유지** — WCO 매칭 우선, fallback으로 기존 사용
3. **chapter-descriptions.ts 파일 자체는 수정 금지** — 읽기만
4. **MATERIAL_TO_SECTION은 건드리지 않음** — material 매핑은 별개
5. **npm run build 통과 필수**
6. **regression 하나라도 떨어지면 즉시 롤백**
7. **엑셀 로깅 필수** (절대 규칙 11번)
8. **벤치마크 하락 시 Ablation 대조** (절대 규칙 12번)

### 환경변수:
```bash
export NEXT_PUBLIC_SUPABASE_URL='https://zyurflkhiregundhisky.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04'
```
