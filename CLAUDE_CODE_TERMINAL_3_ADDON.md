# 터미널 3 — 기존 업로드 완료 후 추가 적재
# 지금 터미널 3은 part_01~10 업로드 중.
# 그 작업이 끝난 후에 아래를 이어서 실행해줘.
# (터미널 3의 기존 작업이 끝나면 이 내용을 복사-붙여넣기)

```
part_01~10 업로드가 끝났으면, 이제 터미널 1이 수집한 데이터를 product_hs_mappings에 추가 적재해줘.

## 적재 대상 (DONE 파일 확인)

아래 DONE 파일이 존재하면 해당 CSV를 product_hs_mappings에 \copy:

### 1. EU EBTI Rulings
- DONE 확인: /Volumes/soulmaten/POTAL/regulations/eu_ebti/DONE
- CSV: /Volumes/soulmaten/POTAL/regulations/eu_ebti/ebti_for_db.csv
- 예상: 50K-100K건
- psql: PGPASSWORD='potalqwepoi2@' /opt/homebrew/Cellar/libpq/18.3/bin/psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres
- 큰 파일이면 500K줄씩 chunk 분할 후 \copy (기존 패턴 동일)

### 2. EU ECICS Chemical DB
- DONE 확인: /Volumes/soulmaten/POTAL/regulations/eu_ecics/DONE
- CSV: /Volumes/soulmaten/POTAL/regulations/eu_ecics/ecics_for_db.csv
- 예상: ~70K건
- 한번에 \copy 가능한 크기

### 3. UK ATaR Rulings
- DONE 확인: /Volumes/soulmaten/POTAL/regulations/uk_atar/DONE
- CSV: /Volumes/soulmaten/POTAL/regulations/uk_atar/atar_for_db.csv
- 예상: ~10K건
- 한번에 \copy 가능

### 4. CBP CROSS 142,251건 (이미 추출 완료)
- CSV: /Volumes/soulmaten/POTAL/cbp_cross_combined_mappings.csv
- 이건 DONE 기다릴 필요 없이 바로 적재
- 142,251건

## 적재 순서
1. CBP CROSS 142K (바로)
2. UK ATaR ~10K (DONE 확인)
3. ECICS ~70K (DONE 확인)
4. EBTI 50-100K (DONE 확인)

## 적재 후 마무리
모든 적재 완료 후:
1. 중복 제거:
   DELETE FROM product_hs_mappings a USING product_hs_mappings b
   WHERE a.id > b.id AND a.product_name = b.product_name AND a.hs_code = b.hs_code;
2. unique constraint 복원 (있었으면)
3. 인덱스 재생성
4. ANALYZE product_hs_mappings;
5. 최종 row count 보고:
   SELECT count(*) FROM product_hs_mappings;
6. 로그: /Volumes/soulmaten/POTAL/data_collection.log에 최종 건수 기록

## DONE 파일 감시
- DONE 파일이 없으면 5분마다 체크
- DONE 파일에 "FAILED" 문자열이 있으면 해당 소스 스킵
- 모든 적재 완료 후 touch /Volumes/soulmaten/POTAL/DB_UPLOAD_COMPLETE
```
