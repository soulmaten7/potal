# CBP Benchmark Test — POTAL HS Classification 정확도 벤치마크
# 2026-03-16 15:00 KST
# 참조 논문: arXiv:2412.14179 "Benchmarking Harmonized Tariff Schedule Classification Models"

---

## 배경

2024년 12월 arXiv 논문에서 CBP(미국 세관) 실제 판정 103건으로 주요 HS 분류 도구를 벤치마크함.

**기존 결과:**
| 도구 | 10자리 정확도 |
|------|------------|
| Tarifflo | 89.22% (91/103) |
| Avalara (수동+AI) | 80.00% (82/103) |
| Zonos | 44.12% (45/103) |
| WCO BACUDA | 12.75% (6자리만) |

**POTAL 목표**: 같은 방법론으로 테스트 → 객관적 정확도 수치 확보 → 마케팅에 사용

---

## 방법론 (논문과 동일하게 재현)

### 데이터 수집
1. CBP CROSS (Customs Rulings Online Search System)에서 rulings 수집
   - URL: https://rulings.cbp.gov/
   - 우리가 이미 220,114건 수집해둠 (규정 데이터 Phase 1, 외장하드 /Volumes/soulmaten/POTAL/regulations/)

2. 100건 무작위 선별 (논문은 215,474건 중 100건 → 103 아이템)
   - 다양한 HS 코드 챕터에서 골고루 나오도록
   - 각 ruling에서 추출: **상품명 (item name)** + **상세 설명 (description)** + **정답 HTS 10자리 코드**

### 테스트 실행
3. POTAL API `/api/v1/classify` 엔드포인트에 상품명+설명 입력
4. 반환된 HS Code vs 정답 HS Code 비교
   - **Exact match** (10자리 완전 일치) = 정답
   - **6자리 일치** = 부분 정답 (별도 집계)
   - **Chapter (2자리) 일치** = 별도 집계

### 결과 기록
5. 결과를 엑셀로 정리: 상품명, 설명, 정답 코드, POTAL 코드, 일치 여부, 신뢰도 점수

---

## 실행 스크립트

```python
# cbp_benchmark_test.py
# CBP CROSS rulings 기반 POTAL HS 분류 벤치마크

import json
import csv
import random
import requests
from pathlib import Path

# === 1단계: CBP rulings에서 테스트 데이터 추출 ===

# 이미 수집된 CBP CROSS rulings 사용
# 경로: /Volumes/soulmaten/POTAL/regulations/us/cbp-cross/
# 또는 DB에서 직접 쿼리

# 방법 A: 외장하드에서 rulings 로드
def load_rulings_from_disk():
    """외장하드에 저장된 CBP rulings JSON/HTML에서 추출"""
    rulings_dir = Path("/Volumes/soulmaten/POTAL/regulations/us/cbp-cross/")
    # TODO: 실제 파일 형식에 맞게 조정
    pass

# 방법 B: CBP CROSS API에서 직접 가져오기
def fetch_rulings_from_cbp(n=100):
    """CBP CROSS에서 무작위 rulings 가져오기"""
    # https://rulings.cbp.gov/api/search?
    pass

# 방법 C: 수동으로 100건 준비 (가장 확실)
# 논문처럼 GPT-4o로 ruling 텍스트에서 item name + description + HTS code 추출

# === 2단계: POTAL API로 분류 테스트 ===

POTAL_API = "https://potal.app/api/v1/classify"
# 또는 로컬: "http://localhost:3000/api/v1/classify"

def classify_product(name, description, api_key):
    """POTAL API로 HS Code 분류"""
    response = requests.post(POTAL_API,
        headers={"Authorization": f"Bearer {api_key}"},
        json={
            "product": f"{name}. {description}",
            "destination": "US"  # US HTS 10자리 필요
        }
    )
    return response.json()

# === 3단계: 정확도 계산 ===

def evaluate_accuracy(results):
    """10자리/6자리/2자리 정확도 계산"""
    exact_10 = sum(1 for r in results if r['predicted'] == r['actual'])
    match_6 = sum(1 for r in results if r['predicted'][:6] == r['actual'][:6])
    match_2 = sum(1 for r in results if r['predicted'][:2] == r['actual'][:2])

    total = len(results)
    return {
        "total": total,
        "exact_10digit": exact_10,
        "accuracy_10digit": f"{exact_10/total*100:.1f}%",
        "match_6digit": match_6,
        "accuracy_6digit": f"{match_6/total*100:.1f}%",
        "match_chapter": match_2,
        "accuracy_chapter": f"{match_2/total*100:.1f}%",
    }

# === 4단계: 결과 엑셀 저장 ===
# 엑셀로 저장: analysis/POTAL_CBP_Benchmark_Results.xlsx
```

---

## 실행 순서

### Step 1: 테스트 데이터 준비
```bash
# 외장하드에서 CBP rulings 확인
ls /Volumes/soulmaten/POTAL/regulations/us/cbp-cross/ | head -20

# 파일 형식 확인
head -50 /Volumes/soulmaten/POTAL/regulations/us/cbp-cross/[첫번째파일]
```

### Step 2: 100건 무작위 선별 + 정보 추출
```bash
# GPT-4o 또는 로컬 스크립트로 ruling에서 추출:
# - item_name (상품명)
# - description (상세 설명)
# - hts_code (정답 10자리 HTS 코드)
# JSON 형태로 저장: benchmark_test_data.json
```

### Step 3: POTAL API 테스트 실행
```bash
python cbp_benchmark_test.py
```

### Step 4: 결과 분석 + 엑셀 생성
```bash
# 결과: analysis/POTAL_CBP_Benchmark_Results.xlsx
# 비교표: POTAL vs Tarifflo(89%) vs Avalara(80%) vs Zonos(44%)
```

---

## 결과 활용

### 마케팅 포스트 수정
- ❌ "The most accurate landed cost API on the planet"
- ✅ "CBP benchmark 103-item test: POTAL scored XX%, compared to Tarifflo 89%, Avalara 80%, Zonos 44%"

### 신뢰도 시그널
- 논문 인용: arXiv:2412.14179 (같은 방법론 사용)
- CBP 공식 판정 기준 (정부 데이터)
- 숫자로 증명 (주장이 아닌 데이터)

### 벤치마크 결과 공개
- 테스트 데이터셋 공개 (GitHub repo)
- 재현 가능한 방법론 공개
- 이것 자체가 콘텐츠가 됨 (DEV.to, HN에서 관심 끌 소재)

---

## 주의사항
- 터미널3 (\copy) 완료 후 실행할 것 (DB 부하 방지)
- 테스트는 프로덕션 API가 아닌 로컬에서 먼저 돌릴 것
- 결과가 낮게 나와도 공개할 것 (솔직함 = 신뢰)
- 낮은 영역 분석 → 개선 → 재테스트 → 개선 과정 자체를 공유

---

## 관련 논문/벤치마크
- arXiv:2412.14179 — "Benchmarking Harmonized Tariff Schedule Classification Models" (2024.12)
- arXiv:2509.18400 — "ATLAS: Benchmarking and Adapting LLMs for Global Trade via HTC Classification" (최신)
- Descartes CustomsInfo HS Validator — 상업용 HS 코드 검증 도구
- Gartner Global Trade Management Reviews — 업계 리뷰 플랫폼
