# Claude Code 명령어: v3 파이프라인 코드화 데이터 전체 점검

> **날짜**: 2026-03-21 KST
> **목표**: v3 파이프라인이 사용하는 모든 키워드 사전, 매핑 테이블, 코드화 규칙 파일을 전수 점검하여 누락/오류를 찾아낸다
> **배경**: 9-field 완전 173건 벤치마크에서 15건(9%) Section 0 미분류 발생. "Soy Wax", "Foam", "Blend" 등 material이 파이프라인 사전에 없음. 이것은 사전 자체의 불완전성 문제.
> **제약**: 코드 수정은 이 명령어에서 하지 않는다. 점검 + 누락 목록 작성만 한다.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **시트 마감**: `=== 작업 종료 ===`

---

## 점검 대상 파일 전체 목록

### A. Step 파일 (코드 로직 + 내장 사전)

| 파일 | Step | 내장 사전 |
|------|------|----------|
| `steps/v3/step0-input.ts` | Step 0 | MATERIAL_KEYWORDS, PROCESSING_KEYWORDS |
| `steps/v3/step2-1-section-candidate.ts` | Step 2-1 | MATERIAL_TO_SECTION, CATEGORY_TO_SECTION, PASSIVE_ACCESSORY_WORDS |
| `steps/v3/step2-2-section-notes.ts` | Step 2-2 | (codified-rules.ts 사용) |
| `steps/v3/step2-3-chapter-candidate.ts` | Step 2-3 | MATERIAL_CHAPTER_MAP, PROCESSING_CHAPTER_MAP, ARTICLE_KEYWORDS |
| `steps/v3/step2-4-chapter-notes.ts` | Step 2-4 | (codified-rules.ts 사용) |
| `steps/v3/step3-heading.ts` | Step 3-1 | KEYWORD_TO_HEADINGS |
| `steps/v3/step4-subheading.ts` | Step 3-2 | (codified-subheadings.ts 사용) + MAT_SYN, SUBHEADING_SYNONYMS |

### B. 데이터 파일 (코드화된 규칙/설명)

| 파일 | 크기 | 내용 |
|------|------|------|
| `data/codified-rules.ts` | 172KB | 592개 Section/Chapter Notes 규칙 |
| `data/codified-headings.ts` | 442KB | 1,233개 Heading 코드화 |
| `data/codified-subheadings.ts` | 1.9MB | 5,621개 Subheading 코드화 |
| `data/heading-descriptions.ts` | 169KB | 1,229개 Heading WCO 원문 |
| `data/subheading-descriptions.ts` | 669KB | Subheading WCO 원문 |
| `data/chapter-descriptions.ts` | 9KB | Chapter 설명 |
| `data/chapter-notes.ts` | 358KB | Chapter Notes 원문 |
| `data/section-notes.ts` | 45KB | Section Notes 원문 |
| `data/conflict-patterns-data.ts` | 1.4MB | 575K 판결문 패턴 |
| `data/heading-method-tags.ts` | 64KB | Heading 매칭 방법 태그 |
| `data/gri-rules.ts` | 2KB | GRI 1-6 규칙 텍스트 |
| `data/9field_reference.json` | 186KB | 9-field 참조 데이터 |

---

## Phase 1: Step 0 — MATERIAL_KEYWORDS 전수 점검

### 1-1. 현재 MATERIAL_KEYWORDS 전체 목록 추출

`step0-input.ts`를 읽고 MATERIAL_KEYWORDS에 등록된 모든 키워드 그룹을 추출한다.

### 1-2. HS Section 21개와 교차 대조

HS Section은 법적으로 정해진 21개 소재 분류야. MATERIAL_KEYWORDS가 21개 Section을 전부 커버하는지 확인:

