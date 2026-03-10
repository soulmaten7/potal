-- ============================================================
-- 017: Trade Remedy FK 수정
-- 문제: products/duties의 case_id(TEXT)가 cases의 id(INT)와 불일치
-- 해결: cases.case_id(TEXT)에 UNIQUE 추가 → FK 연결
-- Supabase 대시보드 SQL 에디터에서 실행
-- ============================================================

-- Step 1: cases 테이블의 case_id 컬럼에 UNIQUE 제약 추가
ALTER TABLE trade_remedy_cases
  ADD CONSTRAINT trade_remedy_cases_case_id_unique UNIQUE(case_id);

-- Step 2: products의 case_id → cases.case_id FK 추가
-- 먼저 고아 레코드 확인
-- SELECT count(*) FROM trade_remedy_products p
-- WHERE NOT EXISTS (SELECT 1 FROM trade_remedy_cases c WHERE c.case_id = p.case_id);

-- 고아 레코드가 없으면 FK 추가
ALTER TABLE trade_remedy_products
  ADD CONSTRAINT fk_products_case_id
  FOREIGN KEY (case_id) REFERENCES trade_remedy_cases(case_id);

-- Step 3: duties의 case_id → cases.case_id FK 추가
ALTER TABLE trade_remedy_duties
  ADD CONSTRAINT fk_duties_case_id
  FOREIGN KEY (case_id) REFERENCES trade_remedy_cases(case_id);

-- Step 4: 인덱스 추가 (JOIN 성능 개선)
CREATE INDEX IF NOT EXISTS idx_trade_remedy_products_case_id ON trade_remedy_products(case_id);
CREATE INDEX IF NOT EXISTS idx_trade_remedy_duties_case_id ON trade_remedy_duties(case_id);
