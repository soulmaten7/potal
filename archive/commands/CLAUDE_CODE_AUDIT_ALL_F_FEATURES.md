# 67개 F기능 명령어 파일 실행 여부 전수 감사

## ⚠️ 절대 규칙
1. **이 파일은 감사(audit)만 한다.** 코드를 수정하지 않는다.
2. **결과를 엑셀 파일로 출력한다.**
3. **추측 금지.** 파일이 존재하는지, 몇 줄인지, 스텁인지 실제 구현인지 직접 확인한다.
4. **모든 67개를 빠짐없이 확인한다.**

---

## 📋 감사 방법

### Step 1: 각 명령어 파일을 읽고, 타겟 파일 경로를 추출한다

아래 67개 명령어 파일 각각에서:
- "현재 파일", "파일 목록", "타겟 파일" 섹션을 찾는다
- 거기에 나오는 `.ts` / `.tsx` 파일 경로를 전부 기록한다

### Step 2: 타겟 파일 존재 여부 & 줄 수 확인

각 타겟 파일에 대해:
```bash
wc -l <파일경로>
```
- 파일 없음 → ❌ NOT_FOUND
- 파일 있고 50줄 미만 → ⚠️ STUB (스텁/래퍼 가능성)
- 파일 있고 50줄 이상 → 내용 확인 필요

### Step 3: 스텁 vs 실제 구현 판별

50줄 이상이어도, 명령어 파일에서 요구한 **CRITICAL 수정사항**이 반영됐는지 확인:
- 명령어 파일에서 "수정" 또는 "추가" 지시한 핵심 함수/로직이 코드에 있는지 grep
- 예: "DIM weight 계산 추가" → `calculateDimWeight` 함수가 실제로 있는지
- 예: "try-catch 래핑" → try-catch가 실제로 있는지

### Step 4: 판정

각 명령어 파일에 대해 최종 판정:
- **✅ EXECUTED**: 타겟 파일 존재 + CRITICAL 수정사항 반영됨
- **⚠️ PARTIAL**: 타겟 파일 존재하지만 CRITICAL 수정사항 일부만 반영
- **❌ NOT_EXECUTED**: 타겟 파일 없음 또는 CRITICAL 수정사항 미반영

---

## 📁 67개 명령어 파일 목록 (전수 확인 대상)

### 그룹 A: _100 시리즈 (보안 6개, CW18 6차에서 실행됨 — 확인 필요)
1. `CLAUDE_CODE_F006_CONFIDENCE_100.md`
2. `CLAUDE_CODE_F012_VALIDATION_100.md`
3. `CLAUDE_CODE_F046_WEBHOOK_100.md`
4. `CLAUDE_CODE_F052_API_AUTH_100.md`
5. `CLAUDE_CODE_F093_WEBHOOK_SECURITY_100.md`
6. `CLAUDE_CODE_F125_API_KEY_SECURITY_100.md`

### 그룹 B: _ONLY 시리즈 (단독 기능 10개)
7. `CLAUDE_CODE_F013_ONLY.md`
8. `CLAUDE_CODE_F015_ONLY.md`
9. `CLAUDE_CODE_F026_ONLY.md`
10. `CLAUDE_CODE_F041_ONLY.md`
11. `CLAUDE_CODE_F049_ONLY.md`
12. `CLAUDE_CODE_F054_ONLY.md`
13. `CLAUDE_CODE_F068_ONLY.md`
14. `CLAUDE_CODE_F081_ONLY.md`
15. `CLAUDE_CODE_F090_SDK_ONLY.md`
16. `CLAUDE_CODE_F126_RAG_ONLY.md`
17. `CLAUDE_CODE_F143_CHATBOT_ONLY.md`

### 그룹 C: P0 기능 (9개)
18. `CLAUDE_CODE_F025_DDP_DDU.md`
19. `CLAUDE_CODE_F033_IOSS_OSS.md`
20. `CLAUDE_CODE_F095_HIGH_THROUGHPUT.md`
21. `CLAUDE_CODE_F109_CSV_EXPORT.md`
22. `CLAUDE_CODE_F008_AUDIT_TRAIL.md`
23. `CLAUDE_CODE_F092_SANDBOX.md`
24. `CLAUDE_CODE_F009_BATCH_CLASSIFY.md`
25. `CLAUDE_CODE_F043_CUSTOMS_DOCS.md`
26. `CLAUDE_CODE_F040_PRE_SHIPMENT.md`

