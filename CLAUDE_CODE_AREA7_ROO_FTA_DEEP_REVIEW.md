# Area 7: Rules of Origin & FTA — Deep Review
# 63개 FTA + 1,319 무역협정 + RoO 엔진 + Origin 판정 + MacMap 연동

## 목표
Rules of Origin (원산지 규정) + FTA (자유무역협정) 코드 전체 심층 리뷰 + 5회 자체 검수.
이 영역은 관세 최적화(tariff optimization)의 핵심 — FTA 적용 시 관세율이 MFN 대비 0~50%p 낮아질 수 있음.

## ⚠️ 절대 규칙
1. **Area 7만 한다. 끝나면 멈춰라. Area 8로 넘어가지 마라.**
2. **5회 자체 검수 전부 디테일하게 실행** — "PASS" 한 줄로 끝내지 마라. 각 검수마다 개별 테스트 결과 전부 표시
3. **rapidly 금지** — 하나씩 천천히 정확하게
4. **발견한 버그는 즉시 수정** — 수정 전/후 코드 명시
5. **엑셀 로깅 필수** — POTAL_Claude_Code_Work_Log.xlsx에 시트 추가

---

## Phase 1: 코드 읽기 (전체 파악)

아래 파일들을 **전부** 읽는다:

```bash
# 1. fta.ts — FTA 메인 엔진 (HS Code 기반 FTA 조회)
#    핵심: FTA 조회 로직, preferential rate 계산
cat app/lib/cost-engine/hs-code/fta.ts

# 2. roo-engine.ts — Rules of Origin 엔진
#    핵심: PSR(Product-Specific Rules), CTC(Change in Tariff Classification), RVC(Regional Value Content), De Minimis
cat app/lib/trade/roo-engine.ts

# 3. fta-db.ts — FTA DB 조회 레이어
cat app/lib/cost-engine/db/fta-db.ts

# 4. macmap-lookup.ts — MacMap 데이터 기반 preferential rate 조회
#    핵심: macmap_trade_agreements 1,319건 + macmap_ntlc_rates 537K건 연동
cat app/lib/cost-engine/macmap-lookup.ts

# 5. GlobalCostEngine.ts — TLC에서 FTA/preferential rate 적용 위치
#    핵심: FTA 감지 → preferential rate 적용 → tariffOptimization 필드
cat app/lib/cost-engine/GlobalCostEngine.ts

# 6. duty-rate-lookup.ts (v3 파이프라인) — macmap 세율 조회
cat app/lib/cost-engine/gri-classifier/steps/v3/duty-rate-lookup.ts

# 7. API Routes — RoO 4개
cat app/api/v1/roo/route.ts
cat app/api/v1/roo/evaluate/route.ts
cat app/api/v1/roo/check/route.ts
cat app/api/v1/roo/rvc-calc/route.ts

# 8. API Routes — FTA 4개
cat app/api/v1/fta/route.ts
cat app/api/v1/fta/eligibility/route.ts
cat app/api/v1/fta/compare/route.ts
cat app/api/v1/fta/database/route.ts

# 9. API Routes — Origin 3개
cat app/api/v1/origin/route.ts
cat app/api/v1/origin/determine/route.ts
cat app/api/v1/origin/predict/route.ts
cat app/api/v1/origin/self-certify/route.ts

# 10. API Routes — Compare Origins
cat app/api/v1/calculate/compare-origins/route.ts
cat app/api/v1/duty-rates/compare-origins/route.ts

# 11. Cron — FTA 변경 모니터링
cat app/api/v1/cron/fta-change-monitor/route.ts

# 12. DB 테이블 현황 — macmap_trade_agreements + 관련 테이블
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables WHERE tablename LIKE '"'"'%fta%'"'"' OR tablename LIKE '"'"'%trade_agreement%'"'"' OR tablename LIKE '"'"'macmap_%'"'"' ORDER BY tablename;"}'

# 13. DB 샘플 — macmap_trade_agreements 구조 + 샘플 5건
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = '"'"'macmap_trade_agreements'"'"' ORDER BY ordinal_position;"}'

curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM macmap_trade_agreements LIMIT 5;"}'

# 14. DB 통계 — FTA 종류별 분포
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT agreement_type, count(*) FROM macmap_trade_agreements GROUP BY agreement_type ORDER BY count(*) DESC LIMIT 20;"}'

# 15. DB — ntlc rates에서 preferential rate 존재 확인 (샘플)
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT reporter, partner, hs_code, ntlc_rate, source_name FROM macmap_ntlc_rates WHERE source_name != '"'"'MFN'"'"' LIMIT 10;"}'

# 16. DB — min rates에서 preferential rate 확인 (있는 경우)
curl -s -X POST https://api.supabase.com/v1/projects/zyurflkhiregundhisky/database/query \
  -H "Authorization: Bearer sbp_eb6ee564c92421474308e71af8e44fc6b0e83e35" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT DISTINCT source_name FROM macmap_ntlc_rates WHERE source_name != '"'"'MFN'"'"' LIMIT 20;"}'
```

