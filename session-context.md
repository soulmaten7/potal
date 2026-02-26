# POTAL Session Context
> 마지막 업데이트: 2026-02-25 (UI 수정 진행 중 + 홍보/투자 전략 논의)

## 현재 상태 요약

POTAL은 여러 쇼핑몰에서 상품을 검색/비교하는 가격비교 서비스.
**현재 5개 RapidAPI 기반 provider만 활성화** (직접 상품 URL 제공).
Serper Google Shopping 기반 17개 provider는 2026-02-24 Coordinator에서 제거됨 (코드 파일은 남아있음).

**iOS 앱**: App Store Connect에 Build 2 심사 제출 완료 (태블릿 1440px 레이아웃 수정 포함).
**Android 앱**: Google Play Console 국가 변경 대기 중 (미국→한국). Capacitor Android 빌드는 아직 미시작.

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
- **Build 2** Archive → 업로드 → 심사 재제출 (태블릿 수정)

### 6. 태블릿(iPad) 1440px 데스크톱 레이아웃 수정 ✅
- **문제**: iPad에서 상품 카드 레이아웃이 깨짐 (viewport ~1024px 문제)
- **실패한 접근법 (6가지)**: inline script, CSS min-width, MutationObserver, ViewportManager, setAttribute, server-rendered meta
- **최종 해결**: **네이티브 iOS `TabletViewController.swift`** — `Element.prototype.setAttribute`를 monkey-patch하여 Next.js가 viewport를 변경하려 해도 무조건 `width=1440`으로 강제 변환

### 7. Git 커밋 + Push ✅
- `e408f67` — iOS App Store 제출 + 태블릿 1440px 수정 + 전체 파일 커밋
- ViewportManager.tsx 삭제 (네이티브로 대체)
- .gitignore에 *.mobileprovision, *.p12 추가

### 8. 외부 서비스 대응 ✅
- **Rakuten**: Varsha Devda가 기술팀에 에스컬레이션 완료 → 대기
- **RapidAPI 환불**: Belchior Arkad(누구인지 불명) 답변 옴 — "고치겠다"만 함, 환불 미승인. BestBuy Provider=Pinto Studio, Shein Provider=sheinBusiness. Belchior Arkad 신원 확인 요청을 Product Support에 문의함
- **Google Play Console**: 국가 변경 요청 5번째 글 작성 (미국→한국, 본인인증 불가 문제)

### 9. UI 수정 (진행 중) 🔄
- **로고 치우침 수정**: `potal-logo.svg` viewBox 240→155로 줄여 오른쪽 빈 공간 제거
- **모바일 상품카드 PC와 동일하게**: ProductCard.tsx 모바일 하단에 PC와 같은 비용 breakdown 추가 (Shipping, Tax/Duty, Product, Total Landed Cost)
- **Tax Info 바텀시트**: 모바일에서 (i) 아이콘 탭 → 바텀시트로 Sales Tax / Import Tax 상세 설명
- **Help Centre → Help Center 오타 수정**: `app/profile/page.tsx`
- ⚠️ **아직 미확인**: 모바일 상품카드 수정이 로컬에서 아직 반영 안 된 상태. 다음 세션에서 확인 필요

### 10. 홍보/투자 전략 논의 ✅
- **POTAL의 비전**: 전세계 모든 국가의 쇼핑사이트를 연결, 국경 없는 가격비교 플랫폼
- **전략 논의 결과**:
  - 먼저 유저 트래픽/데이터 확보 → 그 숫자로 투자 유치
  - Product Hunt, Reddit, LinkedIn, X에서 홍보
  - 크라우드펀딩 (Kickstarter/Indiegogo) 방식 투자 유치
  - 일론 머스크 트윗 = "공표" 목적 (테슬라 내 쇼핑 플랫폼 비전)
  - API 제공 업체가 역으로 찾아오게 하는 전략

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
### 2. 음성 검색 (마이크) 기능 추가 ✅
### 3. Capacitor iOS 프로젝트 초기 설정 ✅
### 4. RapidAPI 환불 요청 메시지 작성 ✅
### 5. Rakuten Publisher 프로필 이슈 — 기술팀 에스컬레이션됨

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
Temu, Best Buy, Home Depot 등 17개 — 코드 파일은 `providers/` 폴더에 남아있음

---

## App Store 제출 현황

