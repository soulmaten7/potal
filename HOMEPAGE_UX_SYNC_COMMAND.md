# POTAL 홈페이지 UX 전체 동기화 명령어
# Claude Code 터미널에 전체 복사-붙여넣기

## 명령어:

```
지금부터 POTAL 홈페이지의 모든 사용자 대면 텍스트를 읽고, 최신 프로젝트 상태와 다른 부분을 전부 수정해라.

## 반드시 먼저 읽어라:
- session-context.md
- CLAUDE.md

## 확인해야 할 최신 수치 (2026-03-16 기준):
- 240개국/영토
- 50개 언어
- 113M+ tariff records (MFN 1,027,674 + MacMap NTLC 537,894 + MIN ~105M + AGR ~129M)
- 63 FTA
- 119,706 무역구제(AD/CVD/SG) 케이스
- 21,301 제재 엔트리 (sanctions screening)
- 8,389 product-HS 매핑 (1.7B+ product names classifiable)
- ~148 API 엔드포인트
- 142/147 기능 구현 (96.6%)
- 7개국 정부 API (US, EU, UK, CA, AU, JP, KR)
- 89,842 정부 관세 스케줄 (7개국 10자리)
- 12개국 sub-national tax
- MCP Server npm 공개 (potal-mcp-server@1.3.1, MCP 공식 레지스트리 등록)
- 37개 기능 S+ 업그레이드 완료 (Core 16 + Trade 21)

## 요금제 (CW13 'Grow With You' 전략 — 반드시 이 수치로 통일):
- Free: $0/mo — 200건/월 (전체 기능, 신용카드 불필요)
- Basic: $20/mo ($16/mo annual) — 2,000건/월, 초과 $0.015/건
- Pro: $80/mo ($64/mo annual) — 10,000건/월, 초과 $0.012/건, "Powered by POTAL" 제거
- Enterprise: $300/mo ($240/mo annual) — 50,000건/월, 초과 $0.01/건, SLA + 전담 지원
- Volume 100K+: $0.008/건 (Enterprise 협상)
- 모든 플랜에 전체 기능 포함 (Batch API, Webhook, Analytics Dashboard, 10-digit HS Code, FTA 등)
- 플랜별 Batch 한도: Free 50건 / Basic 100건 / Pro 500건 / Enterprise 5,000건

## 읽고 수정해야 할 파일 목록 (전부 다 확인):

### 메인 페이지 (최우선):
1. app/page.tsx — 홈페이지 (Hero, 핵심 수치, 기능 소개, CTA)
2. app/pricing/page.tsx — 요금제 페이지 (플랜 카드 + Compare Plans 테이블)
3. app/developers/page.tsx — 개발자 포털 (API 소개, 코드 예시)
4. app/dashboard/DashboardContent.tsx — 대시보드 (사용자 첫 화면)
5. components/layout/Header.tsx — 헤더 네비게이션
6. components/layout/Footer.tsx — 푸터 (소셜 링크, Trust Badges)

### 기능/정보 페이지:
7. app/faq/page.tsx — FAQ (수치, 기능 설명)
8. app/about/page.tsx — About 페이지
9. app/contact/page.tsx — 문의 페이지
10. app/help/page.tsx — 도움말
11. app/developers/docs/page.tsx — API 문서
12. app/developers/quickstart/page.tsx — 빠른 시작
13. app/widget/demo/page.tsx — 위젯 데모
14. app/partners/page.tsx — 파트너 페이지
15. app/community/page.tsx — 커뮤니티
16. app/blog/page.tsx — 블로그

### 인증/온보딩:
17. app/auth/signup/page.tsx — 회원가입 (CTA 문구)
18. app/auth/login/page.tsx — 로그인
19. components/auth/OnboardingModal.tsx — 온보딩 모달

### 컴포넌트:
20. components/home/HeroVisuals.tsx — Hero 시각 요소
21. components/home/SearchWidget.tsx — 검색 위젯
22. components/ProductTour.tsx — 제품 투어

### 비즈니스 로직 (수치 하드코딩 확인):
23. app/lib/plan-checker.ts — 플랜 체커 (한도, 기능)
24. middleware.ts — 미들웨어 (플랜 관련)

### i18n (영어 기준 확인 → ko.ts도 확인):
25. app/i18n/translations/en.ts — 영어 번역
26. app/i18n/translations/ko.ts — 한국어 번역

## 수정 기준:

### 1. 수치 불일치 (반드시 수정):
- "100+ countries" → "240 countries"
- "30 languages" → "50 languages"
- "500 free" or "100 free" → "200 free calculations/month"
- "103 API endpoints" → "~148 API endpoints"
- 구 요금제 수치 (Starter $9, Growth $29 등) → 현행 요금제로 교체
- "Powered by LemonSqueezy" → Paddle 관련으로 이미 변경됐을 수 있으니 확인만

### 2. 기능 설명 업데이트:
- MCP Server 언급이 없으면 추가 (npx potal-mcp-server, MCP 공식 레지스트리)
- Sanctions screening 언급이 없으면 추가 (21K+ entries, fuzzy matching)
- Trade remedies 언급이 없으면 추가 (119K+ cases)
- AI HS Code classification 설명에 "1.7B+ product names" 포함
- Batch API가 모든 플랜에 포함된다는 점 확인
- S+ 업그레이드된 기능들 (explainability, confidence scores, multi-language etc.)

### 3. 메시징 톤:
- "partner, not middleman" 메시지가 적절한 곳에 있는지 확인
- "Zero estimation. Government-verified data." 같은 신뢰 메시지
- Trust badges: GDPR, 240 Countries, SOC 2, 99.9% Uptime

### 4. 절대 수정 금지:
- lib/search/, lib/agent/, components/search/ (B2C 코드)
- Paddle 결제 로직 (동작 중)
- 이미 올바른 수치/내용은 건드리지 마라

## 작업 순서:
1. 위 파일들을 전부 읽어라 (cat 또는 에디터로)
2. 최신 수치와 다른 부분을 리스트로 정리해라
3. 수정이 필요한 파일만 수정해라
4. npm run build 로 빌드 확인해라
5. 수정한 파일 목록 + 변경 내용 요약을 보고해라

한 번에 하나의 파일만 수정하고, 각 수정 후 빌드가 깨지지 않는지 중간 확인해라.
```
