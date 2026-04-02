# F105 Compliance Audit Trail — 프로덕션 강화

> ⚠️ 이 기능(F105)만 작업합니다.

## 현재 파일
- `app/api/v1/compliance/audit/route.ts` — 컴플라이언스 감사 API
- `app/lib/compliance/audit-trail.ts` — 감사 추적 로직

## 현재 상태: 45% (수출통제/제재 체크 없음, 리포트 미완성)

## CRITICAL 5개

### C1: 수출통제 체크 누락 (audit-trail.ts)
관세/VAT만 감사. EAR/ITAR, Entity List, 제재 스크리닝 결과 미포함.
**수정**: 수출통제 감사 항목 추가
```typescript
interface ComplianceAuditResult {
  tariffCompliance: TariffAudit;
  taxCompliance: TaxAudit;
  exportControlCompliance: ExportControlAudit; // 추가
  sanctionsCompliance: SanctionsAudit; // 추가
  documentCompliance: DocumentAudit; // 추가
  overallScore: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

async function auditExportControls(sellerId: string, period: string): Promise<ExportControlAudit> {
  const transactions = await getTransactions(sellerId, period);
  const issues: AuditIssue[] = [];

  for (const tx of transactions) {
    // 1. ECCN 분류 확인
    if (tx.eccn && tx.eccn !== 'EAR99' && !tx.license_number) {
      issues.push({ severity: 'high', type: 'missing_license',
        detail: `ECCN ${tx.eccn} to ${tx.destination} without license on file` });
    }
    // 2. Entity List 스크리닝 확인
    if (!tx.screening_completed) {
      issues.push({ severity: 'critical', type: 'no_screening',
        detail: `No denied party screening for ${tx.buyer_name}` });
    }
    // 3. 금수국 체크
    if (EMBARGO_COUNTRIES.includes(tx.destination)) {
      issues.push({ severity: 'critical', type: 'embargo_violation',
        detail: `Transaction to embargoed country ${tx.destination}` });
    }
  }
  return { totalChecked: transactions.length, issues, score: calculateScore(issues) };
}
```

### C2: 리스크 스코어링 없음
개별 이슈만 나열. 전체적인 컴플라이언스 리스크 수준 판단 없음.
**수정**: 가중치 기반 스코어링
```typescript
const ISSUE_WEIGHTS: Record<string, number> = {
  embargo_violation: 50,
  no_screening: 30,
  missing_license: 25,
  incorrect_hs: 15,
  missing_document: 10,
  late_filing: 5,
  minor_discrepancy: 2,
};

function calculateOverallScore(issues: AuditIssue[]): { score: number, riskLevel: string } {
  const totalDeductions = issues.reduce((sum, i) => sum + (ISSUE_WEIGHTS[i.type] || 5), 0);
  const score = Math.max(0, 100 - totalDeductions);
  const riskLevel = score >= 90 ? 'low' : score >= 70 ? 'medium' : score >= 50 ? 'high' : 'critical';
  return { score, riskLevel };
}
```

### C3: 기간별 비교/트렌드 없음
현재 기간 스냅샷만. 개선/악화 추이 파악 불가.
**수정**: 기간 비교 + 추이
```typescript
response.comparison = {
  previousPeriodScore: previousAudit.overallScore,
  currentPeriodScore: currentAudit.overallScore,
  change: currentAudit.overallScore - previousAudit.overallScore,
  newIssues: currentAudit.issues.filter(i => !previousIssueTypes.has(i.type)),
  resolvedIssues: previousAudit.issues.filter(i => !currentIssueTypes.has(i.type)),
  trend: getQuarterlyTrend(sellerId, 4) // 최근 4분기
};
```

### C4: 시정 조치(Remediation) 추적 없음
이슈 발견 후 어떻게 해결했는지 추적 불가. 반복 이슈 방지 불가.
**수정**: 시정 조치 워크플로우
```typescript
// POST /compliance/audit/remediate
interface RemediationAction {
  issueId: string;
  action: 'resolved' | 'mitigated' | 'accepted_risk' | 'escalated';
  description: string;
  resolvedBy: string;
  resolvedAt: string;
  evidence?: string; // 증빙 문서 참조
}

await supabase.from('compliance_remediation').insert({
  audit_id: auditId, issue_id: issueId,
  action: remediation.action,
  description: remediation.description,
  resolved_by: sellerId,
  resolved_at: new Date().toISOString()
});
```

### C5: 감사 리포트 PDF 없음
규제 기관 제출용 공식 리포트 생성 불가.
**수정**: 감사 리포트 생성
```typescript
const format = searchParams.get('format') || 'json';
if (format === 'pdf') {
  const reportData = {
    companyName: seller.company_name,
    period: period,
    auditDate: new Date().toISOString(),
    overallScore: audit.overallScore,
    riskLevel: audit.riskLevel,
    sections: [
      { title: 'Tariff Compliance', ...audit.tariffCompliance },
      { title: 'Tax Compliance', ...audit.taxCompliance },
      { title: 'Export Control', ...audit.exportControlCompliance },
      { title: 'Sanctions Screening', ...audit.sanctionsCompliance },
    ],
    recommendations: generateRecommendations(audit.issues)
  };
  const pdf = await generateAuditReportPdf(reportData);
  return new Response(pdf, { headers: { 'Content-Type': 'application/pdf' } });
}
```

## 수정 파일: 2개 (audit-trail.ts, audit/route.ts) + migration (compliance_remediation)
## 테스트 10개
```
1. 정상 거래 → score 90+ (low risk)
2. 금수국 거래 → critical issue + score 급감
3. DPS 미완료 → no_screening critical issue
4. 면허 없는 통제 품목 → missing_license high issue
5. 전기 대비 개선 → change > 0
6. 시정 조치 기록 → remediation DB 저장
7. PDF 리포트 → 4개 섹션 포함
8. 빈 기간 → score 100 (이슈 없음)
9. 추천 사항 → recommendations 포함
10. 트렌드 → 4분기 추이 반환
```

## 결과
```
=== F105 Compliance Audit — 강화 완료 ===
- 수정 파일: 2개+ | CRITICAL 5개 | 테스트: 10개 | 빌드: PASS/FAIL
```
