# 다음 세션 시작 가이드
> 마지막 업데이트: 2026-03-23 KST (CW18 Cowork 5차 — 12 TLC 시스템화 46건 수정, EU VAT 27국, India Ch.71 3%)

---

## 현재 상태 요약

### 12 TLC 시스템화 (완성 ✅ — 2026-03-23):
- **46건 코드 감사 이슈 전부 수정**: P0(2)+P1(6)+P2(3)+P3(8)+MEDIUM(20)+LOW(3)+EU VAT(15국)
- **특수세금 전면 개편**: Brazil IPI 95ch, India IGST 97ch(Ch.71 금 3%!), Mexico IEPS 53%, China CBEC+CT
- **EU VAT 27국 완성**: 12국→27국 경감세율 (FI,DK,CZ,RO,HU,BG,HR,SK,SI,LT,LV,EE,LU,CY,MT)
- **검증**: npm run build ✅ (5회), Duty Rate 55/55 PASS 100%
- **수정 파일 10개**, 엑셀 3개

### Layer 1 (절대값 — 완성 ✅):
- **Step 0~6 전체 파이프라인**: 9-field → HS 10자리 + 세율
- **7개국 벤치마크 1,183건**: **7개국 전부 100%** + Duty rate 7개국 100%
- **gov_tariff_schedules**: 131,794행 (7개국)
- **codified_national_full_final.json × 7**: 131,794행 코드화, 5회 검수 오류 0건
- **MATERIAL_KEYWORDS**: 79그룹 (21/21 Section 100%)
- **KEYWORD_TO_HEADINGS**: 400 inline + 13,449 extended = 13,849개
- **macmap 세율**: 874,302행 (140국)
- **AI 호출**: 0회, 비용: $0
- **Regression**: 20/20 유지

### Layer 2 (실험 6회 완료 — v2 = HS6 최적, v6 = Section 최고):
- **v1 (LLM 자유)**: material 99% 추출, HS6 8%. 유효하지 않은 material 출력
- **v2 (material 강제)**: S57%/Ch46%/H19%/HS6=8%. **HS6 최적** ✅
- **v3 (전체 강제)**: S49%/Ch39%/HS6=5%. 과도한 제약으로 하락 ❌
- **v4 (POTAL 128 category)**: S52%/Ch37%/HS6=6%. 하락 ❌
- **v5 (WCO 97 Chapter)**: S56%/Ch42%/HS6=6%. v4보다 나으나 v2보다 못함 ❌
- **v6 (WCO raw text)**: **S65% (역대 최고)** / Ch44% / HS6=6%. Section 최고지만 HS6 변환 손실 ❌
- **v6 에러 분석** (256건): Pattern E(LLM실수 41%) > Pattern B(경계혼동 26%) > Pattern A(카테고리오도 21%) > Pattern D(material의존 9%)
- **최다 오분류**: Ch.96→39(15건), Ch.61→62(13건), Ch.84→90(11건)
- **병목**: (1) GPT-4o-mini Chapter 판단 한계 (2) Layer 1 KEYWORD_TO_HEADINGS 사전 부족 (Jewelry Ch.71, Electronics Ch.85, Tools Ch.82)

### Layer 3 (미시작)

---

## ⭐⭐⭐ 이전 세션 핵심 인사이트 (반드시 이해하고 시작할 것) ⭐⭐⭐

### 1. POTAL의 본질 — "AI가 필요 없는데 AI가 필요한 플랫폼"

**Layer 1**은 AI 0회로 HS Code 100% 정확도를 달성한다. 코드 + DB 룩업만으로. AI가 필요 없다.
**Layer 2**는 현실 데이터(93.2%)가 9-field 기준에 안 맞기 때문에, LLM이 데이터를 "정리"해서 Layer 1에 넣을 수 있게 만들어주는 역할이다.

