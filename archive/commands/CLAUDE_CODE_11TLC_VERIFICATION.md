# Claude Code 명령어: 11개 TLC 영역 완벽 검증 — 관세사/세무사 역설계 × 5회 반복검증

> **날짜**: 2026-03-23 KST
> **목표**: HS Code 이외 11개 Total Landed Cost 계산 영역을 하나씩 "실제 관세사/세무사가 계산하는 방식"과 대조하여 100% 정확도 달성
> **원칙**:
>   - "시스템화된 건 전부 코드화 가능 = AI 불필요" (HS Code에서 증명)
>   - 각 영역마다: (1) 실무 프로세스 역설계 (2) 코드 대조 (3) 5회 반복검증 (4) 엣지케이스 보완 (5) 최종 확정
>   - 모든 결과는 엑셀 로깅 (CLAUDE.md 절대 규칙 11번)
>   - 크든 작든 결과가 나올 때마다 5회 반복검증 필수
>
> **⚠️ 벤치마크 절대 원칙: 100% 완전한 입력 데이터만 인정**
>   - 각 영역의 계산에 필요한 모든 입력값이 100% 있는 테스트 케이스만 사용한다
>   - 입력이 불완전한 데이터로 벤치마크를 돌리지 않는다 — 그 결과는 시스템 성능이 아니라 입력의 문제
>   - 시스템은 완전한 입력이 들어오면 100% 정확한 결과를 내도록 설계한다
>   - 불완전한 입력에 대해서는 "이 필드가 빠져있다"는 진단 메시지만 표시하면 된다
>   - 이것은 HS Code(9-field)에서 증명된 원칙이며, 11개 TLC 영역 전부에 동일 적용

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

---

## 작업 순서 (1→11, 한 번에 하나씩)

```
영역 1: Duty Rate (관세율) — 가장 핵심, 데이터 가장 큼
영역 2: VAT/GST — 모든 거래에 적용, 240개국
영역 3: De Minimis — VAT/Duty와 직결, 간단하지만 정확해야 함
영역 4: Special Tax — 12개국 복잡 세금 (Brazil/India/Mexico/China)
영역 5: Customs Fees — 통관 수수료
영역 6: AD/CVD — 반덤핑/상계관세, 데이터 119K건
영역 7: Rules of Origin — FTA 63개, 관세 절감 핵심
영역 8: Currency — 환율, 최종 금액 변환
영역 9: Insurance/Shipping — CIF 계산 기초
영역 10: Export Controls — ECCN 분류
영역 11: Sanctions — 제재 스크리닝
```

---

## 각 영역 공통 작업 프로세스 (6 Phase)

### Phase 1: 실무 프로세스 역설계

이 영역에서 실제 관세사/세무사/물류전문가가 어떻게 계산하는지 조사한다.

```
1-1. 법적 근거 확인
    - 이 계산의 법적 근거는 무엇인가? (WTO 협정, 각국 관세법, EU Directive 등)
    - 어떤 국제기구/정부가 이 규칙을 정하는가?
    - 규칙이 바뀌는 주기는? (매년? 수시? HS처럼 5-6년?)

1-2. 계산 공식 정리
    - 입력값: 뭐가 필요한가? (HS Code, CIF value, origin, destination, ...)
    - 계산 공식: 어떤 순서로 어떤 수식을 적용하는가?
    - 출력값: 최종 결과물은 뭔가? (금액, 비율, 판정 등)
    - 예외/엣지케이스: 어떤 경우에 일반 공식이 안 통하는가?

1-3. 계산 흐름도 작성
    - Step 1 → Step 2 → ... 순서도
    - 각 Step에서 어떤 데이터를 참조하는가?
    - 분기 조건 (if/else) 정리
```

### Phase 2: 현재 코드 대조

Phase 1의 실무 프로세스와 현재 POTAL 코드를 1:1 대조한다.

