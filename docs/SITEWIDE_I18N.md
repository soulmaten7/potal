# SITEWIDE_I18N.md — 전체 사이트 다국어 번역 (홈페이지 제외)
# 실행: 터미널 2 (Phase별 순차 실행)
# 예상 소요: Phase당 20~30분
# 마지막 업데이트: 2026-04-05

---

## 현재 상태
- ✅ Homepage (app/page.tsx) — 73개 키, 7개 언어 완료
- ✅ Header (components/layout/Header.tsx) — nav.* 키 사용 중
- ⚠️ Footer (components/layout/Footer.tsx) — 70% 번역, 30% 하드코딩
- ❌ Features (app/features/page.tsx) — 전부 하드코딩
- ❌ Developers (app/developers/page.tsx) — 전부 하드코딩
- ❌ Pricing (app/pricing/page.tsx) — 전부 하드코딩
- ❌ Community (app/community/page.tsx) — 전부 하드코딩
- ❌ Help (app/help/page.tsx) — 전부 하드코딩

---

## ⚠️ 필수 규칙 (HOMEPAGE_I18N.md와 동일)

### 번역하지 않는 용어 (영어 유지)
HS Code, HTS, Total Landed Cost, De Minimis, FOB, CIF, DDP, FTA, MFN,
AD/CVD, Section 301/232, TARIC, OFAC SDN, BIS Entity List, API, REST API,
MCP, Widget, Shadow DOM, API Key, API Endpoints, POTAL, WTO, USITC,
EU TARIC, UK HMRC, CBSA, KCS, MacMap, GDPR, SOC 2

### 번역 대상 언어 (7개)
en, ko, ja, zh, es, de, fr

### 작업 패턴 (모든 Phase 동일)
1. 해당 페이지 파일 읽기 → 유저 대면 문자열 전수 추출
2. en.ts에 새 키 추가
3. ko/ja/zh/es/de/fr.ts에 번역 추가 (trade 용어 영어 유지)
4. 페이지 파일에서 하드코딩 → t() 호출로 교체
5. npm run build 확인

---

## Phase 1: Footer 완성 (10분)

**파일**: `components/layout/Footer.tsx`

### 누락된 하드코딩 문자열 (5개)
```
"Widget Playground"
"Widget Demo"
"Refund Policy"
"© 2026 POTAL. All rights reserved."
배지: 'GDPR Compliant', '240 Countries', 'SOC 2 Ready', '99.9% Uptime'
```

### en.ts에 추가할 키
```typescript
'footer.widgetPlayground': 'Widget Playground',
'footer.widgetDemo': 'Widget Demo',
'footer.refundPolicy': 'Refund Policy',
'footer.copyright': '© 2026 POTAL. All rights reserved.',
'footer.badge.gdpr': 'GDPR Compliant',
'footer.badge.countries': '240 Countries',
'footer.badge.soc2': 'SOC 2 Ready',
'footer.badge.uptime': '99.9% Uptime',
```

### ko.ts 번역
```typescript
'footer.widgetPlayground': 'Widget Playground',  // 기술 용어 유지
'footer.widgetDemo': 'Widget 데모',
'footer.refundPolicy': '환불 정책',
'footer.copyright': '© 2026 POTAL. All rights reserved.',
'footer.badge.gdpr': 'GDPR 준수',
'footer.badge.countries': '240개국',
'footer.badge.soc2': 'SOC 2 Ready',
'footer.badge.uptime': '99.9% 가동률',
```

### 나머지 언어도 동일 패턴으로 추가

---

## Phase 2: Features 페이지 (25분)

**파일**: `app/features/page.tsx`

### 작업 방법
1. 파일 전체 읽기
2. 모든 유저 대면 문자열 추출 (제목, 설명, 카테고리명, 필터 라벨 등)
3. `features.*` 키로 en.ts에 추가
4. 7개 언어 번역
5. 페이지에서 t() 호출로 교체

### 예상되는 키 구조
```typescript
// 페이지 제목/설명
'features.page.title': '...',
'features.page.subtitle': '...',

// 카테고리 필터
'features.category.all': 'All',
'features.category.classification': 'Classification',
'features.category.duties': 'Duties & Taxes',
// ... (카테고리별)

// 통계 배너
'features.stats.totalFeatures': '...',
'features.stats.countries': '...',
// ...

// 공통 라벨
'features.tryDemo': 'Try Demo',
'features.learnMore': 'Learn More',
'features.viewDocs': 'View API Docs',
```

### 주의사항
- `features-guides.ts`에 있는 140개 기능 데이터는 **이번 작업에서 번역하지 않음**
  → 데이터 레벨 번역은 별도 대규모 작업 (140개 × 7개 언어 = 980개 번역)
- 페이지 **레이아웃 텍스트만** 번역 (제목, 필터, 버튼, 통계)
- 기능 이름/설명은 영어 유지 (2차 작업으로 미룸)

---