경쟁사: AI가 HS Code를 "추측" → 89% 한계 (Tarifflo 최고)
POTAL: AI가 데이터를 "정리"하고, 코드가 HS Code를 "확정" → 100%

**AI의 역할이 완전히 다르다.** 경쟁사는 AI가 답을 내는데, POTAL은 AI가 질문을 정리하고 코드가 답을 낸다.

### 2. "코드로 단순 매칭이 아님 — LLM이 문장을 이해해서 선택" — 이게 왜 중요한지

상품명 예시: "European and American New Retro High-quality Gorgeous Exquisite Versatile Dynamic Green Cute Dragon Pendant Necklace"

**코드가 할 수 있는 것**: "pendant"라는 키워드가 사전에 있으면 → Heading 7117 매칭. 없으면 → 매칭 실패. 코드는 "European", "Gorgeous", "Dragon"이 뭔지 모른다. 문장을 이해 못한다.

**LLM이 할 수 있는 것**: "Dragon Pendant Necklace"를 읽고 → "이건 목걸이 펜던트, 장식용 보석류" 라고 이해한다. 그래서 CATEGORY_TO_SECTION 128개 목록을 보고 "jewelry"를 선택할 수 있다.

**그래서 Layer 2에서 코드로 키워드 매칭을 먼저 시도하는 건 의미가 없다.** 셀러들이 상품명에 모든 정보를 뒤죽박죽 몰아넣기 때문에, 코드가 "pendant"를 찾아도 그게 material인지 product type인지 description인지 구분 못한다. LLM만이 문장 전체를 이해하고 올바른 field에 배치할 수 있다.

### 3. category가 material보다 먼저인 이유

Ablation 결과 (466조합 × 50상품 = 23,300회 검증):
- product_name + material + category = **98% HS6 정확도**
- material만 빠져도 = **Section -55%**

material이 가장 중요하지만, **material을 정확히 선택하려면 category가 먼저 있어야 한다.**

예시: 상품 = "pendant necklace", material 원본 값 = "alloy"
- category 없이 "alloy"만 보면 → Section XIV(보석)? Section XV(비금속)? 판단 불가
- category = "jewelry" 가 먼저 확정되면 → "alloy" + "jewelry" = Section XIV(보석) 확정

또 다른 예: 상품 = "yoga mat", material = "foam"
- category 없이 "foam"만 보면 → Section VII(플라스틱)? Section XX(스포츠)? 판단 불가
- category = "sports" 가 먼저 확정되면 → "foam" + "sports" = Section XX 또는 VII 판단 가능

**그래서 매핑 순서는:**
1. product_name (앵커 — 고정)
2. **category** (CATEGORY_TO_SECTION 128개에서 — material 판단의 맥락 제공)
3. **material** (MATERIAL_KEYWORDS 79그룹에서 — product_name + category 기반으로 선택)
4. description (+2% → HS6 100%)

### 4. v3이 왜 실패했는지 — 전체 강제의 함정

**v2 (material만 강제)**: Section 57%, Chapter 46%, HS6 8% ← 최적
**v3 (모든 field 법적 기준 강제)**: Section 49%(-8%p), Chapter 39%(-7%p), HS6 5%(-3%p) ← 오히려 하락!

원인: LLM한테 모든 field에 "이 목록에서만 골라라"고 제약을 걸면:
- LLM이 product_name을 과도하게 자름 ("pendant necklace"만 남기고 나머지 키워드 버림)
- 남은 키워드가 부족해서 material/category 추론이 부정확해짐
- processing, composition, weight_spec까지 강제하니 프롬프트가 너무 복잡해져서 LLM 혼란

**v2가 최적인 이유**: material만 79그룹에서 강제 선택하고, 나머지 7개 field는 LLM이 자유롭게 채우게 둔다. 이러면:
- product_name의 유용한 키워드가 보존됨 (LLM이 자유롭게 배치)
- material만 법적 기준에 맞으면 Section/Chapter가 정확해짐 (+22%p)
- 나머지 field는 LLM의 문장 이해 능력에 맡기는 게 더 정확함

