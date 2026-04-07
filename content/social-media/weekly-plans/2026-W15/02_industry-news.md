# W15 업계 뉴스 & 규제 변화
> 생성일: 2026-04-05 (sunday-content-prep 자동 생성)
> 데이터 소스: 웹 검색 + POTAL MCP + session-context.md

---

## 1. US De Minimis 완전 폐지 — Ad Valorem 의무화 (2026-02-28~)

**요약**: 2025년 8월 29일 $800 면세 폐지 이후, 2026년 2월 28일부터 ad valorem duty 방식만 허용. 고정 금액($80~$200) 선택지 사라짐.

**상세**:
- 2025-08-29: 모든 국가 대상 duty-free de minimis 정지 (Executive Order 14324)
- 2026-02-24: 수정 행정명령 발효
- 2026-02-28: ad valorem duty만 허용 (고정 요율 $80/$160/$200 방식 폐지)
- IEEPA 세율 기준: <16% → $80, 16~25% → $160, >25% → $200 (과도기 종료)

**POTAL 앵글**: POTAL calculate_landed_cost는 CBP MPF + Section 301 + IEEPA 관세를 전부 자동 반영. 셀러가 직접 계산할 필요 없음.

**콘텐츠 활용**: 월요일 토픽 (데이터/인사이트)

---

## 2. EU €150 면세 폐지 — €3 Flat-Rate Duty (2026-07-01 시행)

**요약**: EU가 2026년 7월 1일부터 €150 이하 소포에도 관세 부과. 과도기 €3 flat-rate 적용.

**상세**:
- 시행일: 2026-07-01
- 과도기: €3 flat-rate duty (관세 heading별 부과)
- 본격 시행: EU Customs Data Hub 가동 시 (2028년 예상) 일반 관세율 적용
- 영향: Shein, Temu 등 저가 직배송 모델에 직격탄

**POTAL 앵글**: POTAL은 이미 240개국 관세 계산 지원. EU €3 flat-rate도 반영 준비 완료. D-87.

**콘텐츠 활용**: 토요일 토픽 (기능 딥다이브)

---

## 3. Zonos, CoreWeave 클라우드 플랫폼 선택

**요약**: Zonos가 AI 기반 관세/세금/체크아웃 시스템 구동을 위해 CoreWeave 클라우드 인프라 선택.

**상세**:
- Zonos 고객: Cotopaxi, LIV Golf, USPS, Canada Post
- CoreWeave: AI/ML 특화 GPU 클라우드 (NVIDIA 기반)
- 의미: Zonos가 AI 인프라에 대규모 투자 → 인프라 비용이 고객 가격에 전가될 가능성

**POTAL 앵글**: POTAL은 595 GRI 규칙 기반 분류 = AI 호출 $0. 클라우드 GPU 비용 자체가 발생하지 않음. Zonos $4,000+/월 vs POTAL $0.

**콘텐츠 활용**: 화요일 토픽 (경쟁 비교)

---

## 4. Avalara "Cross-Border Chaos" 리포트 — 83%가 "더 복잡해졌다"

**요약**: Avalara 2026 Cross-Border Chaos Report에서 비즈니스 리더 83%가 크로스보더 운영이 1년 전보다 복잡해졌다고 응답.

**상세**:
- 83% 비즈니스 리더: 크로스보더 운영 복잡성 증가
- 39% 기업: 규제 불확실성으로 신규 시장 진입 지연
- 87% 기업: AI를 크로스보더 운영에 활용 중
- 3M 신규 관세율: 2025년 한 해 동안 전 세계 약 300만 개 새 관세율 추가

**POTAL 앵글**: 복잡성 증가 = POTAL 같은 자동화 도구의 가치 상승. 140개 기능 무료로 이 복잡성 해결.

**콘텐츠 활용**: 전 주간 배경 데이터로 활용

---

## 5. US 관세 구조 현황 (2026 Q2 기준)

**요약**: 미국의 주요 교역국별 관세율 현황. Section 301, IEEPA, 반덤핑 등 중첩 구조.

**주요 국가별 관세율**:
- 중국: 145% 총합 (fentanyl 20% + reciprocal 125% + Section 301 품목별)
- EU: 10~20% (품목별 상이)
- 베트남: 46% (협상 중 10% 일시 적용)
- 인도: 26% reciprocal + 반덤핑 추가

**POTAL 앵글**: calculate_landed_cost가 이 모든 중첩 관세를 자동 계산. 셀러가 Section 301 + IEEPA + MFN을 일일이 더할 필요 없음.

**콘텐츠 활용**: 수요일 토픽 (사용 사례) 배경 데이터