```
2-1. 코드 읽기
    - 해당 영역의 메인 계산 함수 전체 읽기
    - 사용하는 DB 테이블/하드코딩 데이터 확인
    - 외부 API 호출 여부 확인

2-2. 실무 vs 코드 GAP 분석
    - 실무 프로세스의 각 Step이 코드에 있는가?
    - 빠진 Step은? (구현 안 된 부분)
    - 잘못된 Step은? (공식이 틀린 부분)
    - 하드코딩이 오래됐거나 틀린 부분? (세율 변경 미반영 등)

2-3. GAP 목록 작성
    | GAP # | 실무 기준 | 현재 코드 | 문제 | 심각도 |
    |-------|----------|----------|------|--------|
    | 1     | EU VAT 표준 23% | 코드에 21% | 아일랜드 세율 변경 미반영 | HIGH |
    | 2     | Brazil ICMS 주별 | 하드코딩 | 2024 세율 변경 미반영 | MEDIUM |
    | ...   |          |          |      |        |
```

### Phase 3: GAP 수정

Phase 2에서 발견된 GAP을 수정한다.

```
3-1. 수정 우선순위 결정
    - HIGH: 계산 결과가 틀리는 것 → 즉시 수정
    - MEDIUM: 최신 데이터 미반영 → 데이터 업데이트
    - LOW: 구조 개선 → 나중에

3-2. 코드 수정
    - 각 수정마다: 변경 전 코드 + 변경 후 코드 엑셀 기록
    - 수정 근거 (어떤 법/규정 기준인지) 기록

3-3. npm run build 확인
    - TypeScript 에러 0개 확인
```

### Phase 4: 테스트 케이스 설계 — 5회 반복검증

**핵심: 실제 무역 거래를 시뮬레이션하는 테스트 케이스 설계**

> ⚠️ **모든 테스트 케이스는 해당 영역 계산에 필요한 입력값이 100% 있어야 한다.**
> 예: Duty Rate 테스트에는 HS Code + origin + destination + CIF value 등 모든 필수 입력 완비.
> 입력이 하나라도 빠진 테스트 케이스는 벤치마크에 포함하지 않는다.
> 불완전 입력은 "진단 메시지 표시" 기능만 별도 테스트한다 (정확도 벤치마크와 분리).

```
4-1. 테스트 케이스 설계 (최소 20건 — 전부 입력값 100% 완비)
    - 주요 무역 경로 커버: US→EU, CN→US, JP→KR, DE→AU 등
    - 일반 케이스 10건: 가장 흔한 거래 유형
    - 엣지케이스 5건: de minimis 경계, FTA 적용/미적용, 특수세금 국가 등
    - 극단 케이스 5건: 0% 세율, 100%+ 세율(AD/CVD), 다중 세금 적층
    - ❌ 입력 불완전 케이스는 벤치마크에 넣지 않음

4-2. Ground Truth (정답) 확보
    - 각 테스트 케이스의 정답을 어디서 얻는가?
    - 방법 1: 정부 공식 계산기 (US CBP Duty Calculator, EU TARIC, 등)
    - 방법 2: 경쟁사 API 교차 검증 (potal.app MCP 도구 활용)
    - 방법 3: 수동 계산 (공식 × 데이터 = 정답)
    - 정답 소스 반드시 기록

4-3. 5회 반복검증
    ┌─────────────────────────────────────────────────┐
    │  검증 1회차: 20건 테스트 실행 → 결과 기록       │
    │  검증 2회차: 1회차 틀린 건 원인 분석 + 수정     │
    │            → 20건 전체 재실행 (regression 포함)  │
    │  검증 3회차: 2회차 결과 확인 + 새 엣지케이스 추가│
    │            → 25건 실행 (기존 20 + 추가 5)        │
    │  검증 4회차: 다른 국가/경로로 20건 추가          │
    │            → 45건 전체 실행                      │
    │  검증 5회차: 최종 확인                           │
    │            → 45건 전체 + 랜덤 10건 = 55건 실행   │
    │            → 55건 전부 PASS여야 완료              │
    └─────────────────────────────────────────────────┘

    각 회차마다:
    - PASS/FAIL 건수
    - FAIL 원인 분류 (코드버그 / 데이터오류 / 엣지케이스 / 정답소스오류)
    - 수정 내역
    - regression 여부 (이전 PASS가 FAIL로 바뀌면 즉시 롤백)
```

### Phase 5: 최종 확정

