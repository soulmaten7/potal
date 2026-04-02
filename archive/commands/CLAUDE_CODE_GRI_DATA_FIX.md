# GRI 엔진 데이터 보강 + Step 6/8 수정 + 재벤치마크
# 2026-03-18 00:30 KST
#
# 목적: 벤치마크 0% → 정확도 대폭 향상
# 원인: heading(4자리) 1,228개 + subheading(6자리) 5,371개 설명 데이터가 없었음
# 해결: 부품 파일 3개 생성 + Step 코드 수정 + 재벤치마크
#
# 사용법: 이 전체 내용을 Claude Code 터미널에 붙여넣기

```
아래 5단계를 순서대로 전부 실행해. 각 단계가 끝나면 바로 다음 단계로 넘어가. 중간에 멈추지 마.

절대 규칙:
- console.log 금지
- 기존 코드 삭제 금지 (수정만)
- npm run build 에러 0개 유지
- 병렬 실행 금지 — 순차만
- 각 단계 완료 시 "=== Fix Stage N 완료 ===" 출력

================================================================
█ Fix Stage 1: WCO HS 2022 데이터 수집 (heading + subheading 설명)
================================================================

== 목표 ==
WCO HS 2022 기준 공식 heading(4자리) 1,228개 + subheading(6자리) 5,371개의
영문 설명(description)을 수집한다.

== 데이터 소스 (무료 공개 데이터, 우선순위 순) ==

1순위: GitHub — warrantgroup/WCO-HS-Codes 또는 datasets/harmonized-system
   - URL: https://github.com/datasets/harmonized-system
   - 형식: CSV (hs_code, description)
   - 5,300+ 6자리 코드 + 설명 포함

2순위: UN Comtrade HS Classification
   - URL: https://comtrade.un.org/data/cache/classificationHS.json
   - 형식: JSON
   - WCO 공식 분류 체계 기반

3순위: 우리 DB의 gov_tariff_schedules에서 추출
   - US 데이터 28,718행에서 4자리/6자리 코드별 첫 번째 설명 추출
   - 국가별 suffix를 제거하면 WCO 기본 설명과 거의 동일
   - curl로 DB 조회:
     curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
       -H "Authorization: Bearer sbp_a1b63803f34e5db4742340bc78b938b5f0e3cab8" \
       -H "Content-Type: application/json" \
       -d '{"query": "SELECT DISTINCT LEFT(REPLACE(hs_code, '\''.'\'', '\''\\''), 4) as h4, MIN(description) as desc FROM gov_tariff_schedules WHERE country='\''US'\'' GROUP BY h4 ORDER BY h4 LIMIT 20;"}'

4순위: 직접 작성 (WCO 공식 문서 참고)
   - 최후 수단 — 위 소스들에서 못 구하면

== 작업 순서 ==

Step 1: 데이터 소스 접근 시도 (1순위부터 순서대로)
- GitHub CSV 다운로드 시도
- 실패하면 UN Comtrade JSON 시도
- 실패하면 우리 DB에서 추출
- 어떤 방법이든 1,228개 heading + 5,371개 subheading 확보가 목표

Step 2: 데이터 정제
- HS Code 포맷 통일: 점(.) 제거, 순수 숫자만
- heading: 정확히 4자리 (0101 ~ 9706)
- subheading: 정확히 6자리 (010110 ~ 970600)
- 설명: 영문, 앞뒤 공백 제거, 첫 글자 대문자
- 중복 제거
- 전체 개수 확인: heading ~1,228개, subheading ~5,371개

Step 3: 검증
- Chapter 01 ~ 97 모든 챕터에 heading이 최소 1개 이상 있는지
- heading 코드가 정확히 4자리인지
- subheading 코드가 정확히 6자리인지
- 설명이 빈 문자열인 항목이 없는지
- 누락된 챕터가 있으면 경고 출력

== 완료 조건 ==
- 정제된 heading 데이터: { "0101": "Live horses, asses, mules and hinnies", ... }
- 정제된 subheading 데이터: { "010110": "Pure-bred breeding animals", ... }
- 전체 개수 출력: heading XX개, subheading XX개

"=== Fix Stage 1 완료 ===" 출력 후 바로 2단계로.

================================================================
█ Fix Stage 2: 부품 파일 3개 생성
================================================================

== 목표 ==
Step별로 필요한 데이터를 각각의 독립 파일로 저장한다.
각 파일은 "부품" — 어디서든 import해서 쓸 수 있는 순수 데이터 파일.

== 생성할 파일 3개 ==

파일 1: app/lib/cost-engine/gri-classifier/data/chapter-descriptions.ts

이 파일은 Step 4 (chapter-match)에서 사용.
기존에 step04-chapter-match.ts 안에 하드코딩되어 있던 97개 Chapter 설명을
별도 부품 파일로 분리한다.

형식:
```typescript
/**
 * WCO HS 2022 — 97 Chapter Descriptions
 * 부품 파일: Chapter 매칭(Step 4)에서 사용
 *
 * 업데이트 주기: WCO HS 개정 시 (5~6년, 다음: HS 2027)
 * 데이터 소스: WCO Harmonized System 2022 Edition
 * 마지막 업데이트: 2026-03-18
 */

