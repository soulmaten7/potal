# POTAL POST-MVP Improvement Checklist
> Created: 2026-02-15
> Last Updated: 2026-02-23
> Purpose: MVP 완성 후 순차적으로 개선할 항목들
> Priority: P0(즉시) → P1(중요) → P2(개선) → P3(장기)

---

## ✅ MVP 완료 항목 (2026-02-23 검수 완료)

- [x] **Intent Router 연결** — Coordinator.analyzeQuery()의 첫 단계로 통합
- [x] **Product Judge 활성화** — Coordinator.runAIFilter()에서 기존 AIFilterService 대체
- [x] **Total Landed Cost 계산 엔진** — CostEngine 완성
- [x] **Best/Fastest/Cheapest 스코어링** — ScoringEngine 완성
- [x] **5개 리테일러 API 활성화** — Amazon, Walmart, eBay, Target, AliExpress
- [x] **GA4 이벤트 트래킹** — 12개 이벤트 구현
- [x] **PWA 설정** — manifest.json + service worker
- [x] **Supabase Auth + RLS** — Google/Email 로그인, RLS 정책
- [x] **Error Boundary** — app/error.tsx 앱 전체 크래시 방어
- [x] **Security Audit (기본)** — Open Redirect 방어, 프롬프트 인젝션 방어, RLS
- [x] **AI Quality Test** — 90/90 (100%) 테스트 케이스 통과
- [x] **Dead Code Cleanup** — amazonApi.ts, MockProvider.ts, debug/route.ts 등 6개 파일 삭제
- [x] **Console.log 전량 제거** — 13개 파일에서 41개 제거
- [x] **Phase 1 학습 시스템** — SearchLogger + search_logs/search_signals Supabase 테이블 + RLS
- [x] **Live QA 버그 수정 3건:**
  - 로딩 텍스트 색상 반응형 (데스크톱 진한색/모바일 흰색)
  - 필터 체크박스 긴 텍스트 겹침 수정
  - 가격 오타 허용 (dollors/bucks/dollers → $ 자동 변환)

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

- [ ] **Brand 검증 강화**
  - 알려진 브랜드 DB (Supabase) 구축 → AI 결과와 교차 검증

- [ ] **filter-utils.ts 개선 (AI 실패 시 fallback)**
  - STOPWORDS 확장 (32개 → 80개+)

### P2 — 데이터 축적 후
- [ ] **AI 역할 전환**
  - 충분한 category_templates 축적 후
  - AI: "axes 생성" → "카테고리 매칭 + 현재 제목에서 값 추출"로 전환

---

## B. Phase 2 — 프로바이더 확장 & 투자자 컨택 후

- [ ] **BestBuy Provider 활성화** — 코드 이미 존재, API 키 연결만 필요
- [ ] **Temu Provider 활성화** — 코드 이미 존재
- [ ] **Shein Provider 활성화** — 코드 이미 존재
- [ ] **Provider 플러그인 아키텍처 리팩토링** — 통일된 Provider 인터페이스 + country/currency 파라미터

---

## C. AI 자가 학습 로드맵 (POTAL_AI_EVOLUTION_ROADMAP.docx 참조)

### Phase 1 — 데이터 수집 (✅ 구현 완료)
- [x] SearchLogger — fire-and-forget 비동기 로깅
- [x] search_logs 테이블 (Supabase)
- [x] search_signals 테이블 (Supabase)
- [x] signals API endpoint

### Phase 2 — 주간 메트릭스 대시보드 (Post-Launch)
- [ ] 주간 자동 분석 파이프라인
- [ ] 실패 패턴 자동 감지
- [ ] 프롬프트 최적화 제안

### Phase 3 — 자동 분석 파이프라인 (Post-Launch)
- [ ] 프롬프트 A/B 테스트
- [ ] 규칙 자동 생성/수정

### Phase 4-6 — 모델 파인튜닝 (장기)
- [ ] Phase 4: Adapter/LoRA 파인튜닝
- [ ] Phase 5: 전용 소형 모델 학습
- [ ] Phase 6: 온디바이스 추론 (FastVLM 등 참고)

---

## D. UX/UI 개선

### P1
- [ ] **Image Search (사진 검색)**
  - Vision API로 상품 식별 → 검색어 생성
  - 모델: GPT-4o / Claude Vision (~$0.02/검색)

### P2
- [ ] **User Profile 확장**
  - Price↔Speed 슬라이더 (단일 설정)
  - Best Score 가중치 조절

---

## E. Launch 준비 (나머지)

- [ ] **SEO + OG Tags** — 검색 결과 페이지 메타데이터, Open Graph 이미지
- [ ] **Performance 최적화** — API 병렬 호출 최적화, 검색 결과 캐싱
- [ ] **Google Play Console** — country change 지원 응답 대기 중
- [ ] **Apple Developer** — 계정 활성화 대기 중

---

## 진행 규칙

1. **한 번에 하나씩**: 체크리스트 순서대로 진행, 한 항목 완료 후 다음으로
2. **테스트 필수**: 각 항목 완료 시 `npm run dev` + 실제 검색 테스트
3. **TypeScript 통과**: 모든 변경 후 `npx tsc --noEmit` 통과 확인
4. **CHANGELOG 기록**: 주요 변경사항은 docs/CHANGELOG.md에 기록
5. **되돌릴 수 있게**: 큰 변경 전 git commit으로 복원점 확보

---

*Last updated: 2026-02-23 (MVP 최종 검수 + Live QA 버그 수정 완료)*
