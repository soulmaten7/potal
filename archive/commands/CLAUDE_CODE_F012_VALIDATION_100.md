# F012 HS Validation — 85% → 100% 업그레이드
# Claude Code 터미널 2 전용
# 2026-03-24 KST

## 절대 규칙
- **이 기능(F012)만 작업한다.** 다른 기능 절대 건드리지 않는다
- **5번 검수 후 100% 달성을 확인하고 나서만 완료 처리한다**
- **npm run build 통과 필수**
- **엑셀 로그 필수** — POTAL_Claude_Code_Work_Log.xlsx에 시트 추가

---

## 1단계: 현재 상태 분석

관련 파일 전부 읽고 현재 상태를 정리해라:

```bash
cat app/lib/cost-engine/hs-code/hs-validator.ts        # 223줄 — 메인 검증 로직
cat app/lib/classification/hs-validator.ts              # 114줄 — 레거시 (비동기, 현재 미사용)
cat app/api/v1/validate/route.ts                        # 155줄 — 메인 API 엔드포인트
cat app/api/v1/validate/hs-code/route.ts                # 27줄 — 단순 래퍼
cat app/lib/cost-engine/hs-code/hs-database.ts          # 229줄 + 1.8MB — HS 코드 DB
cat app/lib/cost-engine/hs-code/types.ts                # 87줄 — 타입 정의
```

분석할 것:
- 각 파일 역할과 데이터 흐름
- REPLACED_CODES에 몇 개 정의되어 있는지
- /validate와 /validate/hs-code 차이점
- Batch 응답 스키마 일관성

---

## 2단계: GAP 목록 확정

| # | GAP | 현재 상태 | 목표 |
|----|-----|----------|------|
| 1 | Deprecated 코드 커버리지 | REPLACED_CODES 5개만 | HS 2017→2022 전체 변환표 반영 |
| 2 | Batch 응답 스키마 불일관 | 에러 시 다른 필드 구조 | 에러/성공 모두 동일 스키마 |
| 3 | /validate vs /validate/hs-code 필드명 불일치 | hsCode vs hs_code | 표준화 (하위호환 유지) |
| 4 | 가격 분기 규칙 미연동 | hs_price_break_rules 18개 미사용 | price 파라미터 추가, 분기 규칙 경고 |
| 5 | 레거시 파일 정리 | classification/hs-validator.ts 미사용 | 제거 또는 명시적 deprecated 표시 |
| 6 | 유사 코드 추천 품질 | 같은 heading 내 5개 무작위 | 키워드/설명 기반 정렬 |

---

## 3단계: GAP별 수정

**GAP 1: Deprecated 코드 확장 (P0)**
- HS 2017→2022 변환 데이터 참조: CLAUDE.md에 기록된 HS Correlation Table
  - 확정 사용 가능: 352,916건 (94.4%)
  - 그대로 유지: 347,798건 (93.0%)
  - 1:1 변환: 5,118건 (1.4%)
  - 분할 판단 필요: 19,527건 (5.2%)
- **최소 요구**: 1:1 변환 5,118건을 REPLACED_CODES에 추가
- 데이터 소스: Supabase에 없으면 코드 내 상수로 추가 (주요 100개라도)
- 또는 DB 테이블 `hs_code_replacements` 신규 생성 → 비동기 조회
- 분할(1:N) 케이스는 warnings에 "This code was split into X codes in HS 2022" 메시지 추가

**GAP 2: Batch 응답 스키마 통일 (P0)**
- 에러 케이스도 성공 케이스와 동일한 필드 구조 사용:
```typescript
// 통일 스키마
{
  index: number,
  hsCode: string,
  valid: boolean,
  status: 'valid' | 'invalid_format' | 'invalid_code' | 'partial_match',
  normalizedCode: string | null,
  chapter: string | null,
  chapterDescription: string | null,
  errors: string[],
  warnings: string[],
  // ... 나머지 필드
}
```
- 에러 시에도 `status`, `errors[]` 필드는 항상 존재

**GAP 3: 필드명 표준화 (P1)**
- `/validate`: hsCode, hsCodes, country ← 표준
- `/validate/hs-code`: hs_code, codes ← 레거시
- 해결: `/validate/hs-code`도 hsCode, hsCodes 지원 (snake_case는 하위호환으로 유지)
- 둘 다 받을 수 있도록: `const code = body.hsCode || body.hs_code`

**GAP 4: 가격 분기 규칙 연동 (P1)**
- `/validate`에 price 옵션 파라미터 추가
- hs_price_break_rules 테이블 (18건) 조회
- 가격 분기 해당 코드면 warnings에 추가:
  "This HS code has price-dependent subheadings. Provide price for accurate validation."
- price가 있으면 정확한 subheading 확인 가능

