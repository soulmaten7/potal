# F081 Magento 플러그인 (Magento 2 Integration) — 단독 검수 및 수정

## ⚠️ 절대 규칙
1. **F081만 작업한다.** 다른 기능 절대 건드리지 않는다.
2. **"이미 구현됨" 판정 금지.** 아래 CRITICAL 문제가 확인되었으므로 반드시 수정한다.
3. **5단계 검수를 각각 통과해야 완료.**
4. 이 작업이 끝나면 멈추고 결과만 보고한다. 다음 기능으로 넘어가지 않는다.

---

## 📋 F081 파일 목록 (Magento 플러그인 전체)
### 기존 파일:
1. `plugins/magento/registration.php` (10줄)
2. `plugins/magento/etc/module.xml` (10줄)
3. `plugins/magento/Block/DutyDisplay.php` (33줄) — 프론트엔드 블록
4. `plugins/magento/view/frontend/templates/duty-display.phtml` (48줄) — **CORS 문제 파일**
5. `plugins/magento/Observer/OrderPlaceBefore.php` (72줄) — **DDP stub 파일**
6. `plugins/magento/Potal/LandedCost/registration.php` (3줄)
7. `plugins/magento/Potal/LandedCost/composer.json` (56줄)
8. `plugins/magento/Potal/LandedCost/etc/module.xml` (15줄)
9. `plugins/magento/Potal/LandedCost/Helper/Data.php` (90줄) — API 호출 헬퍼
10. `plugins/magento/Potal/LandedCost/Block/Widget.php` (57줄)
11. `plugins/magento/Potal/LandedCost/etc/config.xml` (17줄)
12. `plugins/magento/Potal/LandedCost/etc/adminhtml/system.xml` (39줄)
13. `plugins/magento/Potal/LandedCost/etc/acl.xml` (18줄)
14. `plugins/magento/Potal/LandedCost/view/frontend/templates/widget.phtml` (17줄)
15. `plugins/magento/Potal/LandedCost/view/frontend/layout/catalog_product_view.xml` (17줄)

### 비교 참조 (수정하지 않음):
- `plugins/woocommerce/potal-landed-cost.php` (357줄) — REST proxy + caching + DDP 완성본

---

## 🔍 Step 1: 전수 읽기 (수정 전)

위 15개 파일 + WooCommerce 파일을 **전부** 읽고, 아래 문제를 **직접 확인**한다.

---

## 🔧 Step 2: 알려진 CRITICAL 문제 3개 수정

### CRITICAL 1: 브라우저에서 직접 API 호출 (CORS + API Key 노출)
- **위치**: `plugins/magento/view/frontend/templates/duty-display.phtml` 28~45줄
- **현재**: 프론트엔드 JavaScript가 `fetch('https://www.potal.app/api/v1/calculate')` 직접 호출
  - API Key가 브라우저 소스코드/네트워크 탭에 노출됨
  - CORS 정책으로 요청 차단 가능
- **수정**: 서버사이드 REST API 프록시 생성
  - 새 파일: `plugins/magento/Potal/LandedCost/Controller/Api/Calculate.php`
  - Magento REST endpoint `/rest/V1/potal/calculate` 또는 Controller 방식
  - API Key를 서버사이드에서만 사용
  - `duty-display.phtml`은 Magento 자체 URL로 요청
  ```php
  // Controller/Api/Calculate.php
  class Calculate extends \Magento\Framework\App\Action\Action
  {
      public function execute()
      {
          $helper = $this->_objectManager->get(\Potal\LandedCost\Helper\Data::class);
          $body = json_decode($this->getRequest()->getContent(), true);
          $result = $helper->callApi('/calculate', $body);
          $this->getResponse()->setBody(json_encode($result));
      }
  }
  ```
  - 라우트 등록: `etc/frontend/routes.xml` 추가
  - `duty-display.phtml` 수정: fetch URL을 `/potal/api/calculate`로 변경, Authorization 헤더 제거

### CRITICAL 2: DDP 체크아웃 미통합 (Observer가 주석만 추가)
- **위치**: `plugins/magento/Observer/OrderPlaceBefore.php` 59~67줄
- **현재**: `$order->addCommentToStatusHistory(sprintf('POTAL Landed Cost: Duty $%.2f, ...'))` — 주석만
- **영향**: 관세/세금이 실제 주문 금액에 반영되지 않음. 고객은 DDP 가격을 보지 못함
- **WooCommerce 참조**: `woocommerce_cart_calculate_fees` 훅으로 실제 cart에 fee 추가 (290~355줄)
- **수정**: Magento의 Total Collector 방식으로 구현
  - 새 파일: `plugins/magento/Potal/LandedCost/Model/Total/LandedCost.php`
  ```php
  class LandedCost extends \Magento\Quote\Model\Quote\Address\Total\AbstractTotal
  {
      public function collect(Quote $quote, ShippingAssignmentInterface $shippingAssignment, Total $total)
      {
          parent::collect($quote, $shippingAssignment, $total);
          // POTAL API 호출 → duty + tax 금액 가져오기
          // $total->setTotalAmount('potal_landed_cost', $landedCostAmount);
          // $total->setBaseTotalAmount('potal_landed_cost', $landedCostAmount);
          return $this;
      }
  }
  ```
  - `etc/sales.xml` 추가: total collector 등록
  - Observer는 주문 확정 시 메타데이터 저장용으로 유지 (주석 + landed cost 금액 기록)

