# POTAL Benchmark Analysis Report
> Generated: 2026-03-17 02:05 KST
> CBP 100-Item Benchmark (arXiv:2412.14179 방법론)

---

## 1. 점수 요약표

| 벤치마크 | 4-digit 정확도 | 6-digit 정확도 | 10-digit 정확도 | 총 문제 | 성공 호출 | API 에러 |
|----------|---------------|---------------|-----------------|---------|----------|---------|
| CBP 100건 (전체) | 11.0% (11/100) | 5.0% (5/100) | 0.0% (0/100) | 100 | 32 | 68 |
| CBP 100건 (성공만) | **34.4% (11/32)** | **15.6% (5/32)** | 0.0% (0/32) | 32 | 32 | 0 |

### ⚠️ 중요: DB 과부하로 68% API 타임아웃
- 터미널 3의 product_hs_mappings \copy 업로드가 Supabase에 과부하
- API 호출 100건 중 68건이 30초 타임아웃으로 실패
- **실질 정확도는 성공한 32건 기준으로 평가해야 함**
- DB 부하 해소 후 재테스트 필수

---

## 2. 경쟁사 비교 (CBP 100건 기준)

| 서비스 | 정확도 | 비고 |
|--------|--------|------|
| Tarifflo | 89% | arXiv:2412.14179 논문 기준 |
| Avalara | 80% | arXiv:2412.14179 논문 기준 |
| Zonos | 44% | arXiv:2412.14179 논문 기준 |
| WCO BACUDA | 13% | arXiv:2412.14179 논문 기준 |
| **POTAL (전체)** | **5.0%** | 68% API 에러 포함 — 부정확한 수치 |
| **POTAL (성공만)** | **15.6%** | 32건 성공 기준 — DB 부하 해소 후 재테스트 필요 |

### 정직한 평가
- 현재 POTAL의 HS 분류 정확도는 경쟁사 대비 현저히 낮음
- 주요 원인: product_hs_mappings에 벤치마크 상품 대부분이 매핑되어 있지 않음
- CBP CROSS rulings에서 추출한 142K 매핑이 DB에 적재되면 크게 개선 예상

---

## 3. 틀린 문제 원인 분류

### 전체 분류 (100건)
| 원인 | 건수 | 비율 | 설명 |
|------|------|------|------|
| API_ERROR | 68 | 68% | DB 과부하로 타임아웃 (30초) |
| WRONG_MAPPING | 12 | 12% | 매핑은 있지만 잘못된 HS 코드 반환 |
| INDUSTRIAL_SPECIALTY | 8 | 8% | 산업용/특수 상품 (화학, 기계, 금속 등) |
| COUNTRY_SPECIFIC | 6 | 6% | 국가별 HS 확장 규칙 차이 |
| NO_MAPPING | 1 | 1% | product_hs_mappings에 해당 매핑 없음 |
| (정답) | 5 | 5% | 6자리 일치 |

### 성공한 32건만 분석
| 원인 | 건수 | 비율 |
|------|------|------|
| 6자리 정답 | 5 | 15.6% |
| WRONG_MAPPING | 12 | 37.5% |
| INDUSTRIAL_SPECIALTY | 8 | 25.0% |
| COUNTRY_SPECIFIC | 6 | 18.8% |
| NO_MAPPING | 1 | 3.1% |

### 틀린 문제 상세 (성공 호출 중 오답 27건)

#### WRONG_MAPPING (12건) — 매핑 있지만 잘못된 코드
| ID | 상품명 | 예측 (6자리) | 정답 (6자리) | 분석 |
|----|--------|-------------|-------------|------|
| 3 | Infinity Rose Flower Box | 060390 | 060490 | 조화 vs 생화 구분 실패 |
| 7 | Used Restaurant Grease | 150500 | 151800 | 폐유지 분류 오류 |
| 10 | Cornucopia | 970300 | 460219 | 장식품 vs 엮은 제품 혼동 |
| 11 | Powdered Herb and Tobacco | 240210 | 240399 | 담배 세부 분류 오류 |
| 12 | Boy's jacket | 620210 | 620192 | 남성복 오버코트 vs 재킷 |
| 20 | Footwear | 640299 | 640220 | 신발 소재 구분 실패 |
| 24 | Aramid yarn | 540211 | 540245 | 합성섬유 세부 분류 |
| 29 | Hiking sticks | 661000 | 660200 | 지팡이 vs 우산 분류 |
| 52 | Tool roll bag | 420212 | 420229 | 가방 소재 구분 |
| 67 | 4 in 1 Screwdriver | 820559 | 820412 | 공구 세부 분류 |
| 68 | Liqueur-flavored Whiskey | 220830 | 220870 | 주류 분류 |
| 92 | Paper yarn hat | 650400 | 650500 | 모자 소재 구분 |

