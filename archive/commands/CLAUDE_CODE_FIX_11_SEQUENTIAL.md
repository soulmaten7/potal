# 미실행/PARTIAL 기능 — 순차 실행 (1개씩만)

## ⚠️⚠️⚠️ 절대 규칙 ⚠️⚠️⚠️
1. **한 번에 1개 기능만 작업한다.** 절대 2개 이상 동시에 진행하지 않는다.
2. **1개 끝나면 반드시 STOP.** "=== TASK N 완료 ===" 출력하고 멈춘다.
3. **다음 TASK는 내가 "다음" 이라고 말해야 시작한다.**
4. **npm run build 통과 필수.** 빌드 실패 시 고치고 재확인.
5. **엑셀 로그 필수** — POTAL_Claude_Code_Work_Log.xlsx

---

## TASK 1: F104 Tax Liability (NOT_EXECUTED)
**파일**: `app/api/v1/tax/liability/route.ts` — 미생성
**참고**: `CLAUDE_CODE_F104_TAX_LIABILITY.md`의 F104 부분만
**할 일**: route.ts 생성, calculateTaxLiability() 구현, FILING_DEADLINES 데이터
**끝나면**: "=== TASK 1 F104 완료 ===" 출력하고 **멈춘다**

---

## TASK 2: F130 MoR (NOT_EXECUTED)
**파일**: `app/api/v1/checkout/mor/route.ts`
**참고**: `CLAUDE_CODE_F130_F131_F132_COMMERCE.md`의 **F130 부분만**
**할 일**: MoR 견적에 실제 landed cost 연동 + MoR 수수료 표시 + 환불 책임 범위
**끝나면**: "=== TASK 2 F130 완료 ===" 출력하고 **멈춘다**

---

## TASK 3: F131 Fraud Prevention (NOT_EXECUTED)
**파일**: `app/api/v1/checkout/fraud/route.ts`
**참고**: `CLAUDE_CODE_F130_F131_F132_COMMERCE.md`의 **F131 부분만**
**할 일**: 사기방지 로직 강화 (velocity check, device fingerprint, risk scoring)
**끝나면**: "=== TASK 3 F131 완료 ===" 출력하고 **멈춘다**

---

## TASK 4: F132 Chargeback (NOT_EXECUTED)
**파일**: `app/api/v1/checkout/fraud/route.ts` (F131과 같은 파일의 chargeback 부분)
**참고**: `CLAUDE_CODE_F130_F131_F132_COMMERCE.md`의 **F132 부분만**
**할 일**: 차지백 관리 (dispute tracking, evidence 수집, 자동 대응)
**끝나면**: "=== TASK 4 F132 완료 ===" 출력하고 **멈춘다**

---

## TASK 5: F133 Order Auto-Sync (NOT_EXECUTED)
**파일**: `app/api/v1/commerce/orders/route.ts` — 미생성
**참고**: `CLAUDE_CODE_F133_F134_ORDERS.md`의 **F133 부분만**
**할 일**: 마켓플레이스 주문 동기화 + HS 코드 자동 분류 + 충돌 처리
**끝나면**: "=== TASK 5 F133 완료 ===" 출력하고 **멈춘다**

---

## TASK 6: F134 Bulk Order Import (NOT_EXECUTED)
**파일**: `app/api/v1/commerce/orders/route.ts` (F133과 같은 파일의 bulk import 부분)
**참고**: `CLAUDE_CODE_F133_F134_ORDERS.md`의 **F134 부분만**
**할 일**: CSV/JSON 벌크 주문 가져오기 + 유효성 검사
**끝나면**: "=== TASK 6 F134 완료 ===" 출력하고 **멈춘다**

---

## TASK 7: F052 API Auth 보완 (PARTIAL)
**문제**: keys.ts 존재하나 /keys CRUD routes 미생성
**참고**: `CLAUDE_CODE_F052_API_AUTH_100.md`의 GAP 5번만
**할 일**: /api/v1/keys/ CRUD route 생성
**끝나면**: "=== TASK 7 F052 보완 완료 ===" 출력하고 **멈춘다**

---

## TASK 8: F125 API Key Security 보완 (PARTIAL)
**문제**: /keys/rotate route 미생성
**참고**: `CLAUDE_CODE_F125_API_KEY_SECURITY_100.md`의 키 로테이션 부분만
**할 일**: /api/v1/keys/rotate/route.ts 생성
**끝나면**: "=== TASK 8 F125 보완 완료 ===" 출력하고 **멈춘다**

