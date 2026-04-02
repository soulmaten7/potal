# POTAL 마켓플레이스 등록 가이드
**작성일: 2026-03-30**

POTAL의 e-commerce 플러그인을 각 마켓플레이스 앱스토어에 등록하기 위한 가입 및 제출 절차 가이드입니다.

---

## 1. WooCommerce (WordPress.org Plugin Directory)

### 가입 링크
- **WordPress.org 계정 생성**: https://login.wordpress.org/register
- **플러그인 제출 페이지**: https://wordpress.org/plugins/developers/add/

### 필요한 것
- WordPress.org 계정 (무료)
- 플러그인 ZIP 파일 (이미 코드 완성됨: `plugins/woocommerce/potal-landed-cost/`)
- `readme.txt` (이미 작성됨)
- SVN을 통한 업로드 (승인 후)

### 등록 절차
1. **WordPress.org 계정 생성** → https://login.wordpress.org/register
   - 이메일, 사용자명, 비밀번호 입력
   - 이메일 인증 완료

2. **플러그인 제출** → https://wordpress.org/plugins/developers/add/
   - 플러그인 ZIP 파일 업로드
   - 플러그인 설명 작성
   - 제출 버튼 클릭

3. **리뷰 대기** (보통 1~5영업일)
   - WordPress 팀이 보안, 코딩 표준, 가이드라인 준수 검토
   - 수정 요청이 올 수 있음

4. **승인 후 SVN 접근권한** 부여
   - SVN으로 플러그인 코드 업로드
   - 정식 WordPress.org 플러그인 디렉토리에 게시

### 비용
- **무료** (WordPress.org 플러그인 디렉토리는 완전 무료)

### 참고
- 플러그인 코드가 GPL 라이선스여야 함 (현재 MIT → GPL 변환 필요할 수 있음)
- readme.txt 포맷이 WordPress 표준을 따라야 함 (이미 준수)
- 최소 PHP 7.4+, WordPress 5.0+ 호환 권장

---

## 2. BigCommerce (App Marketplace)

### 가입 링크
- **BigCommerce 파트너 계정**: https://www.bigcommerce.com/partners/
- **Developer Portal**: https://developer.bigcommerce.com/
- **앱 제출**: https://devtools.bigcommerce.com/ (파트너 가입 후)

### 필요한 것
- BigCommerce Partner 계정 (무료)
- 앱 OAuth 설정 (Client ID / Secret)
- 앱 설명, 스크린샷, 아이콘
- 테스트용 BigCommerce 스토어 (Partner 계정에 포함)

### 등록 절차
1. **파트너 프로그램 가입** → https://www.bigcommerce.com/partners/
   - 회사명: POTAL
   - 웹사이트: https://www.potal.app
   - Partner Type: "Technology Partner" 선택
   - 무료 개발 스토어 1개 자동 생성됨

2. **Developer Portal 설정** → https://devtools.bigcommerce.com/
   - 로그인 후 "Create an App" 클릭
   - App Name: "POTAL Landed Cost Calculator"
   - OAuth Scopes 설정:
     - `store_v2_orders` (read)
     - `store_v2_products` (read)
     - `store_v2_content` (write) — 위젯 설치용
   - Callback URLs 설정

3. **앱 개발 및 테스트**
   - 무료 개발 스토어에서 앱 설치/테스트
   - BigCommerce의 Single-Click App 설치 흐름 구현
   - Script Manager API로 위젯 설치

4. **앱 제출 (Marketplace Listing)**
   - DevTools에서 "Submit App" 클릭
   - 앱 설명, 카테고리(Shipping & Fulfillment), 가격(Free), 스크린샷 5장+
   - BigCommerce 팀 리뷰 (1~2주)

### 비용
- **파트너 가입: 무료**
- **앱 Marketplace 등록: 무료** (유료 앱은 BigCommerce가 수수료 20% 수취)
- POTAL은 무료 앱이므로 비용 없음

### 참고
- BigCommerce는 Node.js 또는 PHP 앱 권장
- 현재 코드(`plugins/bigcommerce/`)는 TypeScript 기반 → 적합
- Stencil 테마와 Cornerstone 호환성 테스트 필요

---

## 3. Magento (Adobe Commerce Marketplace)

### 가입 링크
- **Adobe Commerce Marketplace 개발자 등록**: https://commercemarketplace.adobe.com/
- **개발자 포털**: https://developer.adobe.com/commerce/marketplace/
- **계정 생성**: https://account.magento.com/customer/account/create/

