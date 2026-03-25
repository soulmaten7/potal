# F140 AEO (Authorized Economic Operator) — 프로덕션 강화

> ⚠️ 이 기능(F140)만 작업합니다.

## 현재 파일
- `app/api/v1/compliance/aeo/route.ts` — AEO 인증 지원 API

## 현재 상태: 40% (신청 제출 없음, 서류 관리 없음, 국가별 차이 미반영)

## CRITICAL 5개

### C1: AEO 적격성 평가(Self-Assessment) 불완전 (route.ts)
기본 질문 5개만. WCO SAFE Framework 기준 4개 영역 40+ 항목 필요.
**수정**: 4개 영역 전체 평가
```typescript
const AEO_ASSESSMENT_AREAS = {
  compliance_record: {
    name: 'Compliance Record',
    questions: [
      { id: 'cr_1', text: 'No customs violations in past 3 years?', weight: 10, critical: true },
      { id: 'cr_2', text: 'Regular internal audits conducted?', weight: 5 },
      { id: 'cr_3', text: 'Customs declarations accuracy rate > 98%?', weight: 8 },
      { id: 'cr_4', text: 'Tax compliance (no overdue payments)?', weight: 7, critical: true },
      // ... 10+ 질문
    ]
  },
  financial_solvency: {
    name: 'Financial Solvency',
    questions: [
      { id: 'fs_1', text: 'Positive net worth for past 3 years?', weight: 8, critical: true },
      { id: 'fs_2', text: 'Adequate financial guarantee/insurance?', weight: 6 },
      // ... 8+ 질문
    ]
  },
  security_standards: {
    name: 'Security & Safety Standards',
    questions: [
      { id: 'ss_1', text: 'Physical security measures in place?', weight: 7 },
      { id: 'ss_2', text: 'Personnel security (background checks)?', weight: 6 },
      { id: 'ss_3', text: 'IT security measures adequate?', weight: 7 },
      // ... 10+ 질문
    ]
  },
  record_keeping: {
    name: 'Record Keeping & IT Systems',
    questions: [
      { id: 'rk_1', text: 'Electronic record keeping system?', weight: 5 },
      { id: 'rk_2', text: 'Records retained for minimum period?', weight: 6 },
      // ... 8+ 질문
    ]
  }
};

function calculateAeoReadiness(answers: Record<string, boolean>): AeoReadiness {
  let totalScore = 0, maxScore = 0;
  const criticalFailures: string[] = [];

  for (const [area, config] of Object.entries(AEO_ASSESSMENT_AREAS)) {
    for (const q of config.questions) {
      maxScore += q.weight;
      if (answers[q.id]) totalScore += q.weight;
      else if (q.critical) criticalFailures.push(q.text);
    }
  }

  const readinessPercent = Math.round(totalScore / maxScore * 100);
  return {
    readinessPercent,
    ready: readinessPercent >= 80 && criticalFailures.length === 0,
    criticalFailures,
    recommendation: readinessPercent >= 80 ? 'Ready to apply' :
      readinessPercent >= 60 ? 'Address gaps before applying' : 'Significant preparation needed'
  };
}
```

### C2: 국가별 AEO 프로그램 차이 미반영
EU AEO-C/AEO-S/AEO-F, US C-TPAT, 한국 AEO 등 각국 프로그램 다름.
**수정**: 국가별 프로그램 안내
```typescript
const AEO_PROGRAMS: Record<string, AeoProgram> = {
  EU: {
    name: 'EU AEO',
    types: ['AEO-C (Customs Simplification)', 'AEO-S (Security)', 'AEO-F (Full)'],
    authority: 'National Customs Authority',
    processingTime: '120 working days',
    validity: 'Unlimited (periodic review)',
    benefits: ['Fewer physical/document checks', 'Priority treatment', 'Simplified customs procedures',
      'Mutual recognition with partner countries'],
    url: 'https://taxation-customs.ec.europa.eu/customs-4/aeo-authorised-economic-operator_en'
  },
  US: {
    name: 'C-TPAT (Customs-Trade Partnership Against Terrorism)',
    types: ['Tier I', 'Tier II', 'Tier III'],
    authority: 'CBP (Customs and Border Protection)',
    processingTime: '90-120 days',
    benefits: ['Reduced inspections', 'Front of line processing', 'Penalty mitigation'],
    url: 'https://www.cbp.gov/border-security/ports-entry/cargo-security/ctpat'
  },
  KR: {
    name: 'AEO 공인인증',
    types: ['AA등급', 'A등급', 'B등급'],
    authority: '관세청',
    processingTime: '60-90일',
    benefits: ['수출입신고서류 간소화', '검사 비율 최소화', '관세 납기 연장'],
    url: 'https://www.customs.go.kr/aeo'
  },
};
```