export const CHAPTER_DESCRIPTIONS: Record<number, string> = {
  1: 'Live animals',
  2: 'Meat and edible meat offal',
  3: 'Fish and crustaceans, molluscs and other aquatic invertebrates',
  // ... 97개 전부
  97: 'Works of art, collectors\' pieces and antiques',
};

// 챕터 번호 → 섹션 번호 매핑 (역참조용)
export const CHAPTER_TO_SECTION: Record<number, number> = {
  1: 1, 2: 1, 3: 1, 4: 1, 5: 1,           // Section I
  6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2, 13: 2, 14: 2,  // Section II
  15: 3,                                      // Section III
  // ... 전부
  97: 21,                                     // Section XXI
};
```

파일 2: app/lib/cost-engine/gri-classifier/data/heading-descriptions.ts

이 파일은 Step 6 (heading-match)에서 사용.
1,228개 WCO 공식 heading 설명.

형식:
```typescript
/**
 * WCO HS 2022 — 1,228 Heading Descriptions (4-digit)
 * 부품 파일: Heading 매칭(Step 6)에서 사용
 *
 * 업데이트 주기: WCO HS 개정 시 (5~6년, 다음: HS 2027)
 * 데이터 소스: WCO Harmonized System 2022 Edition
 * 마지막 업데이트: 2026-03-18
 * 총 항목 수: 1,228
 */

export const HEADING_DESCRIPTIONS: Record<string, string> = {
  "0101": "Live horses, asses, mules and hinnies",
  "0102": "Live bovine animals",
  "0103": "Live swine",
  "0104": "Live sheep and goats",
  "0105": "Live poultry, that is to say, fowls of the species Gallus domesticus, ducks, geese, turkeys and guinea fowls",
  "0106": "Other live animals",
  // ... 1,228개 전부
  "9705": "Collections and collectors' pieces of zoological, botanical, mineralogical, anatomical, historical, archaeological, palaeontological, ethnographic or numismatic interest",
  "9706": "Antiques of an age exceeding one hundred years",
};

// heading → chapter 매핑 (역참조용)
export const HEADING_TO_CHAPTER: Record<string, number> = {
  "0101": 1, "0102": 1, "0103": 1, "0104": 1, "0105": 1, "0106": 1,
  "0201": 2, "0202": 2, "0203": 2, "0204": 2, "0205": 2, "0206": 2, "0207": 2, "0208": 2, "0209": 2, "0210": 2,
  // ... 1,228개 전부
};

// 헬퍼 함수: chapter 번호로 해당 chapter의 모든 heading 가져오기
export function getHeadingsForChapter(chapter: number): { code: string; description: string }[] {
  const chapterStr = String(chapter).padStart(2, '0');
  return Object.entries(HEADING_DESCRIPTIONS)
    .filter(([code]) => code.startsWith(chapterStr))
    .map(([code, description]) => ({ code, description }));
}
```

파일 3: app/lib/cost-engine/gri-classifier/data/subheading-descriptions.ts

이 파일은 Step 8 (subheading-match)에서 사용.
5,371개 WCO 공식 subheading 설명.

형식:
```typescript
/**
 * WCO HS 2022 — 5,371 Subheading Descriptions (6-digit)
 * 부품 파일: Subheading 매칭(Step 8)에서 사용
 *
 * 업데이트 주기: WCO HS 개정 시 (5~6년, 다음: HS 2027)
 * 데이터 소스: WCO Harmonized System 2022 Edition
 * 마지막 업데이트: 2026-03-18
 * 총 항목 수: 5,371
 */