### 5. 셀러가 한 필드에 모든 정보를 몰아넣는 패턴

현실의 상품 데이터:
```
product_name: "European and American New Retro High-quality Gorgeous Exquisite Versatile Dynamic Green Cute Dragon Pendant Necklace"
product_attributes: {"Origin":"Mainland China", "Material":"Alloy", "Gender":"Unisex"}
category: Jewelry & Accessories > Fashion Jewelry > Pendants
```

여기서 product_name에 소재(alloy 관련 힌트 없음), 스타일(retro, gorgeous), 색상(green), 상품유형(pendant, necklace), 지역(European, American)이 전부 섞여있다.

Layer 2의 역할은 이 뒤죽박죽 데이터를 9-field에 올바르게 재배치하는 것:
- product_name: "pendant necklace" (핵심 상품명만)
- material: "alloy" (attributes에서 + 79그룹 강제)
- category: "jewelry > pendants" (category 데이터에서)
- description: "retro, green, dragon" (나머지)
- origin_country: "CN" (attributes에서)

이 재배치를 **코드가 아니라 LLM이 해야 하는 이유**: 코드는 "Gorgeous"가 description인지 material인지 구분 못함. LLM은 문장을 읽고 "Gorgeous는 형용사 → description" 이라고 판단 가능.

### 6. 9-field 중 법적 기준이 있는 것 vs 없는 것

| 필드 | 법적 기준 | Layer 1 파일 | Layer 2 처리 |
|------|---------|-------------|-------------|
| product_name | ❌ 없음 | - | 고정 (앵커). 없을 수가 없음 |
| **category** | ✅ **WCO 97 Chapter** | CHAPTER_DESCRIPTIONS 97개 (chapter-descriptions.ts) | **기존 데이터 먼저 매핑 → 안 되면 LLM 판단** |
| **material** | ✅ **WCO 21 Section** | MATERIAL_KEYWORDS 79그룹 | **✅ 규칙 기반** (79그룹에서만) |
| **origin_country** | ✅ **ISO 3166** | 240개국 코드 | ✅ 규칙 기반 (2자리 코드) |
| **composition** | ✅ **HS Subheading** | codified_subheadings 5,621개 | ⚠️ 연결 필요 (아직 안 됨) |
| **price** | ✅ **WTO 관세평가** | 숫자 (USD) | 숫자 추출만. 빈 값 불가 (상품이면 가격 있음) |
| processing | ⚠️ 부분적 | PROCESSING_KEYWORDS 50개 | 자유 (v2 기준) |
| weight_spec | ⚠️ 부분적 | 세관 신고서 필수 | ⚠️ 기준 파일 확인 필요 |
| description | ❌ 자유 텍스트 | WCO Heading descriptions | 자유 |

**⚠️ 이전 오류 정정**: category의 법적 기준은 "❌ 플랫폼마다 다름"이 아니라 **"✅ WCO 97 Chapter"**. chapter-descriptions.ts에 97개 전부 코드화돼 있음. 21 Section = material 기준, 97 Chapter = category 기준.
**⚠️ "강제"가 아니라 "규칙"**: WCO 97 Chapter와 21 Section은 "목록에서 골라라"가 아니라 누구나 따라야 하는 국제 규칙.

### 7. 현실 데이터 상황

- 9-field 완벽 = **현실에서 6.8%만** (벤치마크에서 확인)
- 나머지 **93.2%가 Layer 2 대상** = 이게 실제 비즈니스
- Layer 1은 "이상적 정답" (디폴트), Layer 2는 "현실 서비스" (매출)
- 프로덕션: Make가 Supabase에서 코드화 목록 읽고 → LLM API에 전달 → 9-field 반환 → POTAL API 호출

### 8. LLM은 파일을 직접 못 읽는다

