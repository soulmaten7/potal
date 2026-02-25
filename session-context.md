# POTAL Session Context
> 마지막 업데이트: 2026-02-25 (iOS App Store 심사 제출 완료 — Build 2)

## 현재 상태 요약

POTAL은 여러 쇼핑몰에서 상품을 검색/비교하는 가격비교 서비스.
**현재 5개 RapidAPI 기반 provider만 활성화** (직접 상품 URL 제공).
Serper Google Shopping 기반 17개 provider는 2026-02-24 Coordinator에서 제거됨 (코드 파일은 남아있음).

**iOS 앱**: App Store Connect에 Build 2 심사 제출 완료 (태블릿 1440px 레이아웃 수정 포함).

---

## 오늘 (2026-02-25) 작업 요약

### 1. iOS 시뮬레이터 테스트 ✅
- iPhone 17 Pro 시뮬레이터에서 앱 실행 확인
- **문제 발견 및 해결**:
  - 스플래시 스크린이 사라지지 않음 → `launchShowDuration: 0` 설정으로 해결
  - 앱 내 링크가 Safari로 열림 → `allowNavigation: ['potal.app', '*.potal.app']` 추가로 해결
  - 검색창 탭 시 화면 확대(auto-zoom) → CSS `font-size: 16px !important` 적용으로 해결
  - 키보드 위 화살표/체크 버튼(accessory bar) → Swift method swizzling으로 제거

### 2. Xcode 설정 완료 ✅
- Display Name: `POTAL`
- Bundle Identifier: `com.potal.app`
- Minimum Deployments: iOS 16.6
- App Category: Shopping
- iPhone Orientation: Portrait
- iPad Orientation: 4방향 전부 (멀티태스킹 요구사항)

### 3. 앱 아이콘 ✅
- 기존 512x512 favicon을 1024x1024로 리사이즈 (PIL)
- Xcode Assets.xcassets에 적용

### 4. 개인정보 처리방침 ✅
- `app/privacy/page.tsx` 생성 → https://potal.app/privacy
- 14개 섹션, 다크 테마, 영문

### 5. App Store Connect 등록 및 심사 제출 ✅
- 앱 메타데이터 (설명, 키워드, 지원 URL 등) 입력 완료
- 개인정보 데이터 수집 3항목: 검색 기록, 기기 ID, 상품 상호작용
- iPhone/iPad 스크린샷 업로드
- Apple Distribution 인증서 + POTAL Distribution 프로비저닝 프로필 생성
- **Build 1** Archive → 업로드 → 심사 제출

### 6. 태블릿(iPad) 1440px 데스크톱 레이아웃 수정 ✅
- **문제**: iPad에서 상품 카드 레이아웃이 깨짐 (viewport ~1024px 문제)
- **목표**: PC 1440px 레이아웃과 동일하게 표시
- **실패한 접근법 (6가지)**:
  1. `<head>` inline script → 첫 로드만 적용, 네비게이션 시 리셋
  2. CSS `min-width: 1440px` → overflow만 발생, 스케일링 안 됨
  3. MutationObserver (destructive) → React 이벤트 핸들러 깨짐
  4. ViewportManager + usePathname → 클릭/네비게이션 깨짐
  5. Non-destructive setAttribute → Next.js가 계속 덮어씀
  6. Server-rendered `<meta>` + suppressHydrationWarning → 적용 안 됨
- **최종 해결**: **네이티브 iOS `TabletViewController.swift`** — `Element.prototype.setAttribute`를 monkey-patch하여 Next.js가 viewport를 변경하려 해도 무조건 `width=1440`으로 강제 변환
  - WKUserScript (atDocumentStart) + evaluateJavaScript (초기 페이지) + setInterval (폴링)
  - `Main.storyboard`에서 `CAPBridgeViewController` → `TabletViewController` (customModule: App)로 변경
- **Build 2** Archive → 업로드 → 심사 재제출 완료

---

## Capacitor iOS 앱 설정 상세

### capacitor.config.ts
```typescript
import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.potal.app',
  appName: 'POTAL',
  webDir: 'out',
  server: {
    url: 'https://potal.app',
    cleartext: false,
    allowNavigation: ['potal.app', '*.potal.app'],
  },
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    scheme: 'POTAL',
    backgroundColor: '#02122c',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      showSpinner: false,
      backgroundColor: '#02122c',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#02122c',
    },
  },
};
export default config;
```

### iOS 네이티브 파일 (Swift)

| 파일 | 역할 |
|------|------|
| `AppDelegate.swift` | 앱 생명주기 + KeyboardAccessoryFix 적용 |
| `KeyboardAccessoryFix.swift` | WKContentView method swizzling으로 키보드 accessory bar 제거 |
| `TabletViewController.swift` | CAPBridgeViewController 서브클래스. iPad에서 viewport를 1440px로 강제 잠금 (setAttribute monkey-patch) |
| `Main.storyboard` | customClass=`TabletViewController`, customModule=`App` |

