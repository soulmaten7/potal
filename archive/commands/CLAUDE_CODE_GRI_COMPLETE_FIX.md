# GRI 엔진 완전 수정 — 미연결 4개 Step 전부 고치기 + 재벤치마크
# 2026-03-18 01:30 KST
#
# 문제: Step 2, 3, 5, 7이 부품 파일/데이터를 제대로 안 쓰고 있음
# 해결: 4개 Step 전부 수정 + 재벤치마크
#
# 사용법: 이 전체 내용을 Claude Code 터미널에 붙여넣기

```
아래 6단계를 순서대로 전부 실행해. 각 단계가 끝나면 바로 다음 단계로 넘어가. 중간에 멈추지 마.

절대 규칙:
- console.log 금지
- 기존 코드 삭제 금지 (수정만, 기존 코드는 주석 처리)
- npm run build 에러 0개 유지
- 각 단계 완료 시 "=== Complete Fix Stage N 완료 ===" 출력

================================================================
█ Stage 1: Step 2 수정 — heading 설명에서 Section 키워드 자동 생성
================================================================

== 현재 문제 ==
step02-section-match.ts의 SECTION_KEYWORDS에 수동으로 ~700개 키워드만 있음.
"lanyards", "pennants", "flags" 같은 단어가 없어서 67/100건이 Section에서 틀림.

== 해결 ==
heading-descriptions.ts(1,229개)에서 각 heading 설명의 단어를 자동으로 추출하여
해당 heading이 속한 Section의 키워드에 추가한다.

== 수정 파일 ==
app/lib/cost-engine/gri-classifier/steps/step02-section-match.ts

== 수정 내용 ==

1. heading-descriptions.ts를 import:
```typescript
import { HEADING_DESCRIPTIONS } from '../data/heading-descriptions';
```

2. heading 설명에서 Section 키워드를 자동 생성하는 함수 추가:
```typescript
/**
 * heading-descriptions.ts의 1,229개 heading 설명에서
 * 각 heading이 속한 Section의 키워드를 자동 생성한다.
 * 이렇게 하면 수동 키워드 ~700개 → 자동 수천 개로 커버리지 증가.
 */
function buildSectionKeywordsFromHeadings(): Record<number, Set<string>> {
  // 각 Chapter가 어떤 Section에 속하는지 매핑
  const chapterToSection: Record<number, number> = {
    1: 1, 2: 1, 3: 1, 4: 1, 5: 1,
    6: 2, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2, 12: 2, 13: 2, 14: 2,
    15: 3,
    16: 4, 17: 4, 18: 4, 19: 4, 20: 4, 21: 4, 22: 4, 23: 4, 24: 4,
    25: 5, 26: 5, 27: 5,
    28: 6, 29: 6, 30: 6, 31: 6, 32: 6, 33: 6, 34: 6, 35: 6, 36: 6, 37: 6, 38: 6,
    39: 7, 40: 7,
    41: 8, 42: 8, 43: 8,
    44: 9, 45: 9, 46: 9,
    47: 10, 48: 10, 49: 10,
    50: 11, 51: 11, 52: 11, 53: 11, 54: 11, 55: 11, 56: 11, 57: 11, 58: 11, 59: 11, 60: 11, 61: 11, 62: 11, 63: 11,
    64: 12, 65: 12, 66: 12, 67: 12,
    68: 13, 69: 13, 70: 13,
    71: 14,
    72: 15, 73: 15, 74: 15, 75: 15, 76: 15, 78: 15, 79: 15, 80: 15, 81: 15, 82: 15, 83: 15,
    84: 16, 85: 16,
    86: 17, 87: 17, 88: 17, 89: 17,
    90: 18, 91: 18, 92: 18,
    93: 19,
    94: 20, 95: 20, 96: 20,
    97: 21,
  };

  // 불용어 (분류에 의미 없는 단어)
  const stopwords = new Set([
    'of', 'and', 'or', 'the', 'a', 'an', 'in', 'for', 'with', 'by',
    'to', 'from', 'not', 'on', 'at', 'as', 'its', 'their', 'other',
    'than', 'whether', 'including', 'excluding', 'also', 'but', 'such',
    'being', 'having', 'made', 'used', 'using', 'into', 'thereof',
    'thereto', 'parts', 'articles', 'goods', 'products', 'preparations',
    'similar', 'elsewhere', 'specified', 'kind', 'type', 'heading',
    'subheading', 'chapter', 'section', 'note', 'see',
  ]);

  const sectionKeywords: Record<number, Set<string>> = {};
  for (let s = 1; s <= 21; s++) {
    sectionKeywords[s] = new Set();
  }

  // 1,229개 heading 설명에서 단어 추출
  for (const [code, description] of Object.entries(HEADING_DESCRIPTIONS)) {
    const chapter = parseInt(code.substring(0, 2), 10);
    const section = chapterToSection[chapter];
    if (!section) continue;

    // 설명에서 의미 있는 단어만 추출
    const words = description
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')  // 특수문자 제거 (하이픈 유지)
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopwords.has(w));

    for (const word of words) {
      sectionKeywords[section].add(word);
    }

    // 하이픈 연결 복합어도 추가: "t-shirts" → "t-shirts", "tshirts"
    const hyphenWords = description.toLowerCase().match(/[a-z]+-[a-z]+/g);
    if (hyphenWords) {
      for (const hw of hyphenWords) {
        sectionKeywords[section].add(hw);
        sectionKeywords[section].add(hw.replace(/-/g, '')); // 하이픈 제거 버전
      }
    }
  }

  return sectionKeywords;
}
```

3. matchSections 함수에서 이 자동 생성 키워드를 기존 수동 키워드와 합쳐서 사용:

```typescript
// 모듈 로드 시 1회 생성 (캐싱)
const AUTO_SECTION_KEYWORDS = buildSectionKeywordsFromHeadings();