```
5-1. 최종 결과표
    | 영역 | 테스트 건수 | PASS | FAIL | 정확도 | 검증 횟수 |
    |------|-----------|------|------|--------|----------|
    | Duty Rate | 55 | 55 | 0 | 100% | 5회 |

5-2. 알려진 한계 기록
    - 100% 달성했어도 "이 경우는 정확도 보장 불가"한 것 기록
    - 예: "X국가는 세율 데이터가 2024년 기준이라 최신 변경 미반영 가능"

5-3. 코드 수정사항 요약
    - 수정된 파일 목록
    - 주요 변경 내용
```

### Phase 6: 엑셀 기록

```
6-1. POTAL_TLC_Verification.xlsx에 영역별 시트 추가
    - Sheet: [영역명]_Dashboard — 요약 (5회 검증 결과, GAP 수, 수정 수)
    - Sheet: [영역명]_GapAnalysis — 실무 vs 코드 GAP 전체
    - Sheet: [영역명]_TestCases — 55건 테스트 전체 (입력/기대값/실제값/PASS-FAIL)
    - Sheet: [영역명]_5Round — 5회 반복검증 라운드별 상세

6-2. Work Log에 전체 과정 기록 (CLAUDE.md 절대 규칙 11번)
```

---

## 영역 1: Duty Rate (관세율) — 상세 가이드

> 나머지 10개도 동일 프로세스. 영역 1 완료 후 영역 2로 넘어간다.

### Phase 1: 실무 프로세스 역설계

**관세사가 관세율을 계산하는 실제 과정:**

```
Step 1: HS Code 확정 (→ 이건 이미 100% 완성)
Step 2: 도착지 국가의 관세율표에서 해당 HS Code의 MFN 세율 조회
Step 3: 원산지 국가와 도착지 국가 간 FTA가 있는지 확인
Step 4: FTA가 있으면 → FTA 특혜세율 적용 (보통 0% 또는 감면)
Step 5: FTA가 없으면 → MFN(최혜국) 세율 적용
Step 6: AD/CVD(반덤핑/상계관세) 해당 여부 확인
Step 7: AD/CVD 해당이면 → 추가 관세 적용 (firm-specific rate or "All Others" rate)
Step 8: 특별 관세 확인 (US Section 301/232, EU Safeguard 등)
Step 9: 최종 관세율 = MFN or FTA + AD/CVD + 특별관세

관세 금액 = CIF Value × 최종 관세율
```

**법적 근거:**
- WTO GATT Article I (MFN 원칙)
- 각국 관세법 (US: Harmonized Tariff Schedule, EU: TARIC, etc.)
- FTA 원문 (USMCA, KORUS, RCEP, CPTPP, etc.)
- WTO Anti-Dumping Agreement (AD), SCM Agreement (CVD)

### Phase 2: 현재 코드 대조

```
확인할 파일들:
1. app/lib/cost-engine/GlobalCostEngine.ts — 메인 계산 흐름
2. app/lib/cost-engine/macmap-lookup.ts — 4단계 폴백 (AGR→MIN→NTLC→MFN)
3. app/lib/cost-engine/db/duty-rates-db.ts — DB 조회
4. app/lib/cost-engine/hs-code/fta.ts — FTA 적용
5. app/lib/cost-engine/trade-remedy-lookup.ts — AD/CVD
6. app/lib/cost-engine/section301-lookup.ts — US 추가관세
7. app/lib/cost-engine/hs-code/duty-rates.ts — 하드코딩 fallback

확인 포인트:
- [ ] MFN 세율 조회 경로가 올바른가? (DB → fallback 체인)
- [ ] FTA 적용 로직이 정확한가? (원산지 + 도착지 + HS Code 3자 매칭)
- [ ] AD/CVD 적용 순서가 맞는가? (MFN/FTA 위에 추가)
- [ ] CIF Value 계산이 맞는가? (FOB + Insurance + Freight)
- [ ] 관세 금액 = CIF × Rate 공식이 맞는가?
- [ ] 소수점 처리 (반올림/내림/자릿수)
- [ ] 0% 세율 (면세) 처리
- [ ] 100%+ 세율 (AD/CVD 중첩) 처리
```

