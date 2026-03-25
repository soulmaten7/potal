# F110/F111 Branded Tracking Page + Branded Emails — 프로덕션 강화

> ⚠️ 이 2개 기능만 작업합니다.

## 현재 파일
- `app/api/v1/shipping/branded-tracking/route.ts` — 브랜딩 추적/이메일 API

---

## F110 Branded Tracking Page — CRITICAL 3개

### C1: 추적 페이지 HTML 미생성
설정 데이터만 반환. 실제 렌더링 가능한 HTML 없음.
**수정**: 임베드 가능한 HTML 스니펫 생성
```typescript
if (format === 'html') {
  const html = generateTrackingPageHtml({
    logo: config.logoUrl,
    primaryColor: config.primaryColor,
    trackingNumber, carrier, events,
    customCss: sanitizeCss(config.customCss || ''),
    showMap: config.features?.showMap || false,
    productRecommendations: config.features?.showRecommendations || false
  });
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
```

### C2: 추적 이벤트 번역 없음
영어 이벤트("In Transit", "Delivered")만. 고객 언어로 표시 필요.
**수정**: 이벤트 번역
```typescript
const EVENT_TRANSLATIONS: Record<string, Record<string, string>> = {
  ko: { in_transit: '배송 중', delivered: '배달 완료', customs_hold: '통관 보류', out_for_delivery: '배달 출발' },
  ja: { in_transit: '輸送中', delivered: '配達完了', customs_hold: '通関保留', out_for_delivery: '配達中' },
  // 50개국어
};
const lang = searchParams.get('lang') || 'en';
events = events.map(e => ({ ...e, description: EVENT_TRANSLATIONS[lang]?.[e.status] || e.description }));
```

### C3: UTM/분석 추적 없음
추적 페이지 방문 횟수, 클릭 등 분석 데이터 수집 안 함.
**수정**: 기본 분석 카운터
```typescript
// 추적 페이지 조회 시 카운트
await supabase.rpc('increment_tracking_view', { p_tracking_number: trackingNumber });
// 마케팅 링크 클릭 추적
response.analyticsScript = `<script>window.potalTrack={tn:'${trackingNumber}',seller:'${sellerId}'}</script>`;
```

---

## F111 Branded Email Notifications — CRITICAL 3개

### C1: 이메일 실제 발송 없음
이메일 템플릿 데이터만 반환. Resend/SendGrid 등 이메일 발송 연동 없음.
**수정**: Resend API 연동 (이미 프로젝트에 있음)
```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

if (action === 'send') {
  await resend.emails.send({
    from: config.replyTo || 'noreply@potal.app',
    to: recipientEmail,
    subject: getEmailSubject(template, lang),
    html: generateBrandedEmailHtml(config, template, trackingData, lang)
  });
  response.sent = true;
}
```

### C2: 이메일 오픈/클릭 추적 없음
발송 후 열람 여부, 링크 클릭 추적 불가.
**수정**: 추적 픽셀 + 링크 래핑
```typescript
// 오픈 추적 픽셀
const trackingPixel = `<img src="https://www.potal.app/api/v1/track/email-open?id=${emailId}" width="1" height="1" />`;
// 링크 클릭 추적
function wrapLink(url: string, emailId: string): string {
  return `https://www.potal.app/api/v1/track/email-click?id=${emailId}&url=${encodeURIComponent(url)}`;
}
```

### C3: 발송 스케줄/자동화 없음
수동 API 호출로만 발송. 배송 상태 변경 시 자동 발송 연동 없음.
**수정**: 자동 트리거 설정
```typescript
const AUTO_TRIGGERS: Record<string, string> = {
  'order_confirmed': 'Sends when order is placed',
  'shipped': 'Sends when carrier picks up',
  'in_transit': 'Sends daily updates',
  'customs_hold': 'Sends immediately when customs holds shipment',
  'delivered': 'Sends on delivery confirmation',
  'review_request': 'Sends 3 days after delivery',
};
// 셀러별 자동 발송 설정
const { data: autoConfig } = await supabase.from('email_auto_triggers')
  .select('*').eq('seller_id', sellerId);
```

## 테스트 8개
```
1. F110: HTML 추적 페이지 → 로고+색상 적용
2. F110: 한국어 이벤트 → "배송 중" 표시
3. F110: CSS 새니타이즈 → @import 제거
4. F111: Resend 이메일 발송 → sent: true
5. F111: 오픈 추적 → tracking pixel 포함
6. F111: 클릭 추적 → 링크 래핑 확인
7. F111: 자동 트리거 설정 → DB 저장
8. F110: 조회수 카운트 → increment 확인
```