### 태블릿 viewport 잠금 원리
```
Next.js: setAttribute('content', 'width=device-width') 호출
  ↓ monkey-patched setAttribute가 가로챔
  ↓ viewport meta → 'width=1440'으로 강제 변환
  ↓ iPad 화면에 PC 1440px 레이아웃이 축소되어 표시
```

### 왜 WebView(server.url) 방식인가
- Next.js 16 SSR + Vercel 배포 → `output: 'export'` (정적 빌드) 불가능
- API 라우트 (`/api/search`, `/api/intent` 등)와 Supabase SSR 미들웨어가 있어서 서버가 필요
- WebView로 potal.app URL을 로드하는 것이 가장 적합

### 설치된 Capacitor 패키지
- @capacitor/core ^8.1.0
- @capacitor/cli ^8.1.0
- @capacitor/ios ^8.1.0
- @capacitor/splash-screen ^8.0.1
- @capacitor/status-bar ^8.0.1

---

## 이전 세션 (2026-02-24) 작업 요약

### 1. Serper 17개 provider 제거 ✅
- Coordinator.ts에서 Serper 관련 코드 전부 제거
- 5개 RapidAPI provider만 유지
- 커밋: `9ea57b3` — push 완료

### 2. 음성 검색 (마이크) 기능 추가 ✅
- `useVoiceSearch.ts` — Web Speech API 기반 커스텀 훅
- 홈 검색창 + 검색결과 헤더에 마이크 버튼
- 커밋: `9f1b716` — push 완료

### 3. Capacitor iOS 프로젝트 초기 설정 ✅
- capacitor.config.ts, package.json, ios/ 폴더 생성

### 4. RapidAPI 환불 요청 메시지 작성 ✅

### 5. Rakuten Publisher 프로필 이슈 — 대기 중

---

## Provider 현황

### 활성 (RapidAPI 기반)
| Provider | API | 상태 |
|----------|-----|------|
| Amazon | RapidAPI (`real-time-amazon-data`) | ✅ 정상 |
| Walmart | RapidAPI (`realtime-walmart-data`) | ✅ 정상 |
| eBay | RapidAPI PRO (`real-time-ebay-data`) | ✅ 정상 |
| Target | RapidAPI (`target-com-shopping-api`) | ✅ 정상 |
| AliExpress | RapidAPI (`aliexpress-data`) | ✅ 정상 |

### 제거됨 (2026-02-24, Serper Google Shopping)
Temu, Best Buy, Home Depot, Lowe's, Nordstrom, IKEA, Wayfair, Newegg, Sephora, Etsy, Mercari, iHerb, Shein, ASOS, Farfetch, YesStyle, MyTheresa — 코드 파일은 `providers/` 폴더에 남아있음

---

## 검색 기능 현황

| 기능 | 상태 | 파일 |
|------|------|------|
| 텍스트 검색 | ✅ 정상 | SearchWidget.tsx, StickyHeader.tsx |
| 사진 검색 (Vision API) | ✅ 정상 | SearchWidget.tsx, StickyHeader.tsx, `/api/search/analyze` |
| 음성 검색 (마이크) | ✅ 정상 | `useVoiceSearch.ts`, SearchWidget.tsx, StickyHeader.tsx |
| 최근 검색어 | ✅ 정상 | SearchWidget.tsx, StickyHeader.tsx |
| ZIP 코드 입력 | ✅ 정상 | SearchWidget.tsx, StickyHeader.tsx |

---

## 현재 코드 구조 (핵심 파일)

```
app/
├── hooks/
│   ├── useVoiceSearch.ts        # 음성 검색 훅
│   ├── useProductSearch.ts      # 상품 검색 훅
│   ├── useUserPreferences.ts    # 사용자 설정
│   └── useWishlist.ts           # 위시리스트
├── lib/
│   ├── agent/
│   │   ├── Coordinator.ts       # 검색 파이프라인 (5개 RapidAPI provider)
│   │   ├── QueryAgent.ts
│   │   └── AnalysisAgent.ts
│   └── search/
│       └── providers/           # 5개 활성 + 17개 비활성
├── components/
│   ├── home/SearchWidget.tsx
│   ├── search/StickyHeader.tsx
│   ├── ViewportManager.tsx      # ⚠️ 미사용 (네이티브로 대체됨, 삭제 가능)
│   └── icons.tsx
├── privacy/page.tsx             # 개인정보 처리방침
├── globals.css                  # iOS input zoom 방지 CSS 포함
└── layout.tsx                   # viewport meta tag

# iOS 앱 (Capacitor)
capacitor.config.ts
ios/
├── App/
│   ├── App.xcodeproj
│   ├── App/
│   │   ├── AppDelegate.swift           # + KeyboardAccessoryFix 호출
│   │   ├── KeyboardAccessoryFix.swift  # 키보드 accessory bar 제거
│   │   ├── TabletViewController.swift  # iPad 1440px viewport 강제
│   │   ├── Info.plist
│   │   ├── capacitor.config.json
│   │   ├── Assets.xcassets/            # 1024x1024 앱 아이콘
│   │   └── Base.lproj/
│   │       ├── Main.storyboard         # TabletViewController 사용
│   │       └── LaunchScreen.storyboard
│   └── CapApp-SPM/                     # Capacitor SPM (8.1.0)

app-store-metadata.md                   # App Store 메타데이터 참고용
public/app-icon-1024.png                # 1024x1024 앱 아이콘 원본
```