### 필요한 것
- Adobe/Magento 계정 (무료)
- Marketplace 개발자 프로필 (세금 정보 필요)
- Extension 패키지 (Composer 호환 ZIP)
- 기술 리뷰 통과 (코드 품질, 보안, Magento 코딩 표준)
- 마케팅 리뷰 통과 (설명, 스크린샷, 문서)

### 등록 절차
1. **Magento/Adobe 계정 생성** → https://account.magento.com/customer/account/create/
   - 이름, 이메일, 비밀번호
   - 이메일 인증

2. **Marketplace 개발자 프로필 생성** → https://commercemarketplace.adobe.com/
   - 로그인 → "Sell on Marketplace" / "Become a Partner"
   - 회사 정보 입력
   - **세금 정보 (Tax Form)** 제출 필요 — W-8BEN 또는 W-9
   - 은행 계좌 정보 (유료 앱일 경우, 무료면 불필요할 수 있음)

3. **Extension 패키지 준비**
   - 현재 코드: `plugins/magento/Potal/LandedCost/`
   - `composer.json` 이미 작성됨 (v1.1.0, PHP 8.1+, Magento 2.4.x)
   - Magento Coding Standard 검증: `phpcs --standard=Magento2` 실행
   - ZIP으로 패키징

4. **Extension 제출**
   - Marketplace Developer Portal에서 "Submit Extension"
   - Extension 정보 입력:
     - Name: "POTAL Landed Cost Calculator"
     - Category: "Shipping & Fulfillment"
     - Price: Free
     - Magento Version: 2.4.x
   - ZIP 파일 업로드
   - 스크린샷 3~5장 + 아이콘 + 상세 설명

5. **리뷰 프로세스 (2단계)**
   - **기술 리뷰** (자동 + 수동, 5~10영업일)
     - 코드 품질, PHPCS, 보안 검사
     - Magento 코딩 표준 준수 여부
     - 단, 이 과정이 가장 까다로움
   - **마케팅 리뷰** (2~5영업일)
     - 설명, 스크린샷, 문서 품질

### 비용
- **계정 생성: 무료**
- **Extension 제출: 무료**
- **유료 Extension 판매 시**: Adobe가 수수료 수취 (보통 15~25%)
- POTAL은 무료이므로 추가 비용 없음

### 참고
- Magento Marketplace가 셋 중 가장 까다로운 리뷰 프로세스
- PHP 코딩 표준 (PSR-12 + Magento2 Standard) 준수 필수
- Extension 코드에 `composer.json` 필수 (이미 있음)
- Magento 2.4.6+ 호환 테스트 권장

---

## 4. Shopify (참고 — 별도 진행 중)

### 현재 상태
- Shopify App 설정 완료 (`shopify.app.toml`)
- Client ID: 2fa34ed65342ffb7fac08dd916f470b8
- Theme App Extension 코드 완성 (`extensions/potal-widget/`)

### 가입 링크
- **Shopify Partners**: https://partners.shopify.com/signup
- **App 제출**: https://partners.shopify.com/ → Apps → 해당 앱 → Distribution

### 등록 절차
1. Shopify Partners 가입 (무료)
2. Development Store에서 테스트
3. App Listing 작성 (설명, 스크린샷)
4. App Store 제출 → Shopify 리뷰 (1~2주)

### 비용
- **무료** (Shopify App Store 등록 무료, 유료 앱은 Shopify가 수수료 수취)

---

## 우선순위 추천

| 순위 | 플랫폼 | 이유 | 난이도 | 예상 소요 |
|------|--------|------|--------|----------|
| 1 | **WooCommerce** | 무료, 리뷰 빠름 (1~5일), 가장 쉬움 | ⭐ 쉬움 | 1주 |
| 2 | **Shopify** | 이미 앱 설정 완료, 파트너 가입만 필요 | ⭐⭐ 보통 | 1~2주 |
| 3 | **BigCommerce** | 파트너 무료, 개발 스토어 제공 | ⭐⭐ 보통 | 2~3주 |
| 4 | **Magento** | 가장 까다로운 리뷰, 세금 정보 필요 | ⭐⭐⭐ 어려움 | 3~4주 |

---

## 체크리스트

### 지금 바로 가입할 것
- [ ] WordPress.org 계정 → https://login.wordpress.org/register
- [ ] BigCommerce Partner → https://www.bigcommerce.com/partners/
- [ ] Adobe/Magento 계정 → https://account.magento.com/customer/account/create/
- [ ] Shopify Partners → https://partners.shopify.com/signup

### 가입 후 할 것
- [ ] WooCommerce 플러그인 ZIP 생성 및 제출
- [ ] BigCommerce DevTools에서 앱 생성
- [ ] Magento Marketplace 개발자 프로필 + Extension 제출
- [ ] Shopify App Store 리스팅 작성 및 제출
