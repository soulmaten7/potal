# GRI 파이프라인 v2 재설계 — Claude Code 실행 명령어
> 2026-03-17 KST — Cowork에서 설계 → Claude Code에서 실행

## 배경 요약 (Claude Code가 읽어야 하는 맥락)

### 현재 상태
- GRI 분류 엔진 v1.2 벤치마크: **6%/16%/35%** (6자리/4자리/2자리)
- 원인: Step 2~6이 순수 키워드 매칭 → 관세사의 "의미 이해" 못함
- 예: "Used Restaurant Grease" → 키워드 "restaurant","grease" → Section 3(지방류) 도달 불가
- 관세사: "이건 폐식용유 = 지방류" 의미 파악 → Section 3, Ch.15 확정

### 재설계 핵심
- **"시스템을 바꾸지 말고 사람을 대체하라"** — 관세사의 실제 사고 과정을 각 Step별 전용 프롬프트로 재현
- 각 Step마다 **디테일한 프롬프트**를 만들어서, LLM이 관세사처럼 "의미"로 판단하게 함
- 프롬프트가 길고 구체적일수록 매번 동일한 결과 도출

### 파이프라인 변경 요약
```
현재 (v1.2, 6%):
Step 1 [코드] 키워드추출 → Step 2 [코드 키워드] Section → Step 4 [코드 키워드] Chapter → Step 6 [코드 키워드] Heading → Step 7 [AI 가끔] 대립 → Step 8 [코드] Subheading

재설계 (v2 목표 80%+):
Step 0.5 [코드] DB 캐시 검색 (1.36M건, 히트하면 즉시 반환)
Step 1 [코드] 키워드/재료/타입 추출 (동일)
Step 2 [LLM] Section 매칭 — "이 상품이 뭔지 이해" (전용 프롬프트)
Step 3 [코드] Section Note 검증 (동일)
Step 4 [LLM] Chapter 매칭 — "Section 안에서 Chapter 선택" (전용 프롬프트)
Step 5 [코드] Chapter Note 검증 (동일)
Step 6 [LLM] Heading 매칭 — "Chapter 안에서 4자리 선택" (전용 프롬프트)
Step 7 [LLM] 대립 판단 — GRI 3(a)→3(b)→3(c) 순서 (전용 프롬프트, needs_conflict일 때만)
Step 8 [LLM] Subheading 매칭 — "Heading 안에서 6자리 선택" (전용 프롬프트)
Step 9~11 [코드] Country Router + Price Break + Final (동일)
```

---

## 1단계: 프롬프트 설계 문서 분석 및 보완

먼저 GRI_PROMPTS_DESIGN.md를 읽고 분석해.

```
cat GRI_PROMPTS_DESIGN.md
```

그리고 다음을 분석해:
1. 각 Step 프롬프트가 관세사의 실제 사고 과정을 충분히 재현하는지
2. 빠진 엣지 케이스나 함정(trap)이 있는지
3. JSON 출력 포맷이 코드에서 파싱하기 쉬운 구조인지
4. 토큰 추정이 현실적인지

분석 후 필요하면 프롬프트를 보완해. **프롬프트는 길고 디테일할수록 좋다** — 은태님 원칙.

특히 이런 점을 보완해야 함:
- Step 2에서 "상업용 이름 → HS 용어 번역" 예시가 10개 → 더 많이 필요 (50개+)
- 각 Step에서 "자주 틀리는 함정" 목록이 더 필요 (CBP CROSS 22만건 판례 기반)
- Step 6에서 heading 설명을 프롬프트에 동적으로 넣는 방법 확인
- Step 7에서 conflict-patterns-data.ts (1.43MB) 활용 방법

---

## 2단계: 코드 구현

### 2-1. LLM 호출 유틸리티 생성
`app/lib/cost-engine/gri-classifier/utils/llm-call.ts` 신규 생성:
- OpenAI GPT-4o-mini 호출 (가장 저렴하면서 충분한 성능)
- JSON 파싱 + 에러 핸들링 + 재시도 (최대 2회)
- 토큰 사용량 추적 (비용 계산용)
- 타임아웃 10초
- 환경변수: OPENAI_API_KEY (이미 있을 수 있음, 없으면 .env.local에 추가 필요)

### 2-2. Step 0.5 구현 — DB 캐시 검색
`app/lib/cost-engine/gri-classifier/steps/step00-db-cache.ts` 신규 생성:
- product_hs_mappings 테이블에서 product_name ILIKE 검색
- 정확 매칭 시 즉시 GriClassificationResult 반환
- pg_trgm similarity 검색도 추가 (유사도 0.8+ 이면 반환)
- 캐시 히트율 추적 로그

### 2-3. Step 2 수정 — 키워드 → LLM 의미 매칭
`app/lib/cost-engine/gri-classifier/steps/step02-section-match.ts` 수정:
- 기존 `matchSections()` 함수를 `matchSectionsKeyword()` 로 이름 변경 (폴백용 보존)
- 새로운 `matchSectionsLLM()` 함수 추가 — GRI_PROMPTS_DESIGN.md의 Step 2 프롬프트 사용
- 메인 `matchSections()` 함수: LLM 먼저 시도, 실패 시 키워드 폴백
- 프롬프트에 21개 Section 정보를 하드코딩 (이미 section-notes.ts에 있음)

### 2-4. Step 4 수정 — 키워드 → LLM 의미 매칭
`app/lib/cost-engine/gri-classifier/steps/step04-chapter-match.ts` 수정:
- 기존 함수 보존 (폴백)
- 새로운 `matchChaptersLLM()` — 해당 Section의 Chapter들 + Chapter descriptions + Section Note를 프롬프트에 포함
- chapter-descriptions.ts의 데이터를 동적으로 프롬프트에 주입