---

## App Store 제출 현황

| 항목 | 상태 |
|------|------|
| App Store Connect 앱 등록 | ✅ 완료 |
| 메타데이터 (설명, 키워드 등) | ✅ 완료 |
| 개인정보 처리방침 URL | ✅ https://potal.app/privacy |
| 스크린샷 (iPhone + iPad) | ✅ 완료 |
| 데이터 수집 선언 | ✅ 완료 (3항목) |
| 가격 (무료) | ✅ 완료 |
| 수출 규정 | ✅ 완료 |
| Build 1 업로드 | ✅ 완료 |
| Build 1 심사 제출 | ✅ → 취소 (Build 2로 교체) |
| Build 2 업로드 (태블릿 수정) | ✅ 완료 |
| Build 2 심사 제출 | ✅ 심사 대기 중 |

---

## 시도하지 말아야 할 것들

| 방법 | 왜 안 되는지 |
|------|-------------|
| Apify Actor `amit123/temu-products-scraper` | Temu 403 차단 |
| RapidAPI Temu Shopping API | 호출 안 됨 |
| Serper Shopping → Web Search 2단계 | URL이 Google 리다이렉트 |
| JS viewport 조작 (MutationObserver, ViewportManager 등) | Next.js가 계속 덮어씀. **네이티브 Swift로만 해결 가능** |

---

## 외부 서비스 대기 현황

| 서비스 | 상태 | 다음 단계 |
|--------|------|----------|
| App Store 심사 (Build 2) | 심사 대기 중 (24~48시간) | 결과 확인 후 대응 |
| Temu Affiliate Program | 승인 대기 중 | 승인되면 API 구현 |
| Rakuten Publisher (Case #390705) | 답변 대기 | 내부 해결 대기 |
| RapidAPI Best Buy/Shein 환불 | 메일 발송 완료 | 답변 대기 |

---

## Git 상태

### 커밋 완료 + Push 완료
- `9ea57b3` — Serper 17개 provider 제거
- `9f1b716` — 음성 검색 기능 추가

### 미커밋 파일들 (커밋 필요)
- `capacitor.config.ts` (수정됨 — allowNavigation, launchShowDuration 등)
- `package.json`, `package-lock.json` (Capacitor 의존성)
- `ios/` 폴더 전체 (Xcode 프로젝트 + Swift 파일들)
- `app/privacy/page.tsx` (개인정보 처리방침)
- `app/layout.tsx` (viewport meta 정리)
- `app/globals.css` (iOS input zoom 방지)
- `app/components/ViewportManager.tsx` (미사용, 삭제 가능)
- `app-store-metadata.md`
- `public/app-icon-1024.png`
- `session-context.md`

---

## TODO (우선순위 순)

### 🔴 즉시
- [ ] App Store 심사 결과 확인 및 대응
- [ ] Capacitor/iOS 관련 파일 git 커밋 + push
- [ ] ViewportManager.tsx 삭제 (미사용, 네이티브로 대체됨)

### 🟡 확인 필요
- [ ] Temu Affiliate 승인 확인 → API 구현
- [ ] Rakuten Case #390705 답변 확인
- [ ] RapidAPI Best Buy/Shein 환불 답변 확인
- [ ] eBay BASIC 구독 해지 (PRO만 사용)

### 🟢 장기
- [ ] 새로운 Temu API 주기적 확인
- [ ] Serper 기반 provider 대안 API 조사
- [ ] Push notification 등 네이티브 기능 확장

---

## Apple Developer 계정 정보

- **이름**: EUNTAE JANG (장은태)
- **이메일**: contact@potal.app
- **Bundle ID**: com.potal.app
- **앱 이름**: POTAL
- **인증서**: Apple Distribution (수동 생성)
- **프로비저닝 프로필**: POTAL Distribution (수동 생성)
- **Xcode**: 전체 앱 설치 완료 (iOS 26.2 Simulator)

---

## 사용자 환경 참고

- **프로젝트 경로 (Mac)**: `~/portal/`
- **Git push**: HTTPS 인증 실패함 → 사용자가 Mac 터미널에서 직접 push
- **개발 서버**: `npm run dev` (Next.js)
- **배포**: Vercel (https://potal.app)
- **DB**: Supabase