**GAP 5: 레거시 파일 정리 (P2)**
- `app/lib/classification/hs-validator.ts` 상단에 deprecated 주석 추가:
```typescript
/**
 * @deprecated Use app/lib/cost-engine/hs-code/hs-validator.ts instead.
 * This file is kept for reference only. Do not import from here.
 */
```
- 또는 완전 삭제 (현재 아무 곳에서도 import 안 하고 있으면)

**GAP 6: 유사 코드 추천 품질 (P2)**
- 현재: 같은 heading 내 5개 무작위
- 변경: 상품명 키워드 매칭 기반 정렬
  - 사용자가 입력한 코드의 description 키워드 추출
  - 후보 코드들의 description과 키워드 오버랩 계산
  - 오버랩 높은 순으로 5개 추천

---

## 4단계: 검수 (5번 반복)

### 검수 1: 단위 테스트 (최소 15개)
```
# 포맷 검증
1. 빈 문자열 → invalid_format
2. "abcdef" → invalid_format (숫자 아님)
3. "6" → invalid_format (2자리 미만)
4. "61" → valid, chapter=61 (2자리)
5. "6109" → valid, heading=6109, warnings에 "6자리 제공하세요"
6. "610910" → valid, subheading=610910, entry 매칭 확인
7. "6109.10.00.00" → valid, 정규화 후 6109100000
8. "12345678901" → 경고 (10자리 초과)

# Deprecated 코드
9. "854231" → warnings에 "replaced by 854232" (기존 5개)
10. 새로 추가한 deprecated 코드 1개 → 정상 감지 확인

# Country 검증
11. ("610910", "US") → country_validity.found = true, 10자리 라인 표시
12. ("610910", "KR") → country_validity, 10자리 라인 표시
13. ("610910", "BR") → "BR is validated at 6-digit level only" 메시지

# Batch
14. 3개 코드 배치 → 3개 결과, 스키마 동일 확인
15. 유효+무효 혼합 배치 → 둘 다 동일 스키마 확인
```

### 검수 2: API 응답 검증
```
- POST /api/v1/validate {"hsCode":"610910"} → 정상 응답
- POST /api/v1/validate {"hsCode":"610910","country":"US"} → country_validity 포함
- POST /api/v1/validate {"hsCodes":["610910","999999"],"country":"US"} → 배치 결과
- POST /api/v1/validate/hs-code {"hs_code":"610910"} → 호환 동작
- POST /api/v1/validate/hs-code {"hsCode":"610910"} → 새 필드명 동작
```

### 검수 3: 엣지 케이스
```
- Chapter 77 (예약됨) → "Chapter 77 is reserved" 에러
- Chapter 00, 98, 99 → 적절한 에러
- HS Code "000000" → invalid
- country = "" (빈 문자열) → country 무시
- country = "XX" (존재하지 않는 국가) → 적절한 메시지
- hsCodes 101개 (한도 초과) → 에러 메시지
- price = -1 (음수) → 무시 또는 에러
```

### 검수 4: 빌드 + 타입 체크
```bash
npm run build 2>&1 | tail -30
npx tsc --noEmit 2>&1 | head -20
```

### 검수 5: 코드 리뷰
- TODO 주석 0개 확인
- 하드코딩된 매직넘버 0개 확인 (상수명 필수)
- console.log 0개 확인
- REPLACED_CODES 또는 DB 조회가 실제 데이터 기반인지 확인
- 레거시 파일 정리 확인

---

## 5단계: 완료 조건

아래 전부 충족해야 F012 = 100%:
- [ ] Deprecated 코드 5개 → 최소 100개+ (주요 1:1 변환)
- [ ] Batch 응답 스키마 에러/성공 동일
- [ ] /validate와 /validate/hs-code 필드명 호환
- [ ] 가격 분기 규칙 경고 메시지 추가
- [ ] 레거시 파일 deprecated 표시 또는 삭제
- [ ] 유사 코드 추천 키워드 기반 정렬
- [ ] 단위 테스트 15개 PASS
- [ ] 엣지 케이스 테스트 PASS
- [ ] npm run build 통과
- [ ] TODO 주석 0개, console.log 0개
- [ ] 엑셀 로그 기록 완료

---

## 6단계: 커밋

```bash
git add -A
git commit -m "$(cat <<'EOF'
F012 HS Validation: 85% → 100% production upgrade

- Deprecated 코드 5개 → 100개+ (HS 2017→2022 주요 변환)
- Batch 응답 스키마 통일 (에러/성공 동일 구조)
- 필드명 표준화 (hsCode/hs_code 하위호환)
- 가격 분기 규칙 경고 연동 (hs_price_break_rules 18건)
- 레거시 hs-validator.ts 정리
- 유사 코드 추천 키워드 기반 정렬
- 단위 테스트 15개 + 엣지 케이스 PASS

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
git push 2>&1
```

**이 기능이 100% 완료되면 보고하고, 다음 기능(F046) 명령어를 기다려라. 절대 다음 기능을 스스로 시작하지 마라.**