export const SUBHEADING_DESCRIPTIONS: Record<string, string> = {
  "010110": "Pure-bred breeding animals",
  "010190": "Other",
  "010221": "Pure-bred breeding animals",
  "010229": "Other",
  "010231": "Pure-bred breeding animals",
  "010239": "Other",
  // ... 5,371개 전부
  "970500": "Collections and collectors' pieces of zoological, botanical, mineralogical, anatomical, historical, archaeological, palaeontological, ethnographic or numismatic interest",
  "970600": "Antiques of an age exceeding one hundred years",
};

// 헬퍼: heading(4자리)으로 해당 heading의 모든 subheading 가져오기
export function getSubheadingsForHeading(heading: string): { code: string; description: string }[] {
  return Object.entries(SUBHEADING_DESCRIPTIONS)
    .filter(([code]) => code.startsWith(heading))
    .map(([code, description]) => ({ code, description }));
}

// 헬퍼: chapter(2자리)로 해당 chapter의 모든 subheading 가져오기
export function getSubheadingsForChapter(chapter: number): { code: string; description: string }[] {
  const chapterStr = String(chapter).padStart(2, '0');
  return Object.entries(SUBHEADING_DESCRIPTIONS)
    .filter(([code]) => code.startsWith(chapterStr))
    .map(([code, description]) => ({ code, description }));
}
```

== 부품 파일 원칙 ==
1. 각 파일 상단에 주석: 데이터 소스, 업데이트 주기, 총 항목 수, 마지막 업데이트 날짜
2. export하는 객체는 Record<string, string> 타입 — 단순하고 명확
3. 역참조 매핑도 포함 (heading→chapter, chapter→section)
4. 헬퍼 함수 포함 (getHeadingsForChapter, getSubheadingsForHeading)
5. 파일 하나를 수정하면 그걸 import하는 모든 곳에 자동 반영

== 검증 ==
- 파일 3개 생성 후 TypeScript 에러 없는지 확인
- 각 파일의 항목 수가 맞는지: 97 / ~1,228 / ~5,371
- import 테스트: 다른 파일에서 import해서 타입 에러 없는지

"=== Fix Stage 2 완료 ===" 출력 후 바로 3단계로.

================================================================
█ Fix Stage 3: Step 코드 수정 (DB 호출 → 부품 파일 import)
================================================================

== 목표 ==
Step 4, 6, 8이 DB 대신 부품 파일을 사용하도록 수정한다.
기존 DB 호출 코드는 삭제하지 말고 주석 처리한다 (롤백 가능하도록).

== 수정할 파일 4개 ==

수정 1: app/lib/cost-engine/gri-classifier/steps/step04-chapter-match.ts

변경 전: 파일 안에 CHAPTER_DESCRIPTIONS가 하드코딩되어 있음
변경 후: 부품 파일에서 import

```typescript
// 변경 전:
const CHAPTER_DESCRIPTIONS: Record<number, string> = {
  1: 'Live animals',
  // ... 97개 하드코딩
};

// 변경 후:
import { CHAPTER_DESCRIPTIONS } from '../data/chapter-descriptions';
// 기존 하드코딩 삭제 (부품 파일로 이동했으므로)
```

수정 2: app/lib/cost-engine/gri-classifier/steps/step06-heading-match.ts

변경 전: DB(gov_tariff_schedules)에서 heading 설명을 가져옴
변경 후: 부품 파일에서 import, DB 호출 제거

```typescript
// 변경 전:
import { createClient } from '@supabase/supabase-js';
// ... supabase 쿼리로 heading 로드

async function loadHeadings(chapters: number[]): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('gov_tariff_schedules')
    .select('hs_code, description')
    .in('country', ['US', 'WCO'])
    .order('hs_code');
  // ...
}

// 변경 후:
import { HEADING_DESCRIPTIONS, getHeadingsForChapter } from '../data/heading-descriptions';