```
Section I: 동물 (live animals, meat, fish, dairy, eggs, honey...)
Section II: 식물 (plants, vegetables, fruits, cereals, coffee, tea, spices...)
Section III: 유지 (animal/vegetable fats, oils, waxes)
Section IV: 가공식품 (prepared food, beverages, spirits, tobacco)
Section V: 광물 (mineral products, salt, sulphur, earths, stone, cement)
Section VI: 화학 (chemicals, pharmaceuticals, fertilizers, soaps, explosives)
Section VII: 플라스틱/고무 (plastics, rubber, foam, resin)
Section VIII: 가죽 (leather, fur, skins, saddlery, handbags)
Section IX: 목재 (wood, cork, bamboo, straw, basketware)
Section X: 종이 (pulp, paper, paperboard, cardboard)
Section XI: 섬유 (textiles — cotton, silk, wool, synthetic fibers, knitted, woven)
Section XII: 신발/모자 (footwear, headgear, umbrellas, feathers)
Section XIII: 석재/유리 (stone, ceramic, glass, porcelain)
Section XIV: 보석 (precious metals, pearls, jewelry, coins)
Section XV: 비금속 (iron, steel, copper, aluminum, zinc, tin, tools, cutlery)
Section XVI: 기계/전기 (machinery, electrical, electronics)
Section XVII: 차량/운송 (vehicles, aircraft, vessels, railway)
Section XVIII: 정밀기기 (optical, medical, clocks, watches, musical)
Section XIX: 무기 (arms, ammunition)
Section XX: 잡화 (furniture, toys, games, sports, miscellaneous)
Section XXI: 예술 (works of art, antiques, collectors' pieces)
```

**각 Section에 대응하는 MATERIAL_KEYWORDS가 최소 3개 이상 있는지 확인.**
누락된 Section이 있으면 해당 Section의 대표 소재 키워드 목록 작성.

### 1-3. 벤치마크 실패 material 교차 확인

173건 벤치마크에서 Section 0이 된 15건의 material 값:
- "Soy Wax" → Section III (유지) 또는 Section VI (화학)에 매핑되어야 함
- "Foam" → Section VII (플라스틱)
- "Blend" → material이 아님 (무효 값)
- "Metal" → Section XV이지만 너무 포괄적
- "other" → material이 아님 (무효 값)

이 값들이 MATERIAL_KEYWORDS에 있는지, 없으면 어떤 Section에 매핑해야 하는지.

---

## Phase 2: Step 2-1 — MATERIAL_TO_SECTION + CATEGORY_TO_SECTION 점검

### 2-1. MATERIAL_TO_SECTION 전체 목록 추출

`step2-1-section-candidate.ts`를 읽고 매핑 테이블 전체 추출.

### 2-2. 21개 Section 전부 커버되는지 확인

MATERIAL_TO_SECTION에서 각 Section으로 매핑되는 키워드가 있는지. 누락 Section 목록 작성.

### 2-3. CATEGORY_TO_SECTION 전체 목록 추출 + 검증

카테고리 → Section 매핑이 주요 이커머스 카테고리를 커버하는지.
Amazon category_path 기준으로 대조:
- "Grocery & Gourmet Food" → Section I~IV
- "Clothing, Shoes & Jewelry" → Section XI, XII, XIV
- "Electronics" → Section XVI
- "Home & Kitchen" → Section XIII, XV, XX
- "Tools & Home Improvement" → Section XV, XVI
- "Sports & Outdoors" → Section XX
- "Beauty & Personal Care" → Section VI
- "Health & Household" → Section VI
- "Automotive" → Section XVII
- "Toys & Games" → Section XX

### 2-4. PASSIVE_ACCESSORY_WORDS 확인

어떤 단어들이 등록되어 있고, electronics Section 스킵이 올바르게 작동하는지.

---

## Phase 3: Step 2-3 — Chapter 매핑 점검

### 3-1. MATERIAL_CHAPTER_MAP 전체 추출 + 검증

각 Section 내에서 소재 → Chapter 매핑이 올바른지.
예: Section XI(섬유)에서 cotton → Ch.52, silk → Ch.50, synthetic → Ch.54 등.

### 3-2. PROCESSING_CHAPTER_MAP 전체 추출 + 검증

