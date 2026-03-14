# POTAL UX 디테일 감사 리포트
## 세계 최고 수준 기준 — Pixel-Perfect 점검
### 2026-03-14 | 대상: www.potal.app 전체

---

## 전체 평가: B+ → A+ 로 올리기 위한 53개 항목

현재 potal.app은 기능적으로 잘 작동하고, 기본 디자인도 깔끔합니다. 하지만 Stripe, Linear, Vercel 같은 세계 최고 수준 B2B SaaS와 비교하면 "디테일의 차이"가 보입니다. 아래는 A+ 수준으로 끌어올리기 위한 구체적인 항목들입니다.

---

## 1. 타이포그래피 (Typography)

### 1-1. 폰트 위계가 불명확
- **현재**: Inter 하나로 모든 텍스트 처리. heading과 body 구분이 font-weight로만 됨
- **개선**: heading에 font-weight 700~800, body에 400~500. letter-spacing도 heading은 -0.02em (타이트하게), body는 0으로 차별화
- **참고**: Stripe는 heading에 letter-spacing: -0.03em, Vercel은 Geist에 -0.025em 적용

### 1-2. 본문 line-height가 빡빡함
- **현재**: 기본 line-height (약 1.5)
- **개선**: 본문 텍스트 line-height: 1.7~1.75로. 특히 Help/FAQ 페이지처럼 글이 많은 곳은 가독성 차이가 큼
- **코드**: `leading-relaxed` (1.625) 또는 커스텀 `leading-[1.75]`

### 1-3. 숫자 폰트 처리
- **현재**: 가격($20, $80, $300)이 본문과 같은 스타일
- **개선**: 가격/통계 숫자에 `font-variant-numeric: tabular-nums` 적용. 가격표에서 숫자가 세로로 정렬됨
- **코드**: `tabular-nums` Tailwind 클래스

### 1-4. Hero 제목 크기
- **현재**: "The infrastructure for global commerce" — 적절한 크기
- **개선**: 모바일에서 제목이 3줄 이상 넘어가면 가독성 떨어짐. `clamp(2rem, 5vw, 3.75rem)` 같은 fluid typography 적용 권장

---

## 2. 컬러 시스템 (Color System)