---

## Phase 2: 10개 분석 영역 (하나씩 순서대로)

### 분석 1: fta.ts — FTA 조회 + Preferential Rate 로직
**검증 항목:**
- 63개 FTA가 코드/DB에 어떤 형태로 저장되는지 (하드코딩? DB 조회?)
- HS code + origin + destination → FTA 매칭 로직이 정확한지
- 하나의 origin-destination 간 복수 FTA 존재 시 처리 (가장 낮은 세율 선택?)
- FTA preferential rate vs MFN rate 비교 → savings 계산
- USMCA, RCEP, CPTPP, EU-Korea, KORUS 등 주요 FTA가 올바르게 매핑되는지
- HS code 6자리 기준 매칭인지, 더 세밀한 매칭인지

### 분석 2: roo-engine.ts — Rules of Origin 판정 로직
**검증 항목:**
- PSR (Product-Specific Rules) 구현: CTC / RVC / De Minimis / Combination 규칙
- CTC (Change in Tariff Classification): CC(Chapter Change), CTH(Heading Change), CTSH(Subheading Change) 구분
- RVC (Regional Value Content) 계산: Build-Up vs Build-Down method
  - Build-Up: RVC = (VOM / AV) × 100 (원산지 재료 가치 / 조정 가치)
  - Build-Down: RVC = ((AV - VNM) / AV) × 100 (비원산지 재료 차감)
- De Minimis 규칙: 비원산지 재료가 일정 비율 이하면 원산지 인정 (보통 10%)
- substantial transformation 판단 로직 있는지
- 누적(accumulation/cumulation) 규칙: bilateral vs diagonal vs full
- 직접 운송(direct consignment/transit) 조건 처리

### 분석 3: macmap-lookup.ts — MacMap 데이터 연동
**검증 항목:**
- macmap_trade_agreements 1,319건과 코드의 연동 방식
- NTLC (National Tariff Line Code) rate 조회 → preferential rate 추출
- MIN rate vs NTLC rate: 어느 것이 preferential rate인지
- reporter/partner 매핑: reporter=importer, partner=exporter 맞는지
- EU 회원국 처리: DE→EU 매핑 (EU가 단일 관세 영역)
- HS code 점(.) 포함/미포함 매칭 이슈
- source_name 필드: 'MFN' vs FTA 이름 구분

### 분석 4: GlobalCostEngine에서 FTA 적용 흐름
**검증 항목:**
- FTA 감지 타이밍: TLC 계산 중 언제 FTA를 확인하는지
- preferential rate 적용: MFN rate를 FTA rate로 대체하는 코드 위치
- tariffOptimization 응답 필드: savings 금액 + 적용된 FTA 이름 + 원래 MFN rate
- FTA 미적용 케이스: origin-destination 간 FTA 없으면 MFN 그대로
- FTA rate가 MFN보다 높은 예외 케이스 처리 (발생 가능?)
- lookupAllDutyRates()에서 MIN/AGR/NTLC 3테이블 병렬 조회 → 최저 세율 자동 선택 확인

### 분석 5: Origin 판정 API 3개
**검증 항목:**
- `/origin/determine` — 원산지 판정 로직: 어떤 기준으로 판정하는지
- `/origin/predict` — 원산지 예측: AI 기반? 규칙 기반?
- `/origin/self-certify` — 자가 인증: USMCA/RCEP 등 self-certification 요건
- 원산지 판정에 필요한 입력: HS code + 제조국 + 부품 origin + 가공 공정?
- 비특혜 원산지(non-preferential origin) vs 특혜 원산지(preferential origin) 구분

### 분석 6: RVC 계산 엔드포인트
**검증 항목:**
- `/roo/rvc-calc` — RVC 계산 API: Build-Up + Build-Down 둘 다 지원하는지
- 입력 파라미터: adjustedValue, originatingMaterials, nonOriginatingMaterials 등
- RVC threshold: FTA별로 다름 (USMCA 75%, RCEP 40%, CPTPP 45% 등) — 정확한 기준
- 계산 결과: pass/fail + RVC 퍼센트 + 사용된 method
- 에러 핸들링: 입력 누락, 음수 값, 0 나누기 등

### 분석 7: FTA 비교 + Eligibility
**검증 항목:**
- `/fta/eligibility` — 특정 origin-destination-HS code에 적용 가능한 FTA 목록 반환
- `/fta/compare` — 복수 FTA 간 세율 비교
- `/fta/database` — FTA 전체 목록 또는 검색
- 63개 FTA 목록이 최신인지 (RCEP 2022, UK-NZ 2023, EU-NZ 2024 등)

