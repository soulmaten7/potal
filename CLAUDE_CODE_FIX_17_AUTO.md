# 미완성 17개 기능 — 자동 순차 실행 (1개씩, 5회 검수 후 자동 다음)

## ⚠️⚠️⚠️ 절대 규칙 ⚠️⚠️⚠️
1. **한 번에 1개 기능만 작업한다.** 절대 2개 이상 동시에 진행하지 않는다.
2. **각 TASK마다 5번 검수한다.** 검수 항목: (1)파일 존재 (2)CRITICAL 수정 반영 (3)타입 에러 없음 (4)npm run build PASS (5)엣지케이스 확인
3. **5번 검수 전부 통과하면 자동으로 다음 TASK로 넘어간다.**
4. **검수 실패 시 수정하고 다시 검수한다.** 통과할 때까지 반복.
5. **참고 명령어 파일(.md)을 반드시 읽고** 거기 적힌 CRITICAL 수정사항을 따른다.
6. **엑셀 로그 필수** — POTAL_Claude_Code_Work_Log.xlsx에 각 TASK별 시트 추가
7. **17개 전부 끝나면** "=== 전체 17/17 완료 ===" 출력

---

## TASK 1/17: F104 Tax Liability (NOT_EXECUTED)
**파일**: `app/api/v1/tax/liability/route.ts` — 미생성
**참고**: `CLAUDE_CODE_F104_TAX_LIABILITY.md` 읽고 F104 부분 실행
**할 일**: route.ts 생성, calculateTaxLiability() 구현, FILING_DEADLINES 데이터
**검수**: 5회 통과 → 자동으로 TASK 2로

---

## TASK 2/17: F130 MoR (NOT_EXECUTED)
**파일**: `app/api/v1/checkout/mor/route.ts`
**참고**: `CLAUDE_CODE_F130_F131_F132_COMMERCE.md`의 **F130 부분만**
**할 일**: MoR 견적에 실제 landed cost 연동 + MoR 수수료 표시 + 환불 책임 범위
**검수**: 5회 통과 → 자동으로 TASK 3으로

---

## TASK 3/17: F131 Fraud Prevention (NOT_EXECUTED)
**파일**: `app/api/v1/checkout/fraud/route.ts`
**참고**: `CLAUDE_CODE_F130_F131_F132_COMMERCE.md`의 **F131 부분만**
**할 일**: 사기방지 로직 강화 (velocity check, device fingerprint, risk scoring)
**검수**: 5회 통과 → 자동으로 TASK 4로

---

## TASK 4/17: F132 Chargeback (NOT_EXECUTED)
**파일**: `app/api/v1/checkout/fraud/route.ts` (F131과 같은 파일의 chargeback 부분)
**참고**: `CLAUDE_CODE_F130_F131_F132_COMMERCE.md`의 **F132 부분만**
**할 일**: 차지백 관리 (dispute tracking, evidence 수집, 자동 대응)
**검수**: 5회 통과 → 자동으로 TASK 5로

---

## TASK 5/17: F133 Order Auto-Sync (NOT_EXECUTED)
**파일**: `app/api/v1/commerce/orders/route.ts` — 미생성
**참고**: `CLAUDE_CODE_F133_F134_ORDERS.md`의 **F133 부분만**
**할 일**: 마켓플레이스 주문 동기화 + HS 코드 자동 분류 + 충돌 처리
**검수**: 5회 통과 → 자동으로 TASK 6으로

---

## TASK 6/17: F134 Bulk Order Import (NOT_EXECUTED)
**파일**: `app/api/v1/commerce/orders/route.ts` (F133과 같은 파일의 bulk import 부분)
**참고**: `CLAUDE_CODE_F133_F134_ORDERS.md`의 **F134 부분만**
**할 일**: CSV/JSON 벌크 주문 가져오기 + 유효성 검사
**검수**: 5회 통과 → 자동으로 TASK 7로

---

## TASK 7/17: F052 API Auth 보완 (PARTIAL)
**문제**: keys.ts 존재하나 /keys CRUD routes 미생성
**참고**: `CLAUDE_CODE_F052_API_AUTH_100.md`의 GAP 5번(API Key 관리 엔드포인트)
**할 일**: /api/v1/keys/ CRUD route 생성 (목록/상세/수정/해제 + 사용 통계)
**검수**: 5회 통과 → 자동으로 TASK 8로

---