### 2-5. Step 6 수정 — 키워드 → LLM 의미 매칭
`app/lib/cost-engine/gri-classifier/steps/step06-heading-match.ts` 수정:
- 기존 함수 보존
- 새로운 `matchHeadingsLLM()` — 해당 Chapter의 모든 heading 설명을 프롬프트에 포함
- heading-descriptions.ts에서 해당 chapter의 heading만 추출하여 프롬프트에 주입
- Chapter Notes도 포함

### 2-6. Step 7 수정 — 대립 판단 AI 강화
`app/lib/cost-engine/gri-classifier/steps/step07-conflict-resolve.ts` 수정:
- 기존 conflict-patterns-data.ts 매칭을 먼저 시도
- 패턴 매칭 실패 시 LLM 호출 (기존에도 있지만 프롬프트를 GRI_PROMPTS_DESIGN.md 것으로 교체)
- GRI 3(a)→3(b)→3(c) 순서를 강제하는 디테일 프롬프트

### 2-7. Step 8 수정 — Subheading LLM 매칭
`app/lib/cost-engine/gri-classifier/steps/step08-subheading-match.ts` 수정:
- 기존 함수 보존
- 새로운 `matchSubheadingLLM()` — 해당 heading의 모든 subheading 설명 + Subheading Notes
- subheading-descriptions.ts에서 해당 heading 것만 추출

### 2-8. pipeline.ts 수정
- Step 0.5 (DB 캐시) 호출 추가
- 각 Step에서 LLM 버전 호출하도록 변경
- aiCallCount 정확히 추적
- 전체 비용(토큰) 추적

---

## 3단계: 벤치마크 실행

### 3-1. 벤치마크 스크립트 업데이트
`scripts/gri_benchmark.ts` 수정:
- v2 파이프라인 사용
- Step별 정확도 추적:
  - Step 2 정확도: Section이 맞았는가? (2자리 비교)
  - Step 4 정확도: Chapter가 맞았는가? (2자리 비교)
  - Step 6 정확도: Heading이 맞았는가? (4자리 비교)
  - Step 8 정확도: Subheading이 맞았는가? (6자리 비교)
- 오분류 원인 분류:
  - SECTION_MISS: Step 2에서 잘못된 Section 선택
  - CHAPTER_MISS: Section 맞았지만 Chapter 틀림
  - HEADING_MISS: Chapter 맞았지만 Heading 틀림
  - SUBHEADING_MISS: Heading 맞았지만 Subheading 틀림
  - DB_CACHE_HIT: DB에서 바로 반환 (정답/오답 구분)
- LLM 호출 횟수, 토큰 사용량, 비용 추적
- 결과 저장: /Volumes/soulmaten/POTAL/benchmark_results/gri_benchmark_v2_*.json

### 3-2. 벤치마크 실행
```
npx tsx scripts/gri_benchmark.ts
```

### 3-3. 결과 분석
벤치마크 결과가 나오면:
- v1.2 vs v2 비교표 생성
- Step별 병목 분석 (어느 Step에서 가장 많이 틀리는지)
- 오분류 상위 10건 상세 분석 (왜 틀렸는지, 프롬프트 어디가 부족한지)
- 비용 분석 (건당 평균 비용, DB 캐시 히트율)

---

## 4단계: 프롬프트 반복 개선

벤치마크 결과 기반으로:
1. 가장 많이 틀리는 Section/Chapter/Heading 패턴 파악
2. 해당 패턴에 맞는 예시/규칙을 프롬프트에 추가
3. 재벤치마크
4. 80%+ 달성할 때까지 반복

---

## 절대 규칙
1. **기존 코드 삭제 금지** — 키워드 매칭 함수는 이름만 바꿔서 폴백용으로 보존
2. **npm run build 확인 후 커밋** — 빌드 깨지면 안 됨
3. **한 번에 하나씩** — Step 2 먼저 구현 → 테스트 → Step 4 → ... 순서
4. **프롬프트는 길고 디테일하게** — 짧은 프롬프트 = 불안정한 결과
5. **비용보다 정확도** — GPT-4o-mini로 시작하되, 정확도 부족하면 GPT-4o로 올릴 수 있음
6. **벤치마크 데이터**: /Volumes/soulmaten/POTAL/benchmark_test_data.json (100건, CBP CROSS rulings)

---

## 환경변수 확인
```
# .env.local에 이게 있는지 확인:
OPENAI_API_KEY=sk-...
# 없으면 은태님에게 물어볼 것
```

## 실행 순서 요약
```
1. GRI_PROMPTS_DESIGN.md 읽기 + 분석 + 보완
2. llm-call.ts 생성 (LLM 호출 유틸리티)
3. step00-db-cache.ts 생성 (DB 캐시 검색)
4. step02-section-match.ts 수정 (키워드→LLM)
5. step04-chapter-match.ts 수정 (키워드→LLM)
6. step06-heading-match.ts 수정 (키워드→LLM)
7. step07-conflict-resolve.ts 수정 (프롬프트 교체)
8. step08-subheading-match.ts 수정 (키워드→LLM)
9. pipeline.ts 수정 (Step 0.5 추가 + LLM 호출 연결)
10. gri_benchmark.ts 수정 (Step별 정확도 추적)
11. npm run build 확인
12. 벤치마크 실행 (npx tsx scripts/gri_benchmark.ts)
13. 결과 분석 + 프롬프트 개선
14. 80%+ 달성하면 git commit + push
```