### 분석 8: Compare Origins 기능
**검증 항목:**
- `/calculate/compare-origins` — 동일 상품을 여러 원산지에서 수입 시 TLC 비교
- `/duty-rates/compare-origins` — 원산지별 관세율만 비교
- FTA 적용/미적용 시 비용 차이가 올바르게 반영되는지
- 사용 시나리오: "CN vs VN vs IN 중 어디서 수입하면 가장 저렴?" → 정확한 비교

### 분석 9: FTA Change Monitor Cron
**검증 항목:**
- fta-change-monitor Cron 주기: 매주 금 06:00 UTC
- 모니터링 대상: WTO RTA-IS + 7개국 FTA 포털
- 변경 감지 방식: 페이지 해시? RSS? API?
- 변경 시 알림: health_check_logs 기록 + Resend 이메일?
- 새 FTA 체결 시 자동 DB 업데이트 되는지 vs 수동인지

### 분석 10: DB 데이터 정합성
**검증 항목:**
- macmap_trade_agreements 1,319건: agreement_type 분포 확인
- NTLC rates에서 FTA별 preferential rate 존재 확인
- 주요 FTA 커버리지: USMCA(US-MX-CA), RCEP(15개국), CPTPP(11개국), EU-KR, KORUS, EU-JP, UK-JP
- EU 27국이 단일 reporter로 처리되는지 vs 개별 국가인지
- HS code 길이 일관성: 6자리? 가변?
- reporter/partner에 누락 국가 없는지 (240개국 중)

---

## Phase 3: 테스트 케이스 30건

### TC-01~05: FTA 조회 + Preferential Rate 5건
```
TC-01: KR→US, HS 8471.30 (laptop) → KORUS FTA 존재, preferential rate 조회
TC-02: CN→US, HS 6109.10 (t-shirt) → FTA 없음 (US-CN), MFN rate만 적용
TC-03: MX→US, HS 8703.23 (passenger car) → USMCA 존재, preferential rate 조회
TC-04: JP→EU, HS 8471.30 (laptop) → EU-Japan EPA 존재, preferential rate 조회
TC-05: VN→JP, HS 6109.10 (t-shirt) → RCEP + CPTPP 복수 FTA 중 최저 세율 선택
```

### TC-06~10: RoO 판정 5건
```
TC-06: USMCA — HS 8703.23 자동차, RVC 75% 기준, BOM 데이터로 판정
TC-07: RCEP — HS 6109.10 t-shirt, CTC(CTH) 규칙, 원사→완제품 = heading change
TC-08: CPTPP — HS 0803.10 바나나, wholly obtained(완전 생산품) 규칙
TC-09: EU-Korea — HS 8471.30 laptop, 복합 규칙 (CTC + RVC)
TC-10: De Minimis 테스트 — 비원산지 재료 8% → 10% threshold 미만 → 원산지 인정
```

### TC-11~14: RVC 계산 4건
```
TC-11: Build-Up method — RVC = (originating $700 / adjusted $1000) = 70%, USMCA 75% → FAIL
TC-12: Build-Down method — RVC = (($1000 - non-orig $250) / $1000) = 75%, USMCA 75% → PASS
TC-13: RCEP 40% threshold — RVC = 45% → PASS
TC-14: 에지 케이스 — adjustedValue = 0 → divide by zero 처리
```

### TC-15~18: FTA Eligibility + Compare 4건
```
TC-15: VN→AU → AANZFTA + RCEP + CPTPP 3개 FTA 반환
TC-16: US→CA → USMCA 반환
TC-17: BR→EU → EU-Mercosur (미발효?) 상태 확인
TC-18: FTA compare: VN→JP에서 RCEP vs CPTPP 세율 비교 → 더 낮은 것 표시
```

### TC-19~22: Compare Origins 4건
```
TC-19: HS 6109.10, destination US → origin CN vs VN vs BD → TLC 비교 (CN: 301+MFN, VN: FTA, BD: GSP)
TC-20: HS 8471.30, destination EU → origin CN vs KR vs JP → EU-KR/EU-JP FTA 차이
TC-21: HS 7208.51 steel, destination US → origin KR vs CN vs JP → 232+301 차이
TC-22: origin 목록에 FTA 없는 나라만 → 전부 MFN rate 동일
```

### TC-23~26: MacMap 데이터 연동 4건
```
TC-23: macmap_trade_agreements에서 USMCA 레코드 존재 확인 (reporter/partner 매핑)
TC-24: NTLC rate에서 FTA preferential rate 실제 조회 (MFN이 아닌 source_name)
TC-25: EU 회원국(DE) → reporter=EU로 매핑되어 조회되는지
TC-26: HS code 매칭: 6자리 exact vs 4자리 prefix — preferential rate도 동일 매칭 패턴인지
```