LLM은 프롬프트에 들어온 텍스트만 볼 수 있다. "파일을 읽어라"는 불가능.
**코드가 파일을 읽어서 프롬프트에 넣어주는 방식**:
1. 코드가 step0-input.ts에서 MATERIAL_KEYWORDS 79그룹 추출
2. 추출한 내용을 LLM 프롬프트 텍스트에 포함
3. LLM은 프롬프트 안의 목록을 보고 선택

프로덕션에서는: Make가 Supabase에서 코드화 목록 읽음 → LLM API 프롬프트에 포함 → LLM 선택 → POTAL API

---

## Layer 구조

```
Layer 1: 9-field 완벽 → HS Code 100% (절대값, 코드+DB, AI 0회)
         → 절대 수정 금지. 추가만 가능.
Layer 2: 불완전 입력 → LLM이 법적 기준으로 9-field 매핑 → Layer 1에 전달
         → Layer 1 위에 덧씌우는 전처리 레이어
Layer 3: 9-field 자체가 없는 데이터 → custom 변환 → Layer 1에 전달
         → Enterprise Custom 전용, 미시작
```

---

## Layer 2 매핑 순서 (확정)

```
1. product_name (앵커 — 고정, 셀러가 정한 상품명. 없을 수가 없음)
2. category (WCO 97 Chapter 규칙 기반 — material 판단의 맥락)
   → ⚠️ 기존 데이터에 category가 있으면 먼저 WCO Chapter에 매핑 시도
   → 매핑되면 확정 (LLM 불필요)
   → 매핑 안 되면 LLM이 product_name 이해 후 판단
3. material (MATERIAL_KEYWORDS 79그룹 = WCO 21 Section 규칙 — product_name+category 기반)
4. description (+2% → HS6 100%)
--- 여기까지 HS6 100% 달성 ---
5~9. processing, composition, weight_spec, origin_country, price (7~10자리용)
```

---

## Layer 2 프로세스 (상세)

```
⭐⭐⭐ 핵심 원칙: 이미 있는 데이터를 먼저 활용한다 ⭐⭐⭐
→ LLM은 "없는 데이터를 채우는" 역할이지, "있는 데이터를 다시 고르는" 역할이 아니다
→ v4/v5에서 이 원칙을 어겨서 실패함 (category가 100% 있는데 LLM한테 새로 고르라고 함)

1. 모든 상품정보(product_name, attributes, category 등)를 키워드화
   → 코드로 처리, LLM 불필요

2. ⭐ 이미 있는 field를 먼저 확인하고 법적 기준에 매핑 시도
   → category 데이터가 있으면 → WCO 97 Chapter(chapter-descriptions.ts)에 매핑
     예: "Jewelry & Accessories > Fashion Jewelry > Pendants" → Ch.71 매핑
   → material 데이터가 있으면 → MATERIAL_KEYWORDS 79그룹에 매핑
     예: attributes에 "Alloy" 있으면 → "alloy" (Section XV)
   → origin_country 데이터가 있으면 → ISO 코드로 변환
   → price 데이터가 있으면 → USD 숫자 추출
   → 매핑 성공한 field는 확정. LLM 불필요.

3. 매핑 안 된 field만 LLM이 처리
   → LLM이 product_name을 읽고 이해 (앵커)
   → category 미확정이면 → LLM이 product_name 이해 후 WCO 97 Chapter 규칙에 따라 판단
   → material 미확정이면 → product_name + category 조합으로 79그룹에서 판단
   → description 등 나머지 → LLM이 자유롭게 채움

4. 최종 9-field → Layer 1에 전달

⚠️ "있는 데이터 무시하고 LLM이 전부 처리" (X) — v4/v5 실패 원인
⚠️ "있는 데이터 먼저 매핑 → 안 된 것만 LLM이 판단" (O) — 올바른 구조
⚠️ "강제"가 아니라 "규칙" — WCO 97 Chapter / 21 Section은 국제 규칙
```

---