### 그룹 D: P1 기능 (9개)
27. `CLAUDE_CODE_F002_IMAGE_CLASSIFY.md`
28. `CLAUDE_CODE_F003_URL_CLASSIFY.md`
29. `CLAUDE_CODE_F007_ECCN_CLASSIFY.md`
30. `CLAUDE_CODE_F037_EXPORT_CONTROLS.md`
31. `CLAUDE_CODE_F039_RULES_OF_ORIGIN.md`
32. `CLAUDE_CODE_F050_TYPE86.md`
33. `CLAUDE_CODE_F097_AI_CONSULT.md`
34. `CLAUDE_CODE_F112_WHITELABEL.md`
35. `CLAUDE_CODE_F116_MULTILINGUAL.md`

### 그룹 E: P2 기능 — 세금 (9개)
36. `CLAUDE_CODE_F027_US_SALES_TAX.md`
37. `CLAUDE_CODE_F028_TELECOM_TAX.md`
38. `CLAUDE_CODE_F029_LODGING_TAX.md`
39. `CLAUDE_CODE_F038_EXPORT_LICENSE.md`
40. `CLAUDE_CODE_F044_CUSTOMS_DECLARATION.md`
41. `CLAUDE_CODE_F051_TAX_FILING.md`
42. `CLAUDE_CODE_F053_TAX_EXEMPTION.md`
43. `CLAUDE_CODE_F055_VAT_REGISTRATION.md`
44. `CLAUDE_CODE_F057_EINVOICE.md`

### 그룹 F: P2 기능 — 연동/관리 (5개)
45. `CLAUDE_CODE_F082_MARKETPLACE.md`
46. `CLAUDE_CODE_F083_ERP.md`
47. `CLAUDE_CODE_F104_TAX_LIABILITY.md`
48. `CLAUDE_CODE_F105_COMPLIANCE_AUDIT.md`
49. `CLAUDE_CODE_F138_CSM.md`
50. `CLAUDE_CODE_F140_AEO.md`
51. `CLAUDE_CODE_F147_REVENUE_SHARE.md`

### 그룹 G: 묶음 기능 (배송/통관/체크아웃 등, 16개)
52. `CLAUDE_CODE_F060_MULTICARRIER.md`
53. `CLAUDE_CODE_F061_SHIPPING_LABEL.md`
54. `CLAUDE_CODE_F062_TRACKING.md`
55. `CLAUDE_CODE_F063_F064_F065_SHIPPING.md`
56. `CLAUDE_CODE_F069_F047_F048_CUSTOMS.md`
57. `CLAUDE_CODE_F071_F073_F115_CHECKOUT.md`
58. `CLAUDE_CODE_F084_ACCOUNTING.md`
59. `CLAUDE_CODE_F087_PARTNER_ECOSYSTEM.md`
60. `CLAUDE_CODE_F103_F107_ANALYTICS.md`
61. `CLAUDE_CODE_F110_F111_BRANDING.md`
62. `CLAUDE_CODE_F130_F131_F132_COMMERCE.md`
63. `CLAUDE_CODE_F133_F134_ORDERS.md`
64. `CLAUDE_CODE_F135_F136_F137_FULFILLMENT.md`
65. `CLAUDE_CODE_F141_F144_F145_EDUCATION.md`
66. `CLAUDE_CODE_F030_F056_TAX_MISC.md`
67. `CLAUDE_CODE_F146_PARTNER_MGMT.md`

---

## 📊 Step 5: 결과 출력

Python openpyxl로 엑셀 파일 생성:
- **파일명**: `POTAL_F_FEATURE_AUDIT_RESULT.xlsx`
- **시트**: `Audit Result`
- **열**: A:순번 | B:명령어파일명 | C:F번호 | D:타겟파일경로 | E:파일존재(Y/N) | F:줄수 | G:CRITICAL수정반영(Y/N/PARTIAL) | H:최종판정(EXECUTED/PARTIAL/NOT_EXECUTED) | I:비고
- 각 명령어 파일당 타겟 파일이 여러 개면 행을 나눠서 기록
- 마지막에 요약 행: EXECUTED 몇 개 / PARTIAL 몇 개 / NOT_EXECUTED 몇 개

---

## ⚠️ 중요
- **67개 전부 빠짐없이** 확인한다. 하나라도 빠지면 안 된다.
- 확인이 끝나면 **멈추고 결과만 보고**한다. 코드 수정은 하지 않는다.
- 엑셀 파일을 프로젝트 루트에 저장한다.
