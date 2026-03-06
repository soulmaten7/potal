# POTAL Widget v2 — Production-Ready Embed Widget

## 목표
셀러가 `<script>` 한 줄로 자기 쇼핑몰에 붙이면, 바이어가 나라/우편번호 선택 후 실시간 Total Landed Cost를 볼 수 있는 위젯

## 수정 대상 파일

### 1. `public/widget/potal-widget.js` — 전면 재작성
- API_BASE를 스크립트 태그의 `src` URL에서 자동 감지 (도메인 하드코딩 제거)
- productName 파라미터 추가 (HS Code 분류 지원)
- **국가 선택 드롭다운** — 181개국 지원, 셀러가 기본 국가 설정 가능
- **우편번호 입력** — US/CA/BR일 때만 표시, 주별 세금 반영
- 더 나은 UI: 로딩 애니메이션, 에러 상태, 반응형
- 라이트/다크 테마 개선
- 이벤트 콜백: `onCalculate`, `onError` 지원
- Shadow DOM으로 스타일 격리 (셀러 사이트 CSS와 충돌 방지)

### 2. `public/widget/potal-widget.min.js` — 압축 버전 생성
- 프로덕션용 minified 버전

### 3. `app/api/v1/countries/route.ts` — 확인/수정
- 위젯에서 국가 목록을 가져올 수 있는 엔드포인트 확인
- 가벼운 응답 (국가코드, 이름, 국기 이모지만)

### 4. `app/api/v1/widget/embed/route.ts` — 새로 생성
- GET /api/v1/widget/embed?key=pk_live_...
- 셀러 전용 설치 코드 스니펫 반환
- HTML/JS 복사-붙여넣기 코드 생성

## 위젯 사용법 (최종)

```html
<!-- 방법 1: 한 줄 스크립트 -->
<div id="potal-widget"></div>
<script src="https://potal-x1vl.vercel.app/widget/potal-widget.js"
  data-api-key="pk_live_..."
  data-product-name="Cotton T-Shirt"
  data-price="49.99"
  data-shipping="5.00"
  data-origin="CN"
  data-theme="light">
</script>

<!-- 방법 2: 프로그래밍 방식 -->
<script src="https://potal-x1vl.vercel.app/widget/potal-widget.js"></script>
<script>
  PotalWidget.init({ apiKey: 'pk_live_...' });
  PotalWidget.show('#my-container', {
    productName: 'Cotton T-Shirt',
    price: 49.99,
    shippingPrice: 5.00,
    origin: 'CN'
  });
</script>
```

## 위젯 UI 구성

```
┌──────────────────────────────┐
│ 📦 Total Landed Cost         │
│                              │
│ 🌍 Destination: [Japan  ▾]  │
│ 📮 Zipcode:     [optional]  │
│                              │
│ ─────────────────────────── │
│ Product          $49.99      │
│ Shipping          $5.00      │
│ Import Duty       $2.87      │
│ JCT (10%)         $5.79      │
│ ─────────────────────────── │
│ Total            $63.65      │
│                              │
│            Powered by POTAL  │
└──────────────────────────────┘
```

## 구현 순서
1. potal-widget.js 전면 재작성 (Shadow DOM + 국가선택 + 우편번호)
2. countries API 경량 응답 확인
3. 로컬 HTML 테스트 페이지로 검증
4. embed 코드 생성 API
