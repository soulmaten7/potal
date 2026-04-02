# F083 ERP Integration — 프로덕션 강화 (STUB → 실구현)

> ⚠️ 이 기능(F083)만 작업합니다.

## 현재 파일
- `app/api/v1/integrations/erp/route.ts` — ERP 연동 API
- DB: `erp_connections` 테이블

## 현재 상태: 15% STUB (가짜 test_connection, 실제 ERP API 클라이언트 없음)

## CRITICAL 6개

### C1: test_connection이 가짜 (route.ts)
항상 { connected: true } 반환. 실제 ERP API 호출 없음.
**수정**: 실제 연결 테스트
```typescript
const ERP_CONNECTORS: Record<string, ErpConnector> = {
  quickbooks: {
    testUrl: (baseUrl: string) => `${baseUrl}/v3/company/{companyId}/companyinfo/{companyId}`,
    authType: 'oauth2',
    tokenUrl: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
  },
  xero: {
    testUrl: () => 'https://api.xero.com/connections',
    authType: 'oauth2',
    tokenUrl: 'https://identity.xero.com/connect/token'
  },
  sap: {
    testUrl: (baseUrl: string) => `${baseUrl}/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner?$top=1`,
    authType: 'basic_or_oauth'
  },
  netsuite: {
    testUrl: (baseUrl: string) => `${baseUrl}/services/rest/record/v1/customer?limit=1`,
    authType: 'token_based'
  },
};

async function testConnection(erpType: string, credentials: ErpCredentials): Promise<TestResult> {
  const connector = ERP_CONNECTORS[erpType];
  if (!connector) return { connected: false, error: `Unsupported ERP: ${erpType}` };

  try {
    const token = await getErpToken(erpType, credentials);
    const testUrl = connector.testUrl(credentials.baseUrl || '');
    const response = await fetch(testUrl, {
      headers: { 'Authorization': `Bearer ${token}` },
      signal: AbortSignal.timeout(10000)
    });
    return { connected: response.ok, statusCode: response.status,
      erpVersion: response.headers.get('x-version') || 'unknown' };
  } catch (err) {
    return { connected: false, error: err instanceof Error ? err.message : 'Connection failed' };
  }
}
```

### C2: 자격증명 저장 없음
요청마다 credentials를 전달해야 함. 저장/암호화 구조 없음.
**수정**: 암호화 저장 (F082와 동일 패턴)
```typescript
// erp_connections 테이블에 암호화 저장
await supabase.from('erp_connections').upsert({
  seller_id: sellerId,
  erp_type: erpType,
  credentials_encrypted: encrypt(JSON.stringify(credentials)),
  base_url: credentials.baseUrl,
  status: 'connected',
  connected_at: new Date().toISOString()
});
```

### C3: 데이터 동기화 없음
연결만 하고 POTAL→ERP 데이터 전송 구조 없음.
**수정**: 관세 계산 결과 → ERP 전기
```typescript
// POST /integrations/erp/sync
async function syncToErp(sellerId: string, transactionData: TransactionData) {
  const conn = await getErpConnection(sellerId);
  const credentials = JSON.parse(decrypt(conn.credentials_encrypted));

  if (conn.erp_type === 'quickbooks') {
    // QuickBooks: Bill 또는 Journal Entry 생성
    await createQuickBooksBill(credentials, {
      vendorRef: transactionData.supplier,
      line: [
        { amount: transactionData.dutyAmount, detailType: 'AccountBasedExpenseLineDetail',
          accountRef: { name: 'Import Duties' } },
        { amount: transactionData.vatAmount, detailType: 'AccountBasedExpenseLineDetail',
          accountRef: { name: 'VAT Payable' } },
      ]
    });
  } else if (conn.erp_type === 'xero') {
    // Xero: Invoice 또는 Bill 생성
    await createXeroBill(credentials, transactionData);
  }
  return { synced: true, erpType: conn.erp_type };
}
```

### C4: 계정 매핑(Chart of Accounts) 없음
ERP마다 관세/VAT를 다른 계정에 기록. 매핑 설정 필요.
**수정**: 셀러별 계정 매핑 설정
```typescript
interface AccountMapping {
  importDuties: string; // 관세 계정
  vatPayable: string; // VAT 미지급 계정
  gstInput: string; // GST 매입 계정
  customsFees: string; // 통관 수수료 계정
  freightCost: string; // 운송비 계정
}

// GET /integrations/erp/account-mapping — 현재 매핑 조회
// POST /integrations/erp/account-mapping — 매핑 설정
// 기본값 제공
const DEFAULT_MAPPINGS: Record<string, AccountMapping> = {
  quickbooks: { importDuties: 'Cost of Goods Sold:Import Duties', vatPayable: 'VAT Payable', ... },
  xero: { importDuties: '300 - Import Duties', vatPayable: '820 - VAT', ... },
};
```

### C5: 토큰 갱신 없음
OAuth 기반 ERP(QuickBooks, Xero)는 토큰 만료 시 갱신 필요.
**수정**: 자동 토큰 갱신 (F082와 동일 패턴)
```typescript
async function getValidErpToken(sellerId: string): Promise<string> {
  const conn = await getErpConnection(sellerId);
  const creds = JSON.parse(decrypt(conn.credentials_encrypted));

  if (new Date(conn.token_expires_at) < new Date(Date.now() + 300000)) {
    // 토큰 갱신
    const newTokens = await refreshErpToken(conn.erp_type, creds.refreshToken);
    creds.accessToken = newTokens.access_token;
    creds.refreshToken = newTokens.refresh_token || creds.refreshToken;
    await supabase.from('erp_connections').update({
      credentials_encrypted: encrypt(JSON.stringify(creds)),
      token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
    }).eq('seller_id', sellerId);
    return newTokens.access_token;
  }
  return creds.accessToken;
}
```

### C6: 감사 로깅 없음
ERP 동기화 성공/실패 이력 추적 불가.
**수정**: 동기화 로그 기록
```typescript
await supabase.from('erp_sync_log').insert({
  seller_id: sellerId, erp_type: conn.erp_type,
  action: 'sync_bill', status: success ? 'success' : 'failed',
  transaction_id: transactionData.id,
  error_message: error?.message || null,
  synced_at: new Date().toISOString()
});
```

## 수정 파일: 1개 (erp/route.ts) + 신규 lib/integrations/erp.ts + migration (erp_sync_log)
## 테스트 10개
```
1. QuickBooks 연결 테스트 → 실제 API 호출 확인
2. Xero 연결 테스트 → OAuth 토큰 검증
3. 자격증명 암호화 → encrypt/decrypt 왕복
4. 데이터 동기화 → QuickBooks Bill 생성
5. 계정 매핑 조회 → 기본 매핑 반환
6. 계정 매핑 설정 → DB 저장 확인
7. 토큰 갱신 → 만료 전 자동 갱신
8. 미지원 ERP → 400 에러
9. 동기화 실패 → erp_sync_log에 error 기록
10. 연결 해제 → credentials 삭제
```

## 결과
```
=== F083 ERP Integration — 강화 완료 ===
- 수정 파일: 2개+ | CRITICAL 6개 | 테스트: 10개 | 빌드: PASS/FAIL
```
