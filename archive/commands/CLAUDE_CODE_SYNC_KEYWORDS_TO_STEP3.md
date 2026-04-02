# Claude Code 명령어: codified 키워드 12,586개 → Step 3 KEYWORD_TO_HEADINGS 동기화

> **날짜**: 2026-03-21 KST
> **목표**: codified_national_full_final.json에서 추출된 12,586개 키워드를 step3-heading.ts의 KEYWORD_TO_HEADINGS에 반영
> **현재**: KEYWORD_TO_HEADINGS = ~380개. codified에 12,586개 키워드가 있는데 대부분 미반영.
> **제약**: Step 3 로직(if문, 매칭 방식) 수정 금지. KEYWORD_TO_HEADINGS 사전 데이터만 추가.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **시트 마감**: `=== 작업 종료 ===`

---

## 배경

### codified_national_full_final.json에서 나온 키워드:
- 7개국 125,576행의 description에서 추출된 keywords
- 총 12,586개 고유 키워드
- 각 키워드가 어떤 Heading(4자리)에 매핑되는지 정보 포함

### 현재 KEYWORD_TO_HEADINGS (step3-heading.ts):
- ~380개 키워드 → Heading 매핑
- 1,233개 Heading 중 일부만 커버

### 문제:
- 12,586개 키워드가 codified JSON에는 있는데 Step 3에 안 들어감
- Step 3 Heading 선택 시 이 키워드들이 활용 안 됨
- codified-headings.ts에도 10,222개 키워드가 있는데 이것도 부분만 반영됨

---

## Phase 1: 키워드 소스 전부 수집

### 1-1. codified_national_full_final.json에서 키워드 추출

7개국 JSON에서 각 entry의 keywords + 해당 HS6의 앞 4자리(Heading) 매핑:

```python
# 각 나라 JSON 로드 → keywords → Heading(앞4자리) 매핑
# 결과: { "t-shirt": ["6109"], "mug": ["6912"], "glass": ["7013"], ... }
```

### 1-2. codified-headings.ts에서 기존 keywords 추출

```python
# data/codified-headings.ts의 1,233개 entry에서 keywords 배열 추출
# 각 keyword → 해당 Heading 코드 매핑
```

### 1-3. 현재 KEYWORD_TO_HEADINGS 추출

```python
# step3-heading.ts에서 현재 380개 키워드 추출
```

### 1-4. 3개 소스 합산 + 중복 제거

```
소스 1: codified_national (12,586개)
소스 2: codified-headings (10,222개)
소스 3: 현재 KEYWORD_TO_HEADINGS (380개)

합산 → 중복 제거 → 최종 키워드 목록
```

---

## Phase 2: 키워드 전부 추가 (필터 없음)

**품질 필터 넣지 않는다.** 이유:
1. Step 3은 이미 Chapter가 확정된 상태에서 Heading을 고르므로 같은 키워드가 여러 Heading에 매핑돼도 문제 안 됨
2. 짧은 키워드(2글자)도 "of cotton", "of steel" 등에서 핵심 역할 가능
3. 기존 100% 정확도는 키워드를 최대한 활용해서 달성한 것 — 빼면 오히려 떨어짐

### 2-1. 12,586개 + codified-headings 10,222개 전부 합산

3개 소스에서 나온 키워드 전부 합산 + 중복 제거:
- codified_national_full_final.json: 12,586개
- codified-headings.ts: 10,222개
- 현재 KEYWORD_TO_HEADINGS: 380개

### 2-2. 기존 380개 매핑은 유지

기존 키워드의 Heading 매핑은 그대로 유지 (이미 100% 검증됨).
신규 키워드는 기존에 없는 것만 추가.
같은 키워드가 기존과 다른 Heading으로 매핑되면 — 기존 매핑 유지 + 신규 Heading도 배열에 추가 (둘 다 유효할 수 있음).

---

## Phase 3: KEYWORD_TO_HEADINGS에 추가

### 3-1. step3-heading.ts 수정

기존 KEYWORD_TO_HEADINGS 객체에 신규 키워드 추가:

```typescript
// 기존 (380개)
const KEYWORD_TO_HEADINGS: Record<string, string[]> = {
  't-shirt': ['6109'],
  'mug': ['6912'],
  ...
  // 신규 추가 (X개)
  'candle': ['3406'],
  'drill': ['8467'],
  'broom': ['9603'],
  ...
};
```