function loadHeadings(chapters: number[]): Map<string, string> {
  // DB 호출 없음 — 부품 파일에서 직접 로드
  const headings = new Map<string, string>();
  for (const chapter of chapters) {
    const chapterHeadings = getHeadingsForChapter(chapter);
    for (const { code, description } of chapterHeadings) {
      headings.set(code, description);
    }
  }
  return headings;
}
```

핵심 변경점:
- async 함수 → 동기 함수 (DB 호출 없으므로 await 불필요)
- supabase import 제거
- headingCache 변수 불필요 (이미 모듈 레벨에서 로드됨)
- 에러 처리: DB 에러 대신 "해당 chapter에 heading 없음" 처리

수정 3: app/lib/cost-engine/gri-classifier/steps/step08-subheading-match.ts

변경 전: DB에서 subheading 설명을 가져옴
변경 후: 부품 파일에서 import

```typescript
// 변경 전:
const { data, error } = await supabase
  .from('gov_tariff_schedules')
  .select('hs_code, description')
  .like('hs_code', `${heading4}%`)
  .in('country', ['US', 'WCO'])
  .order('hs_code');

// 변경 후:
import { getSubheadingsForHeading } from '../data/subheading-descriptions';

function loadSubheadings(heading: string): { code: string; description: string }[] {
  // DB 호출 없음 — 부품 파일에서 직접 로드
  return getSubheadingsForHeading(heading);
}
```

핵심 변경점:
- async → 동기 함수
- supabase import 제거
- 6자리 코드만 반환 (국가별 8~10자리 아님)
- WCO 공식 설명 사용 (국가별 변형 아님)

수정 4: app/lib/cost-engine/gri-classifier/pipeline.ts

변경 전: step06과 step08이 async 함수
변경 후: step06과 step08이 동기 함수로 변경되었으면 await 제거

```typescript
// 변경 전:
const step6 = await matchHeadings(step5.validChapters, step1, input);
const step8 = await matchSubheading(resolvedHeading, step1, input.price);

// 변경 후 (step06/08이 동기 함수로 바뀌었으면):
const step6 = matchHeadings(step5.validChapters, step1, input);
const step8 = matchSubheading(resolvedHeading, step1, input.price);

// 만약 step06/08에 여전히 비동기 부분(conflict pattern 등)이 있으면 await 유지
```

== 수정 원칙 ==
1. DB 호출 코드는 주석 처리 (삭제 X) — 나중에 비교/롤백 가능
2. import 경로는 상대경로: '../data/heading-descriptions'
3. 함수 시그니처가 바뀌면(async→sync) 호출하는 곳도 같이 수정
4. 타입 호환성 유지: 반환 타입은 기존과 동일하게

== 검증 ==
- npm run build 에러 0개 ✅
- TypeScript 타입 에러 0개 ✅
- 기존 테스트 깨지지 않는지 확인

"=== Fix Stage 3 완료 ===" 출력 후 바로 4단계로.

================================================================
█ Fix Stage 4: 키워드 매칭 알고리즘 개선
================================================================

== 목표 ==
부품 파일에 데이터가 있어도, 키워드 매칭이 정확하지 않으면 의미 없음.
Step 6/8의 키워드 매칭 정확도를 올린다.

== 현재 매칭 방식 (개선 전) ==
```typescript
// 단순 includes 체크
for (const keyword of keywords) {
  if (description.toLowerCase().includes(keyword)) {
    score += 1;
  }
}
```
문제: "t-shirt"이 "T-shirts, singlets, tank tops" 설명에 매칭 안 될 수 있음
(하이픈, 복수형, 대소문자 등)

== 개선된 매칭 방식 ==

1. 정규화(normalize) 함수 추가:
```typescript
function normalize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')  // 특수문자 → 공백
    .split(/\s+/)                    // 공백으로 분리
    .filter(w => w.length > 1);      // 1글자 제거
}
```

2. 복수형/단수형 처리:
```typescript
function stemBasic(word: string): string {
  // 간단한 영어 stemming (라이브러리 없이)
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y';  // candies → candy
  if (word.endsWith('es')) return word.slice(0, -2);          // watches → watch
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);  // shirts → shirt
  if (word.endsWith('ing')) return word.slice(0, -3);         // running → run
  if (word.endsWith('ed')) return word.slice(0, -2);          // knitted → knitt
  return word;
}
```

3. 동의어 사전 (분류에 중요한 핵심 동의어만):
```typescript
const SYNONYMS: Record<string, string[]> = {
  'tshirt': ['t-shirt', 'tee', 'tee shirt'],
  'shoe': ['footwear', 'sneaker', 'boot', 'sandal'],
  'phone': ['telephone', 'cellphone', 'mobile', 'smartphone'],
  'laptop': ['notebook', 'portable computer'],
  'bag': ['handbag', 'purse', 'satchel', 'tote'],
  'watch': ['wristwatch', 'timepiece'],
  'tv': ['television', 'monitor', 'display'],
  'car': ['automobile', 'vehicle', 'motor car'],
  // ... 분류에 자주 혼동되는 핵심 동의어 30~50개
};
```

4. 점수 계산 개선:
```typescript
function scoreMatch(keywords: string[], description: string): number {
  const descWords = normalize(description);
  const descStems = descWords.map(stemBasic);
  let score = 0;

  for (const kw of keywords) {
    const kwStem = stemBasic(kw.toLowerCase());

    // 정확 매칭 (가중치 3)
    if (descWords.includes(kw.toLowerCase())) score += 3;
    // stem 매칭 (가중치 2) — "shirts" vs "shirt"
    else if (descStems.includes(kwStem)) score += 2;
    // 부분 매칭 (가중치 1) — "cotton" in "of cotton"
    else if (descWords.some(dw => dw.includes(kwStem) || kwStem.includes(dw))) score += 1;
  }

  return score;
}
```

5. "Other" 패널티:
```typescript
// heading/subheading 설명이 "Other"로 시작하면 점수 -5
// "Other"는 다른 곳에 분류 안 되는 잔여 항목 → 최후 수단
if (description.toLowerCase().startsWith('other')) {
  score -= 5;
}
```

== 적용 파일 ==
- step06-heading-match.ts: heading 매칭에 개선된 scoreMatch 사용
- step08-subheading-match.ts: subheading 매칭에 동일 scoreMatch 사용
- 공통 함수는 별도 유틸 파일로 분리:
  app/lib/cost-engine/gri-classifier/utils/text-matching.ts

== text-matching.ts 파일 구조 ==
```typescript
/**
 * GRI 분류 엔진 — 텍스트 매칭 유틸리티
 * 부품 파일: Step 6/8/11에서 공통 사용
 */