export function matchSections(keywordResult: KeywordResult): SectionCandidate[] {
  const { keywords, material, productType } = keywordResult;
  const scores: Map<number, number> = new Map();

  for (const [sectionStr, data] of Object.entries(SECTION_KEYWORDS)) {
    const section = parseInt(sectionStr, 10);
    let score = 0;

    // 1) 기존 수동 키워드 매칭 (가중치 1)
    const manualKwSet = new Set(data.keywords);
    for (const kw of keywords) {
      if (manualKwSet.has(kw)) {
        score += 1;
      }
    }

    // 2) heading 설명에서 자동 생성된 키워드 매칭 (가중치 1.5)
    //    heading 설명은 공식 분류 텍스트이므로 수동보다 가중치 높음
    const autoKwSet = AUTO_SECTION_KEYWORDS[section];
    if (autoKwSet) {
      for (const kw of keywords) {
        if (autoKwSet.has(kw) && !manualKwSet.has(kw)) {
          // 수동에서 이미 매칭된 건 중복 카운트 안 함
          score += 1.5;
        }
        // stem 매칭: "shirts" vs "shirt"
        for (const autoKw of autoKwSet) {
          if (kw !== autoKw && kw.length > 3 && autoKw.length > 3) {
            if (kw.startsWith(autoKw) || autoKw.startsWith(kw)) {
              score += 0.5;
              break;
            }
          }
        }
      }
    }

    // 3) 부분 매칭 (기존 로직 유지)
    for (const kw of keywords) {
      for (const skw of data.keywords) {
        if (kw !== skw && (kw.includes(skw) || skw.includes(kw)) && kw.length > 3) {
          score += 0.5;
          break;
        }
      }
    }

    if (score > 0) {
      scores.set(section, score);
    }
  }

  // material 보너스 (기존 로직 유지)
  if (material) {
    const bonusSections = MATERIAL_SECTION_BONUS[material];
    if (bonusSections) {
      for (const s of bonusSections) {
        scores.set(s, (scores.get(s) || 0) + 2);
      }
    }
  }

  // productType 보너스 (기존 로직 유지)
  if (productType) {
    const bonusSections = PRODUCT_TYPE_SECTION_BONUS[productType];
    if (bonusSections) {
      for (const s of bonusSections) {
        scores.set(s, (scores.get(s) || 0) + 2);
      }
    }
  }

  // 기본값 (매칭 0일 때)
  if (scores.size === 0) {
    scores.set(16, 0.1);
    scores.set(20, 0.1);
  }

  // 상위 3개 반환
  const sorted = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return sorted.map(([section, score]) => ({
    section,
    score,
    chapters: SECTION_KEYWORDS[section]?.chapters || [],
    title: SECTION_KEYWORDS[section]?.title || '',
  }));
}
```

4. 기존 SECTION_KEYWORDS, MATERIAL_SECTION_BONUS, PRODUCT_TYPE_SECTION_BONUS는 그대로 유지.
   기존 수동 키워드(가중치 1) + 자동 키워드(가중치 1.5) 합산으로 동작.

== 검증 ==
- TypeScript 에러 없는지 확인
- "lanyards" → Section 11(textile) 또는 Section 10(printed) 매칭되는지 수동 확인
  (heading 5609 "Articles of yarn, strip, twine, cordage" 설명에서 추출된 단어로 매칭)
- "bluetooth speaker" → Section 16 매칭되는지 확인

"=== Complete Fix Stage 1 완료 ===" 출력 후 바로 2단계로.

================================================================
█ Stage 2: Step 3 수정 — Section Notes 데이터 코드에 내장
================================================================

== 현재 문제 ==
step03-section-note-check.ts가 외장하드 경로
(/Volumes/soulmaten/POTAL/hs_classification_rules/section_notes.json)에서
파일을 읽으려 함. 서버에서는 이 경로가 없으므로 빈 데이터로 폴백 → Note 체크 전부 skip됨.

== 해결 ==
section_notes.json의 핵심 내용을 코드에 내장한다.
data/section-notes.ts의 EMBEDDED_SECTION_NOTES에 실제 Note 내용을 채운다.

== 작업 순서 ==

1. 먼저 외장하드에서 section_notes.json 파일 읽기:
   cat /Volumes/soulmaten/POTAL/hs_classification_rules/section_notes.json | head -200
   (파일이 없으면 → 아래 2번으로)

2. 파일이 없거나 읽을 수 없으면:
   WCO HS 2022 Section Notes를 수집한다.
   소스: 우리가 수집한 COMPLETE_GRI1_REFERENCE.md (475KB)에 포함되어 있을 가능성 높음.
   또는: https://www.foreign-trade.com/reference/hscode.htm 등 공개 소스
   또는: 우리 DB에서 관련 데이터 검색

3. 21개 Section Note를 data/section-notes.ts의 EMBEDDED_SECTION_NOTES에 실제 내용으로 채움:

현재 EMBEDDED_SECTION_NOTES 구조:
```typescript
const EMBEDDED_SECTION_NOTES: SectionNote[] = [
  { section_number: 1, title: 'Live animals; animal products',
    chapter_from: '01', chapter_to: '05',
    section_note: '' },  // ← 이게 빈 문자열임. 여기에 실제 Note를 채워야 함
  // ...
];
```

변경 후:
```typescript
const EMBEDDED_SECTION_NOTES: SectionNote[] = [
  { section_number: 1, title: 'Live animals; animal products',
    chapter_from: '01', chapter_to: '05',
    section_note: 'Note 1. Any reference in this Section to a particular genus or species of an animal, except where the context otherwise requires, includes a reference to the young of that genus or species. Note 2. Except where the context otherwise requires, throughout the Nomenclature any reference to "dried" products also covers products which have been dehydrated, evaporated or freeze-dried.' },
  // ... 21개 전부 실제 Note 내용으로
];
```

4. section-notes.ts에서 외장하드 경로 fs.readFileSync 호출 부분을 주석 처리하고,
   항상 EMBEDDED_SECTION_NOTES를 사용하도록 변경:

```typescript
// 변경 전:
export function getSectionNote(sectionNumber: number): SectionNoteResult {
  if (!cachedNotes) {
    // Try external file first
    try {
      if (fs.existsSync(SECTION_NOTES_PATH)) {
        const raw = fs.readFileSync(SECTION_NOTES_PATH, 'utf-8');
        cachedNotes = JSON.parse(raw);
      }
    } catch {}
    // Fallback to embedded
    if (!cachedNotes) {
      cachedNotes = EMBEDDED_SECTION_NOTES;
    }
  }
  // ...
}