### 3-2. 추가 시 주의사항
- **기존 380개 키워드 수정/삭제 금지** — 추가만
- 각 키워드 → Heading 매핑이 정확한지 codified 데이터와 대조
- 너무 많이 넣으면 빌드 시간 증가할 수 있음 → 파일 크기 확인

---

## Phase 4: 빌드 + Regression 테스트

### 4-1. npm run build
```bash
npm run build  # 0 errors
```

### 4-2. Regression — 기존 결과 유지되는지

```
1. Clean 20건: 20/20 유지
2. Amazon 50건: Section/Chapter/Heading/HS6 100% 유지
3. 169건 US: 이전 결과와 비교 — 개선만 있고 퇴보 없어야 함
```

### 4-3. 개선 확인

169건에서 Heading 매칭 방식 변화:
- 이전: keyword fallback → codified-headings fallback 많았을 것
- 이후: KEYWORD_TO_HEADINGS 직접 매칭 증가 → confidence 향상

---

## Phase 5: 다른 미반영 항목 최종 확인

### 5-1. PRICE_THRESHOLD 5,686건

이건 **Step 4 base-agent.ts의 scoreWithPatterns에서 이미 사용 중:**
```typescript
if (patterns.includes('PRICE_THRESHOLD') && input.price !== undefined) {
  if (condition === 'not_over' && input.price <= threshold) score += 15;
}
```
→ **Step 4에 반영 완료. 추가 작업 불필요.**

### 5-2. GENDER 1,963건

**Step 4 base-agent.ts에서 이미 사용 중:**
```typescript
if (patterns.includes('GENDER') && conditions.gender) {
  if (nameLower.includes('men') || nameLower.includes('boy')) score += 10;
}
```
→ **Step 4에 반영 완료.**

### 5-3. COMPOSITION_PCT 6,005건

**Step 4 base-agent.ts에서 이미 사용 중:**
```typescript
if (patterns.includes('COMPOSITION_PCT') && conditions.composition_pct) {
  if (primary.pct >= reqPct) score += 6;
}
```
→ **Step 4에 반영 완료.**

### 5-4. SIZE/WEIGHT 1,547건

**Step 4 base-agent.ts에서 이미 사용 중:**
```typescript
if (patterns.includes('SIZE_THRESHOLD') && conditions.size_cm && input.weight_spec) {
  if (val <= conditions.size_cm) score += 6;
}
```
→ **Step 4에 반영 완료.**

### 5-5. 결론: 미반영은 KEYWORD_TO_HEADINGS만

| 항목 | 미반영 여부 | 이유 |
|------|----------|------|
| KEYWORD_TO_HEADINGS | ⚠️ 이 명령어에서 반영 | 12,586개 중 380개만 Step 3에 있었음 |
| PRICE_THRESHOLD | ✅ 이미 반영 | Step 4 패턴 매칭에서 사용 |
| GENDER | ✅ 이미 반영 | Step 4 패턴 매칭에서 사용 |
| COMPOSITION_PCT | ✅ 이미 반영 | Step 4 패턴 매칭에서 사용 |
| SIZE/WEIGHT | ✅ 이미 반영 | Step 4 패턴 매칭에서 사용 |

---

## 결과물

### 엑셀: `POTAL_Keyword_Sync.xlsx`

**Sheet 1: 키워드 동기화 요약**
| 항목 | Before | After |
|------|--------|-------|
| KEYWORD_TO_HEADINGS | 380 | X |
| Heading 커버리지 | 114/1,233 | X/1,233 |
| 소스별 키워드 수 | | |
| 충돌/제외 키워드 | | |

**Sheet 2: 추가된 키워드 전체 목록**
- keyword, heading, 소스(codified_national/codified_headings)

**Sheet 3: 제외된 키워드 (+ 사유)**

**Sheet 4: Regression 결과**

시트 마감: `=== 작업 종료 === | 추가 X개 | 제외 X개 | Regression 유지 | 빌드 ✅`

---

## ⚠️ 절대 규칙

1. **기존 380개 키워드 수정/삭제 금지** — 추가만
2. **Step 3 매칭 로직 수정 금지** — KEYWORD_TO_HEADINGS 데이터만 추가
3. **5개 이상 Heading에 매핑되는 포괄 키워드 제외** — 구분력 없음
4. **Regression 필수** — Clean 20 + Amazon 50 + 169건 깨지면 안 됨
5. **엑셀에 추가/제외 키워드 전부 기록**