| 항목 | 상태 |
|------|------|
| App Store Connect 앱 등록 | ✅ 완료 |
| 메타데이터 (설명, 키워드 등) | ✅ 완료 |
| 개인정보 처리방침 URL | ✅ https://potal.app/privacy |
| 스크린샷 (iPhone + iPad) | ✅ 완료 |
| Build 2 심사 제출 | ✅ 심사 대기 중 |

---

## 외부 서비스 대기 현황

| 서비스 | 상태 | 다음 단계 |
|--------|------|----------|
| App Store 심사 (Build 2) | 심사 대기 중 (24~48시간) | 결과 확인 후 대응 |
| Google Play Console | 국가 변경 요청 5번째 (미국→한국) | Google 답변 대기. 해결되면 Android 빌드 준비 |
| Temu Affiliate Program | 승인 대기 중 | 승인되면 API 구현 |
| Rakuten Publisher (Case #390705) | 기술팀 에스컬레이션됨 (Varsha Devda) | 기술팀 해결 결과 대기 |
| RapidAPI 환불 (Request #130604) | Belchior Arkad 신원 확인 요청 (Product Support) | BestBuy=Pinto Studio, Shein=sheinBusiness. 신원 확인 후 환불 진행 |

---

## Git 상태

### 커밋 완료 + Push 완료
- `9ea57b3` — Serper 17개 provider 제거
- `9f1b716` — 음성 검색 기능 추가
- `e408f67` — iOS App Store 제출 + 태블릿 1440px 수정

### 미커밋 파일들 (커밋 필요)
- `public/potal-logo.svg` (viewBox 수정)
- `app/components/ProductCard.tsx` (모바일 breakdown + Tax Info 바텀시트)
- `app/profile/page.tsx` (Help Centre → Help Center 오타)
- `session-context.md` (업데이트)

---

## TODO (우선순위 순)

### 🔴 즉시 (다음 세션)
- [ ] 모바일 상품카드 수정사항 로컬 확인 (아직 미반영 상태)
- [ ] 수정사항 커밋 + push
- [ ] Product Hunt 런칭 페이지 작성
- [ ] Reddit/LinkedIn/X 홍보 글 작성 ("실제 작동 MVP + 비전 + 크라우드펀딩" 구조)
- [ ] 크라우드펀딩 페이지 기획 (Kickstarter/Indiegogo)
- [ ] 투자 피치 원페이저 PDF 제작

### 🟡 확인 필요
- [ ] App Store 심사 결과 확인 및 대응 (Build 2 심사 대기 중)
- [ ] Google Play Console 국가 변경 답변 → 해결되면 Android 빌드
- [ ] Temu Affiliate 승인 확인 → API 구현
- [ ] Rakuten Case #390705 — 기술팀 해결 대기
- [ ] RapidAPI 환불 — Belchior Arkad 신원 확인 후 진행
- [ ] eBay BASIC 구독 해지 (PRO만 사용)

### 🟢 장기
- [ ] 새로운 Temu API 주기적 확인
- [ ] Serper 기반 provider 대안 API 조사
- [ ] Push notification 등 네이티브 기능 확장

---

## POTAL 비전 & 투자 전략 (2026-02-25 논의)

### 비전
- 전세계 모든 국가의 쇼핑사이트를 연결
- 국경이 허물어지는 시대에 모든 상품을 시간과 비용으로 비교
- 기존 쇼핑 플랫폼이 할 수 없는 일 → 모든 사람이 POTAL을 거쳐 구매

### 전략
1. **크라우드펀딩** — 큰 투자가 아닌, 포텐셜을 알아보는 소규모 투자자 모집
2. **개발자/투자자 커뮤니티** — Reddit, LinkedIn에서 MVP 체험 유도 → API 제공 업체 역으로 유치
3. **일론 머스크 공표** — Tesla 차량 내 쇼핑 플랫폼 비전 선언 (답장 기대 X, 공개 선언 목적)
4. **수익 모델** — 어필리에이트 커미션 + IT기기/차량 등 모든 디바이스 연결
5. **단계적 확장** — 미국 모든 쇼핑사이트 연결 → 전세계 확장

### 1차 투자금 용도
- 미국 현지 법인 설립
- 미국 내 구매 가능한 모든 쇼핑사이트 API 연결
- 기능적 완벽함 확보 → 유저 리텐션으로 성장

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