// 변경 후:
export function getSectionNote(sectionNumber: number): SectionNoteResult {
  if (!cachedNotes) {
    // 항상 내장 데이터 사용 (서버리스 호환)
    cachedNotes = EMBEDDED_SECTION_NOTES;
  }
  // ...
}
```

5. fs import도 주석 처리 (더 이상 파일 시스템 접근 안 함)

== 중요 ==
- 21개 Section Note 전부 실제 내용으로 채울 것
- 빈 문자열로 남기면 안 됨
- Note가 긴 경우 핵심 내용만 (excludes, includes, definitions) 추출해서 넣기
- Note를 못 구하는 Section은 빈 문자열로 두되, 주석에 "TODO: 수집 필요" 표시

"=== Complete Fix Stage 2 완료 ===" 출력 후 바로 3단계로.

================================================================
█ Stage 3: Step 5 수정 — Chapter Notes 데이터 코드에 내장
================================================================

== 현재 문제 ==
step05-chapter-note-check.ts가 chapter_notes.json을 외장하드에서 읽으려 함.
서버에서 못 읽으면 빈 배열([])로 폴백 → Chapter Note 체크 전부 skip됨.

Chapter Note는 분류에서 매우 중요함:
- "이 류에서 XX는 제외한다" → 해당 Chapter 탈락
- "이 류에서 XX라 함은 ...을 포함한다" → 확정
- "XX는 Ch.YY에 분류한다" → 다른 Chapter로 redirect

== 해결 ==
chapter_notes.json의 핵심 내용을 코드에 내장한다.

== 작업 순서 ==

1. 먼저 외장하드에서 chapter_notes.json 파일 읽기:
   cat /Volumes/soulmaten/POTAL/hs_classification_rules/chapter_notes.json | head -500
   (파일이 없으면 → 아래 2번으로)

2. 파일이 없거나 읽을 수 없으면:
   WCO HS 2022 Chapter Notes를 수집 (공개 소스 활용).
   최소한 자주 분류되는 핵심 Chapter(벤치마크에서 자주 나오는)의 Note부터 수집:
   - Ch.39 (플라스틱), Ch.42 (가죽제품), Ch.61-62 (의류)
   - Ch.64 (신발), Ch.71 (보석), Ch.84-85 (기계/전기)
   - Ch.94 (가구), Ch.95 (완구)

3. data/chapter-notes.ts에 EMBEDDED_CHAPTER_NOTES 배열 추가 (현재 없음):

```typescript
// 현재: 외장하드에서 못 읽으면 빈 배열 반환
// 변경: 내장 데이터 사용

