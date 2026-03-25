# F140 AEO (Authorized Economic Operator) Support — 강화 명령어

## 현재 상태
- 기본 stub만 존재
- AEO 혜택 계산 및 가이드 없음

## CRITICAL 수정 사항

### C1. AEO 프로그램 데이터베이스
- `app/lib/compliance/aeo-programs.ts` 신규 생성
- 주요 AEO 프로그램 15개국 데이터:
  - US C-TPAT (Customs-Trade Partnership Against Terrorism)
  - EU AEO-C / AEO-S / AEO-F (Customs/Security/Full)
  - UK AEO
  - JP AEO
  - KR AEO
  - AU Australian Trusted Trader
  - CA PIP (Partners in Protection) / CSA (Customs Self Assessment)
  - CN AEO (China Customs)
  - SG TradeFIRST
  - NZ Secure Exports Scheme
- 각 프로그램: requirements[], benefits[], processing_time, renewal_period, mutual_recognition[]

### C2. AEO 혜택 계산기
- `app/api/v1/compliance/aeo/benefits/route.ts` 신규 생성
- POST: seller_country + destination_country + current_aeo_status → 혜택 계산
- 혜택 유형: reduced_inspections (%), faster_clearance (hours saved), reduced_bond/guarantee, priority_processing
- MRA (Mutual Recognition Agreement) 체크: US C-TPAT ↔ EU AEO 상호인정

### C3. AEO 자격 요건 체커
- `app/api/v1/compliance/aeo/eligibility/route.ts` 신규 생성
- POST: 셀러 정보 (country, business_type, annual_volume, years_in_business, compliance_history) → 자격 체크
- 결과: eligible (boolean), missing_requirements[], estimated_timeline, recommended_program

### C4. AEO 신청 가이드 생성
- `app/api/v1/compliance/aeo/guide/route.ts` 신규 생성
- GET ?country=XX&program=YY: 해당 국가/프로그램 신청 절차 가이드
- 단계별: application_steps[], required_documents[], estimated_costs, tips[]
- 링크: 각국 세관 공식 AEO 신청 페이지 URL

### C5. MRA 네트워크 매핑
- aeo-programs.ts에 mutual_recognition_agreements 매핑
- 예: US C-TPAT ↔ EU AEO, US C-TPAT ↔ JP AEO 등
- API: /api/v1/compliance/aeo/mra?from=US&to=EU → 상호인정 여부 + 혜택

### C6. TLC에 AEO 혜택 반영
- 기존 landed cost 계산에 aeo_status 옵션 파라미터 추가
- AEO 보유 시: 검사 비용 감소, 통관 시간 단축, 보증금 감면 반영
- 응답에 aeo_savings 필드 추가 (AEO 있을 때 vs 없을 때 비교)

## 수정/생성 파일
- app/lib/compliance/aeo-programs.ts (신규 — 15개국 AEO 데이터)
- app/api/v1/compliance/aeo/benefits/route.ts (신규 — 혜택 계산)
- app/api/v1/compliance/aeo/eligibility/route.ts (신규 — 자격 체크)
- app/api/v1/compliance/aeo/guide/route.ts (신규 — 신청 가이드)

## 5-Step 검증
1. TypeScript compile — `npx tsc --noEmit 2>&1 | grep -c "error"` → 0
2. `as any` 검사 — 새 파일에 `as any` 없어야 함
3. `npm run build` — Compiled successfully
4. 테스트 작성 + 실행 — 10개+ PASS
5. 에러 핸들링 — try-catch + 국가/프로그램 미존재 처리 + MRA 매핑 검증