export function normalize(text: string): string[] { ... }
export function stemBasic(word: string): string { ... }
export function scoreMatch(keywords: string[], description: string): number { ... }
export function expandSynonyms(keywords: string[]): string[] { ... }
```

== 검증 ==
- npm run build 에러 0개
- 테스트: "cotton t-shirt" → heading 6109 매칭되는지 수동 확인
- 테스트: "bluetooth speaker" → heading 8518 매칭되는지 수동 확인
- 테스트: "leather handbag" → heading 4202 매칭되는지 수동 확인

"=== Fix Stage 4 완료 ===" 출력 후 바로 5단계로.

================================================================
█ Fix Stage 5: 재벤치마크 (CBP 100건)
================================================================

== 목표 ==
부품 파일 + 개선된 매칭으로 정확도가 얼마나 올랐는지 확인.
이전 결과(0%)와 비교.

== 실행 방법 ==

DB 상태 확인 먼저:
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_a1b63803f34e5db4742340bc78b938b5f0e3cab8" \
  -H "Content-Type: application/json" \
  -d '{"query": "INSERT INTO health_check_logs (check_type, status, details) VALUES ('\''gri_fix_test'\'', '\''ok'\'', '\''{}'\''::jsonb) RETURNING id;"}'

DB read-write면:
1. 벤치마크 데이터: /Volumes/soulmaten/POTAL/benchmark_test_data.json (100건)
2. CLASSIFICATION_ENGINE=gri 환경변수 설정
3. 100건 각각에 대해 classifyWithGRI() 호출
4. 벤치마크 중 DB 캐시 저장 하지 마 (공정성)

DB read-only면:
1. 벤치마크 데이터 로드
2. classifyWithGRI()를 DB 없이 실행 가능한지 확인
   - 부품 파일 3개 (chapter/heading/subheading) = DB 불필요
   - conflict patterns = 로컬 JSON 파일
   - Country Agent (Step 9~11) = DB 필요 → 이 부분만 skip하고 6자리까지만 테스트
3. 6자리 정확도만 측정 (DB 의존성 없음)

== 수집 지표 (이전과 동일) ==

1. 정확도:
   - 6-digit exact match rate (%)
   - 4-digit heading match rate (%)
   - 2-digit chapter match rate (%)

2. 성능:
   - 평균 처리 시간 (ms)
   - 중앙값

3. AI 호출:
   - AI 0회 건수, 1회 건수, 2회 건수
   - 평균 AI 호출 횟수

4. Step별 통계:
   - Step 2(Section) 정확 건수
   - Step 4(Chapter) 정확 건수
   - Step 6(Heading) 정확 건수
   - Step 8(Subheading) 정확 건수

5. 오분류 분석 (틀린 문제별):
   - 어느 Step에서 잘못됐는지
   - 예상 HS6 vs 실제 HS6
   - 원인 분류:
     a) SECTION_MISMATCH — Section 단계에서 잘못된 Section 선택
     b) CHAPTER_MISMATCH — Chapter 단계에서 잘못된 Chapter 선택
     c) HEADING_MISMATCH — Heading 단계에서 잘못된 Heading 선택
     d) SUBHEADING_MISMATCH — Subheading 단계에서 잘못된 Subheading 선택
     e) KEYWORD_INSUFFICIENT — 상품명에서 충분한 키워드 추출 실패
     f) NOTE_MISSING — Section/Chapter Note 규칙이 누락됨
     g) PATTERN_MISSING — 대립 패턴이 없어서 AI 호출했으나 실패
     h) OTHER — 기타

== 결과 저장 ==

- /Volumes/soulmaten/POTAL/benchmark_results/gri_benchmark_v1.1_results.json (100건 전체)
- /Volumes/soulmaten/POTAL/benchmark_results/gri_benchmark_v1.1_summary.md
- /Volumes/soulmaten/POTAL/benchmark_results/gri_benchmark_v1.1_errors.json (틀린 문제)

== 요약 리포트 ==
```
GRI Agent Team Benchmark v1.1 (Data Fix) — [날짜]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6-digit Exact: XX/100 (XX%)
4-digit Heading: XX/100 (XX%)
2-digit Chapter: XX/100 (XX%)