interface ChapterNote {
  chapter: number;
  note_text: string;
}

const EMBEDDED_CHAPTER_NOTES: ChapterNote[] = [
  {
    chapter: 1,
    note_text: 'This Chapter covers all live animals except: (a) Fish and crustaceans, molluscs and other aquatic invertebrates, of heading 03.01, 03.06, 03.07 or 03.08; (b) Cultures of micro-organisms and other products of heading 30.02; and (c) Animals of heading 95.08.'
  },
  // ... 97개 Chapter 전부 (또는 주요 Chapter만이라도)
];
```

4. chapter-notes.ts 수정:
   - 외장하드 fs.readFileSync → 주석 처리
   - 항상 EMBEDDED_CHAPTER_NOTES 사용
   - fs import 주석 처리

5. parseChapterNoteRules 함수가 Note 텍스트에서 excludes/includes/definitions/redirects를
   정규식으로 추출하는 기존 로직은 그대로 유지 — 데이터 소스만 바뀌는 것

== 중요 ==
- 97개 Chapter Note 전부 채우는 게 목표
- 최소한 P0 Chapter(벤치마크 빈출)라도 반드시 채울 것
- Note가 없는 Chapter는 빈 문자열로 두되 주석에 "TODO" 표시
- Note 텍스트가 길어도 전문을 넣을 것 (excludes/includes가 어디 숨어있을지 모르니까)

"=== Complete Fix Stage 3 완료 ===" 출력 후 바로 4단계로.

================================================================
█ Stage 4: Step 7 수정 — Conflict Patterns 데이터 코드에 내장
================================================================

== 현재 문제 ==
step07-conflict-resolve.ts가 conflict_patterns/ch##_patterns.json을
외장하드에서 읽으려 함. 서버에서 못 읽으면 빈 배열로 폴백 → 패턴 매칭 전부 skip,
항상 AI 호출 또는 점수 폴백으로 넘어감.

1단계에서 97개 챕터 파일로 11,640개 대립 패턴을 만들었는데, 이걸 코드에서 못 읽고 있음.

== 해결 ==
conflict_patterns의 핵심 데이터를 코드에 내장한다.

== 작업 순서 ==

1. 외장하드에서 conflict patterns 파일 확인:
   ls /Volumes/soulmaten/POTAL/hs_classification_rules/conflict_patterns/
   wc -l /Volumes/soulmaten/POTAL/hs_classification_rules/conflict_patterns/index.json

2. index.json에서 전체 통계 확인:
   cat /Volumes/soulmaten/POTAL/hs_classification_rules/conflict_patterns/index.json

3. 모든 97개 챕터 파일의 내용을 하나의 TypeScript 파일로 합친다:

   app/lib/cost-engine/gri-classifier/data/conflict-patterns-data.ts (신규 생성)

```typescript
/**
 * GRI Conflict Patterns — 97 Chapters, ~11,640 Patterns
 * 부품 파일: Step 7 (conflict-resolve)에서 사용
 *
 * 데이터 소스: CBP CROSS 142,251건 + EU EBTI 231,727건에서 추출
 * 마지막 업데이트: 2026-03-18
 */

