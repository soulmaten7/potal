# POTAL 홈페이지 전체 정밀 점검 + 수정 명령어
> Claude Code 터미널에 복사해서 붙여넣기

```
POTAL 홈페이지 & 전체 웹앱 정밀 점검 + 세계최고 수준으로 수정.

⚠️ 절대 규칙:
- DB(Supabase)가 지금 과부하. DB 쿼리/API 호출 테스트 하지 마. 코드만 읽고 수정해.
- B2C 코드(lib/search/, lib/agent/, components/search/) 수정 금지.
- console.log 금지. 프로덕션 코드에 남기지 않기.
- 수정 후 반드시 npm run build 통과 확인.

## 기준: Stripe, Linear, Vercel, Notion 수준의 UX

---

## PHASE 1: 크리티컬 버그 수정 (사용자가 즉시 느끼는 문제)

### 1.1 Dashboard 데이터 로딩 — 무한 로딩 방지
파일: app/dashboard/DashboardContent.tsx (1,737줄)
문제: /api/v1/sellers/me fetch에 timeout 없음 → DB 느리면 무한 로딩
수정:
- 공통 유틸리티 먼저 생성: app/lib/fetch-with-timeout.ts
  ```typescript
  export async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs = 10000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
  ```
- DashboardContent.tsx의 모든 fetch를 fetchWithTimeout으로 교체 (10초 timeout)
- timeout 시 에러 메시지: "서버 응답이 느립니다. 잠시 후 다시 시도해주세요." + 재시도 버튼
- 자동 재시도: 실패 시 5초 후 1회 자동 재시도
- Plan 로드 실패 시 fallback: "Free Plan (확인 중)" 표시 (빈 화면 절대 안됨)

### 1.2 Dashboard Skeleton UI 강화
파일: app/dashboard/DashboardContent.tsx
문제: 로딩 중 "Loading dashboard..." 텍스트만 표시
수정:
- 로딩 상태에서 회색 skeleton 박스 애니메이션 표시 (Stripe 스타일)
- Overview 탭: 사용량 바, 통계 카드, Quick Links 각각 skeleton
- Keys 탭: 테이블 rows skeleton
- 최소 300ms 로딩 표시 (깜빡임 방지)

### 1.3 Dashboard 탭 전환 디바운싱
파일: app/dashboard/DashboardContent.tsx
문제: 탭 빠르게 클릭하면 API 요청 중복 발생
수정:
- analytics 로딩에 debounce 300ms 적용
- 이전 요청 진행 중이면 AbortController로 취소 후 새 요청
- 탭 전환 시 이전 탭 데이터 캐시 유지 (같은 세션 내)

### 1.4 로그인 페이지 UX
파일: app/auth/login/page.tsx (232줄)
수정:
- "Forgot password?" 텍스트를 실제 Link로 변경 → /auth/forgot-password
- 비밀번호 최소 6자 클라이언트 검증 추가
- 로그인 실패 시 에러 메시지를 구체적으로 ("이메일 또는 비밀번호가 올바르지 않습니다")
- 입력 필드에 아이콘 추가 (이메일: 봉투, 비밀번호: 자물쇠)

---

## PHASE 2: 네비게이션 & 라우팅 완벽화

### 2.1 Header 로고 → 홈 네비게이션
파일: components/layout/Header.tsx (336줄)
문제: Button onClick → router.push('/') (클라이언트 라우팅, 느릴 수 있음)
수정: Next.js <Link href="/"> 로 교체. prefetch 활성화.
- 데스크톱 로고 + 모바일 로고 둘 다 Link로 변경
- 모바일 메뉴 안의 로고도 동일하게

### 2.2 Header 활성 링크 상태
파일: components/layout/Header.tsx
점검: 현재 페이지에 맞는 활성 상태(underline) 정확히 작동하는지 확인
- /pricing 접속 시 Pricing 링크 활성
- /developers 접속 시 Developers 링크 활성
- /dashboard 접속 시 Dashboard 링크 활성
- /dashboard/team 등 하위 경로도 Dashboard 활성
- 빠진 경로 있으면 추가

### 2.3 모바일 메뉴 UX 개선
파일: components/layout/Header.tsx
수정:
- 메뉴 열 때 body scroll lock 확인 (overflow: hidden)
- ESC 키로 메뉴 닫기
- 메뉴 항목 클릭 시 자연스럽게 닫히는지 확인
- 메뉴 열림/닫힘 transition 자연스러운지 확인 (200-300ms)

### 2.4 MobileBottomNav 점검
파일: components/layout/MobileBottomNav.tsx
점검: 모든 링크 정상 작동, 활성 상태 표시, 아이콘 일관성

### 2.5 Footer 링크 전체 점검
파일: components/layout/Footer.tsx (163줄)
수정:
- 모든 Footer 링크가 실제 존재하는 페이지로 연결되는지 확인
- 깨진 링크 있으면 수정 또는 제거
- Newsletter form: "성공" 표시가 실제 전송 여부와 관계없이 나오는 문제 → 에러 시 에러 메시지 표시

---

## PHASE 3: 에러 핸들링 & 복원력 (Resilience)

### 3.1 글로벌 에러 바운더리 개선
파일: app/error.tsx (48줄)
수정:
- 브랜드 컬러 적용 (navy/orange)
- "홈으로 돌아가기" 버튼 추가
- "다시 시도" 버튼 디자인 개선
- 에러 유형별 메시지:
  - 네트워크 에러: "인터넷 연결을 확인해주세요"
  - 서버 에러: "서버에 일시적인 문제가 있습니다"
  - 기본: "예상치 못한 오류가 발생했습니다"
- console.error 제거 (프로덕션에서 불필요)

### 3.2 404 페이지 점검
파일: app/not-found.tsx (58줄)
점검: 4개 CTA 버튼 모두 정상 작동하는지 확인. 디자인 일관성.

### 3.3 Tariff 페이지 에러 처리
파일: app/tariff/[country]/[hs]/page.tsx
점검: DB 응답 실패 시 graceful fallback 있는지
수정: 서버 컴포넌트에서 try-catch 감싸고, 에러 시 "관세 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해주세요." 표시

---

## PHASE 4: 성능 최적화

### 4.1 IntersectionObserver 풀링
파일: app/page.tsx (926줄)
문제: FadeInSection 컴포넌트가 각각 IntersectionObserver 생성 (비효율)
수정:
- 하나의 IntersectionObserver로 모든 FadeInSection 관리하는 커스텀 훅 생성
- app/hooks/useIntersectionObserver.ts 또는 page.tsx 내부에 구현
- threshold: 0.1, rootMargin: '0px 0px -50px 0px'

### 4.2 AnimatedNumber 메모리 누수
파일: app/page.tsx
문제: setInterval cleanup 불완전
수정: useEffect return에서 clearInterval 확실히 호출. target 변경 시 이전 interval 정리.

### 4.3 Dashboard 코드 분할
파일: app/dashboard/DashboardContent.tsx (1,737줄)
문제: 18개 탭이 하나의 컴포넌트에 전부 있음
수정 (최소한):
- 각 탭의 렌더링 로직을 메모이제이션 (useMemo 또는 React.memo)
- 탭 컨텐츠가 선택되지 않은 탭은 렌더링하지 않도록 조건부 렌더링 확인
- AnalyticsCharts는 이미 dynamic import → 확인만

### 4.4 240개국 드롭다운 가상화
파일: app/dashboard/DashboardContent.tsx (Widget 설정 내 Origin 드롭다운)
문제: 240개국 한번에 렌더링 → 저사양 기기 느림
수정: 검색 필터링 시 상위 20개만 렌더링 + "더 보기" 또는 스크롤 시 추가 로딩

### 4.5 이미지 최적화
전체 파일 점검:
- <img> 태그 사용 있으면 next/Image로 교체
- SVG 인라인 사용 확인 (OK)
- og-image.png 존재 + 최적화 확인

---

## PHASE 5: 페이지별 디테일 점검

### 5.1 홈페이지 (app/page.tsx, 926줄)
점검 & 수정:
- Hero 섹션: CTA 버튼 2개 모두 올바른 경로로 이동하는지 (Calculate → /auth/signup, Read Docs → /developers)
- Stats 카운터: 숫자가 CLAUDE.md와 일치하는지 (240, 113M+, 63, 50)
- Trust badges: "WTO, USITC, EU TARIC, UK HMRC, CBSA, KCS, OFAC" 텍스트 정확한지
- Features 6개 카드: 클릭 가능한 항목이면 올바른 경로로 이동하는지
- Widget Demo: LiveWidgetDemo의 8개국 데이터가 합리적인지 (duty rate, tax 등)
- Before vs After 섹션: 숫자("48% cart abandonment", "25% conversion increase") 출처 있는지
- Pricing 티저: 4개 플랜 가격이 실제 pricing 페이지와 일치하는지
  - Free $0/200건, Basic $20/2,000건, Pro $80/10,000건, Enterprise $300/50,000건
- Final CTA: "Get Started Free" → /auth/signup, "Talk to Sales" → /pricing 또는 /contact

### 5.2 가격 페이지 (app/pricing/page.tsx)
점검 & 수정:
- 4개 플랜 가격 정확한지 (Monthly/Annual)
- Annual 토글 시 20% 할인 정확히 계산되는지
  - Basic: $16/mo, Pro: $64/mo, Enterprise: $240/mo
- 초과 요금(overage) 정확한지: Basic $0.015, Pro $0.012, Enterprise $0.01
- Enterprise Inquiry 폼: 작동 확인, 볼륨 입력에 min="0" 추가
- 12개 FAQ 아코디언: 열기/닫기 정상, 내용 최신인지
- "Grow With You" 전략 반영: Free/Basic도 Batch API, Webhook, Analytics 포함인지 명시
- Compare Plans 테이블 있으면 기능 비교 정확한지

### 5.3 개발자 페이지 (app/developers/page.tsx)
점검 & 수정:
- API Explorer: mock 데이터로 동작 확인 (DB 호출 없이)
- Code Tabs: cURL/JavaScript/Python 코드가 실제 API 스펙과 일치하는지
- Copy 버튼: 클릭 시 "Copied!" 피드백 정상인지
- 사이드바 네비게이션: 스크롤 시 활성 섹션 하이라이트 정상인지
- API 엔드포인트 URL이 https://www.potal.app/api/v1/... 인지 확인

### 5.4 도움말 페이지 (app/help/page.tsx, 246줄)
점검 & 수정:
- 검색: 대소문자 구분 없이 작동하는지
- 카테고리 필터: 6개 버튼 모두 정상 동작
- 13개 FAQ 아코디언: 열기/닫기 animation 자연스러운지
- Contact Form: topic URL 파라미터 연동 정상인지 (?topic=sell)
- ContactForm 컴포넌트 (components/help/ContactForm.tsx): 전송 작동 확인

### 5.5 FAQ 페이지 (app/faq/page.tsx, 138줄)
점검: 55개 FAQ 전부 열기/닫기 정상, 카테고리 필터 정상, 검색 정상

### 5.6 소개 페이지 (app/about/page.tsx, 112줄)
점검: 4개 통계 숫자 최신인지, CTA 링크 정상인지
수정: 하드코딩된 "8,389 mappings" 같은 숫자가 있으면 최신화 (1,362,900+)

### 5.7 법률 페이지 (app/legal/[slug]/page.tsx)
점검: /terms, /privacy, /refund 3개 전부 정상 렌더링되는지

---

## PHASE 6: 모바일 반응형 완벽화

### 6.1 Dashboard 모바일 레이아웃
파일: app/dashboard/DashboardContent.tsx
문제: 18개 탭 + 사이드바가 모바일에서 cramped
수정:
- 탭 네비게이션: 가로 스크롤 가능한 pill/chip 형태 (overflow-x: auto)
- API Keys 테이블: 모바일에서 카드 레이아웃으로 전환 (768px 이하)
- Logs 테이블: 동일하게 카드 레이아웃
- Widget 설정: 세로 스택 레이아웃

### 6.2 Developers 페이지 모바일
파일: app/developers/page.tsx
수정:
- 코드 블록: 가로 스크롤 + 스크롤바 표시
- API Explorer: 2컬럼 → 1컬럼 (768px 이하)
- 사이드바: 모바일에서 숨기거나 상단 드롭다운으로 변환

### 6.3 Pricing 페이지 모바일
파일: app/pricing/page.tsx
점검: 4개 플랜 카드가 세로로 잘 쌓이는지, Compare Plans 테이블 가로 스크롤 가능한지

---

## PHASE 7: 접근성 (Accessibility) A+ 등급

### 7.1 ARIA 속성 완성
전체 파일:
- 모든 인터랙티브 요소에 aria-label 확인
- 드롭다운: aria-expanded, aria-haspopup
- 모달/오버레이: aria-modal, role="dialog"
- 토스트: role="alert", aria-live="polite"
- 로딩 상태: aria-busy="true"

### 7.2 키보드 네비게이션
- Tab 키로 모든 인터랙티브 요소 접근 가능한지
- Enter/Space로 버튼/링크 활성화
- ESC로 모달/드롭다운 닫기
- 드롭다운 내부: 방향키로 이동

### 7.3 포커스 관리
- 모달 열 때 포커스 trap (모달 밖으로 Tab 못 나감)
- 모달 닫을 때 트리거 요소로 포커스 복귀
- 에러 발생 시 에러 메시지로 포커스 이동

---

## PHASE 8: SEO 최적화

### 8.1 페이지별 메타데이터
현재 대부분의 페이지가 루트 default 타이틀 사용 → 각 페이지별 고유 title + description 추가:
- /pricing: title="Pricing - POTAL", description="Simple, transparent pricing. Start free with 200 API calls/month..."
- /developers: title="API Documentation - POTAL", description="Integrate landed cost calculations..."
- /help: title="Help Center - POTAL", description="Find answers to common questions..."
- /faq: title="FAQ - POTAL", description="Frequently asked questions about duties, taxes..."
- /about: title="About - POTAL", description="Our mission to make cross-border commerce transparent..."
- /dashboard: title="Dashboard - POTAL" (기본 제목)
- 각 페이지 파일 상단에 export const metadata = { ... } 추가

### 8.2 FAQ 구조화 데이터
파일: app/faq/page.tsx
추가: FAQPage JSON-LD 스키마 (Google Rich Snippets 대응)
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{ "@type": "Question", "name": "...", "acceptedAnswer": { "@type": "Answer", "text": "..." } }]
}
```