### Phase 4: 테스트 케이스

```
20건 설계 기준:

일반 케이스 (10건):
TC-01: Cotton T-shirt, CN→US, MFN
TC-02: Laptop, CN→DE, MFN + EU VAT
TC-03: Auto parts, JP→US, MFN + Section 232 steel/aluminum check
TC-04: Wine, FR→KR, FTA (KORUS) 적용
TC-05: Electronics, KR→US, FTA (KORUS) 적용
TC-06: Footwear, VN→EU, MFN
TC-07: Cosmetics, FR→JP, FTA (EPA) 적용
TC-08: Furniture, CN→AU, MFN + AD check
TC-09: Textiles, BD→CA, LDC preferential
TC-10: Food product, MX→US, USMCA

엣지케이스 (5건):
TC-11: Solar panels, CN→US, AD/CVD 적용 (firm-specific vs All Others)
TC-12: Steel, CN→EU, Safeguard 적용
TC-13: De minimis 경계 ($799 → $801, US Section 321 기준)
TC-14: 동일 HS Code인데 FTA 유/무에 따라 0% vs 12%
TC-15: 다중 FTA 적용 가능 (RCEP vs CPTPP, 더 낮은 것 선택)

극단 케이스 (5건):
TC-16: 0% MFN (IT 제품 ITA 면세)
TC-17: AD + CVD + Section 301 = 합산 250%+ 관세
TC-18: 금지 품목 (무기, 마약류) → 세율 적용 불가, 제한 표시
TC-19: 미승인 국가 (북한→US) → 일반 MFN 미적용, Column 2 적용
TC-20: HS Code 없이 입력 → 에러 처리 확인

Ground Truth 소스:
- US: USITC HTS online (hts.usitc.gov) 직접 조회
- EU: TARIC online (ec.europa.eu/taxation_customs/dds2/taric) 직접 조회
- FTA: 원문 부속서 양허표
- AD/CVD: Federal Register 공고문 (세율 명시)
- 경쟁사 교차 검증: potal.app MCP calculate_landed_cost 도구 활용
```

---

## ⚠️ 절대 규칙

1. **한 번에 하나의 영역만** — 영역 1 완료 후 영역 2로 (멀티태스킹 금지)
2. **5회 반복검증 필수** — 크든 작든 결과가 나올 때마다
3. **regression 즉시 롤백** — 이전 PASS가 FAIL로 바뀌면 수정 취소
4. **정답 소스 기록 필수** — "이 정답은 어디서 왔는가" 반드시 기록
5. **npm run build 매 수정마다** — TypeScript 에러 0개
6. **엑셀 로깅** (절대 규칙 11번)
7. **Layer 1 HS Code 코드 수정 금지** — 관세율 계산 코드만 수정
8. **하드코딩 세율은 DB에 있으면 DB 우선** — 하드코딩은 fallback으로만
9. **벤치마크는 100% 완전한 입력 데이터만** — 입력이 불완전한 테스트 케이스로 정확도를 측정하지 않는다. 불완전 입력의 결과는 시스템 성능이 아니라 입력의 문제다. 시스템 정확도는 완전한 입력 기준으로만 판단한다

### 환경변수:
```bash
export NEXT_PUBLIC_SUPABASE_URL='https://zyurflkhiregundhisky.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dXJmbGtoaXJlZ3VuZGhpc2t5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTU5MTgyMywiZXhwIjoyMDg1MTY3ODIzfQ.CP3E_iSO7rSLaYiW_HtH4hohN40S2Sp8aIdu1RD4J04'
```

---

## 영역 완료 시 마감

각 영역 완료 후:
```
시트 마감: === [영역명] 검증 완료 === | 55건 PASS | GAP X개 발견 → X개 수정 | 5회 검증 100% | 수정 파일 N개
```

11개 전부 완료 후:
```
POTAL_TLC_Verification.xlsx — 11개 영역 × (Dashboard + GapAnalysis + TestCases + 5Round) = 44+ 시트
최종 시트: TLC_SUMMARY — 11개 영역 종합 (총 테스트 건수, 총 GAP 수, 총 수정 수, 전체 정확도)
```
