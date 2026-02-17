# POTAL POST-MVP Improvement Checklist
> Created: 2026-02-15
> Purpose: MVP 완성 후 순차적으로 개선할 항목들
> Priority: P0(즉시) → P1(중요) → P2(개선) → P3(장기)

---

## A. AI Smart Filter System (현재 v3.1)

### P0 — MVP 직후 즉시
- [ ] **Golden Template Caching**
  - Supabase `category_templates` 테이블 생성
  - 스키마: `category_key`, `axes_structure` (JSON), `hit_count`, `last_used`, `created_at`
  - AI가 생성한 좋은 axes 결과를 저장 (사용자가 필터를 실제 사용했을 때)
  - 동일 카테고리 재검색 시 저장된 axes를 few-shot example로 전달
  - 효과: AI 비용 절감, 응답 속도 향상, 일관성 확보

- [ ] **AI Axes 환각 검증**
  - parseOutput에서 생성된 values가 실제 상품 제목에 존재하는지 검증 로직 추가
  - 매칭률 50% 미만인 value는 제거
  - 로그로 환각 비율 추적 → 프롬프트 개선 근거

### P1 — 사용자 피드백 후
- [ ] **eBay Browse API 연동 (무료)**
  - AspectFilter, AspectDistributions 활용
  - 검색 시 facet 데이터 함께 수신 → Supabase 저장
  - 실제 카테고리별 필터 구조 확보

- [ ] **Best Buy Products API 연동 (무료)**
  - `&facet=attribute,count` 파라미터로 facet 수신
  - 주의: Best Buy TOS상 캐싱 제한 있음 (7일 만료)
  - 실시간 facet 데이터로만 활용

- [ ] **Brand 검증 강화**
  - 현재 문제: "Open Ear" 같은 제품 특성이 브랜드로 분류됨
  - 해결: 알려진 브랜드 DB (Supabase) 구축 → AI 결과와 교차 검증
  - Golden Template에 검증된 브랜드 목록 함께 저장

- [ ] **filter-utils.ts 개선 (AI 실패 시 fallback)**
  - STOPWORDS 확장 (32개 → 80개+)
  - query 토큰 인식: 검색어 자체 단어는 키워드에서 제외
  - isValidKeyword() 함수: 1글자, 숫자만, 의미없는 단어 필터링

### P2 — 데이터 축적 후
- [ ] **AI 역할 전환**
  - 충분한 category_templates 축적 후
  - AI: "axes 생성" → "카테고리 매칭 + 현재 제목에서 값 추출"로 전환
  - 저장된 axes 구조를 기반으로, 실시간 상품 제목에서 값만 추출

- [ ] **다중 리테일러 Facet 통합**
  - eBay + Best Buy facet 데이터를 카테고리별로 병합
  - 중복 제거 후 통합 필터 구조 생성
  - AI가 통합 구조를 참조하여 일관된 axes 생성

- [ ] **SearchApi 검토 ($40/월)**
  - 멀티 리테일러 facet 데이터 한 번에 수신 가능
  - 사용자 수 증가 시 비용 대비 효율 평가

### P3 — 장기
- [ ] **Amazon PA-API → Creators API 마이그레이션**
  - PA-API 5.0 폐지 예정: 2026년 4월 30일
  - SearchRefinements (동적 facet) 기능이 Creators API에서도 지원되는지 확인
  - 마이그레이션 계획 수립

---

## B. AI 모듈 통합

### ✅ 완료 (2026-02-15)
- [x] **Intent Router 연결** — Coordinator.analyzeQuery()의 첫 단계로 통합
  - QUESTION → suggestedCategories로 조기 반환
  - PRODUCT_SPECIFIC → deterministic 분석 (AI 비용 절감)
  - PRICE_HUNT → priceSignal 자동 적용
  - COMPARISON → comparisonTargets 활용
- [x] **Product Judge 활성화** — Coordinator.runAIFilter()에서 기존 AIFilterService 대체
  - 모듈 시스템 통합, few-shot 예시, 자동 fallback
  - 전체 제거 안전장치 (모든 상품 제거 시 원본 반환)

---

## C. 핵심 기능 구현 (Master Architecture 기준)

### ✅ 이미 구현됨 (확인 완료)
- [x] **Total Landed Cost 계산 엔진** — CostEngine 완성 (배송비 + 주별 세금 + $800 de minimis 관세)
- [x] **Best/Fastest/Cheapest 스코어링** — ScoringEngine 완성 (5-factor 가중치 + 동적 탭 요약)
- [x] **8개 리테일러 API** — Amazon, Walmart, eBay, Best Buy, Target, AliExpress, Temu, Shein 전부 동작

