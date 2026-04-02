# Claude Code 명령어: WCO 원문 기반 키워드 사전 전수 재추출

> **날짜**: 2026-03-21 KST
> **목표**: 이미 코드화된 WCO 원문 데이터 (Section Notes, Chapter Notes, Heading descriptions, Subheading descriptions)에서 키워드를 다시 전수 추출하여 MATERIAL_KEYWORDS, MATERIAL_TO_SECTION, CATEGORY_TO_SECTION, KEYWORD_TO_HEADINGS의 누락을 채운다
> **방법**: 원래 했던 것과 똑같은 방식. 법적 문장 → 키워드 추출 → 사전에 추가. 새로운 소스가 아니라 기존 소스를 다시 분석하는 것.
> **제약**: 코드화 파일만 수정. 파이프라인 로직(step0~step7)은 수정하지 않는다.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **시트 마감**: `=== 작업 종료 ===`

---

## 현재 문제 (감사 결과)

| 사전 | 현재 | 문제 |
|------|------|------|
| MATERIAL_KEYWORDS | 32그룹, 187개 | 21개 Section 중 13개가 50% 미만. S3/S4/S5/S12/S16~S21 = 0% |
| MATERIAL_TO_SECTION | 61개 | 12/21 Section만 커버. 9개 Section 누락 |
| CATEGORY_TO_SECTION | 102개 | 15/21 Section. 6개 누락 |
| KEYWORD_TO_HEADINGS | 179개 | 1,233개 Heading 중 114개만 커버 (9%) |

## 이미 있는 원문 소스 (전부 data/ 폴더에 코드화되어 있음)

| 파일 | 내용 | 크기 |
|------|------|------|
| `data/section-notes.ts` | 21개 Section Notes 원문 | 45KB |
| `data/chapter-notes.ts` | 97개 Chapter Notes 원문 | 358KB |
| `data/heading-descriptions.ts` | 1,229개 Heading WCO 원문 설명 | 169KB |
| `data/subheading-descriptions.ts` | Subheading WCO 원문 설명 | 669KB |
| `data/codified-rules.ts` | 592개 코드화 규칙 (Notes에서 추출) | 172KB |
| `data/codified-headings.ts` | 1,233개 Heading 코드화 (keywords 포함) | 442KB |
| `data/codified-subheadings.ts` | 5,621개 Subheading 코드화 | 1.9MB |

**이 파일들에 키워드가 이미 있다.** 문제는 step 파일의 사전(MATERIAL_KEYWORDS 등)에 옮기지 않은 것.

---

## Phase 1: WCO 원문 5회 반복 추출 — MATERIAL_KEYWORDS + MATERIAL_TO_SECTION

**같은 원문을 5번 다른 관점으로 분석하여 누락 최소화.**

### 소스 파일:
- `data/section-notes.ts` (21개 Section Notes 원문)
- `data/chapter-notes.ts` (97개 Chapter Notes 원문)
- `data/chapter-descriptions.ts` (97개 Chapter 설명)
- `data/heading-descriptions.ts` (1,229개 Heading 원문)

### 5회 추출 방법:

**1차 추출: 타이틀/헤더 명시 키워드**
- Section 타이틀: "Live animals; animal products" → animal, meat, fish, dairy
- Chapter 타이틀: "Coffee, tea, mate and spices" → coffee, tea, spice
- 가장 명확한 대표 키워드만

**2차 추출: "includes/covers/means" 구문 키워드**
- Notes 본문에서 "This Section/Chapter includes...", "The expression ... means...", "... covers..."
- 예: "This Chapter covers fats and oils, animal or vegetable, including... lard, tallow, margarine"
- 포함 규정에서 나오는 구체적 소재/상품명

**3차 추출: Exclusion 규칙 키워드**
- "This Section/Chapter does not cover..." 뒤에 나오는 키워드
- 이 키워드들은 다른 Section으로 가야 할 소재 → 해당 Section의 키워드로 등록
- 예: Section XI(섬유) Note에 "does not cover... asbestos" → S6(화학)에 asbestos 추가