AI Calls: 평균 X.XX회/건
처리시간: 평균 XXXms

vs 이전 POTAL GRI v1.0: 0% / 0% / 24%
→ GRI v1.1 (data fix): XX% / XX% / XX% ★

개선폭: +XX% (6-digit)

vs 경쟁사:
- Tarifflo: 89%
- Avalara: 80%
- Zonos: 44%

오분류 원인 TOP 3:
1. [원인] — XX건
2. [원인] — XX건
3. [원인] — XX건

Step별 정확도:
- Section 매칭: XX/100 (XX%)
- Chapter 매칭: XX/100 (XX%)
- Heading 매칭: XX/100 (XX%)
- Subheading 매칭: XX/100 (XX%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

== 완료 후 ==

"=== Fix Stage 5 완료 ===" 출력.

================================================================
█ 최종 요약
================================================================

5단계 전부 끝나면 최종 요약 출력:

```
================================================================
GRI 데이터 보강 최종 요약 — [날짜 시간]
================================================================

Fix Stage 1: WCO 데이터 수집
- heading: XXX개 수집 (목표 1,228)
- subheading: X,XXX개 수집 (목표 5,371)
- 데이터 소스: [사용한 소스]

Fix Stage 2: 부품 파일 생성
- chapter-descriptions.ts: 97개 ✅
- heading-descriptions.ts: X,XXX개 ✅
- subheading-descriptions.ts: X,XXX개 ✅

Fix Stage 3: Step 코드 수정
- step04: 부품 파일 import ✅
- step06: DB → 부품 파일 전환 ✅
- step08: DB → 부품 파일 전환 ✅
- pipeline.ts 수정 ✅
- npm run build: ✅

Fix Stage 4: 매칭 알고리즘 개선
- text-matching.ts 생성 ✅
- normalize + stemBasic + scoreMatch + synonyms ✅

Fix Stage 5: 재벤치마크
- v1.0 (before): 0% / 0% / 24%
- v1.1 (after):  XX% / XX% / XX%
- 개선폭: +XX%

다음 작업:
- [ ] git commit + push
- [ ] 정확도 목표 89% 미달 시 추가 개선 방향 분석
- [ ] CLASSIFICATION_ENGINE=gri Vercel 환경변수 설정
================================================================
```
```
