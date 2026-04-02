# Claude Code 명령어 (터미널 2): MacMap DB 전체 분석

> **날짜**: 2026-03-21 KST
> **목표**: macmap 관련 테이블 3개의 전체 구조, 커버리지, 데이터 품질을 분석하여 "세율 조회를 macmap만으로 충분히 할 수 있는지" 판단
> **배경**: gov_tariff_schedules에서 세율 조회를 분리하고 macmap에서 직접 조회하기로 결정. macmap 데이터가 충분한지 먼저 확인 필요.

---

## ⚠️ 엑셀 로깅 필수 (CLAUDE.md 절대 규칙 11번)

모든 작업을 `POTAL_Claude_Code_Work_Log.xlsx`에 기록한다.
- **시트 이름**: `YYMMDDHHMM`
- **열**: A:순번 | B:시간 | C:구분 | D:상세내용 | E:파일경로 | F:상태
- **디테일**: DB 쿼리는 쿼리문 + 행수 + 샘플 5건 이상
- **시트 마감**: `=== 작업 종료 ===`

---

## 분석 대상 테이블 3개

| 테이블 | 행 수 (CLAUDE.md 기준) | 용도 |
|--------|----------------------|------|
| `macmap_ntlc_rates` | 537,894 | MFN 세율 (009 타입) |
| `macmap_min_rates` | ~105M | 최저 세율 (53개국) |
| `macmap_agr_rates` | ~129M | 합의 세율 (53개국) |

---

## Phase 1: macmap_ntlc_rates 구조 분석

```sql
-- 1-1. 컬럼 구조
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'macmap_ntlc_rates' ORDER BY ordinal_position;

-- 1-2. 전체 행 수
SELECT count(*) FROM macmap_ntlc_rates;

-- 1-3. reporter (국가) 코드 형식 확인 — 2자리? 3자리? 국가명?
SELECT DISTINCT reporter FROM macmap_ntlc_rates ORDER BY reporter LIMIT 30;

-- 1-4. reporter 수 + 각 국가별 행 수 TOP 20
SELECT reporter, count(*) as cnt FROM macmap_ntlc_rates GROUP BY reporter ORDER BY cnt DESC LIMIT 20;

-- 1-5. 7개 주요 국가 존재 여부 (gov_tariff_schedules 국가들)
--      gov_tariff_schedules: US, EU, GB, KR, JP, AU, CA
--      macmap에서 어떤 코드로 저장되어 있는지?
SELECT reporter, count(*) FROM macmap_ntlc_rates
WHERE reporter IN ('US','USA','840','EU','EUN','EU28','EU27','GB','GBR','826','KR','KOR','410','JP','JPN','392','AU','AUS','036','CA','CAN','124')
GROUP BY reporter ORDER BY reporter;

-- 1-6. hs_code 형식 확인 — 6자리? 10자리? 점 포함?
SELECT hs_code FROM macmap_ntlc_rates LIMIT 20;
SELECT length(hs_code), count(*) FROM macmap_ntlc_rates GROUP BY length(hs_code) ORDER BY count(*) DESC;

-- 1-7. 세율 컬럼 확인 — rate_pct? ad_valorem? duty_rate?
--      (컬럼명을 1-1에서 확인 후 적절한 컬럼으로 대체)
-- 예시:
SELECT * FROM macmap_ntlc_rates LIMIT 5;

-- 1-8. tariff_type 컬럼이 있으면 — 어떤 값들이 있는지
-- SELECT DISTINCT tariff_type FROM macmap_ntlc_rates;

-- 1-9. NULL 세율 비율
-- SELECT count(*), count(rate_pct), count(*) - count(rate_pct) as null_count
-- FROM macmap_ntlc_rates;
```

---

## Phase 2: macmap_min_rates 구조 분석

```sql
-- 2-1. 컬럼 구조
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'macmap_min_rates' ORDER BY ordinal_position;

-- 2-2. 행 수 (pg_class 근사값 — 정확한 count는 ~105M이라 너무 오래 걸림)
SELECT relname, reltuples::bigint as estimated_rows
FROM pg_class WHERE relname = 'macmap_min_rates';

-- 2-3. reporter 코드 형식 + 주요 국가 존재 여부
SELECT DISTINCT reporter FROM macmap_min_rates LIMIT 30;

-- 2-4. 7개 국가 존재 여부
SELECT reporter, count(*) FROM macmap_min_rates
WHERE reporter IN ('US','USA','840','EU','EUN','EU28','EU27','GB','GBR','826','KR','KOR','410','JP','JPN','392','AU','AUS','036','CA','CAN','124')
GROUP BY reporter ORDER BY reporter;

-- 2-5. hs_code 형식
SELECT hs_code FROM macmap_min_rates LIMIT 10;

-- 2-6. 샘플 데이터 5건
SELECT * FROM macmap_min_rates LIMIT 5;
```

---

## Phase 3: macmap_agr_rates 구조 분석

```sql
-- 3-1. 컬럼 구조
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'macmap_agr_rates' ORDER BY ordinal_position;

-- 3-2. 행 수 (pg_class 근사값)
SELECT relname, reltuples::bigint as estimated_rows
FROM pg_class WHERE relname = 'macmap_agr_rates';

-- 3-3. reporter + 7개 국가 존재 여부
SELECT DISTINCT reporter FROM macmap_agr_rates LIMIT 30;
SELECT reporter, count(*) FROM macmap_agr_rates
WHERE reporter IN ('US','USA','840','EU','EUN','EU28','EU27','GB','GBR','826','KR','KOR','410','JP','JPN','392','AU','AUS','036','CA','CAN','124')
GROUP BY reporter ORDER BY reporter;

-- 3-4. 샘플 데이터 5건
SELECT * FROM macmap_agr_rates LIMIT 5;
```