**4차 추출: 구체적 상품명/예시**
- Heading descriptions 1,229개에서 상품명 추출
- "Candles, tapers and the like" → candle, taper
- "Brooms, brushes" → broom, brush
- "Drills, grinders" → drill, grinder

**5차 추출: 동의어/유사어 확장**
- 1~4차에서 추출한 키워드의 동의어 추가
- leather = hide = skin = rawhide
- wax = paraffin = beeswax = soy wax = candle wax
- plastic = polymer = resin = foam = PVC = acrylic
- ceramic = porcelain = stoneware = earthenware

### 5회 추출 후: 합산 + 중복 제거
- 5번의 결과를 전부 합쳐서 Section/Chapter별로 정리
- 중복 제거
- 현재 MATERIAL_KEYWORDS에 있는 것 제외 → **순수 신규 키워드 목록**

### 엑셀에 5회 추출 과정 전부 기록:
- 각 회차별 추출 키워드 수
- 각 회차에서 새로 발견된 키워드 (이전 회차에 없던 것)
- 최종 합산 키워드 수

---

## Phase 2: Heading descriptions → KEYWORD_TO_HEADINGS 5회 반복 추출

**현재 179개 → 1,233개 중 114개만 커버 (9%). 같은 5회 반복으로 확장.**

### 5회 추출 방법:

**1차: codified-headings.ts의 기존 keywords 배열 옮기기**
- `data/codified-headings.ts`에 이미 10,222개 키워드가 있다 (CW18 기록)
- 이 중 KEYWORD_TO_HEADINGS에 안 들어간 것을 전부 추가
- 가장 빠른 방법 — 이미 추출되어있으니까 옮기기만 하면 됨

**2차: heading-descriptions.ts 원문에서 직접 추출**
- 1,229개 Heading WCO 원문 description을 직접 읽고 상품명 키워드 추출
- "Candles, tapers and the like" → candle, taper
- "Brooms, brushes" → broom, brush
- codified-headings keywords에서 놓친 게 있을 수 있음

**3차: 상품명 동의어 확장**
- candle = wax candle = scented candle = soy candle
- drill = power drill = cordless drill = electric drill
- shirt = t-shirt = tee = tee shirt

**4차: 이커머스 빈도 기반 확장**
- Amazon/Shopify에서 가장 많이 거래되는 상품 키워드 추가
- 벤치마크 173건에서 Heading 매칭 실패한 상품의 키워드

**5차: 교차 검증 — Heading 1,233개 중 키워드 0개인 것 찾기**
- 5회 추출 후에도 키워드가 없는 Heading 목록 작성
- 그 Heading의 원문을 읽고 키워드 추가

### 목표: KEYWORD_TO_HEADINGS 179개 → 500개+
전체 1,233개를 다 커버할 필요는 없지만, 이커머스에서 실제 거래되는 상품의 Heading은 전부 커버해야 함.

---

## Phase 3: 감사에서 발견된 누락 21개 Section 전부 채우기

### 현재 누락 (Material+Category 합산 기준):

**완전 미커버 3개:**
- **S3 (유지/오일)**: fat, oil, wax, tallow, lard, margarine, glycerol → MATERIAL_KEYWORDS + MATERIAL_TO_SECTION 추가
- **S19 (무기)**: weapon, ammunition, firearm, explosive → MATERIAL_TO_SECTION 추가 (드문 카테고리)
- **S21 (예술)**: painting, sculpture, antique, art, collectors piece → CATEGORY_TO_SECTION 추가

**MATERIAL_KEYWORDS 0%인데 CATEGORY로 커버되는 15개:**
- 이것들도 MATERIAL_KEYWORDS에 추가해야 함 — category가 비어있으면 material만으로도 Section을 찾을 수 있어야 하니까

각 Section에 대해:
1. WCO 원문에서 대표 소재/상품 키워드 최소 5개 이상 추출
2. MATERIAL_KEYWORDS에 그룹으로 추가
3. MATERIAL_TO_SECTION에 매핑 추가

---

## Phase 4: 벤치마크 실패 15건 키워드 처리

