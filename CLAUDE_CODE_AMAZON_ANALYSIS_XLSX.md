# Amazon 50건 벤치마크 상세 분석 엑셀 생성

아래를 실행해라.

## 엑셀 생성

Amazon 50건 벤치마크의 전체 결과를 엑셀로 정리해라.
amazon_50_products.json과 amazon_bench_result.json (또는 벤치마크 실행 시 저장한 결과 파일)을 읽어서 분석.

파일 위치: `/Volumes/soulmaten/POTAL/7field_benchmark/` 아래에 amazon 관련 JSON 파일들

### 엑셀 파일: `/Volumes/soulmaten/POTAL/7field_benchmark/Amazon_50_Benchmark_Analysis.xlsx`

**Sheet 1: 요약**
- 전체 건수, 수정 전 정확도, 수정 후 정확도, 실질 정확도
- 버그 6개 요약 테이블 (버그명 / 원인 / 수정 방법 / 영향 건수)
- 20건 클린 vs Amazon 50건 비교
- 카테고리별 정확도 요약

**Sheet 2: 50건 전체 상세**
- 열: #, product_name, material, category, price, origin_country, description(있으면), expected_hs6(수동검증 또는 correct_hs6), actual_hs6, section, chapter, heading, 정답여부(✅/❌), 수정전_결과(있으면), 수정후_결과, 실패지점(section/chapter/heading/subheading/none), 실패원인, decision_path
- 정답=초록, 오답=빨강 색상

**Sheet 3: 버그 6개 상세**
- 각 버그별:
  - 버그 이름
  - 영향받은 상품 목록 (product_name)
  - 수정 전: 어떤 Section/Chapter/Heading으로 갔는지
  - 수정 후: 어떤 Section/Chapter/Heading으로 바뀌었는지
  - 코드 변경 내용 요약
  - 근본 원인 분석

**Sheet 4: 카테고리별 분석**
- 10개 검색 카테고리 × 정확도
- 카테고리별 material 파싱 성공률
- 어떤 카테고리가 강하고 어떤 카테고리가 약한지

**Sheet 5: 나머지 2건 상세**
- 48/50에서 빠진 2건
- 왜 틀렸는지 상세 분석
- "defensible"이라고 판단한 근거
- HS 규칙상 어떤 해석이 가능한지

**Sheet 6: 수정된 코드 변경 목록**
- 변경된 파일 목록
- 각 파일에서 뭐가 바뀌었는지 (함수명, 추가된 키워드, 변경된 로직)
- git diff 요약

엑셀 생성 후 복사:
```bash
cp /Volumes/soulmaten/POTAL/7field_benchmark/Amazon_50_Benchmark_Analysis.xlsx /Volumes/soulmaten/POTAL/portal/Amazon_50_Benchmark_Analysis.xlsx 2>/dev/null || true
```

전체를 한번에 실행해라. 중간에 멈추지 마라.
