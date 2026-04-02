# F037 Export Controls — 프로덕션 강화

> ⚠️ 이 기능(F037)만 작업합니다.

## 현재 파일
- `app/lib/compliance/export-controls.ts` — 수출통제 로직
- `app/api/v1/compliance/export-controls/route.ts` — 수출통제 API

## CRITICAL 8개

### C1: Commerce Country Chart 데이터 없음 (route.ts:55-67)
export_control_chart 테이블 생성됨 (migration 032) but **데이터 0건**.
```typescript
const chartResults = await lookupExportControlChart(eccn, destination); // 항상 []
```
**수정**: BIS Commerce Country Chart 데이터 임포트 스크립트 생성 + 최소 1000행 삽입
또는 하드코딩 핵심 데이터 (E1/E2 국가 + D1/D5 국가)로 폴백

### C2: EAR99 판정 부정확 (export-controls.ts:61-71)
HS 챕터가 매핑에 없으면 자동 EAR99. Ch.27(광물연료), Ch.39(플라스틱) 누락 → 이중용도 품목도 EAR99.
**수정**: 알 수 없는 HS → EAR99 대신 "CLASSIFICATION_REQUIRED" 반환
```typescript
if (!HS_TO_ECCN_MAP[chapter]) {
  return {
    eccn: 'UNKNOWN',
    status: 'classification_required',
    warning: 'HS chapter not mapped to ECCN. Manual BIS classification required. Do not assume EAR99.'
  };
}
```

### C3: 국가 그룹 불완전 (route.ts:104-110)
E1, E2, D1, D5만 정의. Group D(전체), E3, S 누락.
**수정**: EAR Part 740 전체 국가 그룹 추가
```typescript
const COUNTRY_GROUPS = {
  A1: [...], A2: [...], A3: [...], A4: [...], // 호주그룹 등
  B: [...], // 36개국
  D1: ['AF','BY','CN','CU',...], D2: [...], D3: [...], D4: [...], D5: [...],
  E1: ['CU','IR','KP','SY'], E2: ['CU','IR','KP','SY','RU'],
};
```

### C4: Entity List 스크리닝 안 함 (route.ts:259-265)
경고만 반환. 실제 BIS Entity/Denied/Unverified List 조회 안 함.
**수정**: sanctions_entries 테이블에서 BIS 리스트 조회
```typescript
if (endUserName) {
  const { data: matches } = await supabase.from('sanctions_entries')
    .select('source, name, program')
    .or(`name.ilike.%${endUserName}%`)
    .in('source', ['BIS_ENTITY', 'BIS_DPL', 'BIS_UVL'])
    .limit(5);
  if (matches?.length > 0) {
    return { status: 'DENIED', matches, action: 'Do not proceed. Export to this entity prohibited.' };
  }
}
```

### C5: License Exception 하드코딩 (export-controls.ts:38-55)
카테고리별 고정 예외. LVS 금액 임계값, TSR 소프트웨어 전용 등 세부 조건 없음.
**수정**: 금액+아이템타입 체크 추가
```typescript
if (exception === 'LVS') {
  const lvsThresholds = { '3A': 5000, '4A': 5000, '1C': 10000, 'DEFAULT': 2500 };
  const threshold = lvsThresholds[eccnCategory] || lvsThresholds.DEFAULT;
  if (declaredValue > threshold) {
    return { exception: 'LVS', eligible: false, reason: `Value $${declaredValue} exceeds LVS threshold $${threshold} for ${eccnCategory}` };
  }
}
```

### C6: ITAR 관할 미확인 (classify/eccn:133-137)
'itar_possible' 반환하지만 DDTC 관할 판정 없음. 사용자 가이드 부족.
**수정**: ITAR 감지 시 구체적 안내 제공
```typescript
if (itarDetected) {
  return {
    exportControlStatus: 'itar_possible',
    guidance: 'This item may be subject to ITAR (State Dept jurisdiction). Submit CJ request to DDTC for official jurisdiction determination.',
    ddtcUrl: 'https://www.pmddtc.state.gov/ddtc_public/ddtc_public?id=ddtc_public_portal_commodity_jurisdiction',
    action: 'DO NOT EXPORT until jurisdiction is confirmed.'
  };
}
```

### C7: End-Use 키워드 너무 넓음 (route.ts:142-149)
"military grade stainless steel" → ITAR 감지. 실제로는 일반 상업용.
**수정**: 복합 키워드 매칭
```typescript
const ITAR_COMPOUND_PATTERNS = [
  /\b(weapon|firearm|munition)\b.*\b(system|component|part)\b/i,
  /\b(missile|rocket|warhead)\b.*\b(guidance|propulsion|payload)\b/i,
  /\bmilitary\b.*\b(weapon|combat|tactical)\b/i,
];
// 단독 "military", "defense"는 경고만 (ITAR가 아닌 주의 수준)
```

### C8: TMP(임시수출) 자격 미검증 (export-controls.ts:50-52)
모든 아이템에 TMP 예외 부여. 실제로는 12개월 이내 반환 + 특정 장비만.
**수정**: TMP 조건 체크
```typescript
if (exception === 'TMP') {
  if (!isTemporaryExport || !expectedReturnDate) {
    return { exception: 'TMP', eligible: false, reason: 'TMP requires temporary export with return date within 12 months' };
  }
  const monthsDiff = (new Date(expectedReturnDate) - new Date()) / (1000*60*60*24*30);
  if (monthsDiff > 12) {
    return { exception: 'TMP', eligible: false, reason: 'TMP return period exceeds 12 months' };
  }
}
```

## 수정 파일: 2개 (export-controls.ts, compliance/export-controls/route.ts)
## 테스트 10개
```
1. EAR99 정상 판정: 일반 소비재 → EAR99, NLR
2. 통제 품목: 3A001 → CN → license_required: true
3. Entity List: 제재 대상 이름 → DENIED
4. LVS 금액 초과: $6000 3A → LVS 불가
5. ITAR 감지: "missile guidance system" → itar_possible + DDTC 링크
6. ITAR 오탐 방지: "military green jacket" → 경고만 (ITAR 아님)
7. TMP: 반환일 14개월 → TMP 불가
8. 알 수 없는 HS → CLASSIFICATION_REQUIRED (EAR99 아님)
9. 금수국 목적지: IR → prohibited + 설명
10. 국가 그룹 D1: CN → 정확한 그룹 반환
```

## 결과
```
=== F037 Export Controls — 강화 완료 ===
- 수정 파일: 2개 | CRITICAL 8개 | 테스트: 10개 | 빌드: PASS/FAIL
```
