-- ============================================================
-- lookup_duty_rate_v2() 검증 쿼리 모음
-- MIN 임포트 완료 후 실행하여 4단계 폴백 동작 확인
-- 실행 방법: Supabase SQL Editor 또는 Management API
-- ============================================================

-- 1. MIN 임포트 현황 확인 (국가별 행 수)
SELECT reporter_iso2, COUNT(*) as rows,
       MIN(data_year) as min_year, MAX(data_year) as max_year
FROM macmap_min_rates
GROUP BY reporter_iso2
ORDER BY reporter_iso2;

-- 2. 총 행 수
SELECT COUNT(*) as total_min_rows FROM macmap_min_rates;

-- 3. 신규 9개국 확인
SELECT reporter_iso2, COUNT(*) as rows
FROM macmap_min_rates
WHERE reporter_iso2 IN ('SG','TH','TN','TR','TW','UA','UY','US','VN')
GROUP BY reporter_iso2
ORDER BY reporter_iso2;

-- ============================================================
-- 4. lookup_duty_rate_v2() 기능 테스트
-- ============================================================

-- 4a. Stage 1: exact_min (정확 매치)
-- 미국→한국, HS 610910 (면 티셔츠)
SELECT * FROM lookup_duty_rate_v2('US', 'KR', '61091000');

-- 4b. Stage 2: prefix_min (접두사 매치)
-- 미국→한국, 12자리 코드 → 8자리/6자리로 폴백
SELECT * FROM lookup_duty_rate_v2('US', 'KR', '610910001000');

-- 4c. Stage 3: mfn_fallback (NTLC MFN)
-- 파트너가 없는 경우 MFN 폴백
SELECT * FROM lookup_duty_rate_v2('KR', 'XX', '61091000');

-- 4d. Stage 4: wits_hs6 (WITS 라이브 데이터)
-- NTLC에도 없는 국가 조합
SELECT * FROM lookup_duty_rate_v2('ZW', 'XX', '610910');

-- ============================================================
-- 5. 주요 교역 시나리오 테스트
-- ============================================================

-- 미국 → 중국 (면 티셔츠)
SELECT * FROM lookup_duty_rate_v2('US', 'CN', '61091000');

-- 한국 → 일본 (자동차 부품)
SELECT * FROM lookup_duty_rate_v2('KR', 'JP', '87089900');

-- EU → 미국 (와인)
SELECT * FROM lookup_duty_rate_v2('DE', 'US', '22042100');

-- 중국 → 미국 (전자제품)
SELECT * FROM lookup_duty_rate_v2('CN', 'US', '85171400');

-- 일본 → EU (의류)
SELECT * FROM lookup_duty_rate_v2('JP', 'DE', '62034200');

-- 싱가포르 → 미국 (반도체) — 신규 9개국 테스트
SELECT * FROM lookup_duty_rate_v2('SG', 'US', '85423100');

-- 베트남 → 한국 (신발) — 신규 9개국 테스트
SELECT * FROM lookup_duty_rate_v2('VN', 'KR', '64039900');

-- 터키 → EU (섬유) — 신규 9개국 테스트
SELECT * FROM lookup_duty_rate_v2('TR', 'DE', '52081100');

-- ============================================================
-- 6. 폴백 단계별 분포 확인 (샘플 100건)
-- ============================================================
WITH test_cases AS (
    SELECT DISTINCT reporter_iso2 as reporter, partner_iso2 as partner, product_code
    FROM macmap_min_rates
    WHERE reporter_iso2 IN ('US','KR','JP','DE','CN')
    LIMIT 100
)
SELECT
    (lookup_duty_rate_v2(reporter, partner, product_code)).match_type,
    COUNT(*) as cnt
FROM test_cases
GROUP BY 1
ORDER BY cnt DESC;