## Phase 3: Pricing 페이지 (25분)

**파일**: `app/pricing/page.tsx`

### 예상되는 키 구조
```typescript
// 페이지 제목
'pricing.title': '...',
'pricing.subtitle': '...',

// Forever Free 뱃지/섹션
'pricing.free.title': 'Forever Free',
'pricing.free.description': '...',
'pricing.free.cta': '...',

// Enterprise 섹션
'pricing.enterprise.title': 'Enterprise',
'pricing.enterprise.description': '...',
'pricing.enterprise.cta': 'Contact Us',

// 비교 테이블
'pricing.comparison.title': '...',
'pricing.comparison.feature': 'Feature',
'pricing.comparison.free': 'Free',
'pricing.comparison.enterprise': 'Enterprise',

// FAQ
'pricing.faq.title': 'Frequently Asked Questions',
'pricing.faq.q1': '...',
'pricing.faq.a1': '...',
// ... (FAQ 항목별)
```

### 주의사항
- "Forever Free" — 이건 POTAL의 핵심 슬로건이므로 번역 시 각 언어에 맞게 자연스럽게
- 가격 관련 숫자 ($0, $50,000 등)는 번역하지 않음
- "Enterprise" — 각 언어에서 그대로 쓸 수 있으나, 현지화 필요 시 번역

---

## Phase 4: Developers 페이지 (20분)

**파일**: `app/developers/page.tsx`

### 예상되는 키 구조
```typescript
// 페이지 제목
'developers.title': '...',
'developers.subtitle': '...',

// API 문서 섹션
'developers.apiDocs.title': '...',
'developers.apiDocs.description': '...',

// 코드 예시 라벨
'developers.codeExample.title': '...',
'developers.codeExample.description': '...',

// Playground
'developers.playground.title': '...',
'developers.playground.cta': '...',

// SDK/Integration 섹션
'developers.sdk.title': '...',
// ...
```

### 주의사항
- **코드 블록 내용은 번역하지 않음** (curl 명령어, JSON 응답 등)
- 코드 주석도 영어 유지
- "REST API", "SDK", "cURL", "npm" 등 기술 용어 영어 유지
- UI 라벨과 설명 텍스트만 번역

---

## Phase 5: Community + Help 페이지 (20분)

**파일**:
- `app/community/page.tsx`
- `app/help/page.tsx`

### Community 키 구조
```typescript
'community.title': '...',
'community.subtitle': '...',
'community.category.discussion': 'Discussion',
'community.category.showcase': 'Showcase',
'community.category.feedback': 'Feedback',
'community.status.open': 'Open',
'community.status.resolved': 'Resolved',
// ...
```

### Help 키 구조
```typescript
'help.title': '...',
'help.subtitle': '...',
'help.search.placeholder': 'Search help articles...',
'help.category.gettingStarted': 'Getting Started',
'help.category.api': 'API Reference',
'help.category.billing': 'Billing & Plans',
// ...
// FAQ 항목 (질문/답변 쌍)
'help.faq.q1': '...',
'help.faq.a1': '...',
// ...
```

---

## 실행 방법

**각 Phase별로 터미널 2에서 실행:**

```
Phase 1 실행 → 빌드 확인 → 커밋
Phase 2 실행 → 빌드 확인 → 커밋
Phase 3 실행 → 빌드 확인 → 커밋
Phase 4 실행 → 빌드 확인 → 커밋
Phase 5 실행 → 빌드 확인 → 커밋
```

각 Phase를 독립 커밋으로 분리 → 문제 발생 시 해당 Phase만 롤백 가능.

---

## 지시사항 (터미널에 전달)

각 Phase에서 Claude가 해야 할 일:

1. **파일을 직접 읽고** 유저 대면 문자열을 전수 추출할 것
2. en.ts에 새 키를 추가하되, **기존 키와 중복되지 않도록** 확인
3. **trade/기술 용어**는 모든 언어에서 영어 유지 (상단 리스트 참조)
4. 번역은 **전문적이고 자연스러운** 현지 표현 사용
   - 기계번역 느낌 X
   - 각 언어권 B2B SaaS 사이트의 톤 참고
5. 페이지 파일이 서버 컴포넌트면 `'use client'` 추가 또는 클라이언트 래퍼 생성
6. **npm run build 반드시 확인** 후 커밋
7. 커밋 메시지: `feat: i18n Phase N — [페이지명] (en/ko/ja/zh/es/de/fr)`

---

## 예상 결과

| Phase | 페이지 | 예상 새 키 | 예상 시간 |
|-------|--------|----------|----------|
| 1 | Footer | ~8개 | 10분 |
| 2 | Features | ~30개 | 25분 |
| 3 | Pricing | ~40개 | 25분 |
| 4 | Developers | ~25개 | 20분 |
| 5 | Community + Help | ~35개 | 20분 |
| **합계** | | **~138개** | **~100분** |

기존 181개 + 138개 = **319개 번역 키** × 7개 언어
