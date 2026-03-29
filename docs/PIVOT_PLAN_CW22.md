# POTAL 전략 피벗 계획서 — CW22
> 작성: 2026-03-29 KST
> CEO 확정: Exit(인수) 전략 중심, Forever Free, 바이럴 마케팅

---

## 전략 요약
- **출구전략**: Exit (인수) — 트래픽/데이터 극대화 → 인수
- **요금제**: Forever Free (140개 기능 전부 무료) + Enterprise Contact Us (가격 미표시)
- **수익**: Custom 세팅비 없음. 트래픽 데이터 = 인수 가치
- **가입 구조**: 필수 5개(1달 무료) → 프로필 완성(Forever Free)
- **마케팅**: 경쟁사 비교 차트 + "All Free" 바이럴 → Product Hunt/HN/Reddit/LinkedIn 동시 런칭

---

## 실행 리스트 (32개 항목)

### 순서 1 — A. 요금제 구조 변경
- A-1. 기존 4단계 요금제(Free/Basic/Pro/Enterprise) 폐기
- A-2. 새 구조: Forever Free (140개 전부 무료) + Enterprise Contact Us (가격 미표시, 문의 시 협의)
- A-3. Pricing 페이지를 "Everything Free" + Enterprise Contact Us로 교체
- A-4. 코드에서 plan 관련 로직 정리 (paddle 결제, plan-checker, 요금제 분기 등)

### 순서 1 — B. 가입/데이터 수집 구조 변경
- B-1. B2B/B2C 가입 경로를 하나로 통합
- B-2. 가입 시 필수 5개 (이메일, 비밀번호, 회사명, 국가, 업종) → 1달 무료
- B-3. 프로필 완성 시 추가 5개 (회사 규모, 월 배송 건수, 플랫폼, 수출입 국가, 연 매출) → Forever Free
- B-4. DB 스키마 변경 (sellers 테이블에 컬럼 추가)
- B-5. 대시보드에 프로필 완성도 UI + "완성하면 계속 무료" 안내
- B-6. 1달 후 프로필 미완성 시 접근 제한 로직

### 순서 2 — C. 홈 화면 리디자인
- C-1. 히어로: "140 Features. All Free."
- C-2. 10개 경쟁사 기능 수 비교 차트
- C-3. 10개 경쟁사 비용 비교 차트 (Enterprise 기준)
- C-4. "All Free" 강조 배지/배너

### 순서 3 — D. Features 페이지 강화
- D-1. 기능 카드 클릭 → 상세 가이드 페이지로 이동
- D-2. 각 기능별 상세 페이지: 설명 + API 예시 + 세팅 가이드
- D-3. 140개 상세 페이지 = SEO 140페이지
- D-4. 초보 셀러도 혼자 세팅 가능한 수준의 가이드

### 순서 3 — G. 커뮤니티/서포트 페이지
- G-1. 헤더에 "Community" 링크 추가
- G-2. 메인 페이지: 카테고리별 분류 (140개 기능 가이드 카테고리와 동일)
- G-3. 글쓰기 폼: 제목 + 유형(버그/질문/제안) + 기능 선택(140개 드롭다운) + 내용 + 첨부
- G-4. Features 가이드 → 이슈 제출 동선 연결
- G-5. Supabase 테이블 설계 (게시글, 댓글, 첨부파일)
- G-6. 게시글 목록 + 필터 (기능별, 유형별, 최신순/인기순)

### 순서 4 — F. 문서/코드 동기화
- F-1. session-context.md 피벗 기록
- F-2. CLAUDE.md 업데이트
- F-3. docs/PROJECT_STATUS.md 업데이트
- F-4. CHANGELOG.md 피벗 기록
- F-5. NEXT_SESSION_START.md 업데이트

### 순서 5 (마지막) — E. 바이럴 마케팅 런칭
- E-1. Product Hunt 런칭 페이지
- E-2. Hacker News 포스트 초안
- E-3. Reddit (r/ecommerce, r/shopify, r/entrepreneur) 포스트
- E-4. LinkedIn 포스트 (은태님 스토리 + 비교 차트)
- E-5. 경쟁사 비교 차트 이미지 (SNS 공유용)
- E-6. 모든 채널 동시 런칭

---

## CEO 결정 사항 (확정)
1. Exit(인수) 전략 중심으로 간다
2. 140개 기능 전부 Forever Free
3. Custom 세팅비 없음 — 대신 140개 상세 가이드로 셀프서비스
4. Enterprise Contact Us만 문의 폼으로 유지 (적극 마케팅 안 함)
5. 가입 시 필수 5개 → 1달 무료 / 프로필 완성 → Forever Free
6. 홈 화면에 경쟁사 비교 차트 + 비용 비교 차트 필수
7. 바이럴 마케팅은 사이트 완성 후 동시 런칭
