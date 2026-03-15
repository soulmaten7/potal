# WDC Phase 4 V2 — 로컬 병렬 매칭 명령어
# Claude Code 터미널에 전체 복사-붙여넣기

```
지금 돌아가고 있는 wdc_phase4_bulk_mapping.py (Phase 4 v1)를 교체할 새 스크립트를 만들어라.
기존 프로세스는 아직 멈추지 마라. 새 스크립트를 먼저 만들고 나한테 보고해라.

## 핵심 변경: 로컬 병렬 매칭

기존 방식 (느림):
- JSONL 1줄 읽기 → Supabase API로 매칭 확인 (네트워크) → curl INSERT (네트워크)
- 속도: 500/s, ETA 40일

새 방식 (빠름):
- Supabase에서 매핑 테이블 1회 다운 → 로컬 메모리에서 병렬 매칭 → 결과 모아서 한번에 업로드
- 예상: 수 시간 내 완료

## 스크립트: wdc_phase4_v2_parallel.py

### Step 1: 매핑 테이블 다운로드 (1회)
- Supabase Management API로 product_hs_mappings 전체 SELECT (현재 ~1.34M건 + 기존 8,389건)
- 아니, 이건 너무 많아. 대신 **고유 카테고리→HS6 매핑만** 추출해라:
  ```sql
  SELECT DISTINCT category, hs6 FROM product_hs_mappings WHERE category IS NOT NULL;
  ```
- 이건 수백 건밖에 안 될 거다. JSON 파일로 로컬 저장.
- 추가로 hs_classification_vectors 테이블에서 키워드 매핑도 가져와라:
  ```sql
  SELECT product_name, hs6_code FROM hs_classification_vectors;
  ```
  이것도 3,431건이니까 금방이다.

### Step 2: JSONL 분할
- /Volumes/soulmaten/POTAL/wdc-products/extracted/products_detailed.jsonl (324GB, 1.76B줄)
- 이 파일을 물리적으로 분할하지 마라 (324GB 복사 = 시간 낭비)
- 대신 **byte offset으로 논리적 분할**해라:
  - 파일 전체 크기 확인
  - N등분 (N = CPU 코어 수, 보통 8~10)
  - 각 프로세스가 시작 offset ~ 끝 offset까지만 읽음
  - offset이 줄 중간이면 다음 줄로 이동 (readline으로 보정)

### Step 3: 병렬 매칭 (multiprocessing)
- Python multiprocessing.Pool 사용 (프로세스 수 = CPU 코어 수)
- 각 프로세스:
  1. 카테고리→HS6 dict를 메모리에 로드 (공유 안 함, 각자 복사)
  2. 자기 담당 byte range의 JSONL을 줄 단위로 읽음
  3. 각 줄에서 product_name, category 추출 (json.loads)
  4. Tier 1: category가 dict에 있으면 → 매칭 (O(1))
  5. Tier 2: product_name 키워드 매칭 (간단한 in 체크)
  6. 매칭된 결과를 로컬 CSV/JSONL로 저장 (프로세스별 별도 파일)
     - 저장 위치: /Volumes/soulmaten/POTAL/wdc-phase4-results/matched_part_{N}.csv
  7. 매칭 안 된 건은 버림

### Step 4: 결과 합치기
- /Volumes/soulmaten/POTAL/wdc-phase4-results/ 의 모든 파일 합침
- 중복 제거: (product_name, category, hs6) 기준 DISTINCT
- 결과 파일: /Volumes/soulmaten/POTAL/wdc-phase4-results/final_matched.csv

### Step 5: Supabase 벌크 업로드
- final_matched.csv를 읽으면서 Supabase Management API로 업로드
- **Batch INSERT**: 500건씩 묶어서 1회 curl
  ```sql
  INSERT INTO product_hs_mappings (product_name, category, hs6, confidence, source, metadata, created_at)
  VALUES (...), (...), ...
  ON CONFLICT (product_name) DO NOTHING;
  ```
- ON CONFLICT DO NOTHING으로 기존 데이터 보호
- 업로드도 가능하면 병렬로 (4개 프로세스)

### Step 6: 진행률 로그
- wdc_phase4_v2.log 에 실시간 기록:
  - 각 프로세스별 처리 줄 수, 매칭 수
  - 전체 진행률 (%)
  - 초당 처리 속도
  - ETA

## 중요 사항:
1. 결과 파일은 반드시 외장하드에 저장: /Volumes/soulmaten/POTAL/wdc-phase4-results/
2. 로그 파일: ~/portal/wdc_phase4_v2.log
3. 기존 v1이 이미 넣은 데이터와 충돌하지 않게 ON CONFLICT DO NOTHING 필수
4. 기존 v1 프로세스의 진행 상황(12M 처리, 1.34M 삽입)은 이미 DB에 있으니 다시 넣을 필요 없음
5. 메모리 주의: 각 프로세스가 너무 많은 결과를 메모리에 쌓지 말고, 10만 건마다 디스크에 flush
6. 외장하드 마운트 확인: 스크립트 시작 시 /Volumes/soulmaten/ 존재 여부 체크

## 테스트:
- 먼저 JSONL의 첫 100만 줄로 테스트 실행해서 속도/정확도 확인
- 테스트 결과 보고 후 내가 전체 실행 여부 판단

스크립트를 만들고, 테스트 결과까지 보고해라. 기존 v1 프로세스는 아직 멈추지 마라.
```