import type { ConflictPattern } from '../types';

export const CONFLICT_PATTERNS: Record<number, ConflictPattern[]> = {
  1: [
    // Chapter 1 patterns
    // ...ch01_patterns.json 내용
  ],
  2: [
    // Chapter 2 patterns
    // ...ch02_patterns.json 내용
  ],
  // ... 97개 Chapter 전부
  97: [
    // Chapter 97 patterns
  ],
};
```

4. 만약 11,640개 패턴이 파일 하나에 넣기에 너무 크면 (>500KB):
   - P0 Chapter 패턴만 먼저 내장 (Ch.39, 42, 61, 62, 64, 71, 84, 85, 94, 95)
   - 나머지는 별도 파일로 분리: conflict-patterns-p1.ts, conflict-patterns-p2.ts
   - 또는: JSON string으로 압축해서 런타임에 파싱

5. conflict-patterns.ts (기존 로더) 수정:
```typescript
// 변경 전:
import * as fs from 'fs';
const PATTERNS_DIR = '/Volumes/soulmaten/POTAL/hs_classification_rules/conflict_patterns';

export function findMatchingPattern(chapter: number, keywords: string[]): ConflictPattern | null {
  const filePath = `${PATTERNS_DIR}/ch${String(chapter).padStart(2, '0')}_patterns.json`;
  try {
    if (fs.existsSync(filePath)) {
      const patterns = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      // ...매칭 로직
    }
  } catch {}
  return null;
}

// 변경 후:
import { CONFLICT_PATTERNS } from './conflict-patterns-data';