---

## Phase 4: 7개국 × 테스트 HS code 교차 검증

Step 4에서 확장하는 7개국에 대해, macmap에서 세율을 정상 조회할 수 있는지 실제 HS code로 테스트.

```sql
-- 테스트 HS codes (v3 파이프라인 테스트 상품 5개):
-- 610910 (Cotton T-Shirt)
-- 732310 (Steel Bottle)
-- 910191 (Watch Strap)
-- 030617 (Shrimp)
-- 691200 (Ceramic)

-- 각 국가별로 macmap_ntlc_rates에서 세율 조회:

-- US
SELECT hs_code, reporter, rate_pct FROM macmap_ntlc_rates
WHERE reporter IN ('US','USA','840') AND hs_code IN ('610910','732310','910191','030617','691200');

-- EU
SELECT hs_code, reporter, rate_pct FROM macmap_ntlc_rates
WHERE reporter IN ('EU','EUN','EU28','EU27') AND hs_code IN ('610910','732310','910191','030617','691200');

-- GB
SELECT hs_code, reporter, rate_pct FROM macmap_ntlc_rates
WHERE reporter IN ('GB','GBR','826') AND hs_code IN ('610910','732310','910191','030617','691200');

-- KR
SELECT hs_code, reporter, rate_pct FROM macmap_ntlc_rates
WHERE reporter IN ('KR','KOR','410') AND hs_code IN ('610910','732310','910191','030617','691200');

-- JP
SELECT hs_code, reporter, rate_pct FROM macmap_ntlc_rates
WHERE reporter IN ('JP','JPN','392') AND hs_code IN ('610910','732310','910191','030617','691200');

-- AU
SELECT hs_code, reporter, rate_pct FROM macmap_ntlc_rates
WHERE reporter IN ('AU','AUS','036') AND hs_code IN ('610910','732310','910191','030617','691200');

-- CA
SELECT hs_code, reporter, rate_pct FROM macmap_ntlc_rates
WHERE reporter IN ('CA','CAN','124') AND hs_code IN ('610910','732310','910191','030617','691200');
```

**⚠️ 위 쿼리에서 `rate_pct`는 Phase 1에서 확인한 실제 컬럼명으로 교체할 것.**

---

## Phase 5: 240개국 커버리지 분석

macmap이 7개국뿐 아니라 나머지 233개국 세율도 가지고 있으면, Step 4에서 Country Router가 null인 경우에도 세율 조회가 가능함.

```sql
-- macmap_ntlc_rates 국가 수
SELECT count(DISTINCT reporter) FROM macmap_ntlc_rates;

-- macmap_min_rates 국가 수
SELECT count(DISTINCT reporter) FROM macmap_min_rates;

-- macmap_agr_rates 국가 수
SELECT count(DISTINCT reporter) FROM macmap_agr_rates;

-- POTAL countries 테이블(240개국)과 macmap 국가 교차 확인
-- (countries 테이블의 국가 코드 형식도 확인 필요)
SELECT column_name FROM information_schema.columns WHERE table_name = 'countries' ORDER BY ordinal_position;
SELECT * FROM countries LIMIT 5;
```

---

## Phase 6: gov_tariff_schedules vs macmap 비교

방금 EU/GB에 넣은 세율(MacMap JOIN)과 macmap 원본 데이터가 일치하는지 검증.

```sql
-- gov_tariff_schedules의 EU 세율 vs macmap_ntlc_rates의 EU 세율
-- (HS6 기준으로 매칭)
SELECT
  g.hs_code as gov_hs_code,
  g.duty_rate_pct as gov_rate,
  m.hs_code as macmap_hs_code,
  m.rate_pct as macmap_rate,
  CASE WHEN g.duty_rate_pct = m.rate_pct THEN 'MATCH' ELSE 'DIFF' END as status
FROM gov_tariff_schedules g
LEFT JOIN macmap_ntlc_rates m
  ON substring(g.hs_code, 1, 6) = m.hs_code
  AND m.reporter = 'EUN'  -- 또는 Phase 1에서 확인한 EU reporter 코드
WHERE g.country = 'EU'
LIMIT 20;
```

---

## Phase 7: 최종 결론 + 보고서

모든 분석 결과를 바탕으로 아래 질문에 답변:

1. **macmap만으로 세율 조회가 충분한가?**
   - 7개국 + 233개국 모두 커버되는가?
   - HS6 기준 매칭이 되는가? (macmap은 6자리인데 최종 코드는 10자리일 수 있음)
   - NULL 세율 비율이 얼마인가?

2. **macmap의 국가 코드 형식은?**
   - 2자리 (US) vs 3자리 (USA) vs 숫자 (840)?
   - duty-rate-lookup.ts에서 국가 코드 변환이 필요한가?

3. **어떤 macmap 테이블을 우선 사용할 것인가?**
   - ntlc (MFN) → min (최저) → agr (합의) 순서? 또는 다른 우선순위?

4. **gov_tariff_schedules에 넣은 EU/GB 세율은 어떻게 할 것인가?**
   - 삭제? 유지? macmap과 중복되면 참고용으로만?

### 엑셀 최종 요약 테이블:

| 항목 | macmap_ntlc | macmap_min | macmap_agr |
|------|------------|------------|------------|
| 행 수 | | | |
| 국가 수 | | | |
| HS code 형식 | | | |
| 세율 컬럼명 | | | |
| 7개국 커버리지 | | | |
| 240개국 커버리지 | | | |
| NULL 세율 비율 | | | |

시트 마감: `=== 작업 종료 === | 소요시간 | 테이블 3개 분석 완료 | 7개국 커버리지 결과 | 240개국 커버리지 결과`