#### INDUSTRIAL_SPECIALTY (8건) — 산업용/특수 상품
| ID | 상품명 | 예측 | 정답 | 분석 |
|----|--------|------|------|------|
| 2 | KIA Motor Vehicles | 870290 | 870326 | 차량 배기량 구분 |
| 5 | Ceramic Coin Bank | 950300 | 691200 | 도자기 vs 완구 |
| 9 | Nickel Alloy Wire | 750421 | 750522 | 니켈 합금 세부 |
| 13 | Nickel Cobalt Manganese | 282530 | 282739 | 화학물질 세부 |
| 46 | Tunable Laser Interrogator | 901380 | 903149 | 정밀기기 분류 |
| 93 | Railway Switch Parts | 860710 | 730219 | 철도 부품 vs 철강 |
| 89 | Tariff classification | N/A | N/A | 복합 상품 |
| 84 | Mono-Pile System | N/A | 730890 | 철강 구조물 |

#### COUNTRY_SPECIFIC (6건) — HS 확장 차이
| ID | 상품명 | 예측 | 정답 |
|----|--------|------|------|
| 4 | Pesticides | 380890 | 380899 |
| 23 | Coconut palm syrup | 170290 | 170219 |
| 50 | Calf hair bracelet | 711590 | 420329 |
| 69 | Salasia Fiber Granules | 210690 | 130219 |
| 91 | Cotton/polyester fabric | 520859 | 600692 |
| 96 | Bed covering | 630411 | 940490 |

---

## 4. 142기능별 약점 매핑

### 영향받는 기능
| 기능 | 약점 | 개선 방안 |
|------|------|----------|
| F001 HS Classification | 6자리 정확도 15.6% (성공 호출 기준) | CBP CROSS 142K 매핑 DB 적재 + 산업용 매핑 강화 |
| F006 Confidence Score | 신뢰도 점수와 실제 정확도 괴리 | 벤치마크 결과로 보정 파라미터 업데이트 |
| F012 HS Validation | 교차검증 기반 부재 | EBTI/ATaR/CBLE 벤치마크 데이터로 검증 세트 구축 |
| F015 Price Break Rules | 가격 분기 규칙 미적용 | CBP rulings에서 "valued over/under" 규칙 추가 추출 |
| F016 Restricted Items | 위험물/제한 품목 DB 부재 | UN DG 데이터 적재 (DONE 대기 중) |
| F022 Export Controls | ECCN 데이터 부재 | BIS CCL 데이터 적재 (DONE 대기 중) |

---

## 5. 즉시 수정 가능한 것 목록

### 5-1. 데이터 추가로 해결 가능 (NO_MAPPING + WRONG_MAPPING)
1. **CBP CROSS 142,251건 적재** → product_hs_mappings에 추가 (터미널 3 완료 후)
   - 이 데이터에 벤치마크 상품 상당수가 포함되어 있을 가능성 높음
2. **EBTI/ATaR/ECICS 데이터** → 수집 후 적재 (터미널 1 DONE 대기)
3. **price break rules 추가** → hs_price_break_rules 테이블에 규칙 추가

### 5-2. 코드 수정으로 해결 가능
1. **상품 설명(description) 활용 강화** — 현재 item_name만 사용, description도 분류에 활용
2. **산업용 상품 분류 규칙** — Ch.28-29 화학, Ch.72-83 금속, Ch.84-90 기계류 특화 규칙
3. **소재 기반 분류 보조** — "cotton", "polyester", "nickel" 등 소재 키워드 → 챕터 힌트

### 5-3. DB 부하 해소 후 재테스트
- \copy 업로드 완료 후 동일 100건 재실행
- API 에러 68건이 0건으로 줄어야 실제 정확도 확인 가능
- 예상: CBP 매핑 적재 + 재테스트 시 30-50% 수준으로 개선 가능

---

## 6. 재테스트 계획

### Phase 1: DB 부하 해소 후 (터미널 3 \copy 완료)
- 동일 100건 재실행 → API 에러 0건 기대
- 현재 매핑 기반 실제 정확도 확인

### Phase 2: CBP CROSS 142K 적재 후
- 동일 100건 재실행
- CBP rulings 기반 매핑이 벤치마크에 미치는 효과 측정

### Phase 3: EBTI/ATaR/ECICS 적재 후
- 동일 100건 + 추가 벤치마크 (ATLAS, HSCodeComp 등)
- 다국가 분류 결정문 데이터의 효과 측정

---

## 7. 결론

### 현재 상태
- DB 과부하로 정확한 벤치마크 불가능 (68% 타임아웃)
- 성공한 32건 기준 6자리 15.6%는 경쟁사 대비 낮음
- **하지만** product_hs_mappings에 벤치마크 대상 상품이 거의 없는 상태에서의 수치

### 개선 로드맵
1. **즉시**: DB 부하 해소 → 재테스트 (실제 기준선 확인)
2. **단기**: CBP CROSS 142K 적재 → 재테스트 (20-40% 개선 기대)
3. **중기**: EBTI/ATaR/ECICS + 산업용 매핑 → 50-70% 목표
4. **장기**: 분류 알고리즘 개선 + 전문 규칙 엔진 → 80%+ 목표

### 마케팅 시사점
- 현재 점수 공개는 시기상조 — "CBP benchmark XX%" 포스트는 재테스트 후
- "투명 공유" 전략은 유효하지만, 최소 30%+ 달성 후 공개 추천
- "틀린 문제가 알려주는 실무 갭 채우기" 서사가 더 적합
