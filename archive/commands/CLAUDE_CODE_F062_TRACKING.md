# F062 Real-time Shipment Tracking — 프로덕션 강화

> ⚠️ 이 기능(F062)만 작업합니다.

## 현재 파일
- `app/api/v1/shipping/tracking/route.ts` — 배송 추적 API

## CRITICAL 3개

### C1: 추적 데이터가 모의(mock) 데이터
실제 캐리어 API 미연동. 고정된 이벤트 목록 반환.
**수정**: 캐리어 API 폴백 + mock 명시
```typescript
response.dataSource = 'simulated'; // 'live' | 'simulated' | 'cached'
response.note = 'Tracking data is simulated. Integrate carrier tracking API for live updates.';
// 실제 추적: carrier tracking API 또는 aftership/shippo 등 aggregator
```

### C2: 통관 상태 이벤트 없음
국제 배송: "수출 통관", "수입 통관 보류", "관세 납부 대기" 등 핵심 이벤트 누락.
**수정**: 통관 관련 이벤트 타입 추가
```typescript
const CUSTOMS_EVENTS = [
  'export_cleared', 'in_transit_international', 'arrived_at_destination_port',
  'customs_hold', 'customs_inspection', 'duty_payment_required',
  'import_cleared', 'released_from_customs', 'customs_rejected'
];
```

### C3: Webhook 알림 없음
상태 변경 시 자동 알림(이메일/webhook) 미구현.
**수정**: tracking webhook 연동
```typescript
if (statusChanged) {
  // 등록된 webhook으로 알림
  await triggerWebhook(sellerId, 'shipment.status_changed', {
    trackingNumber, carrier, previousStatus, newStatus, timestamp
  });
}
```

## 테스트 6개
```
1. 유효한 추적번호 → 이벤트 목록 반환
2. 통관 보류 상태 → customs_hold 이벤트
3. 잘못된 추적번호 → 404
4. dataSource: simulated 표시
5. 상태 변경 → webhook 트리거
6. 예상 배송일 → estimatedDelivery 포함
```