---

## TASK 9: F008 Audit Trail 보완 (PARTIAL)
**문제**: audit-trail.ts 존재하나 /audit route 미생성
**참고**: `CLAUDE_CODE_F008_AUDIT_TRAIL.md`의 C2만
**할 일**: /api/v1/audit/route.ts 생성 + queryAudits() + export
**끝나면**: "=== TASK 9 F008 보완 완료 ===" 출력하고 **멈춘다**

---

## TASK 10: F055 VAT Registration 보완 (PARTIAL)
**문제**: route 229줄 존재, lib 미생성
**참고**: `CLAUDE_CODE_F055_VAT_REGISTRATION.md`의 lib 파일 부분만
**할 일**: app/lib/tax/vat-registration.ts 생성 + VIES 검증 + 임계값 업데이트
**끝나면**: "=== TASK 10 F055 보완 완료 ===" 출력하고 **멈춘다**

---

## TASK 11: F062 Tracking 보완 (PARTIAL)
**문제**: 40줄 minimal stub
**참고**: `CLAUDE_CODE_F062_TRACKING.md` 전체
**할 일**: dataSource 표시 + 통관 이벤트 타입 + webhook 알림
**끝나면**: "=== TASK 11 F062 보완 완료 ===" 출력하고 **멈춘다**

---

## TASK 12: F135 Inventory Sync 보완 (PARTIAL)
**문제**: inventory만 89줄
**참고**: `CLAUDE_CODE_F135_F136_F137_FULFILLMENT.md`의 **F135 부분만**
**할 일**: 재고 동기화 + 저재고 알림
**끝나면**: "=== TASK 12 F135 보완 완료 ===" 출력하고 **멈춘다**

---

## TASK 13: F136 3PL Integration 보완 (PARTIAL)
**참고**: `CLAUDE_CODE_F135_F136_F137_FULFILLMENT.md`의 **F136 부분만**
**할 일**: 3PL 연동 구조 (ShipBob, Deliverr 등)
**끝나면**: "=== TASK 13 F136 보완 완료 ===" 출력하고 **멈춘다**

---

## TASK 14: F137 Multi-Hub 보완 (PARTIAL)
**참고**: `CLAUDE_CODE_F135_F136_F137_FULFILLMENT.md`의 **F137 부분만**
**할 일**: 멀티허브 재고 관리 + 최적 창고 선택
**끝나면**: "=== TASK 14 F137 보완 완료 ===" 출력하고 **멈춘다**

---

## TASK 15: F030 Property Tax 보완 (PARTIAL)
**문제**: 41줄 stub
**참고**: `CLAUDE_CODE_F030_F056_TAX_MISC.md`의 **F030 부분만**
**할 일**: 카운티/시 구분 + 상업용/주거용 + 참조 URL
**끝나면**: "=== TASK 15 F030 보완 완료 ===" 출력하고 **멈춘다**

---

## TASK 16: F056 Business License 보완 (PARTIAL)
**문제**: 58줄 minimal
**참고**: `CLAUDE_CODE_F030_F056_TAX_MISC.md`의 **F056 부분만**
**할 일**: 50주 면허 데이터 + 산업별 요건
**끝나면**: "=== TASK 16 F056 보완 완료 ===" 출력하고 **멈춘다**

---

## TASK 17: F146 Partner Mgmt 보완 (PARTIAL)
**문제**: ecosystem 58줄 존재, /manage route 미생성
**참고**: `CLAUDE_CODE_F146_PARTNER_MGMT.md` 전체
**할 일**: /partners/apply + /partners/dashboard + 계약 관리
**끝나면**: "=== TASK 17 F146 보완 완료 === 전체 완료!" 출력하고 **멈춘다**

---

## ⚠️ 다시 한번 강조
- **TASK 1부터 시작한다.**
- **1개 끝나면 멈추고 기다린다.**
- **내가 "다음"이라고 할 때까지 다음 TASK로 넘어가지 않는다.**
- 각 TASK에서 참고 명령어 파일(.md)을 반드시 읽고 해당 기능의 CRITICAL 수정사항만 따른다.
- 1개 기능이 끝날 때마다 npm run build 통과 확인.