### TC-27~30: Edge Cases + DB 정합성 4건
```
TC-27: FTA 있지만 해당 HS code에 preferential rate 없는 경우 → MFN fallback
TC-28: 동일 origin-destination에 FTA + GSP(일반특혜관세) 동시 존재 → 처리 방식
TC-29: DB orphan check — macmap_trade_agreements에 있는 reporter/partner가 countries 테이블에 전부 존재하는지
TC-30: FTA change monitor Cron — health_check_logs에 최근 실행 기록 확인
```

---

## Phase 4: 수정 (발견된 버그가 있을 경우만)

발견된 각 이슈에 대해:
1. 이슈 설명 (뭐가 잘못됐는지)
2. 영향 범위 (어떤 FTA, 어떤 국가, 어떤 금액)
3. 수정 전 코드
4. 수정 후 코드
5. 수정 근거 (법적 기준 출처)

---

## Phase 5: 자체 검수 5회

### 검수 1: Build
```bash
npm run build
```
- Compiled X.Xs, 0 errors → PASS

### 검수 2: FTA 주요 5개 조회 정확성 (5건)
주요 FTA에 대해 origin-destination-HS code 입력 → FTA 감지 + preferential rate 반환 확인:
1. KR→US (KORUS) — HS 8471.30 → FTA 감지 ✓, rate 반환 ✓
2. MX→US (USMCA) — HS 8703.23 → FTA 감지 ✓, rate 반환 ✓
3. JP→EU (EPA) — HS 8471.30 → FTA 감지 ✓, rate 반환 ✓
4. VN→JP (RCEP/CPTPP) — HS 6109.10 → 복수 FTA 감지 ✓, 최저 rate 선택 ✓
5. CN→US (없음) — HS 6109.10 → FTA 없음 ✓, MFN rate ✓

### 검수 3: RoO 판정 + RVC 계산 (5건)
1. USMCA RVC Build-Up 70% → FAIL (75% 미만) ✓
2. USMCA RVC Build-Down 75% → PASS (75% 이상) ✓
3. RCEP CTC 규칙 → heading change 감지 ✓
4. wholly obtained → 원산지 인정 ✓
5. De Minimis 8% → PASS (10% 미만) ✓

### 검수 4: DB 데이터 정합성 (5건)
1. macmap_trade_agreements 1,319건 존재 확인
2. 주요 FTA 5개(USMCA/RCEP/CPTPP/KORUS/EU-JP) 레코드 존재 확인
3. NTLC rates에 preferential rate 존재 확인
4. EU 회원국 → EU 매핑 동작 확인
5. fta-change-monitor Cron health_check_logs 최근 기록 확인

### 검수 5: Regression 55/55
```bash
npx tsx scripts/duty_rate_verification.ts 2>&1 | tail -10
```
- 55/55 PASS, 0 FAIL

---

## Phase 6: 결과 파일 생성

`AREA7_ROO_FTA_RESULT.md` 생성:
```markdown
# Area 7: Rules of Origin & FTA — Deep Review Result
# 2026-03-23 KST

## Phase 1: 읽은 파일
- [파일 목록 + 각 파일 핵심 내용 요약]

## Phase 2: 10개 영역 분석 결과
### 분석 1: FTA 조회 + Preferential Rate
- [결과]
### 분석 2: RoO 판정 로직
- [결과]
...

## Phase 3: 테스트 30건 결과
| TC | 설명 | 예상값 | 실제값 | 결과 |
|----|------|--------|--------|------|
| TC-01 | KR→US KORUS | FTA 감지 | ? | ? |
...

## 버그 발견
- [N건: 상세]

## 수정
- [수정 파일, 수정 전/후]

## 검수 결과
| 검수 | 항목 | 결과 |
|------|------|------|
| 1 | Build | ? errors |
| 2 | FTA 5대 조회 | ?/5 |
| 3 | RoO + RVC | ?/5 |
| 4 | DB 정합성 | ?/5 |
| 5 | Regression | ?/55 |

## INFO items (non-blocking)
- [참고 사항]

## 수정 파일
- [목록]

## 생성 파일
- AREA7_ROO_FTA_RESULT.md
- Work log 시트
```

엑셀 로깅: POTAL_Claude_Code_Work_Log.xlsx 에 시트 추가 (YYMMDDHHMM 형식)

---

## ⚠️ Area 7 끝나면 멈춰라. Area 8로 넘어가지 마라. "Area 7 Complete. 대기 중." 선언 후 대기.