### P0 — MVP 직후
- [ ] **Provider 플러그인 아키텍처 리팩토링**
  - 현재: 각 리테일러별 개별 구현 (동작하지만 구조 개선 필요)
  - 할 일: 통일된 Provider 인터페이스 + country/currency 파라미터
  - 새 리테일러 추가 시 파일 하나만 생성하면 되는 구조

- [ ] **3단계 Fake Detector 완성**
  - Stage 1: 즉시 제거 (룰 기반, $0 상품 등) — 부분 구현됨
  - Stage 2: AI 브랜드 필터 (모조품 자동 제거) — 미구현
  - Stage 3: Trust Signal 시스템 (경고 아이콘) — 미구현

- [ ] **Variant/Option 가격 정규화**
  - $0 base price + variant prices → 최저 variant 가격 표시
  - 가격 범위: "$8.99 ~ $25.99" 포맷
  - AI가 옵션(Color, Size, Storage)을 필터로 생성

- [ ] **Background 데이터 수집**
  - Supabase에 검색 로그 저장: query, results, clicks
  - Fake Detector 정확도 개선용 평균 가격 데이터
  - Best Score 가중치 최적화용 클릭 데이터

---

## D. UX/UI 개선

### P1
- [ ] **Image Search (사진 검색)**
  - Vision API로 상품 식별 → 검색어 생성
  - 모델: GPT-4o / Claude Sonnet (~$0.02/검색)

- [ ] **검색 결과 페이지 리디자인**
  - AI Filter Panel 통합 (현재 AiSmartSuggestionBox)
  - Product Card에 Total Landed Cost 표시
  - Domestic | Global 섹션 명확 구분

### P2
- [ ] **Mobile Responsive**
  - PC First 완성 후 모바일 CSS 일괄 작업
  - 1-col 그리드, 터치 최적화
  - "One Logic, Multi-Device" 원칙 유지

- [ ] **User Profile**
  - Price↔Speed 슬라이더 (단일 설정)
  - Best Score 가중치 조절

---

## E. Launch 준비

### P1
- [ ] **Security Audit**
  - API 키 노출 점검 (.env.local)
  - Supabase RLS 정책 확인
  - XSS/CSRF 방어

- [ ] **SEO + OG Tags**
  - 검색 결과 페이지 메타데이터
  - Open Graph 이미지 자동 생성

- [ ] **GA4 Event Tracking**
  - 검색, 필터 사용, 클릭, 구매전환 이벤트
  - AI 필터 사용률 추적

- [ ] **Performance 최적화**
  - API 병렬 호출 최적화
  - 검색 결과 캐싱 (Vercel KV or in-memory)
  - 이미지 lazy loading

---

## 진행 규칙

1. **한 번에 하나씩**: 체크리스트 순서대로 진행, 한 항목 완료 후 다음으로
2. **테스트 필수**: 각 항목 완료 시 `npm run dev` + 실제 검색 테스트
3. **TypeScript 통과**: 모든 변경 후 `npx tsc --noEmit` 통과 확인
4. **CHANGELOG 기록**: 주요 변경사항은 docs/CHANGELOG.md에 기록
5. **되돌릴 수 있게**: 큰 변경 전 git commit으로 복원점 확보

---

---

## F. MVP 완성 시 필수 실행 (배포 전)

- [ ] **Supabase `contact_messages` 테이블 생성**
  - 파일: `supabase/migrations/002_contact_messages.sql`
  - Supabase Dashboard → SQL Editor에서 실행
  - Contact form이 동작하려면 이 테이블이 필요

- [ ] **리테일러 설정 중앙화**
  - 현재: 리테일러 목록이 search/page.tsx, FilterSidebar.tsx, ResultsGrid.tsx 등 3곳 이상에 하드코딩
  - 할 일: 단일 config 파일로 통합

- [ ] **FraudFilter 미완성 규칙 정리**
  - FraudFilter.ts의 placeholder 코멘트 (store_age, seller verification) 정리
  - 실제 데이터 없으면 해당 규칙 제거 (false positive 방지)

---

*이 체크리스트는 MVP 완성 후 활용합니다. MVP 개발 중에는 참고만 하세요.*
*Last updated: 2026-02-15 (Intent Router + Product Judge 통합 완료)*