## TASK 8/17: F125 API Key Security 보완 (PARTIAL)
**문제**: /keys/rotate route 미생성
**참고**: `CLAUDE_CODE_F125_API_KEY_SECURITY_100.md`의 키 로테이션 부분
**할 일**: /api/v1/keys/rotate/route.ts 생성 (기존 키 폐기 + 새 키 발급 + 감사 로그)
**검수**: 5회 통과 → 자동으로 TASK 9로

---

## TASK 9/17: F008 Audit Trail 보완 (PARTIAL)
**문제**: audit-trail.ts 존재하나 /audit route 미생성
**참고**: `CLAUDE_CODE_F008_AUDIT_TRAIL.md`의 C2(검색 API 엔드포인트)
**할 일**: /api/v1/audit/route.ts 생성 + queryAudits() 필터/페이지네이션 + CSV export
**검수**: 5회 통과 → 자동으로 TASK 10으로

---

## TASK 10/17: F055 VAT Registration 보완 (PARTIAL)
**문제**: route 229줄 존재, lib 미생성
**참고**: `CLAUDE_CODE_F055_VAT_REGISTRATION.md`의 lib 파일 부분
**할 일**: app/lib/tax/vat-registration.ts 생성 + VIES VAT 번호 검증 + OSS 임계값 업데이트
**검수**: 5회 통과 → 자동으로 TASK 11로

---

## TASK 11/17: F062 Tracking 보완 (PARTIAL)
**문제**: 40줄 minimal stub
**참고**: `CLAUDE_CODE_F062_TRACKING.md` 전체
**할 일**: dataSource 표시 + 통관 이벤트 타입 9개 + webhook 상태 알림
**검수**: 5회 통과 → 자동으로 TASK 12로

---

## TASK 12/17: F135 Inventory Sync 보완 (PARTIAL)
**문제**: inventory만 89줄
**참고**: `CLAUDE_CODE_F135_F136_F137_FULFILLMENT.md`의 **F135 부분만**
**할 일**: 마켓플레이스 재고 동기화 + 저재고 알림 임계값 설정
**검수**: 5회 통과 → 자동으로 TASK 13으로

---

## TASK 13/17: F136 3PL Integration 보완 (PARTIAL)
**참고**: `CLAUDE_CODE_F135_F136_F137_FULFILLMENT.md`의 **F136 부분만**
**할 일**: 3PL 연동 구조 (ShipBob, Deliverr 등 커넥터 인터페이스)
**검수**: 5회 통과 → 자동으로 TASK 14로

---

## TASK 14/17: F137 Multi-Hub 보완 (PARTIAL)
**참고**: `CLAUDE_CODE_F135_F136_F137_FULFILLMENT.md`의 **F137 부분만**
**할 일**: 멀티허브 재고 관리 + 최적 창고 선택 로직
**검수**: 5회 통과 → 자동으로 TASK 15로

---

## TASK 15/17: F030 Property Tax 보완 (PARTIAL)
**문제**: 41줄 stub
**참고**: `CLAUDE_CODE_F030_F056_TAX_MISC.md`의 **F030 부분만**
**할 일**: 카운티/시 레벨 구분 + 상업용/주거용 multiplier + 주별 공식 조회 URL
**검수**: 5회 통과 → 자동으로 TASK 16으로

---

## TASK 16/17: F056 Business License 보완 (PARTIAL)
**문제**: 58줄 minimal
**참고**: `CLAUDE_CODE_F030_F056_TAX_MISC.md`의 **F056 부분만**
**할 일**: 50개 주 면허 데이터 + 산업별 요건 + 참조 URL + disclaimer
**검수**: 5회 통과 → 자동으로 TASK 17로

---

## TASK 17/17: F146 Partner Mgmt 보완 (PARTIAL)
**문제**: ecosystem 58줄 존재, /manage route 미생성
**참고**: `CLAUDE_CODE_F146_PARTNER_MGMT.md` 전체
**할 일**: /partners/apply (가입 신청) + /partners/dashboard (통계) + 계약 관리
**검수**: 5회 통과 → "=== 전체 17/17 완료 ===" 출력

---

## 실행 흐름 요약
```
TASK 1 시작 → 구현 → 검수 5회 → PASS → TASK 2 시작 → 구현 → 검수 5회 → PASS → ... → TASK 17 → PASS → 완료
```
검수 FAIL 시 → 수정 → 재검수 → PASS될 때까지 반복. 절대 다음으로 넘어가지 않음.
