# POTAL Development Changelog
> 마지막 업데이트: 2026-03-29 16:30 KST (CW22 — Exit 전략 피벗 + Forever Free + 홈 리디자인 + Features 가이드 + 커뮤니티)

## [2026-03-29 16:30 KST] CW22 — 전략 피벗: Exit 전략 + Forever Free

### 전략 변경
- **Exit(인수) 전략 확정**: 트래픽/데이터 극대화 → 인수 (CEO 결정 완료)
- 요금제 4단계(Free/Basic/Pro/Enterprise) **전면 폐기**
- 새 구조: **Forever Free** (140개 전부 무료) + Enterprise Contact Us
- Custom 세팅비 없음 — 140개 상세 가이드로 셀프서비스
- 가입 구조: 필수 5개(1달 무료) → 프로필 완성(Forever Free)
- 데이터 수집이 Exit 핵심: 크로스보더 셀러 프로필 (국가/업종/규모/플랫폼/매출)

### 코드 변경 (A+B+C+D+G 완료)
- **A: 요금제 변경**: Pricing 페이지 "Everything Free. Forever." 재설계, plan-checker 전체 무제한
- **B: 가입 통합**: /auth/join→/auth/signup 리다이렉트, 필수 5개 필드, 프로필 완성도 시스템(50%→100%), Forever Free 자동 업그레이드, trial 만료 시 API 403
- **C: 홈 화면 리디자인**: 히어로 "140 Features. All Free." + 경쟁사 기능 수/비용 비교 차트 2개 + Free 배너
- **D: Features 가이드**: 140개 상세 가이드 페이지 (/features/[slug]) 동적 라우트 + SEO sitemap
- **G: 커뮤니티 게시판**: /community — 버그/질문/제안, 140개 기능별 분류, 댓글, 추천, Header 링크, 50개 i18n

### DB 마이그레이션
- **055_forever_free_profile.sql**: sellers 컬럼 10개 (country, industry, company_size, monthly_shipments, primary_platform, main_trade_countries, annual_revenue_range, profile_completed_at, trial_type, trial_expires_at)
- **056_community_forum.sql**: community_posts + community_comments + community_upvotes + RLS + 인덱스

### Git 커밋 (CW22)
- `788c10f` feat: CW22 D-1~D-5 — 140 feature guide pages with dynamic routes + SEO
- `ffdf675` feat: CW22 home redesign — viral landing page + competitor charts + Free badge
- `e989f0e` feat: Community forum — posts, comments, upvotes, i18n (G-1~G-7)
- `33149fb` fix: remove scripts with secrets from tracking (push protection)
- `0ad950c` feat: CW22 pivot — Forever Free pricing, plan logic, signup flow, docs
- `cb7660c` feat: Forever Free pivot — unified signup, profile completion, trial system (B-1~B-6)

---

## [2026-03-29 02:20 KST] CW21-B — 140개 기능 완성 + Features 페이지 + 수익화 전략

### 주요 성과
- **142개 기능 코드 기반 정밀 감사**: IMPL 119, PARTIAL 10, STUB 8, NONE 3, WON'T 2
- **21개 미완성 기능 전부 완성** (PARTIAL→IMPL, STUB→IMPL, NONE→신규 구현)
- **Features 페이지 신규 배포**: potal.app/features — 140개 Active, 12개 카테고리 필터, 경쟁사 비교 테이블
- **MCP v1.4.0 프로덕션 검증**: classify_product 9-field, calculate_landed_cost 등 10/10 정상
- **Dashboard category 버그 수정 확인**: Chrome MCP로 실제 UI 테스트 완료
- **홈페이지 전체 점검**: 7개 페이지 전부 정상 (/, /features, /pricing, /developers, /help, /blog, /dashboard)
- **인프라 비용 분석**: 고정 ~$114/월, v3 AI호출 0, 100만건 시 ~$140/월
- **AI fallback 구조 분석**: v3→캐시→벡터→키워드(≥0.6)→AI. v3가 거의 다 처리, AI fallback 사실상 0

### 커밋
- Features 페이지 (e21b22f): 140개 기능 카드, 12개 카테고리 필터, 경쟁사 비교
- 21개 기능 완성: PARTIAL 10(수정) + STUB 8(로직) + NONE 3(신규)
- 경쟁사 테이블 수정: POTAL Active Features 119→140

### 전략 논의 (CEO 결정 대기)
- 요금제 변경 검토: 전체 무료 + Custom만 유료 + 크로스보더 광고
- 플랫폼 전환: API 도구 → 크로스보더 정보 허브 (관세뉴스 + 커뮤니티)
- 크로스보더 시장: 셀러 ~1500만, 시장규모 $1.2T, 광고 CPM $20-50

### 생성/수정 파일
- app/features/page.tsx (신규)
- app/features/features-data.ts (신규)
- components/layout/Header.tsx (Features 링크 추가)
- 51개 i18n 번역 파일 (nav.features 키)
- POTAL_Feature_Audit_2603290000.xlsx (신규)
- 21개 API route + 페이지 파일 (미완성 기능 완성)

## [2026-03-28 23:30 KST] CW21 — v3 파이프라인 21/21 Section 100% 완성

### 커밋 4개
- **7fd0142** feat: v3 pipeline 100% — all 21 Sections, S21 art, S7 redirect, word-boundary fix
- **0838827** feat: external drive data sync — codified rules +12, TRQ 372, EU seasonal 13, Ch82 knife fix
- **2b1e1ea** feat: v3 pipeline final — conflict-patterns + material_condition + runner_up heading
- **eb00fae** feat: v3 pipeline — add chapter hints for 12 missing Sections + fix 3 misroutes

### 주요 변경
- step2-2-section-notes.ts: Section switch 10/21 → **21/21** (S2-S10, S12, S14, S19, S21 추가)
- S21 Works of Art (Ch.97): 9701-9706 heading hints (painting/sculpture/stamp/antique/collectors)
- S7 Plastics: Section VII Note 2 cross-section redirect (printed plastics → Ch.49, 3918/3919 제외)
- S11 Textiles: Ch.53-59, 63 chapter hints 추가 (linen/man-made/felt/carpet/lace/made-up)
- S15 Base metals: Ch.79(zinc), 80(tin), 81(other base metals) 추가
- step0-input.ts: word-boundary matching for short material variants (pe→paper false positive fix)
- step2-1-section-candidate.ts: headgear score 0.85→0.95, art material/category mappings 추가
- codified-rules.ts: +3 rules → **595 total** (Section I Note 1&2, Section VII Note 2)
- field-validator.ts: PLATFORM_TERMS +40 keywords (hat/cap/chocolate/weapon/art/kitchenware 등)
- 외장하드 /Volumes/soulmaten/POTAL/ 14개 파일 + 97 conflict patterns 전체 대조 완료

### 테스트
- Pipeline regression: **22/22 PASS** (100%)
- Field-validator: **7/7 PASS**
- npm run build: ✅ 성공

## [2026-03-28 13:00 KST] CW20 — 147/147 기능 100% 완료 + Gmail 드래프트 251개 + Product Hunt + KrispiTech

### 주요 변경
- 17개 미완성 기능 전부 보완 (147/147 = 100%)
- 글로벌 콜드이메일 캠페인: 9개국 251개 검증, Gmail 드래프트 251개 생성
- Product Hunt B2B 리런치 완료
- KrispiTech 블로그 피처링 답장 발송
- Escalation Flow 구현 + 배포 (커밋 a63e713)