## 다음 할 일 (우선순위)

### P0: git push (CW18 5차 변경사항)
- 10개 파일 수정 + 5개 문서 동기화 → push

### P1: Layer 2 v8 실험
- v7 코드교집합+LLM 방식에서 **Layer 1에 confirmed_chapter 직접 전달** (Step 2 건너뛰기)
- v7 standalone Chapter 52% → Layer 1 통과 시에도 52% 유지 목표

### P2: Layer 2 완성 — "기존 데이터 먼저 활용" 구조로 재설계 + 벤치마크
**Layer 2 = 실제 서비스 (93.2%의 현실 데이터 처리).**

⭐ **v1~v6 실험에서 배운 것**:
- v2 (material만 규칙 기반) = HS6 최적 (S57%/Ch46%/H19%/HS6=8%)
- v6 (WCO raw text) = Section 최고 (S65%) but HS6에서는 v2보다 못함 (6% vs 8%)
- category를 LLM이 새로 고르게 하면 → 무조건 하락 (v4: -2%p, v5: -2%p, v3: -3%p)
- **근본 원인**: HSCodeComp 632건에 category가 100% 있는데 이걸 무시하고 LLM한테 새로 고르라고 함
- **LLM Chapter 자체 정확도 = 39%**. LLM이 97개 Chapter에서 올바른 걸 고르는 것 자체가 어려움
- v6 에러 5패턴: LLM실수(41%), 경계혼동(26%), 카테고리오도(21%), material의존(9%), 정보부족(0%)
- **핵심 오분류 패턴**: Ch.96→39(15), Ch.61→62(13), Ch.84→90(11) — 인접 Chapter 경계가 가장 큰 문제
- WCO 법적 기준(v5) > POTAL 임의 키워드(v4) — 법적 규칙이 더 나은 건 맞음 (Ch 42% vs 37%)

⭐ **다음 해야 할 것**:
- **기존 category 데이터를 먼저 WCO 97 Chapter에 매핑** (LLM이 새로 고르지 X)
- HSCodeComp 632건의 AliExpress 5단계 category → Ch.XX 매핑 테이블 만들기
- 매핑된 category + material 규칙 기반 → 벤치마크
- composition → codified_subheadings 5,621개 연결 (아직 안 됨)
- weight_spec 국제 기준 파일 확인
- description 법적 기준 (WCO Heading descriptions)

⭐ **절대 반복하면 안 되는 실수**:
- 데이터에 이미 있는 field를 무시하고 LLM한테 새로 고르라고 하는 것
- "강제"로 프레이밍하는 것 — WCO는 강제가 아니라 규칙

### P1: Layer 3 설계 (Enterprise Custom)
### P2: 12개 TLC(Total Landed Cost) 통합 테스트 — 12개 계산 영역(HS Code + 관세 + VAT + De Minimis + 수수료 + 환율 등)을 하나의 API 요청으로 통합
### P3: 프로덕션 아키텍처 — Make → Supabase → LLM API → POTAL API

---

## 읽어야 할 파일
1. `CLAUDE.md` — 전체 맥락 + 절대 규칙 12개
2. `session-context.md` — 세션 히스토리
3. `.cursorrules` — 코딩 표준 + Layer 구조
4. `POTAL_Claude_Code_Work_Log.xlsx` — 작업 로그 (특히 시트 `2603220200` = Cowork 대화 인사이트)
5. `POTAL_Ablation_V2.xlsx` — 벤치마크 오류 시 대조 (절대 규칙 12번)

## 벤치마크 오류 시
- 반드시 `POTAL_Ablation_V2.xlsx` 대조 (CLAUDE.md 절대 규칙 12번)
- Section 떨어지면 → material 문제
- Chapter 떨어지면 → material 세부/processing 문제
- Heading 떨어지면 → KEYWORD_TO_HEADINGS 사전 부족
- material은 21 Section 기준 79그룹 안의 값만 유효
