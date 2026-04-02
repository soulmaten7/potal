# F071/F073/F115 Localized Checkout + Local Payments + Multilingual Checkout — 강화

> ⚠️ 이 3개 기능만 작업합니다.

## 현재 파일
- `app/api/v1/checkout/localize/route.ts` — 체크아웃 현지화 API

---

## F071 International Localized Checkout — CRITICAL 2개

### C1: 환율 실시간 미적용
하드코딩 환율 사용. getExchangeRate() 호출 안 함.
**수정**: 실시간 환율 적용
```typescript
const exchangeRate = await getExchangeRate('USD', localCurrency);
response.localizedPricing = {
  originalPrice: { amount: price, currency: 'USD' },
  localPrice: { amount: Math.round(price * exchangeRate * 100) / 100, currency: localCurrency },
  exchangeRate, rateSource: 'ecb_daily', rateDate: new Date().toISOString()
};
```

### C2: 국가별 필수 표시 정보 누락
EU: 총 가격(VAT 포함) 표시 의무. 한국: 원화 표시 의무. 일본: 세금 내세/외세 표시.
**수정**: 국가별 가격 표시 규정
```typescript
const PRICING_DISPLAY_RULES: Record<string, PriceDisplayRule> = {
  EU: { vatInclusive: true, showVatBreakdown: true, note: 'EU Consumer Rights Directive' },
  KR: { localCurrencyRequired: true, showOriginalPrice: true },
  JP: { taxDisplayMethod: 'inclusive', note: '総額表示義務 (Total Amount Display)' },
  AU: { gstInclusive: true, showGstAmount: true },
};
```

---

## F073 Local Payment Methods — CRITICAL 2개

### C1: 결제 수단 정보만 나열 (실제 연동 없음)
iDEAL, Alipay, KakaoPay 등 이름만 반환. 연동 URL/SDK 정보 없음.
**수정**: Stripe/Paddle 연동 가이드 추가
```typescript
const PAYMENT_METHODS: Record<string, PaymentMethod[]> = {
  NL: [{ id: 'ideal', name: 'iDEAL', provider: 'stripe', stripeType: 'ideal', popularityRank: 1 }],
  DE: [{ id: 'sofort', name: 'Sofort', provider: 'stripe', stripeType: 'sofort' },
       { id: 'giropay', name: 'Giropay', provider: 'stripe', stripeType: 'giropay' }],
  KR: [{ id: 'kakaopay', name: 'KakaoPay', provider: 'custom', note: 'Requires KakaoPay merchant account' }],
  CN: [{ id: 'alipay', name: 'Alipay', provider: 'stripe', stripeType: 'alipay' },
       { id: 'wechat_pay', name: 'WeChat Pay', provider: 'stripe', stripeType: 'wechat_pay' }],
  BR: [{ id: 'pix', name: 'PIX', provider: 'stripe', stripeType: 'pix' },
       { id: 'boleto', name: 'Boleto', provider: 'stripe', stripeType: 'boleto' }],
};
response.integrationGuide = { stripeDoc: 'https://stripe.com/docs/payments/payment-methods', ... };
```

### C2: BNPL(후불결제) 정보 없음
Klarna, Afterpay 등 후불결제 현지 가용 여부 미표시.
**수정**: BNPL 가용 정보 추가
```typescript
const BNPL_AVAILABILITY: Record<string, string[]> = {
  US: ['Klarna', 'Afterpay', 'Affirm'], EU: ['Klarna'], AU: ['Afterpay'],
  UK: ['Klarna', 'Clearpay'], SE: ['Klarna'],
};
```

---

## F115 Multilingual Checkout — CRITICAL 1개

### C1: 체크아웃 번역 키 불완전
버튼/라벨 번역만. 에러 메시지, 주소 필드 힌트, 법적 고지 미번역.
**수정**: 체크아웃 전체 키 번역
```typescript
const CHECKOUT_KEYS = {
  buttons: { pay_now: true, continue: true, back: true },
  labels: { shipping_address: true, billing_address: true },
  errors: { card_declined: false, invalid_zip: false }, // ← 미번역
  legal: { terms_checkbox: false, privacy_notice: false }, // ← 미번역
  hints: { address_line1: false, phone_format: false }, // ← 미번역
};
// false인 키 전부 번역 추가
```

## 테스트 8개
```
1. F071: EUR → 실시간 환율 적용
2. F071: EU → vatInclusive: true
3. F071: JP → taxDisplayMethod: inclusive
4. F073: NL → iDEAL 최우선 추천
5. F073: BR → PIX + Boleto
6. F073: US → Klarna BNPL 가용
7. F115: ko → 에러 메시지 한국어
8. F115: 미지원 언어 → en 폴백
```