### 2-1. 텍스트 대비(Contrast) 미세 조정
- **현재**: `text-slate-500`이 보조 텍스트에 사용됨
- **문제**: slate-500 (#64748B)은 흰 배경에서 WCAG AA 기준(4.5:1) 미달 가능
- **개선**: 보조 텍스트는 `text-slate-600` (#475569, 대비율 5.7:1)으로. slate-500은 캡션/라벨에만

### 2-2. CTA 버튼 색상 일관성
- **현재**: "Calculate Duties Free"가 메인 CTA인데, 다른 페이지에서 CTA 색상이 통일되지 않을 수 있음
- **개선**: Primary CTA = 항상 동일한 브랜드 컬러 (예: indigo-600 또는 커스텀 POTAL blue). Secondary CTA = outline 스타일. 페이지마다 다르면 안 됨

### 2-3. 다크 네이비 배경 (#02122c) 활용
- **현재**: 헤더에만 사용
- **개선**: hero 섹션에 그라데이션 적용하면 더 임팩트 있음. `bg-gradient-to-b from-[#02122c] to-[#0a1e3d]` 같은 미세한 그라데이션

### 2-4. 코드 블록 색상
- **현재**: Developer 페이지 코드 예시의 syntax highlighting
- **개선**: 코드 블록 배경을 `#0d1117` (GitHub Dark) 또는 `#1e1e2e` (Catppuccin) 계열로 통일. JSON response 예시도 동일 테마 적용

---

## 3. 스페이싱 & 레이아웃 (Spacing & Layout)

### 3-1. 섹션 간 여백 불균일
- **현재**: Hero → How It Works → Features 섹션 간 패딩이 섹션마다 다를 수 있음
- **개선**: 모든 주요 섹션 사이 `py-24` (96px) 또는 `py-32` (128px)로 통일. 일관된 리듬감

### 3-2. 카드 간 간격
- **현재**: Features 그리드의 카드들 사이 gap
- **개선**: `gap-6` (24px) 통일. 카드 내부 padding은 `p-6` 또는 `p-8`. 카드 사이 간격 = 카드 내부 패딩의 절반~동일

### 3-3. 컨테이너 max-width
- **현재**: 표준 Tailwind `max-w-7xl` (80rem = 1280px)
- **개선**: 대형 모니터(1440px+)에서 콘텐츠가 너무 좁아 보일 수 있음. Hero는 `max-w-6xl`, 콘텐츠는 `max-w-5xl`로 적절히 좁히면 가독성 UP
- **참고**: Stripe는 콘텐츠 영역이 ~1100px, Vercel은 ~1200px

### 3-4. 모바일 좌우 패딩
- **현재**: `px-4` (16px)
- **개선**: `px-5` (20px) 또는 `px-6` (24px). 16px는 현대 기준 살짝 좁음. 특히 iPhone 15 Pro Max 같은 큰 화면에서는 20px이 더 여유 있어 보임

---

## 4. 버튼 & 인터랙션 (Buttons & Interactions)

### 4-1. 버튼 크기 체계
- **현재**: rounded-xl 적용
- **개선**: 버튼 높이를 체계화:
  - Small: h-8 (32px) — 보조 액션
  - Medium: h-10 (40px) — 일반 버튼
  - Large: h-12 (48px) — Hero CTA, 가격표 CTA
  - 모든 버튼에 `min-w-[120px]` 추가하여 너무 좁은 버튼 방지

### 4-2. 호버 효과 강화
- **현재**: 기본 hover transition
- **개선**:
  - Primary CTA: `hover:shadow-lg hover:shadow-indigo-500/25 transition-all duration-200`
  - 카드: `hover:-translate-y-1 hover:shadow-xl transition-all duration-300`
  - 링크: `hover:text-indigo-500 transition-colors duration-150`
- **핵심**: `transform` + `shadow` 동시 변화가 가장 프리미엄해 보임

### 4-3. 클릭 피드백 (Active State)
- **현재**: active 상태 스타일이 없을 수 있음
- **개선**: `active:scale-[0.98]` 추가. 버튼 누를 때 미세하게 들어가는 느낌. 모바일에서 특히 중요

### 4-4. Focus Ring
- **현재**: 기본 브라우저 focus 스타일
- **개선**: `focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2` — 키보드 접근성 + 디자인 모두 충족

---

## 5. 네비게이션 (Navigation)

### 5-1. 스크롤 시 헤더 변화
- **현재**: 고정 헤더 (sticky)
- **개선**: 스크롤 시 `backdrop-blur-xl bg-white/80 border-b border-slate-200/50` 적용. 유리 효과(glassmorphism) — Vercel, Linear가 사용하는 패턴

### 5-2. 현재 페이지 표시
- **현재**: 네비게이션에서 현재 페이지 강조 여부 불확실
- **개선**: 현재 페이지 링크에 `font-medium text-indigo-600` + 하단에 2px 인디고 바. 나머지는 `text-slate-600`

### 5-3. 모바일 네비게이션
- **현재**: Bottom nav 컴포넌트 존재
- **확인 필요**: 햄버거 메뉴 애니메이션이 부드러운지, 열렸을 때 배경 오버레이가 있는지, 스크롤 잠금이 되는지

---

## 6. Hero 섹션

### 6-1. 신뢰 지표 (Social Proof) 부재
- **현재**: 240 Countries, 113M+ HS Codes 등 자체 통계만 표시
- **개선**: "Trusted by" 로고 바 추가 (Shopify, WooCommerce 등 연동 플랫폼 로고). 또는 "Built on official government data from 7 countries" 같은 신뢰 문구
- **영향**: B2B 전환율에 가장 큰 영향을 미치는 요소

### 6-2. 통계 카드 디자인
- **현재**: 4개 메트릭이 나열됨
- **개선**: 각 메트릭에 미세한 배경(bg-slate-50) + border + 아이콘. 숫자는 2xl bold, 라벨은 sm text-slate-500. 호버 시 살짝 확대

### 6-3. "113M+ HS Codes" 표현
- **문제**: HS Code가 113M개가 아니라, MFN 관세율 데이터가 113M+행임
- **개선**: "113M+ Tariff Records" 또는 "113M+ Duty Rate Records"가 더 정확

---

## 7. 가격표 페이지 (Pricing)

### 7-1. "MOST POPULAR" 뱃지
- **현재**: Pro 플랜에 표시
- **개선**: 뱃지를 카드 상단에 걸치게 (position: absolute, top: -12px). 배경색을 그라데이션으로. 카드 자체에 `ring-2 ring-indigo-500`로 테두리 강조

### 7-2. 가격 표시 형식
- **현재**: $20/month, $80/month
- **개선**:
  - 달러 기호를 작게: `<span class="text-lg">$</span><span class="text-4xl font-bold">20</span><span class="text-sm">/month</span>`
  - Annual 토글 시 원래 가격에 취소선 + 할인가 강조
  - 절약 금액을 초록색으로: "Save $48/year" → `text-emerald-500 font-medium`

### 7-3. Feature Comparison 테이블
- **현재**: 체크마크(✓)와 대시(—)
- **개선**:
  - ✓ → 초록 원 안에 체크 아이콘 (`bg-emerald-100 text-emerald-600 rounded-full w-5 h-5`)
  - — → 연한 회색 X 또는 빈 원 (`text-slate-300`)
  - 줄마다 교대 배경 (`even:bg-slate-50`)
  - 호버 시 해당 행 하이라이트

### 7-4. Enterprise "Get Custom Pricing" CTA
- **현재**: 다른 플랜과 동일한 버튼 스타일일 수 있음
- **개선**: Enterprise만 차별화 — `bg-gradient-to-r from-indigo-600 to-purple-600` 또는 다크 테마 버튼. "Talk to Sales" 같은 더 인간적인 문구도 고려

---

## 8. Developer 페이지

### 8-1. 코드 예시 복사 버튼
- **현재**: 복사 버튼 존재 여부 불확실
- **개선**: 모든 코드 블록 우측 상단에 "Copy" 버튼. 클릭 시 "Copied!" + 체크 아이콘으로 변경 (2초 후 복귀). 이게 없으면 개발자 경험이 크게 떨어짐

### 8-2. 탭으로 언어 전환
- **현재**: cURL, JavaScript, Python 예시가 순서대로 나열
- **개선**: 탭 UI로 전환. 선택한 언어를 localStorage에 저장해서 다른 코드 블록에서도 같은 언어 표시 (Stripe Docs 패턴)

### 8-3. "Try it" 인터랙티브 API 탐색기
- **현재**: 정적 코드 예시
- **개선**: 입력값을 바꾸면 실시간으로 코드 + 응답이 바뀌는 인터랙티브 데모. Free 플랜 API key로 실제 호출까지 가능하면 최고

### 8-4. Sidebar 네비게이션
- **현재**: 앵커 링크로 섹션 이동
- **개선**: 좌측에 고정 사이드바 (sticky). 스크롤에 따라 현재 섹션 하이라이트. 깊이 표시 (들여쓰기)

---

## 9. Help/FAQ 페이지

### 9-1. 아코디언 UI
- **현재**: 모든 FAQ가 펼쳐져 있을 수 있음
- **개선**: 아코디언(접기/펼치기) 패턴. 질문 클릭 시 부드럽게 열림 (`transition-all duration-300`). 한 번에 하나만 열리거나, 여러 개 열릴 수 있게

### 9-2. 검색 기능
- **현재**: 없음
- **개선**: FAQ 상단에 검색 바. 실시간 필터링으로 관련 질문만 표시. FAQ가 13개밖에 없어도, 검색 바가 있으면 "도움 센터"다운 느낌

### 9-3. 카테고리 분류
- **현재**: 한 페이지에 모든 FAQ 나열
- **개선**: "Getting Started" / "Pricing & Billing" / "Technical" 카테고리 탭 또는 그룹핑. 아이콘 추가

---

## 10. 위젯 데모 섹션

### 10-1. 실시간 인터랙티브 데모
- **현재**: 위젯 프리뷰 이미지 또는 정적 스크린샷
- **개선**: 실제로 국가 선택 → 금액 입력 → 관세 계산이 되는 라이브 데모. 이게 potal.app의 킬러 세일즈 포인트

### 10-2. "Before vs After" 비교
- **현재**: 없음
- **개선**: "Without POTAL: 고객이 예상 못한 관세에 구매 포기" vs "With POTAL: 결제 전에 총 비용 확인 → 전환율 UP" 시각적 비교

---

## 11. Footer

### 11-1. 뉴스레터 구독
- **현재**: 없음
- **개선**: "Stay updated on trade regulation changes" + 이메일 입력 필드. B2B에서 리드 수집의 핵심 채널

### 11-2. 소셜 미디어 링크
- **현재**: 없음 또는 미확인
- **개선**: LinkedIn, Twitter/X, GitHub 아이콘. B2B는 특히 LinkedIn이 중요

### 11-3. 신뢰 뱃지
- **현재**: © 2026 POTAL만 표시
- **개선**: "SOC 2 Type II" / "GDPR Compliant" / "240 Countries" 같은 신뢰 뱃지 추가. Enterprise 고객이 Footer에서 확인하는 첫 번째 것

---

## 12. 마이크로 인터랙션 & 폴리시 (Polish)

### 12-1. 페이지 전환 애니메이션
- **현재**: Next.js 기본 (즉시 전환)
- **개선**: `framer-motion` 으로 페이지 전환 시 `fadeIn` (opacity 0→1, 200ms). 콘텐츠 로딩 시 `slideUp` (translateY: 10px→0)

### 12-2. 스크롤 애니메이션
- **현재**: 없음
- **개선**: Intersection Observer로 섹션 진입 시 `fadeInUp` 애니메이션. `stagger` 효과로 카드가 순차적으로 나타남. 과하지 않게, 한 번만 실행

### 12-3. 스켈레톤 로딩
- **현재**: Dashboard 로딩 시 "Redirecting to sign in..." 텍스트
- **개선**: 스켈레톤 UI (회색 박스가 깜빡이는 로딩 상태). `animate-pulse`로 콘텐츠 영역 자리 표시

### 12-4. 404 페이지
- **현재**: 기본적인 404 페이지
- **개선**: 브랜드에 맞는 일러스트 + "Looking for duties? Try our calculator" CTA. 404에서도 전환 기회

### 12-5. 토스트 알림
- **현재**: 폼 제출 후 피드백 방식 불확실
- **개선**: 우측 하단 토스트 알림. 성공 = 초록, 에러 = 빨강. 자동 사라짐 (3초). `sonner` 또는 `react-hot-toast` 라이브러리

---

## 13. 접근성 (Accessibility)

### 13-1. 이미지 alt 텍스트
- **확인 필요**: 모든 이미지/아이콘에 적절한 alt 텍스트가 있는지

### 13-2. 키보드 네비게이션
- **확인 필요**: Tab으로 모든 인터랙티브 요소 접근 가능한지. Focus ring이 보이는지

### 13-3. 스크린 리더
- **확인 필요**: aria-label, role 속성이 적절히 사용되고 있는지. 특히 가격표 토글, FAQ 아코디언

---

## 14. 성능 & 기술 (Performance)

### 14-1. 이미지 최적화
- **확인 필요**: Next.js Image 컴포넌트 사용 여부. WebP/AVIF 포맷. lazy loading

### 14-2. 폰트 로딩
- **현재**: Inter + Geist Mono
- **개선**: `font-display: swap` 확인. `preload`로 중요 폰트 미리 로드. 커스텀 서브셋으로 용량 축소

### 14-3. Core Web Vitals
- **확인 필요**: LCP < 2.5s, FID < 100ms, CLS < 0.1 달성 여부. Vercel Analytics로 모니터링

---

## 우선순위 TOP 10 (즉시 적용 → 전환율 UP)

| 순위 | 항목 | 영향도 | 난이도 |
|------|------|--------|--------|
| 1 | Hero에 "Trusted by" 로고 바 추가 | ★★★★★ | 쉬움 |
| 2 | 코드 블록 Copy 버튼 | ★★★★★ | 쉬움 |
| 3 | 가격표 숫자 타이포그래피 개선 | ★★★★☆ | 쉬움 |
| 4 | 스크롤 시 헤더 glassmorphism | ★★★★☆ | 중간 |
| 5 | 호버 효과 강화 (카드, 버튼) | ★★★★☆ | 쉬움 |
| 6 | FAQ 아코디언 UI | ★★★☆☆ | 중간 |
| 7 | 위젯 라이브 데모 | ★★★★★ | 어려움 |
| 8 | "113M+ HS Codes" → "113M+ Tariff Records" 수정 | ★★★★☆ | 쉬움 |
| 9 | 페이지 진입 fadeIn 애니메이션 | ★★★☆☆ | 중간 |
| 10 | Footer 소셜 링크 + 신뢰 뱃지 | ★★★☆☆ | 쉬움 |

---

## Claude Code 실행 명령

이 리포트를 Claude Code에 전달하여 구현:

> "portal 폴더에 있는 POTAL_UX_AUDIT_CW13.md 파일을 읽고, 우선순위 TOP 10부터 순서대로 구현해줘. 한 번에 하나씩."

---

*작성: UX Audit by Claude (Cowork) — 2026-03-14*
*기준: Stripe, Linear, Vercel, Notion 수준의 B2B SaaS UX*