export function findMatchingPattern(chapter: number, keywords: string[]): ConflictPattern | null {
  const patterns = CONFLICT_PATTERNS[chapter];
  if (!patterns || patterns.length === 0) return null;

  // 키워드 교집합으로 매칭 (기존 로직 유지)
  let bestMatch: ConflictPattern | null = null;
  let bestScore = 0;

  for (const pattern of patterns) {
    const overlap = keywords.filter(kw => pattern.keywords.includes(kw)).length;
    if (overlap >= 2 && overlap > bestScore) {
      bestScore = overlap;
      bestMatch = pattern;
    }
  }

  return bestMatch;
}
```

6. fs import 제거 (더 이상 파일 시스템 접근 안 함)

== 중요 ==
- 11,640개 패턴을 전부 TypeScript에 내장하는 게 목표
- 파일 크기가 너무 크면 (>1MB) 챕터별로 분할
- 각 패턴의 keywords 필드가 반드시 있어야 함 (매칭에 사용)
- 기존 findMatchingPattern 함수의 매칭 로직은 유지
- ConflictPattern 타입이 types.ts에 정의되어 있는지 확인

"=== Complete Fix Stage 4 완료 ===" 출력 후 바로 5단계로.

================================================================
█ Stage 5: npm run build + 전체 연결 검증
================================================================

== 목표 ==
4개 Stage 수정 후 빌드 통과 + 모든 Step이 부품 파일을 쓰는지 최종 확인.

== 작업 ==

1. npm run build 실행
   - TypeScript 에러 0개 확인
   - 에러 있으면 즉시 수정

2. 모든 Step의 import 확인 (grep으로 검증):
```bash
# 외장하드 경로가 남아있는지 체크 (0건이어야 함)
grep -r "/Volumes/soulmaten" app/lib/cost-engine/gri-classifier/ --include="*.ts"

# fs import가 남아있는지 체크 (0건이어야 함, 주석 제외)
grep -r "^import.*from.*'fs'" app/lib/cost-engine/gri-classifier/ --include="*.ts"

# 모든 data/ import 확인
grep -r "from.*'../data/" app/lib/cost-engine/gri-classifier/steps/ --include="*.ts"
```

3. 각 Step별 데이터 소스 최종 확인표 출력:

```
Step 1:  키워드 추출      → 하드코딩 (STOPWORDS, MATERIALS, PRODUCT_TYPES) ✅
Step 2:  Section 매칭     → heading-descriptions.ts (자동 키워드) + 수동 키워드 ✅
Step 3:  Section Note     → section-notes.ts (내장 데이터) ✅
Step 4:  Chapter 매칭     → chapter-descriptions.ts (97개) ✅
Step 5:  Chapter Note     → chapter-notes.ts (내장 데이터) ✅
Step 6:  Heading 매칭     → heading-descriptions.ts (1,229개) ✅
Step 7:  Conflict 해결    → conflict-patterns-data.ts (11,640개) + AI 폴백 ✅
Step 8:  Subheading 매칭  → subheading-descriptions.ts (5,613개) ✅
Step 9:  Country Router   → DB (gov_tariff_schedules) ← 이건 DB가 맞음
Step 10: Price Break      → DB (hs_price_break_rules) ← 이건 DB가 맞음
Step 11: Final Resolve    → 코드만 (집계) ✅
```

4. 외장하드 의존성 0건, fs 의존성 0건 확인

"=== Complete Fix Stage 5 완료 ===" 출력 후 바로 6단계로.

================================================================
█ Stage 6: 재벤치마크 (CBP 100건)
================================================================

== 목표 ==
4개 Step 수정 후 정확도 변화 측정.
v1.0 (0%) → v1.1 (4%) → v1.2 (이번) 비교.

== 실행 ==

1. 벤치마크 데이터: /Volumes/soulmaten/POTAL/benchmark_test_data.json (100건)

2. 100건 각각에 대해 classifyWithGRI() 호출
   - 벤치마크 중 DB 캐시 저장 하지 마 (공정성)
   - AI 호출은 실제로 해 (모의 아닌 진짜)
   - 에러 발생 시 해당 건은 "error"로 표시하고 다음으로

3. 결과 HS 6자리를 expected_hs6와 비교:
   - 6자리 전체 일치: ✅ Exact Match
   - 4자리 일치: ⚠️ Heading Match
   - 2자리 일치: ❌ Chapter Only
   - 완전 불일치: ❌ Miss

4. Step별 정확도 분석:
   - decisionPath를 분석하여 각 Step에서 정답/오답 비율 측정
   - Step 2(Section): expected HS6의 Section과 Step 2 결과 비교
   - Step 4(Chapter): expected HS6의 Chapter와 Step 4 결과 비교
   - Step 6(Heading): expected HS6의 Heading과 Step 6 결과 비교
   - Step 8(Subheading): expected HS6와 Step 8 결과 비교

5. 오분류 원인 분류 (틀린 문제별):
   - SECTION_MISMATCH: Section 단계에서 잘못됨
   - CHAPTER_MISMATCH: Chapter 단계에서 잘못됨
   - HEADING_MISMATCH: Heading 단계에서 잘못됨
   - SUBHEADING_MISMATCH: Subheading 단계에서 잘못됨
   - NOTE_APPLIED: Section/Chapter Note가 잘못 적용됨
   - PATTERN_WRONG: Conflict 패턴이 잘못된 결과 반환
   - KEYWORD_INSUFFICIENT: 키워드 부족
   - OTHER

6. 결과 저장:
   - /Volumes/soulmaten/POTAL/benchmark_results/gri_benchmark_v1.2_results.json (100건 전체)
   - /Volumes/soulmaten/POTAL/benchmark_results/gri_benchmark_v1.2_summary.md
   - /Volumes/soulmaten/POTAL/benchmark_results/gri_benchmark_v1.2_errors.json (틀린 문제)

7. 요약 리포트:
```
GRI Agent Team Benchmark v1.2 (Complete Fix) — [날짜]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6-digit Exact: XX/100 (XX%)
4-digit Heading: XX/100 (XX%)
2-digit Chapter: XX/100 (XX%)

