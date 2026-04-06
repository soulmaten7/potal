# W15 주간 토픽 플랜 (2026-04-06 ~ 04-11)
> 생성일: 2026-04-05 (sunday-content-prep 자동 생성)
> 업데이트: 2026-04-06 16:45 KST — CW22-S3 Dashboard 업데이트 반영 (10-field HS, CountrySelect 240국, Tools Hub 34개)

## 카테고리 로테이션
7가지 카테고리에서 골고루 배분. 지난 2주(W13~W14) 미사용 카테고리 우선.

| 요일 | 날짜 | 카테고리 | 토픽 | 핵심 앵글 |
|------|------|---------|------|----------|
| 월 | 04-06 | 데이터/인사이트 | US De Minimis 종료 후 7개월 — 실제로 뭐가 달라졌나 | 2025년 8월 $800 면세 폐지 후 셀러 비용 변화를 POTAL 데이터로 분석. "Every $30 package now costs $2+ more in CBP fees alone." |
| 화 | 04-07 | 경쟁 비교 | Zonos가 CoreWeave 클라우드 선택 — 그래서 가격은? | Zonos가 AI 인프라에 CoreWeave 투자. 인프라 비용 올리면 고객에게 전가. POTAL은 595 규칙 기반 = AI 비용 $0. |
| 수 | 04-08 | 사용 사례 | 중국산 블루투스 이어버드 → 미국: Section 301이 25% 추가하는 순간 | POTAL MCP 실데이터: $59.99 이어버드가 $88.75로. Section 301 +25%가 정확히 어디에 붙는지 분해. |
| 목 | 04-09 | 개발자용 | POTAL MCP로 Claude에게 관세 계산 시키기 — 3줄 코드 | potal-mcp-server npm 설치 → classify_product + calculate_landed_cost 호출. AI 에이전트가 실시간 관세 데이터 접근. |
| 금 | 04-10 | 빌딩 저니 | 보안 감사에서 RLS 90개 테이블 하루 만에 고친 이야기 | LinkedIn에서 Rahul(Hydra CEO)이 보안 제보 → 90개 테이블 RLS 전부 활성화 + 소스코드 취약점 5개 수정. 1인 창업자의 위기 대응. |
| 토 | 04-11 | 기능 딥다이브 | EU €150 면세 폐지 D-87 — POTAL의 EU 관세 계산은 이미 준비됨 | 2026년 7월 1일 EU 면세 폐지까지 87일. €3 flat-rate duty 시스템 설명 + POTAL이 이미 240개국 지원하는 이유. |

## 각 토픽 상세

### 월: US De Minimis 종료 후 7개월
- **핵심 숫자**: $800 면세 → 폐지 (2025-08-29), CBP MPF $2/건, ad valorem duty 2026-02-28부터 의무
- **POTAL 연결**: calculate_landed_cost가 MPF, Section 301, IEEPA 관세 전부 자동 반영
- **비주얼**: Before/After 비용 비교 인포그래픽

### 화: Zonos CoreWeave 투자
- **핵심 숫자**: Zonos $4,000+/월, POTAL $0. Zonos AI 인프라 투자 → 비용 상승 압력
- **POTAL 연결**: 595 GRI 규칙 기반 = 클라우드 AI 비용 0. 인프라 비용이 고객 가격에 영향 없음
- **비주얼**: 가격 비교 바 차트 (Zonos $4K vs POTAL $0)

### 수: 중국산 이어버드 Section 301
- **핵심 숫자**: $59.99 → $88.75 (Total Landed Cost), Section 301 +25%, Base duty 0%
- **POTAL 연결**: POTAL MCP classify_product + calculate_landed_cost 실제 API 결과. Dashboard에서 10-field 입력으로 더 정확한 분류 가능 (CW22-S3 업데이트)
- **비주얼**: 비용 분해 워터폴 차트 + Dashboard 10-field 입력 스크린샷 (⚠️ 10_dashboard.png 재촬영 후 사용)

### 목: POTAL MCP 3줄 코드
- **핵심 숫자**: npm potal-mcp-server@1.3.1, 10개 함수, ChatGPT+Claude+Gemini 3개 플랫폼. 사이트 총 503페이지, Tools Hub 34개 도구 (CW22-S3 신규)
- **POTAL 연결**: 코드 스니펫 + API 응답 예시. Tools Hub에서 34개 도구를 웹 UI로 직접 체험 가능하다는 점 언급 가능
- **비주얼**: 터미널 스크린샷 (코드 + 결과) + Tools Hub 페이지 스크린샷 (⚠️ 신규 에셋 촬영 필요)

### 금: RLS 90개 테이블 보안 감사
- **핵심 숫자**: 67개 OFF → 90개 ON, 취약점 5개 수정, 하루 만에 완료
- **POTAL 연결**: 1인 창업자 + Claude AI로 엔터프라이즈급 보안 달성
- **비주얼**: Before(67 OFF)/After(90 ON) 대비 그래픽

### 토: EU €150 면세 폐지 카운트다운
- **핵심 숫자**: 2026-07-01 시행, €3 flat-rate duty, 240개국 지원. Dashboard에서 240국 CountrySelect 드롭다운으로 EU 국가 즉시 선택 가능 (CW22-S3 신규)
- **POTAL 연결**: EU 관세 계산 이미 지원. Dashboard Tariff Calculator에서 EU 국가 드롭다운 선택 → 즉시 관세 계산 시연 가능
- **비주얼**: 카운트다운 타이머 + EU 지도 + Dashboard CountrySelect 드롭다운 스크린샷 (⚠️ 재촬영 필요)