감사에서 발견된 Section 0 실패 원인별 수정:

| Material | 추가할 곳 | 매핑 |
|----------|----------|------|
| "Soy Wax", "Wax" | MATERIAL_KEYWORDS wax 그룹 | → S3 (유지) 또는 S6 (화학) |
| "Foam" | MATERIAL_KEYWORDS plastic 그룹에 추가 | → S7 (플라스틱) |
| "Metal" | MATERIAL_TO_SECTION | → S15 (비금속) |
| "Blend" | 무효값 처리 로직 | → category fallback |
| "other" | 무효값 처리 로직 | → category fallback |

**"Blend", "other"는 material이 아니므로 키워드 사전에 넣지 않는다.**
대신 Step 2-1에서 material이 무효값일 때 category로 fallback하는 로직이 있는지 확인.

---

## Phase 5: 수정 파일 작성

### 수정 대상 파일 (Step 파일만, data 파일은 수정 안 함):

| 파일 | 수정 내용 |
|------|----------|
| `steps/v3/step0-input.ts` | MATERIAL_KEYWORDS에 누락 그룹 추가 (wax, foam, soap, candle, weapon, vehicle, machinery, furniture, toy 등) |
| `steps/v3/step2-1-section-candidate.ts` | MATERIAL_TO_SECTION에 누락 매핑 추가 (9개 Section) + CATEGORY_TO_SECTION에 누락 매핑 추가 (3개 Section) |
| `steps/v3/step3-heading.ts` | KEYWORD_TO_HEADINGS에 codified-headings keywords에서 추출한 매핑 추가 |

### 수정 원칙:
1. **기존 키워드/매핑 수정 금지** — 추가만
2. **WCO 원문에 근거 있는 키워드만 추가** — 임의로 만들지 않음
3. **21개 Section 전부 최소 5개 키워드 확보**
4. **KEYWORD_TO_HEADINGS는 가장 빈번한 이커머스 상품 위주로 확장** (1,233개 전부 커버할 필요 없음, 상위 빈도 300개 목표)

---

## Phase 6: 빌드 + 벤치마크 재실행

### 6-1. npm run build
```bash
npm run build  # 0 errors 확인
```

### 6-2. 기존 173건 9-field 벤치마크 재실행

동일한 173건으로 재실행하여 비교:

| 항목 | Before | After |
|------|--------|-------|
| Section 0 (미분류) | 15/173 (9%) | 목표: 0~3건 |
| Section 커버리지 | 18/21 | 목표: 21/21 |
| Duty rate found | 158/173 (91%) | 목표: 165+ |

### 6-3. Amazon 50건 (CW18 원본) 재테스트

기존 100% 정확도 유지되는지 regression 확인.

---

## 결과물

### 엑셀: `POTAL_V3_Keyword_Rebuild.xlsx`

**Sheet 1: Summary** — 추가 전/후 비교
**Sheet 2: Added MATERIAL_KEYWORDS** — 추가된 그룹/키워드 전체 목록 + WCO 근거
**Sheet 3: Added MATERIAL_TO_SECTION** — 추가된 매핑 + Section 번호
**Sheet 4: Added CATEGORY_TO_SECTION** — 추가된 매핑
**Sheet 5: Added KEYWORD_TO_HEADINGS** — 추가된 키워드→Heading 매핑
**Sheet 6: Benchmark Before/After** — 173건 결과 비교

---

## ⚠️ 절대 규칙

1. **WCO 원문에 근거 있는 키워드만 추가** — 추측이나 임의 키워드 금지
2. **기존 키워드/매핑은 수정하지 않는다** — 추가만
3. **data/ 파일 (codified-rules, codified-headings 등) 수정 금지** — step 파일의 사전만 수정
4. **파이프라인 로직 (if문, 매칭 로직 등) 수정 금지** — 사전 데이터만 추가
5. **173건 재벤치마크 시 기존 50건 Amazon 결과가 깨지면 안 됨** — regression 확인 필수
6. **엑셀에 추가된 키워드 전부 기록** — 어떤 키워드를, 어디에, 왜 추가했는지
