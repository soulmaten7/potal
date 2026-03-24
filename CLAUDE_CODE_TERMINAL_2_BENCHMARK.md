# 터미널 2 — DB 적재 (소형) + 벤치마크 실행 + 분석
# 터미널 1이 수집하는 동안 DONE 파일을 감시하다가 자동으로 진행
# 복사-붙여넣기해서 실행

```
터미널 1이 데이터를 수집하고 있어. 수집 완료되면 각 폴더에 DONE 파일이 생겨.
너는 DONE 파일을 감시하면서 아래 3단계를 순차적으로 진행해줘.

## 1단계: 소형 데이터 → DB 적재 (DONE 파일 감지 시 바로)

터미널 1에서 아래 DONE 파일이 생기면 즉시 DB에 적재해:

**BIS CCL → export_controls 테이블**
- 감시: /Volumes/soulmaten/POTAL/regulations/us_bis/DONE
- 파일: /Volumes/soulmaten/POTAL/regulations/us_bis/eccn_list.csv
- Supabase에 적재 (psql \copy 또는 Management API)
- psql 접속: PGPASSWORD='potalqwepoi2@' /opt/homebrew/Cellar/libpq/18.3/bin/psql -h db.zyurflkhiregundhisky.supabase.co -p 5432 -U postgres -d postgres
- export_controls 테이블이 없으면 생성 (eccn, description, control_reason, license_requirement 등)
- ~2,000건이라 1분이면 끝남

**UN DG → restricted_items 테이블**
- 감시: /Volumes/soulmaten/POTAL/regulations/un_dg/DONE
- 파일: /Volumes/soulmaten/POTAL/regulations/un_dg/un_dg_list.csv
- restricted_items 테이블이 없으면 생성 (un_number, name, hazard_class, packing_group 등)
- ~3,000건이라 1분이면 끝남

이 두 개는 product_hs_mappings가 아니라 별도 테이블이니까 터미널 3과 충돌 없음.
DONE 파일 없으면 30초마다 체크하면서 기다려.

## 2단계: 벤치마크 실행 (수집된 데이터로 바로)

각 벤치마크 DONE 파일이 생기면 순서대로 실행:

### 2-1. CBP 100건 벤치마크 (이미 준비됨)
- 파일: /Volumes/soulmaten/POTAL/benchmark_test_data.json
- 이건 DONE 기다릴 필요 없이 바로 실행 가능
- 방법:
  1. JSON에서 100건 로드
  2. 각 item의 item_name → POTAL /api/v1/classify API 호출 (https://www.potal.app/api/v1/classify)
  3. API 응답 hs_code vs benchmark의 hts_code_answer 비교
  4. 6자리 일치, 10자리 일치 각각 계산
  5. 결과 저장: /Volumes/soulmaten/POTAL/benchmark/results/cbp_100_results.json
     - 전체 정확도 (6-digit, 10-digit)
     - 틀린 문제 목록 (item_name, predicted, actual, chapter, reason_guess)
  6. API 인증: X-API-Key 헤더 사용 (Supabase에서 테스트용 키 조회 또는 공개 엔드포인트 확인)
  7. 만약 API 인증이 필요하면 Supabase에서 api_keys 테이블 조회해서 키 사용

### 2-2. CBLE 기출 벤치마크
- 감시: /Volumes/soulmaten/POTAL/benchmark/cble/DONE
- 파일: /Volumes/soulmaten/POTAL/benchmark/cble/hs_questions.json
- 방법:
  1. HS 분류 문제에서 product_name 추출
  2. POTAL /classify API 호출
  3. API 응답 vs 기출 정답 비교
  4. 결과: /Volumes/soulmaten/POTAL/benchmark/results/cble_results.json
  5. 추가: HS 분류 외 문제(관세평가, FTA, 원산지 등)도 해당 POTAL API로 테스트 가능한지 확인
     - 관세평가 문제 → /calculate API
     - FTA 문제 → /fta API
     - 원산지 문제 → /origin API

### 2-3. ATLAS 18,731건 벤치마크
- 감시: /Volumes/soulmaten/POTAL/benchmark/atlas/DONE
- 만약 DONE에 "FAILED" 내용이 있으면 스킵하고 로그에 기록
- 방법: 위와 동일 패턴 (product_description → /classify → 비교)
- 결과: /Volumes/soulmaten/POTAL/benchmark/results/atlas_results.json
- 18K건이니까 rate limit 주의 (1초에 1건, 또는 batch API 사용)

### 2-4. HSCodeComp 632건
- 감시: /Volumes/soulmaten/POTAL/benchmark/hscodecomp/DONE
- 방법: 동일 패턴
- 결과: /Volumes/soulmaten/POTAL/benchmark/results/hscodecomp_results.json

### 2-5. 한국 관세사 기출
- 감시: /Volumes/soulmaten/POTAL/benchmark/korea_customs/DONE
- 파일: hs_questions.json
- 방법: 동일 패턴
- 결과: /Volumes/soulmaten/POTAL/benchmark/results/korea_results.json

### 2-6. 일본 通関士 기출
- 감시: /Volumes/soulmaten/POTAL/benchmark/japan_customs/DONE
- 파일: hs_questions.json
- 방법: 동일 패턴
- 결과: /Volumes/soulmaten/POTAL/benchmark/results/japan_results.json

## 3단계: 틀린 문제 종합 분석

모든 벤치마크 완료 후 (또는 가용한 벤치마크가 다 끝나면):

### 3-1. 종합 리포트 생성
/Volumes/soulmaten/POTAL/benchmark/results/BENCHMARK_ANALYSIS_REPORT.md 생성:

1. **점수 요약표**
   | 벤치마크 | 6-digit 정확도 | 10-digit 정확도 | 총 문제 | 맞춘 수 | 틀린 수 |

2. **틀린 문제 원인 분류** — 각 틀린 문제를 아래 원인으로 분류:
   - `NO_MAPPING`: product_hs_mappings에 해당 상품/카테고리 매핑 없음
   - `WRONG_MAPPING`: 매핑은 있지만 잘못된 HS 코드 반환
   - `PRICE_BREAK_MISSING`: 가격 분기 규칙 미적용
   - `AMBIGUOUS_PRODUCT`: 상품 설명이 모호해서 분류 실패
   - `INDUSTRIAL_SPECIALTY`: 산업용/특수 상품 (화학, 기계부품 등)
   - `COUNTRY_SPECIFIC`: 국가별 HS 확장 규칙 차이
   - `OTHER`: 기타

3. **142개 기능별 약점 매핑**
   - 틀린 문제가 어떤 POTAL 기능(F001~F143)의 약점인지 매핑
   - 기능별 개선 제안 (데이터 추가? 코드 수정? 새 규칙?)

4. **경쟁사 비교** (CBP 100건 기준)
   - POTAL: XX%
   - Tarifflo: 89%
   - Avalara: 80%
   - Zonos: 44%
   - WCO BACUDA: 13%

5. **즉시 수정 가능한 것 목록**
   - NO_MAPPING → 어떤 데이터를 추가하면 맞출 수 있는지
   - WRONG_MAPPING → DB 수정 필요한 항목
   - PRICE_BREAK_MISSING → 추가해야 할 가격분기 규칙

### 3-2. 즉시 수정 실행
- 분석 결과 중 코드/데이터로 즉시 수정 가능한 것은 바로 수정
- 예: product_hs_mappings에 매핑 추가, 가격분기 규칙 추가 등
- 수정 후 해당 문제 재테스트 → 점수 변화 기록

### 3-3. 마케팅용 요약
/Volumes/soulmaten/POTAL/benchmark/results/MARKETING_SUMMARY.md 생성:
- 한 줄 요약: "POTAL scored XX% on CBP benchmark (vs Avalara 80%, Zonos 44%)"
- 강점 3개, 약점 3개 (투명 공개용)
- 채널별 포스트 소재 추천

### 공통 규칙
- DONE 파일 감시: 30초 간격으로 체크
- API 호출 rate limit: 1초에 1건 (Free 200건/월 제한 주의, 필요시 직접 DB 조회로 우회)
- 에러 시 3회 retry 후 스킵
- 전체 진행 로그: /Volumes/soulmaten/POTAL/benchmark/benchmark.log
- 벤치마크 완료 후 은태님에게 보고할 수 있도록 결과 정리
```
