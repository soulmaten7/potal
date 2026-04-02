# Claude Code 명령어: 벡터 검색 벤치마크 (가장 단순한 접근)

## 개요
89,842개 HS Code 설명을 임베딩하고, 상품명과 코사인 유사도로 매칭.
LLM "사고" 없이 순수 검색만으로 정확도 측정.
실패한 건들은 카테고리+상품명으로 정리하여 오류 패턴 분석.

## 실행

### Step 1: HS Code 설명 임베딩 준비

`app/lib/cost-engine/gri-classifier/data/subheading-descriptions.ts`에 5,371개 6자리 HS Code 설명이 있음.
이걸 OpenAI text-embedding-3-small로 임베딩.

```typescript
// scripts/vector_search_benchmark.ts

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// HS Code 데이터 로드 — subheading-descriptions.ts에서 모든 subheading 가져오기
// 파일을 직접 import하기 어려우면 heading-descriptions.ts + subheading-descriptions.ts를 파싱

// 1. 모든 HS6 코드+설명 수집
// 2. 임베딩 생성 (배치)
// 3. 벤치마크 100건 각각 임베딩
// 4. 코사인 유사도로 상위 5개 매칭
// 5. 정확도 측정
// 6. 실패 건 카테고리 분석
```

### Step 2: 구현 상세

스크립트 하나로 전체 실행:

```
1. subheading-descriptions.ts에서 5,371개 {code, description} 추출
2. 배치 임베딩 (OpenAI embedding API, 한번에 최대 2048개씩)
   - text-embedding-3-small: $0.02/1M tokens
   - 5,371개 설명 ≈ ~50K tokens = ~$0.001
3. 벤치마크 100건 로드 (/Volumes/soulmaten/POTAL/benchmark_test_data.json)
4. 각 상품명 임베딩 → 5,371개와 코사인 유사도 계산 → 상위 5개
5. 상위 1개 = 예측값, 정답과 비교
6. 6-digit / 4-digit / 2-digit 정확도 집계
7. 실패한 건들 분석:
   - 상품명
   - 정답 HS Code + 설명
   - 예측 HS Code + 설명 (상위 3개)
   - 상품 카테고리 (HS Chapter 기준으로 자동 분류)
   - 왜 틀렸는지 패턴 (카테고리 오류 / 세부분류 오류)
```

### Step 3: 실패 분석 포맷

```
═══════════════════════════════════════
벡터 검색 벤치마크 결과
═══════════════════════════════════════
정확도:
  6-digit: ??% | 4-digit: ??% | Chapter: ??%
  AI calls: 0 | Cost: ~$0.001 (임베딩만)

vs 이전 버전:
              6-digit  4-digit  Chapter  Cost
v3.0 Broker:   24%      42%      59%     ~$0.004
Vector Search: ??%      ??%      ??%     ~$0.0001

═══════════════════════════════════════
실패 건 카테고리 분석
═══════════════════════════════════════

## Chapter별 오류율:
| Chapter | 설명 | 총 건수 | 정답 | 오답 | 오류율 |
|---------|------|--------|------|------|--------|
| Ch.84   | 기계류 | 12 | 3 | 9 | 75% |
| Ch.85   | 전기기기 | 8 | 2 | 6 | 75% |
| Ch.39   | 플라스틱 | 5 | 1 | 4 | 80% |
| ...     |      |        |      |      |        |

## 오류 패턴 분류:
1. CATEGORY_ERROR (카테고리 자체가 틀림):
   - 상품명: "Used Restaurant Grease"
   - 정답: Ch.15 (유지류) → 1522.00
   - 예측: Ch.38 (화학제품) → 3825.10
   - 원인: "grease"를 화학제품으로 매칭

2. SUBHEADING_ERROR (Chapter는 맞고 세부분류 틀림):
   - 상품명: "Men's Cotton Polo Shirt"
   - 정답: 6105.10 (면 셔츠, 편직)
   - 예측: 6109.10 (면 티셔츠, 편직)
   - 원인: polo shirt vs t-shirt 구분 실패

3. COMPOSITE_ERROR (복합상품 분류 실패):
   - 상품명: "Bluetooth Earbuds with Charging Case"
   - 정답: 8518.30 (이어폰)
   - 예측: 8507.60 (리튬이온 배터리)
   - 원인: "charging case"에 이끌림

## 카테고리별 실패 상품 목록:

### 산업용 기계/부품 (Industrial):
| # | 상품명 | 정답 | 예측 | 오류 유형 |
|---|--------|------|------|----------|
| 1 | ... | ... | ... | ... |

### 식품/농산물 (Food/Agriculture):
| # | 상품명 | 정답 | 예측 | 오류 유형 |
|---|--------|------|------|----------|

### 화학/원료 (Chemical/Raw Materials):
| # | 상품명 | 정답 | 예측 | 오류 유형 |
|---|--------|------|------|----------|

### 섬유/의류 (Textiles/Apparel):
| # | 상품명 | 정답 | 예측 | 오류 유형 |
|---|--------|------|------|----------|

### 전자/전기 (Electronics/Electrical):
| # | 상품명 | 정답 | 예측 | 오류 유형 |
|---|--------|------|------|----------|

### 기타:
| # | 상품명 | 정답 | 예측 | 오류 유형 |
|---|--------|------|------|----------|
```

### Step 4: 추가 실험 — 상위 5개 중 정답 포함율

순수 검색에서 **상위 1개**가 아닌 **상위 5개** 안에 정답이 있는 비율도 측정.
이게 높으면 → "검색으로 후보 5개 추리고, LLM 1회로 최종 선택" 전략이 유효.

```
상위 N개 중 정답 포함율:
  Top-1: ??%
  Top-3: ??%
  Top-5: ??%
  Top-10: ??%

→ Top-5에 정답이 70%+ 있으면:
  "벡터 검색 + LLM 1회 최종 선택" = 최적 전략 확정
```

### Step 5: 결과 저장

- 결과 JSON: `/Volumes/soulmaten/POTAL/benchmark_results/vector_search_benchmark_results.json`
- 임베딩 캐시: `/Volumes/soulmaten/POTAL/hs_embeddings/hs6_embeddings.json` (재사용)
- 분석 리포트: 터미널 출력

## 실행 명령

이 전체를 하나의 TypeScript 스크립트로 작성하여 실행:

```bash
npx tsx scripts/vector_search_benchmark.ts
```

## 의존성
- openai (이미 설치됨)
- 환경변수: OPENAI_API_KEY (이미 있음)

## 예상 비용
- 임베딩 5,371개 + 100개 = ~$0.002
- LLM 호출: $0 (순수 검색만)
- 총: ~$0.002

## 예상 소요 시간
- 임베딩 생성: ~30초 (배치)
- 100건 매칭: ~10초 (코사인 유사도 계산만)
- 총: ~1분