AI Calls: 평균 X.XX회/건
처리시간: 평균 XXXms

버전 비교:
- v1.0 (최초):      0% /  0% / 24%
- v1.1 (데이터):    4% / 12% / 33%
- v1.2 (완전수정): XX% / XX% / XX% ★

vs 경쟁사:
- Tarifflo: 89%
- Avalara: 80%
- Zonos: 44%

Step별 정확도:
- Step 2 (Section):    XX/100 (XX%)
- Step 4 (Chapter):    XX/100 (XX%)
- Step 6 (Heading):    XX/100 (XX%)
- Step 8 (Subheading): XX/100 (XX%)

오분류 원인 TOP 3:
1. [원인] — XX건
2. [원인] — XX건
3. [원인] — XX건

다음 개선 방향:
- [원인별 구체적 개선 제안]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

"=== Complete Fix Stage 6 완료 ===" 출력.

================================================================
█ 최종 요약
================================================================

6단계 전부 끝나면 최종 요약 출력:

```
================================================================
GRI 완전 수정 최종 요약 — [날짜 시간]
================================================================

Stage 1: Step 2 수정 (Section 키워드 자동 생성)
- 수동 키워드: ~700개 (기존 유지)
- 자동 키워드: +XXX개 (heading 설명에서 추출)
- 합계: ~X,XXX개

Stage 2: Step 3 수정 (Section Notes 내장)
- 21개 Section Note 중 XX개 내장 완료

Stage 3: Step 5 수정 (Chapter Notes 내장)
- 97개 Chapter Note 중 XX개 내장 완료

Stage 4: Step 7 수정 (Conflict Patterns 내장)
- XX개 패턴 내장 완료 (97개 챕터)

Stage 5: 빌드 + 검증
- npm run build: ✅/❌
- 외장하드 의존성: 0건 ✅/❌
- fs 의존성: 0건 ✅/❌

Stage 6: 재벤치마크
- v1.0: 0% / 0% / 24%
- v1.1: 4% / 12% / 33%
- v1.2: XX% / XX% / XX% ★

다음 작업:
- [ ] git commit + push
- [ ] 정확도가 목표(89%) 미달이면 → 오분류 원인별 추가 개선
- [ ] CLASSIFICATION_ENGINE=gri Vercel 환경변수 설정
================================================================
```
```