### 8.3 Pricing 구조화 데이터
파일: app/pricing/page.tsx
추가: Product + Offer JSON-LD (가격 정보 검색 노출)

---

## PHASE 9: 보안 점검

### 9.1 하드코딩된 시크릿 제거
파일: app/layout.tsx
문제: Shopify API key 하드코딩 fallback ('2fa34ed65342ffb7fac08dd916f470b8')
수정: 환경변수만 사용, fallback은 빈 문자열 또는 에러 로그

### 9.2 에러 메시지 정보 노출 방지
전체 점검: 에러 응답에 스택 트레이스, DB 상세, 내부 경로 노출 없는지

---

## PHASE 10: 코드 품질

### 10.1 TypeScript 엄격 점검
- any 타입 사용 있으면 적절한 타입으로 교체
- 미사용 import 제거
- 미사용 변수/함수 제거

### 10.2 일관성
- 색상값: 하드코딩 대신 CSS 변수 사용 (--potal-navy, --potal-orange)
- 간격: 일관된 padding/margin (4px 단위)
- 폰트 크기: 일관된 스케일 (rem 기반)
- 버튼 스타일: 일관된 border-radius, padding, hover 효과

---

## 작업 순서
1. PHASE 1 (크리티컬) → 2. PHASE 2 (네비게이션) → 3. PHASE 3 (에러 핸들링) → 4. PHASE 5 (페이지별 점검) → 5. PHASE 4 (성능) → 6. PHASE 6 (모바일) → 7. PHASE 7 (접근성) → 8. PHASE 8 (SEO) → 9. PHASE 9 (보안) → 10. PHASE 10 (코드 품질)

## 작업 방법
1. 각 Phase의 파일을 cat으로 전체 읽어라
2. 문제점 찾으면 즉시 수정
3. Phase 끝날 때마다 npm run build 통과 확인
4. 최종 수정 파일 목록 + 각 파일에서 뭘 고쳤는지 보고
5. git add + commit은 하지 마 (내가 확인 후 할게)

## 최종 출력
수정 완료 후 아래 형식으로 보고:
---
📋 POTAL UI/UX 정밀 점검 리포트
수정 파일: [N]개
Phase 1: [수정 내역]
Phase 2: [수정 내역]
...
빌드: ✅ npm run build 통과
남은 이슈: [있으면 기록]
---
```
