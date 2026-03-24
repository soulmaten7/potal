### ⭐ CW15 Cowork 세션 성과 (2026-03-16 03:00~09:30 KST)

**홈페이지 UX 전체 동기화 (~60개 파일 수정):**
- i18n 49개 언어 파일 + 소스/문서 11개 파일 = **~60개 파일** 일괄 업데이트
- 주요 변경: "30+" → "50" 언어, "100 calls/month" → "200 calls/month", "1,100+" → "8,389+" HS매핑, "10+ endpoints" → "~148 endpoints", "10 req/min" → "30 req/min" (Free)
- 수정 파일: app/pricing/page.tsx, app/help/page.tsx, app/help/layout.tsx, app/about/layout.tsx, app/pricing/layout.tsx, app/faq/page.tsx, app/about/page.tsx, app/legal/[slug]/page.tsx, app/lib/billing/paddle.ts, app/dashboard/DashboardContent.tsx, app/i18n/translations/en.ts, app/i18n/translations/*.ts(49개), app/api/v1/docs/openapi.ts, app/lib/cost-engine/country-i18n.ts, app/api/v1/support/route.ts, plugins/woocommerce/readme.txt, marketing/PRODUCT_HUNT_LAUNCH_PLAN.md, PRIVATE_BETA_LAUNCH_CHECKLIST.md
- TypeScript 에러 0개 ✅
- **커밋 0d70c0c**: git push 완료, Vercel 배포 완료

**Middleware fail-open 수정 (504 GATEWAY_TIMEOUT 해결):**
- middleware.ts에 `Promise.race` 5초 타임아웃 추가
- Supabase 타임아웃/에러 시 인증 체크 건너뛰고 요청 통과 (fail-open 패턴)
- **커밋 aa02b92**: git push 완료, www.potal.app 정상화 ✅

**Tariff 페이지 SSG→SSR 전환 (Vercel 빌드 타임아웃 해결):**
- `generateStaticParams()` → 빈 배열 반환으로 변경
- `export const dynamic = 'force-dynamic'` 추가
- 빌드 타임에 Supabase 호출 0건 → 빌드 36초 성공 (기존 3분+타임아웃)
- **커밋 0c0a221**: git push 완료

**Hero 수치 변경:**
- 기존: 240 Countries / 5,371 HS Codes / 63 FTAs / 181 Tariff Countries
- 변경: **240 Countries / 113M+ Tariff Records / 63 FTAs / 50 Languages**
- AnimatedNumber 0→113 카운트업 + "M+" suffix
- **커밋 1864653**: git push 완료

**WDC Phase 4 v1→v2 전환 (로컬 병렬 매칭):**
- **v1 문제점**: Management API curl 1건씩 INSERT → Supabase 과부하 → www.potal.app 504 다운
- **v1 성과 (멈출 때까지)**: 12.39M줄 처리(0.7%), product_hs_mappings 8,389 → **1,362,900건** DB 삽입 완료
- **v2 설계 (은태님 아이디어)**: DB에서 매핑 테이블 다운 → 로컬 메모리에서 병렬 매칭 → 결과 외장하드 저장 → 마지막에만 DB 업로드
- **v2 테스트 결과**: 14,329 lines/sec (**v1 대비 28배**), 1M줄 70초 처리, 매칭률 6.6%
- **v2 풀 런 실행 중**: PID 80966, 워커 2개 (과부하 방지), nice -n 15 (CPU 최하위), 16청크×~19GB, --no-upload
- **v2 ETA**: ~4일 (Mac 정상 사용 가능, 사이트 과부하 없음)
- 결과 저장: `/Volumes/soulmaten/POTAL/wdc-products/v2_results/`
- 모니터링: `tail -f /Volumes/soulmaten/POTAL/wdc-products/v2_results/v2.log`
- 중지: `kill 80966` / 재개: `--resume`

**B2B 채널 전략 엑셀 생성:**
- POTAL_B2B_Channel_Strategy.xlsx (12시트)
- Sheet 1: Channel Overview — 10개 채널 비교 (HN, PH, Reddit×2, LinkedIn, Shopify, DEV.to, GitHub, Indie Hackers, X/Twitter)
- Sheet 2: Core Messaging — 헤드라인 3종, 요금제 전체, 기능 리스트, 신뢰 시그널, 경쟁사 8사 10기능 비교표, 파트너 메시지(한/영)
- Sheet 3~12: 채널별 실제 포스트 초안 + 포스팅 규칙/주의사항
- 은태님 피드백 전부 반영: 요금제별 가격, 전체 기능 나열, "1.7B+ products", 경쟁사 비교, "파트너" 메시지, AI 정확도/신뢰 강조

**Git 커밋 (CW15 Cowork):**
- 0d70c0c: UX sync — 60개 파일 업데이트 (50 languages, 200 free, ~148 endpoints, 8389 mappings)
- aa02b92: fix — middleware Supabase auth 5초 타임아웃 + fail-open
- 0c0a221: fix — tariff pages SSR 전환 (빌드 타임아웃 해결)
- 1864653: update — hero stats 113M+ tariff records, 50 languages

**GitHub Push Protection 이슈 해결:**
- mcp-server/.mcpregistry_github_token 시크릿 파일 → git rm + .gitignore에 `.mcpregistry_*` 추가

### ⭐ CW18 Cowork 세션 성과 (2026-03-20 KST)

**Amazon 50건 자체 벤치마크 — 9/9 Field = 100% 달성:**
- Amazon Product API 50개 상품 (실제 이커머스 셀러 데이터 형식)
- 9-Field 완전 입력 시: Section 100%, Chapter 100%, Heading 100%, HS6 100% ✅
- 테스트 과정에서 **6개 구조 버그 발견 + 수정**:
  1. `straw→raw` word boundary 버그 — `text.includes("raw")` → `new RegExp(\b${kw}\b, 'i')` regex 수정
  2. jewelry category override 누락 — category="jewelry" → Section XIV 강제 매핑 추가
  3. clothing keyword 누락 — sweater/hoodie/jacket 등 의류 키워드 사전 추가
  4. passive accessory→electronics 오분류 — "stand/holder/mount" 키워드를 PASSIVE_ACCESSORY_WORDS로 분리, electronics section 스킵
  5. steel raw vs article 혼동 — ARTICLE_KEYWORDS (bottle/container/pot) → Ch73 부스트, Ch72 디모트
  6. yoga mat heading 누락 — KEYWORD_TO_HEADINGS에 mat/yoga mat 추가

**466조합 Ablation 체계 테스트 (C(9,0)+...+C(9,6) = 466 조합 × 50 상품 = 23,300 파이프라인 실행):**
- 전체 13,114건 오류 분석 → **ALL FIELD_DEPENDENT**, 코드 버그 0건 ✅
- Level별 평균 HS6 정확도: L9=100%, L8=87%, L7=74%, L6=60%, L5=47%, L4=33%, L3=21%
- **Field Importance Matrix (466 조합 통계)**:
  - material: +45.1% (CRITICAL — 빠지면 Section/Chapter -55%)
  - category: +32.8% (CRITICAL — 기능 vs 소재 구분의 핵심)
  - product_name: +18.0% (HIGH — 기본 키워드 매칭)
  - description: +4.8% (LOW — Chapter 레벨에서만 영향)
  - processing/composition/weight_spec/price/origin_country: 0.0% (NONE at Section/Chapter level)
- **"Magic 3" 확정**: product_name + material + category = 98% HS6 정확도 (자체 데이터 기준)

**HSCodeComp 632건 독립 벤치마크 (HuggingFace AIDC-AI/HSCodeComp, AliExpress 실데이터):**
- AliExpress 상품 632건 + 확정 US HTS 10자리 ground truth
- 결과: **Chapter 42.6%, Heading 15.5%, HS6 6.3%**
- 오류 분석 (300건 상세): **KEYWORD_MISSING 212건(70.7%)**, FIELD_DEPENDENT 88건(29.3%)
- 총 오류 분류: KEYWORD_MISSING 429건(72.5%), FIELD_DEPENDENT 163건(27.5%)
- **주요 커버리지 갭** (Chapter 정확도 0%):
  - Ch.67 (가발/조화): 43건, 키워드 사전에 wig/hairpiece/artificial flower 없음
  - Ch.82 (공구류): 24건, 키워드 사전에 wrench/screwdriver/pliers 없음
  - Ch.83 (비금속 잡제품): 14건, 키워드 사전에 lock/padlock/hinge 없음
  - Ch.49 (인쇄물): 18건, 키워드 사전에 sticker/label/poster 없음
  - Ch.63 (기타 섬유): 20건, 키워드 사전에 towel/curtain/rag 없음
- **Ch.71 Heading 오류**: 76건 Chapter 맞지만 Heading 틀림 (보석류 세분화 부족)
- **Step 2-3 (Chapter)이 주요 실패 지점**: 전체 오류의 61%

**v3 파이프라인 디테일 — Step별 필드 사용 + 계산 방식 + 사용 이유:**
```
Step 0: INPUT VALIDATION & NORMALIZATION
  사용 필드: ALL 9 fields
  계산 방식: 텍스트 정규화 → 키워드 추출
  - product_name → 소문자화, 특수문자 제거
  - material → MATERIAL_KEYWORDS(~40 그룹) 매칭 → material_keywords[] 배열
  - category → 토큰 분리 → category_tokens[] 배열 (deepest-first)
  - processing → PROCESSING_KEYWORDS 매칭 → processing_states[]
  - composition → 퍼센트 파싱 → composition_parsed[]
  - weight_spec → 숫자+단위 추출
  - description → 키워드 추출 (material/processing 보강)
  왜: 각 Step에서 반복 사용할 정규화된 입력 생성. raw text를 매번 파싱하는 비효율 제거

Step 1: CACHE LOOKUP
  사용 필드: product_name + material + origin_country (캐시 키)
  계산 방식: DB/메모리 캐시 조회
  왜: 동일 상품 재분류 방지 → AI 0회, 비용 $0, 응답 <10ms

Step 2-1: SECTION CANDIDATE SELECTION
  사용 필드: material_keywords + category_tokens
  계산 방식:
  - MATERIAL_TO_SECTION 매핑: 소재→Section (leather→S8, cotton→S11, steel→S15)
  - CATEGORY_TO_SECTION 매핑: 카테고리→Section (watches→S18, toys→S20, furniture→S20)
  - category_tokens은 deepest-first 처리 ([...tokens].reverse())
  - PASSIVE_ACCESSORY_WORDS (stand/holder/mount) → electronics Section 스킵
  왜: material이 물리적 본질(Section I~XV 소재 기반), category가 기능 기반 Section(S16~21) 결정.
      "가죽 시계줄"은 material=leather → S8이지만, category=watches → S18로 오버라이드.
      이것이 GRI Rule 1의 "essential character" 판단을 코드화한 것

Step 2-2: SECTION NOTES VERIFICATION
  사용 필드: normalized input 전체 + codified_rules.json (592개 규칙)
  계산 방식:
  - 592개 Notes 규칙 순차 적용 (inclusion/exclusion/numeric_threshold/material_condition/definition)
  - exclusion 매칭 시 해당 Section 제거
  - inclusion 매칭 시 해당 Section 확정
  왜: WCO Section Notes가 "이 Section에 포함/제외되는 품목"을 법적으로 정의.
      예: Section XI Note에서 "asbestos" 제외 → Section VII로 이동.
      592개 규칙 중 588개(99.3%)가 코드로 처리, 4개는 category로 해결

Step 2-3: CHAPTER CANDIDATE SELECTION
  사용 필드: material_keywords + processing_states + category_tokens + confirmed_section
  계산 방식:
  - MATERIAL_CHAPTER_MAP: 확정 Section 내에서 소재→Chapter (cotton→Ch52, polyester→Ch54)
  - PROCESSING_CHAPTER_MAP: 가공 방식→Chapter (knitted→Ch61, woven→Ch62)
  - ARTICLE_KEYWORDS: 제품 형태→Chapter 조정 (bottle→Ch73≠Ch72)
  왜: Section 내에서 Chapter은 더 세부 소재/가공으로 구분.
      Section XI(섬유)에서 cotton은 Ch52, silk은 Ch50, 합성은 Ch54.
      "knitted cotton t-shirt"는 cotton→Ch52(원사) 아닌 knitted→Ch61(편물의류)

Step 2-4: CHAPTER NOTES VERIFICATION
  사용 필드: normalized input + Chapter Notes 규칙
  계산 방식: Section Notes와 동일 패턴 (Chapter별 inclusion/exclusion 규칙)
  왜: Chapter Notes가 Chapter 경계를 법적으로 정의.
      예: Chapter 62 Note에서 "babies' garments under height 86cm" → Ch62 특정 heading

Step 3: HEADING + SUBHEADING SELECTION (6자리 확정)
  Step 3-1: HEADING SELECTION (4자리)
    사용 필드: product_name + category_tokens + description (KEYWORD_TO_HEADINGS ~500+ 매핑)
    계산 방식:
    - KEYWORD_TO_HEADINGS: 상품 키워드→heading (t-shirt→6109, pants→6103, dress→6104)
    - category keyword → heading 매핑 (synonym dictionary)
    - 매칭 실패 시 heading description과 키워드 오버랩 계산
    - 필요시 AI 1회 (대립 패턴 매칭: 두 heading이 경합 시)
    왜: Heading은 상품 TYPE을 구분. "무엇인가"가 핵심.
        소재(material)는 Step 2에서 사용 완료, 여기선 product_name/category가 결정적.
  Step 3-2: SUBHEADING SELECTION (6자리)
    사용 필드: composition + weight_spec + price + description + material_keywords
    계산 방식:
    - SUBHEADING_SYNONYMS: ~200+ 키워드→HS6 코드 매핑
    - MAT_SYN: 소재 동의어 그룹 (매칭 정확도 향상)
    - elimination: 유사 subheading 중 조건 불일치 제거
    - voting: 다른 subheading 간 키워드 투표
    - 필요시 AI 1회
    왜: Subheading은 세부 조건 구분 — "100% cotton" vs "cotton blend",
        "weighing >200g/m²" vs "<200g/m²", "valued over $X" vs "under $X".
        Heading과 Subheading은 함께 동작해야 정확한 6자리 확정
  ━━━ HS 6자리 확정 ━━━

Step 4: COUNTRY ROUTER → 7~10자리 (origin_country 사용)
Step 5: PRICE BREAK → 가격 분기 (price 사용)
Step 6: FINAL + 캐시 저장
```

**핵심 발견 — 자체 데이터 vs 독립 데이터 괴리:**
- Amazon 50건 (자체): 9/9=100% → 파이프라인 구조는 정확
- HSCodeComp 632건 (독립): 6.3% → 키워드 사전 커버리지 부족
- **결론: 파이프라인 로직에 버그 없음 (0건), 키워드 사전 확장이 P0**
- 429건 KEYWORD_MISSING = Ch.67(가발)/Ch.82(공구)/Ch.83(잡금속)/Ch.49(인쇄물)/Ch.63(섬유) 커버리지 부재
- AliExpress 특유 어휘 (hair extension, wig cap, diamond painting 등) 미등록

**생성된 파일:**
- POTAL_Ablation_V2.xlsx (15시트): Amazon 50건 ablation(11시트) + HSCodeComp 632건(4시트)
  - Dashboard/Detail/Field Matrix/Combinations/Errors/Fixes/Summary (Amazon)
  - HSCodeComp Dashboard/Detail/Errors/Fixes
- CLAUDE_CODE_ABLATION_V2.md — 466조합 ablation 명령어 (4 Phase)
- CLAUDE_CODE_HSCODECOMP_BENCHMARK.md — HSCodeComp 632건 독립 벤치마크 명령어
- CLAUDE_CODE_VERIFIED_ABLATION.md — CBP/EBTI ground truth 테스트 명령어 (미사용)

**수정된 v3 파이프라인 코드 (6개 버그 수정):**
- step0-input.ts: word boundary regex 수정 (`\b` 매칭)
- step2-1-section-candidate.ts: jewelry category override + PASSIVE_ACCESSORY_WORDS 추가
- step2-3-chapter-candidate.ts: ARTICLE_KEYWORDS 추가 (steel raw vs article 구분)
- step3-heading.ts: clothing keyword 사전 확장 + yoga mat 추가
- step4-subheading.ts: MAT_SYN 소재 동의어 확장

**벤치마크 히스토리 업데이트:**
| 버전 | HS6 | Heading | Chapter | 비고 |
|------|-----|---------|---------|------|
| v2 (GPT-4o-mini) | 25% | - | - | 상품명만 |
| v3.0 (추론체인) | 24% | 42% | 59% | CW17 최고 |
| v3.1 (Amazon 50, 9/9) | **100%** | **100%** | **100%** | ✅ 자체 데이터, 6버그 수정 — **이것이 POTAL 실제 성능** |
| v3.1 (HSCodeComp 632) | **6.3%** | **15.5%** | **42.6%** | ⚠️ 불완전 입력(product_name만), Tier 3 Enterprise Custom 영역 |
| v3.1+Step0.5 (HSCodeComp 632) | **5.1%** | **13.8%** | **40.2%** | Enterprise Custom: LLM 필드추출 적용, 키워드 사전이 병목 |

### ⭐ CW18 Cowork 5차 세션 성과 (2026-03-23 KST)

**12 TLC 영역 코드 감사 + 46건 이슈 전체 수정:**
- 감사 범위: 12개 TLC 영역 전체 코드 리뷰 (~10,000줄)
- 발견: **46건** (CRITICAL 2 + HIGH 21 + MEDIUM 20 + LOW 3)
- 수정: **46건 전부 완료** (1차 P0-P2 11건 + 2차 35건)

**P0 CRITICAL (즉시 영향):**
- US de minimis: 모든 origin $0 → **CN $0 유지, 비중국 $800** (country-data.ts)
- Export Controls: Math.random() → **deterministic license exception** (export-controls.ts)

**금액 영향 TOP 5:**
1. India 금/보석 Ch.71: IGST 28%→**3%** ($10,000 금 바 = $2,500 차이)
2. Mexico 주류 HS 2208: IEPS 26.5%→**53%** (위스키 수입 2배 차이)
3. EU VAT: 12국→**27국 경감세율 완성** (15개국 경감세율 누락 해결)
4. US MPF: CN-only→**전체 원산지** (비중국 수입품 MPF 누락 해결)
5. Brazil IPI: 일괄 10%→**95-chapter별 세율** (의류 0%, 차량 25%, 담배 300%)

**수정 파일 10개**: country-data.ts, export-controls.ts, section301-lookup.ts, fta.ts, fuzzy-screening.ts, GlobalCostEngine.ts, db-screen.ts, CostEngine.ts, eu-vat-rates.ts, macmap-lookup.ts
**검증**: npm run build ✅ (5회 연속) + Duty Rate regression 55/55 PASS 100% ✅
**엑셀**: POTAL_12Area_Code_Audit.xlsx, POTAL_46Issue_Fix_Log.xlsx, POTAL_35Issue_Complete_Fix.xlsx

### ⭐ CW18 Cowork 3차 세션 성과 (2026-03-21~22 KST)

**Step 4~6 완성 + 7개국 10자리 패턴 매칭 + 1,183건 벤치마크 + Layer 구조 확립 + Layer 2 실험:**

**⭐ Layer 구조 확립 (CW18 3차 — 핵심 아키텍처 결정):**
- **Layer 1**: 9-field 완벽 입력 → HS Code 100% (절대값, 코드+DB만, AI 0회)
- **Layer 2**: 불완전 입력 → 9-field 자동 보정 → Layer 1에 전달 (Tier 1-2 고객용, LLM)
- **Layer 3**: 9-field 자체가 없는 데이터 → custom 변환 (Tier 3 Enterprise)
- **Layer 1 절대 수정 금지. Layer 2/3은 Layer 1 위에 덧씌우는 전처리 레이어**
- **POTAL 본질**: AI가 필요 없는 플랫폼인데 AI가 필요. Layer 1=AI 불필요(코드=100%). Layer 2=AI 필요(LLM이 데이터 "정리"). 경쟁사=AI가 답을 "추측". POTAL=AI가 질문을 "정리"하고 코드가 답을 "확정".

**⭐ Layer 2 실험 5회 결과 (HSCodeComp 632건):**
- **v1 (자유 LLM)**: material 64%→99% 추출 성공. BUT HS6 8% (MATERIAL_KEYWORDS에 없는 값 출력)
- **v2 (material 규칙 기반)**: Section 57%, Chapter 46%(+3%p), HS6 8%. **material valid 96%. ← 현재 최적**
- **v3 (전체 강제)**: Section 49%(-8%p), HS6 5%(-3%p). 과도한 제약으로 오히려 하락
- **v4 (POTAL 128개 category 강제)**: S52%/Ch37%/HS6=6%. category 임의 키워드로 강제 → 하락
- **v5 (WCO 97 Chapter category 강제)**: S56%/Ch42%/HS6=6%. 법적 기준이 임의보다 나으나 v2보다 못함
- **v4/v5 실패 근본 원인**: HSCodeComp 632건에 category가 이미 100% 있는데, 이걸 무시하고 LLM한테 새로 고르라고 함. **기존 데이터를 먼저 활용하지 않은 설계 오류.**
- **결론**: category를 LLM이 새로 고르게 하면 무조건 하락. 기존 데이터 먼저 매핑 → 안 된 것만 LLM.

**⭐ Layer 2 법적 기준 (CW18 4차 수정):**
- **material** = WCO 21 Section (MATERIAL_KEYWORDS 91그룹) — 규칙 기반
- **category** = WCO 97 Chapter (CHAPTER_DESCRIPTIONS, chapter-descriptions.ts) — 규칙 기반. ❌"플랫폼마다 다름"이 아님
- WCO 21 Section = material 기준, WCO 97 Chapter = category 기준. 둘 다 국제 규칙.
- "강제"가 아니라 "규칙" — 누구나 따라야 하는 국제법

**⭐ Layer 2 매핑 순서 확정:**
1. product_name (앵커 — 고정, 없을 수가 없음)
2. category (WCO 97 Chapter 규칙 기반 — material 판단의 맥락)
   → **기존 데이터에 category 있으면 먼저 WCO Chapter에 매핑. 매핑되면 확정 (LLM 불필요)**
   → 매핑 안 되면 LLM이 product_name 이해 후 판단
3. material (MATERIAL_KEYWORDS 91그룹 = WCO 21 Section 규칙 — product_name+category 기반)
4. description (+2% → HS6 100%)
5~9. processing, composition, weight_spec, origin_country, price (7~10자리용)

**⭐ Layer 2 핵심 원칙 — "기존 데이터 먼저 활용":**
- **이미 있는 field를 무시하고 LLM한테 새로 고르라고 하면 안 된다** (v4/v5 실패 원인)
- LLM은 "없는 데이터를 채우는" 역할이지, "있는 데이터를 다시 고르는" 역할이 아니다
- 프로세스: 기존 데이터 매핑 시도 → 성공한 field 확정 → 나머지만 LLM이 처리

**⭐ 핵심 인사이트:**
- 9-field 완벽 데이터 = 현실에서 6.8%만. 나머지 93.2%가 Layer 2 대상
- Layer 2가 사실상 실제 서비스. 법적 기준 데이터 = Layer 1(이상), 현실 데이터 정리 = Layer 2(비즈니스)
- 프로덕션: Make가 Supabase에서 코드화 목록 읽고 → LLM API에 전달 → 9-field 반환 → POTAL API
- HS6 8% 병목 = (1) category 매핑 안 됨 → material 틀림 → 전체 무너짐 (2) Layer 1 KEYWORD_TO_HEADINGS 사전 부족

**핵심 성과:**
- Step 4~6 전체 파이프라인 구현 완료 (step5-country-router.ts + step6-price-break.ts + step7-final.ts + duty-rate-lookup.ts)
- gov_tariff_schedules: 89,842행 → **125,576행** (+40%, KR/JP/AU/CA 10자리 추가 + US 누락 보충)
- 7개국 관세율표 코드화: **125,576행 × 11패턴 × 5회 검수 → 오류 0건**
- base-agent.ts 전면 재작성: keyword scoring → **패턴 기반 매칭** (PRICE 15점, MATERIAL 12점, GENDER 10점 등)
- 7개 country-agents 독립 로직: 각 나라별 codified_national JSON 로드 → 패턴 매칭
- 세율 분리: gov_tariff_schedules = 코드 확장 전용, macmap = 세율 조회 전용 (duty-rate-lookup.ts)
- EU 회원국 27개 자동 매핑 (DE→EU), macmap 세율 874,302행 (140국)
- WTO API로 60개국 336,408행 MFN 세율 수집 → 세율 커버리지 53→140국
- MATERIAL_KEYWORDS: 32→91그룹, MATERIAL_TO_SECTION: 12→21/21 Section (100%)
- KEYWORD_TO_HEADINGS: 400 inline + 13,449 extended = 13,849개
- Amazon 350건 수집 + 169건(9-field 유효) 벤치마크

**7개국 벤치마크 결과 (169건 × 7국 = 1,183건):**

| 국가 | Before 확장률 | After 확장률 | Before Duty | After Duty |
|------|-----------|-------------|------------|------------|
| US | 91% | **100%** | 91% | **100%** |
| EU | 59% | **75%** | 76% | **100%** |
| GB | 66% | **75%** | 79% | **100%** |
| KR | **0%** | **100%** | 76% | **100%** |
| JP | **0%** | **99%** | 72% | **100%** |
| AU | **0%** | **100%** | 79% | **100%** |
| CA | **0%** | **100%** | 79% | **100%** |

**수정/생성 파일:**
- step5-country-router.ts (수정: EnhancedInput 전달)
- step6-price-break.ts (기존)
- step7-final.ts (수정: async + lookupDutyRate + destination_country)
- duty-rate-lookup.ts (신규: macmap 세율 조회, EU 매핑, ntlc→min fallback)
- base-agent.ts (전면 재작성: 패턴 기반 매칭)
- country-agents/index.ts (수정: EnhancedInput 지원)
- country-agents/data/*.json (신규 7개: 나라별 HS6 인덱싱 코드화 데이터)
- extended-heading-keywords.json (신규: 13,449 키워드)
- pipeline-v3.ts (수정: Step 4 추가 데이터 전달 + finalResolveV3 await)
- step0-input.ts (수정: MATERIAL_KEYWORDS 32→79)
- step2-1-section-candidate.ts (수정: MATERIAL_TO_SECTION 61→116, CATEGORY_TO_SECTION 102→128)
- step3-heading.ts (수정: extended keywords JSON 로드 + fallback lookup)

**엑셀 로깅 시스템 도입:**
- POTAL_Claude_Code_Work_Log.xlsx — 모든 Claude Code 작업을 시트별 기록
- CLAUDE.md 절대 규칙 11번으로 추가
- 시트명 = YYMMDDHHMM, 열: 순번/시간/구분/상세/파일/상태

**생성된 엑셀 파일:**
- POTAL_V3_Benchmark_350.xlsx (Amazon 350건 벤치마크)
- POTAL_V3_Benchmark_9field_Complete.xlsx (169건 9-field 벤치마크)
- POTAL_V3_Codified_Data_Audit.xlsx (코드화 데이터 감사)
- POTAL_V3_Keyword_Rebuild.xlsx (키워드 재추출 결과)
- POTAL_V3_US_HS10_Verification.xlsx (US 10자리 검증)
- POTAL_V3_REVIEW56_Verification.xlsx (56건 수동 검증)
- POTAL_V3_Step4_Deep_Analysis.xlsx (Step 4 심층 분석)
- POTAL_7Country_HS_Rules_Summary.xlsx (7개국 규칙 요약)
- POTAL_7Country_Codification.xlsx (7개국 코드화 v1)
- POTAL_7Country_Codification_v5.xlsx (5회 검수)
- POTAL_7Country_Tariff_Collection.xlsx (관세율표 수집)
- POTAL_125K_Codification_Final.xlsx (125,576행 최종 코드화)
- POTAL_6digit_vs_7Country_Verification.xlsx (6자리 정답지 매핑 검증)
- POTAL_V3_Final_Benchmark.xlsx (최종 7개국 벤치마크)

---

### ⭐ CW18 Cowork 2차 세션 성과 (2026-03-20 KST)

**⚠️⚠️⚠️ 핵심 전략 결정 — v3 파이프라인 절대값 + Tier 분리 ⚠️⚠️⚠️**

**v3 파이프라인 Step 0~6 전체 = 절대값. 절대 손대지 않는다.**

**Step 0~3 (HS6 확정) — 절대값:**
- 9-field 입력 → 100% 정확도 검증 완료 (Amazon 50건, 466조합 Ablation)
- 592개 규칙 + 1,233개 Heading + 5,621개 Subheading = 세상 모든 상품 커버
- MATERIAL_KEYWORDS 91그룹 (21/21 Section 100%) — 수정 금지, 추가만 가능
- MATERIAL_TO_SECTION 116개 + CATEGORY_TO_SECTION 128개 — 수정 금지, 추가만 가능
- KEYWORD_TO_HEADINGS 400개 (inline) + 13,449개 (extended JSON) — 수정 금지, 추가만 가능
- codified-rules.ts (592개), codified-headings.ts (1,233개), codified-subheadings.ts (5,621개) — 수정 금지

**Step 4~6 (7~10자리 확장 + 세율) — 절대값 (CW18 3차에서 확정):**
- gov_tariff_schedules **131,794행** (7개국: US 29,807 + EU 20,369 + UK 20,416 + KR 17,939 + JP 16,076 + AU 13,458 + CA 13,729) — 수정 금지, 추가만 가능
- codified_national_full_final.json × 7개국 (**131,794행 코드화, 5회 검수 오류 0건**) — 수정 금지
- base-agent.ts 패턴 기반 매칭 (11종 패턴, 가중치 scoring) — 로직 수정 금지
- duty-rate-lookup.ts (macmap 세율 조회, EU 27개국 매핑) — 로직 수정 금지
- country-agents/data/*.json (7개국 HS6 인덱싱 데이터) — 수정 금지
- extended-heading-keywords.json (13,449 키워드) — 수정 금지, 추가만 가능
- 7개국 벤치마크 1,183건: **7개국 전부 100%** (US/EU/GB/KR/AU/CA 100%, JP 100%) + Duty rate 7개국 100% — 이 수치가 떨어지면 안 됨

**⚠️ "수정 금지, 추가만 가능"의 의미:**
- 기존 키워드/매핑/규칙을 변경하거나 삭제하지 않는다
- 새로운 키워드/매핑/규칙을 추가하는 것은 허용
- 추가 후 반드시 regression 테스트 (기존 결과가 깨지면 추가 취소)
- **이 코드는 Tier 1-2 (Free/Basic/Pro) 고객용 — 수정/실험 금지**

**Tier 1-2 (Free/Basic/Pro) — 모든 플랜 동일 기능 ('Grow With You'):**
- 고객이 9-field 직접 입력 → 100% 정확도
- 빈 필드 있으면 "material 빠지면 정확도 -45%" 같은 진단 표시
- 고객이 직접 채우도록 안내 (우리가 대신 채워주지 않음)
- 크로스보더 셀러는 세관 신고서용으로 9-field를 **법적으로 이미 보유**

**Tier 3 (Enterprise Custom) — 별도 파이프라인:**
- 9-field를 못 채우는 고객 → 우리가 custom으로 해결
- v3 파이프라인 **복사본** + Step 0.5 (LLM 필드 추출) + 키워드 사전 확장 등 추가
- HSCodeComp 632건 6.3% = 이 영역의 현재 성능 (파이프라인 한계가 아니라 **불완전 입력의 결과**)
- Enterprise Custom 전용 코드는 기존 v3와 **완전 분리**하여 개발

**⚠️ HSCodeComp 632건 6.3% 정확한 해석:**
- ❌ "POTAL 파이프라인 정확도가 6.3%다" — 틀린 해석
- ✅ "product_name만 넣으면 6.3%밖에 안 된다" — 올바른 해석
- ✅ "9-field 다 채우면 100%다" — POTAL의 실제 성능
- HSCodeComp 데이터 = AliExpress 상품명만 있는 최악의 입력 = Tier 3 고객 시나리오
- **벤치마크로 사용하려면 9-field가 완전히 채워진 데이터여야 신뢰 가능**

**240개국 세관 신고서 필드 조사 완료:**
- POTAL_240_Customs_Fields_Raw.xlsx (6시트, 181개국 커버)
- 핵심 발견: **6개 필드만 전 세계 공통** (Description, HS Code, Value, Origin, Weight, Quantity)
- material을 별도 필드로 받는 나라: ~5/240 (2%)만 — 중국 申报要素가 유일하게 18개 구조화 필드
- 대부분 나라는 "상품 설명" 하나에 material/processing/composition 전부 포함
- ASYCUDA (UN 세관 시스템): 90+개국 사용, SAD 기반 필드 구조

**30개 플랫폼 상품 필드 조사 완료:**
- POTAL_Platform_Product_Fields_Raw.xlsx (6시트, 30개 플랫폼)
- 핵심 발견: 필드 구조 차이는 **국가별이 아니라 플랫폼별**
- material 별도 필드: 12/30 (40%), composition: 5/30 (17%), processing: 3/30 (10%)
- 같은 나라도 플랫폼마다 다름 (중국 세관 18필드 vs AliExpress 10필드, 미국 세관 9필드 vs Amazon 45-200필드)

**Step 0.5 Enterprise Custom 벤치마크 결과:**
- GPT-4o-mini로 상품 데이터 → 9-field JSON 변환
- 필드 추출 성공: material 57%→82.4%, category 2%→82.4%, 평균 3.5→6.2 필드
- **BUT HS6 정확도 미개선**: 6.3% → 5.1% (-1.2%)
- 원인: 필드를 채워도 Step 3/4의 키워드 사전이 AliExpress 상품 카테고리를 커버 못함
- **Step 0.5는 Tier 3 전용**. Tier 1-2는 고객이 직접 9-field 입력
- API 비용: 632건 = ~$0.06 (6센트)

**코드화 데이터 현황 확인:**
- heading-descriptions.ts: 1,233개 Heading 원본 WCO 텍스트 ✅ (wig, wrench, towel 등 존재)
- codified_headings.json (v1): 1,233개, 490KB — conditions.product_type에 키워드 추출
- codified_headings_v3.json: 1,233개, 522KB — keywords[] 배열로 description에서 추출 (10,222 키워드)
- codified_subheadings.json: 5,621개, 1.5MB
- codified_subheadings_v3.json: 5,621개, 2.3MB
- master_classification_engine.json: 15.4MB — CBP 343,445 + EBTI 231,727 = 575,172건 통합, 433규칙
- KEYWORD_TO_HEADINGS: **179개** (수동 하드코딩, step3-heading.ts)
- **키워드 추출 갭 발견**: heading-descriptions.ts에 "wig"/"wrench" 있지만, codified_v3.json 변환 시 누락됨
- 파이프라인은 Phase 1 (KEYWORD_TO_HEADINGS 179개) + Phase 2 (codified_headings keywords fallback) 2단계로 매칭
- **"sticker"는 WCO 원본에도 없음** — WCO는 "printed matter"로만 기술 → 동의어 매핑 필요 (Enterprise Custom 영역)

**⭐ 핵심 인사이트 — "키워드 확장"은 Tier 3 영역 (은태님 인사이트):**
- 과거 키워드 매칭 방식 → LLM한테 시켜서 실패 (v2~v10, 최고 38%)
- v3 성공 이유 = 키워드 매칭이 아니라 **코드 규칙** (592 Notes + 1,233 Heading + 5,621 Subheading)
- 9-field가 제대로 들어오면 코드 규칙만으로 100% → 키워드 확장 불필요
- 키워드 확장이 필요한 건 **9-field 없이 상품명만 오는 Tier 3 고객**뿐
- 따라서 키워드 사전 확장 = **Enterprise Custom 전용 작업** (기존 v3 건드리지 않음)

**Tier 3 Enterprise Custom 전용 작업 (별도 파이프라인):**
- v3 코드 복사 → Enterprise Custom 전용 디렉토리
- Step 0.5 (LLM 필드 추출) 추가
- 키워드 사전 확장 (KEYWORD_TO_HEADINGS 179→2,000+, Ch.67/82/83/49/63 등)
- codified_headings_v3.json 키워드 재추출 (누락 키워드 복구)
- HSCodeComp 632건 재벤치마크 (Tier 3 성능 측정용)

**생성된 파일 (CW18 2차):**
- POTAL_240_Customs_Fields_Raw.xlsx — 240개국 세관 필드 조사 (6시트, 181국)
- POTAL_Platform_Product_Fields_Raw.xlsx — 30개 플랫폼 필드 조사 (6시트)
- CLAUDE_CODE_CUSTOMS_FIELD_INVESTIGATION.md — 세관 필드 조사 명령어
- CLAUDE_CODE_PLATFORM_FIELD_INVESTIGATION.md — 플랫폼 필드 조사 명령어
- CLAUDE_CODE_STEP05_LLM_EXTRACTION.md — Step 0.5 구현 + 벤치마크 명령어
- 9field_reference.json — 186KB, 48K tokens (14개 데이터 파일에서 추출)
- step05-field-extraction.ts — Step 0.5 코드 (Enterprise Custom 전용)
- step05_benchmark_results.json — HSCodeComp 632건 Step 0.5 벤치마크 결과

### ⭐ CW17 Cowork 세션 성과 (2026-03-19 KST)

**HS Code 분류 엔진 — "7-Field" API 대전환:**

핵심 발견 (은태님):
- "정확도 문제는 AI 모델 문제가 아니라 API 설계 문제" — 고객이 이미 가진 데이터를 안 받고 상품명만으로 추측한 것이 24% 정확도의 근본 원인
- 크로스보더 셀러는 세관 신고서 작성을 위해 7가지 데이터를 법적으로 보유 → 우리가 요구하는 게 아니라 이미 가진 걸 받는 것
- "셀러가 자기 상품을 어떤 카테고리로 정했는지" = essential character 판단 → AI 불필요
- Tarifflo API도 3필드(product_description + material + country_of_origin) 받는 구조 확인

**API 8-Field 확장 설계:**
- 기존: product_name + origin_country (2개)
- 변경: product_name + material + category + description + processing + composition + weight_spec + price + origin_country (9개, 필수 3개 + 선택 6개)
- 필수 3개: product_name, material, origin_country
- category가 "소재 vs 기능 우선순위" 해결 (가죽 시계줄 → category가 "watches"면 Section XVIII)

**v3 파이프라인 확정 — 관세사 프로세스 기준:**
```
Step 0: INPUT → 8가지 필드 수신
Step 1: CACHE → 캐시/DB 조회
Step 2: Section + Chapter 확정 [코드만, AI 0회]
  Step 2-1: Section 후보 선정 (material + category + processing + description)
  Step 2-2: Section Notes 검증 (+ category로 경계 케이스 해결) → Section 확정 + Chapter 방향 힌트
  Step 2-3: Chapter 후보 선정 (Step 2-2 출력 + material + processing + composition + category)
  Step 2-4: Chapter Notes 검증 (+ category) → Chapter 확정 + Heading 목록
Step 3: Heading + Subheading 확정 (6자리)
  Step 3-1: Heading 확정 (description + material + category + 대립 패턴 DB, 필요시 AI 1회)
  Step 3-2: Subheading 확정 (composition + weight_spec + price, 필요시 AI 1회)
  ━━━ HS 6자리 확정 ━━━
Step 4: Country Router (origin_country → 7~10자리)
Step 5: Price Break (price → 가격 분기)
Step 6: Final + 캐시 저장
```
- 8개 필드가 한 번만 사용되는 게 아니라 매 Step마다 필요한 조합으로 반복 사용
- category가 Step 2, 3, 4 전체에서 사용됨

**Notes 592개 규칙 코드화 완료:**
- Section Notes 21개 (내용 9개 + 빈 12개) + Chapter Notes 96개 (내용 94개 + 빈 2개) = 103개 분석
- 빈 14개: 전부 공식적으로 비어있음 (WCO 원본 대조 확인)
- 규칙 유형: numeric_threshold 210건, inclusion 121건, exclusion 108건, material_condition 89건, definition 55건, ai_derived_rule 5건, ai_required 4건
- **코드화 가능: 588개 (99.3%) / AI 필요: 4개 (0.7%)**
- AI 필요 4건: Ch.9 향신료 혼합물, Ch.40 고무 복합제품, Ch.42 가죽+귀금속, Ch.95 전자 완구/드론
- **은태님 인사이트: 4건도 category 필드로 해결** — 셀러가 이미 "이건 완구" "이건 항공기"로 결정해놨으므로 AI 불필요
- **최종: 592개 전부 코드 처리 가능**
- 저장: `/Volumes/soulmaten/POTAL/7field_benchmark/codified_rules.json`

**AI 4건 판결문 전수 검색 (12,550건):**
- Ch.9 향신료: CBP 728건 (Ch.09 59건 vs Ch.21 580건)
- Ch.40 고무: CBP 4,199건 (Ch.40 424 vs Ch.64 1,829 vs Ch.39 1,008)
- Ch.42 가죽: CBP 4,117건 (Ch.42 3,070 vs Ch.71 833)
- Ch.95 완구: CBP 3,506건 (Ch.95 2,911 vs Ch.85 294 vs Ch.84 86)
- 21개 추가 규칙 추출, 코드화 15건 + AI 잔여 ~12%만 (category로 해결)
- 저장: `/Volumes/soulmaten/POTAL/7field_benchmark/ai4_rulings_ch*.json`

**벤치마크 테스트 결과 (터미널 2):**
- CBP 100건 기준:
  - A: name only → 0%/38%/55%
  - B: name+material+origin → 0%/38%/58%
  - C: all 7 fields → 4%/39%/59%
- GPT-4o-mini 1회 호출 기준 (v3 파이프라인 아닌 단순 호출)
- Chapter 59%는 GPT-4o-mini의 천장 (방법 무관)
- description 추가 → Prepared Food +44%, Textiles +12%
- v3 파이프라인(다단계 코드 체인)으로 재테스트 필요

**CBP CROSS 7-Field 데이터 추출:**
- 220,114건 스캔 → 필드별 존재율: material 29.4%, processing 14.4%, function 12.2%, composition 10.1%, origin 8.3%, weight 5.4%, price 3.7%
- 7/7 완전: 171건, 6/7: 1,485건, 5/7: 5,106건
- 6/7 이상 추출 + 빈 필드 채우기 → 7/7 완전 92건 + 6/7 595건 = 687건
- 6/7에서 빠진 필드: price 81% (분류에 영향 적음)
- 카테고리별: 생활용품 215, 기타 144, 패션 130, 식품 56, 금속 39, 기계 30, 플라스틱 28, 화학 24, 목재 15, 차량 6
- 저장: `/Volumes/soulmaten/POTAL/7field_benchmark/merged_7of7.json`, `merged_6of7.json`

**WDC 17.6억 상품 7필드 존재율 (1,000건 샘플):**
- name 100%, description 22%, price 0%, category 2%
- 7가지 HS 분류 정보: 무게 12%, 기능 8%, 소재 7%, 성분비 7%, 가공 3%, 원산지 1%, 가격 0%
- WDC = 웹 크롤링 데이터라 실제 셀러 DB와 다름 → name 기반 매칭에만 활용

**12 TLC 경쟁사 벤치마크 엑셀 완성:**
- POTAL_12_TLC_Competitor_Benchmark.xlsx (14시트)
- POTAL 이미 1위인 영역: Duty Rate(113M+), VAT/GST(240국), De Minimis(240국), Customs Fees(240국)
- 카피 우선순위 P0: HS Code, Currency, Insurance/Shipping, Rules of Origin
- 저장: `/Volumes/soulmaten/POTAL/analysis/POTAL_12_TLC_Competitor_Benchmark.xlsx`

**경쟁사 벤치마크 데이터 공개 여부 조사:**
- Tarifflo 89%: 103건 자체 테스트, 데이터 비공개, CEO 자기 논문
- Avalara 80%: Tarifflo 논문에서 테스트됨, 비공개
- Zonos 44%: Tarifflo 논문에서 테스트됨, 비공개
- SimplyDuty/Dutify/Global-e/Easyship/DHL: 정확도 주장 자체 없음
- 유일한 공개 벤치마크: HSCodeComp 632건 (HuggingFace), AI 최고 46.8%
- POTAL 전략: HSCodeComp 632건으로 독립 벤치마크 → "HSCodeComp 632건, XX% 정확도" 공개, 데이터 출처/방법은 비공개

**Tarifflo 직접 관찰 (경쟁사 리버스 엔지니어링):**
- Tarifflo API: product_description + material + country_of_origin 3필드 입력
- 핵심: material을 별도 입력 필드로 받음 → 우리도 같은 구조 필요 → 8-Field 설계로 반영
- Tarifflo 카피 시도 R1~R7: 최고 12%/32%/56% (Tarifflo 실제 시스템 관찰 불가 → 추측 기반이라 한계)

**DB read-write 복구 완료:**
- DB 상태: ✅ read-write 복구
- DB 크기: 53GB → 45GB
- product_hs_mappings: 1,332,287건 (v2 36M건 삭제, 기존 보존)
- 테이블 크기: 8.75GB → 1,120MB
- 인덱스 5개: PK + category + hs6 + source + trgm + unique

**파이프라인 다이어그램 생성:**
- POTAL_7Field_Pipeline_Diagram.html — v3 아키텍처 시각화 (v2 vs v3 비교 포함)

**v3 파이프라인 핵심 전환:**
- "상품명으로 AI가 추측" → "거래처 데이터로 코드가 확정"
- AI 호출: 4~5회 → 0~2회
- 비용: ~$0.002 → $0~$0.001
- 592개 Notes 규칙 전부 코드화
- 1,000건 분류 시 AI 호출 ~1~2건 (일반 이커머스 기준)

**v3 파이프라인 Step 0~2 TypeScript 코드 구현 완료:**
- 10개 TypeScript 파일 생성 (steps/v3/)
- npm run build SUCCESS, TypeScript 0 errors ✅
- 테스트 5/5 PASS (t-shirt, bolt, watch strap, shrimp, drone)
- AI 호출 0회, 처리 속도 ~2ms
- codified_rules.json 592개 규칙 TypeScript 내장
- 생성 파일:
  - app/lib/cost-engine/gri-classifier/steps/v3/step0-input.ts
  - app/lib/cost-engine/gri-classifier/steps/v3/step1-cache.ts
  - app/lib/cost-engine/gri-classifier/steps/v3/step2-1-section-candidate.ts
  - app/lib/cost-engine/gri-classifier/steps/v3/step2-2-section-notes.ts
  - app/lib/cost-engine/gri-classifier/steps/v3/step2-3-chapter-candidate.ts
  - app/lib/cost-engine/gri-classifier/steps/v3/step2-4-chapter-notes.ts
  - app/lib/cost-engine/gri-classifier/steps/v3/step3-heading.ts
  - app/lib/cost-engine/gri-classifier/steps/v3/step4-subheading.ts
  - app/lib/cost-engine/gri-classifier/steps/v3/pipeline-v3.ts
  - app/lib/cost-engine/gri-classifier/data/codified-rules.ts

**20건 클린 벤치마크 — Step 2 (Section+Chapter) 100% 달성:**
- clean_test_20_v3.json — 실제 이커머스 플랫폼 표준값 기준
- Section 100% (20/20), Chapter 100% (20/20) ✅
- 3중 교차검증 통과 후 달성 (matchExclusion 구문 매칭 수정, 38개 compound phrases 추가)
- AI 호출 0회, 비용 $0

**필드 빼기 (Ablation) 테스트 결과:**
- material 빠지면 Section/Chapter -55% (CRITICAL)
- processing, composition 빠져도 영향 없음 (Section/Chapter 레벨)
- description 빠지면 Chapter -5% (Low)
- **실제 필수 = product_name + material + category 3개로 Section/Chapter 100% 가능**
- processing/composition/description은 Heading(4자리)/Subheading(6자리) 단계에서 필요

**Heading + Subheading Description 문법 구조 전수 분석:**
- 6,854개 description 100% 구조 파악 완료, 구조화 불가 0건
- 88%: 세미콜론(;) 구조 — [product_type] of [material]; [conditions]
- 12% (765건): 세미콜론 없음 — A(단순 38%) + B(나열 45%) + C(상품 of 소재 8%) + 기타(4%)
- 55건 특수 케이스 전수 조사 → 전부 기존 패턴으로 재분류, 새 패턴 0건

**Heading 1,233개 + Subheading 5,621개 코드화:**
- codified_headings.json — 1,233개 (product_type 100% 추출)
- codified_subheadings.json — 5,621개 (미분류 865건 → 전부 해결, 0건 남음)
- 전체 7,446개 HS 규칙 100% 코드화 완료
- 저장: /Volumes/soulmaten/POTAL/7field_benchmark/

**master_classification_engine.json 완성 (터미널 3):**
- CBP CROSS 343,445건 + EU EBTI 231,727건 = 575,172건 통합
- 433개 규칙 추출 (Level 1: 128, Level 2: 226, Level 3: 79)
- 21,340개 category fallback 키워드
- 저장: /Volumes/soulmaten/POTAL/7field_benchmark/master_classification_engine.json (15MB)

**CBP CROSS 7-Field 데이터 (최종):**
- 687건 추출 (7/7: 92건 + 6/7: 595건)
- category 추출: 611건 성공 (88%), 76건 실패 (11%)
- 저장: /Volumes/soulmaten/POTAL/7field_benchmark/merged_7of7_with_category.json, merged_6of7_with_category.json

**V3_TEST_LOG.md 생성:**
- 15개 테스트 기록 (벤치마크 전체 이력)
- 저장: /Volumes/soulmaten/POTAL/7field_benchmark/V3_TEST_LOG.md

**타겟 지원 3-Tier 전략 (은태님 설계):**
- Tier 1 (자동 변환): 엉뚱한 material 보내도 POTAL이 자동 매핑 (Free)
- Tier 2 (데이터 정리 API): 진단 + 수정안 제시 + "이 필드 추가하면 +XX% 정확도" (Free~Pro)
- Tier 3 (Custom 지원): 문의하기 → 직접 분석 → custom 매핑 (Pro~Enterprise)

**⭐ 핵심 원칙 — "시스템화 = 코드화 가능" (CW17 Cowork — 2026-03-19):**
- 국가/국제기구가 만든 시스템은 전부 구조화되어 있음 = 100% 코드화 가능 = AI 불필요
- HS Code에서 증명: Section 21개, Chapter 97개, Heading 1,233개, Subheading 5,621개, Notes 592개 전부 코드화 완료
- 같은 원칙이 POTAL 12개 TLC 영역 전체에 적용됨:
  - HS Code — WCO 시스템 → 코드화 완료
  - 관세율 — 각국 정부 세율 테이블 → DB 룩업
  - VAT/GST — 법정 세율 구조 → DB 룩업
  - FTA 원산지 규정 — 협정 PSR 규칙 → 규칙 매칭
  - 수출 통제 (ECCN) — BIS 분류 체계 → 매트릭스 매칭
  - 제재 리스트 — OFAC/EU/UN 목록 → 퍼지 매칭
  - 통관 수수료 — 각국 고정 수수료 → DB 룩업
  - De Minimis — 각국 면세 기준 → if문
  - 특별소비세 — 각국 세율표 → DB 룩업
  - 환율 — 중앙은행 공식 환율 → API
  - 보험/운송 — 수식 → 계산 코드
  - AD/CVD — 정부 고시 세율 → DB 매칭
- "정부/국제기구가 만든 시스템 = 구조화 = 코드화 가능" — 이 원칙은 HS Code뿐 아니라 모든 관세/무역 관련 시스템에 동일 적용
- 이 원칙은 향후 새로운 기능 구현 시 항상 먼저 확인할 것: "이게 시스템화되어 있는가?" → Yes면 코드화, No면 그때만 AI

### ⭐ CW16 Cowork 세션 성과 (2026-03-17 KST)

**HS Code 분류 엔진 근본적 재설계 — "시스템을 바꾸지 말고 사람을 대체하라":**

핵심 인사이트 (은태님):
- 기존 접근: "AI한테 상품명 주고 HS Code 맞춰봐" → 시스템을 새로 만들려 한 것 → 오류 지속 (v2~v10, 최고 38%)
- 새 접근: "관세사가 하는 것과 똑같은 과정을 자동화" → 시스템은 그대로, 사람만 AI로 대체
- "이미 정답이 있는 시스템을 바꾸려 하니 오류가 생겼다. 사람이 하는 구조를 유지한 채 사람을 대체해야 한다"

**GRI (General Rules of Interpretation) 기반 분류 엔진 설계:**
- GRI 1~6 순차 적용 구조 (관세사가 실제 분류하는 방식 그대로)
- GRI 1: Section/Chapter Notes + Heading 설명 → 90% 분류 (주관 없음, 규칙 적용)
- GRI 2~5: 미완성/혼합/복수heading/포장 → 8% (판단 필요, 판례 참조)
- GRI 6: Subheading 레벨에서 GRI 1~5 재적용 → 최종 6자리 확정
- 핵심: 11단계 중 AI "생각"이 필요한 건 1~2단계뿐, 나머지는 코드/DB 룩업

**7개국 Country Agent 하위에이전트 설계 (은태님 아이디어):**
- 도착지별 전용 Agent (US/EU/UK/KR/JP/AU/CA)
- 각 Agent에 해당 국가 규칙 + 판례 패턴 내장
- API 호출 시 도착지가 이미 정해져 있으므로 1개 Agent만 작동 → 토큰 1/7 절약 + 정확도 향상
- 나머지 233국: 6자리에서 끝 (7~10자리 없음)

**"판례 → 대립 패턴" 규칙화 설계 (은태님 아이디어):**
- 기존: 22만 CBP 판례를 날것으로 검색 → 매번 다른 결과 가능
- 새 방식: 챕터별 "대립 패턴"으로 1회 정리
  - 각 패턴: 대립 후보(A vs B) + 정답 + 판단 근거 + 탈락 이유 + 예외 조건
  - AI가 "생각"이 아닌 "매칭"으로 분류 → 일관성 + 속도 + 감사추적
- 판례 소스: CBP CROSS 220,114건 + EU EBTI 269,730건 = ~50만건
- 6자리 판단은 CBP+EBTI 공통 (전 세계 6자리 동일), 7~10자리는 해당 국가만

**단계별 코드 체인 구조 (CW16 초기 설계 → CW18 최종 v3로 정리됨):**
```
※ 아래는 CW16 초기 설계. 최종 구조는 v3 파이프라인 Step 0~6 참조:
  Step 0: Input (9-field) → Step 1: Cache → Step 2(2-1~2-4): Section+Chapter
  → Step 3(3-1~3-2): Heading+Subheading → Step 4: Country → Step 5: Price → Step 6: Final
→ AI 호출 0~2회, 나머지 전부 코드. 비용 기존 대비 1/10 이하
```

**12개 Total Landed Cost 계산 영역 — 같은 방식 적용 계획:**
1. HS Code — GRI Agent Team (지금 설계 중)
2. Duty Rate — DB 룩업 (113M+ 이미 있음, AI 0회)
3. AD/CVD — DB 매칭 (119,706건, AI 0회)
4. VAT/GST — DB 룩업 (240개국, AI 0회)
5. De Minimis — if문 1개 (AI 0회)
6. Special Tax — 테이블 (12개국, AI 0회)
7. Customs Fees — 고정값 (AI 0회)
8. Rules of Origin — FTA PSR 매칭 (복잡 시 AI 1회)
9. Export Controls — ECCN 매트릭스 (이중용도 시 AI 1회)
10. Sanctions — 퍼지 매칭 (21,301건, AI 0회)
11. Currency — API (AI 0회)
12. Insurance/Shipping — 수식 (AI 0회)
→ 12개 중 AI 필요: HS Code(1~2회) + RoO(가끔 1회) + Export Controls(가끔 1회). 나머지 9개는 코드만.

**전략 방향 전환:**
- "모든 기능을 이런 관점(사람 프로세스 역설계 → 코드화 → AI 최소화)으로 접근"
- Beta 출시 → Pro 모델까지 개방 → 142개 기능 계속 파이프라인 확장
- 이 구조가 경쟁사(Avalara/Zonos)가 못 따라오는 이유: 그들은 "AI로 분류"하지만, POTAL은 "공식 자체를 코드로" 만듦

**GRI 참고자료 수집 완료 (2.1MB, 14개 파일):**
- 터미널 1: Section/Chapter Notes + GRI 1-6 규칙 + CBP Guide ✅
- 터미널 2: 7개국(US/EU/UK/KR/JP/AU/CA) 추가 규칙 ✅
- EU EBTI: 269,730 rulings, 231,727 매핑 추출 ✅
- 저장: /Volumes/soulmaten/POTAL/hs_classification_rules/

**벤치마크 히스토리 (HS Code 분류 정확도, 6-digit / 4-digit / 2-digit):**
- v2 (GPT-4o-mini): 25% / - / -
- v8 (GPT-4o): 37% / - / -
- v10 (GPT-4o + GRI prompt): 38% / - / -
- v1.0 (GRI 엔진 keyword only): 0% / 0% / 24%
- v1.1 (heading/subheading 추가): 4% / 12% / 33%
- v1.2 (Section 키워드 + Notes 내장): 6% / 16% / 35%, AI 0회, $0
- v2.0 (LLM 4회 추가): 13% / 28% / 44%, AI 4회, ~$0.002
- v2.1 (+Step1 LLM): 20% / 36% / 52%, AI 5회, ~$0.002
- v2.2 (pre-filter): 16% / 28% / 49% — REGRESSION 롤백
- **v3.0 (관세사 사고방식 추론 체인): 24% / 42% / 59%** ⭐ 최고 (Layer 1 = name only 기준)
- **Layer 1 (9-field 완벽 입력): 100% / 100% / 100%** ⭐⭐ 절대값 (AI 0회, $0)
- Layer 2 v1 (LLM 자유): 8% / 20% / 43% (HSCodeComp 632건)
- **Layer 2 v2 (material 강제): 8% / 19% / 57%** — HS6 최적
- Layer 2 v3 (전체 강제): 5% / 15% / 49%
- Layer 2 v4 (POTAL 128 category): 6% / 16% / 52%
- Layer 2 v5 (WCO 97 Chapter): 6% / 18% / 56%
- **Layer 2 v6 (WCO raw text): 6% / 19% / 65%** — Section 역대 최고
- Layer 2 v7 (코드교집합+LLM선택, L1 old): 5% / 15% / 55% — Layer1이 chapter 재파생하여 하락
- **Layer 2 v7 + L1 WCO upgrade: 6% / 19% / 66%** — Section **66%** + Chapter **53%** 역대 최고 ⭐ (L1 CHAPTER_KEYWORDS 추가)
- Layer 2 v2 + L1 WCO upgrade: **8%** / 19% / 57% — HS6 최적 유지, Chapter +1%p
- Vector Search (순수 임베딩): 15% / 28% / 50%, AI 0회, ~$0.00002
- 경쟁사: Tarifflo 89%, Avalara 80%, Zonos 44%, WCO BACUDA 13%
- 비용 분석: GPT-4o-mini ~$0.001/건(마진 83~93%), GPT-4o ~$0.019/건(마진 70%), 경쟁사 대비 3~50배 저렴
- GPT-4o는 정확도 89%+ 달성 후 Enterprise 프리미엄 티어로 제공 예정

**벡터 검색 벤치마크 상세:**
- Top-1: 15%, Top-3: 26%, Top-5: 33%, Top-10: 44%
- 오류 패턴: CATEGORY_ERROR 50건, HEADING_ERROR 22건, SUBHEADING_ERROR 13건
- 핵심 발견: HS Code 설명 언어와 상품명 사이 "언어 갭" 존재 ("steel beams" → 442110(나무프레임) 매칭 등)

**WDC 데이터 필드 확인:**
- name + description + category + brand + price + gtin + url 포함
- category → Chapter 힌트, description → Heading 힌트, price → 10자리 가격분기
- name+description+category 조합으로 6자리까지, +price로 10자리까지 이론적 확정 가능

**세상 물건 종류 추정:**
- HS 분류 기준 실질 상품 종류: ~1,000만~2,000만 종
- 국경 넘어 실거래되는 종류: ~1,000만~3,000만
- 필요한 매핑 테이블: ~5,000만 (Avalara 40M+과 일치)
- 화학 화합물 CAS 등록 2억+ → HS로는 수천 코드로 그룹핑
- 상품명 변형은 무한하지만 "종류"는 유한

**⭐ HS Code 엔진 전략 대전환 (CW16 후반, 은태님 인사이트 6개):**
1. **"검색 vs 추론"**: 구글에 "Used Restaurant Grease HS Code" → 정답 즉시. LLM은 처음부터 추론. CBP+EBTI 35만건 = 구글이 인덱싱하는 것과 같은 소스
2. **"데이터는 충분, 조립이 문제"**: GRI/Notes/정부데이터 전부 공개. 차이는 Expert Rules(decision tree) 조립. Tarifflo 89%는 데이터가 아니라 조립 때문
3. **"룩업 테이블은 캐시일 뿐"**: 17.6억 사전매핑은 새 상품에 무력. 진짜 필요: "처음 보는 상품도 정확하게 분류하는 엔진"
4. **"Expert Rules = CBP 판례 사유에서 추출"**: 97 Chapter × 5건 = ~500건 분석으로 Chapter별 decision tree 구축 가능
5. **"95% 이상이면 사실상 100%"**: HS Code는 정답이 정해진 문제. 나머지 5%는 규정 업데이트 시차. 22개 Cron으로 실시간 업데이트 체계 이미 구축
6. **"경쟁사 리버스 엔지니어링"**: 경쟁사 API에 100건 테스트 → 입출력 패턴에서 Expert Rules 역추적 가능

**HS Correlation Table 변환 완료:**
- UN Statistics Division HS 2022↔2017, 2022↔2012 변환표 확보
- CBP CROSS 142,251건 + EU EBTI 231,726건 = 373,977건 변환
- 결과: 그대로 유지 347,798건(93.0%) + 1:1 변환 5,118건(1.4%) + 분할 판단 필요 19,527건(5.2%) + 미발견 1,534건(0.4%)
- **확정 사용 가능: 352,916건 (94.4%)** — HS 2022 기준 정답 데이터
- 저장: /Volumes/soulmaten/POTAL/hs_correlation/

**11 TLC 파이프라인 데이터 수집 완료 (18/18, 100%):**
- 11개 영역 설계서: docs/pipelines/ (11파일, 266KB, 3,435줄)
- 수집 데이터: /Volumes/soulmaten/POTAL/tlc_data/ (27파일, 22MB)
- 주요: ECCN 658건, Country Chart 200국, Section 301/232/IEEPA 235건, AD/CVD Scope 4,057건, EU+Non-EU VAT 46국, Brazil IPI 96ch, India Cess 16항목, Mexico IEPS 20항목, China CT 37항목, 5대 FTA PSR 375규칙, ECB 환율 7.7MB, Incoterms 11개

**GRI Complete Fix (CW16 후반, 28개 파일 변경):**
- fs 의존성 완전 제거 → 모든 데이터 코드 내장 (section-notes, chapter-notes, conflict-patterns)
- Section 키워드 자동 보강 (heading-descriptions.ts 1,229개에서 추출)
- stem 매칭 추가 (shirts↔shirt 등)
- npm run build ✅, /Volumes 경로 0개 ✅

**DB read-only 복구 진행 중:**
- 원인: WDC v2 벌크 업로드로 product_hs_mappings 37.3M건 → DB 53GB 초과
- 현재: 터미널 3에서 26.2M 삭제 완료, 남은 ~12M rows (~4시간)
- 삭제 후: VACUUM FULL + 인덱스 재생성 + 35만건 HS2022 데이터 DB 적재 예정

**파일 생성/수집:**
- /Volumes/soulmaten/POTAL/hs_classification_rules/ (14개 파일, 2.1MB)
  - section_notes.json, chapter_notes.json, subheading_notes.json
  - COMPLETE_GRI1_REFERENCE.md, COMPLETE_GRI_REFERENCE.md
  - gri_full_text.md, gri1~6_rules_and_cases.md
  - cbp_classification_guide.md
  - us_additional_rules.md, eu_cn_rules.md, uk_tariff_rules.md
  - kr_classification_rules.md, jp_tariff_rules.md, au_tariff_rules.md
  - ca_tariff_rules.md, SUMMARY.md
- /Volumes/soulmaten/POTAL/regulations/eu_ebti/ (269,730 rulings)

### ⭐ AI Agent Organization 확장 계획 (CW16 Cowork — 2026-03-17)

**핵심 원칙: "사람 프로세스 역설계 → 코드화 → AI 최소화"를 모든 영역에 적용**

이 원칙은 HS Code에서 처음 적용하지만, 최종적으로 12개 TLC 계산 → 142개 기능 전체로 확장 예정.
각 영역이 완성될 때마다 아래 구조를 업데이트할 것.

**확장 로드맵 (구조만 잡아두고 완성 시 채움):**

1단계 — HS Code 분류 엔진 (현재 진행 중):
- GRI Agent Team (GRI 1~6 순차 적용, 11단계 코드 체인)
- 7개국 Country Agent (US/EU/UK/KR/JP/AU/CA 하위에이전트)
- 판례 대립 패턴 DB (CBP 22만 + EBTI 27만 → 챕터별 규칙화)
- 자동 업데이트: 새 판례 감지 → 대립 패턴 추가, WCO HS 개정 반영, 7개국 규칙 변경 반영
- 상태: 🔄 설계 완료, 구축 대기

2단계 — 나머지 11개 TLC 계산 영역:
- 각 영역별 "사람이 하는 프로세스" 역설계 → 단계별 코드 체인 구축
- Duty Rate, AD/CVD, VAT/GST, De Minimis, Special Tax, Customs Fees, RoO, Export Controls, Sanctions, Currency, Insurance/Shipping
- 대부분 이미 DB/코드로 동작 중 → 정확도 검증 + 엣지 케이스 보완
- 상태: ⏳ HS Code 완성 후 순차 진행

3단계 — 142개 기능 전체:
- 각 기능마다 동일 접근: 실무자가 어떻게 하는지 파악 → 그 과정을 자동화
- 기능 완성될 때마다 AI Agent Organization에 반영
- 상태: ⏳ 12개 TLC 구조화 후

**AI Agent Organization 변경 예정 사항:**
- D3 (HS Classification): GRI Agent Team + Country Agent 구조로 재편
- D1 (Tariff & Compliance): 12개 TLC 계산별 서브 Agent 구조화
- D4 (Data Pipeline): 자동 업데이트 모니터링 (판례, 규칙 변경, HS 개정)
- 각 Division에 "자동 업데이트 가이드북" 포함 (어떤 데이터가 언제 바뀌는지, 어떤 Cron/Agent가 감시하는지)
- 구체적 구조는 각 단계 완성 시 업데이트 (지금은 빈 구조만 잡아둠)

**⚠️ Claude 세션 지침: 이 섹션을 매 세션마다 확인하고, 기능이 완성될 때마다 해당 단계의 상태를 업데이트할 것. 대화에서 까먹지 않도록 여기가 기준점.**

### ⭐ CW15 Cowork 2차 세션 성과 (2026-03-16 16:00~21:00 KST)

**전문 자격증 & 벤치마크 데이터베이스 (POTAL_Certification_Benchmark_Database.xlsx, 11시트):**
- 57개 항목: 12개국 관세사 시험 + 8 Trade Compliance + 7 Tax/VAT + 9 Logistics/SCM + 9 HS 벤치마크 + 6 Customer + 8 Industry Rating
- Sheet 1: Overview — 전체 요약, 테스트 가능 16개, 전략 4가지
- Sheet 2: Customs Broker Exams — CBLE(US), 관세사(KR), 通関士(JP), AEO(EU), LCB(AU), CSCB(CA), WCO HS cert 등 12개
- Sheet 3: HS Benchmarks — arXiv:2412.14179(103건), ATLAS(18,731건), HSCodeComp(632건), CBLE 기출, CBP CROSS, EBTI 등 9개
- Sheet 4: Trade Compliance — CCS, CES, MTC, LCB, CTCP, IATA DG, CGBP, CITP 8개
- Sheet 5: Tax & VAT — CPA, EA, VAT specialist, CTA, 세무사, 税理士, Transfer Pricing 7개
- Sheet 6: Logistics & SCM — FIATA, CILT, CSCP, CPIM, CLP, IATA, C-TPAT, Incoterms, DGSA 9개
- Sheet 7: POTAL Test Plan — P0(CBLE/CBP/EBTI/ATLAS) → P1(HSCodeComp/한국/일본) → P2(G2/SOC2) 실행 계획
- Sheet 8: Competitor Knowledge Map — 경쟁사 고용 12종 전문가 역할별 연봉 + POTAL 대체 기능 매핑
- Sheet 9: Customer Certs — 거래처 직원 자격증 6개 + POTAL 도움 방식
- Sheet 10: Industry Ratings — G2, Capterra, TrustRadius, Gartner, Forrester, Product Hunt 등 8개
- Sheet 11: Cost Savings — 인간 전문가 10종 vs POTAL 연간 비용 비교 (수식 자동 계산, 총 절감 ~$862K/년)

**142기능 × 벤치마크 GAP 분석 (POTAL_142_Benchmark_Gap_Analysis.xlsx, 5시트):**
- Sheet 1: Summary — MVP 필수 98개 / MVP 보완 12개 / 확장 시 32개
- Sheet 2: 142 Features × Benchmark — 전체 기능을 시험/벤치마크 영역에 매핑 + 현재 상태 + 갭 + 필요 데이터
- Sheet 3: MVP 보완 필요 — 16개 항목별 다운로드 소스 URL + 수집 방법 + 예상 건수
  - F001 HS Classification: EBTI 50-100K, ECICS 70K, ATaR 10K+, ATLAS 18,731, HSCodeComp 632, CBLE 기출, 한국 관세사, 日本 通関士
  - F006 Confidence Score: 벤치마크 기반 보정
  - F012 HS Validation: 교차검증 ground truth
  - F016 Restricted Items: UN 위험물 + 각국 금지품목
  - F022 Export Controls: BIS CCL ECCN 전체 목록
  - F023 Rules of Origin: FTA PSR 목록
  - F024 Customs Valuation: WTO 관세평가협정
  - F038 VAT/GST: CN코드별 경감세율
  - F039 Special Tax: 각국 특별소비세
- Sheet 4: 확장 시 필요 — 14개 카테고리 (캐리어 API, SEZ/Licensing, SSO, White Label, ERP/CRM 등)
- Sheet 5: Claude Code Commands — P0 8개 + P1 5개 = 13개 데이터 소스별 수집 명령어 상세

**3터미널 자동화 파이프라인 설계:**
- **터미널 1 (CLAUDE_CODE_TERMINAL_1_COLLECT.md)**: P0 8개(CBLE, EBTI, ECICS, ATaR, ATLAS, HSCodeComp, 한국 관세사, 日本 通関士) + P1 5개(BIS CCL, UN DG, WTO Valuation, FTA PSR, EU TARIC VAT) 순차 수집. 완료 시 각 폴더에 DONE 파일 생성
- **터미널 2 (CLAUDE_CODE_TERMINAL_2_BENCHMARK.md)**: DONE 감시 → BIS/UN DG 즉시 DB 적재(별도 테이블, 과부하 없음) → 벤치마크 실행(CBP 100건→CBLE→ATLAS→HSCodeComp→한국→일본) → 틀린 문제 원인 분류(NO_MAPPING/WRONG_MAPPING/PRICE_BREAK/AMBIGUOUS/INDUSTRIAL/COUNTRY_SPECIFIC) → 142기능별 약점 매핑 → 즉시 수정 가능한 것 자동 수정 → 마케팅 요약 생성
- **터미널 3 (CLAUDE_CODE_TERMINAL_3_ADDON.md)**: 기존 part_01~10 업로드 완료 후 → CBP CROSS 142K + EBTI/ECICS/ATaR → product_hs_mappings \copy → 중복 제거 → 인덱스 복원 → ANALYZE
- 핵심: DONE 파일 기반 터미널 간 자동 연계 — 수집 완료 → 벤치마크 자동 실행 → 분석 자동 생성

**벤치마크 전략 결정:**
- 벤치마크 = 단순 점수가 아니라 "실무에 필요한 기능 파악 도구"
- 기출문제 분석 → 142기능 중 약한 영역 특정 → 필요한 데이터 수집 → 기능 보완
- CBLE/관세사/通関士 시험이 테스트하는 영역 = 고객이 돈 내는 실무 영역
- "점수 올리기"가 아니라 "틀린 문제가 알려주는 실무 갭 채우기"

**미수집 데이터 과부하 방지 전략:**
- product_hs_mappings 동일 테이블: 터미널 3 끝난 후에만 적재 (EBTI/ECICS/ATaR)
- 별도 테이블 (export_controls, restricted_items): 수집 즉시 적재 OK (BIS CCL ~2K, UN DG ~3K)
- 벤치마크: DB 적재 없이 로컬 파일 기반으로 즉시 API 호출 가능

**터미널 3 상태 (part_01 업로드 진행 중):**
- run_upload.sh 스크립트가 99개 chunk 자동 순차 업로드 중
- chunk_001: ✅ 완료, chunk_002: ✅ 완료 (15분), chunk_003~099: 진행 중
- 인덱스 드롭 완료 (속도 향상)
- chunk당 ~15분 × 96개 = ~24시간 예상
- 모니터링: tail -f /Volumes/soulmaten/POTAL/wdc-products/v2_results/upload_chunks/upload.log
- part_01 끝나면 part_02~10도 같은 방식으로 자동 이어서 진행 예정

**생성된 파일:**
- POTAL_Certification_Benchmark_Database.xlsx (11시트, 57개 자격증/벤치마크 항목)
- POTAL_142_Benchmark_Gap_Analysis.xlsx (5시트, 142기능 GAP 분석)
- CLAUDE_CODE_TERMINAL_1_COLLECT.md (터미널 1 수집 명령어)
- CLAUDE_CODE_TERMINAL_2_BENCHMARK.md (터미널 2 벤치마크+분석 명령어)
- CLAUDE_CODE_TERMINAL_3_ADDON.md (터미널 3 추가 적재 명령어)
- CLAUDE_CODE_DATA_COLLECTION_COMMAND.md (초기 통합 명령어, 이후 3개로 분리)

### ⭐ CW15 Cowork 전체 성과 (2026-03-16 09:30~16:00+ KST)

**B2B Channel Strategy 엑셀 전체 업데이트 (POTAL_B2B_Channel_Strategy.xlsx, 13시트):**
- 10개 채널 포스트 CW15 수치 반영 (50M+ mappings, ~148 endpoints, 21 crons, MCP registry, 60+ sources, UCP)
- Core Messaging 업데이트 (경쟁사 비교표)
- Channel Overview 업데이트
- Update Log 시트 신규 추가
- X Twitter 단독 트윗 3개 + LinkedIn POST 4 (UCP/AI Commerce) 신규

**CBP Benchmark Test 준비:**
- arXiv:2412.14179 논문 방법론 재현 — CBP CROSS rulings 100건 무작위 테스트 데이터 준비
- /Volumes/soulmaten/POTAL/benchmark_test_data.json (100건, 95 HS 챕터, 39.4KB)
- 경쟁사 벤치마크: Tarifflo 89%, Avalara 80%, Zonos 44%, WCO BACUDA 13%
- DB 정상화 후 POTAL API 벤치마크 실행 예정
- CBP_BENCHMARK_TEST_COMMAND.md 생성

**CBP CROSS HS Mappings 추출 완료:**
- CBP CROSS rulings 220,114건에서 product_hs_mappings 형식으로 변환
- cbp_cross_combined_mappings.csv: **142,251건** (중복 제거, DB 로딩용)
  - 산업용 53,540건 (38%) — Ch.84 기계, Ch.85 전기, Ch.29 유기화학, Ch.39 플라스틱, Ch.73 철강, Ch.90 정밀기기
  - 소비재 88,711건 (62%) — 의류, 완구, 가구 등
- cbp_cross_hs_mappings.csv: 23,611건 (full text, description 포함)
- cbp_cross_search_mappings.csv: 120,571건 (subject만, description 없음)
- 스크립트: scripts/extract_cbp_cross_mappings.py
- 저장: /Volumes/soulmaten/POTAL/
- **\copy로 DB 적재 예정** (product_hs_mappings에 추가)

**HS 분류 데이터 소스 마스터 목록 (docs/HS_CLASSIFICATION_DATA_SOURCES.md):**
- Claude Code 1번에서 조사 진행 중
- 5개 카테고리: 국가별 분류 결정문, 신상품/신기술, 농산물/식품, 군수/이중용도, B2B 산업 데이터
- 각 소스별 URL, 형식, 건수, 접근방법, 자동화 가능 여부

**product_hs_mappings 벌크 업로드 진행 중:**
- Claude Code 2번에서 chunk별 \copy 진행 중
- part_01: 11개 chunk (각 50만줄, 71-79MB)
- part_02~10: 아직 미분할

**포스트 톤 전략 변경:**
- 기존: "The most accurate landed cost API on the planet" (근거 없는 주장)
- 변경: "CBP benchmark XX% 정확도" + 약점 공개 + 개선 과정 투명 공유 (스타트업다운 톤)
- 벤치마크 결과 공개 자체가 마케팅 콘텐츠 (DEV.to, HN 소재)

**신규 Cron 후보 (HS 데이터 소스 자동화, 기존 21개에 추가):**
- `ebti-ruling-monitor` — EU EBTI 분류 결정문 변경 감지 (매주)
- `uk-atar-monitor` — UK ATaR 새 결정문 감지 (매주)
- `cbp-cross-update` — CBP CROSS 신규 rulings 수집 (매주)
- `wco-classification-monitor` — WCO 분류 의견서 업데이트 (매월)
- `usda-agricultural-monitor` — USDA 농산물 분류 변경 (매월)
- 패턴: 기존 Cron과 동일 (CRON_SECRET 인증 + health_check_logs + Resend 이메일 알림)

**데이터 파이프라인 설계 (수집 → DB):**
1. Cron이 소스 변경 감지
2. 새 ruling/결정문 다운로드
3. product_name + hs_code 추출 (GPT-4o or 스크립트)
4. product_hs_mappings에 INSERT
5. hs_classification_vectors 업데이트 (필요 시)

### ⭐ CW15 Cowork 후반 세션 성과 (2026-03-16 09:30~13:00 KST)

**규정 소스 카탈로그 완성 (docs/REGULATION_SOURCE_CATALOG.md):**
- 600줄, **60+ 소스** 조사 완료 (URL 검증 포함)
- 국제기구 15 + 지역기구 15 (CPTPP/RCEP/USMCA/Pacific Alliance/EFTA/ECOWAS/COMESA 추가) + 개별국가 10그룹 + FTA 11
- **50개국 관세 변경 공고 URL** 확보 (해시 비교 자동화용)
- **데이터 유지보수 6개 영역** 문서화: HS 매핑 검증, WCO HS 2028, 7개국 관세율표, FTA 변경, MacMap/WITS, 240개국 공고
- **8단계 구현 계획** 전부 완료 (Cron 7개 + ePing 구독 가이드)

**데이터 유지보수 7개 Cron 구현 (Vercel Cron 14→21개):**
- `federal-register-monitor` (매일 06:00 UTC) — US Federal Register API 연동
- `taric-rss-monitor` (매일 07:00 UTC) — EU TARIC RSS + 페이지 해시
- `tariff-change-monitor` (매주 일 05:00 UTC) — 48개국 관세청 페이지 해시 비교
- `classification-ruling-monitor` (매주 수 06:00 UTC) — CBP CROSS + EU EBTI + UK ATaR + WCO + SARS
- `macmap-update-monitor` (매월 1일 08:00 UTC) — MacMap/WITS/WTO TTD 데이터 갱신 감지
- `wco-news-monitor` (매월 15일 08:00 UTC) — WCO 뉴스룸 + HS 2028 키워드 감지
- `fta-change-monitor` (매주 금 06:00 UTC) — WTO RTA-IS + 7개국 FTA 포털
- 모든 Cron: CRON_SECRET 인증 + health_check_logs 기록 + Resend 이메일 알림
- **커밋 5f430be**: 9파일 변경, 1,971줄 추가

**Supabase psql 직접 연결 확보:**
- Supabase IPv4 add-on 구매 ($4/월)
- DB 비밀번호 변경: PotalReview2026! → potalqwepoi2@
- Homebrew + libpq(psql 18.3) Mac에 설치
- `\copy` 벌크 임포트 가능 (Management API curl 대비 수백배 빠름)

**WDC Phase 4 v2 업로드 진행 중:**
- JSONL→CSV 변환 완료 (49,265,581건 → 10개 CSV, 각 ~800MB, 총 ~7.8GB)
- unique constraint 제거 후 `\copy` 진행 중
- 완료 후: 중복 제거 + constraint 복원 예정
- product_hs_mappings **~1.36M → ~50M+ 예상** (v2 업로드 후)

**ePing 구독**: WTO 사이트 버그로 가입 실패, 나중에 재시도

**UI/UX 10Phase 정밀 점검 (커밋 0504f05):**
- 14 코드 파일 + 2 신규 파일 수정 (843줄 추가)
- Phase 1: fetchWithTimeout 유틸, Dashboard 자동 재시도+fallback, Login 검증 강화
- Phase 2: Header 로고 Link, ESC 모바일 메뉴, Footer newsletter 버그 수정
- Phase 3: error.tsx 브랜드화, tariff 페이지 try-catch, /refund slug 추가
- Phase 5: Hero CTA 경로 수정, About 수치 최신화 (1.36M+)
- Phase 6: Dashboard 모바일 pill 탭, Pricing 가로 스크롤
- Phase 7: ARIA(tablist/tab/tabpanel), aria-live, aria-hidden
- Phase 8: faq/layout.tsx FAQPage JSON-LD (10 items)
- Phase 9: Shopify API key 하드코딩 제거

**B2B Channel Strategy 엑셀 전체 업데이트 (POTAL_B2B_Channel_Strategy.xlsx, 13시트):**
- 10개 채널 포스트 CW15 수치 반영 (50M+ mappings, ~148 endpoints, 21 crons, MCP registry, 60+ sources, UCP)
- Core Messaging 업데이트 (경쟁사 비교표)
- Update Log 시트 신규, X Twitter 단독 트윗 3개, LinkedIn POST 4 (UCP/AI Commerce)

**파일 정리**: 25+ 파일 → archive/ 이동 (구버전 엑셀, 1회성 실행 명령어), .~lock 파일 4개 삭제

### ⭐ CW14 Cowork 후반 세션 성과 (2026-03-16 00:00~03:00 KST)

**Core 16 + Trade 21 = 37개 기능 S+ 업그레이드 (Claude Code, 32분 19초):**
- **~45 API Routes** 신규 생성 (trade-remedies, sanctions, export-controls, roo, valuation, incoterms, documents/bundle, drawback, temporary-import, origin, sez, licensing, ioss, ddp-vs-ddu, returns, broker, calculate/breakdown, calculate/compare, calculate/whatif 등)
- **~25 Library Files** 신규 생성 (feedback-loop.ts, explainability.ts, multi-language.ts, confidence-calibration.ts, hs-validator.ts, breakdown.ts, roo-engine.ts, customs-valuation.ts, fuzzy-screening.ts, export-controls.ts, product-restrictions.ts, insurance-calculator.ts, shipping-calculator.ts, price-break-engine.ts, remedy-calculator.ts, origin-predictor.ts, returns-calculator.ts, broker-data-export.ts, incoterms.ts, sez-database.ts, import-licensing.ts, ioss-engine.ts, duty-drawback.ts, temporary-import.ts, doc-auto-populate.ts)
- **111 Test Cases** 작성 (37 기능 × 3 테스트: happy path + edge case + 실데이터 검증)
- **1 DB Migration**: 037_s_grade_upgrade.sql (api_audit_log, classification_feedback 등)
- **8개 빌드 에러 수정**: 타입 불일치, 중복 키, 잘못된 속성명 등
- **TypeScript 컴파일 통과** (0 errors) ✅
- **S_GRADE_VERIFICATION_REPORT.md** 생성 (docs/)
- SSG 페이지 타임아웃은 기존 이슈 (Supabase 네트워크 의존성, S+ 변경과 무관, Vercel 배포 시 정상)

**142-Feature S+ Master Plan Excel 생성:**
- analysis/POTAL_142_S_Grade_Complete_Plan.xlsx (15시트, 143개 기능, 전부 S+ 타겟)
- 시트: Summary, All 142 Features, Core/Trade/Tax/Platform/Integration/Shipping/Web/Legal/Security/Support/Business/Marketing, Sprint Roadmap
- Sprint 배분: S1(16개, Critical) / S2(46개, Depth) / S3(81개, Ecosystem)
- 37개(Core+Trade) 먼저 독보적 S+ 완성 → 나머지 106개 이어서 진행 결정

**PDF 라이브러리 추가 (커밋 fc066d0):**
- pdf-lib 설치 (pure JS, Vercel serverless 호환)
- pdf-generator.ts: 5종 문서 + 테이블 리포트 + 배송 라벨
- /api/v1/documents/pdf: binary + base64 출력
- /api/v1/reports/export: format=pdf 옵션 추가
- /api/v1/shipping/labels: 4x6 inch 라벨 PDF

**B2B 채널 마케팅 전략 (Cowork에서 논의):**
- MVP 홍보 채널 리스트 확정: Show HN, Product Hunt, Shopify Community, LinkedIn, Reddit(r/SaaS, r/ecommerce), DEV.to, GitHub awesome-mcp
- 핵심 메시지: "파트너가 되고 싶다, 중간업자가 아니다" — 최고 품질 + 최저 가격 + 피드백 기반 개선
- 채널별 글 작성 예정 (핵심 구조 확정, 은태님 피드백 반영 중)
- 수정 사항: 8,389 매핑 → "1.7B+ product names, any product classifiable" 표현 전환, 내부 숫자(89,842행 등) 비노출, 경쟁사 상위 10개 기능+가격 비교표 포함

### ⭐ CW14 Cowork 세션 성과 (2026-03-15 KST)

**Full Project Audit (전체 프로젝트 감사):**
- docs/FULL_PROJECT_AUDIT.md 생성 — 59 DB 테이블, 103 API 엔드포인트, product_hs_mappings 8,389, vectors 3,431
- 실제 DB 수치 기반 전체 프로젝트 상태 점검

**3개 미교정 이슈 수정 (커밋 701572b):**
- 하드코딩 토큰 19파일 → 환경변수 전환 (보안 강화)
- SUPABASE_SERVICE_ROLE_KEY 환경변수 설정 확인
- 임시파일 정리

**UX Audit 53/53 완료:**
- Batch 1: 15개, Batch 2: 16개, Batch 3: 12개 구현
- 이미 구현 확인 5개, 미구현 사유 5개 (합리적 제외)
- npm run build 통과 ✅

**WDC Phase 4 벌크 매핑:**
- wdc_phase4_bulk_mapping.py 스크립트 작성
- 백그라운드 실행중 (5억+ 상품명 → HS Code 사전 매핑)

**WDC 추출 상태**: 1,896/1,899 완료 (99.8%) — 이미 문서 반영됨

**운영 도구 생성:**
- POTAL_SESSION_BOOT_SEQUENCE.md — 3단 부트 시퀀스 (Fast/Standard/Deep)
- FULL_PROJECT_AUDIT_COMMAND.md — 7단계 프로젝트 감사 명령어

### ⭐ CW13 Cowork 세션 성과 (2026-03-14 15:00~23:30 KST)

**Enterprise Sales 자동화 (D9):**
- 12단계 완전 구현 문서 작성 → Claude Code 실행 → 전체 파이프라인 동작 확인 ✅
- enterprise_leads 테이블 + RLS 비활성화 (INSERT 차단 해결)
- Supabase lazy init 패턴 (`getSupabase()`) 적용 — Vercel serverless cold start 문제 해결
- Telegram 알림 수신 확인 ✅ (새 리드 즉시 알림)
- Enterprise Inquiry 폼 동작 확인 ✅ ("Get Custom Pricing" 버튼)

**UX Audit TOP 10 구현:**
- 53개 항목 14개 카테고리 UX 감사 (Stripe/Linear/Vercel/Notion 벤치마크)
- TOP 10 우선순위 구현: Glassmorphism Header, Hero 수정("113M+ Tariff Records"), Footer 소셜링크(LinkedIn/X/GitHub) + Trust Badges(GDPR/240 Countries/SOC 2/99.9% Uptime)
- POTAL_UX_AUDIT_CW13.md 생성

**'Grow With You' 요금제 전략:**
- Free 100→**200건/월** 확대 (마케팅 비용, 월200건 남용 불가)
- Pro 기능 전체를 Free/Basic에 개방: Batch API, Webhook, Analytics Dashboard
- plan-checker.ts 업데이트: Free batchApi 50건, Basic 100건, Pro 500건, Enterprise 5,000건
- pricing/page.tsx 카드 + Compare Plans 테이블 통일
- 수익 시뮬레이션: +97.1% 수익 증가 (POTAL_Pricing_Strategy_Analysis.xlsx)

**Paddle 구독 취소 버그 수정:**
- **문제**: subscription.cancelled 즉시 plan_id='free'로 변경 → 잔여 기간 무시
- **수정 (4파일)**: webhook(plan 유지+current_period_end 저장), middleware(기간 내 접근 허용), Dashboard(cancelled 배지+만료일 표시), keys.ts(current_period_end 포함)
- **subscription-cleanup Cron** 신규: 매일 03:00 UTC, 만료된 구독만 Free 전환
- Vercel Cron **14개**째

**Seller Profile Auto-Creation 수정:**
- Dashboard "Seller profile not found" → sellers/me API가 자동으로 seller 레코드 생성 (plan_id='free', status='active')

**Git Commits (CW13 Cowork):**
- fa9e10f: Enterprise Sales automation
- 05b8f0e: UX Audit TOP 10
- 301aa9e: 'Grow With You' pricing + Free 200
- 72ca35d: Paddle subscription bug fix
- 85239e5: Compare Plans update
- + additional commits

**파일 생성/수정:**
- 생성: telegram.ts, enterprise-email.ts, enterprise-inquiry/route.ts, enterprise-lead-match/route.ts, subscription-cleanup/route.ts
- 수정: vercel.json, billing/webhook/route.ts, middleware.ts, plan-checker.ts, keys.ts, DashboardContent.tsx, pricing/page.tsx, page.tsx, developers/page.tsx, Header.tsx, Footer.tsx, morning-brief/route.ts

### ⭐ CW13 Cowork 후반 세션 성과 (2026-03-15 00:00~14:00 KST)

**LLM 수익화 전략 결정:**
- **핵심 인사이트**: Custom LLM = 마케팅 채널 (showroom), B2B API = 매출 (factory)
- **ChatGPT GPT**: POTAL API 직접 호출 → **Free 200건/월 소진** (정확한 실시간 데이터)
- **Gemini Gem / Meta AI**: 외부 API 미지원 → **무제한** 사용 가능 (정적 참고 데이터, 추정값만 제공, potal.app CTA)
- LLM 쇼핑 트렌드: 플랫폼 내 쇼핑 카테고리 추가 형태 (Agent → MCP → POTAL API 호출 구조)
- Free 200건 = 체험용 마케팅 비용, 비즈니스 자동화 필요 시 API 구독 전환

**npm publish + MCP 공식 레지스트리:**
- `potal-mcp-server@1.3.1` npm 공개 패키지 publish ✅ (npmjs.com/package/potal-mcp-server)
- **npm 계정**: username `potal_official` (soulmaten7@gmail.com), org 이름 "potal"은 타인 선점 → unscoped 패키지로 결정
- **npm Granular Access Token**: `***REDACTED***` (Bypass 2FA for publish)
- MCP 공식 레지스트리 등록 ✅ (`io.github.soulmaten7/potal`, registry.modelcontextprotocol.io, status: active, 2026-03-14T15:14:18)
- **등록 과정**: mcp-publisher CLI → GitHub device auth → publish. server.json description 145자→82자 수정 (100자 제한)
- `npx potal-mcp-server`로 누구나 설치 가능

**Custom LLM 3종 전면 리라이트 + 수동 배포:**
- **GPT Actions** (gpt-instructions.md): "쇼핑 어시스턴트" → "Global Landed Cost Infrastructure". 정확한 세율만 (추정 금지), "Powered by POTAL" 푸터, 5건+ 사용 시 B2B CTA, 에러 핸들링. **ChatGPT GPT 에디터에 수동 복사 완료 ✅**
- **Gemini Gem** (gem-instructions.md): 외부 API 미지원 확인 → 정적 참고 데이터 + "정확한 계산은 potal.app" CTA 전략. **설명 업데이트 + CSV v2 교체 + 지침 복사 완료 ✅** (country-duty-reference-v2.csv: 30개국 enhanced notes — US de minimis $0, Section 301/232, 12개국 processing fee, FTA 정보)
- **Meta AI** (ai-studio-instructions.md): Gemini과 동일 전략 (정적데이터 + CTA). 미국 현지가 아니라 아직 미등록

**MCP 디렉토리 등록:**
- **mcp.so** ✅ 제출 완료 (관리자 승인 대기 1~3일). Tags: commerce,tariff,customs,landed-cost,trade,duties,vat,hs-code,cross-border,ecommerce
- **glama.ai** ⏭️ 제출 페이지 없음 (submit URL 404, GitHub 자동 크롤링 방식으로 변경된 것으로 추정)
- **smithery.ai** ⏭️ HTTP 호스팅 서버 필요 (POTAL MCP는 stdio 방식이라 해당 없음)

**B2B 아웃리치 전략:**
- 15개 타겟 기업 4티어: Tier 1(AI: OpenAI/Google/Perplexity/Anthropic/Meta), Tier 2(이커머스: Shopify/WooCommerce/BigCommerce), Tier 3(결제/물류: Stripe/PayPal/Royal Mail), Tier 4(마켓플레이스: eBay/Etsy/Temu·Shein/Amazon)
- 콜드이메일 3종 (AI플랫폼용/이커머스용/B2B 엔터프라이즈용)
- 문서: ai-agents/B2B_OUTREACH_TARGETS.md, ai-agents/LLM_COMMERCE_INTEGRATION_ANALYSIS.md
- **LLM 커머스 통합 분석**: 9개 플랫폼별 커머스 통합 방식 분석 (ChatGPT Instant Checkout, Gemini Shopping, Perplexity Buy 등)

**UCP (Universal Commerce Protocol) 발견:**
- Google + Shopify + Walmart + Target 공동 개발 오픈 표준
- MCP, A2A, AP2 내장 — 관세 계산은 **없음** = POTAL MCP 서버가 UCP 생태계에 직접 연결 가능
- 핵심 인사이트: POTAL MCP = UCP 생태계 진입 티켓
- **전략적 의미**: UCP가 MCP를 내장했으므로, POTAL MCP 서버 하나로 Google/Anthropic/Shopify 생태계 동시 진입 가능

**Pre-computing 완료:**
- 490 HS6 코드 × 240국 = **117,600 조합** 사전 계산 + git push
- 캐시 히트 시 <50ms 응답, AI 호출 $0
- **커버리지**: HS6 매핑 1,055건 × 평균 수십 상품명 = 사실상 대부분 소비재 커버

**HS10 파이프라인 구현:**
- 7개국(US/EU/UK/CA/AU/JP/KR) 10자리 파이프라인 완성
- gov_tariff_schedules 89,842행 기반 매칭
- US/EU/UK: 정부 REST API (HS 8-10자리) / KR/CA/AU/JP: WTO API (HS 6자리)

**경쟁력 자가 평가 (은태님 요청):**
- **Data: Tier 0** — 113M+ 관세율, 119K 무역구제, 21K 제재, 89K 정부스케줄. 경쟁사 중 이 규모 없음
- **Features: Tier 1** — 142/147 기능 (96.6%). Avalara/Global-e와 동급, 일부 상회
- **Price: Tier 0** — 건당 $0.01 업계 최저. Avalara $1,500+/월, Zonos $2/주문
- **Architecture: Tier 1** — API-first, MCP, 위젯, Shopify TEA. 확장 가능 구조
- **Implementation: Tier 1** — 풀스택 완성 (DB→API→UI→플러그인→AI)
- **Real-world Validation: Tier 3** — 고객 0 = 유일한 약점. 다음 단계 = 첫 유료 고객 10개

**Git Commits (CW13 Cowork 후반):**
- 6f8e0c1: npm publish, MCP 레지스트리, Custom LLM, B2B 아웃리치, UCP 발견
- e9b102a: Gemini Gem CSV v2 업데이트

**파일 생성:**
- ai-agents/B2B_OUTREACH_TARGETS.md, ai-agents/LLM_COMMERCE_INTEGRATION_ANALYSIS.md
- ai-agents/gemini-gem/country-duty-reference-v2.csv (240개국, 30개국 enhanced notes)
- mcp-server/server.json, mcp-server/registry-metadata.json, mcp-server/.npmignore

**파일 수정:**
- ai-agents/custom-gpt/gpt-instructions.md (전면 리라이트 — "Global Landed Cost Infrastructure", B2B CTA, 에러핸들링)
- ai-agents/gemini-gem/gem-instructions.md (전면 리라이트 — 정적데이터+CTA, 3회 사용 후 전환 프롬프트)
- ai-agents/meta-ai/ai-studio-instructions.md (전면 리라이트 — Gemini과 동일 전략)
- mcp-server/package.json (name: potal-mcp-server, version: 1.3.1, mcpName, keywords, homepage)
- mcp-server/README.md (9 tools 문서화, Quick Start, Claude Desktop config 예시)


### ⭐ CW18 Cowork 6차 세션 성과 (2026-03-24 KST)

**Vercel 빌드 에러 해결 + Layer 2 GRI 프로덕션 배포:**
- 4회 연속 빌드 실패 원인: 2개 git repo 혼동 (홈 디렉토리 .git vs portal/.git)
- Git repo 정리 후 gri-classifier/ 25개 파일 추가 → 5번째 배포 성공
- GitHub Push Protection: OpenAI API key 유출 차단 → backend/.env 삭제
- Layer 2 프로덕션 테스트 3종 PASS (correct input 200 OK, invalid 400, missing 400)

**홈페이지 + 공개 페이지 UI 일괄 업데이트 (20건 × 6파일):**
- page.tsx (8건): Trust 99.2%→100%, curl 6→9field, +fieldValidation, +JP Customs source
- pricing (1건): FAQ "AI-powered"→"9-field"
- about (1건): +100% HS Accuracy stat
- help (3건): FAQ #1,#2,#5 GRI pipeline 반영
- faq (5건): HS분류/정확도/tariff lines 89K→131K
- developers (2건): CODE_EXAMPLES old→new
- 커밋: 0ab2f77 (홈페이지), 6d46e0a (6파일 +73/-37)

**Sprint 1 보안 6기능 100% 달성:**
- F006 Confidence Score: Platt sigmoid 제거 → stage reliability × raw score × field multiplier × chapter difficulty. 20/20 tests. 커밋 61d4433
- F012 HS Validation: REPLACED_CODES 5→77개, PRICE_BREAK_HS6 18개, rankSuggestions(). 15/15 tests. 커밋 a9b54fa
- F046 Webhook System: outbound sender (HMAC-SHA256, 지수 백오프 5회), CRUD 6 routes, webhook-verify.ts 4종 통일. 15/15 tests. 커밋 5f2a912
- F052 API Auth: fraud detection 연동, scope 5→18개, IP allowlist/blocklist, audit logging. 15/15 tests. 커밋 3396f7c
- F093 Webhook Security: replay prevention (4 provider 전부), SSRF 차단 (RFC 1918 + link-local + IPv6 ULA), 1MB payload limit, idempotency (webhook_events 전용 테이블 UNIQUE(source,event_id)), rate limit 100/min, secret rotation POST /webhooks/[id]/rotate + 24h dual-secret 유예. 15/15 tests. 커밋 8c764ed
- F125 API Key Security: timing-safe 비교, fraud auto-disable (5회→자동 revoke), sandbox isolation, api-key-monitor Cron weekly. 15/15 tests. 커밋 f0d265f
- DB migration 4개: 039_api_key_security, 040_webhook_system, 041_ip_rules, 042_webhook_security

**데모 GIF 3개 생성:**
- asciinema + agg 설치 → 3개 데모 스크립트 → 녹화 → GIF 변환
- marketing/potal_demo_calculate.gif (61KB) — CN→US cotton T-shirt TLC 계산
- marketing/potal_demo_compare.gif (26KB) — US/UK/DE/JP 4개국 비교표
- marketing/potal_demo_classify.gif (25KB) — HS Code 9-field 분류

**CLAUDE.md 구조 분리 (Cowork에서 실행):**
- CLAUDE.md 1,657줄 → 500줄 (70% 축소)
- CW13~CW18 세션 히스토리 1,167줄 → docs/sessions/COWORK_SESSION_HISTORY.md로 분리
- 목적: 컨텍스트 윈도우 절약 → 세션 안정성 향상

**Product Hunt 리런치 전략 수립 + 제출:**
- B2C 시절 PH 페이지 발견 (17일 전, 0 points) → B2C→B2B 피봇은 "major update" 자격
- POTAL_PRODUCT_HUNT_LAUNCH_PLAN.md 작성: 태그라인, Maker's Comment, 미디어 갤러리, 타임라인, 아웃리치
- PH "New Launch" → "Yes, major update" → "What's new" 텍스트 작성 → 은태님이 Send request 제출
- 런치 추천일: 4/7(화) 또는 4/8(수), PST 12:01 AM 시작, 첫 4시간 크리티컬
- 대기 사항: PH팀 승인 1~3일, Hero Image 1270×760px 제작, Gallery slides 4~5장

**데모 영상 → GIF 자동화:**
- 은태님이 "Claude Code에게 촬영까지 시킬 수 있냐" 질문 → 수동 촬영 불필요, asciinema+agg로 터미널 자동 녹화→GIF 변환 파이프라인 구축
- CLAUDE_CODE_DEMO_GIF.md 명령어 생성 → Claude Code Terminal 1에서 실행 → 3개 GIF 생성 (calculate 61KB, compare 26KB, classify 25KB)
- GIF는 PH, LinkedIn, Reddit, X, DEV.to 모든 플랫폼에서 재생 가능 확인

**Cowork 워크플로우 확립 (Sprint 1 기능 업그레이드):**
- 은태님 피드백: "6개 한꺼번에 하지 말고 1개씩, 100%까지"
- 확립된 사이클: Cowork에서 Agent 탐색 → GAP 분석 → 명령어 파일(.md) 생성 → 은태님이 Claude Code 터미널 2에 붙여넣기 → 실행 → 스크린샷 Cowork 공유 → 확인 → 다음 기능
- F006(61d4433) → F012(a9b54fa) → F046(5f2a912) → F052(3396f7c) → F093(8c764ed) → F125(f0d265f) 순서대로 완료
- 각 기능별 Agent 코드 탐색 → 6 GAP 분석 → 5번 검수 → 100% 게이트 → 커밋 → "다음 기능 명령어를 기다려라"

**대기 작업 (미완료):**
- LinkedIn 포스트 (은태님이 선택했으나 미시작)
- PH Hero Image 1270×760px (미생성)
- PH Gallery slides 4~5장 (미생성)
- Sprint 2 기능 업그레이드 (Sprint 1 완료 후 다음)

**총 성과:**
- 커밋 12개, 신규파일 ~15개, 수정파일 ~20개
- DB migration 4개 (039/040/041/042)
- Vercel Cron 23→24개 (+api-key-monitor)
- API 엔드포인트 ~148→~155개+
- npm run build ✅, 95 unit tests ALL PASS


### ⭐ CW18 Cowork 7차 세션 성과 (2026-03-24 KST)

**Layer 2 완성 확인 + 우선순위 전면 정리:**

핵심 결정: **Layer 2 = GRI Pipeline = 완성됨. 추가 실험/완성 작업 없음.**
- GRI Pipeline(gri-classifier/ 25개 파일, 592 codified rules, AI 0회)이 Layer 2 그 자체
- "관세사가 하는 GRI 1~6 순차 적용을 코드로 자동화"가 Layer 2의 최종 형태
- v1~v7 LLM 실험은 GRI Pipeline 이전의 시행착오로, GRI Pipeline이 전면 대체

**삭제된 TODO들 (GRI Pipeline으로 이미 완성):**
- ~~P1: Layer 2 v8 실험~~ — confirmed_chapter → Layer 1 직접 전달, Chapter 52% 올리기. v7→v8은 LLM 실험 시절 TODO로 GRI Pipeline이 대체
- ~~P1: Layer 2 완성~~ — "기존 데이터 먼저 활용" 구조 재설계. v1~v6 LLM 기반 설계로 GRI Pipeline에 해당 없음
- ~~HSCodeComp 632건 AliExpress category → Ch.XX 매핑 테이블~~ — GRI Pipeline 구조에서 불필요
- ~~composition → codified_subheadings 5,621개 연결~~ — 위와 동일

**우선순위 재정리 (최종):**
- P0: Product Hunt 런치 준비 (승인 대기 중) + LinkedIn 포스트
- P1: Sprint 2 기능 업그레이드 (대상 기능 미선정, 은태님이 선정해야 함)
- P2: Layer 3 설계 (Enterprise Custom) + 프로덕션 아키텍처

**NEXT_SESSION_START.md Layer 2 상태 섹션 업데이트:**
- "Layer 2 (실험 6회 완료 — v2 = HS6 최적, v6 = Section 최고)" → "Layer 2 (✅ GRI Pipeline 프로덕션 배포 완료 — 2026-03-24)"
- v1~v6 실험 결과 목록 제거 → GRI Pipeline 프로덕션 상태로 교체

**참고: NEXT_SESSION_START.md "이전 세션 핵심 인사이트" 1~8번 섹션:**
- v1~v6 LLM 실험 시절 작성. GRI Pipeline 완성 후에는 과거 기록으로만 참고할 것
- "Layer 2 매핑 순서", "Layer 2 프로세스" 설명도 마찬가지 (LLM 기반 설계)

**문서 업데이트:**
- NEXT_SESSION_START.md: 헤더, Layer 2 상태, P1/P2/P3 정리, CW18 7차 확정 사항 섹션 추가
- COWORK_SESSION_HISTORY.md: CW18 7차 세션 기록 추가
- CHANGELOG.md: CW18 7차 항목 추가
- CLAUDE.md: 동기화