### CRITICAL 3: API Key를 getenv()로 직접 가져옴 (Admin Config 미사용)
- **위치**: `plugins/magento/Observer/OrderPlaceBefore.php` 15~18줄
- **현재**: `$apiKey = getenv('POTAL_API_KEY')` — 서버 환경변수 직접 사용
- **영향**: 대부분 Magento 호스팅은 환경변수 설정 불가. Admin에서 설정한 키 무시됨
- **수정**: Magento의 `ScopeConfigInterface`로 통일
  ```php
  // 모든 파일에서 API Key 가져올 때:
  $apiKey = $this->scopeConfig->getValue(
      'potal/general/api_key',
      \Magento\Store\Model\ScopeInterface::SCOPE_STORE
  );
  ```
  - `Helper/Data.php`에 이미 이 패턴이 있으므로, Observer도 Helper를 통해 가져오도록 수정
  - `getenv('POTAL_API_KEY')` → `$helper->getApiKey()` 호출로 변경

---

## 🔧 Step 3: MEDIUM 문제 4개 수정

### MEDIUM 1: 캐싱 없음
- **현재**: 매 페이지 로드마다 POTAL API 호출
- **WooCommerce**: `get_transient()` / `set_transient()` 으로 1시간 캐시
- **수정**: `Helper/Data.php`의 `callApi()` 메서드에 Magento 캐시 추가
  ```php
  $cacheKey = 'potal_calc_' . md5(json_encode($data));
  $cached = $this->cache->load($cacheKey);
  if ($cached) return json_decode($cached, true);
  // ... API 호출 ...
  $this->cache->save(json_encode($result), $cacheKey, ['potal_cache'], 3600);
  ```

### MEDIUM 2: 에러 핸들링 없음 (Observer)
- **위치**: `Observer/OrderPlaceBefore.php` 50~69줄
- **현재**: curl 실패 시 silent 무시 — 로그도 없음
- **수정**: 실패 시 Magento logger 사용
  ```php
  if ($httpCode !== 200 || !$response) {
      $this->logger->warning('POTAL API call failed', ['http_code' => $httpCode]);
  }
  ```

### MEDIUM 3: Uninstall 훅 없음
- **WooCommerce**: `uninstall.php`가 모든 옵션/캐시 삭제
- **수정**: Magento Setup/Uninstall 인터페이스 구현은 복잡하므로, README에 수동 삭제 가이드 추가
  - `etc/config.xml`에 정의된 config path 목록
  - 캐시 태그 `potal_cache` flush 방법

### MEDIUM 4: URL 하드코딩 3곳
- **현재**: `https://www.potal.app/api/v1/calculate` 가 3개 파일에 직접 하드코딩
- **수정**: `Helper/Data.php`에 `getBaseUrl()` 메서드 하나로 통일
  ```php
  public function getBaseUrl(): string {
      return $this->scopeConfig->getValue('potal/general/api_url')
          ?: 'https://www.potal.app/api/v1';
  }
  ```
  - 다른 파일은 모두 `$helper->getBaseUrl() . '/calculate'` 사용

---

## ✅ Step 4: 5단계 검수

### 검수 1: PHP Syntax 검사
```bash
find plugins/magento -name "*.php" -exec php -l {} \; 2>&1 | grep -v "No syntax errors"
```
→ 에러 0개

### 검수 2: API Key 노출 검사
```bash
grep -rn "getenv\|POTAL_API_KEY" plugins/magento/
grep -rn "Authorization.*Bearer" plugins/magento/view/
```
→ getenv 사용 0건, 프론트엔드 템플릿에 Bearer 토큰 0건

### 검수 3: REST 프록시 확인
```bash
grep -rn "potal/api/calculate\|Controller/Api" plugins/magento/
```
→ 서버사이드 프록시 Controller 존재 확인

### 검수 4: DDP Total Collector 확인
```bash
grep -rn "AbstractTotal\|setTotalAmount\|potal_landed_cost" plugins/magento/
```
→ Total Collector 클래스 + sales.xml 등록 확인

### 검수 5: 빌드 (Next.js 앱 빌드 — Magento 플러그인은 PHP이므로 앱 빌드에 영향 없음 확인)
```bash
npm run build 2>&1 | tail -5
```
→ 빌드 성공 (Magento 수정이 Next.js 빌드를 깨뜨리지 않음)

---

## 📊 Step 5: 결과 보고

```
=== F081 Magento 플러그인 — 검수 결과 ===

[수정 전 문제]
1. CRITICAL: 브라우저→API 직접 호출 (CORS + API Key 노출)
2. CRITICAL: DDP 체크아웃 미통합 (주석만 추가)
3. CRITICAL: getenv()로 API Key (Admin Config 무시)
4. MEDIUM: 캐싱 없음 (매 요청 API 호출)
5. MEDIUM: 에러 핸들링 없음 (silent 실패)
6. MEDIUM: Uninstall 훅 없음
7. MEDIUM: URL 하드코딩 3곳

[수정 내용]
- 파일명: 변경 내용 (줄 수 변화)

[5단계 검수]
1. PHP Syntax: ✅/❌
2. API Key 노출: ✅/❌
3. REST 프록시: ✅/❌
4. DDP Total: ✅/❌
5. 빌드: ✅/❌

[최종 판정]: ✅ 완료 / ❌ 재수정 필요
```

## ⛔ 여기서 멈춘다. 다음 기능으로 절대 넘어가지 않는다.