가공 방식 → Chapter 매핑.
예: knitted → Ch.61, woven → Ch.62 등.

### 3-3. ARTICLE_KEYWORDS 확인

steel raw vs article 구분 키워드 목록.

---

## Phase 4: Step 3-1 — KEYWORD_TO_HEADINGS 점검

### 4-1. KEYWORD_TO_HEADINGS 전체 추출

`step3-heading.ts`에 하드코딩된 키워드 → Heading 매핑 전체 목록.
CLAUDE.md 기준 179개.

### 4-2. codified_headings 1,233개와 교차 대조

`data/codified-headings.ts`에 1,233개 Heading이 있고, 각 Heading에 keywords가 추출되어 있다.
KEYWORD_TO_HEADINGS 179개가 이 1,233개 중 어느 정도를 커버하는지.

### 4-3. 173건 벤치마크 Heading 분포 확인

어떤 Heading이 자주 나오고, 어떤 Heading이 매칭 안 되는지.

---

## Phase 5: Step 3-2 — Subheading 데이터 점검

### 5-1. codified-subheadings.ts 전체 건수 + 구조 확인

5,621개 Subheading 중 conditions가 비어있는 것, product_type가 없는 것 등.

### 5-2. MAT_SYN (소재 동의어) 전체 추출 + 검증

동의어 그룹이 충분한지. cotton = cotton fiber = pure cotton 등.

### 5-3. SUBHEADING_SYNONYMS 전체 추출 + 검증

---

## Phase 6: codified-rules.ts (592개 Notes 규칙) 점검

### 6-1. 592개 규칙 유형별 분포 확인

```
exclusion / inclusion / numeric_threshold / material_condition / definition / ai_derived_rule / ai_required
```

### 6-2. 규칙 중 condition이 빈 것, action이 없는 것

---

## Phase 7: heading-descriptions.ts vs codified-headings.ts 교차 검증

### 7-1. heading-descriptions.ts에 있는데 codified-headings.ts에 없는 Heading

### 7-2. codified-headings.ts에 keywords가 비어있는 Heading

---

## Phase 8: conflict-patterns-data.ts 점검

### 8-1. 575K 판결문 패턴 건수 확인

### 8-2. Chapter별 패턴 분포 — 패턴이 0인 Chapter가 있는지

---

## 결과물

### 엑셀: `POTAL_V3_Codified_Data_Audit.xlsx`

**Sheet 1: Summary**
- 파일별 건수, 커버리지, 누락 수

**Sheet 2: MATERIAL_KEYWORDS 점검**
- 21개 Section × 키워드 존재 여부
- 누락 키워드 목록

**Sheet 3: MATERIAL_TO_SECTION 점검**
- 전체 매핑 + 21개 Section 커버리지

**Sheet 4: CATEGORY_TO_SECTION 점검**
- 전체 매핑 + Amazon 카테고리 교차 대조

**Sheet 5: KEYWORD_TO_HEADINGS 점검**
- 179개 매핑 전체 + 1,233개 Heading 중 미커버 목록

**Sheet 6: 누락 목록 (수정 필요 항목)**
- 파일명, 누락 항목, 추가해야 할 값, 대응 Section/Chapter

### 엑셀 로그:
시트 마감: `=== 작업 종료 === | 점검 파일 수 | 발견 누락 수 | 수정 필요 항목 수`

---

## ⚠️ 절대 규칙

1. **코드 수정 하지 않는다** — 점검 + 누락 목록 작성만
2. **모든 데이터 파일을 실제로 읽고 건수를 센다** — 추정 금지
3. **21개 HS Section을 기준으로 빠짐없이 검증한다** — 이건 법적 국제 표준이므로 21개 전부 있어야 정상
4. **Amazon 카테고리도 기준으로 활용** — 실제 이커머스 데이터에서 나오는 소재/카테고리가 사전에 있는지
5. **엑셀에 전수 기록** — 점검한 항목, 결과, 누락 목록 전부
