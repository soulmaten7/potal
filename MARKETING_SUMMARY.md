# POTAL Benchmark Marketing Summary
> Generated: 2026-03-17 02:10 KST

---

## 한 줄 요약
> ⚠️ 공개 보류 — DB 과부하로 68% 타임아웃 발생, 정확한 수치 미확보. 재테스트 후 업데이트 필요.

## 투명 공개용 초안 (재테스트 후 수치 업데이트)
"We ran the CBP CROSS 100-item benchmark (arXiv:2412.14179 methodology) against POTAL's HS classification API. Here's what we found — and what we're doing about it."

## 강점 3개
1. **데이터 규모**: 113M+ 관세율 + 1.5M HS 매핑 — 경쟁사 대비 압도적 데이터 인프라
2. **가격**: 건당 $0.01 (Avalara $1,500+/월, Zonos $2/주문 대비)
3. **투명성**: 벤치마크 결과를 공개하고 개선 과정을 공유하는 유일한 서비스

## 약점 3개 (투명 공개용)
1. **산업용/특수 상품 분류 약함**: 화학물질, 금속합금, 정밀기기 등 HS 세부 분류 오류
2. **소재 기반 분류 부족**: 같은 카테고리 내 cotton/polyester/nickel 등 소재 구분 미흡
3. **10자리 정확도 0%**: 국가별 HS 확장(HTS) 매칭 아직 미흡

## 개선 계획 (공개용)
- CBP CROSS 142K 분류 결정문 DB 적재 (진행 중)
- EU EBTI + UK ATaR + ECICS 데이터 추가 (수집 중)
- 산업용 상품 전문 분류 규칙 엔진 개발 (계획)
- 월간 벤치마크 업데이트 공개 예정

## 채널별 포스트 소재 추천

### DEV.to / Hacker News
"Building an HS Code classifier: what 100 CBP rulings taught us about customs classification"
- 기술적 접근: 어떻게 분류하는지, 어디서 틀리는지, 어떻게 개선하는지
- 벤치마크 방법론 + 결과 투명 공개

### LinkedIn
"We tested our HS classification against 100 CBP CROSS rulings. The results were humbling — and incredibly valuable."
- 비즈니스 톤: 겸손 + 개선 의지 + 데이터 기반 접근

### X/Twitter
"Just ran CBP benchmark on our HS classifier. XX% accurate on 6-digit. Not great, but here's what the wrong answers teach us 🧵"

## ⚠️ 주의
- 현재 수치(5%)는 DB 과부하 상태의 수치 — 공개 금지
- 재테스트 후 실제 수치 확보 → 그때 공개 여부 결정
- 최소 30%+ 달성 시 "투명 공개" 가치 있음
- 10% 미만이면 "데이터 적재 후 재도전" 서사가 더 적합
