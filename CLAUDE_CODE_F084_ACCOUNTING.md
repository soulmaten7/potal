# F084 Accounting Software Integration — 프로덕션 강화

> ⚠️ 이 기능(F084)만 작업합니다.

## 현재 파일
- `app/api/v1/integrations/accounting/route.ts` — 회계 소프트웨어 연동 API

## CRITICAL 4개

### C1: OAuth 토큰 관리 없음
연결 정보 메타데이터만 반환. 실제 OAuth 플로우 미구현.
**수정**: F082 마켓플레이스와 동일한 OAuth 패턴 적용
```typescript
// QuickBooks OAuth 2.0
const QB_CONFIG = {
  authUrl: 'https://appcenter.intuit.com/connect/oauth2',
  tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
  scopes: ['com.intuit.quickbooks.accounting'],
};
// Xero OAuth 2.0
const XERO_CONFIG = {
  authUrl: 'https://login.xero.com/identity/connect/authorize',
  tokenUrl: 'https://identity.xero.com/connect/token',
  scopes: ['accounting.transactions', 'accounting.contacts'],
};
```

### C2: 계정 매핑 자동화 없음
관세=어떤 계정, VAT=어떤 계정 매핑 수동 설정 필요하지만 UI/API 없음.
**수정**: 계정 매핑 CRUD + 기본값
```typescript
// GET /integrations/accounting/chart-of-accounts — 사용 가능한 계정 조회
// POST /integrations/accounting/mapping — 매핑 설정
const DEFAULT_MAPPINGS = {
  quickbooks: {
    import_duties: { name: 'Import Duties', type: 'Expense', category: 'Cost of Goods Sold' },
    vat_payable: { name: 'VAT Payable', type: 'Other Current Liability' },
    customs_fees: { name: 'Customs & Brokerage Fees', type: 'Expense' },
  },
  xero: {
    import_duties: { code: '310', name: 'Import Duties' },
    vat_payable: { code: '820', name: 'GST/VAT' },
  },
};
```

### C3: 동기화 이력/로그 없음
어떤 데이터가 언제 동기화되었는지 추적 불가.
**수정**: 동기화 로그 기록
```typescript
await supabase.from('accounting_sync_log').insert({
  seller_id: sellerId, platform: accountingPlatform,
  action: 'sync_transaction', status: 'success',
  records_synced: count, synced_at: new Date().toISOString()
});
```

### C4: 에러 처리 미흡
회계 소프트웨어 API 에러(인증 만료, 중복 엔트리 등) 처리 없음.
**수정**: 에러별 사용자 안내
```typescript
const ACCOUNTING_ERRORS: Record<string, string> = {
  'AuthenticationError': 'Session expired. Please reconnect your accounting software.',
  'DuplicateEntry': 'This transaction already exists. Skipping.',
  'AccountNotFound': 'Mapped account not found. Please update account mapping.',
  'RateLimited': 'Too many requests. Will retry in 60 seconds.',
};
```

## 테스트 8개
```
1. QuickBooks OAuth URL 생성 → 올바른 scopes
2. Xero OAuth URL → xero scopes
3. 계정 매핑 기본값 → DEFAULT_MAPPINGS 반환
4. 동기화 로그 기록 → accounting_sync_log에 저장
5. 인증 만료 에러 → reconnect 안내
6. 중복 엔트리 → skip + 경고
7. 미지원 플랫폼 → 400 에러
8. 계정 매핑 설정 → CRUD 동작
```