### C3: 서류 관리 없음
AEO 신청에 필요한 서류 목록만 제공하고, 실제 서류 업로드/관리 없음.
**수정**: 서류 체크리스트 + 업로드 상태 추적
```typescript
const REQUIRED_DOCUMENTS: Record<string, DocumentRequirement[]> = {
  EU: [
    { id: 'company_reg', name: 'Company Registration Certificate', mandatory: true },
    { id: 'financial_statements', name: 'Financial Statements (3 years)', mandatory: true },
    { id: 'customs_history', name: 'Customs Declaration History', mandatory: true },
    { id: 'security_plan', name: 'Security Plan', mandatory: true },
    { id: 'saq', name: 'Self-Assessment Questionnaire', mandatory: true },
    { id: 'org_chart', name: 'Organization Chart', mandatory: false },
    { id: 'process_map', name: 'Supply Chain Process Map', mandatory: false },
  ],
};

// GET /compliance/aeo/documents?country=EU — 서류 상태 조회
async function getDocumentStatus(sellerId: string, country: string): Promise<DocumentStatus[]> {
  const required = REQUIRED_DOCUMENTS[country] || [];
  const { data: uploaded } = await supabase.from('aeo_documents')
    .select('document_type, uploaded_at, file_name')
    .eq('seller_id', sellerId);

  return required.map(doc => ({
    ...doc,
    uploaded: uploaded?.some(u => u.document_type === doc.id) || false,
    uploadedAt: uploaded?.find(u => u.document_type === doc.id)?.uploaded_at || null
  }));
}
```

### C4: MRA(상호인정협정) 정보 없음
EU-US, EU-KR 등 AEO 상호인정으로 다른 국가에서도 혜택 받을 수 있음.
**수정**: MRA 파트너 국가 안내
```typescript
const AEO_MRA_PARTNERS: Record<string, string[]> = {
  EU: ['US', 'JP', 'CN', 'KR', 'CH', 'NO', 'CA', 'SG', 'UK'],
  US: ['EU', 'KR', 'JP', 'NZ', 'IL', 'JO', 'TW', 'SG', 'MX', 'CA'],
  KR: ['US', 'EU', 'CN', 'JP', 'SG', 'NZ', 'IN', 'IL', 'TW', 'CA', 'MX'],
};

if (AEO_MRA_PARTNERS[country]) {
  response.mutualRecognition = {
    partnerCountries: AEO_MRA_PARTNERS[country],
    benefit: 'AEO status recognized in partner countries for expedited customs clearance',
    note: 'Benefits vary by partner country agreement terms'
  };
}
```

### C5: 신청 진행 상태 추적 없음
신청 시작~심사~승인까지의 상태 추적 불가.
**수정**: 신청 상태 워크플로우
```typescript
type AeoStatus = 'preparing' | 'documents_ready' | 'submitted' | 'under_review' |
  'site_visit_scheduled' | 'approved' | 'denied' | 'renewal_due';

// POST /compliance/aeo/status — 상태 업데이트
await supabase.from('aeo_applications').upsert({
  seller_id: sellerId, country, program_type: programType,
  status: newStatus, updated_at: new Date().toISOString(),
  notes: statusNote
});
```

## 수정 파일: 1개 (aeo/route.ts) + 신규 lib/compliance/aeo.ts + migration 2개
## 테스트 10개
```
1. 적격성 평가 → readinessPercent 정확 계산
2. Critical failure → ready: false
3. EU AEO → 3가지 유형 + benefits
4. US C-TPAT → Tier 정보 포함
5. KR AEO → 한국어 등급 정보
6. 서류 체크리스트 → mandatory 항목 표시
7. MRA → EU의 파트너 국가 9개
8. 신청 상태 → 워크플로우 추적
9. 전체 영역 평가 → 4개 영역 스코어
10. 빈 answers → 0% readiness
```

## 결과
```
=== F140 AEO — 강화 완료 ===
- 수정 파일: 2개+ | CRITICAL 5개 | 테스트: 10개 | 빌드: PASS/FAIL
```
